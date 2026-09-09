import { BullMonitor } from '@bullmq-monitor/root';
import type { Config } from '@bullmq-monitor/root';
import type { Plugin, Request, ResponseToolkit } from '@hapi/hapi';

export type InitParams = {
  /** hapi auth strategy applied to every dashboard route */
  auth?: string;
};

/**
 * Hapi 20 and 21 adapter.
 *
 * ```ts
 * const monitor = new BullMonitorHapi({ queues, baseUrl: '/admin/queues' });
 * await monitor.init();
 * await server.register(monitor.plugin);
 * ```
 */
export class BullMonitorHapi extends BullMonitor {
  public plugin!: Plugin<any>;

  constructor(config: Config) {
    super(config);
  }

  public async init({ auth }: InitParams = {}): Promise<void> {
    this.createServer();
    await this.startServer();

    this.plugin = {
      name: 'bullmq-monitor',
      register: async (server) => {
        server.route({
          method: 'GET',
          path: this.uiEndpoint,
          options: { auth },
          handler: (_req: Request, h: ResponseToolkit) =>
            h.response(this.renderUi(this.baseUrl)).type('text/html'),
        });

        server.route({
          method: 'GET',
          path: `${this.uiAssetsEndpoint}/{file}`,
          options: { auth },
          handler: (req: Request, h: ResponseToolkit) => {
            const asset = this.getUiAsset(String(req.params.file));
            if (!asset) {
              return h.response('Not found').code(404).type('text/plain');
            }
            return h
              .response(asset.body)
              .type(asset.contentType)
              .header('Cache-Control', 'public, max-age=31536000, immutable');
          },
        });

        const gqlHandler = async (req: Request, h: ResponseToolkit) => {
          const result = await this.handleGraphQLRequest({
            method: req.method.toUpperCase(),
            headers: req.headers as Record<
              string,
              string | string[] | undefined
            >,
            search: req.url.search || '',
            body: req.payload,
          });
          const response = h.response(result.body).code(result.status);
          for (const [key, value] of Object.entries(result.headers)) {
            response.header(key, value);
          }
          return response;
        };

        // hapi rejects payload settings on GET, so the two verbs are registered
        // separately instead of as a single multi-method route
        server.route({
          method: 'GET',
          path: this.gqlEndpoint,
          options: { auth },
          handler: gqlHandler,
        });
        server.route({
          method: 'POST',
          path: this.gqlEndpoint,
          options: { auth, payload: { parse: true } },
          handler: gqlHandler,
        });
      },
    };
  }
}
