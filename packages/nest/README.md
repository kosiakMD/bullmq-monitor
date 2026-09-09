# @bullmq-monitor/nest

NestJS module for [BullMQ Monitor](https://github.com/kosiakMD/bullmq-monitor).
Supports NestJS 10, 11 and 12, on Express or Fastify.

```bash
npm i @bullmq-monitor/nest
```

## Usage with @nestjs/bullmq

Reuse the queues Nest already manages:

```ts
import { Module } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { BullMonitorModule, BullMQAdapter } from '@bullmq-monitor/nest';
import type { Queue } from 'bullmq';

@Module({
  imports: [
    BullModule.forRoot({ connection: { host: 'localhost', port: 6379 } }),
    EmailsModule, // registers the "emails" queue

    BullMonitorModule.forRootAsync({
      path: '/admin/queues',
      imports: [EmailsModule],
      inject: [getQueueToken('emails')],
      useFactory: (emails: Queue) => ({
        queues: [new BullMQAdapter(emails)],
        metrics: { collectInterval: { hours: 1 } },
      }),
    }),
  ],
})
export class AppModule {}
```

The dashboard is then at `http://localhost:3000/admin/queues`.

## Usage with queues you build yourself

```ts
BullMonitorModule.forRoot({
  path: '/admin/queues',
  queues: [new BullMQAdapter(new Queue('emails', { connection }))],
});
```

## Options

Everything from the core `Config`, plus:

| Option | Default | Meaning |
| --- | --- | --- |
| `path` | `/admin/queues` | Route the dashboard is served at |

`path` cannot be resolved asynchronously, because Nest needs the route at module
definition time. Pass it as a plain argument to `forRootAsync` alongside the
factory.

## Branding

```ts
BullMonitorModule.forRoot({
  path: '/admin/queues',
  queues,
  ui: {
    title: 'Acme Queues',
    logo: { path: '/static/logo.svg', height: 26 },
    favicon: { default: '/static/favicon.ico' },
    links: [{ text: 'Back to admin', url: '/admin' }],
    theme: { mode: 'dark', primary: '#0f62fe', lock: true },
  },
});
```

Serve the referenced files yourself, for example with `ServeStaticModule`.

Saved searches work the same way:

```ts
ui: {
  filterPresets: [
    {
      label: 'By organization',
      status: 'failed',
      dataSearch: 'data.organizationId = "{{value}}"',
      valueLabel: 'Organization id',
    },
  ],
}
```

## Routes

The module registers three explicit routes under `path`:

| Route | Purpose |
| --- | --- |
| `GET path` | The dashboard |
| `GET path/ui/:file` | Bundled assets |
| `GET`/`POST path/graphql` | The API the dashboard talks to |

They are declared without wildcards, so the module behaves the same on Nest 10
(path-to-regexp 6) and Nest 11+ (path-to-regexp 8).

## Guards and auth

The module accepts the core `auth` guard, which protects the dashboard, its
assets and the GraphQL endpoint together:

```ts
import { basicAuth } from '@bullmq-monitor/root';

BullMonitorModule.forRoot({
  path: '/admin/queues',
  queues,
  auth: basicAuth({ users: { admin: process.env.QUEUES_PASSWORD! } }),
});
```

Reuse your own session instead when you have one:

```ts
auth: async ({ headers }) => (await sessionFromCookie(headers.cookie))?.isAdmin === true,
```

Nest middleware and guards work as usual too:

```ts
consumer.apply(AdminAuthMiddleware).forRoutes('/admin/queues');
```

## Shutdown

Call `app.enableShutdownHooks()` and the module stops the GraphQL server and the
metrics collector on `onApplicationShutdown`.

## License

MIT
