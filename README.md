# BullMQ Monitor

[![CI](https://github.com/kosiakMD/bullmq-monitor/actions/workflows/ci.yml/badge.svg)](https://github.com/kosiakMD/bullmq-monitor/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@bullmq-monitor/root.svg)](https://www.npmjs.com/package/@bullmq-monitor/root)
[![node](https://img.shields.io/node/v/@bullmq-monitor/root.svg)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/@bullmq-monitor/root.svg)](./LICENSE)

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
npm i @bullmq-monitor/express
```

| Framework | Package |
| --- | --- |
| Express 4 / 5 | `@bullmq-monitor/express` |
| NestJS 10 / 11 / 12 | `@bullmq-monitor/nest` |
| Koa 2 / 3 | `@bullmq-monitor/koa` |
| Fastify 4 / 5 | `@bullmq-monitor/fastify` |
| Hapi 20 / 21 | `@bullmq-monitor/hapi` |
| No framework | `@bullmq-monitor/cli` |

## Quick start

### Express

```ts
import Express from 'express';
import { Queue } from 'bullmq';
import { BullMonitorExpress } from '@bullmq-monitor/express';
import { BullMQAdapter } from '@bullmq-monitor/root';

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
import { BullMonitorModule, BullMQAdapter } from '@bullmq-monitor/nest';
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
npx @bullmq-monitor/cli -q emails -q reports --redis-uri redis://localhost:6379
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
import { basicAuth } from '@bullmq-monitor/root';

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
- New `@bullmq-monitor/nest` package, replacing the copy-paste Nest example.
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

## Releasing

Versions are managed with lerna and published by CI.

```bash
npm run version          # bumps, writes the changelog, tags
git push --follow-tags
```

Pushing the tag runs `.github/workflows/release.yml`, which rebuilds, runs the
tests and the smoke suite, then publishes every package to npm with provenance.
It needs an `NPM_TOKEN` repository secret with publish rights on the
`@bullmq-monitor` scope.

## License

MIT. Original work © Ilya Strus, fork maintained by [@kosiakMD](https://github.com/kosiakMD).
