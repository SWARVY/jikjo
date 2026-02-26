'use client'

import { createElement } from 'react'
import type { Extension } from '@jikjo/core'
import { ImageNode } from './node/image-node'
import { ImagePlugin, openImageDialog, registerOpenImageDialog } from './plugins/image-plugin'
import type { ImageExtensionOptions } from './types'

// ─── Icon ─────────────────────────────────────────────────────────────────────

// lucide-react를 peer dep으로 추가하지 않고 SVG를 직접 인라인한다.
const ImageIcon = createElement(
  'svg',
  {
    xmlns: 'http://www.w3.org/2000/svg',
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  },
  createElement('rect', { width: 18, height: 18, x: 3, y: 3, rx: 2, ry: 2 }),
  createElement('circle', { cx: 9, cy: 9, r: 2 }),
  createElement('path', { d: 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21' }),
)

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createImageExtension(options: ImageExtensionOptions = {}): Extension {
  return {
    name: 'image',
    nodes: [ImageNode],
    plugins: [
      createElement(ImagePlugin, {
        options,
        onRegisterOpen: registerOpenImageDialog,
      }),
    ],
    slashMenuItems: [
      {
        id: 'image',
        label: 'Image',
        description: 'Insert an image via file upload or drag and drop',
        icon: ImageIcon,
        onSelect: () => {
          // SlashMenu가 닫힌 뒤 다이얼로그를 열어야 하므로 한 프레임 지연
          requestAnimationFrame(() => openImageDialog())
        },
      },
    ],
  }
}
