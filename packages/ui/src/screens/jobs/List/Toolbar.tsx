import React from 'react';
import Toolbar from '@mui/material/Toolbar';
import { useSelectedJobsStore } from '@/stores/selected-jobs';
import QueueActions from '../QueueActions';
import SelectedJobsActions from '../SelectedJobsActions';

export default function TableToolbar() {
  const selectedCount = useSelectedJobsStore((state) => state.selected).size;
  return (
    <Toolbar
      // MUI's default gutters are 24px, which pushes the actions well past the
      // filters and the table below them
      disableGutters
      variant="dense"
      sx={{ px: 1, py: 1, minHeight: 'auto' }}
    >
      {selectedCount > 0 ? <SelectedJobsActions /> : <QueueActions />}
    </Toolbar>
  );
}
