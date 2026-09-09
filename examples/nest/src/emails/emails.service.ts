import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { EMAILS_QUEUE } from './emails.constants';

const JOB_NAMES = ['send-email', 'send-sms', 'send-push', 'generate-report'];

@Injectable()
export class EmailsService implements OnModuleInit {
  constructor(@InjectQueue(EMAILS_QUEUE) private readonly queue: Queue) {}

  /** seeds a few jobs on boot so the dashboard is not empty */
  async onModuleInit() {
    for (const name of JOB_NAMES) {
      await this.queue.add(name, { shouldFail: false });
      await this.queue.add(name, { shouldFail: true });
      await this.queue.add(`${name}-delayed`, {}, { delay: 60_000 });
    }
  }

  async enqueue(name = 'send-email') {
    const job = await this.queue.add(name, { at: new Date().toISOString() });
    return { id: job.id, name: job.name };
  }
}
