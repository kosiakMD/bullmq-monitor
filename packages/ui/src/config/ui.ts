export type TThemeMode = 'light' | 'dark';

export type TThemeColors = {
  /** a built-in Material palette name, or any CSS colour */
  primary?: string;
  secondary?: string;
  background?: string;
  surface?: string;
  text?: string;
  textSecondary?: string;
  divider?: string;
  statusColors?: Record<string, string>;
};

export type TServerThemeConfig = TThemeColors & {
  mode?: TThemeMode;
  light?: TThemeColors;
  dark?: TThemeColors;
  /** hides the appearance controls */
  lock?: boolean;
};

/** colours for one scheme: shared values first, then the per-scheme overrides */
export const themeColorsFor = (
  config: TServerThemeConfig,
  mode: TThemeMode
): TThemeColors => ({
  ...config,
  ...(mode === 'dark' ? config.dark : config.light),
});

export type TFilterPreset = {
  label: string;
  description?: string;
  status?: string;
  name?: string;
  dataSearch?: string;
  valueLabel?: string;
  valuePlaceholder?: string;
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
  filterPresets?: TFilterPreset[];
  theme?: TServerThemeConfig;
};

/** placeholder a preset uses to ask the viewer for a value */
export const PRESET_VALUE_TOKEN = '{{value}}';

export const presetNeedsValue = (preset: TFilterPreset): boolean =>
  `${preset.name ?? ''}${preset.dataSearch ?? ''}`.includes(PRESET_VALUE_TOKEN);

export const fillPreset = (template: string | undefined, value: string) =>
  template ? template.split(PRESET_VALUE_TOKEN).join(value) : '';

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
export const FilterPresets: TFilterPreset[] = (
  ServerUiConfig.filterPresets ?? []
).filter((preset) => preset && typeof preset.label === 'string');

export const DateFormatsConfig = {
  short: ServerUiConfig.dateFormats?.short || 'YYYY-MM-DD HH:mm:ss',
  full: ServerUiConfig.dateFormats?.full || 'YYYY-MM-DD HH:mm:ss',
};
