/**
 * Boots every framework example against redis and checks that the dashboard,
 * its assets, the GraphQL API and the job name filter all respond.
 *
 * Run with: node scripts/smoke.mjs
 */
import { spawn } from 'node:child_process';
import process from 'node:process';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const TARGETS = [
  { name: 'express', port: 3000, base: '/admin/queues', cmd: ['npm', ['start', '-w', 'examples/express']] },
  { name: 'nest', port: 3001, base: '/admin/queues', cmd: ['npm', ['start', '-w', 'examples/nest']] },
  { name: 'koa', port: 3002, base: '/admin/queues', cmd: ['npm', ['start', '-w', 'examples/koa']] },
  { name: 'fastify', port: 3003, base: '/admin/queues', cmd: ['npm', ['start', '-w', 'examples/fastify']] },
  { name: 'hapi', port: 3005, base: '/admin/queues', cmd: ['npm', ['start', '-w', 'examples/hapi']] },
  { name: 'cli', port: 3006, base: '', cmd: ['node', ['packages/cli/dist/index.js', '-q', 'emails', '-p', '3006', '--redis-uri', REDIS_URL]] },
];

const BOOT_TIMEOUT_MS = 90_000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer(url) {
  const deadline = Date.now() + BOOT_TIMEOUT_MS;
  let lastError = 'timed out';
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
      lastError = `status ${res.status}`;
    } catch (e) {
      lastError = e.message;
    }
    await sleep(1000);
  }
  throw new Error(`server never became ready: ${lastError}`);
}

async function gql(endpoint, query, variables) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`graphql: ${json.errors.map((e) => e.message).join(', ')}`);
  }
  return json.data;
}

async function check({ name, port, base }) {
  const root = `http://localhost:${port}${base}`;
  await waitForServer(root || `http://localhost:${port}/`);

  const html = await (await fetch(root || `http://localhost:${port}/`)).text();
  if (!html.includes('bullmq-monitor:graphql')) {
    throw new Error('dashboard html is missing the graphql meta tag');
  }

  const asset = await fetch(`http://localhost:${port}${base}/ui/main.js`);
  if (!asset.ok) throw new Error(`ui asset returned ${asset.status}`);

  const endpoint = `http://localhost:${port}${base}/graphql`;
  const { queues } = await gql(endpoint, '{ queues { id name } }');
  if (!queues?.length) throw new Error('no queues exposed');

  const queue = queues[0].id;
  // the filter must survive the fromJSON path, which needs the status field
  const filtered = await gql(
    endpoint,
    'query($q: ID!, $n: String) { jobs(queue: $q, status: completed, limit: 5, name: $n) { id name status } }',
    { q: queue, n: 'send-' }
  );
  for (const job of filtered.jobs) {
    if (!job.name.includes('send-')) {
      throw new Error(`name filter returned an unrelated job: ${job.name}`);
    }
    if (!job.status) throw new Error(`job ${job.id} has no status`);
  }
  return filtered.jobs.length;
}

let failed = false;
for (const target of TARGETS) {
  const [bin, args] = target.cmd;
  const child = spawn(bin, args, {
    env: { ...process.env, REDIS_URL, PORT: String(target.port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (d) => (output += d));
  child.stderr.on('data', (d) => (output += d));

  try {
    const matched = await check(target);
    console.log(`ok   ${target.name} (filter matched ${matched} jobs)`);
  } catch (e) {
    failed = true;
    console.error(`FAIL ${target.name}: ${e.message}`);
    console.error(output.slice(-2000));
  } finally {
    child.kill('SIGTERM');
    await sleep(1500);
    if (!child.killed) child.kill('SIGKILL');
  }
}

process.exit(failed ? 1 : 0);
