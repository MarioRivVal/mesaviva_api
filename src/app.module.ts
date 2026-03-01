import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validate } from '@shared/infrastructure/config/env.validation';
import { getTypeOrmConfig } from '@shared/infrastructure/database/typeorm.config';
import { SharedModule } from '@shared/shared.module';
import { UsersModule } from '@modules/users/users.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '@modules/auth/auth.module';
import { SettingsModule } from '@modules/settings/settings.module';
import { ReservationsModule } from '@modules/reservations/reservations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    SharedModule,
    UsersModule,
    AuthModule,
    SettingsModule,
    ReservationsModule,
  ],
})
export class AppModule {}
