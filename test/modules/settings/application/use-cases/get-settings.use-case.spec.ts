import { GetSettingsUseCase } from '@modules/settings/application/use-cases/get-settings.use-case';
import { SettingsRepositoryPort } from '@modules/settings/domain/ports/settings.repository.port';
import { RestaurantRepositoryPort } from '@modules/restaurants/domain/ports/restaurant.repository.port';
import { Settings } from '@modules/settings/domain/entities/settings.entity';
import { Restaurant } from '@modules/restaurants/domain/entities/restaurant.entity';
import { User } from '@modules/users/domain/entities/user.entity';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';
import { RestaurantCategory } from '@modules/restaurants/domain/enums/restaurant-category.enum';
import { AcceptanceMode } from '@modules/settings/domain/enums/acceptance-mode.enum';
import {
  ForbiddenError,
  NotFoundError,
} from '@shared/domain/errors/domain.errors';

const makeRestaurant = (adminId = 'admin-id'): Restaurant =>
  new Restaurant(
    'restaurant-id',
    'La Tasca',
    adminId,
    '+34600000001',
    'Calle Mayor 1',
    RestaurantCategory.RESTAURANT,
    'info@latasca.com',
    'https://example.com/img.jpg',
    'la-tasca',
    true,
  );

const makeSettings = (): Settings =>
  new Settings(
    'settings-id',
    'restaurant-id',
    {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [{ open: '13:00', close: '16:00', capacity: 20 }],
      saturday: [],
      sunday: [],
    },
    30,
    10,
    AcceptanceMode.AUTO,
    new Date('2024-01-01'),
    new Date('2024-01-01'),
  );

const makeUser = (role: UserRole, id = 'admin-id'): User =>
  new User(
    id,
    'Ana',
    'García',
    '+34600000001',
    'ana@test.com',
    '',
    role,
    false,
    true,
  );

describe('GetSettingsUseCase', () => {
  let useCase: GetSettingsUseCase;
  let settingsRepository: jest.Mocked<SettingsRepositoryPort>;
  let restaurantRepository: jest.Mocked<RestaurantRepositoryPort>;

  beforeEach(() => {
    settingsRepository = {
      findByRestaurantId: jest.fn(),
      save: jest.fn(),
    } as jest.Mocked<SettingsRepositoryPort>;

    restaurantRepository = {
      findById: jest.fn(),
      findAllByOwnerId: jest.fn(),
      findBySlug: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<RestaurantRepositoryPort>;

    useCase = new GetSettingsUseCase(settingsRepository, restaurantRepository);
  });

  describe('execute', () => {
    it('debería retornar los settings si el SUPERADMIN los solicita', async () => {
      const user = makeUser(UserRole.SUPERADMIN, 'superadmin-id');
      restaurantRepository.findById.mockResolvedValue(makeRestaurant());
      settingsRepository.findByRestaurantId.mockResolvedValue(makeSettings());

      const result = await useCase.execute({
        restaurantId: 'restaurant-id',
        currentUser: user,
      });

      expect(result.id).toBe('settings-id');
      expect(result.restaurantId).toBe('restaurant-id');
      expect(result.acceptanceMode).toBe(AcceptanceMode.AUTO);
    });

    it('debería retornar los settings si el RESTAURANT_ADMIN es el dueño', async () => {
      const user = makeUser(UserRole.RESTAURANT_ADMIN, 'admin-id');
      restaurantRepository.findById.mockResolvedValue(
        makeRestaurant('admin-id'),
      );
      settingsRepository.findByRestaurantId.mockResolvedValue(makeSettings());

      const result = await useCase.execute({
        restaurantId: 'restaurant-id',
        currentUser: user,
      });

      expect(result.id).toBe('settings-id');
    });

    it('debería lanzar ForbiddenError si RESTAURANT_ADMIN no es el dueño', async () => {
      const user = makeUser(UserRole.RESTAURANT_ADMIN, 'otro-admin-id');
      restaurantRepository.findById.mockResolvedValue(
        makeRestaurant('admin-id'),
      );

      await expect(
        useCase.execute({ restaurantId: 'restaurant-id', currentUser: user }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('debería lanzar NotFoundError si el restaurante no existe', async () => {
      const user = makeUser(UserRole.SUPERADMIN);
      restaurantRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({ restaurantId: 'no-existe', currentUser: user }),
      ).rejects.toThrow(NotFoundError);
    });

    it('debería lanzar NotFoundError si los settings no existen', async () => {
      const user = makeUser(UserRole.SUPERADMIN);
      restaurantRepository.findById.mockResolvedValue(makeRestaurant());
      settingsRepository.findByRestaurantId.mockResolvedValue(null);

      await expect(
        useCase.execute({ restaurantId: 'restaurant-id', currentUser: user }),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
