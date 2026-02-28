# @jikjo/image

Image extension for jikjo. Supports file upload, drag & drop, clipboard paste, resize, alignment, and caption — with styles fully customizable via CSS custom properties.

## Installation

```bash
pnpm add @jikjo/image
```

## Usage

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

Import `@jikjo/image/styles.css` alongside `@jikjo/ui-kit/styles.css` at your app's entry point.

## Options

`createImageExtension(options?)` accepts:

| Option | Type | Default | Description |
|---|---|---|---|
| `uploadAdapter` | `ImageUploadAdapter` | — | Custom upload logic. When omitted, images are stored as local object URLs (temporary) |
| `accept` | `string` | `"image/*"` | Accepted MIME types for the file picker |
| `maxFileSize` | `number` | `10485760` (10 MB) | Maximum file size in bytes |

### Upload adapter

```ts
import type { ImageUploadAdapter } from '@jikjo/image'

const adapter: ImageUploadAdapter = {
  upload: async (file: File): Promise<string> => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const { url } = await res.json()
    return url  // must return the public URL of the uploaded image
  },
}
```

## Programmatic insert

Dispatch `INSERT_IMAGE_COMMAND` to insert an image without the dialog:

```ts
import { INSERT_IMAGE_COMMAND } from '@jikjo/image'

editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
  src: 'https://example.com/image.png',
  alt: 'An image',
  alignment: 'center',
})
```

## Theming

`@jikjo/image/styles.css` uses CSS custom properties for all colors. Override them to match your theme:

```css
:root {
  /* Dialog */
  --jikjo-dialog-bg: #ffffff;
  --jikjo-dialog-border: #e4e4e7;
  --jikjo-dialog-shadow: rgba(0, 0, 0, 0.1);
  --jikjo-dialog-text: #18181b;
  --jikjo-dialog-overlay-bg: rgba(0, 0, 0, 0.4);

  /* Drop zone */
  --jikjo-dropzone-border: #d4d4d8;
  --jikjo-dropzone-border-hover: #a1a1aa;
  --jikjo-dropzone-border-active: #6366f1;
  --jikjo-dropzone-bg-hover: #f4f4f5;
  --jikjo-dropzone-bg-active: rgba(99, 102, 241, 0.06);

  /* Accent */
  --jikjo-accent: #6366f1;
  --jikjo-accent-hover: #4f46e5;
  --jikjo-accent-text: #6366f1;

  /* Buttons */
  --jikjo-btn-text: #71717a;
  --jikjo-btn-text-hover: #18181b;
  --jikjo-btn-border: #e4e4e7;
  --jikjo-btn-border-hover: #a1a1aa;
  --jikjo-btn-bg-hover: #f4f4f5;

  /* Image component */
  --jikjo-image-outline: #6366f1;
  --jikjo-image-caption-color: #71717a;

  /* Align toolbar */
  --jikjo-align-bg: #ffffff;
  --jikjo-align-border: #e4e4e7;
  --jikjo-align-shadow: rgba(0, 0, 0, 0.1);
  --jikjo-align-btn-text: #71717a;
  --jikjo-align-btn-text-active: #6366f1;
  --jikjo-align-btn-bg-active: rgba(99, 102, 241, 0.1);

  /* Resize handle */
  --jikjo-resize-handle-bg: rgba(255, 255, 255, 0.85);
  --jikjo-resize-handle-border: rgba(0, 0, 0, 0.15);
  --jikjo-resize-handle-shadow: rgba(0, 0, 0, 0.1);

  /* Preview */
  --jikjo-preview-bg: #f4f4f5;
  --jikjo-preview-border: #e4e4e7;
  --jikjo-preview-overlay-bg: rgba(255, 255, 255, 0.7);

  /* Error */
  --jikjo-error-color: #ef4444;

  /* File icon */
  --jikjo-file-icon-color: #a1a1aa;
  --jikjo-file-icon-color-active: #818cf8;
}
```
