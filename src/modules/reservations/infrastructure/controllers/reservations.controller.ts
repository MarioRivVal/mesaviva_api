import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from '@shared/infrastructure/decorators/auth.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';
import { User } from '@modules/users/domain/entities/user.entity';
import { CreateReservationUseCase } from '../../application/use-cases/create-reservation.use-case';
import { CancelByTokenUseCase } from '../../application/use-cases/cancel-by-token.use-case';
import { CancelReservationUseCase } from '../../application/use-cases/cancel-reservation.use-case';
import { GetReservationsUseCase } from '../../application/use-cases/get-reservations.use-case';
import { ConfirmReservationUseCase } from '../../application/use-cases/confirm-reservation.use-case';
import { RejectReservationUseCase } from '../../application/use-cases/reject-reservation.use-case';
import { CreateReservationHttpDto } from './dtos/create-reservation.http-dto';
import { RejectReservationHttpDto } from './dtos/reject-reservation.http-dto';
import { GetReservationsQueryDto } from './dtos/get-reservations-query.http-dto';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly createReservationUseCase: CreateReservationUseCase,
    private readonly cancelByTokenUseCase: CancelByTokenUseCase,
    private readonly cancelReservationUseCase: CancelReservationUseCase,
    private readonly getReservationsUseCase: GetReservationsUseCase,
    private readonly confirmReservationUseCase: ConfirmReservationUseCase,
    private readonly rejectReservationUseCase: RejectReservationUseCase,
  ) {}

  // ─── Público ──────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateReservationHttpDto) {
    return this.createReservationUseCase.execute(body);
  }

  @Delete('cancel/:token')
  @HttpCode(HttpStatus.OK)
  async cancelByToken(@Param('token') token: string) {
    return this.cancelByTokenUseCase.execute({ token });
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  @Get()
  @Auth(UserRole.SUPERADMIN, UserRole.RESTAURANT_ADMIN)
  async getReservations(
    @Query() query: GetReservationsQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.getReservationsUseCase.execute({
      restaurantId: query.restaurantId,
      currentUser: user,
      filters: {
        status: query.status,
        date: query.date,
        startDate: query.startDate,
        endDate: query.endDate,
      },
    });
  }

  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @Auth(UserRole.SUPERADMIN, UserRole.RESTAURANT_ADMIN)
  async confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.confirmReservationUseCase.execute({
      reservationId: id,
      currentUser: user,
    });
    return { message: 'Reservation confirmed successfully' };
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Auth(UserRole.SUPERADMIN, UserRole.RESTAURANT_ADMIN)
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RejectReservationHttpDto,
    @CurrentUser() user: User,
  ) {
    await this.rejectReservationUseCase.execute({
      reservationId: id,
      reason: body.reason,
      currentUser: user,
    });
    return { message: 'Reservation rejected' };
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Auth(UserRole.SUPERADMIN, UserRole.RESTAURANT_ADMIN)
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.cancelReservationUseCase.execute({
      reservationId: id,
      currentUser: user,
    });
    return { message: 'Reservation cancelled successfully' };
  }
}
