export interface WelcomeAdminParams {
  to: string;
  firstName: string;
  lastName: string;
  restaurantName: string;
  restaurantCategory: string;
  restaurantAddress: string;
  restaurantPhone: string;
  restaurantEmail: string;
  tempPassword: string;
}

export interface ReservationAcceptedParams {
  to: string;
  customerName: string;
  customerLastName: string;
  restaurantName: string;
  date: string;
  time: string;
  numberOfPeople: number;
  notes?: string;
}

export interface ReservationRejectedParams {
  to: string;
  customerName: string;
  customerLastName: string;
  date: string;
  time: string;
  numberOfPeople: number;
  rejectionReason?: string;
}

export interface NewReservationAdminParams {
  to: string;
  restaurantName: string;
  customerName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  time: string;
  numberOfPeople: number;
  isAutoConfirmed: boolean;
  notes?: string;
}

export abstract class EmailServicePort {
  abstract sendWelcomeToNewAdmin(params: WelcomeAdminParams): Promise<void>;
  abstract sendReservationAccepted(
    params: ReservationAcceptedParams,
  ): Promise<void>;
  abstract sendReservationRejected(
    params: ReservationRejectedParams,
  ): Promise<void>;
  abstract sendNewReservationToAdmin(
    params: NewReservationAdminParams,
  ): Promise<void>;
}
