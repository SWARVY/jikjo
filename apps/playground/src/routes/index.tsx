import { createFileRoute } from "@tanstack/react-router";
import { EditorUI } from "@jikjo/ui-kit";
import { Github } from "lucide-react";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

// ─── Header ───────────────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="fixed top-0 inset-x-0 z-40 border-b border-white/5 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-6 h-13 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold tracking-tight text-white">
            jikjo
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/25 font-medium tracking-wide">
            alpha
          </span>
        </div>

        <nav className="flex items-center gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <Github size={15} />
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="pt-28 pb-10 px-6 text-center">
      <div className="inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full border border-violet-500/25 bg-violet-500/8 text-violet-400 text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
        Lexical-powered · Headless · Extensible
      </div>

      <h1 className="text-4xl sm:text-[2.75rem] font-bold text-white tracking-tight leading-[1.15] mb-4">
        A rich text editor{" "}
        <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          without limits
        </span>
      </h1>

      <p className="max-w-lg mx-auto text-zinc-500 text-base leading-relaxed">
        Headless editor core built on Lexical with a Tiptap-inspired extension
        API. Bring your own styles, or use the built-in UI kit.
      </p>

      <div className="mt-5 flex items-center justify-center gap-3 text-xs text-zinc-600">
        <span>
          Type{" "}
          <kbd className="px-1 py-0.5 rounded bg-zinc-800/80 border border-zinc-700 text-zinc-400 font-mono">
            /
          </kbd>{" "}
          for commands
        </span>
        <span className="text-zinc-800">·</span>
        <span>Select text for the bubble toolbar</span>
        <span className="text-zinc-800">·</span>
        <span>
          Click{" "}
          <kbd className="px-1 py-0.5 rounded bg-zinc-800/80 border border-zinc-700 text-zinc-400 font-mono text-[10px]">
            +
          </kbd>{" "}
          to add a block
        </span>
      </div>
    </section>
  );
}

// ─── Editor container ─────────────────────────────────────────────────────────

function EditorContainer() {
  return (
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-3xl">
        <div
          className="
            rounded-xl overflow-hidden
            border border-zinc-800
            bg-zinc-900/60
            shadow-xl shadow-black/30
          "
        >
          <EditorUI className="flex flex-col" />
        </div>

        <p className="mt-4 text-center text-xs text-zinc-700">
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
            href="https://base-ui.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Base UI
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
        </p>
      </div>
    </section>
  );
}


// ─── Page ─────────────────────────────────────────────────────────────────────

function IndexPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <EditorContainer />
      </main>
    </div>
  );
}
