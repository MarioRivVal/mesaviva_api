import { AcceptanceMode } from '../enums/acceptance-mode.enum';
import { OpeningHours } from '../types/opening-hours.type';
import { TimeSlotInterval } from '../constants/time-slot-interval.const';

export class Settings {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public openingHours: OpeningHours,
    public timeSlotInterval: TimeSlotInterval,
    public depositAmount: number,
    public acceptanceMode: AcceptanceMode,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  static create(params: {
    id: string;
    restaurantId: string;
    openingHours: OpeningHours;
    timeSlotInterval: TimeSlotInterval;
    depositAmount: number;
    acceptanceMode: AcceptanceMode;
  }): Settings {
    return new Settings(
      params.id,
      params.restaurantId,
      params.openingHours,
      params.timeSlotInterval,
      params.depositAmount,
      params.acceptanceMode,
    );
  }
}
