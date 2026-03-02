import { Injectable } from '@nestjs/common';
import { ReservationRepositoryPort } from '@modules/reservations/domain/ports/reservation.repository.port';
import { EmailServicePort } from '@modules/notifications/domain/ports/email.service.port';
import { ReservationAccessService } from '../services/reservation-access.service';
import { RejectReservationInput } from '../dtos/reservation.dto';

@Injectable()
export class RejectReservationUseCase {
  constructor(
    private readonly reservationRepository: ReservationRepositoryPort,
    private readonly emailService: EmailServicePort,
    private readonly reservationAccess: ReservationAccessService,
  ) {}

  async execute(input: RejectReservationInput): Promise<void> {
    const { reservation, restaurant } =
      await this.reservationAccess.resolveAndAuthorize(
        input.reservationId,
        input.currentUser,
      );

    reservation.reject(input.reason);
    await this.reservationRepository.save(reservation);

    await this.emailService.sendReservationRejected({
      to: reservation.customerEmail,
      customerName: reservation.customerName,
      customerLastName: reservation.customerLastName,
      restaurantName: restaurant.name,
      date: reservation.date,
      time: reservation.time,
      numberOfPeople: reservation.numberOfPeople,
      rejectionReason: input.reason,
    });
  }
}
