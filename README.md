<p align="center">
  <img src="./apps/playground/public/favicon.svg" alt="jikjo logo" width="88" height="88" />
</p>

# jikjo

A headless, framework-agnostic rich text editor built on [Lexical](https://lexical.dev/). Provides a plugin-based extension system, a ready-to-use UI kit, and optional add-ons like image handling — all as independently publishable npm packages.

## Packages

| Package | Version | Description |
|---|---|---|
| [`@jikjo/core`](./packages/core) | [![npm](https://img.shields.io/npm/v/@jikjo/core)](https://www.npmjs.com/package/@jikjo/core) | Headless editor core: `<Editor>`, plugin hooks, extension API, HTML/Markdown export |
| [`@jikjo/ui-kit`](./packages/ui-kit) | [![npm](https://img.shields.io/npm/v/@jikjo/ui-kit)](https://www.npmjs.com/package/@jikjo/ui-kit) | Pre-built editor UI with toolbar, bubble menu, slash command, and block toolbar |
| [`@jikjo/image`](./packages/image) | [![npm](https://img.shields.io/npm/v/@jikjo/image)](https://www.npmjs.com/package/@jikjo/image) | Image extension with file upload, drag & drop, clipboard paste, resize, and alignment |

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

### With image support

```bash
pnpm add @jikjo/image
```

```tsx
import { EditorUI } from '@jikjo/ui-kit'
import { createImageExtension } from '@jikjo/image'
import '@jikjo/ui-kit/styles.css'
import '@jikjo/image/styles.css'

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

For detailed props, theming variables, and advanced usage, see each package's README:

- [`packages/ui-kit/README.md`](./packages/ui-kit/README.md) — EditorUI props, feature flags, theming
- [`packages/image/README.md`](./packages/image/README.md) — upload adapter, programmatic insert, theming

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
pnpm changeset         # describe your changes
pnpm changeset version # bump versions and update changelogs
pnpm release           # publish to npm
```

Releases are automated via GitHub Actions on push to `main`.

## License

MIT
