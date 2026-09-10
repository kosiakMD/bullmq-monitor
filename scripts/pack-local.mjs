/**
 * Packs every publishable package into ./dist-packages with a stable file name.
 *
 * Consuming apps can then depend on the tarballs before anything is on npm:
 *
 *   "@bullmq-monitor/root": "file:../bullmq-monitor/dist-packages/bullmq-monitor-root.tgz"
 *
 * A tarball is used rather than a directory on purpose: npm copies it, so the
 * package resolves peer dependencies (nest, express, bullmq) from the consuming
 * app. A `file:` directory is symlinked instead, and would resolve them from
 * this repo, which produces confusing type mismatches.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'dist-packages');
const packagesDir = path.join(root, 'packages');

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const name of fs.readdirSync(packagesDir)) {
  const dir = path.join(packagesDir, name);
  const manifestPath = path.join(dir, 'package.json');
  if (!fs.existsSync(manifestPath)) continue;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.private) continue;

  execFileSync('npm', ['pack', '--pack-destination', outDir], {
    cwd: dir,
    stdio: 'ignore',
  });

  const versioned = `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`;
  const stable = `${manifest.name.replace('@', '').replace('/', '-')}.tgz`;
  fs.renameSync(path.join(outDir, versioned), path.join(outDir, stable));
  console.log(`packed ${manifest.name} -> dist-packages/${stable}`);
}
