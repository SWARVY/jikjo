'use client'

import type { SelectionFormatState, SelectionRect } from '@jikjo/core'
import {
  Bold,
  Code,
  Italic,
  Strikethrough,
  Underline,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { tv } from 'tailwind-variants'

// ─── Styles ───────────────────────────────────────────────────────────────────

const formatBtn = tv({
  base: [
    'flex items-center justify-center',
    'w-7 h-7 rounded',
    'text-zinc-400 transition-colors duration-100',
    'hover:bg-white/10 hover:text-white',
  ],
  variants: {
    active: {
      true: 'bg-white/15 text-white',
    },
  },
})

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BubbleMenuProps {
  isVisible: boolean
  rect: SelectionRect | null
  format: SelectionFormatState
  onToggleFormat: (format: keyof SelectionFormatState) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BubbleMenu({
  isVisible,
  rect,
  format,
  onToggleFormat,
}: BubbleMenuProps) {
  const positionStyle =
    rect !== null
      ? {
          position: 'fixed' as const,
          top: rect.top - window.scrollY - 44,
          left: rect.left + rect.width / 2,
          transform: 'translateX(-50%)',
          zIndex: 50,
        }
      : {
          position: 'fixed' as const,
          top: -9999,
          left: -9999,
        }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          style={positionStyle}
          initial={{ opacity: 0, scale: 0.92, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 6 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          className="
            flex items-center gap-0.5 px-1.5 py-1
            bg-zinc-800 border border-zinc-700/80
            rounded-lg shadow-xl shadow-black/40
          "
        >
          <button
            type="button"
            onClick={() => onToggleFormat('bold')}
            aria-label="Bold"
            className={formatBtn({ active: format.bold })}
          >
            <Bold size={13} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => onToggleFormat('italic')}
            aria-label="Italic"
            className={formatBtn({ active: format.italic })}
          >
            <Italic size={13} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => onToggleFormat('underline')}
            aria-label="Underline"
            className={formatBtn({ active: format.underline })}
          >
            <Underline size={13} strokeWidth={2.5} />
          </button>

          <div className="w-px h-4 bg-zinc-600/80 mx-0.5" />

          <button
            type="button"
            onClick={() => onToggleFormat('strikethrough')}
            aria-label="Strikethrough"
            className={formatBtn({ active: format.strikethrough })}
          >
            <Strikethrough size={13} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => onToggleFormat('code')}
            aria-label="Code"
            className={formatBtn({ active: format.code })}
          >
            <Code size={13} strokeWidth={2.5} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
