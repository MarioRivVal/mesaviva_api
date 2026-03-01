import { CancelByTokenUseCase } from '@modules/reservations/application/use-cases/cancel-by-token.use-case';
import { ReservationRepositoryPort } from '@modules/reservations/domain/ports/reservation.repository.port';
import { RestaurantRepositoryPort } from '@modules/restaurants/domain/ports/restaurant.repository.port';
import { EmailServicePort } from '@modules/notifications/domain/ports/email.service.port';
import { Reservation } from '@modules/reservations/domain/entities/reservation.entity';
import { Restaurant } from '@modules/restaurants/domain/entities/restaurant.entity';
import { ReservationStatus } from '@modules/reservations/domain/enums/reservation-status.enum';
import { PaymentStatus } from '@modules/reservations/domain/enums/payment-status.enum';
import { RestaurantCategory } from '@modules/restaurants/domain/enums/restaurant-category.enum';
import {
  BadRequestError,
  NotFoundError,
} from '@shared/domain/errors/domain.errors';

const makeReservation = (
  status: ReservationStatus = ReservationStatus.CONFIRMED,
): Reservation =>
  new Reservation(
    'reservation-id',
    'restaurant-id',
    '2026-03-02',
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
    'valid-cancel-token',
    new Date(),
    new Date(),
  );

const makeRestaurant = (): Restaurant =>
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
  );

describe('CancelByTokenUseCase', () => {
  let useCase: CancelByTokenUseCase;
  let reservationRepository: jest.Mocked<ReservationRepositoryPort>;
  let restaurantRepository: jest.Mocked<RestaurantRepositoryPort>;
  let emailService: jest.Mocked<EmailServicePort>;

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

    emailService = {
      sendWelcomeToNewAdmin: jest.fn(),
      sendReservationAccepted: jest.fn(),
      sendReservationPending: jest.fn(),
      sendReservationRejected: jest.fn(),
      sendReservationCancelled: jest.fn(),
      sendNewReservationToAdmin: jest.fn(),
    } as jest.Mocked<EmailServicePort>;

    useCase = new CancelByTokenUseCase(
      reservationRepository,
      restaurantRepository,
      emailService,
    );
  });

  describe('execute', () => {
    it('debería cancelar una reserva CONFIRMED y retornar success', async () => {
      const reservation = makeReservation(ReservationStatus.CONFIRMED);
      reservationRepository.findByToken.mockResolvedValue(reservation);
      restaurantRepository.findById.mockResolvedValue(makeRestaurant());
      reservationRepository.save.mockResolvedValue({
        ...reservation,
        status: ReservationStatus.CANCELLED,
      } as Reservation);
      emailService.sendReservationCancelled.mockResolvedValue(undefined);

      const result = await useCase.execute({ token: 'valid-cancel-token' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('cancelled');
      expect(reservation.status).toBe(ReservationStatus.CANCELLED);
      expect(reservationRepository.save).toHaveBeenCalledWith(reservation);
    });

    it('debería cancelar una reserva PENDING y retornar success', async () => {
      const reservation = makeReservation(ReservationStatus.PENDING);
      reservationRepository.findByToken.mockResolvedValue(reservation);
      restaurantRepository.findById.mockResolvedValue(makeRestaurant());
      reservationRepository.save.mockResolvedValue({
        ...reservation,
        status: ReservationStatus.CANCELLED,
      } as Reservation);
      emailService.sendReservationCancelled.mockResolvedValue(undefined);

      const result = await useCase.execute({ token: 'valid-cancel-token' });

      expect(result.success).toBe(true);
      expect(reservation.status).toBe(ReservationStatus.CANCELLED);
    });

    it('debería lanzar NotFoundError si el token no existe', async () => {
      reservationRepository.findByToken.mockResolvedValue(null);

      await expect(
        useCase.execute({ token: 'token-invalido' }),
      ).rejects.toThrow(NotFoundError);
      expect(restaurantRepository.findById).not.toHaveBeenCalled();
      expect(reservationRepository.save).not.toHaveBeenCalled();
    });

    it('debería lanzar NotFoundError si el restaurante de la reserva no existe', async () => {
      reservationRepository.findByToken.mockResolvedValue(
        makeReservation(ReservationStatus.CONFIRMED),
      );
      restaurantRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({ token: 'valid-cancel-token' }),
      ).rejects.toThrow(NotFoundError);
      expect(reservationRepository.save).not.toHaveBeenCalled();
    });

    it('debería lanzar BadRequestError si la reserva ya está CANCELLED', async () => {
      reservationRepository.findByToken.mockResolvedValue(
        makeReservation(ReservationStatus.CANCELLED),
      );
      restaurantRepository.findById.mockResolvedValue(makeRestaurant());

      await expect(
        useCase.execute({ token: 'valid-cancel-token' }),
      ).rejects.toThrow(BadRequestError);
      expect(reservationRepository.save).not.toHaveBeenCalled();
    });

    it('debería lanzar BadRequestError si la reserva está REJECTED', async () => {
      reservationRepository.findByToken.mockResolvedValue(
        makeReservation(ReservationStatus.REJECTED),
      );
      restaurantRepository.findById.mockResolvedValue(makeRestaurant());

      await expect(
        useCase.execute({ token: 'valid-cancel-token' }),
      ).rejects.toThrow(BadRequestError);
      expect(reservationRepository.save).not.toHaveBeenCalled();
    });

    it('debería enviar email de cancelación al cliente con los datos correctos', async () => {
      const reservation = makeReservation(ReservationStatus.CONFIRMED);
      reservationRepository.findByToken.mockResolvedValue(reservation);
      restaurantRepository.findById.mockResolvedValue(makeRestaurant());
      reservationRepository.save.mockResolvedValue(reservation);
      emailService.sendReservationCancelled.mockResolvedValue(undefined);

      await useCase.execute({ token: 'valid-cancel-token' });

      expect(emailService.sendReservationCancelled).toHaveBeenCalledTimes(1);
      expect(emailService.sendReservationCancelled).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'mario@test.com',
          customerName: 'Mario',
          customerLastName: 'Rivera',
          restaurantName: 'La Tasca',
          date: '2026-03-02',
          time: '13:00',
          numberOfPeople: 2,
        }),
      );
    });

    it('no debería enviar ningún otro email al cancelar', async () => {
      const reservation = makeReservation(ReservationStatus.CONFIRMED);
      reservationRepository.findByToken.mockResolvedValue(reservation);
      restaurantRepository.findById.mockResolvedValue(makeRestaurant());
      reservationRepository.save.mockResolvedValue(reservation);
      emailService.sendReservationCancelled.mockResolvedValue(undefined);

      await useCase.execute({ token: 'valid-cancel-token' });

      expect(emailService.sendReservationAccepted).not.toHaveBeenCalled();
      expect(emailService.sendReservationPending).not.toHaveBeenCalled();
      expect(emailService.sendReservationRejected).not.toHaveBeenCalled();
      expect(emailService.sendNewReservationToAdmin).not.toHaveBeenCalled();
    });
  });
});
