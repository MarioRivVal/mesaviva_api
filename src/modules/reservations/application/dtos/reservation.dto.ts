import { ReservationStatus } from '@modules/reservations/domain/enums/reservation-status.enum';

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

export interface CancelByTokenInput {
  token: string;
}

export interface CancelByTokenResult {
  success: boolean;
  message: string;
}
