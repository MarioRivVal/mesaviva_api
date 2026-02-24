import { UserRole } from '../../domain/enums/user-role.enum';
import { RestaurantCategory } from '../../../restaurants/domain/enums/restaurant-category.enum';

export interface CreateRestaurantAdminInput {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  restaurantName: string;
  restaurantPhone: string;
  restaurantAddress: string;
  restaurantCategory: RestaurantCategory;
  restaurantEmail: string;
  restaurantImageUrl: string;
}

export interface CreateRestaurantAdminResult {
  user: {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    phone: string;
    mustChangePassword: boolean;
  };
  restaurant: {
    id: string;
    name: string;
    adminId: string;
    phone: string;
    address: string;
    category: RestaurantCategory;
    email: string;
    imageUrl: string;
    slug: string;
  };
  tempPassword: string;
}
