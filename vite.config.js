import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import manifest from 'rollup-plugin-output-manifest';

export default defineConfig({
  plugins: [react(), manifest({nameWithExt: false, filter: () => true})],
  build: {
    assetsInlineLimit: 0,
    outDir: "./public",
    rollupOptions: {
      input: {
        app: "./index.html",
        sw: "./src/js/sw.js",
      },
      output: {
        entryFileNames: assetInfo => assetInfo.name == "sw" ? "[name].js" : "assets/js/[name]-[hash].js",
        manualChunks(id) {
          if (id.includes('react')) {
            return 'react';
          }
        },
      },
    },
  },
  publicDir: "./static",
});
