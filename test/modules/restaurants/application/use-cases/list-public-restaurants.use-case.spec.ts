import { ListPublicRestaurantsUseCase } from '@modules/restaurants/application/use-cases/list-public-restaurants.use-case';
import { RestaurantRepositoryPort } from '@modules/restaurants/domain/ports/restaurant.repository.port';
import { Restaurant } from '@modules/restaurants/domain/entities/restaurant.entity';
import { RestaurantCategory } from '@modules/restaurants/domain/enums/restaurant-category.enum';

const makeRestaurant = (id: string, isActive = true): Restaurant =>
  new Restaurant(
    id,
    `Restaurante ${id}`,
    'admin-id',
    '+34600000001',
    'Calle Test 1',
    RestaurantCategory.RESTAURANT,
    `info-${id}@test.com`,
    'https://example.com/img.jpg',
    `restaurante-${id}`,
    isActive,
  );

describe('ListPublicRestaurantsUseCase', () => {
  let useCase: ListPublicRestaurantsUseCase;
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

    useCase = new ListPublicRestaurantsUseCase(restaurantRepository);
  });

  describe('execute', () => {
    it('debería retornar solo los restaurantes activos', async () => {
      restaurantRepository.findAll.mockResolvedValue([
        makeRestaurant('1', true),
        makeRestaurant('2', false),
        makeRestaurant('3', true),
      ]);

      const result = await useCase.execute();

      expect(result.restaurants).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.restaurants.every((r) => r.id !== '2')).toBe(true);
    });

    it('debería retornar lista vacía si no hay restaurantes activos', async () => {
      restaurantRepository.findAll.mockResolvedValue([
        makeRestaurant('1', false),
        makeRestaurant('2', false),
      ]);

      const result = await useCase.execute();

      expect(result.restaurants).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('debería retornar lista vacía si no hay restaurantes', async () => {
      restaurantRepository.findAll.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result.restaurants).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('debería incluir los campos públicos correctos de cada restaurante', async () => {
      restaurantRepository.findAll.mockResolvedValue([
        makeRestaurant('1', true),
      ]);

      const result = await useCase.execute();

      expect(result.restaurants[0]).toMatchObject({
        id: '1',
        name: 'Restaurante 1',
        slug: 'restaurante-1',
        category: RestaurantCategory.RESTAURANT,
        address: 'Calle Test 1',
        imageUrl: 'https://example.com/img.jpg',
      });
      // El email NO debe estar en la lista pública
      expect(result.restaurants[0]).not.toHaveProperty('email');
    });

    it('debería retornar el total correcto', async () => {
      restaurantRepository.findAll.mockResolvedValue([
        makeRestaurant('1', true),
        makeRestaurant('2', true),
        makeRestaurant('3', true),
      ]);

      const result = await useCase.execute();

      expect(result.total).toBe(3);
      expect(result.restaurants).toHaveLength(result.total);
    });
  });
});
