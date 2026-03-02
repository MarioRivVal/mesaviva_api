import { Injectable } from '@nestjs/common';
import { ReservationRepositoryPort } from '@modules/reservations/domain/ports/reservation.repository.port';
import { EmailServicePort } from '@modules/notifications/domain/ports/email.service.port';
import { ReservationAccessService } from '../services/reservation-access.service';
import { CancelReservationInput } from '../dtos/reservation.dto';

@Injectable()
export class CancelReservationUseCase {
  constructor(
    private readonly reservationRepository: ReservationRepositoryPort,
    private readonly emailService: EmailServicePort,
    private readonly reservationAccess: ReservationAccessService,
  ) {}

  async execute(input: CancelReservationInput): Promise<void> {
    const { reservation, restaurant } =
      await this.reservationAccess.resolveAndAuthorize(
        input.reservationId,
        input.currentUser,
      );

    reservation.cancel();
    await this.reservationRepository.save(reservation);

    await this.emailService.sendReservationCancelled({
      to: reservation.customerEmail,
      customerName: reservation.customerName,
      customerLastName: reservation.customerLastName,
      restaurantName: restaurant.name,
      date: reservation.date,
      time: reservation.time,
      numberOfPeople: reservation.numberOfPeople,
    });
  }
}
