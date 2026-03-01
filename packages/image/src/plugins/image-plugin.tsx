'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  createCommand,
  type LexicalCommand,
} from 'lexical'
import { $createParagraphNode } from 'lexical'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { $createImageNode, $isImageNode, ImageNode } from '../node/image-node'
import type { ImageExtensionOptions, ImagePayload } from '../types'
import '../styles/variables.css'
import styles from '../styles/image-dialog.module.css'

// ─── Commands ─────────────────────────────────────────────────────────────────

export const INSERT_IMAGE_COMMAND: LexicalCommand<ImagePayload> =
  createCommand('INSERT_IMAGE_COMMAND')

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDragImageData(event: DragEvent): ImagePayload | null {
  const dragData = event.dataTransfer?.getData('application/x-jikjo-image')
  if (!dragData) return null
  try { return JSON.parse(dragData) } catch { return null }
}

async function fileToImagePayload(
  file: File,
  uploadAdapter?: ImageExtensionOptions['uploadAdapter'],
): Promise<ImagePayload | null> {
  if (!file.type.startsWith('image/')) return null

  if (uploadAdapter) {
    try {
      const src = await uploadAdapter.upload(file)
      return { src, alt: file.name }
    } catch {
      return null
    }
  }

  // 어댑터 없으면 object URL로 로컬 미리보기 (임시)
  const src = URL.createObjectURL(file)
  return { src, alt: file.name }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function FileIcon({ size = 48, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? 'var(--jikjo-file-icon-color-active)' : 'var(--jikjo-file-icon-color)'}
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function UploadBadge() {
  return (
    <div className={styles.uploadBadge}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={12}
        height={12}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
      </svg>
    </div>
  )
}

// ─── Insert Dialog ────────────────────────────────────────────────────────────

interface InsertImageDialogProps {
  onClose: () => void
  isClosing: boolean
  uploadAdapter?: ImageExtensionOptions['uploadAdapter']
  accept: string
  maxFileSize: number
}

function InsertImageDialog({
  onClose,
  isClosing,
  uploadAdapter,
  accept,
  maxFileSize,
}: InsertImageDialogProps) {
  const [editor] = useLexicalComposerContext()
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<{ name: string; objectUrl: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Esc to close
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  // object URL cleanup
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.objectUrl)
    }
  }, [preview])

  const insertByFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are supported.')
      return
    }
    if (file.size > maxFileSize) {
      setError(`File too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB.`)
      return
    }
    if (preview) URL.revokeObjectURL(preview.objectUrl)
    setPreview({ name: file.name, objectUrl: URL.createObjectURL(file) })
    setError('')
    setUploading(true)
    const payload = await fileToImagePayload(file, uploadAdapter)
    setUploading(false)
    if (!payload) { setError('Upload failed. Please try again.'); return }
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, payload)
    onClose()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) await insertByFile(file)
  }

  const dropzoneClass = [
    styles.dropzone,
    dragOver ? styles.dropzoneActive : '',
    uploading ? styles.dropzoneUploading : '',
  ].filter(Boolean).join(' ')

  return createPortal(
    <div
      className={`${styles.overlay}${isClosing ? ` ${styles.overlayClosing}` : ''}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`${styles.dialog}${isClosing ? ` ${styles.dialogClosing}` : ''}`}>

        {/* ── Dropzone or Preview ── */}
        {preview ? (
          <div className={styles.previewBox}>
            {uploading && (
              <div className={styles.uploadingOverlay}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={28}
                  height={28}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--jikjo-accent-text)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  className={styles.spinner}
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span className={styles.uploadingText}>Uploading…</span>
              </div>
            )}
            <img
              src={preview.objectUrl}
              alt={preview.name}
              className={styles.previewImg}
            />
          </div>
        ) : (
          <div
            className={dropzoneClass}
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className={styles.iconWrapper}>
              <FileIcon active={dragOver} />
              <UploadBadge />
            </div>

            <div className={styles.dropLabel}>
              <span className={styles.dropLabelLink}>Click to upload</span>
              {' '}or drag and drop
            </div>
            <div className={styles.dropHint}>
              PNG, JPG, GIF, WebP · up to {Math.round(maxFileSize / 1024 / 1024)}MB
            </div>
          </div>
        )}

        {/* ── 파일 input ── */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (file) await insertByFile(file)
            e.target.value = ''
          }}
        />

        {/* ── 에러 ── */}
        {error && <div className={styles.error}>{error}</div>}

        {/* ── 하단 버튼 ── */}
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          {preview && !uploading && (
            <button
              type="button"
              className={styles.retryBtn}
              onClick={() => { setPreview(null); setError('') }}
            >
              Choose another
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body,
  )
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

export interface ImagePluginProps {
  options: ImageExtensionOptions
  /** 다이얼로그 열기 요청 시 외부에서 제어할 수 있도록 openDialog ref 주입 */
  onRegisterOpen?: (openFn: () => void) => void
}

const CLOSE_DURATION = 180 // ms — must match CSS animation duration

export function ImagePlugin({ options, onRegisterOpen }: ImagePluginProps) {
  const [editor] = useLexicalComposerContext()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const accept = options.accept ?? 'image/*'
  const maxFileSize = options.maxFileSize ?? 10 * 1024 * 1024

  const openDialog = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    setIsClosing(false)
    setDialogOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setIsClosing(true)
    closeTimerRef.current = setTimeout(() => {
      setDialogOpen(false)
      setIsClosing(false)
    }, CLOSE_DURATION)
  }, [])

  useEffect(() => () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current) }, [])

  // 외부(SlashMenu 등)에서 다이얼로그를 열 수 있도록 함수 노출
  useEffect(() => {
    onRegisterOpen?.(openDialog)
  }, [onRegisterOpen, openDialog])

  // ── INSERT_IMAGE_COMMAND 핸들러 ────────────────────────────────────────────

  useEffect(() => {
    return editor.registerCommand<ImagePayload>(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        if (!editor.isEditable()) return false
        const imageNode = $createImageNode(payload)
        const selection = $getSelection()

        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode()
          const topNode = anchorNode.getTopLevelElementOrThrow()

          if (topNode.getTextContent().trim() === '') {
            topNode.replace(imageNode)
          } else {
            if ($isRootOrShadowRoot(topNode.getParent())) {
              $insertNodes([imageNode])
            } else {
              topNode.insertAfter(imageNode)
            }
          }
        } else {
          $insertNodes([imageNode])
        }

        if (imageNode.getNextSibling() === null) {
          const paragraph = $createParagraphNode()
          imageNode.insertAfter(paragraph)
          paragraph.select()
        } else {
          imageNode.getNextSibling()?.selectStart()
        }

        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  // ── 드래그앤드롭 ──────────────────────────────────────────────────────────

  useEffect(() => {
    return editor.registerCommand<DragEvent>(
      DROP_COMMAND,
      (event) => {
        if (!editor.isEditable()) return false
        const internalData = getDragImageData(event)
        if (internalData) return false

        const files = event.dataTransfer?.files
        if (!files || files.length === 0) return false

        const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
        if (imageFiles.length === 0) return false

        event.preventDefault()

        ;(async () => {
          for (const file of imageFiles) {
            if (file.size > maxFileSize) continue
            const payload = await fileToImagePayload(file, options.uploadAdapter)
            if (payload) {
              editor.dispatchCommand(INSERT_IMAGE_COMMAND, payload)
            }
          }
        })()

        return true
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor, options.uploadAdapter, maxFileSize])

  // ── 클립보드 붙여넣기 ────────────────────────────────────────────────────

  useEffect(() => {
    const root = editor.getRootElement()
    if (!root) return

    async function onPaste(e: ClipboardEvent) {
      if (!editor.isEditable()) return
      const items = e.clipboardData?.items
      if (!items) return

      const imageItems = Array.from(items).filter((item) => item.type.startsWith('image/'))
      if (imageItems.length === 0) return

      e.preventDefault()

      for (const item of imageItems) {
        const file = item.getAsFile()
        if (!file) continue
        if (file.size > maxFileSize) continue
        const payload = await fileToImagePayload(file, options.uploadAdapter)
        if (payload) {
          editor.dispatchCommand(INSERT_IMAGE_COMMAND, payload)
        }
      }
    }

    root.addEventListener('paste', onPaste)
    return () => root.removeEventListener('paste', onPaste)
  }, [editor, options.uploadAdapter, maxFileSize])

  // ── DRAGSTART ─────────────────────────────────────────────────────────────

  useEffect(() => {
    return editor.registerCommand<DragEvent>(
      DRAGSTART_COMMAND,
      (event) => {
        const node = event.target instanceof HTMLElement
          ? (event.target.closest('.jikjo-image-wrapper') ? event.target : null)
          : null
        if (!node) return false
        return false
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor])

  // ── DRAGOVER ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const DRAG_DATA_FORMAT = 'application/x-lexical-drag-block'
    return editor.registerCommand<DragEvent>(
      DRAGOVER_COMMAND,
      (event) => {
        if (event.dataTransfer?.types.includes(DRAG_DATA_FORMAT)) return false
        const target = event.target as HTMLElement
        if (!target.closest('.jikjo-image-wrapper')) return false
        event.preventDefault()
        return true
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor])

  return (
    <>
      {dialogOpen && (
        <InsertImageDialog
          onClose={closeDialog}
          isClosing={isClosing}
          uploadAdapter={options.uploadAdapter}
          accept={accept}
          maxFileSize={maxFileSize}
        />
      )}
    </>
  )
}

// ─── 다이얼로그 열기 헬퍼 (SlashMenuItem onSelect에서 사용) ──────────────────

let _openImageDialog: (() => void) | null = null

export function registerOpenImageDialog(fn: () => void) {
  _openImageDialog = fn
}

export function openImageDialog() {
  _openImageDialog?.()
}
