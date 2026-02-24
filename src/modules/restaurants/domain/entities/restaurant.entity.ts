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

  toggleIsActive(): void {
    this.isActive = !this.isActive;
  }
}
