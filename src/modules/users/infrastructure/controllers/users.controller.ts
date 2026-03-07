import { Body, Controller, Post } from '@nestjs/common';
import { CreateRestaurantAdminHttpDto } from './dtos/create-restaurant-admin.http-dto';
import { CreateRestaurantAdminResult } from '@modules/users/application/dtos/create-restaurant-admin.dto';
import { CreateRestaurantAdminUseCase } from '@modules/users/application/use-cases/create-restaurant-admin.use-case';
import { Auth } from '@shared/infrastructure/decorators/auth.decorator';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';

@Controller('users')
export class UsersController {
  constructor(
    private readonly createRestaurantAdminUseCase: CreateRestaurantAdminUseCase,
  ) {}

  @Auth(UserRole.SUPERADMIN)
  @Post('restaurant-admin')
  async createRestaurantAdmin(
    @Body() body: CreateRestaurantAdminHttpDto,
  ): Promise<CreateRestaurantAdminResult> {
    return this.createRestaurantAdminUseCase.execute(body);
  }
}
