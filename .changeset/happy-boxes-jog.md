---
"@jikjo/image": minor
---

Add read-only mode: pass `editable` from `editor.isEditable()` into `ImageComponent` to suppress AlignToolbar, ResizeHandles, caption editing, and all insert commands when the editor is not editable. Also fixes the image upload dialog visibility by rendering it via `createPortal(document.body)`.
