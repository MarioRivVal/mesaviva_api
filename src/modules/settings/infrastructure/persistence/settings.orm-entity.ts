import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AcceptanceMode } from '@modules/settings/domain/enums/acceptance-mode.enum';
import type { OpeningHours } from '@modules/settings/domain/types/opening-hours.type';
import * as timeSlotIntervalConst from '@modules/settings/domain/constants/time-slot-interval.const';

@Entity('settings')
export class SettingsOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  restaurantId: string;

  @Column({ type: 'jsonb' })
  openingHours: OpeningHours;

  @Column({ type: 'smallint', enum: timeSlotIntervalConst.TIME_SLOT_INTERVALS })
  timeSlotInterval: timeSlotIntervalConst.TimeSlotInterval;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  depositAmount: number;

  @Column({ type: 'enum', enum: AcceptanceMode, default: AcceptanceMode.AUTO })
  acceptanceMode: AcceptanceMode;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
