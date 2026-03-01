import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingsRepositoryPort } from '@modules/settings/domain/ports/settings.repository.port';
import { Settings } from '@modules/settings/domain/entities/settings.entity';
import { SettingsOrmEntity } from './settings.orm-entity';

@Injectable()
export class SettingsTypeOrmRepository extends SettingsRepositoryPort {
  constructor(
    @InjectRepository(SettingsOrmEntity)
    private readonly ormRepo: Repository<SettingsOrmEntity>,
  ) {
    super();
  }

  async findByRestaurantId(restaurantId: string): Promise<Settings | null> {
    const entity = await this.ormRepo.findOne({ where: { restaurantId } });
    return entity ? this.toDomain(entity) : null;
  }

  async save(settings: Settings): Promise<Settings> {
    const entity = this.toEntity(settings);
    const saved = await this.ormRepo.save(entity);
    return this.toDomain(saved);
  }

  private toDomain(entity: SettingsOrmEntity): Settings {
    return new Settings(
      entity.id,
      entity.restaurantId,
      entity.openingHours,
      entity.timeSlotInterval,
      Number(entity.depositAmount),
      entity.acceptanceMode,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  private toEntity(settings: Settings): SettingsOrmEntity {
    const entity = new SettingsOrmEntity();
    entity.id = settings.id;
    entity.restaurantId = settings.restaurantId;
    entity.openingHours = settings.openingHours;
    entity.timeSlotInterval = settings.timeSlotInterval;
    entity.depositAmount = settings.depositAmount;
    entity.acceptanceMode = settings.acceptanceMode;
    return entity;
  }
}
