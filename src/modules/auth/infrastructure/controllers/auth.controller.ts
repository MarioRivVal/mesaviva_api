import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { LoginUseCase } from '@modules/auth/application/use-cases/login.use-case';
import { LoginHttpDto } from './dtos/login.http-dto';
import { Throttle } from '@nestjs/throttler';
import { Auth } from '@shared/infrastructure/decorators/auth.decorator';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { User } from '@modules/users/domain/entities/user.entity';
import { ChangePasswordUseCase } from '@modules/auth/application/use-cases/change-password.use-case';
import { ChangePasswordHttpDto } from '@modules/auth/infrastructure/controllers/dtos/change-password.http-dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  @Get('me')
  @Auth(UserRole.SUPERADMIN, UserRole.RESTAURANT_ADMIN)
  getMe(@CurrentUser() user: User) {
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() body: LoginHttpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.loginUseCase.execute(body);

    response.cookie('auth_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      user: result.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return {
      ok: true,
    };
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @Auth(UserRole.SUPERADMIN, UserRole.RESTAURANT_ADMIN)
  async changePassword(
    @Body() body: ChangePasswordHttpDto,
    @CurrentUser() user: User,
  ) {
    await this.changePasswordUseCase.execute({
      currentUser: user,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });
    return { message: 'Password changed successfully' };
  }
}
