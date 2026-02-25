import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  type ElementNode,
} from 'lexical'
import {
  $createHeadingNode,
  $createQuoteNode,
  HeadingNode,
  QuoteNode,
} from '@lexical/rich-text'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { createElement } from 'react'
import type { Extension, SlashMenuItem } from '../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function replaceWithNode(create: () => ElementNode): SlashMenuItem['onSelect'] {
  return (editor) => {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      const node = selection.anchor.getNode()
      const topNode = node.getTopLevelElementOrThrow()
      // 슬래시 메뉴에서 선택 시 현재 라인의 텍스트(/ + query)를 지우고 새 빈 블록으로 교체
      const newNode = create()
      topNode.replace(newNode)
      newNode.select()
    })
  }
}

// ─── Slash menu items ─────────────────────────────────────────────────────────

const slashMenuItems: SlashMenuItem[] = [
  {
    id: 'paragraph',
    label: 'Paragraph',
    description: 'Plain text paragraph',
    icon: null,
    onSelect: replaceWithNode($createParagraphNode),
  },
  {
    id: 'heading1',
    label: 'Heading 1',
    description: 'Large section heading',
    icon: null,
    onSelect: replaceWithNode(() => $createHeadingNode('h1')),
  },
  {
    id: 'heading2',
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: null,
    onSelect: replaceWithNode(() => $createHeadingNode('h2')),
  },
  {
    id: 'heading3',
    label: 'Heading 3',
    description: 'Small section heading',
    icon: null,
    onSelect: replaceWithNode(() => $createHeadingNode('h3')),
  },
  {
    id: 'quote',
    label: 'Quote',
    description: 'Capture a quote or callout',
    icon: null,
    onSelect: replaceWithNode($createQuoteNode),
  },
]

// ─── Extension ────────────────────────────────────────────────────────────────

export const richTextExtension: Extension = {
  name: 'rich-text',
  nodes: [HeadingNode, QuoteNode],
  plugins: [
    createElement(RichTextPlugin, {
      contentEditable: createElement(
        'div',
        { className: 'jikjo-editor-content', style: { position: 'relative' } },
        createElement(ContentEditable, {
          className: 'jikjo-content-editable',
          'aria-placeholder': 'Type something, or press / for commands…',
          placeholder: createElement(
            'p',
            { className: 'jikjo-placeholder' },
            'Type something, or press / for commands…',
          ),
        }),
      ),
      ErrorBoundary: LexicalErrorBoundary,
    }),
  ],
  slashMenuItems,
}
