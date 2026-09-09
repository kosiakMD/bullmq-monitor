import React, { memo, useCallback, useMemo, useState } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import BookmarkIcon from '@mui/icons-material/BookmarkBorder';
import { useSetAtom } from 'jotai';
import { applyFilterPresetAtom } from '@/atoms/workspaces';
import {
  FilterPresets,
  fillPreset,
  presetNeedsValue,
} from '@/config/ui';
import type { TFilterPreset } from '@/config/ui';

type TProps = {
  className?: string;
};

/**
 * Saved filters the host application configured. A preset containing
 * `{{value}}` asks for that value first, which is how "jobs for one
 * organisation" style searches are expressed without hardcoding an id.
 */
const FilterPresetsMenu = ({ className }: TProps) => {
  const applyPreset = useSetAtom(applyFilterPresetAtom);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const [pending, setPending] = useState<TFilterPreset | null>(null);
  const [value, setValue] = useState('');

  const close = useCallback(() => setAnchor(null), []);

  const apply = useCallback(
    (preset: TFilterPreset, inputValue = '') => {
      applyPreset({
        status: preset.status,
        name: fillPreset(preset.name, inputValue),
        dataSearch: fillPreset(preset.dataSearch, inputValue),
      });
    },
    [applyPreset]
  );

  const onSelect = useCallback(
    (preset: TFilterPreset) => {
      close();
      if (presetNeedsValue(preset)) {
        setValue('');
        setPending(preset);
        return;
      }
      apply(preset);
    },
    [apply, close]
  );

  const onConfirm = useCallback(() => {
    if (pending) {
      apply(pending, value.trim());
    }
    setPending(null);
  }, [apply, pending, value]);

  const hasPresets = useMemo(() => FilterPresets.length > 0, []);
  if (!hasPresets) return null;

  return (
    <>
      <Button
        className={className}
        onClick={(e) => setAnchor(e.currentTarget)}
        startIcon={<BookmarkIcon />}
        size="small"
        color="inherit"
      >
        Presets
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        {FilterPresets.map((preset, idx) => (
          <MenuItem key={`${preset.label}-${idx}`} onClick={() => onSelect(preset)}>
            <ListItemText
              primary={preset.label}
              secondary={preset.description}
            />
          </MenuItem>
        ))}
      </Menu>

      <Dialog open={Boolean(pending)} onClose={() => setPending(null)} fullWidth maxWidth="xs">
        <DialogTitle>{pending?.label}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            size="small"
            label={pending?.valueLabel || 'Value'}
            placeholder={pending?.valuePlaceholder}
            helperText={pending?.description}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onConfirm();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setPending(null)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!value.trim()}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default memo(FilterPresetsMenu);
