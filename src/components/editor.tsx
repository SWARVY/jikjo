import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import RichTextEditPlugin from '../plugins/rich-text-edit-plugin';

const LEXICAL_INITIAL_CONFIG = {
  namespace: 'JIKJO Editor',
  onError: (error) => {
    throw error;
  },
};

export default function Editor() {
  return (
    <LexicalComposer initialConfig={LEXICAL_INITIAL_CONFIG}>
      <RichTextEditPlugin />
    </LexicalComposer>
  );
}
