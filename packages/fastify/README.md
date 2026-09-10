# bullmq-monitor-fastify

Fastify adapter for [BullMQ Monitor](https://github.com/kosiakMD/bullmq-monitor).
Supports Fastify 4 and Fastify 5.

```bash
npm i bullmq-monitor-fastify
```

## Usage

```ts
import Fastify from 'fastify';
import { Queue } from 'bullmq';
import { BullMonitorFastify } from 'bullmq-monitor-fastify';
import { BullMQAdapter } from 'bullmq-monitor';

const app = Fastify();
const monitor = new BullMonitorFastify({
  queues: [new BullMQAdapter(new Queue('emails', { connection }))],
  // required: fastify routes are absolute
  baseUrl: '/admin/queues',
});

// passing the app drains in-flight GraphQL requests on shutdown
await monitor.init({ app });
await app.register(monitor.plugin);
await app.listen({ port: 3000 });
```

Fastify parses JSON bodies itself, so no extra body handling is needed.

## Supported versions

| | |
| --- | --- |
| Node.js | 20, 22, 24 |
| BullMQ | 5, 6 |
| Bull | 4 |
| Fastify | 4.x, 5.x |

## Auth

`auth` guards the dashboard, its assets and the GraphQL endpoint together:

```ts
import { basicAuth } from 'bullmq-monitor';

new BullMonitorFastify({
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
