# bullmq-monitor-koa

Koa adapter for [BullMQ Monitor](https://github.com/kosiakMD/bullmq-monitor).
Supports Koa 2 and Koa 3.

```bash
npm i bullmq-monitor-koa
```

## Usage

```ts
import Koa from 'koa';
import { Queue } from 'bullmq';
import { BullMonitorKoa } from 'bullmq-monitor-koa';
import { BullMQAdapter } from 'bullmq-monitor';

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

## Supported versions

| | |
| --- | --- |
| Node.js | 20, 22, 24 |
| BullMQ | 5, 6 |
| Bull | 4 |
| Koa | 2.15 and newer, 3.x |

## Auth

`auth` guards the dashboard, its assets and the GraphQL endpoint together:

```ts
import { basicAuth } from 'bullmq-monitor';

new BullMonitorKoa({
  queues,
  auth: basicAuth({ users: { admin: process.env.QUEUES_PASSWORD! } }),
});
```

Any check works: the guard receives `{ method, path, headers, search }` and
returns a boolean, or `{ authorized, status?, headers?, body? }` to shape the
refusal.

## Branding

Title, logo, favicon, top-bar links, date formats, colours and saved filter
presets all come from the `ui` option, with no rebuild:

```ts
ui: {
  title: 'Acme Queues',
  logo: { path: '/static/logo.svg', darkPath: '/static/logo-white.svg', height: 26 },
  theme: { mode: 'dark', primary: '#D92D20' },
  filterPresets: [
    { label: 'Failed sends', status: 'failed', name: 'send-*' },
  ],
}
```

See the [branding reference](https://github.com/kosiakMD/bullmq-monitor#branding).

## License

MIT
