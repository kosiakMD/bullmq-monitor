import { useMemo } from 'react';
import createStore from 'zustand';
import { createTheme } from '@mui/material/styles';
import type { PaletteOptions } from '@mui/material/styles';
import { persist } from 'zustand/middleware';
import { StorageConfig } from '@/config/storage';
import { ServerThemeConfig } from '@/config/ui';
import type { TThemeMode } from '@/config/ui';

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
 * Resolves a configured colour into something MUI accepts.
 * A built-in palette name keeps its full set of shades; anything else is
 * treated as a CSS colour and used as the main tone.
 */
const resolveColor = (value: string | undefined, fallback: any) => {
  if (!value) return fallback;
  if (isBuiltInPalette(value)) return palettesMap[value];
  return { main: value };
};

/** the server's branding wins on first load, the viewer can change it after */
const DEFAULT_THEME: TTheme = ServerThemeConfig.mode ?? 'dark';
const DEFAULT_PALETTE: TPalette = isBuiltInPalette(ServerThemeConfig.primary)
  ? ServerThemeConfig.primary
  : 'deepPurple';

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
      version: 2,
    }
  )
);

export const getMuiTheme = () => {
  const [theme, palette] = useThemeStore((state) => [
    state.theme,
    state.palette,
  ]);
  return useMemo(() => {
    // a custom css colour from the server has no palette name to store, so it
    // is applied here rather than through the palette picker
    const usesCustomPrimary =
      !!ServerThemeConfig.primary &&
      !isBuiltInPalette(ServerThemeConfig.primary);
    const paletteOptions: PaletteOptions = {
      primary: usesCustomPrimary
        ? resolveColor(ServerThemeConfig.primary, palettesMap[palette])
        : palettesMap[palette],
      secondary: resolveColor(ServerThemeConfig.secondary, red),
      mode: theme,
    };
    return createTheme({ palette: paletteOptions });
  }, [theme, palette]);
};
