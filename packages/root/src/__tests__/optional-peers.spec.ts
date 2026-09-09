import { execFileSync } from 'child_process';
import path from 'path';

/**
 * bull, bullmq and ioredis are optional peer dependencies. An app that only
 * uses BullMQ has no reason to install bull, so importing this package must not
 * pull it in. This runs a child node process where requiring those modules
 * throws, and asserts the package still loads.
 */
const distEntry = path.resolve(__dirname, '../../dist/index.js');

const script = `
const Module = require('module');
const blocked = new Set(['bull', 'bullmq', 'ioredis']);
const original = Module._load;
Module._load = function (request, ...rest) {
  if (blocked.has(request)) {
    throw new Error('MODULE_NOT_FOUND: ' + request);
  }
  return original.call(this, request, ...rest);
};
const pkg = require(${JSON.stringify(distEntry)});
if (typeof pkg.BullMQAdapter !== 'function') throw new Error('BullMQAdapter missing');
if (typeof pkg.BullAdapter !== 'function') throw new Error('BullAdapter missing');
if (typeof pkg.BullMonitor !== 'function') throw new Error('BullMonitor missing');
console.log('ok');
`;

describe('optional peer dependencies', () => {
  it('loads without bull, bullmq or ioredis installed', () => {
    const output = execFileSync(process.execPath, ['-e', script], {
      encoding: 'utf8',
    });
    expect(output.trim()).toBe('ok');
  });
});
