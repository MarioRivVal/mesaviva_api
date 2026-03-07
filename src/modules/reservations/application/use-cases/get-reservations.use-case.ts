import { Injectable } from '@nestjs/common';
import { ReservationRepositoryPort } from '@modules/reservations/domain/ports/reservation.repository.port';
import { RestaurantRepositoryPort } from '@modules/restaurants/domain/ports/restaurant.repository.port';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';
import {
  ForbiddenError,
  NotFoundError,
} from '@shared/domain/errors/domain.errors';
import { Reservation } from '@modules/reservations/domain/entities/reservation.entity';
import { GetReservationsInput } from '@modules/reservations/application/dtos/reservation.dto';

@Injectable()
export class GetReservationsUseCase {
  constructor(
    private readonly reservationRepository: ReservationRepositoryPort,
    private readonly restaurantRepository: RestaurantRepositoryPort,
  ) {}

  async execute(input: GetReservationsInput): Promise<Reservation[]> {
    const restaurant = await this.restaurantRepository.findById(
      input.restaurantId,
    );
    if (!restaurant) throw new NotFoundError('Restaurant', input.restaurantId);

    if (input.currentUser.role === UserRole.RESTAURANT_ADMIN) {
      if (restaurant.adminId !== input.currentUser.id) {
        throw new ForbiddenError(
          'You can only view reservations of your own restaurant',
        );
      }
    }

    return this.reservationRepository.findByRestaurantAndFilters(
      input.restaurantId,
      input.filters,
    );
  }
}
