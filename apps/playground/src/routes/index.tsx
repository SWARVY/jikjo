import { createFileRoute } from "@tanstack/react-router";
import { EditorUI } from "@jikjo/ui-kit";
import { historyExtension, richTextExtension } from "@jikjo/core";
import type { Extension } from "@jikjo/core";
import { createImageExtension } from "@jikjo/image";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { EditorState, SerializedEditorState } from "lexical";
import {
  Github,
  Blocks,
  Layers,
  Code2,
  ChevronRight,
  Sparkles,
  Eye,
} from "lucide-react";
import {
  createElement,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

// ─── Header ───────────────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="fixed top-0 inset-x-0 z-40 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="/favicon.svg"
            alt="jikjo logo"
            className="w-6 h-6 rounded-md shadow-sm shadow-black/30"
          />
          <span className="text-[15px] font-semibold tracking-tight text-white">
            jikjo
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20 font-medium tracking-wide">
            alpha
          </span>
        </div>

        <nav className="flex items-center gap-2">
          <a
            href="https://github.com/SWARVY/jikjo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-md transition-colors"
          >
            <Github size={14} />
            GitHub
          </a>
          <a
            href="#demo"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white text-zinc-900 font-medium rounded-md hover:bg-zinc-100 transition-colors"
          >
            Try it free
            <ChevronRight size={13} />
          </a>
        </nav>
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative pt-32 pb-16 px-6 text-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative">
        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/8 text-violet-400 text-xs font-medium">
          <Sparkles size={11} />
          Lexical-powered · Headless · Extensible
        </div>

        <h1 className="text-5xl sm:text-[3.25rem] font-bold text-white tracking-tight leading-[1.1] mb-5">
          Build{" "}
          <em className="not-italic bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            rich text editors
          </em>
          <br />
          without limits
        </h1>

        <p className="max-w-xl mx-auto text-zinc-400 text-[1.0625rem] leading-relaxed mb-8">
          A headless editor core built on Lexical with an extension API. Bring
          your own styles, or drop in the built-in UI kit.
        </p>

        <div className="flex items-center justify-center gap-3">
          <a
            href="#demo"
            className="px-5 py-2.5 bg-white text-zinc-900 text-sm font-semibold rounded-lg hover:bg-zinc-100 transition-colors"
          >
            Get started
          </a>
          <a
            href="https://github.com/SWARVY/jikjo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-5 py-2.5 border border-zinc-700 text-zinc-300 text-sm font-medium rounded-lg hover:border-zinc-600 hover:text-white transition-colors"
          >
            <Github size={14} />
            Star on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Editor Previews ──────────────────────────────────────────────────────────

const imageExtension = createImageExtension();
const defaultExtensions: Extension[] = [richTextExtension, historyExtension];
const notionExtensions: Extension[] = [...defaultExtensions, imageExtension];

// Notion-like: full features — slash commands, inline + button, bubble menu, drag handle
function NotionLikePreview({
  onStateChange,
}: {
  onStateChange: (state: SerializedEditorState) => void;
}) {
  const handleChange = useCallback(
    (editorState: EditorState) => {
      onStateChange(editorState.toJSON());
    },
    [onStateChange],
  );

  const onChangeExtension = useMemo<Extension>(
    () => ({
      name: "notion-on-change",
      nodes: [],
      plugins: [createElement(OnChangePlugin, { onChange: handleChange })],
    }),
    [handleChange],
  );

  return (
    <EditorUI
      className="flex flex-col min-h-[480px]"
      extensions={[...notionExtensions, onChangeExtension]}
    />
  );
}

// Plugin that restores serialized editor state once on mount
function RestoreStatePlugin({ state }: { state: SerializedEditorState }) {
  const [editor] = useLexicalComposerContext();
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    queueMicrotask(() => {
      const parsed = editor.parseEditorState(state);
      editor.setEditorState(parsed);
    });
  }, [editor, state]);
  return null;
}

// Read-only: renders the last saved Notion-like editor state as a viewer
function ReadOnlyPreview({
  initialState,
}: {
  initialState: SerializedEditorState | null;
}) {
  const restoreExtension = useMemo<Extension | null>(() => {
    if (!initialState) return null;
    return {
      name: "restore-state",
      nodes: [],
      plugins: [createElement(RestoreStatePlugin, { state: initialState })],
    };
  }, [initialState]);

  return initialState && restoreExtension ? (
    <EditorUI
      key={JSON.stringify(initialState)}
      className="flex flex-col min-h-[480px]"
      extensions={[...notionExtensions, restoreExtension]}
      editable={false}
      toolbarContent={false}
    />
  ) : (
    <div className="flex flex-col items-center justify-center min-h-[480px] gap-3 text-zinc-600">
      <Eye size={28} strokeWidth={1.5} />
      <p className="text-sm">
        Type in{" "}
        <span className="text-zinc-400 font-medium">Notion-like editor</span> to
        preview read-only content.
      </p>
    </div>
  );
}

// Simple: text formatting only — no slash commands, no inline-add, no drag handle
function SimplePreview() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-2xl shadow-black/40">
      <EditorUI
        className="flex flex-col rounded-xl min-h-[480px]"
        features={["bubbleMenu"]}
      />
    </div>
  );
}

// Headless inner: mounts OnChangePlugin inside LexicalComposer via EditorUI extensions
function HeadlessInner({
  onStateChange,
}: {
  onStateChange: (json: string) => void;
}) {
  const handleChange = useCallback(
    (state: EditorState) => {
      onStateChange(JSON.stringify(state.toJSON(), null, 2));
    },
    [onStateChange],
  );

  const onChangeExtension = useMemo<Extension>(
    () => ({
      name: "on-change",
      nodes: [],
      plugins: [createElement(OnChangePlugin, { onChange: handleChange })],
    }),
    [handleChange],
  );

  return (
    <EditorUI
      className="flex flex-col flex-1"
      toolbarContent={false}
      features={[]}
      extensions={[...defaultExtensions, onChangeExtension]}
    />
  );
}

// Headless: raw editor + live JSON state side-by-side
function HeadlessPreview() {
  const [json, setJson] = useState<string>(() =>
    JSON.stringify(
      { root: { children: [{ type: "paragraph", children: [] }] } },
      null,
      2,
    ),
  );

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/60 shadow-2xl shadow-black/40">
      <div className="grid grid-cols-2 divide-x divide-zinc-800 min-h-[480px]">
        <div className="flex flex-col">
          <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            <span className="text-[11px] text-zinc-600 font-mono">editor</span>
          </div>
          <HeadlessInner onStateChange={setJson} />
        </div>
        <div className="flex flex-col">
          <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500/60" />
            <span className="text-[11px] text-zinc-600 font-mono">
              editor state (JSON)
            </span>
          </div>
          <pre className="flex-1 p-4 text-[11px] text-zinc-500 font-mono leading-relaxed overflow-auto">
            {json}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ─── Editor Switcher ──────────────────────────────────────────────────────────

type EditorTab = "notion-like" | "simple" | "headless";

interface TabConfig {
  id: EditorTab;
  label: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
}

const TABS: TabConfig[] = [
  {
    id: "notion-like",
    label: "Notion-like editor",
    icon: <Blocks size={14} />,
    description:
      "Editable view and read-only viewer are shown together so you can compare behavior in one screen.",
  },
  {
    id: "simple",
    label: "Simple editor",
    icon: <Layers size={14} />,
    description:
      "A minimal editor with only text formatting. No block commands — clean, distraction-free writing.",
  },
  {
    id: "headless",
    label: "Headless",
    icon: <Code2 size={14} />,
    description:
      "Zero UI. Type on the left and watch the live editor state update in real time on the right.",
    badge: "Core only",
  },
];

function EditorSwitcher() {
  const [active, setActive] = useState<EditorTab>("notion-like");
  const current = TABS.find((t) => t.id === active)!;
  const [notionState, setNotionState] = useState<SerializedEditorState | null>(
    null,
  );

  const handleNotionStateChange = useCallback(
    (state: SerializedEditorState) => {
      setNotionState(state);
    },
    [],
  );

  return (
    <section id="demo" className="px-6 pb-24">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-center gap-1 mb-8 p-1 bg-zinc-900 border border-zinc-800 rounded-xl w-fit mx-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={[
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                active === tab.id
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300",
              ].join(" ")}
            >
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/15 text-violet-400 border border-violet-500/20">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-zinc-500 mb-6 max-w-md mx-auto leading-relaxed">
          {current.description}
        </p>

        {/* Notion-like + read-only split view */}
        <div className={active === "notion-like" ? "" : "hidden"}>
          <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/60 shadow-2xl shadow-black/40">
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
              <div className="flex flex-col">
                <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500/60" />
                  <span className="text-[11px] text-zinc-600 font-mono">
                    notion-like editor
                  </span>
                </div>
                <NotionLikePreview onStateChange={handleNotionStateChange} />
              </div>
              <div className="flex flex-col">
                <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                  <span className="text-[11px] text-zinc-600 font-mono">
                    read-only viewer (editable=&#123;false&#125;)
                  </span>
                </div>
                <ReadOnlyPreview initialState={notionState} />
              </div>
            </div>
          </div>
        </div>
        {active === "simple" && <SimplePreview />}
        {active === "headless" && <HeadlessPreview />}

        {active === "notion-like" && (
          <div className="mt-5 flex items-center justify-center gap-5 text-xs text-zinc-700">
            <span>
              Type{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 font-mono">
                /
              </kbd>{" "}
              for commands
            </span>
            <span className="text-zinc-800">·</span>
            <span>Select text for the bubble toolbar</span>
            <span className="text-zinc-800">·</span>
            <span>
              Focus an empty line for{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 font-mono text-[10px]">
                +
              </kbd>
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700/80 hover:bg-zinc-900/70 transition-all duration-200">
      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-zinc-100 mb-1.5">{title}</h3>
      <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
    </div>
  );
}

function FeaturesSection() {
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white tracking-tight mb-3">
            Everything you need
          </h2>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            A complete set of primitives for building editors that feel great.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <FeatureCard
            icon={<Blocks size={15} />}
            title="Extension API"
            description="Add nodes, plugins, and slash commands via a simple extension interface. Compose only what you need."
          />
          <FeatureCard
            icon={<Sparkles size={15} />}
            title="Slash commands"
            description="Type / to open a searchable command palette. Register custom block types from any extension."
          />
          <FeatureCard
            icon={<Layers size={15} />}
            title="Bubble toolbar"
            description="A floating format toolbar appears on text selection. Bold, italic, underline, strikethrough, code."
          />
          <FeatureCard
            icon={<Code2 size={15} />}
            title="Headless core"
            description="All state is exposed as headless React hooks. Bring your own UI — no styles are forced on you."
          />
          <FeatureCard
            icon={<Github size={15} />}
            title="Lexical-powered"
            description="Built on Meta's Lexical — reliable, performant, and battle-tested in production at Facebook scale."
          />
          <FeatureCard
            icon={<ChevronRight size={15} />}
            title="TypeScript first"
            description="Full type safety throughout. Extensions, nodes, commands and hooks are all strongly typed."
          />
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-zinc-800/50 px-6 py-8">
      <div className="mx-auto max-w-4xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/favicon.svg"
            alt="jikjo logo"
            className="w-[18px] h-[18px] rounded"
          />
          <span className="text-sm font-semibold text-zinc-500">jikjo</span>
          <span className="text-zinc-800">·</span>
          <span className="text-xs text-zinc-700">alpha</span>
        </div>
        <p className="text-xs text-zinc-700">
          Powered by{" "}
          <a
            href="https://lexical.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Lexical
          </a>
          {" · "}
          <a
            href="https://motion.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Motion
          </a>
          {" · "}
          <a
            href="https://tailwindcss.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Tailwind CSS
          </a>
        </p>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function IndexPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <EditorSwitcher />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
