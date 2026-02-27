import { RestaurantCategory } from '../enums/restaurant-category.enum';

export class Restaurant {
  constructor(
    public readonly id: string,
    public name: string,
    public readonly adminId: string,
    public phone: string,
    public address: string,
    public readonly category: RestaurantCategory,
    public readonly email: string,
    public imageUrl: string,
    public slug: string,
    public isActive: boolean,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  static create(params: {
    id: string;
    name: string;
    adminId: string;
    phone: string;
    address: string;
    category: RestaurantCategory;
    email: string;
    imageUrl: string;
    slug: string;
    isActive: boolean;
  }): Restaurant {
    return new Restaurant(
      params.id,
      params.name,
      params.adminId,
      params.phone,
      params.address,
      params.category,
      params.email,
      params.imageUrl,
      params.slug,
      params.isActive,
    );
  }

  toggleIsActive(): void {
    this.isActive = !this.isActive;
  }
}
