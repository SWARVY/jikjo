'use client'

import {
  LexicalComposer,
  type InitialConfigType,
} from '@lexical/react/LexicalComposer'
import { Fragment, useMemo } from 'react'
import type { EditorProps } from './types'

const defaultTheme: InitialConfigType['theme'] = {
  text: {
    bold: 'jikjo-text-bold',
    italic: 'jikjo-text-italic',
    underline: 'jikjo-text-underline',
    strikethrough: 'jikjo-text-strikethrough',
    underlineStrikethrough: 'jikjo-text-underline jikjo-text-strikethrough',
    code: 'jikjo-text-code',
  },
}

export function Editor({
  extensions = [],
  namespace = 'jikjo',
  onError,
  children,
}: EditorProps) {
  const nodes = useMemo(
    () => extensions.flatMap((ext) => ext.nodes ?? []),
    [extensions],
  )

  const initialConfig: InitialConfigType = {
    namespace,
    nodes,
    theme: defaultTheme,
    onError: onError ?? ((error) => console.error(error)),
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      {children}
      {extensions.flatMap((ext, extIdx) =>
        (ext.plugins ?? []).map((plugin, pluginIdx) => (
          <Fragment key={`${ext.name}-${extIdx}-${pluginIdx}`}>
            {plugin}
          </Fragment>
        )),
      )}
    </LexicalComposer>
  )
}
