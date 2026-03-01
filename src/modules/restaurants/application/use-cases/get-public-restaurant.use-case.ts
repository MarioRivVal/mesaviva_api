import { Injectable } from '@nestjs/common';
import { RestaurantRepositoryPort } from '@modules/restaurants/domain/ports/restaurant.repository.port';
import { SettingsRepositoryPort } from '@modules/settings/domain/ports/settings.repository.port';
import { NotFoundError } from '@shared/domain/errors/domain.errors';
import { PublicRestaurantDetail } from '../dtos/restaurant.dto';

@Injectable()
export class GetPublicRestaurantUseCase {
  constructor(
    private readonly restaurantRepository: RestaurantRepositoryPort,
    private readonly settingsRepository: SettingsRepositoryPort,
  ) {}

  async execute(slug: string): Promise<PublicRestaurantDetail> {
    const restaurant = await this.restaurantRepository.findBySlug(slug);

    if (!restaurant) {
      throw new NotFoundError('Restaurant', slug);
    }

    if (!restaurant.isActive) {
      throw new NotFoundError('Restaurant is not available');
    }

    const settings = await this.settingsRepository.findByRestaurantId(
      restaurant.id,
    );

    return {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      category: restaurant.category,
      address: restaurant.address,
      email: restaurant.email,
      phone: restaurant.phone,
      imageUrl: restaurant.imageUrl,
      settings: settings
        ? {
            openingHours: settings.openingHours,
            timeSlotInterval: settings.timeSlotInterval,
            depositAmount: settings.depositAmount,
            acceptanceMode: settings.acceptanceMode,
          }
        : null,
    };
  }
}
