import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailServicePort } from './application/ports/email.service.port';
import { ResendEmailService } from './infrastructure/resend/resend-email.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: EmailServicePort,
      useClass: ResendEmailService,
    },
  ],
  exports: [EmailServicePort],
})
export class NotificationsModule {}
