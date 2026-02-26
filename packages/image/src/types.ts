// ─── Upload Adapter ───────────────────────────────────────────────────────────

/**
 * Adapter that uploads a file and returns a publicly accessible URL.
 * Implement this interface and pass it to createImageExtension().
 *
 * @example
 * const adapter: ImageUploadAdapter = {
 *   upload: async (file) => {
 *     const form = new FormData()
 *     form.append('file', file)
 *     const res = await fetch('/api/upload', { method: 'POST', body: form })
 *     const { url } = await res.json()
 *     return url
 *   }
 * }
 */
export interface ImageUploadAdapter {
  upload: (file: File) => Promise<string>
}

// ─── Extension Options ────────────────────────────────────────────────────────

export interface ImageExtensionOptions {
  /**
   * File upload adapter. When omitted, the file input UI is disabled.
   */
  uploadAdapter?: ImageUploadAdapter
  /** Accepted MIME types. Defaults to image/* */
  accept?: string
  /** Maximum upload file size in bytes. Defaults to 10MB */
  maxFileSize?: number
}

// ─── Node Payload ─────────────────────────────────────────────────────────────

export interface ImagePayload {
  src: string
  alt?: string
  caption?: string
  width?: number
  /** 'left' | 'center' | 'right'. Defaults to 'center' */
  alignment?: ImageAlignment
}

export type ImageAlignment = 'left' | 'center' | 'right'
