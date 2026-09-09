import React, { memo } from 'react';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import BackspaceIcon from '@mui/icons-material/Backspace';
import { useJobNameFilterState } from './hooks';

type TProps = {
  className?: string;
};

/**
 * Filters jobs of the selected status by their name.
 * Plain text matches a case-insensitive substring, "*" acts as a wildcard.
 */
const JobNameFilter = ({ className }: TProps) => {
  const { value, onChange, onClear } = useJobNameFilterState();
  return (
    <TextField
      className={className}
      value={value}
      onChange={onChange}
      label="Job name"
      placeholder="e.g. send-email or send-*"
      variant="outlined"
      id="jobs-filters_name"
      autoComplete="off"
      size="small"
      InputProps={{
        endAdornment: value ? (
          <InputAdornment position="end">
            <Tooltip title="Clear job name filter">
              <IconButton onClick={onClear} size="small" edge="end">
                <BackspaceIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        ) : undefined,
      }}
    />
  );
};

export default memo(JobNameFilter);
