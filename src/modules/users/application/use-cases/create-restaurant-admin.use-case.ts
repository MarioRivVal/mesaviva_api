import { Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { RestaurantRepositoryPort } from '../../../restaurants/domain/ports/restaurant.repository.port';
import { CreateRestaurantAdminInput, CreateRestaurantAdminResult, } from '../dtos/create-restaurant-admin.dto';
import { User } from '@modules/users/domain/entities/user.entity';
import { Restaurant } from '@modules/restaurants/domain/entities/restaurant.entity';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';
import { PasswordHasherPort } from '@shared/domain/ports/password-hasher.port';

import { EmailServicePort } from '@modules/notifications/application/ports/email.service.port';
import { ConflictError } from '@shared/domain/errors/domain.error';
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

    const user = new User(
      crypto.randomUUID(),
      input.firstName,
      input.lastName,
      input.phone,
      input.email,
      passwordHash,
      UserRole.RESTAURANT_ADMIN,
      true,
      true,
    );

    const restaurant = new Restaurant(
      crypto.randomUUID(),
      input.restaurantName,
      user.id,
      input.restaurantPhone,
      input.restaurantAddress,
      input.restaurantCategory,
      input.restaurantEmail,
      slug,
      input.restaurantImageUrl,
      true,
    );

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
