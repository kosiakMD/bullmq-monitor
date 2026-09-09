# @bullmq-monitor/express

Express adapter for [BullMQ Monitor](https://github.com/kosiakMD/bullmq-monitor).
Supports Express 4 and Express 5.

```bash
npm i @bullmq-monitor/express
```

## Usage

```ts
import Express from 'express';
import { Queue } from 'bullmq';
import { BullMonitorExpress } from '@bullmq-monitor/express';
import { BullMQAdapter } from '@bullmq-monitor/root';

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

## Behind basic auth

```ts
app.use('/admin/queues', basicAuth({ challenge: true, users: { admin: 'pass' } }), monitor.router);
```

## Shutdown

```ts
await monitor.close();
```

## License

MIT
