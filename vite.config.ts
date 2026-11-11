import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Single-file build: the whole app (code, data, styles) in one index.html,
// so it runs offline and can be hosted anywhere, including as a claude.ai artifact.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: { target: 'es2019', assetsInlineLimit: 100000000 },
});
