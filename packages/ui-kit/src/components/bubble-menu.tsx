"use client";

import type { SelectionFormatState } from "@jikjo/core";
import type { LexicalEditor } from "lexical";
import { Bold, Code, Italic, Strikethrough, Underline } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BubbleMenuProps {
  isVisible: boolean;
  format: SelectionFormatState;
  onToggleFormat: (format: keyof SelectionFormatState) => void;
  editor: LexicalEditor;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface AbsolutePos {
  top: number;
  left: number;
}

/**
 * selection rect를 컨테이너 기준 absolute 좌표로 변환.
 * 컨테이너가 스크롤되어도 absolute 요소는 함께 움직인다.
 */
function getSelectionAbsPos(container: HTMLElement): AbsolutePos | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (range.collapsed) return null;

  const selRect = range.getBoundingClientRect();
  if (selRect.width === 0) return null;

  const cr = container.getBoundingClientRect();
  const MENU_HEIGHT = 36;
  const GAP = 6;

  return {
    top: selRect.top - cr.top + container.scrollTop - MENU_HEIGHT - GAP,
    left: selRect.left - cr.left + container.scrollLeft + selRect.width / 2,
  };
}

// ─── Button ───────────────────────────────────────────────────────────────────

function Btn({
  active,
  label,
  onMouseDown,
  children,
}: {
  active: boolean;
  label: string;
  onMouseDown: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onMouseDown={onMouseDown}
      className={[
        "flex items-center justify-center w-8 h-8 rounded-md",
        "transition-colors duration-75",
        active
          ? "bg-white/15 text-white"
          : "text-zinc-400 hover:bg-white/10 hover:text-zinc-200",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BubbleMenu({
  isVisible,
  format,
  onToggleFormat,
  editor,
}: BubbleMenuProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [pos, setPos] = useState<AbsolutePos | null>(null);

  // editor.getRootElement()가 준비된 후 container를 설정
  useEffect(() => {
    function attachContainer() {
      const rootEl = editor.getRootElement();
      if (!rootEl) return;
      const parent = rootEl.parentElement;
      if (parent) setContainer(parent);
    }
    attachContainer();
    return editor.registerRootListener(attachContainer);
  }, [editor]);

  // selection 변화 또는 isVisible 변화 시 좌표 재계산.
  // isVisible=false 될 때만 pos를 null로 초기화 (format 적용 중에는 이전 pos 유지).
  useEffect(() => {
    if (!isVisible || !container) {
      setPos(null);
      return;
    }
    const newPos = getSelectionAbsPos(container);
    // newPos가 null이면 이전 pos 유지 (format 적용 직후 DOM rect가 잠시 없을 때 대비)
    if (newPos !== null) {
      setPos(newPos);
    }
  }, [isVisible, container]);

  if (!container) return null;

  const menuStyle = pos
    ? { position: "absolute" as const, top: pos.top, left: pos.left, x: "-50%", zIndex: 50 }
    : { position: "absolute" as const, top: -9999, left: -9999, zIndex: 50 };

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          style={menuStyle}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
          className="flex items-center gap-0.5 px-1.5 py-1.5 rounded-lg bg-zinc-800 shadow-xl shadow-black/50"
        >
          <Btn
            active={format.bold}
            label="Bold"
            onMouseDown={(e) => {
              e.preventDefault();
              onToggleFormat("bold");
            }}
          >
            <Bold size={13} strokeWidth={2.5} />
          </Btn>
          <Btn
            active={format.italic}
            label="Italic"
            onMouseDown={(e) => {
              e.preventDefault();
              onToggleFormat("italic");
            }}
          >
            <Italic size={13} strokeWidth={2} />
          </Btn>
          <Btn
            active={format.underline}
            label="Underline"
            onMouseDown={(e) => {
              e.preventDefault();
              onToggleFormat("underline");
            }}
          >
            <Underline size={13} strokeWidth={2} />
          </Btn>

          <div className="w-px h-4 bg-zinc-600/50 mx-0.5 shrink-0" />

          <Btn
            active={format.strikethrough}
            label="Strikethrough"
            onMouseDown={(e) => {
              e.preventDefault();
              onToggleFormat("strikethrough");
            }}
          >
            <Strikethrough size={13} strokeWidth={2} />
          </Btn>
          <Btn
            active={format.code}
            label="Code"
            onMouseDown={(e) => {
              e.preventDefault();
              onToggleFormat("code");
            }}
          >
            <Code size={13} strokeWidth={2} />
          </Btn>
        </motion.div>
      )}
    </AnimatePresence>,
    container,
  );
}
