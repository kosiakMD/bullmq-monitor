export type TThemeMode = 'light' | 'dark';

export type TServerThemeConfig = {
  mode?: TThemeMode;
  /** a built-in Material palette name, or any CSS colour */
  primary?: string;
  secondary?: string;
  /** hides the appearance controls */
  lock?: boolean;
};

export type TServerUiConfig = {
  title?: string;
  logo?: {
    path: string;
    width?: number | string;
    height?: number | string;
    alt?: string;
  };
  favicon?: { default: string; alternative?: string };
  links?: { text: string; url: string }[];
  dateFormats?: { short?: string; full?: string };
  theme?: TServerThemeConfig;
};

/**
 * Branding the server asked for, rendered into
 * `<meta name="bullmq-monitor:ui">`. Absent when the host app did not configure
 * `ui`, in which case the dashboard defaults apply.
 */
const read = (): TServerUiConfig => {
  if (typeof document === 'undefined') return {};
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="bullmq-monitor:ui"]'
  );
  const raw = meta?.content?.trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch (_e) {
    return {};
  }
};

export const ServerUiConfig: TServerUiConfig = read();
export const ServerThemeConfig: TServerThemeConfig = ServerUiConfig.theme ?? {};
export const DateFormatsConfig = {
  short: ServerUiConfig.dateFormats?.short || 'YYYY-MM-DD HH:mm:ss',
  full: ServerUiConfig.dateFormats?.full || 'YYYY-MM-DD HH:mm:ss',
};
