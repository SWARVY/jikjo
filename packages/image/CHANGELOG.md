# @jikjo/image

## 0.4.0

### Minor Changes

- cb7e522: Add read-only mode: pass `editable` from `editor.isEditable()` into `ImageComponent` to suppress AlignToolbar, ResizeHandles, caption editing, and all insert commands when the editor is not editable. Also fixes the image upload dialog visibility by rendering it via `createPortal(document.body)`.

## 0.3.0

### Minor Changes

- 07a3b05: refactor(image): replace inline styles with CSS Modules and CSS variables

## 0.2.1

### Patch Changes

- Updated dependencies [ed4bcb9]
  - @jikjo/core@0.3.0

## 0.2.0

### Minor Changes

- 9e368ab: Add block toolbar with drag & drop, image extension, and Shift+Enter block continuation

### Patch Changes

- Updated dependencies [9e368ab]
  - @jikjo/core@0.2.0
