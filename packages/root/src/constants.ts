import { Config, MetricsConfig } from './typings/config';

export const PROD = process.env.NODE_ENV === 'production';
export const DEV = !PROD;
export const DEFAULT_DATA_SEARCH_SCAN_COUNT = 500;
export const UI_ASSETS_PATH = 'ui';
export const GQL_PATH = 'graphql';
export const DEFAULT_UI_TITLE = 'BullMQ Monitor';

export const DEFAULT_ROOT_CONFIG: Required<Config> = {
  queues: [],
  baseUrl: '',
  gqlIntrospection: DEV,
  textSearchScanCount: DEFAULT_DATA_SEARCH_SCAN_COUNT,
  metrics: false,
  ui: {},
  auth: undefined as any,
};
export const DEFAULT_METRICS_CONFIG: Required<MetricsConfig> = {
  redisPrefix: 'bull_monitor::metrics::',
  collectInterval: { hours: 1 },
  maxMetrics: 100,
  blacklist: [],
};
