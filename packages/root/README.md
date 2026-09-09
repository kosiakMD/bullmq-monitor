# @bullmq-monitor/root

Core of [BullMQ Monitor](https://github.com/kosiakMD/bullmq-monitor): the queue
adapters, the GraphQL API and the bundled dashboard assets.

You normally install a framework adapter instead
(`@bullmq-monitor/express`, `@bullmq-monitor/nest`, …) and import the adapters
from here.

```bash
npm i @bullmq-monitor/root
```

## Queue adapters

Every queue handed to the monitor must be wrapped.

```ts
import { BullMQAdapter, BullAdapter } from '@bullmq-monitor/root';
import { Queue } from 'bullmq';

new BullMQAdapter(new Queue('emails', { connection }));
new BullMQAdapter(new Queue('audit', { connection }), { readonly: true });

// Bull v4 queues are still supported
new BullAdapter(bullQueue);
```

`BullMQAdapter` accepts BullMQ v5 and v6. Its parameter is typed structurally
rather than against the `Queue` class, because v6 reshaped that class; one build
of this package therefore works with both.

## Config

| Option | Default | Meaning |
| --- | --- | --- |
| `queues` | — | Wrapped queues to expose |
| `ui` | `{}` | Branding: title, logo, favicon, links, date formats, colours |
| `baseUrl` | `''` | Mount path, required by adapters that register absolute routes |
| `gqlIntrospection` | `true` unless `NODE_ENV=production` | Enable GraphQL introspection |
| `textSearchScanCount` | `500` | Redis SCAN batch size used by the job filters |
| `metrics` | `false` | Metrics collector config |

## Writing an adapter

`BullMonitor` is framework-agnostic. An adapter wires three routes:

```ts
import { BullMonitor, readJsonBody } from '@bullmq-monitor/root';

class MyAdapter extends BullMonitor {
  async init() {
    this.createServer();
    await this.startServer();

    // GET <base>/            -> this.renderUi(basePath)
    // GET <base>/ui/:file    -> this.getUiAsset(file)
    // GET|POST <base>/graphql-> this.handleGraphQLRequest({ method, headers, search, body })
  }
}
```

`readJsonBody` parses a JSON body from a raw node request when the framework
does not do it for you.

## License

MIT
