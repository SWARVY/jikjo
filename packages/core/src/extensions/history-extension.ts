import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { createElement } from 'react'
import type { Extension } from '../types'

export const historyExtension: Extension = {
  name: 'history',
  plugins: [createElement(HistoryPlugin)],
}
