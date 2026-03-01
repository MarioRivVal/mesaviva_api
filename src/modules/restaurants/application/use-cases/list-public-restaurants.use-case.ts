import { Injectable } from '@nestjs/common';
import { RestaurantRepositoryPort } from '@modules/restaurants/domain/ports/restaurant.repository.port';
import {
  PublicRestaurantListItem,
  PublicRestaurantListResult,
} from '../dtos/restaurant.dto';

@Injectable()
export class ListPublicRestaurantsUseCase {
  constructor(
    private readonly restaurantRepository: RestaurantRepositoryPort,
  ) {}

  async execute(): Promise<PublicRestaurantListResult> {
    const allRestaurants = await this.restaurantRepository.findAll();

    const activeRestaurants = allRestaurants.filter(
      (restaurant) => restaurant.isActive,
    );

    const restaurants: PublicRestaurantListItem[] = activeRestaurants.map(
      (r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        category: r.category,
        address: r.address,
        imageUrl: r.imageUrl,
      }),
    );

    return {
      restaurants,
      total: restaurants.length,
    };
  }
}
