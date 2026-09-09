import { BullMonitor } from '@bullmq-monitor/root';
import type { Config } from '@bullmq-monitor/root';
import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from 'fastify';

export type InitParams = {
  /** pass the fastify instance to drain in-flight requests on shutdown */
  app?: FastifyInstance;
};

/**
 * Fastify 4 and 5 adapter.
 *
 * ```ts
 * const monitor = new BullMonitorFastify({ queues, baseUrl: '/admin/queues' });
 * await monitor.init({ app });
 * await app.register(monitor.plugin);
 * ```
 */
export class BullMonitorFastify extends BullMonitor {
  public plugin!: FastifyPluginAsync;

  constructor(config: Config) {
    super(config);
  }

  public async init({ app }: InitParams = {}): Promise<void> {
    this.createServer(this.drainPlugin(app?.server));
    await this.startServer();

    const base = this.baseUrl || '';
    this.plugin = async (instance: FastifyInstance) => {
      instance.get(base || '/', async (_req, reply: FastifyReply) => {
        return reply.type('text/html').send(this.renderUi(base));
      });

      instance.get(
        `${base}${this.uiAssetsBasePath}/:file`,
        async (req: FastifyRequest, reply: FastifyReply) => {
          const { file } = req.params as { file: string };
          const asset = this.getUiAsset(file);
          if (!asset) {
            return reply.code(404).type('text/plain').send('Not found');
          }
          return reply
            .type(asset.contentType)
            .header('Cache-Control', 'public, max-age=31536000, immutable')
            .send(asset.body);
        }
      );

      const gqlHandler = async (req: FastifyRequest, reply: FastifyReply) => {
        const result = await this.handleGraphQLRequest({
          method: req.method,
          headers: req.headers as Record<string, string | string[] | undefined>,
          search: this.searchFromUrl(req.url),
          body: req.body,
        });
        reply.code(result.status);
        for (const [key, value] of Object.entries(result.headers)) {
          reply.header(key, value);
        }
        return reply.send(result.body);
      };

      instance.get(`${base}${this.gqlBasePath}`, gqlHandler);
      instance.post(`${base}${this.gqlBasePath}`, gqlHandler);
    };
  }

  private searchFromUrl(url: string): string {
    const idx = url.indexOf('?');
    return idx === -1 ? '' : url.slice(idx);
  }
}
