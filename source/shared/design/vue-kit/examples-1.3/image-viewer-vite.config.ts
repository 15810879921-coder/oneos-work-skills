import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root,
  plugins: [vue()],
  resolve: { dedupe: ['vue'] },
  server: { host: '127.0.0.1', port: 51830, strictPort: true, fs: { allow: [resolve(root, '../../../..')] } },
  build: {
    outDir: process.env.ONEOS_IMAGE_VIEWER_OUTDIR || resolve(root, '../../../../../.axhub/make/validation/image-viewer-20260923/vue-dist'),
    emptyOutDir: true,
    reportCompressedSize: false,
    rollupOptions: { input: resolve(root, 'image-viewer.html') },
  },
});
