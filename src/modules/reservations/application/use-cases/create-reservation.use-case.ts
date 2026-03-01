import { Injectable } from '@nestjs/common';
import { ReservationRepositoryPort } from '@modules/reservations/domain/ports/reservation.repository.port';
import { RestaurantRepositoryPort } from '@modules/restaurants/domain/ports/restaurant.repository.port';
import { SettingsRepositoryPort } from '@modules/settings/domain/ports/settings.repository.port';
import { EmailServicePort } from '@modules/notifications/domain/ports/email.service.port';
import { ReservationValidatorService } from '../services/reservation-validator.service';
import { Reservation } from '@modules/reservations/domain/entities/reservation.entity';
import { ReservationStatus } from '@modules/reservations/domain/enums/reservation-status.enum';
import { AcceptanceMode } from '@modules/settings/domain/enums/acceptance-mode.enum';
import {
  BadRequestError,
  NotFoundError,
} from '@shared/domain/errors/domain.errors';
import {
  CreateReservationInput,
  CreateReservationResult,
} from '../dtos/reservation.dto';

@Injectable()
export class CreateReservationUseCase {
  constructor(
    private readonly reservationRepository: ReservationRepositoryPort,
    private readonly restaurantRepository: RestaurantRepositoryPort,
    private readonly settingsRepository: SettingsRepositoryPort,
    private readonly emailService: EmailServicePort,
    private readonly validator: ReservationValidatorService,
  ) {}

  async execute(
    input: CreateReservationInput,
  ): Promise<CreateReservationResult> {
    const restaurant = await this.restaurantRepository.findById(
      input.restaurantId,
    );
    if (!restaurant) throw new NotFoundError('Restaurant', input.restaurantId);
    if (!restaurant.isActive) {
      throw new BadRequestError(
        'This restaurant is not accepting reservations',
      );
    }

    const settings = await this.settingsRepository.findByRestaurantId(
      input.restaurantId,
    );
    if (!settings)
      throw new NotFoundError('Settings for restaurant', input.restaurantId);

    const reservationsForDay =
      await this.reservationRepository.findByRestaurantAndFilters(
        input.restaurantId,
        { date: input.date },
      );

    this.validator.validateGroupSize(input.numberOfPeople);
    this.validator.validateMinimumAdvanceTime(input.date, input.time);
    const matchingShift = this.validator.validateOpeningHours(
      input.date,
      input.time,
      settings.openingHours,
    );
    this.validator.validateTimeSlotInterval(
      input.time,
      settings.timeSlotInterval,
    );
    this.validator.validateCapacity(
      input.numberOfPeople,
      matchingShift,
      reservationsForDay,
    );

    const initialStatus =
      settings.acceptanceMode === AcceptanceMode.AUTO
        ? ReservationStatus.CONFIRMED
        : ReservationStatus.PENDING;

    const reservation = Reservation.create({
      id: crypto.randomUUID(),
      restaurantId: input.restaurantId,
      date: input.date,
      time: input.time,
      numberOfPeople: input.numberOfPeople,
      customerName: input.customerName,
      customerLastName: input.customerLastName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      notes: input.notes ?? null,
      status: initialStatus,
      cancellationToken: crypto.randomUUID(),
    });

    const saved = await this.reservationRepository.save(reservation);

    await this.emailService.sendNewReservationToAdmin({
      to: restaurant.email,
      restaurantName: restaurant.name,
      customerName: saved.customerName,
      customerLastName: saved.customerLastName,
      customerEmail: saved.customerEmail,
      customerPhone: saved.customerPhone,
      date: saved.date,
      time: saved.time,
      numberOfPeople: saved.numberOfPeople,
      notes: saved.notes ?? undefined,
      isAutoConfirmed: initialStatus === ReservationStatus.CONFIRMED,
    });

    if (initialStatus === ReservationStatus.CONFIRMED) {
      await this.emailService.sendReservationAccepted({
        to: saved.customerEmail,
        customerName: saved.customerName,
        customerLastName: saved.customerLastName,
        restaurantName: restaurant.name,
        date: saved.date,
        time: saved.time,
        numberOfPeople: saved.numberOfPeople,
        notes: saved.notes ?? undefined,
      });
    } else {
      await this.emailService.sendReservationPending({
        to: saved.customerEmail,
        customerName: saved.customerName,
        customerLastName: saved.customerLastName,
        restaurantName: restaurant.name,
        date: saved.date,
        time: saved.time,
        numberOfPeople: saved.numberOfPeople,
        notes: saved.notes ?? undefined,
      });
    }

    return {
      reservation: {
        id: saved.id,
        restaurantId: saved.restaurantId,
        date: saved.date,
        time: saved.time,
        numberOfPeople: saved.numberOfPeople,
        status: saved.status,
        cancellationToken: saved.cancellationToken,
      },
      message:
        initialStatus === ReservationStatus.CONFIRMED
          ? 'Reservation confirmed successfully'
          : 'Reservation request received. You will be notified once the restaurant confirms',
    };
  }
}
