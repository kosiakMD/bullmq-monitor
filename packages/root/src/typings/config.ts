import type { SimpleIntervalSchedule } from 'toad-scheduler';
import type { Queue } from '../queue';

export type MetricsConfig = {
  /** redis key prefix for persisted metrics. default: "bull_monitor::metrics::" */
  redisPrefix?: string;
  /** how often metrics are collected. default: every hour */
  collectInterval?: SimpleIntervalSchedule;
  /** max amount of metrics points kept per queue. default: 100 */
  maxMetrics?: number;
  /** queue names excluded from metrics collection */
  blacklist?: string[];
};
export type QueueConfig = {
  readonly?: boolean;
};

/**
 * Colours for the dashboard. Whatever is set here becomes the default the
 * viewer sees; they can still override it from the settings dialog unless
 * `lock` is true.
 */
export type UiThemeConfig = {
  /** default colour scheme. default: "dark" */
  mode?: 'light' | 'dark';
  /**
   * Primary colour. Either the name of a built-in Material palette
   * (e.g. "indigo") or any CSS colour, e.g. "#0f62fe".
   */
  primary?: string;
  /** Secondary colour. Same accepted values as `primary`. */
  secondary?: string;
  /** Hide the appearance controls so the branding cannot be changed. */
  lock?: boolean;
};

export type UiLogoConfig = {
  /** url of the image, absolute or relative to the page */
  path: string;
  width?: number | string;
  height?: number | string;
  /** accessible text, defaults to the dashboard title */
  alt?: string;
};

export type UiFaviconConfig = {
  /** url used by default */
  default: string;
  /** url used when the browser asks for a dark scheme icon */
  alternative?: string;
};

export type UiLinkConfig = {
  text: string;
  url: string;
};

export type UiDateFormatsConfig = {
  /**
   * dayjs format strings. `short` is used in the job table, `full` in job
   * details. See https://day.js.org/docs/en/display/format
   */
  short?: string;
  full?: string;
};

/**
 * A saved job filter the host application ships with the dashboard.
 *
 * Presets exist because the useful searches are domain knowledge the dashboard
 * cannot guess: "failed jobs for one organisation", "everything for an order".
 * Put `{{value}}` anywhere in `name` or `dataSearch` and the dashboard asks for
 * that value before applying the preset.
 */
export type UiFilterPreset = {
  /** shown in the presets menu */
  label: string;
  /** optional one-line hint under the label */
  description?: string;
  /** job status to switch to, e.g. "failed" */
  status?: string;
  /** job name filter to apply. Supports "*" wildcards and `{{value}}` */
  name?: string;
  /** jsonata expression to apply. Supports `{{value}}` */
  dataSearch?: string;
  /** label of the input shown when the preset contains `{{value}}` */
  valueLabel?: string;
  /** placeholder of that input */
  valuePlaceholder?: string;
};

/** Branding and chrome of the dashboard, all optional. */
export type UiConfig = {
  /** page title and wordmark. default: "BullMQ Monitor" */
  title?: string;
  /** replaces the wordmark with your own image */
  logo?: UiLogoConfig;
  /** browser tab icon */
  favicon?: UiFaviconConfig;
  /** extra links rendered in the top bar, e.g. back to your admin panel */
  links?: UiLinkConfig[];
  /** how timestamps are rendered */
  dateFormats?: UiDateFormatsConfig;
  /** saved job filters offered in the jobs screen */
  filterPresets?: UiFilterPreset[];
  /** colours */
  theme?: UiThemeConfig;
};
export type Config = {
  /** queues wrapped in BullMQAdapter / BullAdapter */
  queues: Queue[];
  /** enables GraphQL introspection. default: true unless NODE_ENV=production */
  gqlIntrospection?: boolean;
  /**
   * Path the dashboard is mounted at. Required for adapters that register
   * absolute routes (koa, hapi, fastify). Express/Nest detect it from the request.
   */
  baseUrl?: string;
  /** redis SCAN count used by the job search. default: 500 */
  textSearchScanCount?: number;
  /** metrics collector config. disabled by default */
  metrics?: MetricsConfig | false;
  /** branding of the dashboard: title, logo, favicon, links, colours */
  ui?: UiConfig;
};

/** framework-agnostic representation of an incoming GraphQL http request */
export type HttpGraphQLRequest = {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  /** raw query string, including the leading "?" (may be empty) */
  search: string;
  /** already parsed JSON body (for POST requests) */
  body?: unknown;
};
export type HttpGraphQLResponse = {
  status: number;
  headers: Record<string, string>;
  body: string;
};
export type UiAsset = {
  body: Buffer;
  contentType: string;
};
