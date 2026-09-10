# @bullmq-monitor/hapi

Hapi adapter for [BullMQ Monitor](https://github.com/kosiakMD/bullmq-monitor).
Supports Hapi 20 and Hapi 21.

```bash
npm i @bullmq-monitor/hapi
```

## Usage

```ts
import Hapi from '@hapi/hapi';
import { Queue } from 'bullmq';
import { BullMonitorHapi } from '@bullmq-monitor/hapi';
import { BullMQAdapter } from '@bullmq-monitor/root';

const server = Hapi.server({ port: 3000, host: 'localhost' });
const monitor = new BullMonitorHapi({
  queues: [new BullMQAdapter(new Queue('emails', { connection }))],
  // required: hapi routes are absolute
  baseUrl: '/admin/queues',
});

await monitor.init();
await server.register(monitor.plugin);
await server.start();
```

## Supported versions

| | |
| --- | --- |
| Node.js | 20, 22, 24 |
| BullMQ | 5, 6 |
| Bull | 4 |
| Hapi | 20.x, 21.x |

## Auth

`auth` guards the dashboard, its assets and the GraphQL endpoint together:

```ts
import { basicAuth } from '@bullmq-monitor/root';

new BullMonitorHapi({
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
