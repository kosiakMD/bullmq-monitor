/**
 * Same app on Express 4 to prove the adapter supports both major versions.
 * Run with: npm run express4 -w examples/express
 */
import Express from 'express';
import { BullMonitorExpress } from 'bullmq-monitor-express';
import { BullMQAdapter } from 'bullmq-monitor';
import { seedQueues } from '@bullmq-monitor-examples/shared/seed';

const PORT = Number(process.env.PORT || 3004);
const BASE_URL = '/admin/queues';

(async () => {
  const { queues } = await seedQueues(['emails']);
  const app = Express();
  // a global json parser: the adapter must not double-parse the GraphQL body
  app.use(Express.json());

  const monitor = new BullMonitorExpress({
    queues: queues.map((q) => new BullMQAdapter(q)),
  });
  await monitor.init();
  app.use(BASE_URL, monitor.router);
  app.listen(PORT, () =>
    console.log(`Dashboard: http://localhost:${PORT}${BASE_URL}`)
  );
})();
