import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
  KEY_ESCAPE_COMMAND,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useState } from "react";

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

  // viewport 좌표로 저장 (page 좌표 변환 없음)
  return {
    top: rect.bottom,
    left: rect.left,
  };
}

function getCurrentLineText(): string {
  const selection = $getSelection();

  if (!$isRangeSelection(selection)) return "";

  const anchor = selection.anchor;
  const anchorNode = anchor.getNode();

  return anchorNode.getTextContent();
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

  const close = useCallback(() => {
    setState({ isActive: false, rect: null, query: "" });
  }, []);

  useEffect(() => {
    const unregisterKeyDown = editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        if (event.key !== "/") return false;

        editor.getEditorState().read(() => {
          const selection = $getSelection();

          if (!$isRangeSelection(selection)) return;
          if (!selection.isCollapsed()) return;

          const lineText = getCurrentLineText();
          const isAtLineStart = lineText.trim() === "";

          if (!isAtLineStart) return;

          // rect는 아직 '/'가 DOM에 없는 타이밍이므로 null로 설정.
          // updateListener에서 '/'가 렌더링된 후 올바른 캐럿 위치를 계산한다.
          setState({ isActive: true, rect: null, query: "" });
        });

        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    const unregisterEscape = editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        if (!state.isActive) return false;

        close();
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      unregisterKeyDown();
      unregisterEscape();
    };
  }, [editor, state.isActive, close]);

  useEffect(() => {
    if (!state.isActive) return;

    const unregister = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const lineText = getCurrentLineText();
        const slashIndex = lineText.lastIndexOf("/");

        if (slashIndex === -1) {
          close();
          return;
        }

        const query = lineText.slice(slashIndex + 1);
        // '/'가 DOM에 반영된 후 매 업데이트마다 캐럿 위치를 새로 계산하여
        // 메뉴가 항상 현재 커서 바로 아래에 정확히 붙도록 한다.
        const rect = getCaretRect();
        setState((prev) => ({ ...prev, rect, query }));
      });
    });

    return unregister;
  }, [editor, state.isActive, close]);

  return { ...state, close };
}
