import Koa from 'koa';
import { BullMonitorKoa } from 'bullmq-monitor-koa';
import { BullMQAdapter } from 'bullmq-monitor';
import { seedQueues } from '@bullmq-monitor-examples/shared/seed';

const PORT = Number(process.env.PORT || 3002);
const BASE_URL = '/admin/queues';

(async () => {
  const { queues } = await seedQueues(['emails']);
  const app = new Koa();
  const monitor = new BullMonitorKoa({
    queues: queues.map((q) => new BullMQAdapter(q)),
    baseUrl: BASE_URL,
  });
  await monitor.init();
  app.use(monitor.router.routes());
  app.use(monitor.router.allowedMethods());
  app.listen(PORT, () =>
    console.log(`Dashboard: http://localhost:${PORT}${BASE_URL}`)
  );
})();
