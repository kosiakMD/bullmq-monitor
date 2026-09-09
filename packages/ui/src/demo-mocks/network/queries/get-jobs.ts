import type { GetJobsQuery, GetJobsQueryVariables } from '@/typings/gql';
import { networkMockData } from '../data';
import { matchesJobName } from '../match-name';

export const getJobsMock = ({
  queue,
  status,
  offset = 0,
  limit = 20,
  id,
  name,
}: GetJobsQueryVariables): Promise<GetJobsQuery> => {
  if (id) {
    const job = networkMockData.jobs.find(
      (job) => job.queue === queue && job.id === id
    );
    return Promise.resolve({
      jobs: job ? [job] : [],
    });
  }
  const jobs = networkMockData.jobs
    .filter(
      (job) =>
        job.queue === queue &&
        status === job.status &&
        matchesJobName(job.name, name)
    )
    .slice(offset as number, (offset as number) + (limit as number));
  return Promise.resolve({
    jobs,
  });
};
