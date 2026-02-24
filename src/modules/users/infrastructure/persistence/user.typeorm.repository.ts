import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { UserOrmEntity } from './user.orm-entity';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/enums/user-role.enum';

@Injectable()
export class UserTypeOrmRepository extends UserRepositoryPort {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly ormRepo: Repository<UserOrmEntity>,
  ) {
    super();
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.ormRepo.findOne({ where: { email } });

    return entity ? this.toDomain(entity) : null;
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.ormRepo.findOne({ where: { id } });

    return entity ? this.toDomain(entity) : null;
  }

  async findAllRestaurantAdmins(): Promise<User[]> {
    const entities = await this.ormRepo.find({
      where: { role: UserRole.RESTAURANT_ADMIN },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  async save(user: User): Promise<User> {
    const entity = this.toEntity(user);
    const saved = await this.ormRepo.save(entity);

    return this.toDomain(saved);
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    const entity = await this.ormRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();

    return entity ? this.toDomain(entity) : null;
  }

  async delete(id: string): Promise<void> {
    await this.ormRepo.delete(id);
  }

  private toDomain(entity: UserOrmEntity): User {
    return new User(
      entity.id,
      entity.firstName,
      entity.lastName,
      entity.phone,
      entity.email,
      entity.passwordHash,
      entity.role,
      entity.mustChangePassword,
      entity.isActive,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  private toEntity(user: User): UserOrmEntity {
    const entity = new UserOrmEntity();
    entity.id = user.id;
    entity.email = user.email;
    entity.passwordHash = user.passwordHash;
    entity.role = user.role;
    entity.mustChangePassword = user.mustChangePassword;
    entity.isActive = user.isActive;
    entity.firstName = user.firstName;
    entity.lastName = user.lastName;
    entity.phone = user.phone;
    return entity;
  }
}
