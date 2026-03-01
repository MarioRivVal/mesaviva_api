import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, } from '@nestjs/common';
import { Auth } from '@shared/infrastructure/decorators/auth.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';
import { User } from '@modules/users/domain/entities/user.entity';
import { GetSettingsUseCase } from '../../application/use-cases/get-settings.use-case';
import { UpdateSettingsUseCase } from '../../application/use-cases/update-settings.use-case';
import { UpdateSettingsHttpDto } from './dtos/update-settings.http-dto';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly getSettingsUseCase: GetSettingsUseCase,
    private readonly updateSettingsUseCase: UpdateSettingsUseCase,
  ) {}

  @Get(':restaurantId')
  @Auth(UserRole.SUPERADMIN, UserRole.RESTAURANT_ADMIN)
  async getSettings(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @CurrentUser() user: User,
  ) {
    return this.getSettingsUseCase.execute({ restaurantId, currentUser: user });
  }

  @Patch(':restaurantId')
  @Auth(UserRole.SUPERADMIN, UserRole.RESTAURANT_ADMIN)
  async updateSettings(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() body: UpdateSettingsHttpDto,
    @CurrentUser() user: User,
  ) {
    return this.updateSettingsUseCase.execute({
      restaurantId,
      currentUser: user,
      ...body,
    });
  }
}
