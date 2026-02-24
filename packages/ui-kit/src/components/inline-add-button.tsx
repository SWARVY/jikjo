"use client";

import type { SlashMenuItem } from "@jikjo/core";
import type { InlineAddState } from "@jikjo/core";
import type { LexicalEditor } from "lexical";
import {
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
  nodeKey: InlineAddState["nodeKey"];
  items: SlashMenuItem[];
  editor: LexicalEditor;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BUTTON_SIZE = 20;
const BUTTON_GAP = 6;
const CONTENT_PADDING_LEFT = 32; // .jikjo-content-editable padding-left: 2rem

// ─── Icon map (tiptap style) ─────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ReactNode> = {
  paragraph: <Text size={15} />,
  heading1: <Heading1 size={15} />,
  heading2: <Heading2 size={15} />,
  heading3: <Heading3 size={15} />,
  bulletList: <List size={15} />,
  orderedList: <ListOrdered size={15} />,
  taskList: <ListTodo size={15} />,
  quote: <Quote size={15} />,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function InlineAddButton({
  isVisible,
  nodeKey,
  items,
  editor,
}: InlineAddButtonProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [buttonTop, setButtonTop] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );

  // .jikjo-editor-content를 portal 컨테이너로 사용
  useEffect(() => {
    const rootEl = editor.getRootElement();
    if (!rootEl) return;
    const container = rootEl.parentElement;
    if (container) setPortalContainer(container);
  }, [editor]);

  // Lexical이 DOM을 업데이트할 때마다 버튼 top을 재계산.
  // React state(nodeKey) 변경 → re-render → useLayoutEffect 순서보다
  // registerUpdateListener가 DOM 확정 직후에 발생하므로 타이밍이 더 정확.
  useEffect(() => {
    function calc() {
      if (!isVisible || !nodeKey) {
        setButtonTop(null);
        return;
      }
      const domEl = editor.getElementByKey(nodeKey);
      if (!domEl) {
        setButtonTop(null);
        return;
      }
      const rootEl = editor.getRootElement();
      if (!rootEl) {
        setButtonTop(null);
        return;
      }
      const rootOffset = rootEl.offsetTop;
      setButtonTop(
        rootOffset + domEl.offsetTop + (domEl.offsetHeight - BUTTON_SIZE) / 2,
      );
    }

    // 즉시 한 번 실행 (키보드 이동 등 초기 반영)
    calc();

    // 이후 Lexical DOM 업데이트마다 재계산
    return editor.registerUpdateListener(() => {
      calc();
    });
  }, [isVisible, nodeKey, editor]);

  useEffect(() => {
    if (!panelOpen) setActiveIndex(0);
  }, [panelOpen]);

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
    if (!isVisible) setPanelOpen(false);
  }, [isVisible]);

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
          item.onSelect(editor);
          setPanelOpen(false);
        }
      } else if (e.key === "Escape") {
        setPanelOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [panelOpen, items, activeIndex, editor]);

  const buttonLeft = CONTENT_PADDING_LEFT - BUTTON_SIZE - BUTTON_GAP;

  // 패널 top: 버튼 바로 아래 (버튼 top + BUTTON_SIZE + gap)
  const panelTop = buttonTop !== null ? buttonTop + BUTTON_SIZE + 4 : 0;
  // 패널 left: 버튼과 같은 left
  const panelLeft = buttonLeft;

  if (!portalContainer) return null;

  return createPortal(
    <>
      {/* + 버튼 */}
      <AnimatePresence>
        {isVisible && buttonTop !== null && (
          <motion.button
            type="button"
            style={{
              position: "absolute",
              top: buttonTop,
              left: buttonLeft,
              width: BUTTON_SIZE,
              height: BUTTON_SIZE,
              zIndex: 45,
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              setPanelOpen((prev) => !prev);
            }}
            aria-label="Add block"
            aria-expanded={panelOpen}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.08, ease: "easeOut" }}
            className={[
              "flex items-center justify-center rounded",
              "transition-colors duration-100",
              panelOpen
                ? "bg-zinc-800 text-zinc-300"
                : "text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300",
            ].join(" ")}
          >
            <Plus size={12} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 패널: 버튼과 같은 Portal 컨테이너 안에서 absolute — 스크롤 추적 */}
      <AnimatePresence>
        {isVisible && panelOpen && buttonTop !== null && (
          <motion.div
            ref={panelRef}
            style={{
              position: "absolute",
              top: panelTop,
              left: panelLeft,
              zIndex: 50,
            }}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className="w-52 rounded-xl bg-zinc-900 shadow-xl shadow-black/40 py-1.5"
          >
            {items.map((item, index) => {
              const icon = ICON_MAP[item.id] ?? item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-active={index === activeIndex}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    item.onSelect(editor);
                    setPanelOpen(false);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left data-[active=true]:bg-zinc-800"
                >
                  <span className="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 data-[active=true]:bg-zinc-700">
                    {icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-zinc-100 leading-snug">
                      {item.label}
                    </span>
                    <span className="block text-[11px] text-zinc-500 truncate leading-snug">
                      {item.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    portalContainer,
  );
}
