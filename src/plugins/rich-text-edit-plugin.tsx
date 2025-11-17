import React from 'react';

import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

interface RichTextEditPluginProps {
  placeholder?: string;
}

export default function RichTextEditPlugin({
  placeholder = 'Enter your text here...',
}: RichTextEditPluginProps) {
  return (
    <RichTextPlugin
      contentEditable={
        <ContentEditable
          aria-placeholder={placeholder}
          placeholder={<EditorPlaceholder placeholder={placeholder} />}
        />
      }
      ErrorBoundary={LexicalErrorBoundary}
    />
  );
}

interface EditorPlaceholderProps {
  placeholder: string;
}

function EditorPlaceholder({ placeholder }: EditorPlaceholderProps) {
  return <span>{placeholder}</span>;
}
