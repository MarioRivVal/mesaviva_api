import { AcceptanceMode } from '@modules/settings/domain/enums/acceptance-mode.enum';
import { OpeningHours } from '@modules/settings/domain/types/opening-hours.type';
import { TimeSlotInterval } from '@modules/settings/domain/constants/time-slot-interval.const';
import { User } from '@modules/users/domain/entities/user.entity';

export interface GetSettingsInput {
  restaurantId: string;
  currentUser: User;
}

export interface UpdateSettingsInput {
  restaurantId: string;
  currentUser: User;
  openingHours?: OpeningHours;
  timeSlotInterval?: TimeSlotInterval;
  depositAmount?: number;
  acceptanceMode?: AcceptanceMode;
}

export interface SettingsResult {
  id: string;
  restaurantId: string;
  openingHours: OpeningHours;
  timeSlotInterval: TimeSlotInterval;
  depositAmount: number;
  acceptanceMode: AcceptanceMode;
  timestamps: {
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface PublicSettingsResult {
  openingHours: OpeningHours;
  timeSlotInterval: TimeSlotInterval;
  depositAmount: number;
  acceptanceMode: AcceptanceMode;
}
