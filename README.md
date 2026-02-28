# jikjo

A headless, framework-agnostic rich text editor built on [Lexical](https://lexical.dev/). Provides a plugin-based extension system, a ready-to-use UI kit, and optional add-ons like image handling — all as independently publishable npm packages.

## Packages

| Package | Version | Description |
|---|---|---|
| [`@jikjo/core`](./packages/core) | [![npm](https://img.shields.io/npm/v/@jikjo/core)](https://www.npmjs.com/package/@jikjo/core) | Headless editor core: `<Editor>`, plugin hooks, extension API |
| [`@jikjo/ui-kit`](./packages/ui-kit) | [![npm](https://img.shields.io/npm/v/@jikjo/ui-kit)](https://www.npmjs.com/package/@jikjo/ui-kit) | Pre-built editor UI with toolbar, bubble menu, slash command, and block toolbar |
| [`@jikjo/image`](./packages/image) | [![npm](https://img.shields.io/npm/v/@jikjo/image)](https://www.npmjs.com/package/@jikjo/image) | Image extension with file upload, drag & drop, clipboard paste, resize, and alignment |

## Features

### `@jikjo/core`

- **`<Editor>`** — thin wrapper around `LexicalComposer` with a declarative `extensions` prop
- **Extension API** — compose nodes, plugins, and slash menu items into a single object
- **Built-in hooks**
  - `useSelectionPlugin` — tracks active text format (bold, italic, etc.)
  - `useSlashCommandPlugin` — detects `/` trigger and manages query state
  - `useBlockHoverPlugin` — tracks which block the cursor is hovering over
- **Built-in extensions** — `richTextExtension`, `historyExtension`

### `@jikjo/ui-kit`

- **`<EditorUI>`** — full-featured editor with all UI wired up out of the box
- **Toolbar** — bold, italic, underline, strikethrough, code, H1/H2/H3
- **Bubble menu** — floating format toolbar on text selection
- **Slash command menu** — `/` to open an inline command palette
- **Block toolbar** — drag handle for reordering blocks, `+` button to insert new blocks
- **Feature flags** — selectively enable/disable `blockHandle`, `inlineAdd`, `slashCommand`, `bubbleMenu`
- **Customizable** — pass `toolbarContent` to replace the default toolbar, or `false` to hide it entirely

### `@jikjo/image`

- **File upload** — click to open file picker, with configurable `accept` and `maxFileSize`
- **Drag & drop** — drop image files directly into the editor
- **Clipboard paste** — paste images from clipboard
- **Upload adapter** — bring your own upload logic via `ImageUploadAdapter`
- **Resize** — drag handles to resize inserted images
- **Alignment** — left / center / right alignment toolbar on selection
- **Caption** — editable caption below each image

## Quick Start

```bash
pnpm add @jikjo/core @jikjo/ui-kit
```

```tsx
import { EditorUI } from '@jikjo/ui-kit'
import '@jikjo/ui-kit/styles.css'

export default function App() {
  return <EditorUI />
}
```

> `@jikjo/ui-kit/styles.css` contains all UI kit component styles. Import it once at your app's entry point (e.g. `main.tsx`, `layout.tsx`, or a global CSS file). No Tailwind CSS setup is required.

### With image support

```bash
pnpm add @jikjo/image
```

```tsx
import { EditorUI } from '@jikjo/ui-kit'
import { createImageExtension } from '@jikjo/image'

const imageExtension = createImageExtension({
  uploadAdapter: {
    upload: async (file) => {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const { url } = await res.json()
      return url
    },
  },
})

export default function App() {
  return <EditorUI extensions={[imageExtension]} />
}
```

### Theming

`@jikjo/ui-kit` ships with a dark theme by default, defined via CSS custom properties. Override these variables to apply your own theme:

```css
/* your global CSS file */
:root {
  --jikjo-toolbar-border: rgba(228, 228, 231, 0.8); /* toolbar bottom border + separator */
  --jikjo-menu-bg: #ffffff;               /* floating menu background */
  --jikjo-menu-shadow: rgba(0, 0, 0, 0.15); /* floating menu shadow */
  --jikjo-menu-item-text: #52525b;        /* menu item default text */
  --jikjo-menu-item-text-active: #18181b; /* menu item highlighted text */
  --jikjo-menu-item-bg-active: #f4f4f5;   /* menu item highlighted background */
  --jikjo-menu-divider: #e4e4e7;          /* divider between menu sections */
  --jikjo-accent: #6366f1;               /* accent color (cursor indicator, drop line) */
  --jikjo-btn-text: #71717a;             /* toolbar button icon color */
  --jikjo-btn-bg-hover: #f4f4f5;         /* toolbar button hover background */
  --jikjo-btn-text-hover: #18181b;       /* toolbar button hover icon color */
  --jikjo-btn-bg-active: #e4e4e7;        /* bubble menu button active background */
  --jikjo-btn-text-active: #18181b;      /* bubble menu button active icon color */
}
```

You can scope overrides to a container or use `@media (prefers-color-scheme)` for automatic light/dark switching:

```css
@media (prefers-color-scheme: light) {
  :root {
    --jikjo-toolbar-border: rgba(228, 228, 231, 0.8);
    --jikjo-menu-bg: #ffffff;
    --jikjo-menu-shadow: rgba(0, 0, 0, 0.1);
    --jikjo-menu-item-text: #52525b;
    --jikjo-menu-item-text-active: #18181b;
    --jikjo-menu-item-bg-active: #f4f4f5;
    --jikjo-menu-divider: #e4e4e7;
    --jikjo-accent: #6366f1;
    --jikjo-btn-text: #71717a;
    --jikjo-btn-bg-hover: #f4f4f5;
    --jikjo-btn-text-hover: #18181b;
    --jikjo-btn-bg-active: #e4e4e7;
    --jikjo-btn-text-active: #18181b;
  }
}
```

### Headless usage

```tsx
import { Editor, richTextExtension, historyExtension } from '@jikjo/core'

export default function App() {
  return (
    <Editor extensions={[richTextExtension, historyExtension]}>
      {/* your custom UI here */}
    </Editor>
  )
}
```

## Development

```bash
pnpm install
pnpm dev           # start all packages in watch mode
pnpm build         # build all packages
pnpm check-types   # typecheck all packages
```

To run the playground:

```bash
pnpm --filter @jikjo/playground dev
```

## Publishing

This repo uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing.

```bash
pnpm changeset        # describe your changes
pnpm changeset version # bump versions and update changelogs
pnpm release          # publish to npm
```

Releases are automated via GitHub Actions on push to `main`.

## License

MIT
