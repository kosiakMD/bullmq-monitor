# @bullmq-monitor/koa

Koa adapter for [BullMQ Monitor](https://github.com/kosiakMD/bullmq-monitor).
Supports Koa 2 and Koa 3.

```bash
npm i @bullmq-monitor/koa
```

## Usage

```ts
import Koa from 'koa';
import { Queue } from 'bullmq';
import { BullMonitorKoa } from '@bullmq-monitor/koa';
import { BullMQAdapter } from '@bullmq-monitor/root';

const app = new Koa();
const monitor = new BullMonitorKoa({
  queues: [new BullMQAdapter(new Queue('emails', { connection }))],
  // required: koa routes are absolute
  baseUrl: '/admin/queues',
});

await monitor.init();
app.use(monitor.router.routes());
app.use(monitor.router.allowedMethods());
app.listen(3000);
```

`baseUrl` is required here, unlike the Express adapter, because the router
registers absolute paths.

## Auth

```ts
await monitor.init({ middleware: basicAuth({ name: 'admin', pass: 'pass' }) });
```

The middleware runs before every dashboard route.

## License

MIT
