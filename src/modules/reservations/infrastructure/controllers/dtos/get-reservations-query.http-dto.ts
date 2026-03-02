import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ReservationStatus } from '@modules/reservations/domain/enums/reservation-status.enum';

export class GetReservationsQueryDto {
  @IsUUID()
  restaurantId: string;

  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
