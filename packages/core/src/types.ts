import type { Klass, LexicalEditor, LexicalNode } from 'lexical'
import type { ReactNode } from 'react'

// ─── Slash menu ───────────────────────────────────────────────────────────────

export interface SlashMenuItem {
  /** Unique identifier used as React key and for deduplication */
  id: string
  /** Display label shown in the menu */
  label: string
  /** Short description shown below the label */
  description: string
  /** Icon character or emoji rendered in the item tile */
  icon: string
  /** Called when the item is selected via click or keyboard Enter */
  onSelect: (editor: LexicalEditor) => void
}

// ─── Extension ────────────────────────────────────────────────────────────────

export interface Extension {
  name: string
  nodes?: Klass<LexicalNode>[]
  plugins?: ReactNode[]
  /** Slash-command menu items contributed by this extension */
  slashMenuItems?: SlashMenuItem[]
}

// ─── Editor ───────────────────────────────────────────────────────────────────

export interface EditorProps {
  extensions?: Extension[]
  namespace?: string
  onError?: (error: Error) => void
  children?: ReactNode
}
