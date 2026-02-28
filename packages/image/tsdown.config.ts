import { defineConfig } from 'tsdown'
import LightningCSS from 'unplugin-lightningcss/rolldown'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  hash: false,
  external: ['react', 'react-dom', 'lexical', '@lexical/react', '@jikjo/core'],
  outDir: 'dist',
  plugins: [
    LightningCSS(),
  ],
})
