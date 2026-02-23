import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useState } from 'react'
import type { BlockRect } from './block-hover-plugin'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InlineAddState {
  /** 커서가 비어있는 블록 위에 있는지 여부 */
  isActive: boolean
  /** 비어있는 블록의 page 좌표 */
  rect: BlockRect | null
  /** 해당 블록의 Lexical NodeKey */
  nodeKey: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBlockRect(el: Element): BlockRect {
  const r = el.getBoundingClientRect()
  return {
    top: r.top + window.scrollY,
    left: r.left + window.scrollX,
    width: r.width,
    height: r.height,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * 커서가 비어있는 블록(텍스트 없는 단락/헤딩 등)에 있을 때 해당 블록의
 * 위치와 NodeKey를 반환한다. 이를 이용해 인라인 `+` 버튼을 표시한다.
 */
export function useInlineAddPlugin(): InlineAddState {
  const [editor] = useLexicalComposerContext()
  const [state, setState] = useState<InlineAddState>({
    isActive: false,
    rect: null,
    nodeKey: null,
  })

  useEffect(() => {
    function update() {
      editor.getEditorState().read(() => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          setState({ isActive: false, rect: null, nodeKey: null })
          return
        }

        const anchor = selection.anchor
        const anchorNode = anchor.getNode()
        const topNode = anchorNode.getTopLevelElement()

        if (!topNode) {
          setState({ isActive: false, rect: null, nodeKey: null })
          return
        }

        const isEmpty = topNode.getTextContent().trim() === ''

        if (!isEmpty) {
          setState({ isActive: false, rect: null, nodeKey: null })
          return
        }

        const nodeKey = topNode.getKey()
        const domEl = editor.getElementByKey(nodeKey)

        if (!domEl) {
          setState({ isActive: false, rect: null, nodeKey: null })
          return
        }

        setState({
          isActive: true,
          rect: getBlockRect(domEl),
          nodeKey,
        })
      })
    }

    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        update()
        return false
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor])

  return state
}
