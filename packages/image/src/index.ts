// Extension factory
export { createImageExtension } from './image-extension'

// Command (for manual dispatch)
export { INSERT_IMAGE_COMMAND } from './plugins/image-plugin'

// Node helpers
export { $createImageNode, $isImageNode, ImageNode } from './node/image-node'
export type { SerializedImageNode } from './node/image-node'

// Types
export type {
  ImageUploadAdapter,
  ImageExtensionOptions,
  ImagePayload,
  ImageAlignment,
} from './types'
