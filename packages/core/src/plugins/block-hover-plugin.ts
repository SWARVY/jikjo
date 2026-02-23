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
    const editorRoot = editor.getRootElement()

    if (!editorRoot) return

    function handleMouseMove(event: MouseEvent) {
      const blockEl = findBlockElement(event.target, editorRoot!)

      if (!blockEl) {
        // Cursor left all known blocks
        setState({ isActive: false, rect: null, nodeKey: null })
        activeKeyRef.current = null
        return
      }

      // Read the nodeKey from Lexical state
      let nodeKey: string | null = null

      editor.getEditorState().read(() => {
        const lexicalNode = $getNearestNodeFromDOMNode(blockEl)

        if (!lexicalNode) return
        if (!$isElementNode(lexicalNode)) return

        nodeKey = lexicalNode.getKey()
      })

      if (!nodeKey) return

      // Skip redundant updates when hovering within the same block
      if (nodeKey === activeKeyRef.current) return

      activeKeyRef.current = nodeKey

      setState({
        isActive: true,
        rect: buildBlockRect(blockEl),
        nodeKey,
      })
    }

    function handleMouseLeave() {
      setState({ isActive: false, rect: null, nodeKey: null })
      activeKeyRef.current = null
    }

    editorRoot.addEventListener('mousemove', handleMouseMove)
    editorRoot.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      editorRoot.removeEventListener('mousemove', handleMouseMove)
      editorRoot.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [editor])

  return state
}
