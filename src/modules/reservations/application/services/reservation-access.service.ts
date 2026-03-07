import { Injectable } from '@nestjs/common';
import { ReservationRepositoryPort } from '@modules/reservations/domain/ports/reservation.repository.port';
import { RestaurantRepositoryPort } from '@modules/restaurants/domain/ports/restaurant.repository.port';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';
import { User } from '@modules/users/domain/entities/user.entity';
import {
  ForbiddenError,
  NotFoundError,
} from '@shared/domain/errors/domain.errors';
import { Reservation } from '@modules/reservations/domain/entities/reservation.entity';
import { Restaurant } from '@modules/restaurants/domain/entities/restaurant.entity';

export interface ReservationAccess {
  reservation: Reservation;
  restaurant: Restaurant;
}

@Injectable()
export class ReservationAccessService {
  constructor(
    private readonly reservationRepository: ReservationRepositoryPort,
    private readonly restaurantRepository: RestaurantRepositoryPort,
  ) {}

  async resolveAndAuthorize(
    reservationId: string,
    currentUser: User,
  ): Promise<ReservationAccess> {
    const reservation =
      await this.reservationRepository.findById(reservationId);
    if (!reservation) throw new NotFoundError('Reservation', reservationId);

    const restaurant = await this.restaurantRepository.findById(
      reservation.restaurantId,
    );
    if (!restaurant)
      throw new NotFoundError('Restaurant', reservation.restaurantId);

    if (
      currentUser.role === UserRole.RESTAURANT_ADMIN &&
      restaurant.adminId !== currentUser.id
    ) {
      throw new ForbiddenError(
        'You can only manage reservations of your own restaurant',
      );
    }

    return { reservation, restaurant };
  }
}

