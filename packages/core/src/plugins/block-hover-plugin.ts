import {
  $getNearestNodeFromDOMNode,
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
  /** Whether a block is currently hovered */
  isActive: boolean
  /** Bounding rect of the hovered block element, relative to the page */
  rect: BlockRect | null
  /** Lexical NodeKey of the hovered block */
  nodeKey: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Walks up the DOM from `target` until it finds the nearest element that
 * Lexical recognises as a top-level block element node.
 * Returns null when the target is outside the editor root.
 */
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBlockHoverPlugin(): BlockHoverState {
  const [editor] = useLexicalComposerContext()
  const [state, setState] = useState<BlockHoverState>({
    isActive: false,
    rect: null,
    nodeKey: null,
  })

  // Keep a stable ref to the current nodeKey so the mouseleave handler can
  // compare without needing to be recreated on every state change.
  const activeKeyRef = useRef<string | null>(null)

  useEffect(() => {
    let cleanup: (() => void) | null = null

    const unregisterRoot = editor.registerRootListener((rootElement) => {
      // 이전 리스너 정리
      if (cleanup) {
        cleanup()
        cleanup = null
      }

      if (!rootElement) {
        console.log('[BlockHover] rootElement is null')
        return
      }

      console.log('[BlockHover] rootElement attached:', rootElement)
      const container = rootElement.parentElement ?? rootElement
      console.log('[BlockHover] container:', container)

      let leaveTimer: ReturnType<typeof setTimeout> | null = null

      function handleDocumentMouseMove(event: MouseEvent) {
        const target = event.target
        const inside = container.contains(target as Node)
        if (target instanceof HTMLElement && target.closest('[data-lexical-editor]')) {
          console.log('[BlockHover] mousemove target:', target.tagName, 'inside container:', inside)
        }

        // Check if mouse is inside the container (editor area)
        if (inside) {
          // Cancel any pending leave
          if (leaveTimer !== null) {
            clearTimeout(leaveTimer)
            leaveTimer = null
          }

          const blockEl = findBlockElement(target, rootElement!)

          if (!blockEl) {
            // Inside container but not over a block (e.g. padding area)
            return
          }

          let nodeKey: string | null = null

          editor.getEditorState().read(() => {
            const lexicalNode = $getNearestNodeFromDOMNode(blockEl)
            if (!lexicalNode) {
              console.log('[BlockHover] $getNearestNodeFromDOMNode returned null for', blockEl)
              return
            }
            if (!$isElementNode(lexicalNode)) {
              console.log('[BlockHover] node is not element node:', lexicalNode)
              return
            }
            nodeKey = lexicalNode.getKey()
          })

          if (!nodeKey) return
          if (nodeKey === activeKeyRef.current) return

          activeKeyRef.current = nodeKey
          setState({
            isActive: true,
            rect: buildBlockRect(blockEl),
            nodeKey,
          })
        } else {
          // Mouse is outside the container — schedule deactivation with a delay
          // so that moving to the floating buttons doesn't flicker
          if (leaveTimer !== null) return
          leaveTimer = setTimeout(() => {
            leaveTimer = null
            setState({ isActive: false, rect: null, nodeKey: null })
            activeKeyRef.current = null
          }, 150)
        }
      }

      document.addEventListener('mousemove', handleDocumentMouseMove)

      cleanup = () => {
        document.removeEventListener('mousemove', handleDocumentMouseMove)
        if (leaveTimer !== null) {
          clearTimeout(leaveTimer)
          leaveTimer = null
        }
      }
    })

    return () => {
      unregisterRoot()
      if (cleanup) cleanup()
    }
  }, [editor])

  return state
}
