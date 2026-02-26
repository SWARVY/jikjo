'use client'

import {
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
  DecoratorNode,
} from 'lexical'
import { createElement, type JSX } from 'react'
import type { ImageAlignment, ImagePayload } from '../types'
import { ImageComponent } from '../components/image-component'

// ─── Serialized shape ─────────────────────────────────────────────────────────

export type SerializedImageNode = Spread<
  {
    src: string
    alt: string
    caption: string
    width: number | undefined
    alignment: ImageAlignment
  },
  SerializedLexicalNode
>

// ─── Node ─────────────────────────────────────────────────────────────────────

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string
  __alt: string
  __caption: string
  __width: number | undefined
  __alignment: ImageAlignment

  static getType(): string {
    return 'image'
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      {
        src: node.__src,
        alt: node.__alt,
        caption: node.__caption,
        width: node.__width,
        alignment: node.__alignment,
      },
      node.__key,
    )
  }

  static importJSON(serialized: SerializedImageNode): ImageNode {
    return $createImageNode({
      src: serialized.src,
      alt: serialized.alt,
      caption: serialized.caption,
      width: serialized.width,
      alignment: serialized.alignment,
    })
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    }
  }

  constructor(payload: ImagePayload, key?: NodeKey) {
    super(key)
    this.__src = payload.src
    this.__alt = payload.alt ?? ''
    this.__caption = payload.caption ?? ''
    this.__width = payload.width
    this.__alignment = payload.alignment ?? 'center'
  }

  exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      alt: this.__alt,
      caption: this.__caption,
      width: this.__width,
      alignment: this.__alignment,
    }
  }

  exportDOM(): DOMExportOutput {
    const img = document.createElement('img')
    img.setAttribute('src', this.__src)
    img.setAttribute('alt', this.__alt)
    if (this.__width) img.setAttribute('width', String(this.__width))
    return { element: img }
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement('span')
    span.className = 'jikjo-image-wrapper'
    return span
  }

  updateDOM(): boolean {
    return false
  }

  isInline(): boolean {
    return false
  }

  isIsolated(): boolean {
    return true
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  getSrc(): string { return this.__src }
  getAlt(): string { return this.__alt }
  getCaption(): string { return this.__caption }
  getWidth(): number | undefined { return this.__width }
  getAlignment(): ImageAlignment { return this.__alignment }

  // ── Setters ───────────────────────────────────────────────────────────────

  setSrc(src: string): void { this.getWritable().__src = src }
  setAlt(alt: string): void { this.getWritable().__alt = alt }
  setCaption(caption: string): void { this.getWritable().__caption = caption }
  setWidth(width: number | undefined): void { this.getWritable().__width = width }
  setAlignment(alignment: ImageAlignment): void { this.getWritable().__alignment = alignment }

  isKeyboardSelectable(): boolean {
    return true
  }

  // ── Decorator ─────────────────────────────────────────────────────────────

  decorate(editor: LexicalEditor): JSX.Element {
    return createElement(ImageComponent, {
      nodeKey: this.__key,
      src: this.__src,
      alt: this.__alt,
      caption: this.__caption,
      width: this.__width,
      alignment: this.__alignment,
      editor,
    })
  }
}

// ─── DOM conversion ───────────────────────────────────────────────────────────

function convertImageElement(domNode: Node): DOMConversionOutput | null {
  if (!(domNode instanceof HTMLImageElement)) return null
  const src = domNode.getAttribute('src')
  if (!src) return null
  return {
    node: $createImageNode({
      src,
      alt: domNode.getAttribute('alt') ?? '',
      width: domNode.width || undefined,
    }),
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function $createImageNode(payload: ImagePayload): ImageNode {
  return new ImageNode(payload)
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode
}
