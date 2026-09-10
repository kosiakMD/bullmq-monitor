import Fastify from 'fastify';
import { BullMonitorFastify } from 'bullmq-monitor-fastify';
import { BullMQAdapter } from 'bullmq-monitor';
import { seedQueues } from '@bullmq-monitor-examples/shared/seed';

const PORT = Number(process.env.PORT || 3003);
const BASE_URL = '/admin/queues';

(async () => {
  const { queues } = await seedQueues(['emails']);
  const app = Fastify();
  const monitor = new BullMonitorFastify({
    queues: queues.map((q) => new BullMQAdapter(q)),
    baseUrl: BASE_URL,
  });
  await monitor.init({ app });
  await app.register(monitor.plugin);
  await app.listen({ port: PORT });
  console.log(`Dashboard: http://localhost:${PORT}${BASE_URL}`);
})();
