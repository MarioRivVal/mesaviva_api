import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationOrmEntity } from './infrastructure/persistence/reservation.orm-entity';
import { ReservationRepositoryPort } from './domain/ports/reservation.repository.port';
import { ReservationTypeOrmRepository } from './infrastructure/persistence/reservation.typeorm.repository';
import { CreateReservationUseCase } from './application/use-cases/create-reservation.use-case';
import { CancelByTokenUseCase } from './application/use-cases/cancel-by-token.use-case';
import { ReservationValidatorService } from './application/services/reservation-validator.service';
import { ReservationsController } from './infrastructure/controllers/reservations.controller';
import { RestaurantsModule } from '@modules/restaurants/restaurants.module';
import { SettingsModule } from '@modules/settings/settings.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReservationOrmEntity]),
    RestaurantsModule,
    SettingsModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: ReservationRepositoryPort,
      useClass: ReservationTypeOrmRepository,
    },
    ReservationValidatorService,
    CreateReservationUseCase,
    CancelByTokenUseCase,
  ],
  controllers: [ReservationsController],
  exports: [ReservationRepositoryPort],
})
export class ReservationsModule {}
