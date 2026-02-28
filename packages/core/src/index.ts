// Core editor component
export { Editor } from './editor'

// Types
export type {
  Extension,
  EditorProps,
  SlashMenuItem,
} from './types'

// Built-in extensions
export { historyExtension } from './extensions/history-extension'
export { richTextExtension } from './extensions/rich-text-extension'

// Headless plugins / hooks
export { useSelectionPlugin } from './plugins/selection-plugin'
export type {
  SelectionFormatState,
  SelectionRect,
  SelectionState,
} from './plugins/selection-plugin'

export { useSlashCommandPlugin } from './plugins/slash-command-plugin'
export type {
  SlashCommandRect,
  SlashCommandState,
} from './plugins/slash-command-plugin'

export { useBlockHoverPlugin } from './plugins/block-hover-plugin'
export type {
  BlockHoverState,
  BlockRect,
} from './plugins/block-hover-plugin'

export { useInlineAddPlugin } from './plugins/inline-add-plugin'
export type { InlineAddState } from './plugins/inline-add-plugin'

// Export utilities
export { exportToHtml, exportToMarkdown } from './export'
