# @jikjo/ui-kit

Pre-built editor UI for jikjo. Provides `<EditorUI>` with toolbar, bubble menu, slash command, and block toolbar — all styled with CSS custom properties and zero external CSS dependencies.

## Installation

```bash
pnpm add @jikjo/ui-kit
```

Peer dependencies:

```bash
pnpm add lexical @lexical/react @lexical/rich-text @base-ui/react motion
```

## Usage

```tsx
import { EditorUI } from '@jikjo/ui-kit'
import '@jikjo/ui-kit/styles.css'

export default function App() {
  return <EditorUI />
}
```

Import `@jikjo/ui-kit/styles.css` once at your app's entry point (`main.tsx`, `layout.tsx`, or a global CSS file).

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `extensions` | `Extension[]` | `[richTextExtension, historyExtension]` | Lexical extensions to load |
| `namespace` | `string` | `"jikjo"` | Lexical editor namespace |
| `toolbarContent` | `ReactNode \| false` | — | `undefined` = default toolbar, `false` = no toolbar, `ReactNode` = custom toolbar |
| `className` | `string` | — | Class applied to the root wrapper |
| `features` | `Feature[]` | all enabled | Selectively enable/disable `"blockHandle"`, `"inlineAdd"`, `"slashCommand"`, `"bubbleMenu"` |
| `editable` | `boolean` | `true` | `false` = read-only viewer (hides all editing UI) |
| `onEditor` | `(editor: LexicalEditor) => void` | — | Called once the Lexical editor instance is ready |

### Read-only viewer

```tsx
<EditorUI editable={false} />
```

When `editable` is `false`, the toolbar, bubble menu, slash command, and block toolbar are all hidden. Lexical's `editor.setEditable(false)` is called internally.

### Custom toolbar

```tsx
<EditorUI toolbarContent={<MyToolbar />} />
```

Pass `false` to remove the toolbar entirely:

```tsx
<EditorUI toolbarContent={false} />
```

### Accessing the editor instance

Use `onEditor` to get the Lexical editor instance for export or imperative operations:

```tsx
import { exportToHtml, exportToMarkdown } from '@jikjo/core'

function App() {
  return (
    <EditorUI
      onEditor={(editor) => {
        const html = exportToHtml(editor)
        const md = exportToMarkdown(editor)
      }}
    />
  )
}
```

## Theming

The default theme is dark. Override CSS custom properties to apply your own theme:

```css
/* your global CSS */
:root {
  --jikjo-toolbar-border: rgba(228, 228, 231, 0.8);
  --jikjo-menu-bg: #ffffff;
  --jikjo-menu-shadow: rgba(0, 0, 0, 0.15);
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
```

| Variable | Affects |
|---|---|
| `--jikjo-toolbar-border` | Top toolbar bottom border and separator |
| `--jikjo-menu-bg` | Bubble menu, slash command menu background |
| `--jikjo-menu-shadow` | Floating menu drop shadow |
| `--jikjo-menu-item-text` | Menu item default text color |
| `--jikjo-menu-item-text-active` | Menu item highlighted text color |
| `--jikjo-menu-item-bg-active` | Menu item highlighted background |
| `--jikjo-menu-divider` | Divider between menu sections |
| `--jikjo-accent` | Cursor indicator, drop line |
| `--jikjo-btn-text` | Toolbar / bubble menu button icon color |
| `--jikjo-btn-bg-hover` | Button hover background |
| `--jikjo-btn-text-hover` | Button hover icon color |
| `--jikjo-btn-bg-active` | Active button background (bold on, H1 selected, etc.) |
| `--jikjo-btn-text-active` | Active button icon color |

For automatic light/dark switching:

```css
@media (prefers-color-scheme: light) {
  :root {
    --jikjo-toolbar-border: rgba(228, 228, 231, 0.8);
    /* ... */
  }
}
```
