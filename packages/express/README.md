# bullmq-monitor-express

Express adapter for [BullMQ Monitor](https://github.com/kosiakMD/bullmq-monitor).
Supports Express 4 and Express 5.

```bash
npm i bullmq-monitor-express
```

## Usage

```ts
import Express from 'express';
import { Queue } from 'bullmq';
import { BullMonitorExpress } from 'bullmq-monitor-express';
import { BullMQAdapter } from 'bullmq-monitor';

const queue = new Queue('emails', { connection: { host: 'localhost', port: 6379 } });

const app = Express();
const server = app.listen(3000);

const monitor = new BullMonitorExpress({
  queues: [new BullMQAdapter(queue)],
});

// pass httpServer to drain in-flight GraphQL requests on shutdown
await monitor.init({ httpServer: server });
app.use('/admin/queues', monitor.router);
```

The dashboard is served at the path you mount the router on. Nothing else needs
configuring: the mount path is read from the request, so the same monitor works
behind a prefix, a subdomain or a proxy.

## Options

```ts
await monitor.init({
  httpServer,        // optional, enables graceful drain
  bodyParsed: true,  // set when a global express.json() already parsed the body
});
```

`bodyParsed` is detected automatically, so you only need it when a middleware
parses the body into something unusual.

## Supported versions

| | |
| --- | --- |
| Node.js | 20, 22, 24 |
| BullMQ | 5, 6 |
| Bull | 4 |
| Express | 4.17 and newer, 5.x |

## Auth

`auth` guards the dashboard, its assets and the GraphQL endpoint together:

```ts
import { basicAuth } from 'bullmq-monitor';

new BullMonitorExpress({
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
