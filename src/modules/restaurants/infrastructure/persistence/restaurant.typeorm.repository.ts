import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RestaurantRepositoryPort } from '../../domain/ports/restaurant.repository.port';
import { RestaurantOrmEntity } from './restaurant.orm-entity';
import { Restaurant } from '../../domain/entities/restaurant.entity';

@Injectable()
export class RestaurantTypeOrmRepository extends RestaurantRepositoryPort {
  constructor(
    @InjectRepository(RestaurantOrmEntity)
    private readonly ormRepo: Repository<RestaurantOrmEntity>,
  ) {
    super();
  }

  async findById(id: string): Promise<Restaurant | null> {
    const entity = await this.ormRepo.findOne({ where: { id } });

    return entity ? this.toDomain(entity) : null;
  }

  async findAllByOwnerId(id: string): Promise<Restaurant[]> {
    const entities = await this.ormRepo.find({
      where: { adminId: id },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  async findBySlug(slug: string): Promise<Restaurant | null> {
    const entity = await this.ormRepo.findOne({ where: { slug } });

    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Restaurant[]> {
    const entities = await this.ormRepo.find({
      order: { name: 'ASC' },
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  async save(restaurant: Restaurant): Promise<Restaurant> {
    const entity = this.toEntity(restaurant);
    const saved = await this.ormRepo.save(entity);

    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.ormRepo.delete(id);
  }

  private toDomain(entity: RestaurantOrmEntity): Restaurant {
    return new Restaurant(
      entity.id,
      entity.name,
      entity.adminId,
      entity.phone,
      entity.address,
      entity.category,
      entity.email,
      entity.slug,
      entity.imageUrl,
      entity.isActive,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  private toEntity(restaurant: Restaurant): RestaurantOrmEntity {
    const entity = new RestaurantOrmEntity();
    entity.id = restaurant.id;
    entity.name = restaurant.name;
    entity.adminId = restaurant.adminId;
    entity.phone = restaurant.phone;
    entity.address = restaurant.address;
    entity.category = restaurant.category;
    entity.email = restaurant.email;
    entity.imageUrl = restaurant.imageUrl;
    entity.slug = restaurant.slug;
    entity.isActive = restaurant.isActive;

    return entity;
  }
}
