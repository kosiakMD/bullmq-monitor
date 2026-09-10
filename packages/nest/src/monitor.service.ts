import { BullMonitor, readJsonBody } from 'bullmq-monitor';
import type {
  AuthContext,
  Config,
  HttpGraphQLRequest,
  HttpGraphQLResponse,
  UiAsset,
} from 'bullmq-monitor';
import type { IncomingMessage } from 'http';

/**
 * Platform-agnostic monitor used by the Nest module. It exposes the three
 * primitives the controller needs, so it works on both Express and Fastify.
 */
export class BullMonitorNestService extends BullMonitor {
  private _started = false;

  constructor(config: Config) {
    super(config);
  }

  async init(): Promise<void> {
    if (this._started) return;
    this.createServer();
    await this.startServer();
    this._started = true;
  }

  public renderDashboard(basePath: string): string {
    return this.renderUi(basePath);
  }
  public asset(fileName: string): UiAsset | undefined {
    return this.getUiAsset(fileName);
  }
  public async graphql(req: HttpGraphQLRequest): Promise<HttpGraphQLResponse> {
    return this.handleGraphQLRequest(req);
  }
  /**
   * Runs the configured auth guard. Returns a ready-to-send response when the
   * request must be refused, and null when it may proceed.
   */
  public async guard(ctx: AuthContext): Promise<HttpGraphQLResponse | null> {
    return this.authorize(ctx);
  }

  /** reads a JSON body from a raw request when the framework did not parse one */
  public async readBody(req: IncomingMessage): Promise<unknown> {
    return readJsonBody(req);
  }
}
