import { Controller, Post, Query } from '@nestjs/common';
import { EmailsService } from './emails.service';

@Controller('emails')
export class EmailsController {
  constructor(private readonly emails: EmailsService) {}

  @Post('send')
  send(@Query('name') name?: string) {
    return this.emails.enqueue(name);
  }
}
