import { JobStatus } from '@/typings/gql';
import { useMemo } from 'react';
import { useThemeStore } from '@/stores/theme';
import { ServerThemeConfig, themeColorsFor } from '@/config/ui';
import type { TThemeMode } from '@/config/ui';
import {
  deepPurple,
  grey,
  cyan,
  red,
  green,
  blue,
  amber,
} from '@mui/material/colors';

/**
 * Job statuses are colour-coded so a queue can be read at a glance.
 *
 * These are the long-standing colours of the project. The only per-scheme
 * difference is "delayed": the original blue is a 800 tone, which turns muddy
 * against a dark surface, so dark mode uses a lighter one.
 *
 * The host application can override any status through
 * `ui.theme.statusColors`, globally or per scheme.
 */
const BASE: Record<JobStatus, string> = {
  [JobStatus.Failed]: red[500],
  [JobStatus.Completed]: green[500],
  [JobStatus.Delayed]: blue[800],
  [JobStatus.Waiting]: deepPurple[500],
  [JobStatus.Paused]: grey[600],
  [JobStatus.Active]: cyan[500],
  [JobStatus.Prioritized]: amber[700],
  [JobStatus.Stuck]: grey[400],
  [JobStatus.Unknown]: grey[300],
};

const DARK_OVERRIDES: Partial<Record<JobStatus, string>> = {
  [JobStatus.Delayed]: blue[400],
};

const buildPalette = (mode: TThemeMode): Record<JobStatus, string> => {
  const base =
    mode === 'dark' ? { ...BASE, ...DARK_OVERRIDES } : { ...BASE };
  const overrides = themeColorsFor(ServerThemeConfig, mode).statusColors;
  if (!overrides) return base;
  return { ...base, ...overrides } as Record<JobStatus, string>;
};

export const useJobStatusesPalette = (): Record<JobStatus, string> => {
  const mode = useThemeStore((state) => state.theme);
  return useMemo(() => buildPalette(mode), [mode]);
};

export const useJobStatusColor = (status: JobStatus): string => {
  const palette = useJobStatusesPalette();
  return palette[status];
};
