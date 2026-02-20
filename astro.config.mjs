// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  devToolbar: {
    enabled: false
  },
  integrations: [react()],
  output: 'server',

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ['better-sqlite3'],
    },
    ssr: {
      external: ['better-sqlite3'],
    },
  },

  adapter: node({
    mode: 'standalone',
  }),
});