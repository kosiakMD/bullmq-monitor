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

## Auth

Pass the name of a registered strategy and it is applied to every route:

```ts
await monitor.init({ auth: 'simple' });
```

## License

MIT
