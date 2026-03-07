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
import { CancelReservationUseCase } from '@modules/reservations/application/use-cases/cancel-reservation.use-case';
import { GetReservationsUseCase } from '@modules/reservations/application/use-cases/get-reservations.use-case';
import { ConfirmReservationUseCase } from '@modules/reservations/application/use-cases/confirm-reservation.use-case';
import { RejectReservationUseCase } from '@modules/reservations/application/use-cases/reject-reservation.use-case';
import { ReservationAccessService } from '@modules/reservations/application/services/reservation-access.service';

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
    ReservationAccessService,
    CreateReservationUseCase,
    CancelByTokenUseCase,
    CancelReservationUseCase,
    GetReservationsUseCase,
    ConfirmReservationUseCase,
    RejectReservationUseCase,
  ],
  controllers: [ReservationsController],
  exports: [ReservationRepositoryPort],
})
export class ReservationsModule {}
