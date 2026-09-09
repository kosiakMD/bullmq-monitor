import { useMemo } from 'react';
import createStore from 'zustand';
import { createTheme } from '@mui/material/styles';
import type { PaletteOptions, ThemeOptions } from '@mui/material/styles';
import { persist } from 'zustand/middleware';
import { StorageConfig } from '@/config/storage';
import { ServerThemeConfig, themeColorsFor } from '@/config/ui';
import type { TThemeColors, TThemeMode } from '@/config/ui';

import {
  deepPurple,
  deepOrange,
  blue,
  indigo,
  pink,
  teal,
  amber,
  lightBlue,
  red,
  lightGreen,
  blueGrey,
  brown,
  cyan,
  yellow,
  grey,
} from '@mui/material/colors';

const palettesMap = {
  deepPurple,
  deepOrange,
  blue,
  indigo,
  pink,
  teal,
  amber,
  red,
  lightBlue,
  lightGreen,
  blueGrey,
  brown,
  grey,
  cyan,
  yellow,
};

type TTheme = TThemeMode;
type TPalette = keyof typeof palettesMap;
export const SUPPORTED_PALETTES = Object.keys(palettesMap) as TPalette[];

const isBuiltInPalette = (value?: string): value is TPalette =>
  !!value && value in palettesMap;

/**
 * Resolves a configured colour into something MUI accepts. A built-in palette
 * name keeps its full set of shades; anything else is treated as a CSS colour
 * and used as the main tone.
 */
const resolveColor = (value: string | undefined, fallback: any) => {
  if (!value) return fallback;
  if (isBuiltInPalette(value)) return palettesMap[value];
  return { main: value };
};

/** true when the server pinned a colour that the palette picker cannot express */
export const hasCustomPrimary = (): boolean =>
  (['light', 'dark'] as TThemeMode[]).some((mode) => {
    const primary = themeColorsFor(ServerThemeConfig, mode).primary;
    return !!primary && !isBuiltInPalette(primary);
  });

/** the server's branding wins on first load, the viewer can change it after */
const DEFAULT_THEME: TTheme = ServerThemeConfig.mode ?? 'dark';
const DEFAULT_PALETTE: TPalette = (() => {
  const primary = themeColorsFor(ServerThemeConfig, DEFAULT_THEME).primary;
  return isBuiltInPalette(primary) ? primary : 'deepPurple';
})();

type TState = {
  theme: TTheme;
  palette: TPalette;

  changeTheme: (theme: TTheme) => void;
  toggleTheme: () => void;
  changePalette: (palette: TPalette) => void;
};

export const useThemeStore = createStore<TState>()(
  persist(
    (set) => ({
      palette: DEFAULT_PALETTE,
      theme: DEFAULT_THEME,
      changeTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      changePalette: (palette) => set({ palette }),
    }),
    {
      name: `${StorageConfig.persistNs}theme`,
      version: 3,
    }
  )
);

/** surfaces and text the host app pinned, left to MUI's defaults otherwise */
const buildSurfaces = (colors: TThemeColors): Partial<PaletteOptions> => {
  const palette: Record<string, unknown> = {};
  if (colors.background || colors.surface) {
    palette.background = {
      ...(colors.background ? { default: colors.background } : {}),
      ...(colors.surface ? { paper: colors.surface } : {}),
    };
  }
  if (colors.text || colors.textSecondary) {
    palette.text = {
      ...(colors.text ? { primary: colors.text } : {}),
      ...(colors.textSecondary ? { secondary: colors.textSecondary } : {}),
    };
  }
  if (colors.divider) {
    palette.divider = colors.divider;
  }
  return palette as Partial<PaletteOptions>;
};

export const getMuiTheme = () => {
  const [theme, palette] = useThemeStore((state) => [
    state.theme,
    state.palette,
  ]);
  return useMemo(() => {
    const colors = themeColorsFor(ServerThemeConfig, theme);
    // a custom css colour has no palette name to store, so it is applied here
    // rather than through the palette picker
    const usesCustomPrimary =
      !!colors.primary && !isBuiltInPalette(colors.primary);
    const options: ThemeOptions = {
      palette: {
        mode: theme,
        primary: usesCustomPrimary
          ? resolveColor(colors.primary, palettesMap[palette])
          : (palettesMap[(colors.primary as TPalette) ?? palette] ??
            palettesMap[palette]),
        secondary: resolveColor(colors.secondary, red),
        ...buildSurfaces(colors),
      },
    };
    return createTheme(options);
  }, [theme, palette]);
};
