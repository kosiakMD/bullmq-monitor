import React from 'react';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import ClearIcon from '@mui/icons-material/FilterAltOff';
import makeStyles from '@mui/styles/makeStyles';
import { useQueueCounts } from './hooks';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { OrderEnum } from '@/typings/gql';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  clearAllFiltersAtom,
  hasActiveFiltersAtom,
  jobIdAtom,
  jobsOrderAtom,
} from '@/atoms/workspaces';
import DataSearch from './DataSearch';
import DataSearchTip from './DataSearch/Tip';
import JobNameFilter from './JobName';
import FilterPresetsMenu from './Presets';

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1),
  },
  statuses: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    // no margins on the children: they would indent the first chip past the
    // fields below it
    gap: theme.spacing(1),
    maxWidth: '100%',
    overflowX: 'auto',
    flexWrap: 'nowrap',
    marginBottom: theme.spacing(1),
    '-webkit-overflow-scrolling': 'touch',
    '& > *': {
      flexShrink: 0,
    },
  },
  count: {
    width: 'auto !important',
    backgroundColor: 'transparent !important',
    display: 'flex',
    alignItems: 'center',
  },
  textFields: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
  },
  idField: {
    minWidth: '120px',
  },
  sortField: {
    minWidth: '90px',
  },
  nameField: {
    flex: '1 1 220px',
    minWidth: '200px',
  },
  dataSearchField: {
    flex: '2 1 300px',
    minWidth: '240px',
  },
  dataSearchTip: {
    marginBottom: theme.spacing(1),
  },
  clearButton: {
    whiteSpace: 'nowrap',
  },
}));

export default function JobsFilters() {
  const cls = useStyles();
  const counts = useQueueCounts();
  const [jobId, changeJobId] = useAtom(jobIdAtom);
  const [order, changeOrder] = useAtom(jobsOrderAtom);
  const hasActiveFilters = useAtomValue(hasActiveFiltersAtom);
  const clearAllFilters = useSetAtom(clearAllFiltersAtom);
  return (
    <Paper className={cls.root}>
      <div className={cls.statuses}>
        {counts.map(({ value, label, isActive, onClick }, idx) => (
          <Chip
            classes={{
              avatar: cls.count,
            }}
            avatar={<div>{value}</div>}
            key={idx}
            onClick={onClick}
            color={isActive ? 'primary' : 'default'}
            label={label}
          />
        ))}
      </div>
      <DataSearchTip className={cls.dataSearchTip} />
      <div className={cls.textFields}>
        <TextField
          value={jobId}
          onChange={(e) => changeJobId(e.target.value)}
          label="Job ID"
          variant="outlined"
          className={cls.idField}
          id="jobs-filters_id"
          size="small"
        />
        <TextField
          variant="outlined"
          size="small"
          className={cls.sortField}
          value={order}
          onChange={(e) => {
            changeOrder(e.target.value as OrderEnum);
          }}
          select
          label="Order"
          id="jobs-filters_order"
        >
          <MenuItem value={OrderEnum.Desc}>DESC</MenuItem>
          <MenuItem value={OrderEnum.Asc}>ASC</MenuItem>
        </TextField>
        <FilterPresetsMenu className={cls.clearButton} />
        <JobNameFilter className={cls.nameField} />
        <DataSearch className={cls.dataSearchField} />
        {hasActiveFilters && (
          <Tooltip title="Clear job ID, name and data filters">
            <Button
              className={cls.clearButton}
              onClick={clearAllFilters}
              startIcon={<ClearIcon />}
              size="small"
              color="inherit"
            >
              Clear filters
            </Button>
          </Tooltip>
        )}
      </div>
    </Paper>
  );
}
