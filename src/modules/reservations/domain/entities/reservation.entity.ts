import { ReservationStatus } from '../enums/reservation-status.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { BadRequestError } from '@shared/domain/errors/domain.errors';

export class Reservation {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public date: string,
    public time: string,
    public numberOfPeople: number,
    public readonly customerName: string,
    public readonly customerLastName: string,
    public readonly customerEmail: string,
    public readonly customerPhone: string,
    public notes: string | null,
    public status: ReservationStatus,
    public readonly depositAmount: number,
    public paymentStatus: PaymentStatus,
    public paymentId: string | null,
    public paymentMethod: string | null,
    public paymentDeadline: Date | null,
    public rejectionReason: string | null,
    public readonly cancellationToken: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  static create(params: {
    id: string;
    restaurantId: string;
    date: string;
    time: string;
    numberOfPeople: number;
    customerName: string;
    customerLastName: string;
    customerEmail: string;
    customerPhone: string;
    notes: string | null;
    status: ReservationStatus;
    cancellationToken: string;
  }): Reservation {
    return new Reservation(
      params.id,
      params.restaurantId,
      params.date,
      params.time,
      params.numberOfPeople,
      params.customerName,
      params.customerLastName,
      params.customerEmail,
      params.customerPhone,
      params.notes,
      params.status,
      0, // depositAmount H3
      PaymentStatus.PENDING,
      null, // paymentId H3
      null, // paymentMethod H3
      null, // paymentDeadline H3
      null, // rejectionReason
      params.cancellationToken,
    );
  }

  accept(): void {
    if (this.status !== ReservationStatus.PENDING) {
      throw new BadRequestError('Only pending reservations can be accepted');
    }
    this.status = ReservationStatus.CONFIRMED;
  }

  reject(reason: string): void {
    if (this.status !== ReservationStatus.PENDING) {
      throw new BadRequestError('Only pending reservations can be rejected');
    }
    this.status = ReservationStatus.REJECTED;
    this.rejectionReason = reason || null;
  }

  cancel(): void {
    if (
      this.status !== ReservationStatus.CONFIRMED &&
      this.status !== ReservationStatus.PENDING
    ) {
      throw new BadRequestError(
        'Only pending or confirmed reservations can be cancelled',
      );
    }
    this.status = ReservationStatus.CANCELLED;
  }
}
