import { Injectable } from '@nestjs/common';
import { SettingsRepositoryPort } from '@modules/settings/domain/ports/settings.repository.port';
import { RestaurantRepositoryPort } from '@modules/restaurants/domain/ports/restaurant.repository.port';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';
import {
  ForbiddenError,
  NotFoundError,
} from '@shared/domain/errors/domain.errors';
import { GetSettingsInput, SettingsResult } from '../dtos/settings.dto';

@Injectable()
export class GetSettingsUseCase {
  constructor(
    private readonly settingsRepository: SettingsRepositoryPort,
    private readonly restaurantRepository: RestaurantRepositoryPort,
  ) {}

  async execute(input: GetSettingsInput): Promise<SettingsResult> {
    const restaurant = await this.restaurantRepository.findById(
      input.restaurantId,
    );
    if (!restaurant) {
      throw new NotFoundError('Restaurant', input.restaurantId);
    }

    if (input.currentUser.role === UserRole.RESTAURANT_ADMIN) {
      if (restaurant.adminId !== input.currentUser.id) {
        throw new ForbiddenError(
          'You can only view settings of your own restaurant',
        );
      }
    }

    const settings = await this.settingsRepository.findByRestaurantId(
      input.restaurantId,
    );
    if (!settings) {
      throw new NotFoundError('Settings for restaurant', input.restaurantId);
    }

    return {
      id: settings.id,
      restaurantId: settings.restaurantId,
      openingHours: settings.openingHours,
      timeSlotInterval: settings.timeSlotInterval,
      depositAmount: settings.depositAmount,
      acceptanceMode: settings.acceptanceMode,
      timestamps: {
        createdAt: settings.createdAt!,
        updatedAt: settings.updatedAt!,
      },
    };
  }
}
