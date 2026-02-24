import { Body, Controller, Post } from '@nestjs/common';
import { CreateRestaurantAdminHttpDto } from './dtos/create-restaurant-admin.http-dto';
import { CreateRestaurantAdminResult } from '../../application/dtos/create-restaurant-admin.dto';
import { CreateRestaurantAdminUseCase } from '../../application/use-cases/create-restaurant-admin.use-case';

@Controller('users')
export class UsersController {
  constructor(
    private readonly createRestaurantAdminUseCase: CreateRestaurantAdminUseCase,
  ) {}

  @Post('restaurant-admin')
  async createRestaurantAdmin(
    @Body() body: CreateRestaurantAdminHttpDto,
  ): Promise<CreateRestaurantAdminResult> {
    return this.createRestaurantAdminUseCase.execute(body);
  }
}
