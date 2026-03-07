import { GetRestaurantsUseCase } from '@modules/restaurants/application/use-cases/get-restaurants.use-case';
import { RestaurantRepositoryPort } from '@modules/restaurants/domain/ports/restaurant.repository.port';
import { Restaurant } from '@modules/restaurants/domain/entities/restaurant.entity';
import { User } from '@modules/users/domain/entities/user.entity';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';
import { RestaurantCategory } from '@modules/restaurants/domain/enums/restaurant-category.enum';
import { ForbiddenError } from '@shared/domain/errors/domain.errors';
import { GetRestaurantsInput } from '@modules/restaurants/application/dtos/restaurant.dto';

// ─── Factories ────────────────────────────────────────────────────────────────

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

const makeUser = (
  role: UserRole = UserRole.RESTAURANT_ADMIN,
  id = 'admin-id',
): User =>
  new User(
    id,
    'Mario',
    'Rivera',
    '+34600000000',
    'mario@test.com',
    '',
    role,
    false,
    true,
  );

const makeInput = (
  overrides: Partial<GetRestaurantsInput> = {},
): GetRestaurantsInput => ({
  currentUser: makeUser(),
  adminId: 'admin-id',
  ...overrides,
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GetRestaurantsUseCase', () => {
  let useCase: GetRestaurantsUseCase;
  let restaurantRepository: jest.Mocked<RestaurantRepositoryPort>;

  beforeEach(() => {
    restaurantRepository = {
      findById: jest.fn(),
      findAllByOwnerId: jest.fn(),
      findBySlug: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<RestaurantRepositoryPort>;

    useCase = new GetRestaurantsUseCase(restaurantRepository);
  });

  describe('execute', () => {
    it('debería retornar los restaurantes del admin propietario', async () => {
      const restaurants = [
        makeRestaurant(),
        makeRestaurant({
          id: 'restaurant-id-2',
          name: 'El Rincón',
          slug: 'el-rincon',
        } as Partial<Restaurant>),
      ];
      restaurantRepository.findAllByOwnerId.mockResolvedValue(restaurants);

      const result = await useCase.execute(makeInput());

      expect(result.total).toBe(2);
      expect(result.restaurants).toHaveLength(2);
      expect(restaurantRepository.findAllByOwnerId).toHaveBeenCalledWith(
        'admin-id',
      );
    });

    it('debería retornar lista vacía si el admin no tiene restaurantes', async () => {
      restaurantRepository.findAllByOwnerId.mockResolvedValue([]);

      const result = await useCase.execute(makeInput());

      expect(result.restaurants).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('debería lanzar ForbiddenError si el RESTAURANT_ADMIN intenta ver restaurantes de otro admin', async () => {
      await expect(
        useCase.execute(makeInput({ adminId: 'otro-admin-id' })),
      ).rejects.toThrow(ForbiddenError);

      expect(restaurantRepository.findAllByOwnerId).not.toHaveBeenCalled();
    });

    it('debería permitir al SUPERADMIN ver restaurantes de cualquier admin', async () => {
      const superadmin = makeUser(UserRole.SUPERADMIN, 'superadmin-id');
      const restaurants = [makeRestaurant()];
      restaurantRepository.findAllByOwnerId.mockResolvedValue(restaurants);

      const result = await useCase.execute(
        makeInput({ currentUser: superadmin, adminId: 'cualquier-admin-id' }),
      );

      expect(result.total).toBe(1);
      expect(restaurantRepository.findAllByOwnerId).toHaveBeenCalledWith(
        'cualquier-admin-id',
      );
    });

    it('debería mapear correctamente los campos del restaurante en el resultado', async () => {
      const restaurant = makeRestaurant();
      restaurantRepository.findAllByOwnerId.mockResolvedValue([restaurant]);

      const result = await useCase.execute(makeInput());

      const item = result.restaurants[0];
      expect(item).toMatchObject({
        id: 'restaurant-id',
        name: 'La Tasca',
        slug: 'la-tasca',
        adminId: 'admin-id',
        phone: '+34600000001',
        address: 'Calle Mayor 1',
        category: RestaurantCategory.RESTAURANT,
        email: 'info@latasca.com',
        isActive: true,
      });
    });

    it('debería incluir el total igual al número de restaurantes devueltos', async () => {
      const restaurants = [
        makeRestaurant(),
        makeRestaurant(),
        makeRestaurant(),
      ];
      restaurantRepository.findAllByOwnerId.mockResolvedValue(restaurants);

      const result = await useCase.execute(makeInput());

      expect(result.total).toBe(restaurants.length);
      expect(result.restaurants.length).toBe(result.total);
    });
  });
});
