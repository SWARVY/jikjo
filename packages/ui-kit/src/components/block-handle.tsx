"use client";

import type { BlockRect } from "@jikjo/core";
import { GripVertical } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { tv } from "tailwind-variants";

// ─── Styles ───────────────────────────────────────────────────────────────────

const handleBtn = tv({
  base: [
    "flex items-center justify-center",
    "w-5 h-5 rounded",
    "text-zinc-500 transition-colors duration-100",
    "hover:bg-zinc-700/80 hover:text-zinc-300",
    "cursor-grab active:cursor-grabbing",
  ],
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlockHandleProps {
  isVisible: boolean;
  rect: BlockRect | null;
  /** Offset from the block's left edge (px). Defaults to -28. */
  offsetX?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BlockHandle({
  isVisible,
  rect,
  offsetX = -24,
}: BlockHandleProps) {
  const HANDLE_HEIGHT = 20;

  const handleStyle =
    rect !== null
      ? {
          position: "fixed" as const,
          top: rect.top - window.scrollY + (rect.height - HANDLE_HEIGHT) / 2,
          left: rect.left - window.scrollX + offsetX,
          zIndex: 40,
        }
      : { position: "fixed" as const, top: -9999, left: -9999 };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          style={handleStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <button
            type="button"
            aria-label="Drag to reorder"
            className={handleBtn()}
          >
            <GripVertical size={13} strokeWidth={2} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
