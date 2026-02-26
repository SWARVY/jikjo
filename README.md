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
import '@jikjo/ui-kit/styles' // if applicable

export default function App() {
  return <EditorUI />
}
```

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
