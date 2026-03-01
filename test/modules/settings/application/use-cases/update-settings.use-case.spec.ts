import { UpdateSettingsUseCase } from '@modules/settings/application/use-cases/update-settings.use-case';
import { SettingsRepositoryPort } from '@modules/settings/domain/ports/settings.repository.port';
import { RestaurantRepositoryPort } from '@modules/restaurants/domain/ports/restaurant.repository.port';
import { Settings } from '@modules/settings/domain/entities/settings.entity';
import { Restaurant } from '@modules/restaurants/domain/entities/restaurant.entity';
import { User } from '@modules/users/domain/entities/user.entity';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';
import { RestaurantCategory } from '@modules/restaurants/domain/enums/restaurant-category.enum';
import { AcceptanceMode } from '@modules/settings/domain/enums/acceptance-mode.enum';
import { OpeningHours } from '@modules/settings/domain/types/opening-hours.type';
import {
  BadRequestError,
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

const emptyHours: OpeningHours = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

const makeSettings = (): Settings =>
  new Settings(
    'settings-id',
    'restaurant-id',
    emptyHours,
    30,
    0,
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

describe('UpdateSettingsUseCase', () => {
  let useCase: UpdateSettingsUseCase;
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

    useCase = new UpdateSettingsUseCase(
      settingsRepository,
      restaurantRepository,
    );
  });

  describe('execute', () => {
    it('debería actualizar settings existentes correctamente', async () => {
      const user = makeUser(UserRole.RESTAURANT_ADMIN, 'admin-id');
      const existing = makeSettings();
      const saved = {
        ...existing,
        depositAmount: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Settings;

      restaurantRepository.findById.mockResolvedValue(
        makeRestaurant('admin-id'),
      );
      settingsRepository.findByRestaurantId.mockResolvedValue(existing);
      settingsRepository.save.mockResolvedValue(saved);

      const result = await useCase.execute({
        restaurantId: 'restaurant-id',
        currentUser: user,
        depositAmount: 25,
      });

      expect(result.depositAmount).toBe(25);
      expect(settingsRepository.save).toHaveBeenCalledTimes(1);
    });

    it('debería crear settings nuevos si no existen y se pasan todos los campos', async () => {
      const user = makeUser(UserRole.SUPERADMIN, 'superadmin-id');
      const saved = makeSettings();
      saved.depositAmount = 15;

      restaurantRepository.findById.mockResolvedValue(makeRestaurant());
      settingsRepository.findByRestaurantId.mockResolvedValue(null);
      settingsRepository.save.mockResolvedValue({
        ...saved,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Settings);

      const result = await useCase.execute({
        restaurantId: 'restaurant-id',
        currentUser: user,
        openingHours: emptyHours,
        timeSlotInterval: 30,
        depositAmount: 15,
        acceptanceMode: AcceptanceMode.MANUAL,
      });

      expect(result).toBeDefined();
      expect(settingsRepository.save).toHaveBeenCalledTimes(1);
    });

    it('debería lanzar BadRequestError si se intentan crear settings sin todos los campos', async () => {
      const user = makeUser(UserRole.SUPERADMIN);
      restaurantRepository.findById.mockResolvedValue(makeRestaurant());
      settingsRepository.findByRestaurantId.mockResolvedValue(null);

      await expect(
        useCase.execute({
          restaurantId: 'restaurant-id',
          currentUser: user,
          depositAmount: 10,
          // faltan openingHours, timeSlotInterval, acceptanceMode
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it('debería lanzar ForbiddenError si RESTAURANT_ADMIN no es el dueño', async () => {
      const user = makeUser(UserRole.RESTAURANT_ADMIN, 'otro-admin-id');
      restaurantRepository.findById.mockResolvedValue(
        makeRestaurant('admin-id'),
      );

      await expect(
        useCase.execute({
          restaurantId: 'restaurant-id',
          currentUser: user,
          depositAmount: 10,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('debería lanzar NotFoundError si el restaurante no existe', async () => {
      const user = makeUser(UserRole.SUPERADMIN);
      restaurantRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          restaurantId: 'no-existe',
          currentUser: user,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('debería permitir al SUPERADMIN actualizar settings de cualquier restaurante', async () => {
      const user = makeUser(UserRole.SUPERADMIN, 'superadmin-id');
      const existing = makeSettings();
      const saved = {
        ...existing,
        acceptanceMode: AcceptanceMode.MANUAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Settings;

      restaurantRepository.findById.mockResolvedValue(
        makeRestaurant('otro-admin-id'),
      );
      settingsRepository.findByRestaurantId.mockResolvedValue(existing);
      settingsRepository.save.mockResolvedValue(saved);

      const result = await useCase.execute({
        restaurantId: 'restaurant-id',
        currentUser: user,
        acceptanceMode: AcceptanceMode.MANUAL,
      });

      expect(result.acceptanceMode).toBe(AcceptanceMode.MANUAL);
    });
  });
});
