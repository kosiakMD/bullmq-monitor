# Examples

Runnable apps for every adapter. They all seed a couple of queues with a mix of
completed, failed and delayed jobs, so the dashboard has something to show and
the job name filter is easy to try.

```bash
npm install
docker compose up -d       # redis on :6379
npm run build              # the examples use the built packages
```

| Command | App | Dashboard |
| --- | --- | --- |
| `npm run example:express` | Express 5 | http://localhost:3000/admin/queues |
| `npm run example:express4` | Express 4, with a global json parser | http://localhost:3004/admin/queues |
| `npm run example:express-basic-auth` | Express behind basic auth (`admin` / `pass`) | http://localhost:3000/admin/queues |
| `npm run example:nest` | NestJS 10 with `@nestjs/bullmq` | http://localhost:3001/admin/queues |
| `npm run example:koa` | Koa 2 | http://localhost:3002/admin/queues |
| `npm run example:fastify` | Fastify 5 | http://localhost:3003/admin/queues |
| `npm run example:hapi` | Hapi 21 | http://localhost:3005/admin/queues |

Point them at another redis with `REDIS_URL`, and change the port with `PORT`.

The Express example also shows the branding options: a custom logo, favicon,
colours, an extra top-bar link and date formats. Its assets live in
`examples/express/brand`.

The Nest example is deliberately pinned to NestJS 10, BullMQ 5 and Express 4,
the stack most production APIs are on today. The others track the newest
releases, which keeps both ends of the supported range exercised.

## Smoke test

Boots every app in turn and checks the dashboard, its assets, the API and the
name filter:

```bash
npm run smoke
```
