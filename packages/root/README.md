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

`bull`, `bullmq` and `ioredis` are optional peer dependencies, resolved only
when a code path needs them. An app that uses BullMQ alone does not need `bull`
installed.

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
| `auth` | — | Guard run before every dashboard route |

## Auth

```ts
import { basicAuth } from '@bullmq-monitor/root';

auth: basicAuth({ users: { admin: process.env.QUEUES_PASSWORD! } });
```

A guard receives `{ method, path, headers, search }` and returns a boolean, or
`{ authorized, status?, headers?, body? }` to shape the refusal. It runs before
the page, the assets and the GraphQL endpoint.

## Supported versions

| | |
| --- | --- |
| Node.js | 20, 22, 24 |
| BullMQ | 5, 6 |
| Bull | 4 |
| ioredis | 5, 6 |

`bull`, `bullmq` and `ioredis` are optional peer dependencies, resolved only
when a code path needs them.

## Branding

Everything the dashboard shows about itself comes from `ui`, with no rebuild:

```ts
ui: {
  title: 'Acme Queues',
  logo: { path: '/static/logo.svg', darkPath: '/static/logo-white.svg', height: 26 },
  favicon: { default: '/static/favicon.ico' },
  links: [{ text: 'Back to admin', url: '/admin' }],
  // dayjs tokens
  dateFormats: { short: 'DD.MM HH:mm:ss', full: 'YYYY-MM-DD HH:mm:ss' },
  theme: {
    mode: 'dark',
    primary: '#D92D20',
    light: { background: '#F8FAFC', surface: '#FFFFFF', text: '#0F172A' },
    dark: { background: '#0F1115', surface: '#171A21', text: '#E5E7EB' },
    // per status: waiting, active, completed, failed, delayed, paused,
    // prioritized, stuck, unknown
    statusColors: { failed: '#D92D20' },
    lock: true,
  },
}
```

`logo.darkPath` covers a wordmark drawn for one scheme only. Colours at the top
level of `theme` apply to both schemes; `light` and `dark` override them.

## Filter presets

Saved searches the host application ships with the dashboard:

```ts
ui: {
  filterPresets: [
    { label: 'Failed sends', status: 'failed', name: 'send-*' },
    {
      label: 'By organization',
      status: 'failed',
      dataSearch: 'data.organizationId = "{{value}}"',
      valueLabel: 'Organization id',
    },
  ],
}
```

`{{value}}` makes the dashboard ask for that value before applying the preset,
so one entry covers a whole family of lookups.

## Writing an adapter

`BullMonitor` is framework-agnostic. An adapter wires three routes:

```ts
import { BullMonitor, readJsonBody } from '@bullmq-monitor/root';

class MyAdapter extends BullMonitor {
  async init() {
    this.createServer();
    await this.startServer();

    // every route first: const refusal = await this.authorize({ method, path, headers, search })
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
