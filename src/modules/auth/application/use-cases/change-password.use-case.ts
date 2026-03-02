import { Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '@modules/users/domain/ports/user.repository.port';
import { PasswordHasherPort } from '@shared/domain/ports/password-hasher.port';
import {
  BadRequestError,
  UnauthorizedError,
} from '@shared/domain/errors/domain.errors';
import { ChangePasswordInput } from '@modules/auth/application/dtos/auth.dto';
import { validatePasswordStrength } from '@shared/domain/utils/password-strength.util';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    validatePasswordStrength(input.newPassword);

    const user = await this.userRepository.findByEmailWithPassword(
      input.currentUser.email,
    );
    if (!user) throw new UnauthorizedError('User not found');

    const isValid = await this.passwordHasher.compare(
      input.currentPassword,
      user.passwordHash,
    );
    if (!isValid) throw new BadRequestError('Current password is incorrect');

    const isSame = await this.passwordHasher.compare(
      input.newPassword,
      user.passwordHash,
    );
    if (isSame)
      throw new BadRequestError(
        'New password must be different from current password',
      );

    user.passwordHash = await this.passwordHasher.hash(input.newPassword);
    user.mustChangePassword = false;
    await this.userRepository.save(user);
  }
}
