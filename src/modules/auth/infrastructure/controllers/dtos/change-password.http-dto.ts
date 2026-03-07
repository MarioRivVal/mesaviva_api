import { IsNotEmpty, IsString, Matches } from 'class-validator';
import {
  PASSWORD_PATTERN,
  PASSWORD_MESSAGE,
} from '@shared/domain/constants/validation.constants';

export class ChangePasswordHttpDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  newPassword: string;
}
