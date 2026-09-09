import React, { memo } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { useCreateJobStore } from '@/stores/create-job';
import { useNetwork } from '@/hooks/use-network';
import AddIcon from '@mui/icons-material/Add';
import PauseIcon from '@mui/icons-material/Pause';
import PlayIcon from '@mui/icons-material/PlayArrow';
import { useAbstractMutation } from '@/hooks/use-abstract-mutation';
import { useRemoveJobsModalStore } from '@/stores/remove-jobs-modal';
import { JobStatusClean, QueueProvider } from '@/typings/gql';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreIcon from '@mui/icons-material/MoreHoriz';
import { useRefetchJobsLockStore } from '@/stores/refetch-jobs-lock';
import shallow from 'zustand/shallow';
import { getPollingInterval } from '@/stores/network-settings';
import {
  activeQueueAtom,
  activeStatusAtom,
  jobIdAtom,
  jobNameAtom,
  dataSearchAtom,
} from '@/atoms/workspaces';
import { useAtomValue } from 'jotai';
import SaveIcon from '@mui/icons-material/Save';
import Tooltip from '@mui/material/Tooltip';
import { useExportJobsMutation } from '@/hooks/use-export-jobs-mutation';
import { useQueueData } from '@/hooks/use-queue-data';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    flexWrap: 'wrap',
  },
  /** neutral by default; the palette shows up on hover, not at rest */
  action: {
    color: theme.palette.text.secondary,
    '&:hover': {
      color: theme.palette.primary.main,
      backgroundColor: theme.palette.action.hover,
    },
    '&.Mui-disabled': {
      color: theme.palette.action.disabled,
    },
  },
  /** destructive actions only turn red when the pointer is on them */
  destructive: {
    color: theme.palette.text.secondary,
    '&:hover': {
      color: theme.palette.error.main,
      backgroundColor: theme.palette.action.hover,
    },
  },
  separator: {
    width: 1,
    alignSelf: 'stretch',
    minHeight: 24,
    margin: theme.spacing(0, 0.5),
    backgroundColor: theme.palette.divider,
  },
}));
const QueueActions = () => {
  const classes = useStyles();
  const [cleanAnchorEl, setCleanAnchorEl] = React.useState<null | HTMLElement>(
    null
  );
  React.useState<null | HTMLElement>(null);
  const [moreAnchorEl, setMoreAnchorEl] = React.useState<null | HTMLElement>(
    null
  );
  const [isRefetchLocked, toggleIsRefetchLocked] = useRefetchJobsLockStore(
    (state) => [state.isLocked, state.toggle],
    shallow
  );
  const exportMutation = useExportJobsMutation();
  const pollingInterval = getPollingInterval();
  const handleClickClean = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCleanAnchorEl(event.currentTarget);
  };
  const handleCloseClean = () => {
    setCleanAnchorEl(null);
  };
  const handleClickMore = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMoreAnchorEl(event.currentTarget);
  };
  const handleCloseMore = () => {
    setMoreAnchorEl(null);
  };
  const handleToggleRefetch = () => {
    toggleIsRefetchLocked();
    handleCloseMore();
  };

  const queue = useAtomValue(activeQueueAtom) as string;
  const status = useAtomValue(activeStatusAtom);
  const jobId = useAtomValue(jobIdAtom);
  const jobName = useAtomValue(jobNameAtom);
  const dataSearch = useAtomValue(dataSearchAtom);
  const {
    mutations: { pauseQueue, resumeQueue, emptyQueue, cleanQueue },
  } = useNetwork();
  const queueData = useQueueData(queue);
  const isQueuePaused = queueData?.isPaused;
  const isReadonly = !!queueData?.readonly;
  const openRemoveJobsModal = useRemoveJobsModalStore((state) => state.open);
  const pauseMutation = useAbstractMutation({
    mutation: pauseQueue,
    toast: 'Queue has been paused',
    invalidateSharedQueries: true,
    confirm: {
      description: 'Pause queue',
    },
    onSuccess: handleCloseMore,
  });
  const emptyMutation = useAbstractMutation({
    mutation: emptyQueue,
    invalidateSharedQueries: true,
    toast: 'Queue has been emptied',
    confirm: {
      description: 'Empty queue',
    },
    onSuccess: handleCloseMore,
  });
  const resumeMutation = useAbstractMutation({
    mutation: resumeQueue,
    invalidateSharedQueries: true,
    toast: 'Queue has been resumed',
    onSuccess: handleCloseMore,
  });
  const cleanMutation = useAbstractMutation({
    mutation: cleanQueue,
    toast: 'Cleaned',
    invalidateSharedQueries: true,
    confirm: {
      description: 'Clean queue',
    },
  });
  const clean = async (status: JobStatusClean) => {
    await cleanMutation.mutateAsync({
      ...sharedMutationArg,
      status,
    });
    handleCloseClean();
  };
  const sharedMutationArg = { queue };
  const openCreateJob = useCreateJobStore((state) => state.open);
  return (
    <div className={classes.root}>
      <Tooltip title="Add job">
        <span>
          <IconButton
            className={classes.action}
            size="small"
            onClick={openCreateJob}
            disabled={isReadonly}
          >
            <AddIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Export jobs as JSON">
        <IconButton
          className={classes.action}
          size="small"
          onClick={() => {
            exportMutation.mutate({
              queue,
              status,
              id: jobId,
              name: jobName || undefined,
              dataSearch: dataSearch || undefined,
            });
          }}
        >
          <SaveIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={isQueuePaused ? 'Resume queue' : 'Pause queue'}>
        <span>
          <IconButton
            className={classes.action}
            size="small"
            disabled={isReadonly}
            onClick={() => {
              if (isQueuePaused) {
                resumeMutation.mutate(sharedMutationArg);
              } else {
                pauseMutation.mutate(sharedMutationArg);
              }
            }}
          >
            {isQueuePaused ? <PlayIcon /> : <PauseIcon />}
          </IconButton>
        </span>
      </Tooltip>
      <span className={classes.separator} />
      <Tooltip title="Clean jobs by status">
        <span>
          <IconButton
            className={classes.destructive}
            size="small"
            onClick={handleClickClean}
            disabled={isReadonly}
            aria-controls="clean-queue-menu"
            aria-haspopup="true"
          >
            <DeleteIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Menu
        id="clean-queue-menu"
        anchorEl={cleanAnchorEl}
        open={Boolean(cleanAnchorEl)}
        onClose={handleCloseClean}
      >
        <MenuItem onClick={() => clean(JobStatusClean.Wait)}>Waiting</MenuItem>
        <MenuItem onClick={() => clean(JobStatusClean.Active)}>Active</MenuItem>
        <MenuItem onClick={() => clean(JobStatusClean.Completed)}>
          Completed
        </MenuItem>
        <MenuItem onClick={() => clean(JobStatusClean.Delayed)}>
          Delayed
        </MenuItem>
        <MenuItem onClick={() => clean(JobStatusClean.Failed)}>Failed</MenuItem>
        <MenuItem onClick={() => clean(JobStatusClean.Paused)}>Paused</MenuItem>
      </Menu>
      <Tooltip title="More actions">
        <span>
          <IconButton
            className={classes.action}
            size="small"
            onClick={handleClickMore}
            disabled={isReadonly}
            aria-controls="more-queue-actions-menu"
            aria-haspopup="true"
          >
            <MoreIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Menu
        id="more-queue-actions-menu"
        anchorEl={moreAnchorEl}
        open={Boolean(moreAnchorEl)}
        onClose={handleCloseMore}
      >
        {pollingInterval && (
          <MenuItem onClick={handleToggleRefetch}>
            {isRefetchLocked ? 'Enable jobs polling' : 'Disable jobs polling'}
          </MenuItem>
        )}
        {queueData?.provider === QueueProvider.Bull && (
          <MenuItem onClick={openRemoveJobsModal}>
            Remove jobs by pattern
          </MenuItem>
        )}
        <MenuItem onClick={() => emptyMutation.mutate(sharedMutationArg)}>
          Empty
        </MenuItem>
      </Menu>
    </div>
  );
};

export default memo(QueueActions);
