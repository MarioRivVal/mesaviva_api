// reservations/application/use-cases/get-reservation.use-case.ts
import { Injectable } from '@nestjs/common';
import { ReservationRepositoryPort } from '@modules/reservations/domain/ports/reservation.repository.port';
import { RestaurantRepositoryPort } from '@modules/restaurants/domain/ports/restaurant.repository.port';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';
import {
  ForbiddenError,
  NotFoundError,
} from '@shared/domain/errors/domain.errors';
import { GetReservationInput } from '@modules/reservations/application/dtos/reservation.dto';

@Injectable()
export class GetReservationUseCase {
  constructor(
    private readonly reservationRepository: ReservationRepositoryPort,
    private readonly restaurantRepository: RestaurantRepositoryPort,
  ) {}

  async execute(input: GetReservationInput) {
    const reservation = await this.reservationRepository.findById(
      input.reservationId,
    );
    if (!reservation)
      throw new NotFoundError('Reservation', input.reservationId);

    const restaurant = await this.restaurantRepository.findById(
      reservation.restaurantId,
    );
    if (!restaurant)
      throw new NotFoundError('Restaurant', reservation.restaurantId);

    if (input.currentUser.role === UserRole.RESTAURANT_ADMIN) {
      if (restaurant.adminId !== input.currentUser.id) {
        throw new ForbiddenError(
          'You can only view reservations of your own restaurant',
        );
      }
    }

    return reservation;
  }
}
