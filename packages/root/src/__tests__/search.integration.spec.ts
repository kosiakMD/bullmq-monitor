/**
 * Integration test for the job filters. Requires a reachable redis.
 *
 * Set REDIS_URL to point somewhere else; the suite is skipped when
 * SKIP_INTEGRATION_TESTS is set.
 */
import { Queue } from 'bullmq';
import { BullMQAdapter } from '../bullmq-adapter';
import { PowerSearch } from '../data-search';
import { JobStatus } from '../queue';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const describeOrSkip = process.env.SKIP_INTEGRATION_TESTS
  ? describe.skip
  : describe;

// BullMQ forbids ":" in queue names
const QUEUE_NAME = `bullmq-monitor-test-${process.pid}`;
const JOB_NAMES = [
  'send-email',
  'send-sms',
  'generate-report',
  'sync-contacts',
];

describeOrSkip('job filters against a real redis', () => {
  let queue: Queue;
  let adapter: BullMQAdapter;

  beforeAll(async () => {
    queue = new Queue(QUEUE_NAME, { connection: { url: REDIS_URL } as any });
    adapter = new BullMQAdapter(queue);
    for (const name of JOB_NAMES) {
      await queue.add(name, { sample: name, n: JOB_NAMES.indexOf(name) });
    }
  }, 30000);

  afterAll(async () => {
    await queue?.obliterate({ force: true }).catch(() => undefined);
    await adapter?.close();
  }, 30000);

  const search = (args: Partial<Parameters<PowerSearch['search']>[0]>) =>
    new PowerSearch(adapter).search({
      status: 'waiting' as JobStatus,
      limit: 50,
      offset: 0,
      ...args,
    });

  it('matches job names by substring, case-insensitively', async () => {
    const jobs = await search({ name: 'SEND' });
    expect(jobs.map((j) => j.name).sort()).toEqual(['send-email', 'send-sms']);
  });

  it('matches job names by wildcard', async () => {
    const jobs = await search({ name: 'generate-*' });
    expect(jobs.map((j) => j.name)).toEqual(['generate-report']);
  });

  it('returns nothing when no name matches', async () => {
    expect(await search({ name: 'no-such-job' })).toEqual([]);
  });

  it('resolves the status of scanned jobs without an extra lookup', async () => {
    const [job] = await search({ name: 'send-email' });
    expect(job).toBeDefined();
    await expect(job.getState()).resolves.toBe('waiting');
  });

  it('exposes job data of scanned jobs', async () => {
    const [job] = await search({ name: 'send-email' });
    expect(job.data).toEqual({ sample: 'send-email', n: 0 });
  });

  it('combines the name filter with a jsonata data search', async () => {
    const jobs = await search({ name: 'send-*', search: 'data.n = 1' });
    expect(jobs.map((j) => j.name)).toEqual(['send-sms']);
  });

  it('applies offset and limit to the filtered result', async () => {
    const all = await search({ name: 'send' });
    const page = await search({ name: 'send', offset: 1, limit: 1 });
    expect(all).toHaveLength(2);
    expect(page).toHaveLength(1);
    expect(page[0].name).toBe(all[1].name);
  });
});
