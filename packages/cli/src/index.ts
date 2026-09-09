#!/usr/bin/env node
import { Queue as BullMqQueue } from 'bullmq';
import BullQueue from 'bull';
import Redis from 'ioredis';
import Express from 'express';
import { BullMonitorExpress } from '@bullmq-monitor/express';
import { BullAdapter, BullMQAdapter, Queue } from '@bullmq-monitor/root';
import { createCommand, Option } from 'commander';

const pkg = require('../package.json');

const program = createCommand()
  .name('bullmq-monitor')
  .description('Dashboard for BullMQ and Bull queues')
  .version(pkg.version)
  .addOption(
    new Option('--redis-uri <uri>', 'redis connection uri').default(
      'redis://localhost:6379'
    )
  )
  .requiredOption('-q, --queue <queues...>', 'queue names to monitor')
  .option('--bull', 'use bull instead of bullmq (bullmq is the default)')
  .option('-p, --port <number>', "server's port", '3000')
  .option('--host <string>', "server's host", 'localhost')
  .option('--prefix <string>', 'redis key prefix')
  .option('--readonly', 'disable every mutating action in the dashboard')
  .option('-m, --metrics', 'enable the metrics collector')
  .option('--max-metrics <number>', 'max metrics points kept per queue', '100')
  .option(
    '--metrics-interval <number>',
    'metrics collection interval in seconds',
    '3600'
  );

program.parse();
const options = program.opts();

const buildQueues = (): Queue[] => {
  const queueConfig = { readonly: Boolean(options.readonly) };
  if (options.bull) {
    return options.queue.map(
      (name: string) =>
        new BullAdapter(
          new BullQueue(name, options.redisUri, {
            ...(options.prefix ? { prefix: options.prefix } : {}),
          }),
          queueConfig
        )
    );
  }
  const connection = new Redis(options.redisUri, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  return options.queue.map(
    (name: string) =>
      new BullMQAdapter(
        new BullMqQueue(name, {
          ...(options.prefix ? { prefix: options.prefix } : {}),
          connection,
        }),
        queueConfig
      )
  );
};

(async () => {
  const monitor = new BullMonitorExpress({
    queues: buildQueues(),
    metrics: options.metrics
      ? {
          collectInterval: { seconds: +options.metricsInterval },
          maxMetrics: +options.maxMetrics,
        }
      : false,
  });

  const app = Express();
  const server = app.listen(+options.port, options.host, () => {
    console.log(
      `BullMQ Monitor is ready on http://${options.host}:${options.port}/`
    );
  });
  await monitor.init({ httpServer: server });
  app.use(monitor.router);

  const shutdown = async () => {
    await monitor.close();
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})().catch((e) => {
  console.error('[bullmq-monitor] failed to start:', e);
  process.exit(1);
});
