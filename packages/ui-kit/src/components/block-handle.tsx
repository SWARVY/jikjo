'use client'

import type { BlockRect, SlashMenuItem } from '@jikjo/core'
import type { LexicalEditor } from 'lexical'
import { GripVertical, Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { tv } from 'tailwind-variants'

// ─── Styles ───────────────────────────────────────────────────────────────────

const handleBtn = tv({
  base: [
    'flex items-center justify-center',
    'w-5 h-5 rounded-md',
    'text-zinc-500 transition-colors duration-100',
    'hover:bg-zinc-700/70 hover:text-zinc-200',
  ],
})

const panelItem = tv({
  base: [
    'w-full flex items-center gap-3 px-2.5 py-1.5 rounded-lg',
    'text-left transition-colors duration-75 cursor-pointer',
  ],
  variants: {
    active: {
      true: 'bg-zinc-700/60',
      false: 'hover:bg-zinc-700/40',
    },
  },
})

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlockHandleProps {
  isVisible: boolean
  rect: BlockRect | null
  /** Offset from the block's left edge (px). Defaults to -56. */
  offsetX?: number
  /** Slash menu items shown in the add-block panel */
  items?: SlashMenuItem[]
  editor?: LexicalEditor
  onAddBlock?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BlockHandle({
  isVisible,
  rect,
  offsetX = -56,
  items = [],
  editor,
  onAddBlock,
}: BlockHandleProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)

  const HANDLE_HEIGHT = 20

  useEffect(() => {
    if (!panelOpen) setActiveIndex(0)
  }, [panelOpen])

  // Close on outside click
  useEffect(() => {
    if (!panelOpen) return
    function onPointerDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false)
      }
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [panelOpen])

  // Close when block is no longer hovered
  useEffect(() => {
    if (!isVisible) setPanelOpen(false)
  }, [isVisible])

  // Keyboard navigation inside panel
  useEffect(() => {
    if (!panelOpen || !editor) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((p) => Math.min(p + 1, items.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((p) => Math.max(p - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = items[activeIndex]
        if (item) { item.onSelect(editor); setPanelOpen(false) }
      } else if (e.key === 'Escape') {
        setPanelOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [panelOpen, items, activeIndex, editor])

  const handleStyle =
    rect !== null
      ? {
          position: 'fixed' as const,
          top: rect.top - window.scrollY + (rect.height - HANDLE_HEIGHT) / 2,
          left: rect.left - window.scrollX + offsetX,
          zIndex: 40,
        }
      : { position: 'fixed' as const, top: -9999, left: -9999 }

  const panelStyle =
    rect !== null
      ? {
          position: 'fixed' as const,
          top: rect.top - window.scrollY + rect.height + 4,
          left: rect.left - window.scrollX + offsetX,
          zIndex: 50,
        }
      : { position: 'fixed' as const, top: -9999, left: -9999 }

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            style={handleStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="flex items-center gap-0.5"
          >
            {/* + button: opens block-type panel */}
            <button
              type="button"
              aria-label="Add block"
              aria-expanded={panelOpen}
              onMouseDown={(e) => {
                e.preventDefault()
                if (items.length > 0) {
                  setPanelOpen((p) => !p)
                } else {
                  onAddBlock?.()
                }
              }}
              className={handleBtn()}
            >
              <Plus size={13} strokeWidth={2.5} />
            </button>

            {/* drag handle */}
            <button
              type="button"
              aria-label="Drag to reorder"
              className={`${handleBtn()} cursor-grab active:cursor-grabbing`}
            >
              <GripVertical size={13} strokeWidth={2} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Block-type selection panel */}
      <AnimatePresence>
        {isVisible && panelOpen && items.length > 0 && editor && (
          <motion.div
            ref={panelRef}
            style={panelStyle}
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="w-56 p-1.5 bg-zinc-900 border border-zinc-700/70 rounded-xl shadow-2xl shadow-black/60"
          >
            <p className="px-2 pt-0.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Turn into
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
                    <span className="flex items-center justify-center shrink-0 w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/50 text-sm font-mono text-zinc-300">
                      {item.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-zinc-100 leading-tight truncate">
                        {item.label}
                      </span>
                      <span className="block text-[11px] text-zinc-500 leading-tight truncate">
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
