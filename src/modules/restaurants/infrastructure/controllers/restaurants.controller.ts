import { Controller, Get, Param } from '@nestjs/common';
import {
  ListPublicRestaurantsUseCase
} from '@modules/restaurants/application/use-cases/list-public-restaurants.use-case';
import { GetPublicRestaurantUseCase } from '@modules/restaurants/application/use-cases/get-public-restaurant.use-case';

@Controller('restaurants')
export class RestaurantsController {
  constructor(
    private readonly listPublicRestaurants: ListPublicRestaurantsUseCase,
    private readonly getPublicRestaurant: GetPublicRestaurantUseCase,
  ) {}

  @Get()
  async listPublic() {
    return this.listPublicRestaurants.execute();
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.getPublicRestaurant.execute(slug);
  }
}
