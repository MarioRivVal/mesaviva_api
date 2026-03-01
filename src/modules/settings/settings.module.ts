import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsOrmEntity } from './infrastructure/persistence/settings.orm-entity';
import { SettingsRepositoryPort } from './domain/ports/settings.repository.port';
import { SettingsTypeOrmRepository } from './infrastructure/persistence/settings.typeorm.repository';
import { GetSettingsUseCase } from './application/use-cases/get-settings.use-case';
import { UpdateSettingsUseCase } from './application/use-cases/update-settings.use-case';
import { SettingsController } from './infrastructure/controllers/settings.controller';
import { RestaurantsModule } from '@modules/restaurants/restaurants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SettingsOrmEntity]),
    forwardRef(() => RestaurantsModule),
  ],
  providers: [
    {
      provide: SettingsRepositoryPort,
      useClass: SettingsTypeOrmRepository,
    },
    GetSettingsUseCase,
    UpdateSettingsUseCase,
  ],
  controllers: [SettingsController],
  exports: [SettingsRepositoryPort],
})
export class SettingsModule {}
