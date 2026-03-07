import { LoginUseCase } from '@modules/auth/application/use-cases/login.use-case';
import { UserRepositoryPort } from '@modules/users/domain/ports/user.repository.port';
import { PasswordHasherPort } from '@shared/domain/ports/password-hasher.port';
import { JwtService } from '@nestjs/jwt';
import { User } from '@modules/users/domain/entities/user.entity';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';
import { UnauthorizedError } from '@shared/domain/errors/domain.errors';

const makeUser = (mustChangePassword = false): User =>
  new User(
    'user-id-1',
    'Mario',
    'Rivera',
    '+34600000000',
    'mario@test.com',
    'hashed-password',
    UserRole.RESTAURANT_ADMIN,
    mustChangePassword,
    true,
    new Date(),
    new Date(),
  );

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepository: jest.Mocked<UserRepositoryPort>;
  let jwtService: jest.Mocked<JwtService>;
  let passwordHasher: jest.Mocked<PasswordHasherPort>;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findById: jest.fn(),
      findAllRestaurantAdmins: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<UserRepositoryPort>;

    jwtService = {
      signAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    } as jest.Mocked<PasswordHasherPort>;

    useCase = new LoginUseCase(userRepository, jwtService, passwordHasher);
  });

  describe('execute', () => {
    it('debería retornar accessToken y datos del usuario cuando las credenciales son válidas', async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue(makeUser());
      passwordHasher.compare.mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await useCase.execute({
        email: 'mario@test.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('jwt-token');
      expect(result.user.email).toBe('mario@test.com');
      expect(result.user.id).toBe('user-id-1');
      expect(result.user.role).toBe(UserRole.RESTAURANT_ADMIN);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-id-1',
        role: UserRole.RESTAURANT_ADMIN,
      });
    });

    it('debería lanzar UnauthorizedError si el usuario no existe', async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        useCase.execute({ email: 'noexiste@test.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('debería lanzar UnauthorizedError si la contraseña es incorrecta', async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue(makeUser());
      passwordHasher.compare.mockResolvedValue(false);

      await expect(
        useCase.execute({ email: 'mario@test.com', password: 'wrong-pass' }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('debería incluir mustChangePassword=true en el resultado', async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue(makeUser(true));
      passwordHasher.compare.mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await useCase.execute({
        email: 'mario@test.com',
        password: 'password123',
      });

      expect(result.user.mustChangePassword).toBe(true);
    });
  });
});
