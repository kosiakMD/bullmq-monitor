import React from 'react';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import makeStyles from '@mui/styles/makeStyles';
import AddIcon from '@mui/icons-material/Add';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  activeWorkspaceIdAtom,
  addWorkspaceAtom,
  activeQueueAtom,
  activeQueueLabelAtom,
  removeWorkspaceAtom,
  workspacesListAtom,
  workspacesSizeAtom,
} from '@/atoms/workspaces';
import { useAtom } from 'jotai';
import { WorkspacesConfig } from '@/config/workspaces';
import IconButton from '@mui/material/IconButton';

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1),
    paddingBottom: 0,
  },
  chips: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    // a margin on the children would indent the first chip past everything
    // below it; gap spaces them without shifting the row
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
    [theme.breakpoints.down('xl')]: {
      maxWidth: '100%',
      overflowX: 'auto',
      flexWrap: 'nowrap',
      '-webkit-overflow-scrolling': 'touch',
      '& > *': {
        flexShrink: 0,
      },
    },
  },
}));

export default function WorkspacePicker() {
  const workspaces = useAtomValue(workspacesListAtom);
  const [activeWorkspace, changeActiveWorkspace] = useAtom(
    activeWorkspaceIdAtom
  );
  const workspacesSize = useAtomValue(workspacesSizeAtom);
  const addWorkspace = useSetAtom(addWorkspaceAtom);
  const queue = useAtomValue(activeQueueAtom) as string;
  const queueLabel = useAtomValue(activeQueueLabelAtom) as string;
  const removeWorkspace = useSetAtom(removeWorkspaceAtom);
  const cls = useStyles();
  return (
    <Paper className={cls.root}>
      <div className={cls.chips}>
        {workspaces.map(({ id, queueLabel }) => (
          <Chip
            color={id === activeWorkspace ? 'primary' : 'default'}
            onDelete={
              workspacesSize > 1 ? () => removeWorkspace(id) : undefined
            }
            onClick={() => changeActiveWorkspace(id)}
            key={id}
            label={queueLabel}
          />
        ))}
        {workspacesSize < WorkspacesConfig.maxWorkspaces && (
          <IconButton
            onClick={() => addWorkspace({ queue, queueLabel })}
            aria-label="Add workspace"
            size="small"
          >
            <AddIcon />
          </IconButton>
        )}
      </div>
    </Paper>
  );
}
