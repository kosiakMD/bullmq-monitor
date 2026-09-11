import { Queue, Worker } from 'bullmq';

export const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
/**
 * Typed loosely on purpose: examples in this repo run against both BullMQ v5
 * and v6, whose ConnectionOptions types differ.
 */
export const connection: any = { url: REDIS_URL };

/** Job names are deliberately varied so the dashboard's name filter is easy to try. */
const JOB_NAMES = [
  'send-email',
  'send-sms',
  'send-push',
  'generate-invoice-pdf',
  'generate-report',
  'sync-crm-contacts',
];

export type SeededQueues = {
  queues: Queue[];
  workers: Worker[];
  close: () => Promise<void>;
};

/**
 * Creates a few queues with a mix of completed, failed, delayed and waiting jobs
 * so there is something to look at in the dashboard.
 */
export async function seedQueues(
  names = ['emails', 'reports']
): Promise<SeededQueues> {
  const queues = names.map((name) => new Queue(name, { connection }));
  const workers = names.map(
    (name) =>
      new Worker(
        name,
        async (job) => {
          if (job.name.startsWith('generate-')) {
            await new Promise((r) => setTimeout(r, 200));
          }
          if (job.data?.shouldFail) {
            throw new Error(`${job.name} failed on purpose`);
          }
          return { ok: true, processedAt: new Date().toISOString() };
        },
        { connection }
      )
  );

  for (const queue of queues) {
    for (const [idx, name] of JOB_NAMES.entries()) {
      const orderId = `${1000 + idx}`;
      const payload = {
        sample: name,
        orderId,
        organizationId: `org-${(idx % 3) + 1}`,
        amount: (idx + 1) * 25,
        channel: ['email', 'sms', 'push'][idx % 3],
        createdAt: new Date(Date.now() - idx * 86_400_000).toISOString(),
      };
      await queue.add(name, { ...payload, shouldFail: false });
      await queue.add(name, { ...payload, shouldFail: true });
      await queue.add(`${name}-delayed`, payload, { delay: 60_000 });
    }
  }

  return {
    queues,
    workers,
    close: async () => {
      await Promise.all(workers.map((w) => w.close()));
      await Promise.all(queues.map((q) => q.close()));
    },
  };
}
