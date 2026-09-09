import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { EMAILS_QUEUE } from './emails.constants';

@Processor(EMAILS_QUEUE)
export class EmailsProcessor extends WorkerHost {
  async process(job: Job): Promise<unknown> {
    if (job.data?.shouldFail) {
      throw new Error(`${job.name} failed on purpose`);
    }
    return { ok: true, processedAt: new Date().toISOString() };
  }
}
