'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from 'lexical'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
import type { ImageAlignment } from '../types'
import { $isImageNode } from '../node/image-node'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ImageComponentProps {
  nodeKey: string
  src: string
  alt: string
  caption: string
  width: number | undefined
  alignment: ImageAlignment
  editor: ReturnType<typeof useLexicalComposerContext>[0]
}

// ─── Resize handle ────────────────────────────────────────────────────────────

interface ResizeHandleProps {
  position: 'left' | 'right'
  onMouseDown: (e: React.MouseEvent, side: 'left' | 'right') => void
}

function ResizeHandle({ position, onMouseDown }: ResizeHandleProps) {
  const style: CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    [position]: -6,
    width: 12,
    height: 40,
    background: 'rgba(255,255,255,0.85)',
    borderRadius: 4,
    cursor: 'ew-resize',
    border: '1px solid rgba(0,0,0,0.15)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
  }
  return (
    <div
      style={style}
      onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, position) }}
    />
  )
}

// ─── Alignment toolbar ────────────────────────────────────────────────────────

const ALIGNMENTS: { value: ImageAlignment; label: string }[] = [
  { value: 'left', label: '←' },
  { value: 'center', label: '↔' },
  { value: 'right', label: '→' },
]

interface AlignToolbarProps {
  current: ImageAlignment
  onChange: (a: ImageAlignment) => void
}

function AlignToolbar({ current, onChange }: AlignToolbarProps) {
  const style: CSSProperties = {
    position: 'absolute',
    top: -36,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 2,
    background: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: 6,
    padding: '2px 4px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    zIndex: 10,
  }
  const btnStyle = (active: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: 4,
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    background: active ? 'rgba(99,102,241,0.3)' : 'transparent',
    color: active ? '#a5b4fc' : '#a1a1aa',
  })
  return (
    <div style={style}>
      {ALIGNMENTS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          style={btnStyle(current === value)}
          onMouseDown={(e) => { e.preventDefault(); onChange(value) }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

const MIN_WIDTH = 80
const MAX_WIDTH = 800

export function ImageComponent({
  nodeKey,
  src,
  alt,
  caption,
  width,
  alignment,
  editor,
}: ImageComponentProps) {
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)
  const [currentWidth, setCurrentWidth] = useState<number | undefined>(width)
  const [isResizing, setIsResizing] = useState(false)
  const [captionText, setCaptionText] = useState(caption)

  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const resizeStartRef = useRef<{ x: number; startWidth: number } | null>(null)

  // ── 선택 ──────────────────────────────────────────────────────────────────

  const onDelete = useCallback(
    (event: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        event.preventDefault()
        editor.update(() => {
          const node = $getNodeByKey(nodeKey)
          if ($isImageNode(node)) node.remove()
        })
        return true
      }
      return false
    },
    [editor, isSelected, nodeKey],
  )

  useEffect(() => {
    return editor.registerCommand(
      CLICK_COMMAND,
      (e: MouseEvent) => {
        if (containerRef.current?.contains(e.target as Node)) {
          if (!e.shiftKey) clearSelection()
          setSelected(true)
          return true
        }
        return false
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor, setSelected, clearSelection])

  useEffect(() => {
    const unregDel = editor.registerCommand(
      KEY_DELETE_COMMAND,
      onDelete as unknown as () => boolean,
      COMMAND_PRIORITY_LOW,
    )
    const unregBack = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      onDelete as unknown as () => boolean,
      COMMAND_PRIORITY_LOW,
    )
    return () => { unregDel(); unregBack() }
  }, [editor, onDelete])

  // ── 리사이즈 ──────────────────────────────────────────────────────────────

  const startResize = useCallback(
    (e: React.MouseEvent, _side: 'left' | 'right') => {
      e.preventDefault()
      const startWidth = currentWidth ?? imgRef.current?.naturalWidth ?? 400
      resizeStartRef.current = { x: e.clientX, startWidth }
      setIsResizing(true)

      function onMouseMove(ev: MouseEvent) {
        if (!resizeStartRef.current) return
        const delta = ev.clientX - resizeStartRef.current.x
        const newWidth = Math.min(
          MAX_WIDTH,
          Math.max(MIN_WIDTH, resizeStartRef.current.startWidth + delta),
        )
        setCurrentWidth(newWidth)
      }

      function onMouseUp() {
        if (!resizeStartRef.current) return
        const delta = window.event
          ? (window.event as MouseEvent).clientX - resizeStartRef.current.x
          : 0
        const finalWidth = Math.min(
          MAX_WIDTH,
          Math.max(MIN_WIDTH, resizeStartRef.current.startWidth + delta),
        )
        editor.update(() => {
          const node = $getNodeByKey(nodeKey)
          if ($isImageNode(node)) node.setWidth(finalWidth)
        })
        setIsResizing(false)
        resizeStartRef.current = null
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [currentWidth, editor, nodeKey],
  )

  // ── 캡션 ──────────────────────────────────────────────────────────────────

  const onCaptionBlur = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isImageNode(node)) node.setCaption(captionText)
    })
  }, [editor, nodeKey, captionText])

  // ── 정렬 ──────────────────────────────────────────────────────────────────

  const onAlignChange = useCallback(
    (a: ImageAlignment) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if ($isImageNode(node)) node.setAlignment(a)
      })
    },
    [editor, nodeKey],
  )

  // ── Styles ────────────────────────────────────────────────────────────────

  const alignMap: Record<ImageAlignment, string> = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  }

  const wrapperStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: alignMap[alignment],
    width: '100%',
    margin: '8px 0',
    userSelect: 'none',
  }

  const figureStyle: CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    maxWidth: '100%',
    outline: isSelected ? '2px solid #6366f1' : '2px solid transparent',
    outlineOffset: 2,
    borderRadius: 4,
    cursor: 'default',
    transition: 'outline-color 120ms',
  }

  const imgStyle: CSSProperties = {
    display: 'block',
    width: currentWidth ? `${currentWidth}px` : '100%',
    maxWidth: '100%',
    height: 'auto',
    borderRadius: 4,
    pointerEvents: isResizing ? 'none' : 'auto',
  }

  const captionStyle: CSSProperties = {
    display: 'block',
    marginTop: 6,
    fontSize: 13,
    color: '#71717a',
    textAlign: 'center',
    width: currentWidth ? `${currentWidth}px` : '100%',
    maxWidth: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    lineHeight: 1.4,
    padding: 0,
  }

  return (
    <div style={wrapperStyle} contentEditable={false}>
      <figure ref={containerRef} style={figureStyle}>
        {/* 정렬 툴바 — 선택 시만 표시 */}
        {isSelected && (
          <AlignToolbar current={alignment} onChange={onAlignChange} />
        )}

        <img ref={imgRef} src={src} alt={alt} style={imgStyle} draggable={false} />

        {/* 리사이즈 핸들 — 선택 시만 표시 */}
        {isSelected && (
          <>
            <ResizeHandle position="left" onMouseDown={startResize} />
            <ResizeHandle position="right" onMouseDown={startResize} />
          </>
        )}
      </figure>

      {/* 캡션 */}
      <input
        type="text"
        value={captionText}
        onChange={(e) => setCaptionText(e.target.value)}
        onBlur={onCaptionBlur}
        placeholder="Caption (optional)"
        style={captionStyle}
      />
    </div>
  )
}
