# BullMQ Monitor

[![CI](https://github.com/kosiakMD/bullmq-monitor/actions/workflows/ci.yml/badge.svg)](https://github.com/kosiakMD/bullmq-monitor/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/bullmq-monitor.svg)](https://www.npmjs.com/package/bullmq-monitor)
[![node](https://img.shields.io/node/v/bullmq-monitor.svg)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/bullmq-monitor.svg)](./LICENSE)

[Demo](https://kosiakmd.github.io/bullmq-monitor)

Self-hosted dashboard for [BullMQ](https://github.com/taskforcesh/bullmq) and
[Bull](https://github.com/OptimalBits/bull) queues. Mount it inside the app that
already owns the queues and get a job browser, filters, metrics and queue
actions on a route you control.

This is a maintained fork of [s-r-x/bull-monitor](https://github.com/s-r-x/bull-monitor),
which was archived in 2023. See [what changed](#what-changed-in-this-fork).

> Requires Node.js 20 or newer.

## Highlights

- **BullMQ first.** Works with BullMQ v5 and v6, and still supports Bull v4.
- **Filter jobs by name.** Substring or wildcard, combinable with a data search.
- **No CDN.** The dashboard is bundled into the package and served by your app.
- **Framework adapters.** Express 4 and 5, NestJS 10/11/12, Koa, Fastify, Hapi, plus a CLI.
- **Read-only queues.** Mark a queue read-only and every mutating action is refused server-side.

## Install

Pick the adapter for your framework. Each one pulls in the core package.

```bash
npm i bullmq-monitor-express
```

| Framework | Package | Supported |
| --- | --- | --- |
| Express | `bullmq-monitor-express` | 4.17 and newer, 5.x |
| NestJS | `bullmq-monitor-nest` | 10, 11, 12, on Express or Fastify |
| Koa | `bullmq-monitor-koa` | 2.15 and newer, 3.x |
| Fastify | `bullmq-monitor-fastify` | 4.x, 5.x |
| Hapi | `bullmq-monitor-hapi` | 20.x, 21.x |
| No framework | `bullmq-monitor-cli` | — |

Queue libraries and the runtime:

| | |
| --- | --- |
| Node.js | 20, 22, 24 |
| BullMQ | 5, 6 |
| Bull | 4 |
| ioredis | 5, 6 |

`bull`, `bullmq` and `ioredis` are optional peer dependencies, so an app that
uses BullMQ alone never needs `bull` installed.

## Quick start

### Express

```ts
import Express from 'express';
import { Queue } from 'bullmq';
import { BullMonitorExpress } from 'bullmq-monitor-express';
import { BullMQAdapter } from 'bullmq-monitor';

const queue = new Queue('emails', { connection: { host: 'localhost', port: 6379 } });

const app = Express();
const monitor = new BullMonitorExpress({ queues: [new BullMQAdapter(queue)] });

await monitor.init();
app.use('/admin/queues', monitor.router);
app.listen(3000);
```

The dashboard is now on `http://localhost:3000/admin/queues`.

### NestJS

```ts
import { Module } from '@nestjs/common';
import { BullMonitorModule, BullMQAdapter } from 'bullmq-monitor-nest';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';

@Module({
  imports: [
    BullMonitorModule.forRootAsync({
      path: '/admin/queues',
      imports: [EmailsModule],
      inject: [getQueueToken('emails')],
      useFactory: (emails: Queue) => ({
        queues: [new BullMQAdapter(emails)],
      }),
    }),
  ],
})
export class AppModule {}
```

`forRoot` is available too when the queues are built inline. The module registers
three routes under `path`: the dashboard, its static assets and the GraphQL endpoint.

### CLI

```bash
npx bullmq-monitor-cli -q emails -q reports --redis-uri redis://localhost:6379
```

Other adapters are shown in [`examples/`](./examples).

## Filtering jobs

Pick a status, then narrow it down.

**Job name** matches a case-insensitive substring:

```
email
```

Add `*` for wildcard matching against the whole name:

```
send-*
```

**Search in job data** is a [jsonata](https://docs.jsonata.org/overview.html)
expression evaluated against the raw job:

```
data.userId = 42 and opts.attempts >= 1
```

Both filters can be combined, and the active filter set is part of the shareable
workspace link. Full reference in [docs/search-examples.md](./docs/search-examples.md).

Filters scan the redis keys of the selected status, so they are heavier than
plain pagination. Tune the batch size with `textSearchScanCount` on very large queues.

## Configuration

```ts
new BullMonitorExpress({
  queues: [
    new BullMQAdapter(queue),
    new BullMQAdapter(auditQueue, { readonly: true }),
  ],
  // enable GraphQL introspection. defaults to true unless NODE_ENV=production
  gqlIntrospection: true,
  // redis SCAN batch size used by the job filters. default 500
  textSearchScanCount: 500,
  // metrics are persisted in redis under "bull_monitor::metrics::{queue}"
  metrics: {
    collectInterval: { hours: 1 },
    maxMetrics: 100,
    blacklist: ['audit'],
  },
});
```

`baseUrl` is required for adapters that register absolute routes (Koa, Fastify,
Hapi). Express and Nest detect the mount path from the request.

## Branding

The dashboard takes its title, logo, favicon, extra links, date formats and
colours from the app that hosts it. Nothing needs rebuilding.

```ts
new BullMonitorExpress({
  queues,
  ui: {
    title: 'Acme Queues',
    logo: { path: '/static/logo.svg', darkPath: '/static/logo-white.svg', height: 26 },
    favicon: { default: '/static/favicon.ico', alternative: '/static/favicon-dark.svg' },
    links: [{ text: 'Back to admin', url: '/admin' }],
    // dayjs tokens: https://day.js.org/docs/en/display/format
    dateFormats: { short: 'DD.MM HH:mm:ss', full: 'YYYY-MM-DD HH:mm:ss' },
    theme: {
      // scheme shown on first visit
      mode: 'dark',
      // a Material palette name ("indigo", "teal", …) or any CSS colour
      primary: '#D92D20',
      secondary: '#6B7280',
      // per-scheme surfaces, so the dashboard matches your app in both
      light: {
        background: '#F8FAFC',
        surface: '#FFFFFF',
        text: '#0F172A',
        textSecondary: '#64748B',
        divider: '#E2E8F0',
      },
      dark: {
        background: '#0F1115',
        surface: '#171A21',
        text: '#E5E7EB',
        textSecondary: '#9CA3AF',
        divider: '#272B34',
      },
      // hide the appearance controls so viewers keep your branding
      lock: true,
    },
  },
});
```

Colours set at the top level of `theme` apply to both schemes; `light` and
`dark` override them per scheme. Every field is optional.

### Status colours

Job statuses are colour-coded so a queue reads at a glance. The built-in sets
are tuned separately for light and dark. Override any of them:

```ts
theme: {
  statusColors: { failed: '#D92D20', completed: '#15803D' },
  dark: {
    statusColors: { failed: '#FF6B6B', completed: '#4CC26A' },
  },
}
```

Keys are job statuses: `waiting`, `active`, `completed`, `failed`, `delayed`,
`paused`, `prioritized`, `stuck`, `unknown`. Statuses you leave out keep the
built-in colour.

| Field | Meaning |
| --- | --- |
| `title` | Page title and the text wordmark |
| `logo` | `{ path, darkPath?, width?, height?, alt? }`, replaces the wordmark. `darkPath` is used in dark mode |
| `favicon` | `{ default, alternative? }`, rendered as `<link rel="icon">` |
| `links` | Extra links in the top bar |
| `dateFormats` | `{ short, full }` dayjs formats for the table and job details |
| `filterPresets` | Saved searches offered in the jobs screen |
| `theme` | Colours, see below |

Serve the referenced images yourself; the dashboard only points at the urls you
give it. Without `theme.lock`, viewers can still switch light/dark and pick a
palette from the settings dialog, and their choice is remembered per browser.

## Filter builder

Describe your payload once and the dashboard offers a **Build filter** dialog:
pick a field, pick a condition, fill in a typed input. It writes the jsonata for
you, and the box stays editable for anything the builder cannot express.

```ts
ui: {
  filterFields: [
    { path: 'data.organizationId', label: 'Organization', type: 'string' },
    { path: 'data.amount', label: 'Amount', type: 'number' },
    { path: 'data.createdAt', label: 'Created', type: 'date', dateFormat: 'iso' },
    { path: 'data.channel', label: 'Channel', type: 'enum', options: ['email', 'sms'] },
    { path: 'data.isTest', label: 'Test run', type: 'boolean' },
    // limit a field to the queues it exists on
    { path: 'data.orderId', label: 'Order', queues: ['Email Send Queue'] },
  ],
}
```

| Field | Meaning |
| --- | --- |
| `path` | where it lives in the raw job, e.g. `data.orderId` |
| `label` | what the picker calls it |
| `type` | `string`, `number`, `boolean`, `date` or `enum`. default `string` |
| `options` | allowed values for an `enum`, plain strings or `{ value, label }` |
| `dateFormat` | `iso` for a date string, `epoch` for milliseconds. default `iso` |
| `queues` | restrict the field to these queue names |
| `hint` | a line of help under the field |

The conditions offered follow the type: contains and starts with for text, a
range for numbers, after, before, between and "in the last N days" for dates, is
one of for enums.

The job's own fields are always offered without configuring anything: job name,
attempts, queued, started and finished timestamps, and the failure reason.

A relative window like "in the last 7 days" is resolved to a fixed moment when
you press Apply, so the filter you share is the filter someone else sees.

## Filter presets

The searches worth saving are domain knowledge the dashboard cannot guess.
Ship them with it:

```ts
ui: {
  filterPresets: [
    {
      label: 'Failed emails',
      description: 'Everything that failed on the email queue',
      status: 'failed',
      name: 'send-*',
    },
    {
      label: 'By organization',
      status: 'completed',
      dataSearch: 'data.organizationId = "{{value}}"',
      valueLabel: 'Organization id',
      valuePlaceholder: 'e.g. 42',
    },
  ],
}
```

A preset appears in a **Presets** menu next to the filters. Selecting one applies
its status, name and data search together. Put `{{value}}` anywhere in `name` or
`dataSearch` and the dashboard asks for that value first, so one preset covers a
whole family of lookups: by organization, by order, by customer.

Fields a preset leaves out are cleared, so switching presets never leaves a
stale filter behind.

## Auth

The dashboard exposes queue data, so put something in front of it. `auth` runs
inside the monitor and guards all three routes: the page, its assets and the
GraphQL endpoint. It works the same on every adapter.

```ts
import { basicAuth } from 'bullmq-monitor';

new BullMonitorExpress({
  queues,
  auth: basicAuth({ users: { admin: process.env.QUEUES_PASSWORD! } }),
});
```

Any check you already have works too. The guard receives the request and returns
a boolean, or a decision if you want to control the response:

```ts
auth: async ({ headers, path, method }) => {
  const user = await sessionFromCookie(headers.cookie);
  if (user?.isAdmin) return true;
  return { authorized: false, status: 403, body: 'Admins only' };
},
```

Guards run before anything is served, so an unauthorized caller never reaches
the queue data. Basic auth is fine for an internal dashboard behind TLS; put a
real identity provider in front of anything wider.

Framework middleware still works if you prefer it: mount the router behind your
own middleware in Express or Nest, pass `middleware` to the Koa adapter, or an
`auth` strategy name to the Hapi one.

## Read-only queues

```ts
new BullMQAdapter(queue, { readonly: true })
```

Every mutation touching that queue is rejected in the resolver, not just hidden
in the UI.

## What changed in this fork

- BullMQ is the default; BullMQ v6 support alongside v5, and Bull v4 kept working.
- Apollo Server 3 (end of life) replaced by Apollo Server 5, on a framework-agnostic HTTP handler.
- The dashboard ships inside the package instead of loading from jsDelivr.
- Assets are fingerprinted by content, so a rebuild can never serve a stale bundle.
- New: filter jobs by name, and a clear-filters action.
- New `bullmq-monitor-nest` package, replacing the copy-paste Nest example.
- Express 5, Koa 3, Fastify 5 and Hapi 21 support.
- React 18, Vite 5, jotai 2, zustand 4 in the dashboard.
- Fixed: data search on the `waiting` status scanned the wrong redis key and always returned nothing.
- Fixed: jobs found by search could not resolve their own status.
- Fixed: the "disable polling while searching" toggle never changed.

## Development

```bash
npm install
docker compose up -d          # redis on :6379
npm run build
npm test
npm run example:express
```

`REDIS_URL` points the examples and integration tests at another redis.
`SKIP_INTEGRATION_TESTS=1` skips the tests that need one.

`npm run smoke` boots every framework example in turn and checks that the
dashboard, its assets, the API and the job name filter all answer.

## Using it before it is published

To try a change in a real app without publishing anything:

```bash
npm run pack:local          # writes ./dist-packages/*.tgz
```

then in the consuming app:

```json
"bullmq-monitor": "file:../bullmq-monitor/dist-packages/bullmq-monitor-root.tgz",
"bullmq-monitor-nest": "file:../bullmq-monitor/dist-packages/bullmq-monitor-nest.tgz"
```

A tarball rather than a directory on purpose: npm copies it, so the package
resolves its peer dependencies from the consuming app. A `file:` directory is
symlinked, and would resolve nest, express and bullmq from this repo instead,
which surfaces as type mismatches that would never happen after publishing.

Re-run `npm run pack:local` and `npm install` in the app after each change.

## Releasing

npm asks for a one-time password on a direct publish and emails the code, so
run this from your own terminal:

```bash
npm run version        # bumps, writes the changelog, tags
npm run publish:all    # builds, then publishes in dependency order
git push --follow-tags
```

The code is asked once and reused for every package. Non-interactive
alternatives:

```bash
npm run publish:all -- --otp=123456      # code from the email
NPM_TOKEN=npm_xxx npm run publish:all    # granular token with bypass 2FA
```

A token is written to a temporary npmrc that is deleted afterwards, and any
version already on the registry is skipped, so a partial run can simply be
repeated.

CI can do the same: push a tag and `.github/workflows/release.yml` rebuilds,
runs the tests and the smoke suite, then publishes with provenance. It needs the
same token as an `NPM_TOKEN` repository secret.

## License

MIT. Original work © Ilya Strus, fork maintained by [@kosiakMD](https://github.com/kosiakMD).
