import React, { memo } from 'react';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import BackspaceIcon from '@mui/icons-material/Backspace';
import { useDataSearchState } from './hooks';

type TProps = {
  className?: string;
};
const DataSearch = ({ className }: TProps) => {
  const { search, onChange, onClear } = useDataSearchState();

  return (
    <TextField
      className={className}
      value={search}
      onChange={onChange}
      label="Search in job data"
      placeholder='e.g. data.userId = 42'
      variant="outlined"
      id="jobs-filters_data-search-key"
      autoComplete="off"
      size="small"
      InputProps={{
        endAdornment: search ? (
          <InputAdornment position="end">
            <Tooltip title="Clear search">
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
export default memo(DataSearch);
