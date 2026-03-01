import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CreateReservationUseCase } from '../../application/use-cases/create-reservation.use-case';
import { CancelByTokenUseCase } from '../../application/use-cases/cancel-by-token.use-case';
import { CreateReservationHttpDto } from './dtos/create-reservation.http-dto';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly createReservationUseCase: CreateReservationUseCase,
    private readonly cancelByTokenUseCase: CancelByTokenUseCase,
  ) {}

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
}
