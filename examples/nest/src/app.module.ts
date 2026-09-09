import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullMonitorModule, BullMQAdapter } from '@bullmq-monitor/nest';
import { getQueueToken } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { EmailsModule } from './emails/emails.module';
import { EMAILS_QUEUE } from './emails/emails.constants';
import { connection } from './config';

@Module({
  imports: [
    BullModule.forRoot({ connection }),
    EmailsModule,
    /**
     * forRootAsync lets the dashboard reuse the very same queue instances
     * that @nestjs/bullmq already manages.
     */
    BullMonitorModule.forRootAsync({
      path: '/admin/queues',
      imports: [EmailsModule],
      inject: [getQueueToken(EMAILS_QUEUE)],
      useFactory: (emails: Queue) => ({
        queues: [new BullMQAdapter(emails)],
        metrics: { collectInterval: { seconds: 30 }, maxMetrics: 50 },
      }),
    }),
  ],
})
export class AppModule {}
