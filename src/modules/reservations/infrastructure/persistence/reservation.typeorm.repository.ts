import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReservationRepositoryPort } from '@modules/reservations/domain/ports/reservation.repository.port';
import { Reservation } from '@modules/reservations/domain/entities/reservation.entity';
import { ReservationOrmEntity } from './reservation.orm-entity';
import { ReservationFilters } from '@modules/reservations/domain/types/reservation-filter.type';
import { PaymentStatus } from '@modules/reservations/domain/enums/payment-status.enum';

@Injectable()
export class ReservationTypeOrmRepository extends ReservationRepositoryPort {
  constructor(
    @InjectRepository(ReservationOrmEntity)
    private readonly ormRepo: Repository<ReservationOrmEntity>,
  ) {
    super();
  }

  async findById(id: string): Promise<Reservation | null> {
    const entity = await this.ormRepo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByToken(token: string): Promise<Reservation | null> {
    const entity = await this.ormRepo.findOne({
      where: { cancellationToken: token },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByRestaurantAndFilters(
    restaurantId: string,
    filters: ReservationFilters,
  ): Promise<Reservation[]> {
    const query = this.ormRepo
      .createQueryBuilder('reservation')
      .where('reservation.restaurantId = :restaurantId', { restaurantId });

    if (filters.status) {
      query.andWhere('reservation.status = :status', {
        status: filters.status,
      });
    }
    if (filters.date) {
      query.andWhere('reservation.date = :date', { date: filters.date });
    }
    if (filters.startDate && filters.endDate) {
      query.andWhere('reservation.date BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    query
      .orderBy('reservation.date', 'DESC')
      .addOrderBy('reservation.time', 'ASC');

    return (await query.getMany()).map((e) => this.toDomain(e));
  }

  async save(reservation: Reservation): Promise<Reservation> {
    const entity = this.toEntity(reservation);
    const saved = await this.ormRepo.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.ormRepo.delete({ id });
  }

  private toDomain(entity: ReservationOrmEntity): Reservation {
    return new Reservation(
      entity.id,
      entity.restaurantId,
      entity.date,
      entity.time,
      entity.numberOfPeople,
      entity.customerName,
      entity.customerLastName,
      entity.customerEmail,
      entity.customerPhone,
      entity.notes,
      entity.status,
      Number(entity.depositAmount),
      entity.paymentStatus,
      entity.paymentId,
      entity.paymentMethod,
      entity.paymentDeadline,
      entity.rejectionReason,
      entity.cancellationToken,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  private toEntity(reservation: Reservation): ReservationOrmEntity {
    const entity = new ReservationOrmEntity();
    entity.id = reservation.id;
    entity.restaurantId = reservation.restaurantId;
    entity.date = reservation.date;
    entity.time = reservation.time;
    entity.numberOfPeople = reservation.numberOfPeople;
    entity.customerName = reservation.customerName;
    entity.customerLastName = reservation.customerLastName;
    entity.customerEmail = reservation.customerEmail;
    entity.customerPhone = reservation.customerPhone;
    entity.notes = reservation.notes;
    entity.status = reservation.status;
    entity.depositAmount = reservation.depositAmount;
    entity.paymentStatus = reservation.paymentStatus ?? PaymentStatus.PENDING;
    entity.paymentId = reservation.paymentId;
    entity.paymentMethod = reservation.paymentMethod;
    entity.paymentDeadline = reservation.paymentDeadline;
    entity.rejectionReason = reservation.rejectionReason;
    entity.cancellationToken = reservation.cancellationToken;
    return entity;
  }
}
