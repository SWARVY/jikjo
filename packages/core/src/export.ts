import { $generateHtmlFromNodes } from '@lexical/html'
import { $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown'
import type { Transformer } from '@lexical/markdown'
import type { LexicalEditor } from 'lexical'

/**
 * Serialize the current editor state to an HTML string.
 */
export function exportToHtml(editor: LexicalEditor): string {
  let html = ''
  editor.read(() => {
    html = $generateHtmlFromNodes(editor)
  })
  return html
}

/**
 * Serialize the current editor state to a Markdown string.
 * Pass custom `transformers` to override the default Lexical transformer set.
 */
export function exportToMarkdown(
  editor: LexicalEditor,
  transformers: Transformer[] = TRANSFORMERS,
): string {
  let md = ''
  editor.read(() => {
    md = $convertToMarkdownString(transformers)
  })
  return md
}
