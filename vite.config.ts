import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
