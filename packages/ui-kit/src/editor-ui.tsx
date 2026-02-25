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
import { useCallback, useMemo, type ReactNode } from "react";
import { tv } from "tailwind-variants";
import { BubbleMenu } from "./components/bubble-menu";
import { InlineAddButton } from "./components/inline-add-button";
import { SlashMenu } from "./components/slash-menu";

// ─── Styles ───────────────────────────────────────────────────────────────────

const toolbarBtn = tv({
  base: [
    "flex items-center justify-center",
    "w-8 h-8 rounded-md",
    "text-zinc-500 transition-all duration-100",
    "hover:bg-zinc-800 hover:text-zinc-200",
    "data-[active=true]:bg-zinc-700/80 data-[active=true]:text-zinc-100",
  ],
});

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
  /** BlockHandle의 블록 왼쪽 엣지 기준 X 오프셋(px) */
  handleOffsetX?: number;
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
  handleOffsetX?: number;
  features: Array<"blockHandle" | "inlineAdd" | "slashCommand" | "bubbleMenu">;
}

function EditorInner({
  extensions,
  toolbarContent,
  handleOffsetX,
  features,
}: EditorInnerProps) {
  const [editor] = useLexicalComposerContext();

  const selection = useSelectionPlugin();
  const slashCommand = useSlashCommandPlugin();
  const blockHover = useBlockHoverPlugin();

  // Collect slash menu items from all registered extensions
  const slashMenuItems = useMemo<SlashMenuItem[]>(
    () => extensions.flatMap((ext) => ext.slashMenuItems ?? []),
    [extensions],
  );

  // Toggle heading: if already at this level, revert to paragraph
  const toggleHeading = useCallback(
    (tag: HeadingTagType) => {
      editor.update(() => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel)) return;
        const topNode = sel.anchor.getNode().getTopLevelElementOrThrow();
        if ($isHeadingNode(topNode) && topNode.getTag() === tag) {
          topNode.replace($createParagraphNode());
        } else {
          topNode.replace($createHeadingNode(tag));
        }
      });
    },
    [editor],
  );

  return (
    <>
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      {toolbarContent === false ? null : toolbarContent !== undefined ? (
        <div className="flex items-center gap-0.5 px-4 py-2 border-b border-zinc-800/50">
          {toolbarContent}
        </div>
      ) : (
        <div className="flex items-center gap-0.5 px-4 py-2 border-b border-zinc-800/50">
          {/* Format group */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              aria-label="Bold"
              onMouseDown={(e) => { e.preventDefault(); selection.toggleFormat("bold"); }}
              data-active={selection.format.bold}
              className={toolbarBtn()}
            >
              <Bold size={14} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-label="Italic"
              onMouseDown={(e) => { e.preventDefault(); selection.toggleFormat("italic"); }}
              data-active={selection.format.italic}
              className={toolbarBtn()}
            >
              <Italic size={14} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-label="Underline"
              onMouseDown={(e) => { e.preventDefault(); selection.toggleFormat("underline"); }}
              data-active={selection.format.underline}
              className={toolbarBtn()}
            >
              <Underline size={14} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-label="Strikethrough"
              onMouseDown={(e) => { e.preventDefault(); selection.toggleFormat("strikethrough"); }}
              data-active={selection.format.strikethrough}
              className={toolbarBtn()}
            >
              <Strikethrough size={14} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-label="Code"
              onMouseDown={(e) => { e.preventDefault(); selection.toggleFormat("code"); }}
              data-active={selection.format.code}
              className={toolbarBtn()}
            >
              <Code size={14} strokeWidth={2.5} />
            </button>
          </div>

          <div className="w-px h-4 bg-zinc-800 mx-1" />

          {/* Heading group */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              aria-label="Heading 1"
              onMouseDown={(e) => { e.preventDefault(); toggleHeading("h1"); }}
              className={toolbarBtn()}
            >
              <Heading1 size={15} strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Heading 2"
              onMouseDown={(e) => { e.preventDefault(); toggleHeading("h2"); }}
              className={toolbarBtn()}
            >
              <Heading2 size={15} strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Heading 3"
              onMouseDown={(e) => { e.preventDefault(); toggleHeading("h3"); }}
              className={toolbarBtn()}
            >
              <Heading3 size={15} strokeWidth={2} />
            </button>
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

      {/* BlockHandle + InlineAddButton: hover한 블록 옆에 drag handle과 + 버튼 함께 표시 */}
      {(features.includes("blockHandle") || features.includes("inlineAdd")) && (
        <InlineAddButton
          isVisible={blockHover.isActive}
          nodeKey={blockHover.nodeKey}
          items={slashMenuItems}
          editor={editor}
          showDragHandle={features.includes("blockHandle")}
          showAddButton={features.includes("inlineAdd")}
        />
      )}
    </>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export function EditorUI({
  extensions = defaultExtensions,
  namespace = "jikjo",
  toolbarContent,
  className,
  handleOffsetX,
  features = [...ALL_FEATURES],
}: EditorUIProps) {
  return (
    <div className={className}>
      <Editor extensions={extensions} namespace={namespace}>
        <EditorInner
          extensions={extensions}
          toolbarContent={toolbarContent}
          handleOffsetX={handleOffsetX}
          features={features}
        />
      </Editor>
    </div>
  );
}
