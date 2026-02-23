'use client'

import type { LexicalEditor } from 'lexical'
import type { SlashCommandRect, SlashMenuItem } from '@jikjo/core'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SlashMenuProps {
  isVisible: boolean
  rect: SlashCommandRect | null
  query: string
  /** Flat list of items collected from all extensions */
  items: SlashMenuItem[]
  editor: LexicalEditor
  onClose: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function highlight(text: string, query: string): string {
  if (!query) return text

  const index = text.toLowerCase().indexOf(query.toLowerCase())

  if (index === -1) return text

  return (
    text.slice(0, index) +
    '<mark class="bg-violet-400/30 text-violet-200 rounded-sm">' +
    text.slice(index, index + query.length) +
    '</mark>' +
    text.slice(index + query.length)
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SlashMenu({
  isVisible,
  rect,
  query,
  items,
  editor,
  onClose,
}: SlashMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  const filtered = items.filter(
    (item) =>
      !query ||
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()),
  )

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  // Keyboard navigation
  useEffect(() => {
    if (!isVisible) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1))
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((prev) => Math.max(prev - 1, 0))
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        const item = filtered[activeIndex]
        if (!item) return
        item.onSelect(editor)
        onClose()
        return
      }

      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, filtered, activeIndex, editor, onClose])

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current
    if (!list) return

    const activeEl = list.querySelector<HTMLElement>('[data-active="true"]')
    activeEl?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const positionStyle =
    rect !== null
      ? {
          position: 'fixed' as const,
          top: rect.top - window.scrollY + 4,
          left: rect.left - window.scrollX,
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
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.13, ease: 'easeOut' }}
          className="
            w-72
            bg-zinc-900 border border-zinc-700/80
            rounded-xl shadow-2xl shadow-black/50
            overflow-hidden
          "
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-zinc-500">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <ul
              ref={listRef}
              className="py-1.5 max-h-72 overflow-y-auto"
            >
              {filtered.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    data-active={index === activeIndex}
                    onClick={() => {
                      item.onSelect(editor)
                      onClose()
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    className="
                      w-full flex items-center gap-3 px-3 py-2
                      text-left transition-colors duration-75
                      data-[active=true]:bg-violet-600/20
                    "
                  >
                    <span
                      className="
                        flex items-center justify-center
                        w-8 h-8 rounded-md shrink-0
                        bg-zinc-800 text-base
                      "
                    >
                      {item.icon}
                    </span>

                    <span className="min-w-0">
                      <span
                        className="block text-sm font-medium text-zinc-100 truncate"
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled highlight markup
                        dangerouslySetInnerHTML={{
                          __html: highlight(item.label, query),
                        }}
                      />
                      <span className="block text-xs text-zinc-500 truncate">
                        {item.description}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
