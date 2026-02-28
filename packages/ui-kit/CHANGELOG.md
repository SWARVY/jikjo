# @jikjo/ui-kit

## 0.5.0

### Minor Changes

- 3477f77: Extract top toolbar styles into CSS classes and expose them as CSS custom properties (`--jikjo-toolbar-border`, `--jikjo-btn-*`). The toolbar background, button colors, hover/active states, and border are now fully customizable without overriding component styles.
- ed4bcb9: Add `exportToHtml` and `exportToMarkdown` utilities. No need to install `@lexical/html` or `@lexical/markdown` separately — they are now bundled as dependencies of `@jikjo/core`.

### Patch Changes

- Updated dependencies [ed4bcb9]
  - @jikjo/core@0.3.0

## 0.4.0

### Minor Changes

- ece6037: Expose bubble menu button hover and active colors as CSS custom properties (`--jikjo-btn-bg-active`, `--jikjo-btn-text-active`), making the full bubble menu appearance themeable via CSS variables.

## 0.3.0

### Minor Changes

- 2015dea: Bundle self-contained CSS styles into the package so consumers no longer need Tailwind CSS configured in their project. Import `@jikjo/ui-kit/styles.css` once at your

## 0.2.1

### Patch Changes

- bed37cf: Add styles.css export for Tailwind CSS bundle

## 0.2.0

### Minor Changes

- 9e368ab: Add block toolbar with drag & drop, image extension, and Shift+Enter block continuation

### Patch Changes

- Updated dependencies [9e368ab]
  - @jikjo/core@0.2.0
