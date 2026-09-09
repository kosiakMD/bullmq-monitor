import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailsController } from './emails.controller';
import { EmailsProcessor } from './emails.processor';
import { EmailsService } from './emails.service';
import { EMAILS_QUEUE } from './emails.constants';

export { EMAILS_QUEUE };

@Module({
  imports: [BullModule.registerQueue({ name: EMAILS_QUEUE })],
  controllers: [EmailsController],
  providers: [EmailsService, EmailsProcessor],
  exports: [BullModule],
})
export class EmailsModule {}
