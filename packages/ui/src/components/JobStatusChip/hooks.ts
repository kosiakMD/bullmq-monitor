import { JobStatus } from '@/typings/gql';
import { useMemo } from 'react';
import { useThemeStore } from '@/stores/theme';
import { ServerThemeConfig, themeColorsFor } from '@/config/ui';
import type { TThemeMode } from '@/config/ui';

/**
 * Job statuses are colour-coded so a queue can be read at a glance, which means
 * the colours have to stay distinguishable in both schemes. The two sets below
 * are tuned for that: deeper tones on a light surface, lighter ones on a dark
 * surface, and no heavy blue, which turned muddy against dark backgrounds.
 *
 * The host application can override any status through
 * `ui.theme.statusColors` (globally or per scheme).
 */
const LIGHT: Record<JobStatus, string> = {
  [JobStatus.Waiting]: '#6C4AC7',
  [JobStatus.Active]: '#0F8B8D',
  [JobStatus.Completed]: '#0F860F',
  [JobStatus.Failed]: '#D92D20',
  [JobStatus.Delayed]: '#B26A00',
  [JobStatus.Prioritized]: '#AB0F3E',
  [JobStatus.Paused]: '#64748B',
  [JobStatus.Stuck]: '#8A8FA6',
  [JobStatus.Unknown]: '#A9AEC0',
};

const DARK: Record<JobStatus, string> = {
  [JobStatus.Waiting]: '#A78BFA',
  [JobStatus.Active]: '#4DD0C7',
  [JobStatus.Completed]: '#4CC26A',
  [JobStatus.Failed]: '#FF6B6B',
  [JobStatus.Delayed]: '#FFB74D',
  [JobStatus.Prioritized]: '#FF7EB6',
  [JobStatus.Paused]: '#94A3B8',
  [JobStatus.Stuck]: '#7A7F96',
  [JobStatus.Unknown]: '#5F6478',
};

const buildPalette = (mode: TThemeMode): Record<JobStatus, string> => {
  const base = mode === 'dark' ? DARK : LIGHT;
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
