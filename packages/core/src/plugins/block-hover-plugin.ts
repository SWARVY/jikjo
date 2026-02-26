import {
  $getNearestNodeFromDOMNode,
  $isDecoratorNode,
  $isElementNode,
} from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlockRect {
  top: number
  left: number
  width: number
  height: number
}

export interface BlockHoverState {
  isActive: boolean
  rect: BlockRect | null
  nodeKey: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findBlockElement(
  target: EventTarget | null,
  editorRoot: HTMLElement,
): HTMLElement | null {
  if (!(target instanceof HTMLElement)) return null
  let node: HTMLElement | null = target
  while (node && node !== editorRoot) {
    if (node.parentElement === editorRoot) return node
    node = node.parentElement
  }
  return null
}

function buildBlockRect(el: HTMLElement): BlockRect {
  const rect = el.getBoundingClientRect()
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
  }
}

/** 현재 포인터 좌표(clientX/Y)가 [data-block-toolbar] 위에 있는지 확인 */
function pointerOverToolbar(x: number, y: number): boolean {
  const els = document.elementsFromPoint(x, y)
  return els.some((el) => el.closest('[data-block-toolbar]') !== null)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBlockHoverPlugin(): BlockHoverState {
  const [editor] = useLexicalComposerContext()
  const [state, setState] = useState<BlockHoverState>({
    isActive: false,
    rect: null,
    nodeKey: null,
  })

  const activeKeyRef = useRef<string | null>(null)
  // 마지막으로 알려진 포인터 좌표
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  // 드래그 중 여부 추적
  const isDraggingRef = useRef(false)

  useEffect(() => {
    // 전역 포인터 위치 추적
    function trackPointer(e: MouseEvent) {
      pointerRef.current = { x: e.clientX, y: e.clientY }
    }
    document.addEventListener('mousemove', trackPointer, { passive: true })

    // 드래그 중에는 hover 비활성화 방지
    function onDragStart() { isDraggingRef.current = true }
    function onDragEnd() { isDraggingRef.current = false }
    document.addEventListener('dragstart', onDragStart)
    document.addEventListener('dragend', onDragEnd)

    let cleanup: (() => void) | null = null

    const unregisterRoot = editor.registerRootListener((rootElement) => {
      if (cleanup) {
        cleanup()
        cleanup = null
      }
      if (!rootElement) return

      function handleMouseOver(event: MouseEvent) {
        const blockEl = findBlockElement(event.target, rootElement!)
        if (!blockEl) return

        let nodeKey: string | null = null
        editor.read(() => {
          const lexicalNode = $getNearestNodeFromDOMNode(blockEl)
          if (!lexicalNode) return
          // ElementNode(paragraph, heading 등)와 DecoratorNode(image 등) 모두 허용
          if (!$isElementNode(lexicalNode) && !$isDecoratorNode(lexicalNode)) return
          // inline 노드는 제외 (block-level만)
          if (lexicalNode.isInline()) return
          nodeKey = lexicalNode.getKey()
        })

        if (!nodeKey || nodeKey === activeKeyRef.current) return

        activeKeyRef.current = nodeKey
        setState({ isActive: true, rect: buildBlockRect(blockEl), nodeKey })
      }

      function handleMouseLeave() {
        // 드래그 중에는 비활성화하지 않음
        if (isDraggingRef.current) return
        // 다음 프레임에서 실제 포인터 위치를 확인
        requestAnimationFrame(() => {
          if (isDraggingRef.current) return
          const { x, y } = pointerRef.current
          if (pointerOverToolbar(x, y)) return
          // 에디터 안으로 다시 들어왔으면 중단
          const el = document.elementFromPoint(x, y)
          if (el && rootElement!.contains(el)) return

          activeKeyRef.current = null
          setState({ isActive: false, rect: null, nodeKey: null })
        })
      }

      rootElement.addEventListener('mouseover', handleMouseOver)
      rootElement.addEventListener('mouseleave', handleMouseLeave)

      cleanup = () => {
        rootElement.removeEventListener('mouseover', handleMouseOver)
        rootElement.removeEventListener('mouseleave', handleMouseLeave)
      }
    })

    return () => {
      document.removeEventListener('mousemove', trackPointer)
      document.removeEventListener('dragstart', onDragStart)
      document.removeEventListener('dragend', onDragEnd)
      unregisterRoot()
      if (cleanup) cleanup()
    }
  }, [editor])

  return state
}
