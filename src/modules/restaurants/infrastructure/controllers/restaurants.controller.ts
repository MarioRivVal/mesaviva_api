import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ListPublicRestaurantsUseCase } from '@modules/restaurants/application/use-cases/list-public-restaurants.use-case';
import { GetPublicRestaurantUseCase } from '@modules/restaurants/application/use-cases/get-public-restaurant.use-case';
import { Auth } from '@shared/infrastructure/decorators/auth.decorator';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { User } from '@modules/users/domain/entities/user.entity';
import { GetRestaurantsUseCase } from '@modules/restaurants/application/use-cases/get-restaurants.use-case';

@Controller('restaurants')
export class RestaurantsController {
  constructor(
    private readonly listPublicRestaurants: ListPublicRestaurantsUseCase,
    private readonly getPublicRestaurant: GetPublicRestaurantUseCase,
    private readonly getRestaurantsUseCase: GetRestaurantsUseCase,
  ) {}

  @Get()
  async listPublic() {
    return this.listPublicRestaurants.execute();
  }

  @Get('mine')
  @Auth(UserRole.RESTAURANT_ADMIN)
  async getMyRestaurants(@CurrentUser() user: User) {
    return this.getRestaurantsUseCase.execute({
      currentUser: user,
      adminId: user.id,
    });
  }

  @Get('owner/:adminId')
  @Auth(UserRole.SUPERADMIN, UserRole.RESTAURANT_ADMIN)
  async getRestaurantsByAdmin(
    @Param('adminId', ParseUUIDPipe) adminId: string,
    @CurrentUser() user: User,
  ) {
    return this.getRestaurantsUseCase.execute({
      currentUser: user,
      adminId,
    });
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.getPublicRestaurant.execute(slug);
  }
}
