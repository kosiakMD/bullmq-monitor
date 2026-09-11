import Express from 'express';
import { BullMonitorExpress } from 'bullmq-monitor-express';
import { BullMQAdapter } from 'bullmq-monitor';
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
      // saved searches for the things this app actually cares about.
      // "{{value}}" makes the dashboard ask for the id before applying.
      filterPresets: [
        {
          label: 'Failed emails',
          description: 'Everything that failed on the email queue',
          status: 'failed',
          name: 'send-*',
        },
        {
          label: 'By order id',
          description: 'Any job carrying this order id in its payload',
          status: 'completed',
          dataSearch: 'data.orderId = "{{value}}"',
          valueLabel: 'Order id',
          valuePlaceholder: 'e.g. 12345',
        },
        {
          label: 'Report generation',
          status: 'completed',
          name: 'generate-*',
        },
      ],
      // describe the payload once and the dashboard offers a filter builder
      // instead of a raw jsonata box
      filterFields: [
        { path: 'data.orderId', label: 'Order id', type: 'string' },
        {
          path: 'data.organizationId',
          label: 'Organization id',
          type: 'string',
        },
        { path: 'data.amount', label: 'Amount', type: 'number' },
        {
          path: 'data.createdAt',
          label: 'Created at',
          type: 'date',
          dateFormat: 'iso',
        },
        {
          path: 'data.channel',
          label: 'Channel',
          type: 'enum',
          options: ['email', 'sms', 'push'],
        },
        { path: 'data.shouldFail', label: 'Expected to fail', type: 'boolean' },
      ],
      theme: {
        mode: 'dark',
        // one accent for both schemes, then the surfaces each scheme needs
        primary: '#D92D20',
        secondary: '#6B7280',
        light: {
          background: '#F8FAFC',
          surface: '#FFFFFF',
          text: '#0F172A',
          textSecondary: '#64748B',
          divider: '#E2E8F0',
        },
        dark: {
          background: '#0F1115',
          surface: '#171A21',
          text: '#E5E7EB',
          textSecondary: '#9CA3AF',
          divider: '#272B34',
        },
      },
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
