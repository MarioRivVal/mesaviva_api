import { RestaurantCategory } from '@modules/restaurants/domain/enums/restaurant-category.enum';
import { PublicSettingsResult } from '@modules/settings/application/dtos/settings.dto';

export interface PublicRestaurantListItem {
  id: string;
  name: string;
  slug: string;
  category: RestaurantCategory;
  address: string;
  imageUrl: string;
}

export interface PublicRestaurantListResult {
  restaurants: PublicRestaurantListItem[];
  total: number;
}

export interface PublicRestaurantDetail {
  id: string;
  name: string;
  slug: string;
  category: RestaurantCategory;
  address: string;
  email: string;
  phone: string;
  imageUrl: string;
  settings: PublicSettingsResult | null;
}
