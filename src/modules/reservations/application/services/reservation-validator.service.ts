import { Injectable } from '@nestjs/common';
import {
  DayOfWeek,
  OpeningHours,
  TimeRange,
} from '@modules/settings/domain/types/opening-hours.type';
import { BadRequestError } from '@shared/domain/errors/domain.errors';
import { Reservation } from '@modules/reservations/domain/entities/reservation.entity';
import { ReservationStatus } from '@modules/reservations/domain/enums/reservation-status.enum';

@Injectable()
export class ReservationValidatorService {
  private readonly MAX_ONLINE_GROUP_SIZE = 9;

  validateGroupSize(numberOfPeople: number): void {
    if (numberOfPeople > this.MAX_ONLINE_GROUP_SIZE) {
      throw new BadRequestError(
        'For groups of 10 or more please contact the restaurant directly',
      );
    }
  }

  validateMinimumAdvanceTime(date: string, time: string): void {
    const reservationDateTime = this.parseDateTime(date, time);
    const now = new Date();
    const minimumAdvanceMs = 30 * 60 * 1000;

    if (reservationDateTime.getTime() - now.getTime() < minimumAdvanceMs) {
      throw new BadRequestError(
        'Reservations must be made at least 30 minutes in advance',
      );
    }
  }

  validateOpeningHours(
    date: string,
    time: string,
    openingHours: OpeningHours,
  ): TimeRange {
    const dayOfWeek = new Date(date)
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase() as DayOfWeek;

    const daySchedule: TimeRange[] = openingHours[dayOfWeek];

    if (!daySchedule || daySchedule.length === 0) {
      throw new BadRequestError(`Restaurant is closed on ${dayOfWeek}s`);
    }

    const matchingShift = daySchedule.find(
      (shift) => time >= shift.open && time < shift.close,
    );

    if (!matchingShift) {
      throw new BadRequestError(
        `Restaurant is not open at ${time} on ${dayOfWeek}s`,
      );
    }

    const MINIMUM_SERVICE_TIME = 60;
    const closeMinutes = this.timeToMinutes(matchingShift.close);
    const requestedMinutes = this.timeToMinutes(time);

    if (closeMinutes - requestedMinutes < MINIMUM_SERVICE_TIME) {
      throw new BadRequestError(
        `Last reservation is at ${this.subtractMinutes(matchingShift.close, MINIMUM_SERVICE_TIME)}`,
      );
    }

    return matchingShift;
  }

  validateTimeSlotInterval(time: string, interval: number): void {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes % interval !== 0) {
      throw new BadRequestError(
        `Time must align with ${interval}-minute intervals. ` +
          `Next valid time: ${this.getNextValidTime(time, interval)}`,
      );
    }
  }

  validateCapacity(
    numberOfPeople: number,
    matchingShift: TimeRange,
    existingReservations: Reservation[],
  ): void {
    const occupied = existingReservations
      .filter(
        (r) =>
          r.time >= matchingShift.open &&
          r.time < matchingShift.close &&
          r.status !== ReservationStatus.CANCELLED &&
          r.status !== ReservationStatus.REJECTED,
      )
      .reduce((sum, r) => sum + r.numberOfPeople, 0);

    if (occupied + numberOfPeople > matchingShift.capacity) {
      throw new BadRequestError(
        `No capacity available for this shift. ` +
          `Available: ${matchingShift.capacity - occupied} people`,
      );
    }
  }

  private parseDateTime(date: string, time: string): Date {
    return new Date(`${date}T${time}:00`);
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private subtractMinutes(time: string, minutes: number): string {
    const total = this.timeToMinutes(time) - minutes;
    return `${Math.floor(total / 60)
      .toString()
      .padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
  }

  private getNextValidTime(time: string, interval: number): string {
    const total = this.timeToMinutes(time);
    const next = Math.ceil(total / interval) * interval;
    return `${Math.floor(next / 60)
      .toString()
      .padStart(2, '0')}:${(next % 60).toString().padStart(2, '0')}`;
  }
}
