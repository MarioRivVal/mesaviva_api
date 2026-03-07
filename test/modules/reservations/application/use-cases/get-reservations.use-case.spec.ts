import { GetReservationsUseCase } from '@modules/reservations/application/use-cases/get-reservations.use-case';
import { ReservationRepositoryPort } from '@modules/reservations/domain/ports/reservation.repository.port';
import { RestaurantRepositoryPort } from '@modules/restaurants/domain/ports/restaurant.repository.port';
import { Reservation } from '@modules/reservations/domain/entities/reservation.entity';
import { Restaurant } from '@modules/restaurants/domain/entities/restaurant.entity';
import { User } from '@modules/users/domain/entities/user.entity';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';
import { ReservationStatus } from '@modules/reservations/domain/enums/reservation-status.enum';
import { PaymentStatus } from '@modules/reservations/domain/enums/payment-status.enum';
import { RestaurantCategory } from '@modules/restaurants/domain/enums/restaurant-category.enum';
import {
  ForbiddenError,
  NotFoundError,
} from '@shared/domain/errors/domain.errors';
import { GetReservationsInput } from '@modules/reservations/application/dtos/reservation.dto';

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

const makeReservation = (): Reservation =>
  new Reservation(
    'reservation-id',
    'restaurant-id',
    '2026-03-10',
    '13:00',
    2,
    'Mario',
    'Rivera',
    'mario@test.com',
    '+34600000001',
    null,
    ReservationStatus.CONFIRMED,
    0,
    PaymentStatus.PENDING,
    null,
    null,
    null,
    null,
    'cancel-token',
    new Date(),
    new Date(),
  );

const makeInput = (
  overrides: Partial<GetReservationsInput> = {},
): GetReservationsInput => ({
  restaurantId: 'restaurant-id',
  currentUser: makeUser(),
  filters: {},
  ...overrides,
});

describe('GetReservationsUseCase', () => {
  let useCase: GetReservationsUseCase;
  let reservationRepository: jest.Mocked<ReservationRepositoryPort>;
  let restaurantRepository: jest.Mocked<RestaurantRepositoryPort>;

  beforeEach(() => {
    reservationRepository = {
      findById: jest.fn(),
      findByToken: jest.fn(),
      findByRestaurantAndFilters: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ReservationRepositoryPort>;

    restaurantRepository = {
      findById: jest.fn(),
      findAllByOwnerId: jest.fn(),
      findBySlug: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<RestaurantRepositoryPort>;

    useCase = new GetReservationsUseCase(
      reservationRepository,
      restaurantRepository,
    );
  });

  describe('execute', () => {
    it('debería retornar las reservas del restaurante para el admin propietario', async () => {
      const reservations = [makeReservation()];
      restaurantRepository.findById.mockResolvedValue(
        makeRestaurant('admin-id'),
      );
      reservationRepository.findByRestaurantAndFilters.mockResolvedValue(
        reservations,
      );

      const result = await useCase.execute(makeInput());

      expect(result).toEqual(reservations);
      expect(
        reservationRepository.findByRestaurantAndFilters,
      ).toHaveBeenCalledWith('restaurant-id', {});
    });

    it('debería lanzar NotFoundError si el restaurante no existe', async () => {
      restaurantRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(makeInput())).rejects.toThrow(NotFoundError);
      expect(
        reservationRepository.findByRestaurantAndFilters,
      ).not.toHaveBeenCalled();
    });

    it('debería lanzar ForbiddenError si el admin intenta ver reservas de otro restaurante', async () => {
      restaurantRepository.findById.mockResolvedValue(
        makeRestaurant('otro-admin-id'),
      );

      await expect(useCase.execute(makeInput())).rejects.toThrow(
        ForbiddenError,
      );
      expect(
        reservationRepository.findByRestaurantAndFilters,
      ).not.toHaveBeenCalled();
    });

    it('debería permitir al SUPERADMIN ver reservas de cualquier restaurante', async () => {
      const reservations = [makeReservation()];
      restaurantRepository.findById.mockResolvedValue(
        makeRestaurant('cualquier-admin-id'),
      );
      reservationRepository.findByRestaurantAndFilters.mockResolvedValue(
        reservations,
      );
      const superadmin = makeUser(UserRole.SUPERADMIN, 'superadmin-id');

      const result = await useCase.execute(
        makeInput({ currentUser: superadmin }),
      );

      expect(result).toEqual(reservations);
      expect(
        reservationRepository.findByRestaurantAndFilters,
      ).toHaveBeenCalled();
    });

    it('debería retornar lista vacía si no hay reservas', async () => {
      restaurantRepository.findById.mockResolvedValue(
        makeRestaurant('admin-id'),
      );
      reservationRepository.findByRestaurantAndFilters.mockResolvedValue([]);

      const result = await useCase.execute(makeInput());

      expect(result).toEqual([]);
    });

    it('debería pasar los filtros correctamente al repositorio', async () => {
      const filters = { status: ReservationStatus.PENDING, date: '2026-03-10' };
      restaurantRepository.findById.mockResolvedValue(
        makeRestaurant('admin-id'),
      );
      reservationRepository.findByRestaurantAndFilters.mockResolvedValue([]);

      await useCase.execute(makeInput({ filters }));

      expect(
        reservationRepository.findByRestaurantAndFilters,
      ).toHaveBeenCalledWith('restaurant-id', filters);
    });
  });
});
