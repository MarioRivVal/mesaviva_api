import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from '@modules/auth/infrastructure/controllers/auth.controller';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { getJwtConfig } from './infrastructure/config/jwt.config';
import { UsersModule } from '@modules/users/users.module';
import { SharedModule } from '@shared/shared.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getJwtConfig,
    }),
    UsersModule,
    SharedModule,
  ],
  providers: [LoginUseCase, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
