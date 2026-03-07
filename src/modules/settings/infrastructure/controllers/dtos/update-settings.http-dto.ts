import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import * as timeSlotIntervalConst from '@modules/settings/domain/constants/time-slot-interval.const';
import { AcceptanceMode } from '@modules/settings/domain/enums/acceptance-mode.enum';
import {
  TIME_HH_MM_MESSAGE,
  TIME_HH_MM_PATTERN,
} from '@shared/domain/constants/validation.constants';

export class TimeRangeHttpDto {
  @IsString()
  @Matches(TIME_HH_MM_PATTERN, { message: TIME_HH_MM_MESSAGE })
  open: string;

  @IsString()
  @Matches(TIME_HH_MM_PATTERN, { message: TIME_HH_MM_MESSAGE })
  close: string;

  @IsNumber()
  @IsPositive()
  @Min(1)
  capacity: number;
}

export class OpeningHoursHttpDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeRangeHttpDto)
  monday: TimeRangeHttpDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeRangeHttpDto)
  tuesday: TimeRangeHttpDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeRangeHttpDto)
  wednesday: TimeRangeHttpDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeRangeHttpDto)
  thursday: TimeRangeHttpDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeRangeHttpDto)
  friday: TimeRangeHttpDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeRangeHttpDto)
  saturday: TimeRangeHttpDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeRangeHttpDto)
  sunday: TimeRangeHttpDto[];
}

export class UpdateSettingsHttpDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => OpeningHoursHttpDto)
  openingHours?: OpeningHoursHttpDto;

  @IsOptional()
  @IsNumber()
  @IsIn(timeSlotIntervalConst.TIME_SLOT_INTERVALS)
  timeSlotInterval?: timeSlotIntervalConst.TimeSlotInterval;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'depositAmount must be greater than or equal to 0' })
  depositAmount?: number;

  @IsOptional()
  @IsEnum(AcceptanceMode)
  acceptanceMode?: AcceptanceMode;
}
