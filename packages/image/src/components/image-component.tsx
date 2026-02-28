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
  type KeyboardEvent,
} from 'react'
import type { ImageAlignment } from '../types'
import { $isImageNode } from '../node/image-node'
import styles from '../styles/image-component.module.css'

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
  const cls = [
    styles.resizeHandle,
    position === 'left' ? styles.resizeHandleLeft : styles.resizeHandleRight,
  ].join(' ')
  return (
    <div
      className={cls}
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
  return (
    <div className={styles.alignToolbar}>
      {ALIGNMENTS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          className={`${styles.alignBtn}${current === value ? ` ${styles.alignBtnActive}` : ''}`}
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

const ALIGN_CLASS: Record<ImageAlignment, string> = {
  left: styles.wrapperLeft ?? '',
  center: styles.wrapperCenter ?? '',
  right: styles.wrapperRight ?? '',
}

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

  return (
    <div
      className={`${styles.wrapper} ${ALIGN_CLASS[alignment]}`}
      contentEditable={false}
    >
      <figure
        ref={containerRef}
        className={`${styles.figure}${isSelected ? ` ${styles.figureSelected}` : ''}`}
      >
        {isSelected && (
          <AlignToolbar current={alignment} onChange={onAlignChange} />
        )}

        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`${styles.img}${isResizing ? ` ${styles.imgResizing}` : ''}`}
          style={currentWidth ? { width: `${currentWidth}px` } : undefined}
          draggable={false}
        />

        {isSelected && (
          <>
            <ResizeHandle position="left" onMouseDown={startResize} />
            <ResizeHandle position="right" onMouseDown={startResize} />
          </>
        )}
      </figure>

      <input
        type="text"
        value={captionText}
        onChange={(e) => setCaptionText(e.target.value)}
        onBlur={onCaptionBlur}
        placeholder="Caption (optional)"
        className={styles.caption}
        style={currentWidth ? { width: `${currentWidth}px` } : undefined}
      />
    </div>
  )
}
