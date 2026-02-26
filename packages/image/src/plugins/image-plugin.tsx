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
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { $createImageNode, $isImageNode, ImageNode } from '../node/image-node'
import type { ImageExtensionOptions, ImagePayload } from '../types'

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

// ─── Insert Dialog ────────────────────────────────────────────────────────────

// ─── Animation styles (injected once) ────────────────────────────────────────

const DIALOG_STYLES = `
@keyframes jikjo-overlay-in  { from { opacity: 0 }              to { opacity: 1 } }
@keyframes jikjo-overlay-out { from { opacity: 1 }              to { opacity: 0 } }
@keyframes jikjo-dialog-in   { from { opacity: 0; transform: scale(0.95) translateY(-6px) } to { opacity: 1; transform: scale(1) translateY(0) } }
@keyframes jikjo-dialog-out  { from { opacity: 1; transform: scale(1) translateY(0) }       to { opacity: 0; transform: scale(0.95) translateY(-6px) } }
`

// ─── Insert Dialog props ───────────────────────────────────────────────────────

interface InsertImageDialogProps {
  onClose: () => void
  isClosing: boolean
  uploadAdapter?: ImageExtensionOptions['uploadAdapter']
  accept: string
  maxFileSize: number
}

// ─── Icons ────────────────────────────────────────────────────────────────────

/** 파일 문서 모양 아이콘 */
function FileIcon({ size = 48, color = '#52525b' }: { size?: number; color?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

/** 업로드 화살표 배지 */
function UploadBadge() {
  return (
    <div style={{
      position: 'absolute',
      bottom: -6,
      right: -6,
      width: 22,
      height: 22,
      borderRadius: '50%',
      background: '#6366f1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 0 0 3px #18181b',
    }}>
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
  const [hovered, setHovered] = useState(false)
  const [cancelHovered, setCancelHovered] = useState(false)
  const [retryHovered, setRetryHovered] = useState(false)
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

  // ── Styles ────────────────────────────────────────────────────────────────

  const DUR = '180ms'
  const overlayStyle: CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: `${isClosing ? 'jikjo-overlay-out' : 'jikjo-overlay-in'} ${DUR} ease both`,
  }
  const dialogStyle: CSSProperties = {
    background: '#18181b', border: '1px solid #3f3f46',
    borderRadius: 12, padding: '20px 20px 16px', width: 400, maxWidth: '92vw',
    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
    color: '#e4e4e7',
    fontFamily: 'inherit',
    animation: `${isClosing ? 'jikjo-dialog-out' : 'jikjo-dialog-in'} ${DUR} ease both`,
  }
  const dropZoneStyle: CSSProperties = {
    border: `2px dashed ${dragOver ? '#6366f1' : hovered && !uploading ? '#52525b' : '#3f3f46'}`,
    borderRadius: 10,
    padding: '40px 24px',
    cursor: uploading ? 'not-allowed' : 'pointer',
    transition: 'border-color 120ms, background 120ms',
    background: dragOver
      ? 'rgba(99,102,241,0.06)'
      : hovered && !uploading
        ? 'rgba(39,39,42,0.5)'
        : 'transparent',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0,
  }
  const previewBoxStyle: CSSProperties = {
    border: '1px solid #3f3f46',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    background: '#09090b',
    minHeight: 120,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
  const cancelBtnStyle: CSSProperties = {
    padding: '6px 14px', border: `1px solid ${cancelHovered ? '#52525b' : '#3f3f46'}`, borderRadius: 6,
    background: cancelHovered ? 'rgba(39,39,42,0.6)' : 'transparent',
    color: cancelHovered ? '#d4d4d8' : '#a1a1aa',
    cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
    transition: 'background 100ms, border-color 100ms, color 100ms',
  }
  const retryBtnStyle: CSSProperties = {
    padding: '6px 14px', border: 'none', borderRadius: 6,
    background: retryHovered ? '#4f46e5' : '#6366f1',
    color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
    fontFamily: 'inherit',
    transition: 'background 100ms',
  }

  return (
    <>
      <style>{DIALOG_STYLES}</style>
    <div style={overlayStyle} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={dialogStyle}>

        {/* ── Dropzone or Preview ── */}
        {preview ? (
          <div style={previewBoxStyle}>
            {uploading && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 1,
                background: 'rgba(9,9,11,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 8,
              }}>
                {/* 간단한 스피너 */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={28} height={28}
                  viewBox="0 0 24 24"
                  fill="none" stroke="#a5b4fc"
                  strokeWidth={2} strokeLinecap="round"
                  style={{ animation: 'spin 0.9s linear infinite' }}
                >
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span style={{ fontSize: 12, color: '#a5b4fc' }}>Uploading…</span>
              </div>
            )}
            <img
              src={preview.objectUrl}
              alt={preview.name}
              style={{ display: 'block', width: '100%', maxHeight: 240, objectFit: 'contain' }}
            />
          </div>
        ) : (
          <div
            style={dropZoneStyle}
            onClick={() => !uploading && fileInputRef.current?.click()}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {/* 파일 아이콘 + 업로드 배지 */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <FileIcon color={dragOver ? '#818cf8' : '#52525b'} />
              <UploadBadge />
            </div>

            <div style={{ fontSize: 13, color: '#e4e4e7', marginBottom: 4 }}>
              <span style={{
                color: '#a5b4fc',
                textDecoration: 'underline',
                textUnderlineOffset: 2,
                fontWeight: 500,
              }}>
                Click to upload
              </span>
              {' '}or drag and drop
            </div>
            <div style={{ fontSize: 11, color: '#52525b' }}>
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
        {error && (
          <div style={{ color: '#f87171', fontSize: 12, marginTop: 10 }}>{error}</div>
        )}

        {/* ── 하단 버튼 ── */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14, justifyContent: 'flex-end' }}>
          <button
            type="button"
            style={cancelBtnStyle}
            onClick={onClose}
            onMouseEnter={() => setCancelHovered(true)}
            onMouseLeave={() => setCancelHovered(false)}
          >Cancel</button>
          {preview && !uploading && (
            <button
              type="button"
              style={retryBtnStyle}
              onClick={() => { setPreview(null); setError('') }}
              onMouseEnter={() => setRetryHovered(true)}
              onMouseLeave={() => setRetryHovered(false)}
            >
              Choose another
            </button>
          )}
        </div>

      </div>
    </div>
    </>
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
        const imageNode = $createImageNode(payload)
        const selection = $getSelection()

        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode()
          const topNode = anchorNode.getTopLevelElementOrThrow()

          if (topNode.getTextContent().trim() === '') {
            // 빈 줄이면 해당 줄을 이미지로 교체하고, 뒤에 paragraph 보장
            topNode.replace(imageNode)
          } else {
            // 내용이 있으면 뒤에 삽입
            if ($isRootOrShadowRoot(topNode.getParent())) {
              $insertNodes([imageNode])
            } else {
              topNode.insertAfter(imageNode)
            }
          }
        } else {
          $insertNodes([imageNode])
        }

        // 이미지 뒤에 항상 빈 paragraph 보장 (커서를 이미지 다음 줄로 이동)
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
    // 에디터 외부에서 이미지 파일을 드롭했을 때
    return editor.registerCommand<DragEvent>(
      DROP_COMMAND,
      (event) => {
        // 이미 처리된 jikjo 내부 드래그는 스킵
        const internalData = getDragImageData(event)
        if (internalData) return false

        const files = event.dataTransfer?.files
        if (!files || files.length === 0) return false

        const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
        if (imageFiles.length === 0) return false

        event.preventDefault()

        // 비동기로 각 파일 업로드 후 삽입
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

  // ── DRAGSTART — ImageNode 드래그 데이터 설정 ──────────────────────────────

  useEffect(() => {
    return editor.registerCommand<DragEvent>(
      DRAGSTART_COMMAND,
      (event) => {
        const node = event.target instanceof HTMLElement
          ? (event.target.closest('.jikjo-image-wrapper') ? event.target : null)
          : null
        if (!node) return false

        // dataTransfer는 ImageComponent에서 직접 처리
        return false
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor])

  // ── DRAGOVER — 이미지 노드 위 드래그 기본 동작 방지 ─────────────────────
  // block drag(DRAG_DATA_FORMAT) 중에는 개입하지 않음 — block-toolbar가 처리

  useEffect(() => {
    const DRAG_DATA_FORMAT = 'application/x-lexical-drag-block'
    return editor.registerCommand<DragEvent>(
      DRAGOVER_COMMAND,
      (event) => {
        // block 드래그 중이면 pass
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
