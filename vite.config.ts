import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Preload the Latin subsets of the two web fonts. The app paints only after its
 * JS runs, so fetching fonts in parallel means they are ready at first paint
 * and the headline never re-wraps (the main source of layout shift).
 */
function preloadFonts(): Plugin {
  const FONT = /(outfit|jetbrains-mono)-latin-wght-normal-[\w-]+\.woff2$/;
  let base = '/';
  return {
    name: 'veyr-preload-fonts',
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        const tags = Object.keys(ctx.bundle)
          .filter((file) => FONT.test(file))
          .map((file) => ({
            tag: 'link',
            attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: base + file, crossorigin: '' },
            injectTo: 'head-prepend' as const,
          }));
        return { html, tags };
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), preloadFonts()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      output: {
        // Keep the large GenLayer SDK (viem + chain ABIs) and React in their own
        // long-lived cacheable chunks, separate from app code.
        codeSplitting: {
          groups: [
            { name: 'genlayer', test: /node_modules[\\/](genlayer-js|viem|ox|abitype|@noble|@scure)/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'ui', test: /node_modules[\\/](@radix-ui|lucide-react|sonner)/ },
          ],
        },
      },
    },
    // The GenLayer SDK chunk is inherently large (embedded consensus ABIs).
    chunkSizeWarningLimit: 800,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
