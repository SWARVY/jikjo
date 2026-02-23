'use client'

import type { BlockRect, SlashMenuItem } from '@jikjo/core'
import type { LexicalEditor } from 'lexical'
import { Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { tv } from 'tailwind-variants'

// ─── Styles ───────────────────────────────────────────────────────────────────

const triggerBtn = tv({
  base: [
    'flex items-center justify-center',
    'w-5 h-5 rounded-md',
    'text-zinc-500 border border-transparent',
    'transition-all duration-100',
    'hover:bg-zinc-700/60 hover:text-zinc-200 hover:border-zinc-600/60',
  ],
  variants: {
    open: {
      true: 'bg-zinc-700/60 text-zinc-200 border-zinc-600/60',
    },
  },
})

const panelItem = tv({
  base: [
    'w-full flex items-center gap-3 px-2.5 py-2 rounded-lg',
    'text-left transition-colors duration-75 cursor-pointer',
    'hover:bg-zinc-700/50',
  ],
  variants: {
    active: {
      true: 'bg-zinc-700/60',
    },
  },
})

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InlineAddButtonProps {
  isVisible: boolean
  rect: BlockRect | null
  /** 블록 왼쪽 엣지에서 버튼까지의 오프셋(px). 기본 -36. */
  offsetX?: number
  items: SlashMenuItem[]
  editor: LexicalEditor
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InlineAddButton({
  isVisible,
  rect,
  offsetX = -36,
  items,
  editor,
}: InlineAddButtonProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)

  const BUTTON_SIZE = 20

  useEffect(() => {
    if (!panelOpen) setActiveIndex(0)
  }, [panelOpen])

  // Close panel on outside pointer
  useEffect(() => {
    if (!panelOpen) return
    function handlePointerDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false)
      }
    }
    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [panelOpen])

  // Close panel when button disappears
  useEffect(() => {
    if (!isVisible) setPanelOpen(false)
  }, [isVisible])

  // Keyboard navigation
  useEffect(() => {
    if (!panelOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((prev) => Math.min(prev + 1, items.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = items[activeIndex]
        if (item) { item.onSelect(editor); setPanelOpen(false) }
      } else if (e.key === 'Escape') {
        setPanelOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [panelOpen, items, activeIndex, editor])

  const triggerStyle =
    rect !== null
      ? {
          position: 'fixed' as const,
          // 블록 수직 중앙 정렬
          top: rect.top - window.scrollY + (rect.height - BUTTON_SIZE) / 2,
          left: rect.left - window.scrollX + offsetX,
          zIndex: 45,
        }
      : { position: 'fixed' as const, top: -9999, left: -9999 }

  const panelStyle =
    rect !== null
      ? {
          position: 'fixed' as const,
          top: rect.top - window.scrollY + rect.height + 6,
          left: rect.left - window.scrollX + offsetX,
          zIndex: 50,
        }
      : { position: 'fixed' as const, top: -9999, left: -9999 }

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.button
            type="button"
            style={triggerStyle}
            onMouseDown={(e) => { e.preventDefault(); setPanelOpen((prev) => !prev) }}
            aria-label="Add block"
            aria-expanded={panelOpen}
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.75 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            className={triggerBtn({ open: panelOpen })}
          >
            <Plus size={11} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVisible && panelOpen && (
          <motion.div
            ref={panelRef}
            style={panelStyle}
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="w-60 p-1.5 bg-zinc-900 border border-zinc-700/70 rounded-xl shadow-2xl shadow-black/60"
          >
            {/* Header */}
            <p className="px-2 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Add block
            </p>
            <ul className="space-y-0.5">
              {items.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      item.onSelect(editor)
                      setPanelOpen(false)
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={panelItem({ active: index === activeIndex })}
                  >
                    {/* Icon box */}
                    <span className="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 text-sm font-mono text-zinc-300">
                      {item.icon}
                    </span>
                    {/* Label + description */}
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-zinc-100 leading-tight truncate">
                        {item.label}
                      </span>
                      <span className="block text-[11px] text-zinc-500 leading-tight truncate mt-0.5">
                        {item.description}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
