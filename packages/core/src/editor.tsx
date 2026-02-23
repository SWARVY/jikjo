'use client'

import {
  LexicalComposer,
  type InitialConfigType,
} from '@lexical/react/LexicalComposer'
import { Fragment, useMemo } from 'react'
import type { EditorProps } from './types'

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
