import { GetPublicRestaurantUseCase } from '@modules/restaurants/application/use-cases/get-public-restaurant.use-case';
import { RestaurantRepositoryPort } from '@modules/restaurants/domain/ports/restaurant.repository.port';
import { SettingsRepositoryPort } from '@modules/settings/domain/ports/settings.repository.port';
import { Restaurant } from '@modules/restaurants/domain/entities/restaurant.entity';
import { Settings } from '@modules/settings/domain/entities/settings.entity';
import { RestaurantCategory } from '@modules/restaurants/domain/enums/restaurant-category.enum';
import { AcceptanceMode } from '@modules/settings/domain/enums/acceptance-mode.enum';
import { NotFoundError } from '@shared/domain/errors/domain.errors';

const makeRestaurant = (overrides: Partial<Restaurant> = {}): Restaurant =>
  Object.assign(
    new Restaurant(
      'restaurant-id',
      'La Tasca',
      'admin-id',
      '+34600000001',
      'Calle Mayor 1',
      RestaurantCategory.RESTAURANT,
      'info@latasca.com',
      'https://example.com/img.jpg',
      'la-tasca',
      true,
    ),
    overrides,
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
  );

describe('GetPublicRestaurantUseCase', () => {
  let useCase: GetPublicRestaurantUseCase;
  let restaurantRepository: jest.Mocked<RestaurantRepositoryPort>;
  let settingsRepository: jest.Mocked<SettingsRepositoryPort>;

  beforeEach(() => {
    restaurantRepository = {
      findById: jest.fn(),
      findAllByOwnerId: jest.fn(),
      findBySlug: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<RestaurantRepositoryPort>;

    settingsRepository = {
      findByRestaurantId: jest.fn(),
      save: jest.fn(),
    } as jest.Mocked<SettingsRepositoryPort>;

    useCase = new GetPublicRestaurantUseCase(
      restaurantRepository,
      settingsRepository,
    );
  });

  describe('execute', () => {
    it('debería retornar el detalle público del restaurante con sus settings', async () => {
      restaurantRepository.findBySlug.mockResolvedValue(makeRestaurant());
      settingsRepository.findByRestaurantId.mockResolvedValue(makeSettings());

      const result = await useCase.execute('la-tasca');

      expect(result.slug).toBe('la-tasca');
      expect(result.name).toBe('La Tasca');
      expect(result.settings).not.toBeNull();
      expect(result.settings?.timeSlotInterval).toBe(30);
      expect(result.settings?.acceptanceMode).toBe(AcceptanceMode.AUTO);
    });

    it('debería retornar settings null si el restaurante no tiene settings configurados', async () => {
      restaurantRepository.findBySlug.mockResolvedValue(makeRestaurant());
      settingsRepository.findByRestaurantId.mockResolvedValue(null);

      const result = await useCase.execute('la-tasca');

      expect(result.settings).toBeNull();
    });

    it('debería lanzar NotFoundError si el restaurante no existe', async () => {
      restaurantRepository.findBySlug.mockResolvedValue(null);

      await expect(useCase.execute('no-existe')).rejects.toThrow(NotFoundError);
    });

    it('debería lanzar NotFoundError si el restaurante está inactivo', async () => {
      restaurantRepository.findBySlug.mockResolvedValue(
        makeRestaurant({ isActive: false }),
      );

      await expect(useCase.execute('la-tasca')).rejects.toThrow(NotFoundError);
    });

    it('debería incluir todos los campos públicos del restaurante', async () => {
      restaurantRepository.findBySlug.mockResolvedValue(makeRestaurant());
      settingsRepository.findByRestaurantId.mockResolvedValue(null);

      const result = await useCase.execute('la-tasca');

      expect(result).toMatchObject({
        id: 'restaurant-id',
        name: 'La Tasca',
        slug: 'la-tasca',
        category: RestaurantCategory.RESTAURANT,
        address: 'Calle Mayor 1',
        email: 'info@latasca.com',
        phone: '+34600000001',
        imageUrl: 'https://example.com/img.jpg',
      });
    });
  });
});
