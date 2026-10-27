import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const root = fileURLToPath(new URL('.', import.meta.url));
const repository = resolve(root, '../../../..');
export default defineConfig({
  root,
  // Only this dedicated directory is searched for env files. No business proxy.
  envDir: root,
  plugins: [vue()],
  css: { postcss: { plugins: [] } },
  cacheDir: resolve(repository, 'node_modules/.vite-oneos-design'),
  resolve: {
    dedupe: ['vue'],
    alias: {
      'vxe-table': resolve(repository, 'packages/effects/plugins/node_modules/vxe-table'),
      'vxe-pc-ui': resolve(repository, 'packages/effects/plugins/node_modules/vxe-pc-ui'),
    },
  },
  server: { host: '127.0.0.1', port: 5670, strictPort: true, fs: { allow: [repository] } },
  build: { outDir: resolve(root, '.preview-dist'), emptyOutDir: true, reportCompressedSize: false },
});
