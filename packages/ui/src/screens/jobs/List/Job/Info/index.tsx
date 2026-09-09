import React from 'react';
import type { TJobProps } from '../typings';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import { useFormatDateTime } from '@/hooks/use-format-date-time';
import { DateFormatsConfig } from '@/config/ui';
import { JobStatus } from '@/typings/gql';
import { useActiveStep } from './hooks';
import makeStyles from '@mui/styles/makeStyles';
import Box from '@mui/material/Box';
import AccordionJsonView from '@/components/AccordionJsonView';

const useStyles = makeStyles((theme) => ({
  root: {
    overflowX: 'auto',
  },
  stepper: {
    padding: 0,
    whiteSpace: 'nowrap',
  },
  text: {
    marginTop: theme.spacing(2),
    maxWidth: '800px',
  },
  // a failure should read as one without becoming a solid red block
  error: {
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
type TProps = Pick<TJobProps, 'job'>;
export default function JobInfo({ job }: TProps) {
  const cls = useStyles();
  const queueDate = useFormatDateTime(job.timestamp, DateFormatsConfig.full);
  const processDate = useFormatDateTime(job.processedOn, DateFormatsConfig.full);
  const delay = job.delay;
  const delayTimestamp = job.timestamp && delay ? job.timestamp + delay : null;
  const delayDate = useFormatDateTime(delayTimestamp, DateFormatsConfig.full);
  const finishDate = useFormatDateTime(job.finishedOn, DateFormatsConfig.full);
  const activeStep = useActiveStep({ job, delayTimestamp });
  const isFailed = job.status === JobStatus.Failed;
  const returnData = isFailed ? job.failedReason : job.returnValue;
  return (
    <Box className={cls.root} p={1}>
      <Stepper
        orientation="horizontal"
        className={cls.stepper}
        activeStep={activeStep}
      >
        <Step>
          <StepLabel>
            <Typography variant="button">Queued</Typography>
            <Typography variant="body2">{queueDate}</Typography>
          </StepLabel>
        </Step>
        {delayDate && (
          <Step>
            <StepLabel>
              <Typography variant="button">Delayed</Typography>
              <Typography variant="body2">{delayDate}</Typography>
            </StepLabel>
          </Step>
        )}
        <Step>
          <StepLabel>
            <Typography variant="button">Processed</Typography>
            {processDate && (
              <Typography variant="body2">{processDate}</Typography>
            )}
          </StepLabel>
        </Step>
        <Step>
          <StepLabel error={isFailed}>
            <Typography variant="button">
              {isFailed ? 'Failed' : 'Finished'}
            </Typography>
            {finishDate && (
              <Typography variant="body2">{finishDate}</Typography>
            )}
          </StepLabel>
        </Step>
      </Stepper>
      {returnData && (
        <AccordionJsonView
          header={isFailed ? 'Error' : 'Return Value'}
          textClassName={isFailed ? cls.error : undefined}
        >
          {returnData}
        </AccordionJsonView>
      )}
      {job.opts && (
        <AccordionJsonView header="Options" defaultExpanded={false}>
          {job.opts}
        </AccordionJsonView>
      )}
    </Box>
  );
}
