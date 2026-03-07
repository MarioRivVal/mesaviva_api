import { ChangePasswordUseCase } from '@modules/auth/application/use-cases/change-password.use-case';
import { UserRepositoryPort } from '@modules/users/domain/ports/user.repository.port';
import { PasswordHasherPort } from '@shared/domain/ports/password-hasher.port';
import { User } from '@modules/users/domain/entities/user.entity';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';
import { BadRequestError, UnauthorizedError, } from '@shared/domain/errors/domain.errors';
import { ChangePasswordInput } from '@modules/auth/application/dtos/auth.dto';

const makeUser = (mustChangePassword = true): User =>
  new User(
    'user-id-1',
    'Mario',
    'Rivera',
    '+34600000000',
    'mario@test.com',
    'hashed-old-password',
    UserRole.RESTAURANT_ADMIN,
    mustChangePassword,
    true,
    new Date(),
    new Date(),
  );

const makeCurrentUser = (): User =>
  new User(
    'user-id-1',
    'Mario',
    'Rivera',
    '+34600000000',
    'mario@test.com',
    '',
    UserRole.RESTAURANT_ADMIN,
    true,
    true,
  );

const makeInput = (
  overrides: Partial<ChangePasswordInput> = {},
): ChangePasswordInput => ({
  currentUser: makeCurrentUser(),
  currentPassword: 'OldPass1!',
  newPassword: 'NewPass1!',
  ...overrides,
});

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let userRepository: jest.Mocked<UserRepositoryPort>;
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

    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    } as jest.Mocked<PasswordHasherPort>;

    useCase = new ChangePasswordUseCase(userRepository, passwordHasher);
  });

  describe('execute', () => {
    it('debería cambiar la contraseña correctamente y marcar mustChangePassword=false', async () => {
      const user = makeUser(true);
      userRepository.findByEmailWithPassword.mockResolvedValue(user);
      passwordHasher.compare
        .mockResolvedValueOnce(true) // currentPassword válida
        .mockResolvedValueOnce(false); // newPassword != currentPassword
      passwordHasher.hash.mockResolvedValue('hashed-new-password');
      userRepository.save.mockResolvedValue(user);

      await useCase.execute(makeInput());

      expect(userRepository.findByEmailWithPassword).toHaveBeenCalledWith(
        'mario@test.com',
      );
      expect(passwordHasher.hash).toHaveBeenCalledWith('NewPass1!');
      expect(user.passwordHash).toBe('hashed-new-password');
      expect(user.mustChangePassword).toBe(false);
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    it('debería lanzar UnauthorizedError si el usuario no existe', async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue(null);

      await expect(useCase.execute(makeInput())).rejects.toThrow(
        UnauthorizedError,
      );
      expect(passwordHasher.hash).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('debería lanzar BadRequestError si la contraseña actual es incorrecta', async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue(makeUser());
      passwordHasher.compare.mockResolvedValueOnce(false); // currentPassword inválida

      await expect(useCase.execute(makeInput())).rejects.toThrow(
        BadRequestError,
      );
      expect(passwordHasher.hash).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('debería lanzar BadRequestError si la nueva contraseña es igual a la actual', async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue(makeUser());
      passwordHasher.compare
        .mockResolvedValueOnce(true) // currentPassword válida
        .mockResolvedValueOnce(true); // newPassword == currentPassword

      await expect(useCase.execute(makeInput())).rejects.toThrow(
        BadRequestError,
      );
      expect(passwordHasher.hash).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('debería lanzar BadRequestError si la nueva contraseña no cumple los requisitos de fortaleza', async () => {
      await expect(
        useCase.execute(makeInput({ newPassword: 'weak' })),
      ).rejects.toThrow(BadRequestError);
      expect(userRepository.findByEmailWithPassword).not.toHaveBeenCalled();
    });

    it('debería lanzar BadRequestError si la nueva contraseña no tiene mayúscula', async () => {
      await expect(
        useCase.execute(makeInput({ newPassword: 'nouppercas1!' })),
      ).rejects.toThrow(BadRequestError);
    });

    it('debería lanzar BadRequestError si la nueva contraseña no tiene símbolo', async () => {
      await expect(
        useCase.execute(makeInput({ newPassword: 'NoSymbol123' })),
      ).rejects.toThrow(BadRequestError);
    });
  });
});
