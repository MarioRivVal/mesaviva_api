import { Reservation } from '../entities/reservation.entity';
import { ReservationFilters } from '../types/reservation-filter.type';

export abstract class ReservationRepositoryPort {
  abstract findById(id: string): Promise<Reservation | null>;
  abstract findByToken(token: string): Promise<Reservation | null>;
  abstract findByRestaurantAndFilters(
    restaurantId: string,
    filters: ReservationFilters,
  ): Promise<Reservation[]>;
  abstract save(reservation: Reservation): Promise<Reservation>;
  abstract delete(id: string): Promise<void>;
}
