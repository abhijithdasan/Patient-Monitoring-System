// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  css: {
    postcss: {
      plugins: [
        // Remove any tailwindcss plugin if it exists
      ],
    },
  },
});
