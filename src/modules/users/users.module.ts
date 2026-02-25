import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from './infrastructure/persistence/user.orm-entity';
import { UserRepositoryPort } from './domain/ports/user.repository.port';
import { UserTypeOrmRepository } from './infrastructure/persistence/user.typeorm.repository';
import { CreateRestaurantAdminUseCase } from './application/use-cases/create-restaurant-admin.use-case';
import { UsersController } from './infrastructure/controllers/users.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { SharedModule } from '@shared/shared.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity]),
    RestaurantsModule,
    NotificationsModule,
    SharedModule,
  ],
  providers: [
    {
      provide: UserRepositoryPort,
      useClass: UserTypeOrmRepository,
    },
    CreateRestaurantAdminUseCase,
  ],
  controllers: [UsersController],
})
export class UsersModule {}
