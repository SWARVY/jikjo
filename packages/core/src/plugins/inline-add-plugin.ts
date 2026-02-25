import {
  $getSelection,
  $isRangeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InlineAddState {
  /** 커서가 비어있는 블록 위에 있는지 여부 */
  isActive: boolean
  /** 해당 블록의 Lexical NodeKey */
  nodeKey: string | null
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * 커서가 비어있는 블록(텍스트 없는 단락/헤딩 등)에 있을 때 해당 블록 DOM에
 * `data-inline-add="active"` 속성을 직접 부여한다.
 * JS 좌표 계산 없이 CSS/absolute 포지셔닝으로 버튼을 배치할 수 있게 한다.
 */
export function useInlineAddPlugin(): InlineAddState {
  const [editor] = useLexicalComposerContext()
  const [state, setState] = useState<InlineAddState>({
    isActive: false,
    nodeKey: null,
  })
  const prevDomElRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    function update() {
      editor.getEditorState().read(() => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          clearActive()
          return
        }

        const anchor = selection.anchor
        const anchorNode = anchor.getNode()
        const topNode = anchorNode.getTopLevelElement()

        if (!topNode) {
          clearActive()
          return
        }

        const isEmpty = topNode.getTextContent().trim() === ''

        if (!isEmpty) {
          clearActive()
          return
        }

        const nodeKey = topNode.getKey()
        const domEl = editor.getElementByKey(nodeKey)

        if (!domEl) {
          clearActive()
          return
        }

        // 이전 블록의 속성 제거
        if (prevDomElRef.current && prevDomElRef.current !== domEl) {
          prevDomElRef.current.removeAttribute('data-inline-add')
        }

        // 현재 블록에 속성 부여
        domEl.setAttribute('data-inline-add', 'active')
        prevDomElRef.current = domEl

        setState({ isActive: true, nodeKey })
      })
    }

    function clearActive() {
      if (prevDomElRef.current) {
        prevDomElRef.current.removeAttribute('data-inline-add')
        prevDomElRef.current = null
      }
      setState({ isActive: false, nodeKey: null })
    }

    const unregisterSelection = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => { update(); return false },
      COMMAND_PRIORITY_LOW,
    )

    // 마우스 클릭으로 커서를 이동할 때 SELECTION_CHANGE_COMMAND는
    // Lexical 상태가 확정되기 전에 발생할 수 있다.
    // CLICK_COMMAND에서 rAF로 한 프레임 뒤에 재계산하여 DOM이 확정된 후 동기화.
    const unregisterClick = editor.registerCommand(
      CLICK_COMMAND,
      () => {
        requestAnimationFrame(() => update())
        return false
      },
      COMMAND_PRIORITY_LOW,
    )

    // 방향키로 커서를 이동할 때는 SELECTION_CHANGE_COMMAND가 발생하기 전에
    // KEY_DOWN_COMMAND가 먼저 발생한다. KEY_DOWN 직후 rAF를 통해 DOM 업데이트
    // 이후에 재계산하여 버튼 위치를 커서와 동기화한다.
    const unregisterKeyDown = editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
        if (arrowKeys.includes(event.key)) {
          requestAnimationFrame(() => update())
        }
        return false
      },
      COMMAND_PRIORITY_LOW,
    )

    return () => {
      unregisterSelection()
      unregisterClick()
      unregisterKeyDown()
    }
  }, [editor])

  return state
}
