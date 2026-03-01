import { Injectable } from '@nestjs/common';
import { ReservationRepositoryPort } from '@modules/reservations/domain/ports/reservation.repository.port';
import { RestaurantRepositoryPort } from '@modules/restaurants/domain/ports/restaurant.repository.port';
import { EmailServicePort } from '@modules/notifications/domain/ports/email.service.port';
import { NotFoundError } from '@shared/domain/errors/domain.errors';
import {
  CancelByTokenInput,
  CancelByTokenResult,
} from '../dtos/reservation.dto';

@Injectable()
export class CancelByTokenUseCase {
  constructor(
    private readonly reservationRepository: ReservationRepositoryPort,
    private readonly restaurantRepository: RestaurantRepositoryPort,
    private readonly emailService: EmailServicePort,
  ) {}

  async execute(input: CancelByTokenInput): Promise<CancelByTokenResult> {
    // 1 — Buscar reserva por token
    const reservation = await this.reservationRepository.findByToken(
      input.token,
    );
    if (!reservation) {
      throw new NotFoundError('Reservation not found or token is invalid');
    }

    // 2 — Buscar restaurante para el email
    const restaurant = await this.restaurantRepository.findById(
      reservation.restaurantId,
    );
    if (!restaurant) {
      throw new NotFoundError('Restaurant', reservation.restaurantId);
    }

    // 3 — Cancelar (el dominio valida que esté en estado cancelable)
    reservation.cancel();
    await this.reservationRepository.save(reservation);

    // 4 — Email al cliente
    await this.emailService.sendReservationCancelled({
      to: reservation.customerEmail,
      customerName: reservation.customerName,
      customerLastName: reservation.customerLastName,
      restaurantName: restaurant.name,
      date: reservation.date,
      time: reservation.time,
      numberOfPeople: reservation.numberOfPeople,
    });

    return {
      success: true,
      message: 'Reservation cancelled successfully',
    };
  }
}
