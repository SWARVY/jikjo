"use client";

import type { SlashMenuItem } from "@jikjo/core";
import type { LexicalEditor } from "lexical";
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
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InlineAddButtonProps {
  isVisible: boolean;
  nodeKey: string | null;
  items: SlashMenuItem[];
  editor: LexicalEditor;
  showDragHandle?: boolean;
  showAddButton?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BUTTON_SIZE = 20;
const BUTTON_GAP = 8;

// ─── Icon map ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ReactNode> = {
  paragraph: <Text size={14} strokeWidth={1.75} />,
  heading1: <Heading1 size={14} strokeWidth={1.75} />,
  heading2: <Heading2 size={14} strokeWidth={1.75} />,
  heading3: <Heading3 size={14} strokeWidth={1.75} />,
  bulletList: <List size={14} strokeWidth={1.75} />,
  orderedList: <ListOrdered size={14} strokeWidth={1.75} />,
  taskList: <ListTodo size={14} strokeWidth={1.75} />,
  quote: <Quote size={14} strokeWidth={1.75} />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface FixedPos {
  top: number;
  left: number;
}

/**
 * 블록 엘리먼트의 viewport 기준 fixed 좌표 계산.
 * 버튼 그룹은 블록의 왼쪽에, 수직 중앙 정렬.
 */
function calcFixedPos(
  blockEl: HTMLElement,
  totalWidth: number,
): FixedPos {
  const rect = blockEl.getBoundingClientRect();
  return {
    top: rect.top + (rect.height - BUTTON_SIZE) / 2,
    left: rect.left - totalWidth - BUTTON_GAP,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InlineAddButton({
  isVisible,
  nodeKey,
  items,
  editor,
  showDragHandle = true,
  showAddButton = true,
}: InlineAddButtonProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pos, setPos] = useState<FixedPos | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const totalWidth = (showDragHandle ? BUTTON_SIZE : 0) + (showAddButton ? BUTTON_SIZE : 0) + (showDragHandle && showAddButton ? 2 : 0);

  // nodeKey 변경 또는 DOM 업데이트마다 위치 재계산
  useEffect(() => {
    function calc() {
      if (!isVisible || !nodeKey) {
        setPos(null);
        return;
      }
      const blockEl = editor.getElementByKey(nodeKey);
      if (!blockEl) {
        setPos(null);
        return;
      }
      setPos(calcFixedPos(blockEl, totalWidth));
    }

    calc();
    return editor.registerUpdateListener(() => calc());
  }, [isVisible, nodeKey, editor, totalWidth]);

  useEffect(() => {
    if (!panelOpen) setActiveIndex(0);
  }, [panelOpen]);

  useEffect(() => {
    if (!isVisible) setPanelOpen(false);
  }, [isVisible]);

  useEffect(() => {
    if (!panelOpen) return;
    function handlePointerDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [panelOpen]);

  useEffect(() => {
    if (!panelOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = items[activeIndex];
        if (item) {
          editor.focus(() => {
            item.onSelect(editor);
            setPanelOpen(false);
          });
        }
      } else if (e.key === "Escape") {
        setPanelOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [panelOpen, items, activeIndex, editor]);

  const btnBase = "flex items-center justify-center rounded transition-colors duration-100";

  // 패널은 + 버튼 왼쪽 기준 (drag handle이 있으면 그만큼 오른쪽으로)
  const panelFixedLeft = pos
    ? pos.left + (showDragHandle ? BUTTON_SIZE + 2 : 0)
    : -9999;
  const panelFixedTop = pos ? pos.top + BUTTON_SIZE + 4 : -9999;

  return createPortal(
    <>
      {/* 버튼 그룹: [drag?] [+?] */}
      <AnimatePresence>
        {isVisible && pos !== null && (
          <motion.div
            key={nodeKey ?? "buttons"}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: totalWidth,
              height: BUTTON_SIZE,
              zIndex: 45,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08, ease: "easeOut" }}
          >
            {showDragHandle && (
              <button
                type="button"
                aria-label="Drag to reorder"
                style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
                className={`${btnBase} text-zinc-500 hover:bg-zinc-700/80 hover:text-zinc-300 cursor-grab active:cursor-grabbing`}
              >
                <GripVertical size={13} strokeWidth={2} />
              </button>
            )}
            {showAddButton && (
              <button
                type="button"
                aria-label="Add block"
                aria-expanded={panelOpen}
                style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setPanelOpen((prev) => !prev);
                }}
                className={[
                  btnBase,
                  panelOpen
                    ? "bg-zinc-700/80 text-zinc-300"
                    : "text-zinc-500 hover:bg-zinc-700/80 hover:text-zinc-300",
                ].join(" ")}
              >
                <Plus size={12} strokeWidth={2.5} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 패널 */}
      <AnimatePresence>
        {isVisible && panelOpen && pos !== null && (
          <motion.div
            ref={panelRef}
            style={{
              position: "fixed",
              top: panelFixedTop,
              left: panelFixedLeft,
              zIndex: 50,
              width: 240,
            }}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            role="dialog"
            aria-label="Insert block"
            className="rounded-lg bg-zinc-800 shadow-xl shadow-black/50 py-1.5"
          >
            <div
              role="listbox"
              aria-label="Block type"
              className="w-full px-1.5 flex flex-col"
            >
              {items.map((item, index) => {
                const icon = ICON_MAP[item.id] ?? item.icon;
                const isActive = index === activeIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    data-active={isActive}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.focus(() => {
                        item.onSelect(editor);
                        setPanelOpen(false);
                      });
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={[
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors duration-75",
                      "outline-none focus-visible:outline-none",
                      isActive
                        ? "bg-zinc-700/80 text-zinc-100"
                        : "text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-200 focus-visible:bg-zinc-700/80 focus-visible:text-zinc-100",
                    ].join(" ")}
                  >
                    <span className="flex items-center justify-center shrink-0 w-4 text-current">
                      {icon}
                    </span>
                    <span className="text-sm font-normal leading-none">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
}
