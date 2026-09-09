import Express from 'express';
import basicAuth from 'express-basic-auth';
import { BullMonitorExpress } from '@bullmq-monitor/express';
import { BullMQAdapter } from '@bullmq-monitor/root';
import { seedQueues } from '@bullmq-monitor-examples/shared/seed';

const PORT = Number(process.env.PORT || 3000);
const BASE_URL = '/admin/queues';

(async () => {
  const { queues } = await seedQueues(['emails']);

  const app = Express();
  const monitor = new BullMonitorExpress({
    queues: queues.map((q) => new BullMQAdapter(q)),
  });
  await monitor.init();

  app.use(
    BASE_URL,
    basicAuth({ challenge: true, users: { admin: 'pass' } }),
    monitor.router
  );
  app.listen(PORT, () =>
    console.log(`Dashboard (admin/pass): http://localhost:${PORT}${BASE_URL}`)
  );
})();
