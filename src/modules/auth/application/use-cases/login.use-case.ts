import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedError } from '@shared/domain/errors/domain.errors';
import { UserRepositoryPort } from '@modules/users/domain/ports/user.repository.port';
import { User } from '@modules/users/domain/entities/user.entity';
import { PasswordHasherPort } from '@shared/domain/ports/password-hasher.port';
import {
  LoginInput,
  LoginResult,
} from '@modules/auth/application/dtos/login.dto';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly jwtService: JwtService,
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    const user = await this.validateUser(input.email, input.password);

    if (!user) {
      throw new UnauthorizedError('Datos de acceso incorrectos');
    }

    const payload = {
      sub: user.id,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  private async validateUser(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.userRepository.findByEmailWithPassword(email);
    if (!user) return null;

    const isValid = await this.passwordHasher.compare(
      password,
      user.passwordHash,
    );
    if (!isValid) return null;

    return user;
  }
}
