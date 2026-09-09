import {
  DynamicModule,
  Inject,
  Module,
  OnApplicationShutdown,
  Provider,
} from '@nestjs/common';
import { BullMonitorNestService } from './monitor.service';
import { createMonitorController } from './monitor.controller';
import {
  BULL_MONITOR_OPTIONS,
  BULL_MONITOR_SERVICE,
  BullMonitorModuleAsyncOptions,
  BullMonitorModuleOptions,
  BullMonitorOptionsFactory,
} from './typings';

const DEFAULT_PATH = '/admin/queues';

const createService = async (
  options: BullMonitorModuleOptions
): Promise<BullMonitorNestService> => {
  const path = options.path ?? DEFAULT_PATH;
  const monitor = new BullMonitorNestService({
    ...options,
    baseUrl: options.baseUrl ?? path,
  });
  await monitor.init();
  return monitor;
};

@Module({})
export class BullMonitorModule implements OnApplicationShutdown {
  /**
   * Injected by token rather than by type. Transpilers that skip
   * `emitDecoratorMetadata` (esbuild, swc, tsx) emit no design:paramtypes, and
   * type-based injection would silently resolve to undefined there.
   */
  constructor(
    @Inject(BULL_MONITOR_SERVICE)
    private readonly monitor: BullMonitorNestService
  ) {}

  /**
   * Registers the dashboard with a static config.
   *
   * ```ts
   * BullMonitorModule.forRoot({
   *   path: '/admin/queues',
   *   queues: [new BullMQAdapter(queue)],
   * })
   * ```
   */
  static forRoot(options: BullMonitorModuleOptions): DynamicModule {
    const path = options.path ?? DEFAULT_PATH;
    const serviceProvider: Provider = {
      provide: BULL_MONITOR_SERVICE,
      useFactory: () => createService(options),
    };
    return {
      module: BullMonitorModule,
      controllers: [createMonitorController(path)],
      providers: [
        { provide: BULL_MONITOR_OPTIONS, useValue: options },
        serviceProvider,
        {
          provide: BullMonitorNestService,
          useExisting: BULL_MONITOR_SERVICE,
        },
      ],
      exports: [BULL_MONITOR_SERVICE, BullMonitorNestService],
    };
  }

  /**
   * Registers the dashboard with an async config, e.g. when the queues come
   * from another module.
   *
   * Note: `path` cannot be resolved asynchronously because Nest needs the route
   * at module definition time. Pass it via the optional `path` argument.
   */
  static forRootAsync(
    options: BullMonitorModuleAsyncOptions & { path?: string }
  ): DynamicModule {
    const path = options.path ?? DEFAULT_PATH;
    const serviceProvider: Provider = {
      provide: BULL_MONITOR_SERVICE,
      useFactory: async (opts: BullMonitorModuleOptions) =>
        createService({ path, ...opts }),
      inject: [BULL_MONITOR_OPTIONS],
    };
    return {
      module: BullMonitorModule,
      imports: options.imports ?? [],
      controllers: [createMonitorController(path)],
      providers: [
        ...BullMonitorModule.createAsyncOptionsProviders(options),
        serviceProvider,
        {
          provide: BullMonitorNestService,
          useExisting: BULL_MONITOR_SERVICE,
        },
      ],
      exports: [BULL_MONITOR_SERVICE, BullMonitorNestService],
    };
  }

  async onApplicationShutdown(): Promise<void> {
    await this.monitor?.close();
  }

  private static createAsyncOptionsProviders(
    options: BullMonitorModuleAsyncOptions
  ): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: BULL_MONITOR_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
      ];
    }
    const inject = [(options.useClass ?? options.useExisting)!];
    const providers: Provider[] = [
      {
        provide: BULL_MONITOR_OPTIONS,
        useFactory: async (factory: BullMonitorOptionsFactory) =>
          factory.createBullMonitorOptions(),
        inject,
      },
    ];
    if (options.useClass) {
      providers.push({ provide: options.useClass, useClass: options.useClass });
    }
    return providers;
  }
}
