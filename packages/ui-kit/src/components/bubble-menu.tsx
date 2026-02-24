"use client";

import type { LexicalEditor } from "lexical";
import type { SelectionFormatState, SelectionRect } from "@jikjo/core";
import { Bold, Code, Italic, Strikethrough, Underline } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BubbleMenuProps {
  isVisible: boolean;
  rect: SelectionRect | null;
  format: SelectionFormatState;
  onToggleFormat: (format: keyof SelectionFormatState) => void;
  editor: LexicalEditor;
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
  rect,
  format,
  onToggleFormat,
  editor,
}: BubbleMenuProps) {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );

  useEffect(() => {
    const rootEl = editor.getRootElement();
    if (!rootEl) return;
    const container = rootEl.parentElement;
    if (container) setPortalContainer(container);
  }, [editor]);

  // viewport 좌표 → container 기준 absolute 좌표
  // 메뉴는 선택 영역 상단 중앙에 위치
  // translateX(-50%)는 Framer Motion style과 충돌하므로 left 계산에 직접 반영
  let menuTop = -9999;
  let menuLeft = -9999;
  if (rect && portalContainer) {
    const cr = portalContainer.getBoundingClientRect();
    const MENU_HEIGHT = 36;
    const GAP = 6;
    menuTop = rect.top - cr.top - MENU_HEIGHT - GAP;
    // center of selection, offset will be applied via CSS margin-left trick
    menuLeft = rect.left - cr.left + rect.width / 2;
  }

  if (!portalContainer) return null;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          style={{
            position: "absolute",
            top: menuTop,
            left: menuLeft,
            x: "-50%",
            zIndex: 50,
          }}
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
    portalContainer,
  );
}
