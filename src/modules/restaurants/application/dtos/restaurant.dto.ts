import { RestaurantCategory } from '@modules/restaurants/domain/enums/restaurant-category.enum';
import { PublicSettingsResult } from '@modules/settings/application/dtos/settings.dto';
import { User } from '@modules/users/domain/entities/user.entity';

// ─── Base compartida ──────────────────────────────────────────────────────────

interface RestaurantBase {
  id: string;
  name: string;
  slug: string;
  category: RestaurantCategory;
  address: string;
  imageUrl: string;
}

// ─── Tipo genérico paginado ───────────────────────────────────────────────────

interface PaginatedResult<T> {
  restaurants: T[];
  total: number;
}

// ─── DTOs públicos ────────────────────────────────────────────────────────────

export type PublicRestaurantListItem = RestaurantBase;

export type PublicRestaurantListResult =
  PaginatedResult<PublicRestaurantListItem>;

export interface PublicRestaurantDetail extends RestaurantBase {
  email: string;
  phone: string;
  settings: PublicSettingsResult | null;
}

// ─── DTOs admin ───────────────────────────────────────────────────────────────

export interface GetRestaurantsInput {
  currentUser: User;
  adminId: string;
}

export interface RestaurantItem extends RestaurantBase {
  adminId: string;
  phone: string;
  email: string;
  isActive: boolean;
}

export type GetRestaurantsResult = PaginatedResult<RestaurantItem>;
