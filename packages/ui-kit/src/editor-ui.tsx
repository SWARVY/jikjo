"use client";

import {
  Editor,
  historyExtension,
  richTextExtension,
  useBlockHoverPlugin,
  useSelectionPlugin,
  useSlashCommandPlugin,
} from "@jikjo/core";
import type { Extension, SlashMenuItem } from "@jikjo/core";
import {
  $createHeadingNode,
  $isHeadingNode,
  type HeadingTagType,
} from "@lexical/rich-text";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Strikethrough,
  Underline,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { MouseEvent } from "react";
import { BubbleMenu } from "./components/bubble-menu";
import { BlockToolbar } from "./components/block-toolbar";
import { SlashMenu } from "./components/slash-menu";
import "./styles/variables.css";
import "./styles/editor-ui.css";

// ─── ToolbarButton ─────────────────────────────────────────────────────────────

interface ToolbarButtonProps {
  label: string;
  isActive?: boolean;
  onMouseDown: (e: MouseEvent) => void;
  children: ReactNode;
}

function ToolbarButton({ label, isActive, onMouseDown, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onMouseDown={onMouseDown}
      className={`jikjo-toolbar__btn${isActive ? " jikjo-toolbar__btn--active" : ""}`}
    >
      {children}
    </button>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EditorUIProps {
  extensions?: Extension[];
  namespace?: string;
  /**
   * undefined → default toolbar
   * false     → no toolbar rendered at all
   * ReactNode → custom toolbar content
   */
  toolbarContent?: ReactNode | false;
  className?: string;
  /**
   * 활성화할 UI 기능 목록. 기본값: 모두 활성화.
   * "blockHandle" | "inlineAdd" | "slashCommand" | "bubbleMenu"
   */
  features?: Array<"blockHandle" | "inlineAdd" | "slashCommand" | "bubbleMenu">;
}

// ─── Default extensions ───────────────────────────────────────────────────────

const defaultExtensions: Extension[] = [richTextExtension, historyExtension];

// ─── Inner component ──────────────────────────────────────────────────────────
// Must live inside LexicalComposer so all hooks have editor context.

const ALL_FEATURES = ["blockHandle", "inlineAdd", "slashCommand", "bubbleMenu"] as const;

interface EditorInnerProps {
  extensions: Extension[];
  toolbarContent: ReactNode | false | undefined;
  features: Array<"blockHandle" | "inlineAdd" | "slashCommand" | "bubbleMenu">;
}

function EditorInner({
  extensions,
  toolbarContent,
  features,
}: EditorInnerProps) {
  const [editor] = useLexicalComposerContext();

  const selection = useSelectionPlugin();
  const slashCommand = useSlashCommandPlugin();
  const blockHover = useBlockHoverPlugin();

  // heading 태그는 Lexical selection으로 추적 (toolbar 표시용)
  const [currentHeadingTag, setCurrentHeadingTag] = useState<HeadingTagType | null>(null);

  // focusedNodeKey: Lexical selection에서 완전히 독립.
  // - 에디터 click → DOM에서 직접 nodeKey 읽기
  // - dragstart → onDragStarted 콜백으로 nodeKey 전달
  // - drop 성공 → onDropped 콜백으로 이동된 nodeKey 전달
  // - dragend(취소) → null
  // - 에디터 바깥 클릭 → null
  const [focusedNodeKey, setFocusedNodeKey] = useState<string | null>(null);

  // drop 성공 플래그 (dragend 시 취소인지 성공인지 구분용)
  const dropSucceededRef = useRef(false);

  // ── heading tag 추적 (selection 기반, toolbar 전용) ──────────────────────

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel)) {
          setCurrentHeadingTag(null);
          return;
        }
        const topNode = sel.anchor.getNode().getTopLevelElement();
        setCurrentHeadingTag($isHeadingNode(topNode) ? topNode.getTag() : null);
      });
    });
  }, [editor]);

  // ── focusedNodeKey: 에디터 click 이벤트에서 DOM → nodeKey 직접 읽기 ──────

  useEffect(() => {
    return editor.registerRootListener((rootElement) => {
      if (!rootElement) return;
      const root = rootElement;

      function onClick(e: Event) {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        let key: string | null = null;
        editor.read(() => {
          const node = $getNearestNodeFromDOMNode(target);
          if (!node) return;
          const top = node.isInline() ? node.getTopLevelElement() : node;
          if (top) key = top.getKey();
        });
        if (key) setFocusedNodeKey(key);
      }

      // 에디터/툴바 바깥 클릭 시 커서 인디케이터 제거
      function onDocClick(e: Event) {
        const target = e.target as HTMLElement | null;
        if (root.contains(target)) return;
        if (target?.closest("[data-block-toolbar]") || target?.closest("[data-drag-handle]")) return;
        setFocusedNodeKey(null);
      }

      root.addEventListener("click", onClick);
      document.addEventListener("click", onDocClick, true);

      return () => {
        root.removeEventListener("click", onClick);
        document.removeEventListener("click", onDocClick, true);
      };
    });
  }, [editor]);

  // ── drag/drop 이벤트에서 focusedNodeKey 관리 ────────────────────────────
  // Firefox: drag handle mousedown → blur → dragstart 순서로 발생.
  // blur 시 Lexical이 $setSelection(null)을 호출하지만,
  // focusedNodeKey는 Lexical selection과 독립이므로 영향받지 않음.
  // drop 성공/취소는 onDropped / dragend 이벤트로 구분.

  const handleDragStarted = useCallback((key: string) => {
    dropSucceededRef.current = false;
    setFocusedNodeKey(key);
    // Firefox blur로 에디터 포커스가 빠진 경우 복구
    editor.focus();
  }, [editor]);

  const handleDropped = useCallback((key: string) => {
    dropSucceededRef.current = true;
    setFocusedNodeKey(key);
    // drop 후 에디터 포커스 복구
    editor.focus();
  }, [editor]);

  useEffect(() => {
    function onDragEnd() {
      if (!dropSucceededRef.current) {
        // drag 취소: 커서 인디케이터 제거
        setFocusedNodeKey(null);
      }
      dropSucceededRef.current = false;
    }
    document.addEventListener("dragend", onDragEnd);
    return () => document.removeEventListener("dragend", onDragEnd);
  }, []);

  // Collect slash menu items from all registered extensions
  const slashMenuItems = useMemo<SlashMenuItem[]>(
    () => extensions.flatMap((ext) => ext.slashMenuItems ?? []),
    [extensions],
  );

  // Toggle heading: if already at this level, revert to paragraph.
  // newNode.select() preserves selection after replace to avoid Lexical error.
  const toggleHeading = useCallback(
    (tag: HeadingTagType) => {
      editor.update(() => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel)) return;
        const topNode = sel.anchor.getNode().getTopLevelElementOrThrow();
        const newNode = ($isHeadingNode(topNode) && topNode.getTag() === tag)
          ? $createParagraphNode()
          : $createHeadingNode(tag);
        topNode.replace(newNode);
        newNode.select();
      });
    },
    [editor],
  );

  return (
    <>
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      {toolbarContent === false ? null : toolbarContent !== undefined ? (
        <div className="jikjo-toolbar">
          {toolbarContent}
        </div>
      ) : (
        <div className="jikjo-toolbar">
          {/* Format group */}
          <div className="jikjo-toolbar__group">
            <ToolbarButton
              label="Bold"
              isActive={selection.format.bold}
              onMouseDown={(e) => { e.preventDefault(); selection.toggleFormat("bold"); }}
            >
              <Bold size={14} strokeWidth={2.5} />
            </ToolbarButton>
            <ToolbarButton
              label="Italic"
              isActive={selection.format.italic}
              onMouseDown={(e) => { e.preventDefault(); selection.toggleFormat("italic"); }}
            >
              <Italic size={14} strokeWidth={2.5} />
            </ToolbarButton>
            <ToolbarButton
              label="Underline"
              isActive={selection.format.underline}
              onMouseDown={(e) => { e.preventDefault(); selection.toggleFormat("underline"); }}
            >
              <Underline size={14} strokeWidth={2.5} />
            </ToolbarButton>
            <ToolbarButton
              label="Strikethrough"
              isActive={selection.format.strikethrough}
              onMouseDown={(e) => { e.preventDefault(); selection.toggleFormat("strikethrough"); }}
            >
              <Strikethrough size={14} strokeWidth={2.5} />
            </ToolbarButton>
            <ToolbarButton
              label="Code"
              isActive={selection.format.code}
              onMouseDown={(e) => { e.preventDefault(); selection.toggleFormat("code"); }}
            >
              <Code size={14} strokeWidth={2.5} />
            </ToolbarButton>
          </div>

          <div className="jikjo-toolbar__separator" />

          {/* Heading group */}
          <div className="jikjo-toolbar__group">
            <ToolbarButton
              label="Heading 1"
              isActive={currentHeadingTag === "h1"}
              onMouseDown={(e) => { e.preventDefault(); toggleHeading("h1"); }}
            >
              <Heading1 size={15} strokeWidth={2} />
            </ToolbarButton>
            <ToolbarButton
              label="Heading 2"
              isActive={currentHeadingTag === "h2"}
              onMouseDown={(e) => { e.preventDefault(); toggleHeading("h2"); }}
            >
              <Heading2 size={15} strokeWidth={2} />
            </ToolbarButton>
            <ToolbarButton
              label="Heading 3"
              isActive={currentHeadingTag === "h3"}
              onMouseDown={(e) => { e.preventDefault(); toggleHeading("h3"); }}
            >
              <Heading3 size={15} strokeWidth={2} />
            </ToolbarButton>
          </div>
        </div>
      )}

      {/* ── Floating overlays ────────────────────────────────────────── */}
      {features.includes("bubbleMenu") && (
        <BubbleMenu
          isVisible={selection.isActive}
          format={selection.format}
          onToggleFormat={selection.toggleFormat}
          editor={editor}
        />
      )}

      {features.includes("slashCommand") && (
        <SlashMenu
          isVisible={slashCommand.isActive}
          query={slashCommand.query}
          items={slashMenuItems}
          editor={editor}
          onClose={slashCommand.close}
        />
      )}

      {/* drag handle + + 버튼 + 커서 인디케이터 */}
      <BlockToolbar
        isVisible={blockHover.isActive && (features.includes("blockHandle") || features.includes("inlineAdd"))}
        nodeKey={blockHover.nodeKey}
        focusedNodeKey={focusedNodeKey}
        items={slashMenuItems}
        editor={editor}
        showDragHandle={features.includes("blockHandle")}
        showAddButton={features.includes("inlineAdd")}
        onDragStarted={handleDragStarted}
        onDropped={handleDropped}
      />
    </>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export function EditorUI({
  extensions = defaultExtensions,
  namespace = "jikjo",
  toolbarContent,
  className,
  features = [...ALL_FEATURES],
}: EditorUIProps) {
  const hasBlockToolbar = features.includes("blockHandle") || features.includes("inlineAdd");
  return (
    <div
      className={className}
      {...(hasBlockToolbar ? { "data-has-block-toolbar": "" } : {})}
      // block toolbar가 있을 때만 좌측 74px padding을 주입
      // (GUTTER_LEFT 6 + 2×BTN 48 + GAP 4 = 58px toolbar + 16px text padding)
      style={hasBlockToolbar ? ({
        "--jikjo-content-pl": "74px",
        "--jikjo-placeholder-pl": "74px",
      } as React.CSSProperties) : ({
        "--jikjo-content-pl": "16px",
        "--jikjo-placeholder-pl": "16px",
      } as React.CSSProperties)}
    >
      <Editor extensions={extensions} namespace={namespace}>
        <EditorInner
          extensions={extensions}
          toolbarContent={toolbarContent}
          features={features}
        />
      </Editor>
    </div>
  );
}
