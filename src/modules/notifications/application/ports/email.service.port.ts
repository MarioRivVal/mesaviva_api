type BaseEmailParams = {
  to: string;
};

type CustomerInfo = {
  customerName: string;
  customerLastName: string;
};

type ReservationInfo = {
  restaurantName: string;
  date: string;
  time: string;
  numberOfPeople: number;
  notes?: string;
};

export type WelcomeAdminParams = BaseEmailParams & {
  firstName: string;
  lastName: string;
  restaurantName: string;
  restaurantCategory: string;
  restaurantAddress: string;
  restaurantPhone: string;
  restaurantEmail: string;
  tempPassword: string;
};

export type ReservationAcceptedParams = BaseEmailParams &
  CustomerInfo &
  ReservationInfo;

export type ReservationRejectedParams = BaseEmailParams &
  CustomerInfo &
  ReservationInfo & {
    rejectionReason?: string;
  };

export type NewReservationAdminParams = BaseEmailParams &
  CustomerInfo &
  ReservationInfo & {
    customerEmail: string;
    customerPhone: string;
    isAutoConfirmed: boolean;
  };

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
