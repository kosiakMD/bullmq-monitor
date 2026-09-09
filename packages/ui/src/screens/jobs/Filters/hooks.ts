import { useMemo } from 'react';
import type { JobStatus } from '@/typings/gql';
import { useJobStatusesPalette } from '@/components/JobStatusChip/hooks';
import { useQueueData } from '@/hooks/use-queue-data';
import { activeQueueAtom, activeStatusAtom } from '@/atoms/workspaces';
import { useAtomValue } from 'jotai';
import { useAtom } from 'jotai';
import omitBy from 'lodash/omitBy';
import isNil from 'lodash/isNil';

export const useQueueCounts = () => {
  const activeQueue = useAtomValue(activeQueueAtom) as string;
  const queueData = useQueueData(activeQueue);
  const [activeStatus, changeStatus] = useAtom(activeStatusAtom);
  const palette = useJobStatusesPalette();
  return useMemo(() => {
    if (!queueData?.jobsCounts) {
      return [];
    }
    return Object.entries(omitBy(queueData.jobsCounts, isNil)).map(
      ([status, count]) => ({
        label: status,
        value: count,
        onClick: () => changeStatus(status as JobStatus),
        isActive: status === activeStatus,
        /**
         * The selected chip takes the colour of its own status rather than the
         * brand colour, so the row still reads as a legend: a selected
         * "completed" is green, a selected "failed" is red.
         */
        color: palette[status as JobStatus],
      })
    );
  }, [queueData, activeStatus, palette]);
};
