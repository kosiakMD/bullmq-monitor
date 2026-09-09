import Express from 'express';
import { BullMonitorExpress } from '@bullmq-monitor/express';
import { BullMQAdapter } from '@bullmq-monitor/root';
import path from 'path';
import { seedQueues } from '@bullmq-monitor-examples/shared/seed';

const PORT = Number(process.env.PORT || 3000);
const BASE_URL = '/admin/queues';

(async () => {
  const { queues, close } = await seedQueues();

  const app = Express();
  // serve the branding assets referenced by the ui config above
  app.use('/brand', Express.static(path.join(__dirname, 'brand')));
  const monitor = new BullMonitorExpress({
    queues: [
      new BullMQAdapter(queues[0]),
      // a read-only queue: the dashboard hides every mutating action
      new BullMQAdapter(queues[1], { readonly: true }),
    ],
    metrics: { collectInterval: { seconds: 30 }, maxMetrics: 50 },
    // everything below is optional branding, applied by the host app
    ui: {
      title: 'Example Queues',
      logo: { path: '/brand/logo.svg', height: 26 },
      favicon: { default: '/brand/favicon.svg' },
      links: [{ text: 'Back to admin', url: '/' }],
      dateFormats: { short: 'DD.MM HH:mm:ss', full: 'YYYY-MM-DD HH:mm:ss' },
      theme: { mode: 'dark', primary: '#0f62fe', secondary: '#ff7eb6' },
    },
  });

  const server = app.listen(PORT, () =>
    console.log(`Dashboard: http://localhost:${PORT}${BASE_URL}`)
  );
  await monitor.init({ httpServer: server });
  app.use(BASE_URL, monitor.router);

  const shutdown = async () => {
    await monitor.close();
    await close();
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})();
