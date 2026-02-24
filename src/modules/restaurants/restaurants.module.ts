import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantOrmEntity } from './infrastructure/persistence/restaurant.orm-entity';
import { RestaurantRepositoryPort } from './domain/ports/restaurant.repository.port';
import { RestaurantTypeOrmRepository } from './infrastructure/persistence/restaurant.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RestaurantOrmEntity])],
  providers: [
    {
      provide: RestaurantRepositoryPort,
      useClass: RestaurantTypeOrmRepository,
    },
  ],
  exports: [RestaurantRepositoryPort],
})
export class RestaurantsModule {}
