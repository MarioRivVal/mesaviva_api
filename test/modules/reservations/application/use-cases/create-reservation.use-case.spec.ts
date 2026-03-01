import { CreateReservationUseCase } from '@modules/reservations/application/use-cases/create-reservation.use-case';
import { ReservationRepositoryPort } from '@modules/reservations/domain/ports/reservation.repository.port';
import { RestaurantRepositoryPort } from '@modules/restaurants/domain/ports/restaurant.repository.port';
import { SettingsRepositoryPort } from '@modules/settings/domain/ports/settings.repository.port';
import { EmailServicePort } from '@modules/notifications/domain/ports/email.service.port';
import { ReservationValidatorService } from '@modules/reservations/application/services/reservation-validator.service';
import { Reservation } from '@modules/reservations/domain/entities/reservation.entity';
import { Restaurant } from '@modules/restaurants/domain/entities/restaurant.entity';
import { Settings } from '@modules/settings/domain/entities/settings.entity';
import { ReservationStatus } from '@modules/reservations/domain/enums/reservation-status.enum';
import { PaymentStatus } from '@modules/reservations/domain/enums/payment-status.enum';
import { AcceptanceMode } from '@modules/settings/domain/enums/acceptance-mode.enum';
import { RestaurantCategory } from '@modules/restaurants/domain/enums/restaurant-category.enum';
import { OpeningHours } from '@modules/settings/domain/types/opening-hours.type';
import {
  BadRequestError,
  NotFoundError,
} from '@shared/domain/errors/domain.errors';
import { CreateReservationInput } from '@modules/reservations/application/dtos/reservation.dto';

const openingHours: OpeningHours = {
  monday: [{ open: '13:00', close: '16:00', capacity: 20 }],
  tuesday: [{ open: '13:00', close: '16:00', capacity: 20 }],
  wednesday: [{ open: '13:00', close: '16:00', capacity: 20 }],
  thursday: [{ open: '13:00', close: '16:00', capacity: 20 }],
  friday: [{ open: '13:00', close: '16:00', capacity: 20 }],
  saturday: [{ open: '13:00', close: '16:00', capacity: 20 }],
  sunday: [],
};

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

const makeSettings = (
  acceptanceMode: AcceptanceMode = AcceptanceMode.AUTO,
): Settings =>
  new Settings(
    'settings-id',
    'restaurant-id',
    openingHours,
    30,
    0,
    acceptanceMode,
  );

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
    'cancel-token-uuid',
    new Date(),
    new Date(),
  );

const makeInput = (
  overrides: Partial<CreateReservationInput> = {},
): CreateReservationInput => ({
  restaurantId: 'restaurant-id',
  date: '2026-03-02',
  time: '13:00',
  numberOfPeople: 2,
  customerName: 'Mario',
  customerLastName: 'Rivera',
  customerEmail: 'mario@test.com',
  customerPhone: '+34600000001',
  ...overrides,
});

describe('CreateReservationUseCase', () => {
  let useCase: CreateReservationUseCase;
  let reservationRepository: jest.Mocked<ReservationRepositoryPort>;
  let restaurantRepository: jest.Mocked<RestaurantRepositoryPort>;
  let settingsRepository: jest.Mocked<SettingsRepositoryPort>;
  let emailService: jest.Mocked<EmailServicePort>;
  let validator: jest.Mocked<ReservationValidatorService>;

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

    settingsRepository = {
      findByRestaurantId: jest.fn(),
      save: jest.fn(),
    } as jest.Mocked<SettingsRepositoryPort>;

    emailService = {
      sendWelcomeToNewAdmin: jest.fn(),
      sendReservationAccepted: jest.fn(),
      sendReservationPending: jest.fn(),
      sendReservationRejected: jest.fn(),
      sendReservationCancelled: jest.fn(),
      sendNewReservationToAdmin: jest.fn(),
    } as jest.Mocked<EmailServicePort>;

    validator = {
      validateGroupSize: jest.fn(),
      validateMinimumAdvanceTime: jest.fn(),
      validateOpeningHours: jest.fn(),
      validateTimeSlotInterval: jest.fn(),
      validateCapacity: jest.fn(),
    } as unknown as jest.Mocked<ReservationValidatorService>;

    useCase = new CreateReservationUseCase(
      reservationRepository,
      restaurantRepository,
      settingsRepository,
      emailService,
      validator,
    );
  });

  describe('execute', () => {
    it('debería crear reserva CONFIRMED y enviar email confirmado cuando acceptanceMode es AUTO', async () => {
      const confirmedReservation = makeReservation(ReservationStatus.CONFIRMED);
      restaurantRepository.findById.mockResolvedValue(makeRestaurant());
      settingsRepository.findByRestaurantId.mockResolvedValue(
        makeSettings(AcceptanceMode.AUTO),
      );
      reservationRepository.findByRestaurantAndFilters.mockResolvedValue([]);
      validator.validateOpeningHours.mockReturnValue({
        open: '13:00',
        close: '16:00',
        capacity: 20,
      });
      reservationRepository.save.mockResolvedValue(confirmedReservation);
      emailService.sendNewReservationToAdmin.mockResolvedValue(undefined);
      emailService.sendReservationAccepted.mockResolvedValue(undefined);

      const result = await useCase.execute(makeInput());

      expect(result.reservation.status).toBe(ReservationStatus.CONFIRMED);
      expect(result.message).toContain('confirmed');
      expect(emailService.sendReservationAccepted).toHaveBeenCalledTimes(1);
      expect(emailService.sendReservationPending).not.toHaveBeenCalled();
      expect(emailService.sendNewReservationToAdmin).toHaveBeenCalledWith(
        expect.objectContaining({ isAutoConfirmed: true }),
      );
    });

    it('debería crear reserva PENDING y enviar email pendiente cuando acceptanceMode es MANUAL', async () => {
      const pendingReservation = makeReservation(ReservationStatus.PENDING);
      restaurantRepository.findById.mockResolvedValue(makeRestaurant());
      settingsRepository.findByRestaurantId.mockResolvedValue(
        makeSettings(AcceptanceMode.MANUAL),
      );
      reservationRepository.findByRestaurantAndFilters.mockResolvedValue([]);
      validator.validateOpeningHours.mockReturnValue({
        open: '13:00',
        close: '16:00',
        capacity: 20,
      });
      reservationRepository.save.mockResolvedValue(pendingReservation);
      emailService.sendNewReservationToAdmin.mockResolvedValue(undefined);
      emailService.sendReservationPending.mockResolvedValue(undefined);

      const result = await useCase.execute(makeInput());

      expect(result.reservation.status).toBe(ReservationStatus.PENDING);
      expect(result.message).toContain('notified');
      expect(emailService.sendReservationPending).toHaveBeenCalledTimes(1);
      expect(emailService.sendReservationAccepted).not.toHaveBeenCalled();
      expect(emailService.sendNewReservationToAdmin).toHaveBeenCalledWith(
        expect.objectContaining({ isAutoConfirmed: false }),
      );
    });

    it('debería lanzar NotFoundError si el restaurante no existe', async () => {
      restaurantRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(makeInput())).rejects.toThrow(NotFoundError);
      expect(reservationRepository.save).not.toHaveBeenCalled();
    });

    it('debería lanzar BadRequestError si el restaurante no está activo', async () => {
      restaurantRepository.findById.mockResolvedValue(
        makeRestaurant({ isActive: false }),
      );

      await expect(useCase.execute(makeInput())).rejects.toThrow(
        BadRequestError,
      );
      expect(reservationRepository.save).not.toHaveBeenCalled();
    });

    it('debería lanzar NotFoundError si el restaurante no tiene settings', async () => {
      restaurantRepository.findById.mockResolvedValue(makeRestaurant());
      settingsRepository.findByRestaurantId.mockResolvedValue(null);

      await expect(useCase.execute(makeInput())).rejects.toThrow(NotFoundError);
      expect(reservationRepository.save).not.toHaveBeenCalled();
    });

    it('debería llamar a todos los validadores con los parámetros correctos', async () => {
      const shift = { open: '13:00', close: '16:00', capacity: 20 };
      restaurantRepository.findById.mockResolvedValue(makeRestaurant());
      settingsRepository.findByRestaurantId.mockResolvedValue(
        makeSettings(AcceptanceMode.AUTO),
      );
      reservationRepository.findByRestaurantAndFilters.mockResolvedValue([]);
      validator.validateOpeningHours.mockReturnValue(shift);
      reservationRepository.save.mockResolvedValue(
        makeReservation(ReservationStatus.CONFIRMED),
      );
      emailService.sendNewReservationToAdmin.mockResolvedValue(undefined);
      emailService.sendReservationAccepted.mockResolvedValue(undefined);

      await useCase.execute(makeInput());

      expect(validator.validateGroupSize).toHaveBeenCalledWith(2);
      expect(validator.validateMinimumAdvanceTime).toHaveBeenCalledWith(
        '2026-03-02',
        '13:00',
      );
      expect(validator.validateOpeningHours).toHaveBeenCalledWith(
        '2026-03-02',
        '13:00',
        openingHours,
      );
      expect(validator.validateTimeSlotInterval).toHaveBeenCalledWith(
        '13:00',
        30,
      );
      expect(validator.validateCapacity).toHaveBeenCalledWith(2, shift, []);
    });

    it('debería incluir el cancellationToken en el resultado', async () => {
      const reservation = makeReservation(ReservationStatus.CONFIRMED);
      restaurantRepository.findById.mockResolvedValue(makeRestaurant());
      settingsRepository.findByRestaurantId.mockResolvedValue(
        makeSettings(AcceptanceMode.AUTO),
      );
      reservationRepository.findByRestaurantAndFilters.mockResolvedValue([]);
      validator.validateOpeningHours.mockReturnValue({
        open: '13:00',
        close: '16:00',
        capacity: 20,
      });
      reservationRepository.save.mockResolvedValue(reservation);
      emailService.sendNewReservationToAdmin.mockResolvedValue(undefined);
      emailService.sendReservationAccepted.mockResolvedValue(undefined);

      const result = await useCase.execute(makeInput());

      expect(result.reservation.cancellationToken).toBe('cancel-token-uuid');
    });

    it('debería pasar notes al email del admin cuando se proporcionan', async () => {
      const reservation = makeReservation(ReservationStatus.CONFIRMED);
      restaurantRepository.findById.mockResolvedValue(makeRestaurant());
      settingsRepository.findByRestaurantId.mockResolvedValue(
        makeSettings(AcceptanceMode.AUTO),
      );
      reservationRepository.findByRestaurantAndFilters.mockResolvedValue([]);
      validator.validateOpeningHours.mockReturnValue({
        open: '13:00',
        close: '16:00',
        capacity: 20,
      });
      reservationRepository.save.mockResolvedValue(reservation);
      emailService.sendNewReservationToAdmin.mockResolvedValue(undefined);
      emailService.sendReservationAccepted.mockResolvedValue(undefined);

      await useCase.execute(makeInput({ notes: 'Mesa cerca de la ventana' }));

      expect(emailService.sendNewReservationToAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'info@latasca.com',
          restaurantName: 'La Tasca',
          customerName: 'Mario',
          customerEmail: 'mario@test.com',
        }),
      );
    });
  });
});
