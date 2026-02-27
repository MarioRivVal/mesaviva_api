import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginHttpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
