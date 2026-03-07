import { Settings } from '../entities/settings.entity';

export abstract class SettingsRepositoryPort {
  abstract findByRestaurantId(restaurantId: string): Promise<Settings | null>;
  abstract save(settings: Settings): Promise<Settings>;
}
