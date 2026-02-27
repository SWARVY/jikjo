import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  KEY_ENTER_COMMAND,
} from 'lexical'
import { $isHeadingNode, $createHeadingNode, $createQuoteNode } from '@lexical/rich-text'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'
import { $createParagraphNode } from 'lexical'

/**
 * Shift+Enter: 현재 블록 서식을 유지한 채로 새 블록 삽입
 * - Heading: 같은 레벨의 새 Heading 삽입
 * - Quote: 새 Quote 삽입
 * - Paragraph: 새 Paragraph 삽입 (기본 Enter와 동일하게)
 *
 * Notion/Tiptap 방식: Shift+Enter는 "서식 유지 새 줄"을 의미
 * (기본 Lexical은 Shift+Enter = 소프트 줄바꿈 <br>)
 */
export function useShiftEnterPlugin(): void {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        if (!event?.shiftKey) return false

        const selection = $getSelection()
        if (!$isRangeSelection(selection)) return false

        const topNode = selection.anchor.getNode().getTopLevelElementOrThrow()

        event.preventDefault()

        if ($isHeadingNode(topNode)) {
          // 같은 레벨의 Heading 삽입
          const newNode = $createHeadingNode(topNode.getTag())
          topNode.insertAfter(newNode)
          newNode.select()
          return true
        }

        if (topNode.getType() === 'quote') {
          const newNode = $createQuoteNode()
          topNode.insertAfter(newNode)
          newNode.select()
          return true
        }

        // Paragraph: 새 paragraph 삽입
        const newNode = $createParagraphNode()
        topNode.insertAfter(newNode)
        newNode.select()
        return true
      },
      // RichTextPlugin의 기본 핸들러보다 높은 우선순위로 가로채기
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])
}
