import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import {
  PHONE_SPAIN_MESSAGE,
  PHONE_SPAIN_PATTERN,
  TIME_HH_MM_MESSAGE,
  TIME_HH_MM_PATTERN,
} from '@shared/domain/constants/validation.constants';

export class CreateReservationHttpDto {
  @IsUUID()
  @IsNotEmpty()
  restaurantId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @Matches(TIME_HH_MM_PATTERN, { message: TIME_HH_MM_MESSAGE })
  time: string;

  @IsInt()
  @IsPositive()
  @Min(1)
  @Max(20)
  numberOfPeople: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  customerName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  customerLastName: string;

  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;

  @IsString()
  @Matches(PHONE_SPAIN_PATTERN, { message: PHONE_SPAIN_MESSAGE })
  customerPhone: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
