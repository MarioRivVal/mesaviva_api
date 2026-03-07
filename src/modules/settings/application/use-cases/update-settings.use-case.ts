import { Injectable } from '@nestjs/common';
import { SettingsRepositoryPort } from '@modules/settings/domain/ports/settings.repository.port';
import { RestaurantRepositoryPort } from '@modules/restaurants/domain/ports/restaurant.repository.port';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';
import { Settings } from '@modules/settings/domain/entities/settings.entity';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '@shared/domain/errors/domain.errors';
import { SettingsResult, UpdateSettingsInput } from '../dtos/settings.dto';

@Injectable()
export class UpdateSettingsUseCase {
  constructor(
    private readonly settingsRepository: SettingsRepositoryPort,
    private readonly restaurantRepository: RestaurantRepositoryPort,
  ) {}

  async execute(input: UpdateSettingsInput): Promise<SettingsResult> {
    const restaurant = await this.restaurantRepository.findById(
      input.restaurantId,
    );
    if (!restaurant) {
      throw new NotFoundError('Restaurant', input.restaurantId);
    }

    if (input.currentUser.role === UserRole.RESTAURANT_ADMIN) {
      if (restaurant.adminId !== input.currentUser.id) {
        throw new ForbiddenError(
          'You can only update settings of your own restaurant',
        );
      }
    }

    const existingSettings = await this.settingsRepository.findByRestaurantId(
      input.restaurantId,
    );

    let settings: Settings;

    if (existingSettings) {
      if (input.openingHours !== undefined) {
        existingSettings.openingHours = input.openingHours;
      }
      if (input.timeSlotInterval !== undefined) {
        existingSettings.timeSlotInterval = input.timeSlotInterval;
      }
      if (input.depositAmount !== undefined) {
        existingSettings.depositAmount = input.depositAmount;
      }
      if (input.acceptanceMode !== undefined) {
        existingSettings.acceptanceMode = input.acceptanceMode;
      }

      settings = existingSettings;
    } else {
      if (
        !input.openingHours ||
        !input.timeSlotInterval ||
        input.depositAmount === undefined ||
        !input.acceptanceMode
      ) {
        throw new BadRequestError(
          'All fields are required when creating settings for the first time',
        );
      }

      settings = Settings.create({
        id: crypto.randomUUID(),
        restaurantId: input.restaurantId,
        openingHours: input.openingHours,
        timeSlotInterval: input.timeSlotInterval,
        depositAmount: input.depositAmount,
        acceptanceMode: input.acceptanceMode,
      });
    }

    const saved = await this.settingsRepository.save(settings);

    return {
      id: saved.id,
      restaurantId: saved.restaurantId,
      openingHours: saved.openingHours,
      timeSlotInterval: saved.timeSlotInterval,
      depositAmount: saved.depositAmount,
      acceptanceMode: saved.acceptanceMode,
      timestamps: {
        createdAt: saved.createdAt!,
        updatedAt: saved.updatedAt!,
      },
    };
  }
}
