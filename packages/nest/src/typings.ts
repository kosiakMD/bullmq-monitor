import type { Config } from '@bullmq-monitor/root';
import type { ModuleMetadata, Type } from '@nestjs/common';

export type BullMonitorModuleOptions = Config & {
  /**
   * Path the dashboard is served at. Defaults to "/admin/queues".
   * The value is also used as the GraphQL base path.
   */
  path?: string;
};

export interface BullMonitorOptionsFactory {
  createBullMonitorOptions():
    Promise<BullMonitorModuleOptions> | BullMonitorModuleOptions;
}

export interface BullMonitorModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  useFactory?: (
    ...args: any[]
  ) => Promise<BullMonitorModuleOptions> | BullMonitorModuleOptions;
  inject?: any[];
  useClass?: Type<BullMonitorOptionsFactory>;
  useExisting?: Type<BullMonitorOptionsFactory>;
}

export const BULL_MONITOR_OPTIONS = 'BULL_MONITOR_OPTIONS';
export const BULL_MONITOR_SERVICE = 'BULL_MONITOR_SERVICE';
