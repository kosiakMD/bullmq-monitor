/**
 * Publishes every package to npm in dependency order.
 *
 * Needs NPM_TOKEN: a granular access token with write access to the
 * @bullmq-monitor scope and "bypass 2FA" enabled, since npm refuses a plain
 * `npm publish` without either that or an OTP.
 *
 *   NPM_TOKEN=npm_xxx npm run publish:all
 *   NPM_TOKEN=npm_xxx npm run publish:all -- --dry-run
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');
const token = process.env.NPM_TOKEN;

if (!token && !dryRun) {
  console.error(
    'NPM_TOKEN is not set.\n' +
      'Create a granular access token with write access to the @bullmq-monitor\n' +
      'scope and "bypass 2FA" enabled: https://www.npmjs.com/settings/~/tokens/new\n' +
      'Then run: NPM_TOKEN=npm_xxx npm run publish:all'
  );
  process.exit(1);
}

// the adapters depend on root, so it goes first; ui is bundled into root but is
// published too, for anyone building their own dashboard
const ORDER = ['ui', 'root', 'express', 'nest', 'koa', 'fastify', 'hapi', 'cli'];

let npmrc;
if (token) {
  npmrc = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'bmm-npm-')), '.npmrc');
  fs.writeFileSync(npmrc, `//registry.npmjs.org/:_authToken=${token}\n`, {
    mode: 0o600,
  });
}

const published = [];
try {
  for (const name of ORDER) {
    const dir = path.join(root, 'packages', name);
    const manifest = JSON.parse(
      fs.readFileSync(path.join(dir, 'package.json'), 'utf8')
    );
    const args = ['publish', '--access', 'public'];
    if (dryRun) args.push('--dry-run');

    process.stdout.write(`publishing ${manifest.name}@${manifest.version} ... `);
    try {
      execFileSync('npm', args, {
        cwd: dir,
        stdio: ['ignore', 'ignore', 'pipe'],
        env: { ...process.env, ...(npmrc ? { npm_config_userconfig: npmrc } : {}) },
      });
      console.log('ok');
      published.push(manifest.name);
    } catch (e) {
      const stderr = String(e.stderr || '');
      if (stderr.includes('You cannot publish over the previously published')) {
        console.log('already published, skipping');
        continue;
      }
      console.log('FAILED');
      console.error(stderr.split('\n').filter((l) => l.includes('npm error')).slice(0, 6).join('\n'));
      process.exitCode = 1;
      break;
    }
  }
} finally {
  if (npmrc) fs.rmSync(path.dirname(npmrc), { recursive: true, force: true });
}

if (published.length) {
  console.log(`\npublished ${published.length} package(s):`);
  for (const name of published) console.log(`  https://www.npmjs.com/package/${name}`);
}
