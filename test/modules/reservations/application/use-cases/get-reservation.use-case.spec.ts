import { GetReservationUseCase } from '@modules/reservations/application/use-cases/get-reservation.use-case';
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
import { GetReservationInput } from '@modules/reservations/application/dtos/reservation.dto';

// ─── Factories ────────────────────────────────────────────────────────────────

const makeReservation = (overrides: Partial<Reservation> = {}): Reservation =>
  Object.assign(
    new Reservation(
      'reservation-id',
      'restaurant-id',
      '2026-07-15',
      '13:00',
      2,
      'Juan',
      'García',
      'juan@test.com',
      '+34612345678',
      null,
      ReservationStatus.PENDING,
      0,
      PaymentStatus.PENDING,
      null,
      null,
      null,
      null,
      'cancel-token-abc',
      new Date(),
      new Date(),
    ),
    overrides,
  );

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

const makeInput = (
  overrides: Partial<GetReservationInput> = {},
): GetReservationInput => ({
  reservationId: 'reservation-id',
  currentUser: makeUser(),
  ...overrides,
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GetReservationUseCase', () => {
  let useCase: GetReservationUseCase;
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

    useCase = new GetReservationUseCase(
      reservationRepository,
      restaurantRepository,
    );
  });

  describe('execute', () => {
    it('debería retornar la reserva si el RESTAURANT_ADMIN es propietario del restaurante', async () => {
      const reservation = makeReservation();
      reservationRepository.findById.mockResolvedValue(reservation);
      restaurantRepository.findById.mockResolvedValue(
        makeRestaurant('admin-id'),
      );

      const result = await useCase.execute(makeInput());

      expect(result).toEqual(reservation);
      expect(reservationRepository.findById).toHaveBeenCalledWith(
        'reservation-id',
      );
      expect(restaurantRepository.findById).toHaveBeenCalledWith(
        'restaurant-id',
      );
    });

    it('debería lanzar NotFoundError si la reserva no existe', async () => {
      reservationRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(makeInput())).rejects.toThrow(NotFoundError);
      expect(restaurantRepository.findById).not.toHaveBeenCalled();
    });

    it('debería lanzar NotFoundError si el restaurante de la reserva no existe', async () => {
      reservationRepository.findById.mockResolvedValue(makeReservation());
      restaurantRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(makeInput())).rejects.toThrow(NotFoundError);
    });

    it('debería lanzar ForbiddenError si el RESTAURANT_ADMIN intenta ver una reserva de otro restaurante', async () => {
      reservationRepository.findById.mockResolvedValue(makeReservation());
      restaurantRepository.findById.mockResolvedValue(
        makeRestaurant('otro-admin-id'),
      );

      await expect(useCase.execute(makeInput())).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('debería permitir al SUPERADMIN ver cualquier reserva sin restricción de propiedad', async () => {
      const reservation = makeReservation();
      reservationRepository.findById.mockResolvedValue(reservation);
      restaurantRepository.findById.mockResolvedValue(
        makeRestaurant('cualquier-admin-id'),
      );
      const superadmin = makeUser(UserRole.SUPERADMIN, 'superadmin-id');

      const result = await useCase.execute(
        makeInput({ currentUser: superadmin }),
      );

      expect(result).toEqual(reservation);
    });

    it('debería retornar la reserva con todos sus campos correctamente', async () => {
      const reservation = makeReservation({
        status: ReservationStatus.CONFIRMED,
        notes: 'Mesa con vistas',
      });
      reservationRepository.findById.mockResolvedValue(reservation);
      restaurantRepository.findById.mockResolvedValue(
        makeRestaurant('admin-id'),
      );

      const result = await useCase.execute(makeInput());

      expect(result.status).toBe(ReservationStatus.CONFIRMED);
      expect(result.notes).toBe('Mesa con vistas');
      expect(result.customerEmail).toBe('juan@test.com');
    });
  });
});
