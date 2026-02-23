import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

// Plugin order: tanstackRouter → react → tailwindcss
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@jikjo/core": path.resolve(__dirname, "../../packages/core/src/index.ts"),
      "@jikjo/ui-kit": path.resolve(__dirname, "../../packages/ui-kit/src/index.ts"),
    },
  },
});
