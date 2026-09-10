import Hapi from '@hapi/hapi';
import { BullMonitorHapi } from 'bullmq-monitor-hapi';
import { BullMQAdapter } from 'bullmq-monitor';
import { seedQueues } from '@bullmq-monitor-examples/shared/seed';

const PORT = Number(process.env.PORT || 3005);
const BASE_URL = '/admin/queues';

(async () => {
  const { queues } = await seedQueues(['emails']);
  const server = Hapi.server({ port: PORT, host: 'localhost' });
  const monitor = new BullMonitorHapi({
    queues: queues.map((q) => new BullMQAdapter(q)),
    baseUrl: BASE_URL,
  });
  await monitor.init();
  await server.register(monitor.plugin);
  await server.start();
  console.log(`Dashboard: http://localhost:${PORT}${BASE_URL}`);
})();
