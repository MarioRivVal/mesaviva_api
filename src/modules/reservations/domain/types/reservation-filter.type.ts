import { ReservationStatus } from '../enums/reservation-status.enum';

export interface ReservationFilters {
  status?: ReservationStatus;
  date?: string;
  startDate?: string;
  endDate?: string;
}
