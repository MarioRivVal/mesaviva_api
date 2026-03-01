import { Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { RestaurantRepositoryPort } from '../../../restaurants/domain/ports/restaurant.repository.port';
import {
  CreateRestaurantAdminInput,
  CreateRestaurantAdminResult,
} from '../dtos/create-restaurant-admin.dto';
import { User } from '@modules/users/domain/entities/user.entity';
import { Restaurant } from '@modules/restaurants/domain/entities/restaurant.entity';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';
import { PasswordHasherPort } from '@shared/domain/ports/password-hasher.port';

import { EmailServicePort } from '@modules/notifications/application/ports/email.service.port';
import { ConflictError } from '@shared/domain/errors/domain.errors';
import { generateTemporaryPassword } from '@shared/domain/utils/password-generator.utils';
import { generateSlug } from '@shared/domain/utils/generate-slug.utils';

@Injectable()
export class CreateRestaurantAdminUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly restaurantRepository: RestaurantRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly emailService: EmailServicePort,
  ) {}

  async execute(
    input: CreateRestaurantAdminInput,
  ): Promise<CreateRestaurantAdminResult> {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError(`User with email ${input.email} already exists`);
    }

    const tempPassword = generateTemporaryPassword();
    const passwordHash = await this.passwordHasher.hash(tempPassword);

    let slug = generateSlug(input.restaurantName);
    const existingSlug = await this.restaurantRepository.findBySlug(slug);
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const user = User.create({
      id: crypto.randomUUID(),
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email,
      passwordHash,
      role: UserRole.RESTAURANT_ADMIN,
      mustChangePassword: true,
      isActive: true,
    });

    const restaurant = Restaurant.create({
      id: crypto.randomUUID(),
      name: input.restaurantName,
      adminId: user.id,
      phone: input.restaurantPhone,
      address: input.restaurantAddress,
      category: input.restaurantCategory,
      email: input.restaurantEmail,
      imageUrl: input.restaurantImageUrl,
      slug,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);

    let savedRestaurant: Restaurant;
    try {
      savedRestaurant = await this.restaurantRepository.save(restaurant);
    } catch (error) {
      await this.userRepository.delete(savedUser.id);
      throw error;
    }

    await this.emailService.sendWelcomeToNewAdmin({
      to: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      restaurantName: savedRestaurant.name,
      restaurantCategory: savedRestaurant.category,
      restaurantAddress: savedRestaurant.address,
      restaurantPhone: savedRestaurant.phone,
      restaurantEmail: savedRestaurant.email,
      tempPassword: tempPassword,
    });

    return {
      user: {
        id: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        phone: savedUser.phone,
        mustChangePassword: savedUser.mustChangePassword,
      },
      restaurant: {
        id: savedRestaurant.id,
        name: savedRestaurant.name,
        adminId: savedRestaurant.adminId,
        phone: savedRestaurant.phone,
        address: savedRestaurant.address,
        category: savedRestaurant.category,
        email: savedRestaurant.email,
        imageUrl: savedRestaurant.imageUrl,
        slug: savedRestaurant.slug,
      },
      tempPassword: tempPassword,
    };
  }
}
