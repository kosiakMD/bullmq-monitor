import React from 'react';
import TextField from '@mui/material/TextField';
import { SUPPORTED_PALETTES, useThemeStore } from '@/stores/theme';
import shallow from 'zustand/shallow';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import { ServerThemeConfig } from '@/config/ui';

export default function AppearanceSettings() {
  const [theme, palette, changeTheme, changePalette] = useThemeStore(
    (state) => [
      state.theme,
      state.palette,
      state.changeTheme,
      state.changePalette,
    ],
    shallow
  );
  if (ServerThemeConfig.lock) {
    return (
      <Alert severity="info">
        Appearance is set by the application hosting this dashboard.
      </Alert>
    );
  }
  const customPrimary =
    !!ServerThemeConfig.primary &&
    !SUPPORTED_PALETTES.includes(ServerThemeConfig.primary as any);
  return (
    <div>
      <TextField
        margin="normal"
        value={theme}
        onChange={(e) => changeTheme(e.target.value as any)}
        fullWidth
        variant="outlined"
        select
        id="appearance_theme"
        label="Theme"
      >
        <MenuItem value="light">Light</MenuItem>
        <MenuItem value="dark">Dark</MenuItem>
      </TextField>
      <TextField
        margin="normal"
        variant="outlined"
        value={palette}
        onChange={(e) => changePalette(e.target.value as any)}
        fullWidth
        select
        id="appearance_palette"
        label="Palette"
        disabled={customPrimary}
        helperText={
          customPrimary
            ? 'The application sets a custom primary colour'
            : undefined
        }
      >
        {SUPPORTED_PALETTES.map((p) => (
          <MenuItem key={p} value={p}>
            {p}
          </MenuItem>
        ))}
      </TextField>
    </div>
  );
}
