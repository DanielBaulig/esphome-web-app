import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import manifest from 'rollup-plugin-output-manifest';
import topLevelAwait from 'vite-plugin-top-level-await';

import fs from 'fs';

function esphomeWebConfigVirtualModules() {
  const cssModule = 'virtual:custom.css';
  const moduleIds = [cssModule];
  function resolveId(id) {
    return `\0${id}`;
  }

  const esphomeWebConfigPath = 'esphome-web.json';

  let esphomeWebConfig = {};
  if (fs.existsSync(esphomeWebConfigPath)) {
    esphomeWebConfig = JSON.parse(fs.readFileSync(esphomeWebConfigPath))
  }
  function generateCssModule() {
    const o = esphomeWebConfig.css || {};
    return `body { \n${Object.keys(o).map(k => `  ${k}: ${o[k]};\n`).join('')}}`;
  }

  return {
    name: 'esphome-web-config-virtual-modules-plugin',
    resolveId(id) {
      if (moduleIds.includes(id)) {
        return resolveId(id);
      }
    },
    transformIndexHtml(html) {
      if ('title' in esphomeWebConfig) {
        html = html.replace(
          /<title>(.*?)<\/title>/,
          `<title>${esphomeWebConfig.title}</title>`
        );
      }
      if (esphomeWebConfig.originTrialTokens?.pnaPermissionPromptToken) {
        html = html.replace(
          '<!-- %pnaPermissionPromptToken% -->',
          `<meta http-equiv="Origin-Trial" content="${esphomeWebConfig.originTrialTokens.pnaPermissionPromptToken}" />`,
        );
      }
      if (esphomeWebConfig.originTrialTokens?.pnaNonSecureToken) {
        html = html.replace(
          '<!-- %pnaNonSecureToken% -->',
          `<meta http-equiv="Origin-Trial" content="${esphomeWebConfig.originTrialTokens.pnaNonSecureToken}" />`,
        );
      }

      html = html.replace(
        /.*<!-- %(pnaNonSecureToken|pnaPermissionPromptToken)% -->.*\n/g,
        '',
      );

      return html;
    },
    async handleHotUpdate({file, modules, read, server}) {
      if (file.endsWith('esphome-web.json')) {
        // Refresh config cache
        esphomeWebConfig = JSON.parse(await read());
        // Find module in module graph
        const mod = server.moduleGraph.getModuleById(resolveId(cssModule));

        return [...modules, mod];
      }
    },
    load(id) {
      if (id === resolveId(cssModule)) {
        return generateCssModule();
      }
    },
  };
}

export default defineConfig({
  plugins: [
    esphomeWebConfigVirtualModules(),
    react(),
    manifest({nameWithExt: false, filter: () => true}),
    topLevelAwait(),
  ],
  build: {
    manifest: 'vite-manifest.json',
    outDir: "./public",
    rollupOptions: {
      input: {
        app: "./index.html",
        sw: "./src/sw.js",
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
  server: {
    headers: {
      'Content-Security-Policy': 'treat-as-public-address',
      'Service-Worker-Allowed': '/',
    },
  },
});
