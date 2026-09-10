/**
 * Publishes every package to npm in dependency order.
 *
 * npm requires a one-time password for a direct publish. Run this from your own
 * terminal and npm will email the code and prompt for it:
 *
 *   npm run publish:all
 *
 * Non-interactive alternatives:
 *
 *   npm run publish:all -- --otp=123456      # code from the email
 *   NPM_TOKEN=npm_xxx npm run publish:all    # granular token, bypass 2FA
 *   npm run publish:all -- --dry-run
 *
 * The prompt only works when a terminal is attached, so the OTP is asked once
 * and reused for every package in the run.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');
const otpArg = process.argv.find((a) => a.startsWith('--otp='));
const otp = otpArg ? otpArg.slice('--otp='.length) : undefined;
const token = process.env.NPM_TOKEN;
const interactive = process.stdin.isTTY && process.stdout.isTTY;

if (!token && !otp && !dryRun && !interactive) {
  console.error(
    'npm needs a one-time password to publish, and there is no terminal to ask on.\n' +
      'Run this from your own terminal, or pass the code from the email:\n' +
      '  npm run publish:all -- --otp=123456\n' +
      'or use a granular token with bypass 2FA:\n' +
      '  NPM_TOKEN=npm_xxx npm run publish:all'
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
    if (otp) args.push(`--otp=${otp}`);

    process.stdout.write(`publishing ${manifest.name}@${manifest.version} ... `);
    try {
      execFileSync('npm', args, {
        cwd: dir,
        // inherit when npm may need to prompt for the one-time password
        stdio: token || otp || dryRun ? ['ignore', 'ignore', 'pipe'] : 'inherit',
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
