import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { syncGenerated } from './sync-generated.mjs';
import { RUNTIME_VERSION } from './preferences.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const target = process.argv[2];
if (!target || !path.isAbsolute(target)) throw new Error('Provide an absolute, new package directory');
if (fs.existsSync(target)) throw new Error('Refusing to replace an existing package; verify its manifest first');
syncGenerated({ check: true });
const files = ['OneosDesignProvider.vue', 'theme.ts', 'base-theme.ts', 'host-theme-guard.ts', 'select-accessibility.ts', 'notice-theme.ts', 'preferences.mjs', 'preferences.d.mts', 'colors.mjs', 'colors.d.mts',
  'patterns.scoped.css', 'query.scoped.css', 'runtime.css', 'generated-sources.json', 'README.md',
  ...fs.readdirSync(path.join(here, 'fonts')).sort().map((name) => `fonts/${name}`)];
const hashes = {};
for (const name of files) {
  const data = fs.readFileSync(path.join(here, name));
  fs.mkdirSync(path.dirname(path.join(target, name)), { recursive: true });
  fs.writeFileSync(path.join(target, name), data);
  hashes[name] = createHash('sha256').update(data).digest('hex');
}
const packageHash = createHash('sha256').update(JSON.stringify(hashes)).digest('hex');
fs.writeFileSync(path.join(target, 'manifest.json'), JSON.stringify({
  schemaVersion: 1, name: 'oneos-design-runtime', version: RUNTIME_VERSION, packageHash,
  generatedAt: new Date().toISOString(), source: 'src/resources/design-system/vue-kit/runtime-v1',
  install: 'Add runtime-v1 as a new directory; do not overwrite existing oneos-design files or global imports.',
  peerDependencies: { vue: '3.5.42', 'ant-design-vue': '4.2.6', '@ctrl/tinycolor': '3.6.1' },
  files: hashes,
}, null, 2) + '\n');
console.log(JSON.stringify({ target, packageHash, files: files.length }));
