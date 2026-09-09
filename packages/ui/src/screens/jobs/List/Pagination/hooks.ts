import { useQueueData } from '@/hooks/use-queue-data';
import {
  activeQueueAtom,
  activeStatusAtom,
  dataSearchAtom,
  jobIdAtom,
  jobNameAtom,
} from '@/atoms/workspaces';
import { useAtomValue } from 'jotai';
import { JobStatus } from '@/typings/gql';

/** MUI treats -1 as an unknown total */
export const UNKNOWN_COUNT = -1;

/**
 * Total number of rows for the pagination control.
 *
 * The queue counters only describe the unfiltered queue, so as soon as a name
 * or data filter is active the real total is unknown until the whole status is
 * scanned. Reporting it as unknown keeps the pager honest instead of showing a
 * total the list does not contain.
 */
export const useCount = (): number => {
  const jobId = useAtomValue(jobIdAtom);
  const jobName = useAtomValue(jobNameAtom);
  const dataSearch = useAtomValue(dataSearchAtom);
  const status = useAtomValue(activeStatusAtom);
  const activeQueue = useAtomValue(activeQueueAtom) as string;
  const jobsCounts = useQueueData(activeQueue)?.jobsCounts;

  if (jobId) {
    return 0;
  }
  if (jobName || dataSearch) {
    return UNKNOWN_COUNT;
  }
  if (
    !jobsCounts ||
    status === JobStatus.Stuck ||
    status === JobStatus.Unknown
  ) {
    return 0;
  }
  const counts = jobsCounts as Record<string, number | null | undefined>;
  return counts[status] ?? 0;
};
