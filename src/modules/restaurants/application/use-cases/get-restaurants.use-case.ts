import { Injectable } from '@nestjs/common';
import { RestaurantRepositoryPort } from '@modules/restaurants/domain/ports/restaurant.repository.port';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';
import { ForbiddenError } from '@shared/domain/errors/domain.errors';
import {
  GetRestaurantsInput,
  GetRestaurantsResult,
} from '../dtos/restaurant.dto';

@Injectable()
export class GetRestaurantsUseCase {
  constructor(
    private readonly restaurantRepository: RestaurantRepositoryPort,
  ) {}

  async execute(input: GetRestaurantsInput): Promise<GetRestaurantsResult> {
    if (input.currentUser.role === UserRole.RESTAURANT_ADMIN) {
      if (input.currentUser.id !== input.adminId) {
        throw new ForbiddenError('You can only view your own restaurants');
      }
    }

    const rawRestaurants = await this.restaurantRepository.findAllByOwnerId(
      input.adminId,
    );

    const restaurants = rawRestaurants.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      adminId: r.adminId,
      phone: r.phone,
      address: r.address,
      category: r.category,
      email: r.email,
      imageUrl: r.imageUrl,
      isActive: r.isActive,
    }));

    return { restaurants, total: restaurants.length };
  }
}
