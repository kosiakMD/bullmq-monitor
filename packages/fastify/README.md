# @bullmq-monitor/fastify

Fastify adapter for [BullMQ Monitor](https://github.com/kosiakMD/bullmq-monitor).
Supports Fastify 4 and Fastify 5.

```bash
npm i @bullmq-monitor/fastify
```

## Usage

```ts
import Fastify from 'fastify';
import { Queue } from 'bullmq';
import { BullMonitorFastify } from '@bullmq-monitor/fastify';
import { BullMQAdapter } from '@bullmq-monitor/root';

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

## License

MIT
