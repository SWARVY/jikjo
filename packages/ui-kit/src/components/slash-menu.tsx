"use client";

import type { LexicalEditor } from "lexical";
import type { SlashMenuItem } from "@jikjo/core";
import { Heading1, Heading2, Heading3, Quote, Text } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../styles/variables.css";
import "../styles/menu-panel.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SlashMenuProps {
  isVisible: boolean;
  query: string;
  items: SlashMenuItem[];
  editor: LexicalEditor;
  onClose: () => void;
}

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, ReactNode> = {
  paragraph: <Text size={14} strokeWidth={1.75} />,
  heading1: <Heading1 size={14} strokeWidth={1.75} />,
  heading2: <Heading2 size={14} strokeWidth={1.75} />,
  heading3: <Heading3 size={14} strokeWidth={1.75} />,
  quote: <Quote size={14} strokeWidth={1.75} />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface AbsolutePos {
  top: number;
  left: number;
}

/**
 * 캐럿(collapsed range)의 bottom 위치를 컨테이너 기준 absolute 좌표로 변환.
 */
function getCaretAbsPos(container: HTMLElement): AbsolutePos | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0).cloneRange();
  range.collapse(true);
  const caretRect = range.getBoundingClientRect();

  // getBoundingClientRect()가 (0,0,0,0)을 반환하는 경우 방어
  if (caretRect.width === 0 && caretRect.height === 0 && caretRect.top === 0) return null;

  const cr = container.getBoundingClientRect();
  const GAP = 6;

  return {
    top: caretRect.bottom - cr.top + container.scrollTop + GAP,
    left: caretRect.left - cr.left + container.scrollLeft,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SlashMenu({
  isVisible,
  query,
  items,
  editor,
  onClose,
}: SlashMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [pos, setPos] = useState<AbsolutePos | null>(null);

  // editor.getRootElement()가 준비된 후 portalContainer를 설정
  useEffect(() => {
    function attachContainer() {
      const rootEl = editor.getRootElement();
      if (!rootEl) return;
      const parent = rootEl.parentElement;
      if (parent) setPortalContainer(parent);
    }
    attachContainer();
    return editor.registerRootListener(attachContainer);
  }, [editor]);

  const filtered = items.filter(
    (item) =>
      !query ||
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()),
  );

  // isVisible 또는 query 변경 시 좌표 재계산 (캐럿이 이동/입력될 때마다)
  useEffect(() => {
    if (!isVisible || !portalContainer) {
      setPos(null);
      return;
    }
    // registerUpdateListener가 발동된 직후 호출되므로 DOM이 확정된 시점
    setPos(getCaretAbsPos(portalContainer));
  }, [isVisible, query, portalContainer]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isVisible) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (event.key === "Enter") {
        event.preventDefault();
        const item = filtered[activeIndex];
        if (!item) return;
        editor.focus(() => {
          item.onSelect(editor);
          onClose();
        });
      } else if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, filtered, activeIndex, editor, onClose]);

  useEffect(() => {
    const el = containerRef.current?.querySelector<HTMLElement>(
      '[data-active="true"]',
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!portalContainer) return null;

  const menuStyle = pos
    ? { position: "absolute" as const, top: pos.top, left: pos.left, zIndex: 50, width: 240 }
    : { position: "absolute" as const, top: -9999, left: -9999, zIndex: 50, width: 240 };

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          style={menuStyle}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
          role="dialog"
          aria-label="Insert block"
          className="jikjo-menu-panel"
        >
          {filtered.length === 0 ? (
            <p className="jikjo-menu-panel__empty">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <div
              ref={containerRef}
              role="listbox"
              aria-label="Block type"
              className="jikjo-menu-panel__list jikjo-menu-panel__list--scrollable"
            >
              {filtered.map((item, index) => {
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
                        onClose();
                      });
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`jikjo-menu-panel__item${isActive ? " jikjo-menu-panel__item--active" : ""}`}
                  >
                    <span className="jikjo-menu-panel__item-icon">
                      {icon}
                    </span>
                    <span className="jikjo-menu-panel__item-label">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    portalContainer,
  );
}
