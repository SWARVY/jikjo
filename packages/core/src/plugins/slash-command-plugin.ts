import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_ESCAPE_COMMAND,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useRef, useState } from "react";

export interface SlashCommandRect {
  top: number;
  left: number;
}

export interface SlashCommandState {
  isActive: boolean;
  rect: SlashCommandRect | null;
  query: string;
}

function getCaretRect(): SlashCommandRect | null {
  const domSelection = window.getSelection();
  if (!domSelection || domSelection.rangeCount === 0) return null;

  const range = domSelection.getRangeAt(0).cloneRange();
  range.collapse(true);
  const rect = range.getBoundingClientRect();

  return { top: rect.bottom, left: rect.left };
}

function getCurrentLineText(): string {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return "";
  return selection.anchor.getNode().getTextContent();
}

export function useSlashCommandPlugin(): SlashCommandState & {
  close: () => void;
} {
  const [editor] = useLexicalComposerContext();
  const [state, setState] = useState<SlashCommandState>({
    isActive: false,
    rect: null,
    query: "",
  });

  // ref로 isActive를 추적하여 클로저 stale 문제 방지
  const isActiveRef = useRef(false);

  const close = useCallback(() => {
    isActiveRef.current = false;
    setState({ isActive: false, rect: null, query: "" });
  }, []);

  useEffect(() => {
    // updateListener 하나로 통합: keydown 감지 + 매 업데이트마다 상태 동기화
    const unregisterUpdate = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          if (isActiveRef.current) close();
          return;
        }

        const lineText = getCurrentLineText();
        const slashIndex = lineText.lastIndexOf("/");

        if (slashIndex === -1) {
          // '/'가 없으면 비활성화
          if (isActiveRef.current) close();
          return;
        }

        // '/' 앞의 텍스트가 없거나 공백만 있어야 함 (빈 라인에서 / 입력)
        const beforeSlash = lineText.slice(0, slashIndex);
        if (beforeSlash.trim() !== "") {
          if (isActiveRef.current) close();
          return;
        }

        const query = lineText.slice(slashIndex + 1);
        const rect = getCaretRect();

        isActiveRef.current = true;
        setState({ isActive: true, rect, query });
      });
    });

    const unregisterEscape = editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        if (!isActiveRef.current) return false;
        close();
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      unregisterUpdate();
      unregisterEscape();
    };
  }, [editor, close]);

  return { ...state, close };
}
