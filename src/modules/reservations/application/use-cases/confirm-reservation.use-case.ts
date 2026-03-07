import { Injectable } from '@nestjs/common';
import { ReservationRepositoryPort } from '@modules/reservations/domain/ports/reservation.repository.port';
import { EmailServicePort } from '@modules/notifications/domain/ports/email.service.port';
import { ReservationAccessService } from '../services/reservation-access.service';
import { ConfirmReservationInput } from '../dtos/reservation.dto';

@Injectable()
export class ConfirmReservationUseCase {
  constructor(
    private readonly reservationRepository: ReservationRepositoryPort,
    private readonly emailService: EmailServicePort,
    private readonly reservationAccess: ReservationAccessService,
  ) {}

  async execute(input: ConfirmReservationInput): Promise<void> {
    const { reservation, restaurant } =
      await this.reservationAccess.resolveAndAuthorize(
        input.reservationId,
        input.currentUser,
      );

    reservation.accept();
    await this.reservationRepository.save(reservation);

    await this.emailService.sendReservationAccepted({
      to: reservation.customerEmail,
      customerName: reservation.customerName,
      customerLastName: reservation.customerLastName,
      restaurantName: restaurant.name,
      date: reservation.date,
      time: reservation.time,
      numberOfPeople: reservation.numberOfPeople,
      notes: reservation.notes ?? undefined,
      cancellationToken: reservation.cancellationToken,
    });
  }
}
