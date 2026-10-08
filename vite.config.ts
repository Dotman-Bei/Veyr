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
        // React and UI vendors in long-lived cacheable chunks. The GenLayer SDK is
        // dynamically imported (src/lib/genlayer.ts) and gets its own lazy chunk;
        // a manual group for it would also capture Vite's preload helper and drag
        // the whole SDK back into the critical path.
        codeSplitting: {
          groups: [
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
