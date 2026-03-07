import { ReservationStatus } from '@modules/reservations/domain/enums/reservation-status.enum';
import { User } from '@modules/users/domain/entities/user.entity';
import { ReservationFilters } from '@modules/reservations/domain/types/reservation-filter.type';

export interface CreateReservationInput {
  restaurantId: string;
  date: string;
  time: string;
  numberOfPeople: number;
  customerName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
}

export interface CreateReservationResult {
  reservation: {
    id: string;
    restaurantId: string;
    date: string;
    time: string;
    numberOfPeople: number;
    status: ReservationStatus;
    cancellationToken: string;
  };
  message: string;
}

export interface GetReservationsInput {
  restaurantId: string;
  currentUser: User;
  filters: ReservationFilters;
}

export interface ConfirmReservationInput {
  reservationId: string;
  currentUser: User;
}

export interface RejectReservationInput {
  reservationId: string;
  reason: string;
  currentUser: User;
}

export interface CancelReservationInput {
  reservationId: string;
  currentUser: User;
  reason?: string;
}

export interface CancelByTokenInput {
  token: string;
}

export interface CancelByTokenResult {
  success: boolean;
  message: string;
}
