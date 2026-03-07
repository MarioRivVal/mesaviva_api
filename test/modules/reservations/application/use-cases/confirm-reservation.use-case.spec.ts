import { ConfirmReservationUseCase } from '@modules/reservations/application/use-cases/confirm-reservation.use-case';
import { ReservationRepositoryPort } from '@modules/reservations/domain/ports/reservation.repository.port';
import { EmailServicePort } from '@modules/notifications/domain/ports/email.service.port';
import { ReservationAccessService } from '@modules/reservations/application/services/reservation-access.service';
import { Reservation } from '@modules/reservations/domain/entities/reservation.entity';
import { Restaurant } from '@modules/restaurants/domain/entities/restaurant.entity';
import { User } from '@modules/users/domain/entities/user.entity';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';
import { ReservationStatus } from '@modules/reservations/domain/enums/reservation-status.enum';
import { PaymentStatus } from '@modules/reservations/domain/enums/payment-status.enum';
import { RestaurantCategory } from '@modules/restaurants/domain/enums/restaurant-category.enum';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '@shared/domain/errors/domain.errors';
import { ConfirmReservationInput } from '@modules/reservations/application/dtos/reservation.dto';

const makeUser = (id = 'admin-id'): User =>
  new User(
    id,
    'Mario',
    'Rivera',
    '+34600000000',
    'mario@test.com',
    '',
    UserRole.RESTAURANT_ADMIN,
    false,
    true,
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

const makeReservation = (
  status: ReservationStatus = ReservationStatus.PENDING,
  notes: string | null = null,
): Reservation =>
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
    notes,
    status,
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
  overrides: Partial<ConfirmReservationInput> = {},
): ConfirmReservationInput => ({
  reservationId: 'reservation-id',
  currentUser: makeUser(),
  ...overrides,
});

describe('ConfirmReservationUseCase', () => {
  let useCase: ConfirmReservationUseCase;
  let reservationRepository: jest.Mocked<ReservationRepositoryPort>;
  let emailService: jest.Mocked<EmailServicePort>;
  let reservationAccess: jest.Mocked<ReservationAccessService>;

  beforeEach(() => {
    reservationRepository = {
      findById: jest.fn(),
      findByToken: jest.fn(),
      findByRestaurantAndFilters: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ReservationRepositoryPort>;

    emailService = {
      sendWelcomeToNewAdmin: jest.fn(),
      sendReservationAccepted: jest.fn(),
      sendReservationPending: jest.fn(),
      sendReservationRejected: jest.fn(),
      sendReservationCancelled: jest.fn(),
      sendNewReservationToAdmin: jest.fn(),
    } as jest.Mocked<EmailServicePort>;

    reservationAccess = {
      resolveAndAuthorize: jest.fn(),
    } as unknown as jest.Mocked<ReservationAccessService>;

    useCase = new ConfirmReservationUseCase(
      reservationRepository,
      emailService,
      reservationAccess,
    );
  });

  describe('execute', () => {
    it('debería confirmar una reserva PENDING y enviar email de aceptación', async () => {
      const reservation = makeReservation(ReservationStatus.PENDING);
      const restaurant = makeRestaurant();
      reservationAccess.resolveAndAuthorize.mockResolvedValue({
        reservation,
        restaurant,
      });
      reservationRepository.save.mockResolvedValue(reservation);
      emailService.sendReservationAccepted.mockResolvedValue(undefined);

      await useCase.execute(makeInput());

      expect(reservation.status).toBe(ReservationStatus.CONFIRMED);
      expect(reservationRepository.save).toHaveBeenCalledWith(reservation);
      expect(emailService.sendReservationAccepted).toHaveBeenCalledTimes(1);
      expect(emailService.sendReservationAccepted).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'mario@test.com',
          customerName: 'Mario',
          customerLastName: 'Rivera',
          restaurantName: 'La Tasca',
          date: '2026-03-10',
          time: '13:00',
          numberOfPeople: 2,
        }),
      );
    });

    it('debería lanzar BadRequestError si la reserva ya está CONFIRMED', async () => {
      const reservation = makeReservation(ReservationStatus.CONFIRMED);
      reservationAccess.resolveAndAuthorize.mockResolvedValue({
        reservation,
        restaurant: makeRestaurant(),
      });

      await expect(useCase.execute(makeInput())).rejects.toThrow(
        BadRequestError,
      );
      expect(reservationRepository.save).not.toHaveBeenCalled();
      expect(emailService.sendReservationAccepted).not.toHaveBeenCalled();
    });

    it('debería lanzar BadRequestError si la reserva ya está CANCELLED', async () => {
      const reservation = makeReservation(ReservationStatus.CANCELLED);
      reservationAccess.resolveAndAuthorize.mockResolvedValue({
        reservation,
        restaurant: makeRestaurant(),
      });

      await expect(useCase.execute(makeInput())).rejects.toThrow(
        BadRequestError,
      );
      expect(reservationRepository.save).not.toHaveBeenCalled();
    });

    it('debería lanzar NotFoundError si la reserva no existe', async () => {
      reservationAccess.resolveAndAuthorize.mockRejectedValue(
        new NotFoundError('Reservation', 'reservation-id'),
      );

      await expect(useCase.execute(makeInput())).rejects.toThrow(NotFoundError);
      expect(reservationRepository.save).not.toHaveBeenCalled();
    });

    it('debería lanzar ForbiddenError si el admin intenta confirmar una reserva de otro restaurante', async () => {
      reservationAccess.resolveAndAuthorize.mockRejectedValue(
        new ForbiddenError(
          'You can only manage reservations of your own restaurant',
        ),
      );

      await expect(useCase.execute(makeInput())).rejects.toThrow(
        ForbiddenError,
      );
      expect(reservationRepository.save).not.toHaveBeenCalled();
    });

    it('debería incluir notes en el email si la reserva las tiene', async () => {
      const reservation = makeReservation(
        ReservationStatus.PENDING,
        'Mesa cerca de la ventana',
      );
      reservationAccess.resolveAndAuthorize.mockResolvedValue({
        reservation,
        restaurant: makeRestaurant(),
      });
      reservationRepository.save.mockResolvedValue(reservation);
      emailService.sendReservationAccepted.mockResolvedValue(undefined);

      await useCase.execute(makeInput());

      expect(emailService.sendReservationAccepted).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Mesa cerca de la ventana',
        }),
      );
    });

    it('debería pasar notes como undefined cuando la reserva no tiene notas', async () => {
      const reservation = makeReservation(ReservationStatus.PENDING, null);
      reservationAccess.resolveAndAuthorize.mockResolvedValue({
        reservation,
        restaurant: makeRestaurant(),
      });
      reservationRepository.save.mockResolvedValue(reservation);
      emailService.sendReservationAccepted.mockResolvedValue(undefined);

      await useCase.execute(makeInput());

      expect(emailService.sendReservationAccepted).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: undefined,
        }),
      );
    });
  });
});
