import { CancelReservationUseCase } from '@modules/reservations/application/use-cases/cancel-reservation.use-case';
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
import { CancelReservationInput } from '@modules/reservations/application/dtos/reservation.dto';

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
  status: ReservationStatus = ReservationStatus.CONFIRMED,
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
    null,
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
  overrides: Partial<CancelReservationInput> = {},
): CancelReservationInput => ({
  reservationId: 'reservation-id',
  currentUser: makeUser(),
  ...overrides,
});

describe('CancelReservationUseCase', () => {
  let useCase: CancelReservationUseCase;
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

    useCase = new CancelReservationUseCase(
      reservationRepository,
      emailService,
      reservationAccess,
    );
  });

  describe('execute', () => {
    it('debería cancelar una reserva CONFIRMED y enviar email de cancelación', async () => {
      const reservation = makeReservation(ReservationStatus.CONFIRMED);
      reservationAccess.resolveAndAuthorize.mockResolvedValue({
        reservation,
        restaurant: makeRestaurant(),
      });
      reservationRepository.save.mockResolvedValue(reservation);
      emailService.sendReservationCancelled.mockResolvedValue(undefined);

      await useCase.execute(makeInput());

      expect(reservation.status).toBe(ReservationStatus.CANCELLED);
      expect(reservationRepository.save).toHaveBeenCalledWith(reservation);
      expect(emailService.sendReservationCancelled).toHaveBeenCalledTimes(1);
      expect(emailService.sendReservationCancelled).toHaveBeenCalledWith(
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

    it('debería cancelar una reserva PENDING y enviar email de cancelación', async () => {
      const reservation = makeReservation(ReservationStatus.PENDING);
      reservationAccess.resolveAndAuthorize.mockResolvedValue({
        reservation,
        restaurant: makeRestaurant(),
      });
      reservationRepository.save.mockResolvedValue(reservation);
      emailService.sendReservationCancelled.mockResolvedValue(undefined);

      await useCase.execute(makeInput());

      expect(reservation.status).toBe(ReservationStatus.CANCELLED);
      expect(emailService.sendReservationCancelled).toHaveBeenCalledTimes(1);
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
      expect(emailService.sendReservationCancelled).not.toHaveBeenCalled();
    });

    it('debería lanzar BadRequestError si la reserva está REJECTED', async () => {
      const reservation = makeReservation(ReservationStatus.REJECTED);
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

    it('debería lanzar ForbiddenError si el admin intenta cancelar una reserva de otro restaurante', async () => {
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

    it('no debería llamar a otros emails al cancelar', async () => {
      const reservation = makeReservation(ReservationStatus.CONFIRMED);
      reservationAccess.resolveAndAuthorize.mockResolvedValue({
        reservation,
        restaurant: makeRestaurant(),
      });
      reservationRepository.save.mockResolvedValue(reservation);
      emailService.sendReservationCancelled.mockResolvedValue(undefined);

      await useCase.execute(makeInput());

      expect(emailService.sendReservationAccepted).not.toHaveBeenCalled();
      expect(emailService.sendReservationPending).not.toHaveBeenCalled();
      expect(emailService.sendReservationRejected).not.toHaveBeenCalled();
    });
  });
});
