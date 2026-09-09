import { BullMonitor, readJsonBody } from '@bullmq-monitor/root';
import type { Config } from '@bullmq-monitor/root';
import { Router } from 'express';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { Server as HttpServer } from 'http';

export type InitParams = {
  /**
   * Pass the node http server to drain in-flight GraphQL requests on shutdown.
   */
  httpServer?: HttpServer;
  /**
   * Set to true when the GraphQL body is already parsed upstream
   * (e.g. a global express.json() middleware). Detected automatically otherwise.
   */
  bodyParsed?: boolean;
};

/**
 * Express 4 and 5 adapter.
 *
 * ```ts
 * const monitor = new BullMonitorExpress({ queues: [new BullMQAdapter(queue)] });
 * await monitor.init();
 * app.use('/admin/queues', monitor.router);
 * ```
 */
export class BullMonitorExpress extends BullMonitor {
  public router!: Router;

  constructor(config: Config) {
    super(config);
  }

  async init({ httpServer, bodyParsed }: InitParams = {}): Promise<void> {
    this.createServer(this.drainPlugin(httpServer));
    await this.startServer();

    const router = Router();

    router.get('/', (req: Request, res: Response) => {
      res.type('html').send(this.renderUi(this.resolveBase(req)));
    });

    router.get(
      `${this.uiAssetsBasePath}/:file`,
      (req: Request, res: Response) => {
        const file = req.params.file;
        const asset = this.getUiAsset(
          Array.isArray(file) ? file[0] : String(file)
        );
        if (!asset) {
          res.status(404).type('txt').send('Not found');
          return;
        }
        res.set('Content-Type', asset.contentType);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.send(asset.body);
      }
    );

    const gqlHandler: RequestHandler = async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        let body = req.body;
        const hasParsedBody =
          bodyParsed ?? (body !== undefined && body !== null);
        if (req.method === 'POST' && !hasParsedBody) {
          body = await readJsonBody(req);
        }
        const result = await this.handleGraphQLRequest({
          method: req.method,
          headers: req.headers as Record<string, string | string[] | undefined>,
          search: this.extractSearch(req),
          body,
        });
        res.status(result.status);
        for (const [key, value] of Object.entries(result.headers)) {
          res.setHeader(key, value);
        }
        res.send(result.body);
      } catch (e) {
        next(e);
      }
    };

    router.get(this.gqlBasePath, gqlHandler);
    router.post(this.gqlBasePath, gqlHandler);

    this.router = router;
  }

  /** express strips the mount path from req.url, so use baseUrl when present */
  private resolveBase(req: Request): string {
    if (this.config.baseUrl) return this.config.baseUrl;
    return req.baseUrl || '';
  }
  private extractSearch(req: Request): string {
    const idx = req.originalUrl.indexOf('?');
    return idx === -1 ? '' : req.originalUrl.slice(idx);
  }
}
