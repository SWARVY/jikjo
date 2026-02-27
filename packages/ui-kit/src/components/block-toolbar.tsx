"use client";

import type { SlashMenuItem } from "@jikjo/core";
import type { LexicalEditor } from "lexical";
import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $isElementNode,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DROP_COMMAND,
} from "lexical";
import {
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Plus,
  Quote,
  Text,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../styles/variables.css";
import "../styles/block-toolbar.css";
import "../styles/menu-panel.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlockToolbarProps {
  isVisible: boolean;
  nodeKey: string | null;
  /** 현재 커서(포커스)가 있는 블록의 nodeKey */
  focusedNodeKey: string | null;
  items: SlashMenuItem[];
  editor: LexicalEditor;
  showDragHandle?: boolean;
  showAddButton?: boolean;
  /** drag 시작 시 드래그 중인 블록의 nodeKey를 부모에 전달 */
  onDragStarted?: (nodeKey: string) => void;
  /** drag & drop 완료 후 이동된 블록의 nodeKey를 부모에 전달 */
  onDropped?: (nodeKey: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DRAG_DATA_FORMAT = "application/x-lexical-drag-block";
const BTN = 24;
const GAP = 4;
const GUTTER_LEFT = 6;
// 버튼 그룹 전체 너비 (drag + add 기준): GUTTER_LEFT + 2*BTN + GAP
const TOOLBAR_WIDTH = GUTTER_LEFT + 2 * BTN + GAP; // 58px

// ─── Inline styles ────────────────────────────────────────────────────────────


// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ReactNode> = {
  paragraph: <Text size={13} strokeWidth={1.75} />,
  heading1: <Heading1 size={13} strokeWidth={1.75} />,
  heading2: <Heading2 size={13} strokeWidth={1.75} />,
  heading3: <Heading3 size={13} strokeWidth={1.75} />,
  bulletList: <List size={13} strokeWidth={1.75} />,
  orderedList: <ListOrdered size={13} strokeWidth={1.75} />,
  taskList: <ListTodo size={13} strokeWidth={1.75} />,
  quote: <Quote size={13} strokeWidth={1.75} />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** blockEl의 top을 container 기준 절대 좌표로 계산 (getBoundingClientRect 기반) */
function getOffsetTopToContainer(blockEl: HTMLElement, container: HTMLElement): number {
  const blockRect = blockEl.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  // container의 scrollTop도 반영 (container가 스크롤 가능한 경우)
  return blockRect.top - containerRect.top + container.scrollTop;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BlockToolbar({
  isVisible,
  nodeKey,
  focusedNodeKey,
  items,
  editor,
  showDragHandle = true,
  showAddButton = true,
  onDragStarted,
  onDropped,
}: BlockToolbarProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [top, setTop] = useState<number | null>(null);
  const [dragHovered, setDragHovered] = useState(false);
  const [addHovered, setAddHovered] = useState(false);

  // 드래그 가이드 라인: container 기준 absolute top + 위치 (before/after)
  const [dropLine, setDropLine] = useState<{ top: number; position: "before" | "after" } | null>(null);
  // 커서 인디케이터: focusedNodeKey 블록의 위치
  const [focusedTop, setFocusedTop] = useState<number | null>(null);
  const [focusedHeight, setFocusedHeight] = useState<number>(0);

  const panelRef = useRef<HTMLDivElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const numBtns = (showDragHandle ? 1 : 0) + (showAddButton ? 1 : 0);

  // ── 컨테이너 취득 ──────────────────────────────────────────────────────────

  useEffect(() => {
    return editor.registerRootListener((rootElement) => {
      setContainer(rootElement?.parentElement ?? null);
    });
  }, [editor]);

  // ── 수직 위치 계산 ─────────────────────────────────────────────────────────

  useEffect(() => {
    function calc() {
      if (!isVisible || !nodeKey || !container) { setTop(null); return; }
      const blockEl = editor.getElementByKey(nodeKey);
      if (!blockEl) { setTop(null); return; }
      const offset = getOffsetTopToContainer(blockEl, container);
      setTop(offset + (blockEl.offsetHeight - BTN) / 2);
    }
    calc();
    return editor.registerUpdateListener(() => calc());
  }, [isVisible, nodeKey, editor, container]);

  // ── 커서 인디케이터 위치 계산 ──────────────────────────────────────────────

  useEffect(() => {
    function calc() {
      if (!focusedNodeKey || !container) { setFocusedTop(null); return; }
      const blockEl = editor.getElementByKey(focusedNodeKey);
      if (!blockEl) { setFocusedTop(null); return; }
      setFocusedTop(getOffsetTopToContainer(blockEl, container));
      setFocusedHeight(blockEl.offsetHeight);
    }
    calc();
    const unregister = editor.registerUpdateListener(() => calc());
    return unregister;
  }, [focusedNodeKey, editor, container]);

  // ── 패널 닫기 ──────────────────────────────────────────────────────────────

  useEffect(() => { if (!panelOpen) setActiveIndex(0); }, [panelOpen]);
  useEffect(() => { if (!isVisible) setPanelOpen(false); }, [isVisible]);


  // 스크롤 시 패널 닫기
  useEffect(() => {
    if (!panelOpen) return;
    function onScroll() { setPanelOpen(false); }
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", onScroll, { capture: true });
  }, [panelOpen]);

  useEffect(() => {
    if (!panelOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [panelOpen]);

  useEffect(() => {
    if (!panelOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((p) => Math.min(p + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((p) => Math.max(p - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = items[activeIndex];
        if (item) { editor.focus(() => { item.onSelect(editor); setPanelOpen(false); }); }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setPanelOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [panelOpen, items, activeIndex, editor]);

  // ── Drag & Drop (가이드 라인 포함) ─────────────────────────────────────────

  useEffect(() => {
    if (!showDragHandle || !container) return;

    const unregDragover = editor.registerCommand(
      DRAGOVER_COMMAND,
      (event) => {
        if (!event.dataTransfer?.types.includes(DRAG_DATA_FORMAT)) return false;
        event.preventDefault();

        const draggedKey = event.dataTransfer.getData(DRAG_DATA_FORMAT);
        const target = event.target as HTMLElement | null;
        if (!target) return true;

        // 드래그 중인 element가 draggedNode의 DOM 안에 있으면 가이드라인 숨김
        if (draggedKey) {
          const draggedDOM = editor.getElementByKey(draggedKey);
          if (draggedDOM?.contains(target)) { setDropLine(null); return true; }
        }

        let targetKey: string | null = null;
        editor.read(() => {
          const node = $getNearestNodeFromDOMNode(target);
          if (!node) return;
          // 최상위 블록으로 올라감
          const top = node.isInline() ? node.getTopLevelElement() : node;
          if (top) targetKey = top.getKey();
        });
        if (!targetKey || targetKey === draggedKey) { setDropLine(null); return true; }

        const targetDOM = editor.getElementByKey(targetKey);
        if (!targetDOM) { setDropLine(null); return true; }

        const { top: domTop, height } = targetDOM.getBoundingClientRect();
        const isBefore = event.clientY < domTop + height / 2;
        const offsetTop = getOffsetTopToContainer(targetDOM, container);

        setDropLine({
          top: isBefore ? offsetTop : offsetTop + targetDOM.offsetHeight,
          position: isBefore ? "before" : "after",
        });

        return true;
      },
      COMMAND_PRIORITY_LOW,
    );

    const unregDrop = editor.registerCommand(
      DROP_COMMAND,
      (event) => {
        const draggedKey = event.dataTransfer?.getData(DRAG_DATA_FORMAT);
        if (!draggedKey) return false;
        event.preventDefault();
        setDropLine(null);

        const target = event.target as HTMLElement | null;
        if (!target) return true;

        // 실제로 노드가 이동되었는지 확인하기 위해 현재 에디터 상태에서 사전 검증
        let willMove = false;
        editor.read(() => {
          const draggedNode = $getNodeByKey(draggedKey);
          if (!draggedNode) return;
          const nearestNode = $getNearestNodeFromDOMNode(target);
          if (!nearestNode) return;
          const targetNode = nearestNode.isInline() ? nearestNode.getTopLevelElement() : nearestNode;
          if (!targetNode) return;
          const targetKey = targetNode.getKey();
          if (targetKey === draggedKey) return;
          if ($isElementNode(draggedNode) && draggedNode.getChildren().some(
            (child) => child.getKey() === targetKey,
          )) return;
          willMove = true;
        });

        editor.update(() => {
          const draggedNode = $getNodeByKey(draggedKey);
          if (!draggedNode) return;

          const nearestNode = $getNearestNodeFromDOMNode(target);
          if (!nearestNode) return;

          // 최상위 블록으로 정규화
          const targetNode = nearestNode.isInline()
            ? nearestNode.getTopLevelElement()
            : nearestNode;
          if (!targetNode) return;

          const targetKey = targetNode.getKey();
          // 자기 자신 또는 자기 자손으로 drop 방지
          if (targetKey === draggedKey) return;
          if ($isElementNode(draggedNode) && draggedNode.getChildren().some(
            (child) => child.getKey() === targetKey,
          )) return;

          const targetDOM = editor.getElementByKey(targetKey);
          if (!targetDOM) return;

          const { top: targetTop, height } = targetDOM.getBoundingClientRect();
          if (event.clientY < targetTop + height / 2) {
            targetNode.insertBefore(draggedNode);
          } else {
            targetNode.insertAfter(draggedNode);
          }
        });

        // Lexical의 drop 이벤트 처리(DOM selection 읽기)가 완료된 뒤에 onDropped 호출
        // requestAnimationFrame은 Lexical의 microtask 큐 처리 후에 실행됨
        if (willMove && onDropped) {
          requestAnimationFrame(() => onDropped(draggedKey));
        }
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );

    // 드래그가 에디터 밖으로 나가면 가이드 라인 제거
    function onDragEnd() { setDropLine(null); }
    document.addEventListener("dragend", onDragEnd);

    return () => {
      unregDragover();
      unregDrop();
      document.removeEventListener("dragend", onDragEnd);
    };
  }, [editor, showDragHandle, container, onDropped]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!nodeKey) return;
    e.dataTransfer.setData(DRAG_DATA_FORMAT, nodeKey);
    e.dataTransfer.effectAllowed = "move";
    const blockEl = editor.getElementByKey(nodeKey);
    if (blockEl) e.dataTransfer.setDragImage(blockEl, 0, 0);
    onDragStarted?.(nodeKey);
  }, [nodeKey, editor, onDragStarted]);

  // ── + 버튼 클릭 ────────────────────────────────────────────────────────────

  const handleAddClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setPanelOpen((p) => !p);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!container) return null;


  return (
    <>
      {/* 커서 인디케이터 — 현재 포커스 블록 왼쪽에 세로 라인 */}
      {createPortal(
        <AnimatePresence>
          {focusedTop !== null && (
            <motion.div
              key={focusedNodeKey ?? "cursor-indicator"}
              className="jikjo-block-toolbar__cursor-indicator"
              style={{ top: focusedTop, height: focusedHeight }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            />
          )}
        </AnimatePresence>,
        container!,
      )}

      {/* 버튼 그룹 — container 내부, absolute */}
      {createPortal(
        <AnimatePresence>
          {isVisible && top !== null && (
            <motion.div
              key={nodeKey ?? "toolbar"}
              data-block-toolbar
              style={{
                position: "absolute",
                top,
                left: GUTTER_LEFT,
                display: "flex",
                alignItems: "center",
                gap: GAP,
                width: numBtns * BTN + Math.max(0, numBtns - 1) * GAP,
                zIndex: 2,
                userSelect: "none",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.08, ease: "easeOut" }}
            >
              {showDragHandle && (
                <div
                  draggable
                  data-drag-handle
                  onDragStart={handleDragStart}
                  aria-label="Drag to reorder"
                  className={`jikjo-block-toolbar__btn${dragHovered ? " jikjo-block-toolbar__btn--hovered" : ""}`}
                  style={{ width: BTN, height: BTN, cursor: "grab" }}
                  onMouseEnter={() => setDragHovered(true)}
                  onMouseLeave={() => setDragHovered(false)}
                >
                  <GripVertical size={14} strokeWidth={2} />
                </div>
              )}
              {showAddButton && (
                <button
                  ref={addBtnRef}
                  type="button"
                  aria-label="Add block"
                  aria-expanded={panelOpen}
                  className={`jikjo-block-toolbar__btn${panelOpen || addHovered ? " jikjo-block-toolbar__btn--hovered" : ""}`}
                  style={{ width: BTN, height: BTN }}
                  onMouseDown={handleAddClick}
                  onMouseEnter={() => setAddHovered(true)}
                  onMouseLeave={() => setAddHovered(false)}
                >
                  <Plus size={13} strokeWidth={2.5} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        container,
      )}

      {/* 드래그 가이드 라인 — container 내부, absolute */}
      {createPortal(
        <AnimatePresence>
          {dropLine !== null && (
            <motion.div
              key="drop-line"
              className="jikjo-block-toolbar__drop-line"
              style={{ top: dropLine.top }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.06 }}
            >
              <div className="jikjo-block-toolbar__drop-line-dot" />
              <div className="jikjo-block-toolbar__drop-line-bar" />
            </motion.div>
          )}
        </AnimatePresence>,
        container,
      )}

      {/* 패널 — container 내부, absolute */}
      {createPortal(
        <AnimatePresence>
          {isVisible && panelOpen && top !== null && (
            <motion.div
              ref={panelRef}
              data-block-toolbar
              style={{
                position: "absolute",
                top: top + BTN + GAP,
                left: GUTTER_LEFT,
                zIndex: 50,
                width: 240,
              }}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.1, ease: "easeOut" }}
              role="dialog"
              aria-label="Insert block"
              className="jikjo-menu-panel"
            >
              <div role="listbox" aria-label="Block type" className="jikjo-menu-panel__list">
                {items.map((item, index) => {
                  const icon = ICON_MAP[item.id] ?? item.icon;
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        editor.focus(() => { item.onSelect(editor); setPanelOpen(false); });
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`jikjo-menu-panel__item${isActive ? " jikjo-menu-panel__item--active" : ""}`}
                    >
                      <span className="jikjo-menu-panel__item-icon">{icon}</span>
                      <span className="jikjo-menu-panel__item-label">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        container,
      )}
    </>
  );
}
