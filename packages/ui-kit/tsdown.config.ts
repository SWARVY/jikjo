import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  hash: false,
  external: [
    'react',
    'react-dom',
    'lexical',
    '@lexical/react',
    '@base-ui/react',
    'motion',
    'motion/react',
    'lucide-react',
  ],
  outDir: 'dist',
})
