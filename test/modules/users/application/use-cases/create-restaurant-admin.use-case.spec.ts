import { CreateRestaurantAdminUseCase } from '@modules/users/application/use-cases/create-restaurant-admin.use-case';
import { UserRepositoryPort } from '@modules/users/domain/ports/user.repository.port';
import { RestaurantRepositoryPort } from '@modules/restaurants/domain/ports/restaurant.repository.port';
import { PasswordHasherPort } from '@shared/domain/ports/password-hasher.port';
import { EmailServicePort } from '@modules/notifications/domain/ports/email.service.port';
import { User } from '@modules/users/domain/entities/user.entity';
import { Restaurant } from '@modules/restaurants/domain/entities/restaurant.entity';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';
import { RestaurantCategory } from '@modules/restaurants/domain/enums/restaurant-category.enum';
import { ConflictError } from '@shared/domain/errors/domain.errors';
import { CreateRestaurantAdminInput } from '@modules/users/application/dtos/create-restaurant-admin.dto';

const makeInput = (
  overrides: Partial<CreateRestaurantAdminInput> = {},
): CreateRestaurantAdminInput => ({
  email: 'admin@restaurante.com',
  firstName: 'Ana',
  lastName: 'García',
  phone: '+34600000001',
  restaurantName: 'La Tasca',
  restaurantPhone: '+34600000002',
  restaurantAddress: 'Calle Mayor 1, Madrid',
  restaurantCategory: RestaurantCategory.RESTAURANT,
  restaurantEmail: 'info@latasca.com',
  restaurantImageUrl: 'https://example.com/image.jpg',
  ...overrides,
});

const makeSavedUser = (): User =>
  new User(
    'user-uuid',
    'Ana',
    'García',
    '+34600000001',
    'admin@restaurante.com',
    'hashed-pass',
    UserRole.RESTAURANT_ADMIN,
    true,
    true,
  );

const makeSavedRestaurant = (): Restaurant =>
  new Restaurant(
    'restaurant-uuid',
    'La Tasca',
    'user-uuid',
    '+34600000002',
    'Calle Mayor 1, Madrid',
    RestaurantCategory.RESTAURANT,
    'info@latasca.com',
    'https://example.com/image.jpg',
    'la-tasca',
    true,
  );

describe('CreateRestaurantAdminUseCase', () => {
  let useCase: CreateRestaurantAdminUseCase;
  let userRepository: jest.Mocked<UserRepositoryPort>;
  let restaurantRepository: jest.Mocked<RestaurantRepositoryPort>;
  let passwordHasher: jest.Mocked<PasswordHasherPort>;
  let emailService: jest.Mocked<EmailServicePort>;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findById: jest.fn(),
      findAllRestaurantAdmins: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<UserRepositoryPort>;

    restaurantRepository = {
      findById: jest.fn(),
      findAllByOwnerId: jest.fn(),
      findBySlug: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<RestaurantRepositoryPort>;

    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    } as jest.Mocked<PasswordHasherPort>;

    emailService = {
      sendWelcomeToNewAdmin: jest.fn(),
      sendReservationAccepted: jest.fn(),
      sendReservationRejected: jest.fn(),
      sendNewReservationToAdmin: jest.fn(),
    } as jest.Mocked<EmailServicePort>;

    useCase = new CreateRestaurantAdminUseCase(
      userRepository,
      restaurantRepository,
      passwordHasher,
      emailService,
    );
  });

  describe('execute', () => {
    it('debería crear usuario y restaurante correctamente', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      restaurantRepository.findBySlug.mockResolvedValue(null);
      passwordHasher.hash.mockResolvedValue('hashed-pass');
      userRepository.save.mockResolvedValue(makeSavedUser());
      restaurantRepository.save.mockResolvedValue(makeSavedRestaurant());
      emailService.sendWelcomeToNewAdmin.mockResolvedValue(undefined);

      const result = await useCase.execute(makeInput());

      expect(result.user.email).toBe('admin@restaurante.com');
      expect(result.user.role).toBe(UserRole.RESTAURANT_ADMIN);
      expect(result.user.mustChangePassword).toBe(true);
      expect(result.restaurant.name).toBe('La Tasca');
      expect(result.restaurant.slug).toBe('la-tasca');
      expect(typeof result.tempPassword).toBe('string');
      expect(result.tempPassword.length).toBeGreaterThan(0);
    });

    it('debería lanzar ConflictError si el email ya existe', async () => {
      userRepository.findByEmail.mockResolvedValue(makeSavedUser());

      await expect(useCase.execute(makeInput())).rejects.toThrow(ConflictError);
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(restaurantRepository.save).not.toHaveBeenCalled();
    });

    it('debería generar slug único si ya existe uno igual', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      restaurantRepository.findBySlug.mockResolvedValue(makeSavedRestaurant());
      passwordHasher.hash.mockResolvedValue('hashed-pass');
      userRepository.save.mockResolvedValue(makeSavedUser());
      restaurantRepository.save.mockResolvedValue(makeSavedRestaurant());
      emailService.sendWelcomeToNewAdmin.mockResolvedValue(undefined);

      await useCase.execute(makeInput());

      const savedRestaurant: Restaurant =
        restaurantRepository.save.mock.calls[0][0];
      expect(savedRestaurant.slug).not.toBe('la-tasca');
      expect(savedRestaurant.slug).toContain('la-tasca-');
    });

    it('debería hacer rollback del usuario si falla al guardar el restaurante', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      restaurantRepository.findBySlug.mockResolvedValue(null);
      passwordHasher.hash.mockResolvedValue('hashed-pass');
      userRepository.save.mockResolvedValue(makeSavedUser());
      restaurantRepository.save.mockRejectedValue(new Error('DB error'));
      userRepository.delete.mockResolvedValue(undefined);

      await expect(useCase.execute(makeInput())).rejects.toThrow('DB error');
      expect(userRepository.delete).toHaveBeenCalledWith('user-uuid');
    });

    it('debería enviar email de bienvenida con los datos correctos', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      restaurantRepository.findBySlug.mockResolvedValue(null);
      passwordHasher.hash.mockResolvedValue('hashed-pass');
      userRepository.save.mockResolvedValue(makeSavedUser());
      restaurantRepository.save.mockResolvedValue(makeSavedRestaurant());
      emailService.sendWelcomeToNewAdmin.mockResolvedValue(undefined);

      await useCase.execute(makeInput());

      expect(emailService.sendWelcomeToNewAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@restaurante.com',
          firstName: 'Ana',
          lastName: 'García',
          restaurantName: 'La Tasca',
        }),
      );
    });
  });
});
