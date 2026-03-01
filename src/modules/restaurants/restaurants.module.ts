import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantOrmEntity } from './infrastructure/persistence/restaurant.orm-entity';
import { RestaurantRepositoryPort } from './domain/ports/restaurant.repository.port';
import { RestaurantTypeOrmRepository } from './infrastructure/persistence/restaurant.typeorm.repository';
import { SettingsModule } from '@modules/settings/settings.module';
import { ListPublicRestaurantsUseCase } from '@modules/restaurants/applications/use-cases/list-public-restaurants.use-case';
import { GetPublicRestaurantUseCase } from '@modules/restaurants/applications/use-cases/get-public-restaurant.use-case';
import { RestaurantsController } from '@modules/restaurants/infrastructure/controllers/restaurants.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([RestaurantOrmEntity]),
    forwardRef(() => SettingsModule),
  ],
  providers: [
    {
      provide: RestaurantRepositoryPort,
      useClass: RestaurantTypeOrmRepository,
    },
    ListPublicRestaurantsUseCase,
    GetPublicRestaurantUseCase,
  ],
  controllers: [RestaurantsController],
  exports: [RestaurantRepositoryPort],
})
export class RestaurantsModule {}
