import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReservationStatus } from '@modules/reservations/domain/enums/reservation-status.enum';
import { PaymentStatus } from '@modules/reservations/domain/enums/payment-status.enum';

@Entity('reservations')
export class ReservationOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  restaurantId: string;

  @Column({ type: 'date' })
  date: string;

  @Column()
  time: string;

  @Column()
  numberOfPeople: number;

  @Column()
  customerName: string;

  @Column()
  customerLastName: string;

  @Column()
  customerEmail: string;

  @Column()
  customerPhone: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  depositAmount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'varchar', nullable: true })
  paymentId: string | null;

  @Column({ type: 'varchar', nullable: true })
  paymentMethod: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  paymentDeadline: Date | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @Index()
  @Column({ unique: true })
  cancellationToken: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
