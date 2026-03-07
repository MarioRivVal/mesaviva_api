import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RestaurantCategory } from '../../domain/enums/restaurant-category.enum';

@Entity('restaurants')
export class RestaurantOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  adminId: string;

  @Column()
  phone: string;

  @Column()
  address: string;

  @Column({ type: 'enum', enum: RestaurantCategory })
  category: RestaurantCategory;

  @Index()
  @Column({ unique: true })
  email: string;

  @Index()
  @Column({ unique: true })
  slug: string;

  @Column()
  imageUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
