import { Restaurant } from '../entities/restaurant.entity';

export abstract class RestaurantRepositoryPort {
  abstract findById(id: string): Promise<Restaurant | null>;
  abstract findAllByOwnerId(id: string): Promise<Restaurant[]>;
  abstract findBySlug(slug: string): Promise<Restaurant | null>;
  abstract findAll(): Promise<Restaurant[]>;
  abstract save(restaurant: Restaurant): Promise<Restaurant>;
  abstract delete(id: string): Promise<void>;
}
