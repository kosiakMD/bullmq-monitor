import React from 'react';
import { useFormatDateTime } from '@/hooks/use-format-date-time';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Actions from './Actions';
import type { TJobProps } from './typings';
import Checkbox from '@mui/material/Checkbox';
import JobStatusChip from '@/components/JobStatusChip';
import isempty from 'lodash/isEmpty';
import makeStyles from '@mui/styles/makeStyles';
import { useRemoveJobSelectionOnUnmount } from './hooks';
import ms from 'ms';
import AccordionJsonView from '@/components/AccordionJsonView';
import clsx from 'clsx';
import { usePreferencesStore } from '@/stores/preferences';

const useStyles = makeStyles((theme) => ({
  rowWithExtra: {
    '& td': {
      borderBottom: 'none',
    },
  },
  extraCell: {
    paddingTop: 0,
  },
  /**
   * The details row spans the whole table, which is wider than the viewport on
   * small screens. Sticking it to the left edge keeps the panels (and their
   * copy buttons) on screen instead of scrolling off to the right.
   */
  extraSticky: {
    position: 'sticky',
    left: 0,
    width: 'min(100%, calc(100vw - 32px))',
    maxWidth: '100%',
  },
  /**
   * One column, always. The panels sit inside a row that spans the full table
   * width, which is wider than the viewport, so a multi-column grid pushes the
   * right-hand panel (and its copy button) off screen.
   */
  extraPanels: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  // a stack trace should read as an error without becoming a solid red block
  stacktrace: {
    color: theme.palette.mode === 'dark' ? '#FF9B9B' : '#9B1C1C',
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 107, 107, 0.08)'
        : 'rgba(155, 28, 28, 0.05)',
    borderColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 107, 107, 0.28)'
        : 'rgba(155, 28, 28, 0.18)',
  },
}));
const Job = ({
  job,
  queue,
  isSelected,
  toggleSelected,
  removeSelected,
  readonly,
}: TJobProps) => {
  const prefs = usePreferencesStore();
  const date = useFormatDateTime(job.timestamp);
  const cls = useStyles();
  useRemoveJobSelectionOnUnmount(job.id, isSelected, removeSelected);
  const delayDate = useFormatDateTime(
    job.delay && job.timestamp ? job.timestamp + job.delay : null
  );
  const hasData = !!job.data && job.data !== '{}';
  const hasStacktrace = !isempty(job.stacktrace);
  const hasFailedReason = !isempty(job.failedReason);
  const hasReturnValue = !isempty(job.returnValue);
  const showExtra =
    hasData || hasStacktrace || hasReturnValue || hasFailedReason;
  return (
    <>
      <TableRow className={showExtra ? cls.rowWithExtra : undefined}>
        <TableCell padding="checkbox">
          <Checkbox
            onChange={() => toggleSelected(job.id)}
            checked={isSelected}
          />
        </TableCell>
        <TableCell>
          <Actions readonly={readonly} job={job} queue={queue} />
        </TableCell>
        <TableCell>{job.id}</TableCell>
        <TableCell>
          <JobStatusChip status={job.status} />
        </TableCell>
        <TableCell>{job.name}</TableCell>
        <TableCell>{date}</TableCell>
        <TableCell>{delayDate}</TableCell>
        <TableCell>
          {job.processingTime ? ms(job.processingTime) : null}
        </TableCell>
        <TableCell>{job.attemptsMade}</TableCell>
        <TableCell>{job.progress}</TableCell>
      </TableRow>
      {showExtra && (
        <TableRow>
          <TableCell className={cls.extraCell} colSpan={12}>
            <div className={clsx(cls.extraSticky, cls.extraPanels)}>
              {hasData && (
                <AccordionJsonView
                  defaultExpanded={prefs.expandJobData}
                  header="Job Data"
                >
                  {job.data}
                </AccordionJsonView>
              )}
              {hasReturnValue && (
                <AccordionJsonView
                  defaultExpanded={prefs.expandJobReturnValue}
                  header="Return Value"
                >
                  {job.returnValue}
                </AccordionJsonView>
              )}
              {hasFailedReason && (
                <AccordionJsonView
                  defaultExpanded={prefs.expandJobStackTrace}
                  textClassName={cls.stacktrace}
                  header="Error"
                >
                  {job.failedReason}
                </AccordionJsonView>
              )}
              {hasStacktrace && (
                <AccordionJsonView
                  defaultExpanded={prefs.expandJobStackTrace}
                  textClassName={cls.stacktrace}
                  header="Stacktrace"
                >
                  {job.stacktrace.join('\n\n')}
                </AccordionJsonView>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};
export default React.memo(Job);
