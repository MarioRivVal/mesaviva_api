import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RejectReservationHttpDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reason: string;
}
