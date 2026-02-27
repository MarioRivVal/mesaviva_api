import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from '@shared/infrastructure/database/typeorm.config';
import { SharedModule } from '@shared/shared.module';
import { UsersModule } from '@modules/users/users.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '@modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
  ],
})
export class AppModule {}
