import { BullMonitor, readJsonBody } from 'bullmq-monitor';
import type { Config } from 'bullmq-monitor';
import Router from '@koa/router';
import type { Middleware, Context } from 'koa';
import type { Server as HttpServer } from 'http';

export type InitParams = {
  /** middleware applied to every dashboard route, e.g. basic auth */
  middleware?: Middleware;
  httpServer?: HttpServer;
};

/**
 * Koa 2 and 3 adapter.
 *
 * ```ts
 * const monitor = new BullMonitorKoa({ queues, baseUrl: '/admin/queues' });
 * await monitor.init();
 * app.use(monitor.router.routes());
 * ```
 */
export class BullMonitorKoa extends BullMonitor {
  public router!: Router;

  constructor(config: Config) {
    super(config);
  }

  public async init({
    middleware,
    httpServer,
  }: InitParams = {}): Promise<void> {
    this.createServer(this.drainPlugin(httpServer));
    await this.startServer();

    const router = new Router({ prefix: this.baseUrl || undefined });
    if (middleware) {
      router.use(middleware);
    }

    // the configured guard runs before every dashboard route
    router.use(async (ctx: Context, next) => {
      const refusal = await this.authorize({
        method: ctx.method,
        path: ctx.path,
        headers: ctx.headers as Record<string, string | string[] | undefined>,
        search: ctx.search,
      });
      if (refusal) {
        ctx.status = refusal.status;
        for (const [key, value] of Object.entries(refusal.headers)) {
          ctx.set(key, value);
        }
        ctx.body = refusal.body;
        return;
      }
      await next();
    });

    router.get('/', (ctx: Context) => {
      ctx.type = 'text/html';
      ctx.body = this.renderUi(this.baseUrl);
    });

    router.get(`${this.uiAssetsBasePath}/:file`, (ctx: Context) => {
      const asset = this.getUiAsset((ctx.params as any).file);
      if (!asset) {
        ctx.status = 404;
        ctx.body = 'Not found';
        return;
      }
      ctx.set('Cache-Control', 'public, max-age=31536000, immutable');
      ctx.type = asset.contentType;
      ctx.body = asset.body;
    });

    const gqlHandler = async (ctx: Context) => {
      let body = (ctx.request as any).body;
      if (ctx.method === 'POST' && (body === undefined || body === null)) {
        body = await readJsonBody(ctx.req);
      }
      const result = await this.handleGraphQLRequest({
        method: ctx.method,
        headers: ctx.headers as Record<string, string | string[] | undefined>,
        search: ctx.search,
        body,
      });
      ctx.status = result.status;
      for (const [key, value] of Object.entries(result.headers)) {
        ctx.set(key, value);
      }
      ctx.body = result.body;
    };

    router.get(this.gqlBasePath, gqlHandler);
    router.post(this.gqlBasePath, gqlHandler);

    this.router = router;
  }
}
