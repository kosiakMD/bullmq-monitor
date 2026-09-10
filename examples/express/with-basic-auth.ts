/**
 * The dashboard behind the built-in auth guard.
 *
 * `auth` runs inside the monitor, so it protects the page, its assets and the
 * GraphQL endpoint alike, on every framework adapter. Any middleware you
 * already have works too; this just means you do not need one.
 */
import Express from 'express';
import { BullMonitorExpress } from 'bullmq-monitor-express';
import { BullMQAdapter, basicAuth } from 'bullmq-monitor';
import { seedQueues } from '@bullmq-monitor-examples/shared/seed';

const PORT = Number(process.env.PORT || 3000);
const BASE_URL = '/admin/queues';
const PASSWORD = process.env.QUEUES_PASSWORD || 'pass';

(async () => {
  const { queues } = await seedQueues(['emails']);

  const app = Express();
  const monitor = new BullMonitorExpress({
    queues: queues.map((q) => new BullMQAdapter(q)),
    auth: basicAuth({ users: { admin: PASSWORD }, realm: 'Example Queues' }),
  });
  await monitor.init();

  app.use(BASE_URL, monitor.router);
  app.listen(PORT, () =>
    console.log(
      `Dashboard (admin/${PASSWORD}): http://localhost:${PORT}${BASE_URL}`
    )
  );
})();
