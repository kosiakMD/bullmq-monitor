import { ApolloServer, ApolloServerPlugin, BaseContext } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import type { Server as HttpServer } from 'http';
import type { Server as HttpsServer } from 'https';
import {
  BullDataSource,
  MetricsDataSource,
  PoliciesDataSource,
} from './gql/data-sources';
import { typeDefs } from './gql/type-defs';
import { resolvers } from './gql/resolvers';
import type { TContext } from './gql/resolvers/typings';
import { UI } from './ui';
import { MetricsCollector } from './metrics-collector';
import { Queue } from './queue';
import {
  DEFAULT_METRICS_CONFIG,
  DEFAULT_ROOT_CONFIG,
  GQL_PATH,
  UI_ASSETS_PATH,
} from './constants';
import { toHeaderMap } from './http';
import { evaluateAuth } from './auth';
import type { AuthContext } from './auth';
import type {
  Config,
  MetricsConfig,
  HttpGraphQLRequest,
  HttpGraphQLResponse,
  UiAsset,
} from './typings/config';

export type ServerPlugins = ApolloServerPlugin<BaseContext>[];

/**
 * Framework-agnostic core. Adapters (express, koa, hapi, fastify, nest)
 * extend it and wire three routes:
 *   GET  <base>/            -> renderUi(base)
 *   GET  <base>/ui/:file    -> getUiAsset(file)
 *   GET|POST <base>/graphql -> handleGraphQLRequest(...)
 */
export abstract class BullMonitor {
  private _queues: Queue[] = [];
  private _queuesMap: Map<string, Queue> = new Map();
  private _ui: UI;
  private _metricsCollector?: MetricsCollector;

  constructor(config: Config) {
    this.config = this._normalizeConfig(config);
    this._ui = new UI(this.config.ui);
    this._initQueues(this.config.queues);
    if (this.config.metrics) {
      this._initMetricsCollector();
    }
  }
  public get queues(): Queue[] {
    return this._queues;
  }
  public abstract init(...args: any): Promise<any>;
  public setQueues(queues: Config['queues']): void {
    this._initQueues(queues);
    if (this._metricsCollector && this.config.metrics) {
      this._metricsCollector.queues = this._queues;
    }
  }
  public startMetricsCollector() {
    if (this._metricsCollector) {
      this._metricsCollector.stopCollecting();
      this._metricsCollector.startCollecting();
    } else {
      console.warn(
        '[bullmq-monitor] Metrics collector is not initialized. Pass the metrics config while initializing the monitor: { metrics: { collectInterval: { hours: 1 } } }'
      );
    }
  }
  public stopMetricsCollector() {
    this._metricsCollector?.stopCollecting();
  }
  /** stops the GraphQL server and the metrics collector */
  public async close(): Promise<void> {
    this.stopMetricsCollector();
    if (this.server) {
      await this.server.stop();
    }
  }

  protected gqlBasePath = `/${GQL_PATH}`;
  protected uiAssetsBasePath = `/${UI_ASSETS_PATH}`;
  protected config: Required<Config>;
  protected server!: ApolloServer<BaseContext>;

  protected createServer(plugins: ServerPlugins = []) {
    this.server = new ApolloServer<BaseContext>({
      typeDefs,
      resolvers,
      plugins: [
        ...plugins,
        ...(this.config.gqlIntrospection
          ? []
          : [ApolloServerPluginLandingPageDisabled()]),
      ],
      introspection: this.config.gqlIntrospection,
      // CSRF prevention requires a preflight-triggering header on GET requests.
      // The dashboard always sends application/json so it stays safe, but some
      // reverse proxies rewrite content types, so we keep the check lenient.
      csrfPrevention: false,
    });
  }
  /** shortcut for adapters that have access to the node http server */
  protected drainPlugin(httpServer?: HttpServer | HttpsServer): ServerPlugins {
    return httpServer
      ? [ApolloServerPluginDrainHttpServer({ httpServer })]
      : [];
  }
  protected async startServer() {
    if (!this.server) {
      this.createServer();
    }
    await this.server.start();
  }
  /**
   * Runs the configured auth guard.
   * Returns a ready-to-send response when the request must be refused, and
   * null when it may proceed. Adapters call it before every route.
   */
  protected async authorize(
    ctx: AuthContext
  ): Promise<HttpGraphQLResponse | null> {
    return evaluateAuth(this.config.auth, ctx);
  }

  /** Handles a GraphQL http request. `body` must be already parsed for POST requests. */
  protected async handleGraphQLRequest(
    req: HttpGraphQLRequest
  ): Promise<HttpGraphQLResponse> {
    const result = await this.server.executeHTTPGraphQLRequest({
      httpGraphQLRequest: {
        method: req.method.toUpperCase(),
        headers: toHeaderMap(req.headers),
        search: req.search || '',
        body: req.body,
      },
      context: async () => this.createContext(),
    });
    let body = '';
    if (result.body.kind === 'complete') {
      body = result.body.string;
    } else {
      for await (const chunk of result.body.asyncIterator) {
        body += chunk;
      }
    }
    const headers: Record<string, string> = {};
    for (const [key, value] of result.headers) {
      headers[key] = value;
    }
    return { status: result.status ?? 200, headers, body };
  }
  protected createContext(): TContext {
    return {
      dataSources: {
        bull: new BullDataSource(this._queues, this._queuesMap, {
          textSearchScanCount: this.config.textSearchScanCount,
        }),
        metrics: new MetricsDataSource(this._metricsCollector),
        policies: new PoliciesDataSource(this._queuesMap),
      },
    };
  }
  /** @param basePath path the dashboard is mounted at (e.g. req.baseUrl in express) */
  protected renderUi(basePath?: string): string {
    if (!this._ui.assetsAvailable) {
      console.warn(
        '[bullmq-monitor] UI assets are missing. The package seems to be built without the dashboard (run "npm run build" in the monorepo).'
      );
    }
    return this._ui.render(basePath ?? this.baseUrl);
  }
  protected getUiAsset(fileName: string): UiAsset | undefined {
    return this._ui.getAsset(fileName);
  }
  protected get baseUrl() {
    return UI.normalizeBase(this.config.baseUrl);
  }
  protected get uiEndpoint() {
    return this.baseUrl || '/';
  }
  protected get gqlEndpoint() {
    return this.baseUrl + this.gqlBasePath;
  }
  protected get uiAssetsEndpoint() {
    return this.baseUrl + this.uiAssetsBasePath;
  }

  private _initQueues(rawQueues: Config['queues']) {
    this._queues = this._validateQueues(rawQueues);
    this._queuesMap.clear();
    this._queues.forEach((queue) => {
      this._queuesMap.set(queue.id, queue);
    });
  }
  private _validateQueues(queues: Queue[]): Queue[] {
    let hasInvalid = false;
    const validated = queues.filter((queue) => {
      const isValid = queue instanceof Queue;
      if (!isValid) {
        hasInvalid = true;
      }
      return isValid;
    });
    if (hasInvalid) {
      console.error(
        '[bullmq-monitor] Every queue should be wrapped in BullMQAdapter or BullAdapter. See https://github.com/kosiakMD/bullmq-monitor'
      );
    }
    return validated;
  }
  private _normalizeConfig(config: Config): Required<Config> {
    return {
      ...DEFAULT_ROOT_CONFIG,
      ...config,
      metrics: config.metrics
        ? { ...DEFAULT_METRICS_CONFIG, ...config.metrics }
        : false,
    };
  }
  private _initMetricsCollector() {
    this._metricsCollector = new MetricsCollector(
      this._queues,
      this.config.metrics as Required<MetricsConfig>
    );
    this._metricsCollector.startCollecting();
  }
}
