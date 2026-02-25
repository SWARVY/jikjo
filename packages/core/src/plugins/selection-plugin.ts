import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useCallback, useEffect, useState } from 'react'

export interface SelectionRect {
  top: number
  left: number
  width: number
  height: number
}

export interface SelectionFormatState {
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
  code: boolean
}

export interface SelectionState {
  isActive: boolean
  rect: SelectionRect | null
  format: SelectionFormatState
}

const EMPTY_FORMAT: SelectionFormatState = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  code: false,
}

/**
 * DOM selection의 bounding rect를 반환.
 * collapsed이거나 rect가 없으면 null.
 */
function getSelectionRect(): SelectionRect | null {
  const domSelection = window.getSelection()

  if (!domSelection || domSelection.rangeCount === 0) return null

  const range = domSelection.getRangeAt(0)

  if (range.collapsed) return null

  const rect = range.getBoundingClientRect()

  if (rect.width === 0) return null

  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
}

function getFormatState(selection: ReturnType<typeof $getSelection>): SelectionFormatState {
  if (!$isRangeSelection(selection)) return EMPTY_FORMAT

  return {
    bold: selection.hasFormat('bold'),
    italic: selection.hasFormat('italic'),
    underline: selection.hasFormat('underline'),
    strikethrough: selection.hasFormat('strikethrough'),
    code: selection.hasFormat('code'),
  }
}

export function useSelectionPlugin(): SelectionState & {
  toggleFormat: (format: keyof SelectionFormatState) => void
} {
  const [editor] = useLexicalComposerContext()
  const [state, setState] = useState<SelectionState>({
    isActive: false,
    rect: null,
    format: EMPTY_FORMAT,
  })

  const updateSelection = useCallback(() => {
    // Lexical state에서 selection이 non-collapsed range인지 판단 (isActive 기준)
    const lexicalSelection = $getSelection()
    const isNonCollapsed =
      $isRangeSelection(lexicalSelection) && !lexicalSelection.isCollapsed()

    const format = getFormatState(lexicalSelection)

    if (!isNonCollapsed) {
      setState({ isActive: false, rect: null, format: EMPTY_FORMAT })
      return false
    }

    // 포지셔닝용 DOM rect (없어도 isActive는 true 유지)
    const rect = getSelectionRect()

    setState({ isActive: true, rect, format })

    return false
  }, [])

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      updateSelection,
      COMMAND_PRIORITY_LOW,
    )
  }, [editor, updateSelection])

  const toggleFormat = useCallback(
    (format: keyof SelectionFormatState) => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
    },
    [editor],
  )

  return { ...state, toggleFormat }
}
