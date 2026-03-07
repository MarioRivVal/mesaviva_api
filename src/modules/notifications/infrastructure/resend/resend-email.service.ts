import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  EmailServicePort,
  NewReservationAdminParams,
  ReservationAcceptedParams,
  ReservationCancelledParams,
  ReservationPendingParams,
  ReservationRejectedParams,
  WelcomeAdminParams,
} from '@modules/notifications/domain/ports/email.service.port';
import { getWelcomeAdminTemplate } from './templates/welcome-admin.template';
import { getReservationAcceptedTemplate } from './templates/reservation-accepted.template';
import { getReservationRejectedTemplate } from './templates/reservation-rejected.template';
import { getNewReservationAdminTemplate } from './templates/new-reservation-admin.template';
import { getReservationPendingTemplate } from '@modules/notifications/infrastructure/resend/templates/reservation-pending.template';
import { getReservationCancelledTemplate } from '@modules/notifications/infrastructure/resend/templates/reservationCancelled.template';

@Injectable()
export class ResendEmailService extends EmailServicePort {
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly devRedirect: string | undefined;
  private readonly isDev: boolean;
  private readonly logger = new Logger(ResendEmailService.name);

  constructor(private readonly configService: ConfigService) {
    super();
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    const fromName = this.configService.get<string>('EMAIL_FROM_NAME');
    const fromEmail = this.configService.get<string>('EMAIL_FROM_ADDRESS');

    if (!apiKey || !fromName || !fromEmail) {
      throw new Error(
        'Email config incompleta. Requeridas: RESEND_API_KEY, EMAIL_FROM_NAME, EMAIL_FROM_ADDRESS',
      );
    }

    this.resend = new Resend(apiKey);
    this.fromName = fromName;
    this.fromEmail = fromEmail;
    this.devRedirect = this.configService.get<string>('EMAIL_DEV_REDIRECT');
    this.isDev = this.configService.get<string>('NODE_ENV') === 'development';
  }

  private get from(): string {
    return `${this.fromName} <${this.fromEmail}>`;
  }

  async sendWelcomeToNewAdmin(params: WelcomeAdminParams): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.from,
        to: this.getRecipient(params.to),
        subject: '🎉 Bienvenido a MesaViva - Credenciales de Acceso',
        html: getWelcomeAdminTemplate(params),
      });
    } catch (error) {
      this.logger.error(`Error enviando welcome email a ${params.to}`, error);
    }
  }

  async sendReservationAccepted(
    params: ReservationAcceptedParams,
  ): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.from,
        to: this.getRecipient(params.to),
        subject: '✅ Reserva Confirmada',
        html: getReservationAcceptedTemplate(params),
      });
    } catch (error) {
      this.logger.error(
        `Error enviando email confirmación a ${params.to}`,
        error,
      );
    }
  }

  async sendReservationRejected(
    params: ReservationRejectedParams,
  ): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.from,
        to: this.getRecipient(params.to),
        subject: '❌ Reserva No Confirmada',
        html: getReservationRejectedTemplate(params),
      });
    } catch (error) {
      this.logger.error(`Error enviando email rechazo a ${params.to}`, error);
    }
  }

  async sendNewReservationToAdmin(
    params: NewReservationAdminParams,
  ): Promise<void> {
    try {
      const subject = params.isAutoConfirmed
        ? '✅ Nueva Reserva Confirmada'
        : '🔔 Nueva Reserva Pendiente de Aprobación';

      await this.resend.emails.send({
        from: this.from,
        to: this.getRecipient(params.to),
        subject,
        html: getNewReservationAdminTemplate(params),
      });
    } catch (error) {
      this.logger.error(`Error enviando email admin a ${params.to}`, error);
    }
  }

  async sendReservationPending(
    params: ReservationPendingParams,
  ): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.from,
        to: this.getRecipient(params.to),
        subject: '🕐 Solicitud de Reserva Recibida',
        html: getReservationPendingTemplate(params),
      });
    } catch (error) {
      this.logger.error(`Error enviando email pendiente a ${params.to}`, error);
    }
  }

  async sendReservationCancelled(
    params: ReservationCancelledParams,
  ): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.from,
        to: this.getRecipient(params.to),
        subject: 'Reserva Cancelada',
        html: getReservationCancelledTemplate(params),
      });
    } catch (error) {
      this.logger.error(
        `Error enviando email cancelación a ${params.to}`,
        error,
      );
    }
  }

  private getRecipient(realEmail: string): string {
    return this.isDev && this.devRedirect ? this.devRedirect : realEmail;
  }
}
