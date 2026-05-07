import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService } from 'src/auth/email.service';
import { EmailHeaderKeyGuard } from './email-header-key.guard';

@Module({
  providers: [EmailService, EmailHeaderKeyGuard],
  controllers: [EmailController]
})
export class EmailModule { }
