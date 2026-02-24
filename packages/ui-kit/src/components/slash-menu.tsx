"use client";

import type { LexicalEditor } from "lexical";
import type { SlashCommandRect, SlashMenuItem } from "@jikjo/core";
import { Heading1, Heading2, Heading3, Quote, Text } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SlashMenuProps {
  isVisible: boolean;
  rect: SlashCommandRect | null;
  query: string;
  items: SlashMenuItem[];
  editor: LexicalEditor;
  onClose: () => void;
}

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, ReactNode> = {
  paragraph: <Text size={15} strokeWidth={1.75} />,
  heading1: <Heading1 size={15} strokeWidth={1.75} />,
  heading2: <Heading2 size={15} strokeWidth={1.75} />,
  heading3: <Heading3 size={15} strokeWidth={1.75} />,
  quote: <Quote size={15} strokeWidth={1.75} />,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SlashMenu({
  isVisible,
  rect,
  query,
  items,
  editor,
  onClose,
}: SlashMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );

  useEffect(() => {
    const rootEl = editor.getRootElement();
    if (!rootEl) return;
    const container = rootEl.parentElement;
    if (container) setPortalContainer(container);
  }, [editor]);

  const filtered = items.filter(
    (item) =>
      !query ||
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()),
  );

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
        item.onSelect(editor);
        onClose();
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

  let menuTop = -9999;
  let menuLeft = -9999;
  if (rect && portalContainer) {
    const cr = portalContainer.getBoundingClientRect();
    menuTop = rect.top - cr.top + 6;
    menuLeft = rect.left - cr.left;
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
            zIndex: 50,
          }}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
          className="w-52 rounded-xl bg-zinc-900 shadow-xl shadow-black/40 py-1.5 overflow-hidden"
        >
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-zinc-500">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <div ref={containerRef} className="max-h-64 overflow-y-auto">
              {filtered.map((item, index) => {
                const icon = ICON_MAP[item.id] ?? item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-active={index === activeIndex}
                    onClick={() => {
                      item.onSelect(editor);
                      onClose();
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left data-[active=true]:bg-zinc-800"
                  >
                    <span className="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300">
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
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    portalContainer,
  );
}
