import { ReservationValidatorService } from '@modules/reservations/application/services/reservation-validator.service';
import { Reservation } from '@modules/reservations/domain/entities/reservation.entity';
import { ReservationStatus } from '@modules/reservations/domain/enums/reservation-status.enum';
import { PaymentStatus } from '@modules/reservations/domain/enums/payment-status.enum';
import { OpeningHours, TimeRange, } from '@modules/settings/domain/types/opening-hours.type';
import { BadRequestError } from '@shared/domain/errors/domain.errors';

const makeOpeningHours = (): OpeningHours => ({
  monday: [{ open: '13:00', close: '16:00', capacity: 20 }],
  tuesday: [{ open: '13:00', close: '16:00', capacity: 20 }],
  wednesday: [{ open: '13:00', close: '16:00', capacity: 20 }],
  thursday: [{ open: '13:00', close: '16:00', capacity: 20 }],
  friday: [
    { open: '13:00', close: '16:00', capacity: 20 },
    { open: '20:00', close: '23:00', capacity: 30 },
  ],
  saturday: [{ open: '13:00', close: '16:00', capacity: 20 }],
  sunday: [],
});

const makeReservation = (
  time: string,
  numberOfPeople: number,
  status: ReservationStatus = ReservationStatus.CONFIRMED,
): Reservation =>
  new Reservation(
    'res-id',
    'restaurant-id',
    '2026-03-02',
    time,
    numberOfPeople,
    'Mario',
    'Rivera',
    'mario@test.com',
    '+34600000001',
    null,
    status,
    0,
    PaymentStatus.PENDING,
    null,
    null,
    null,
    null,
    'token',
  );

describe('ReservationValidatorService', () => {
  let service: ReservationValidatorService;

  beforeEach(() => {
    service = new ReservationValidatorService();
  });

  // ─── validateGroupSize ────────────────────────────────────────────────────

  describe('validateGroupSize', () => {
    it('debería aceptar grupos de 1 a 9 personas', () => {
      expect(() => service.validateGroupSize(1)).not.toThrow();
      expect(() => service.validateGroupSize(9)).not.toThrow();
    });

    it('debería lanzar BadRequestError para grupos de 10 o más', () => {
      expect(() => service.validateGroupSize(10)).toThrow(BadRequestError);
      expect(() => service.validateGroupSize(20)).toThrow(BadRequestError);
    });
  });

  // ─── validateMinimumAdvanceTime ───────────────────────────────────────────

  describe('validateMinimumAdvanceTime', () => {
    it('debería aceptar una reserva con más de 30 minutos de antelación', () => {
      const future = new Date(Date.now() + 60 * 60 * 1000); // +1 hora
      const date = future.toISOString().split('T')[0];
      const time = `${String(future.getHours()).padStart(2, '0')}:${String(future.getMinutes()).padStart(2, '0')}`;

      expect(() =>
        service.validateMinimumAdvanceTime(date, time),
      ).not.toThrow();
    });

    it('debería lanzar BadRequestError si la reserva es en menos de 30 minutos', () => {
      const soon = new Date(Date.now() + 10 * 60 * 1000); // +10 min
      const date = soon.toISOString().split('T')[0];
      const time = `${String(soon.getHours()).padStart(2, '0')}:${String(soon.getMinutes()).padStart(2, '0')}`;

      expect(() => service.validateMinimumAdvanceTime(date, time)).toThrow(
        BadRequestError,
      );
    });

    it('debería lanzar BadRequestError para una hora ya pasada', () => {
      expect(() =>
        service.validateMinimumAdvanceTime('2020-01-01', '10:00'),
      ).toThrow(BadRequestError);
    });
  });

  // ─── validateOpeningHours ─────────────────────────────────────────────────

  describe('validateOpeningHours', () => {
    const hours = makeOpeningHours();

    it('debería retornar el turno correcto cuando la hora está dentro del horario', () => {
      // 2026-03-02 es lunes
      const result = service.validateOpeningHours('2026-03-02', '13:00', hours);
      expect(result).toEqual({ open: '13:00', close: '16:00', capacity: 20 });
    });

    it('debería lanzar BadRequestError si el restaurante está cerrado ese día', () => {
      // 2026-03-01 es domingo → sunday: []
      expect(() =>
        service.validateOpeningHours('2026-03-01', '13:00', hours),
      ).toThrow(BadRequestError);
    });

    it('debería lanzar BadRequestError si la hora no corresponde a ningún turno', () => {
      // lunes pero a las 18:00 (entre turnos)
      expect(() =>
        service.validateOpeningHours('2026-03-02', '18:00', hours),
      ).toThrow(BadRequestError);
    });

    it('debería lanzar BadRequestError si la hora está dentro del último slot sin tiempo mínimo de servicio', () => {
      // turno viernes tarde cierra 23:00, última reserva válida es 22:00
      // a las 22:30 ya no hay 60 min de servicio
      expect(() =>
        service.validateOpeningHours('2026-03-06', '22:30', hours),
      ).toThrow(BadRequestError);
    });

    it('debería aceptar correctamente el segundo turno del viernes', () => {
      // viernes, turno de noche 20:00-23:00 → 20:00 tiene 180 min > 60 ✓
      const result = service.validateOpeningHours('2026-03-06', '20:00', hours);
      expect(result).toEqual({ open: '20:00', close: '23:00', capacity: 30 });
    });
  });

  // ─── validateTimeSlotInterval ─────────────────────────────────────────────

  describe('validateTimeSlotInterval', () => {
    it('debería aceptar horas alineadas con el intervalo de 30 minutos', () => {
      expect(() => service.validateTimeSlotInterval('13:00', 30)).not.toThrow();
      expect(() => service.validateTimeSlotInterval('13:30', 30)).not.toThrow();
      expect(() => service.validateTimeSlotInterval('14:00', 30)).not.toThrow();
    });

    it('debería lanzar BadRequestError si la hora no está alineada con el intervalo', () => {
      expect(() => service.validateTimeSlotInterval('13:15', 30)).toThrow(
        BadRequestError,
      );
      expect(() => service.validateTimeSlotInterval('13:45', 30)).toThrow(
        BadRequestError,
      );
    });

    it('debería aceptar horas alineadas con el intervalo de 15 minutos', () => {
      expect(() => service.validateTimeSlotInterval('13:15', 15)).not.toThrow();
      expect(() => service.validateTimeSlotInterval('13:45', 15)).not.toThrow();
    });

    it('debería aceptar horas alineadas con el intervalo de 60 minutos', () => {
      expect(() => service.validateTimeSlotInterval('14:00', 60)).not.toThrow();
    });

    it('debería lanzar BadRequestError con intervalo de 60 si no es hora en punto', () => {
      expect(() => service.validateTimeSlotInterval('14:30', 60)).toThrow(
        BadRequestError,
      );
    });
  });

  // ─── validateCapacity ─────────────────────────────────────────────────────

  describe('validateCapacity', () => {
    const shift: TimeRange = { open: '13:00', close: '16:00', capacity: 10 };

    it('debería aceptar cuando hay capacidad suficiente', () => {
      const existing = [makeReservation('13:00', 3)];
      expect(() => service.validateCapacity(4, shift, existing)).not.toThrow();
    });

    it('debería aceptar exactamente hasta la capacidad máxima', () => {
      const existing = [makeReservation('13:00', 7)];
      expect(() => service.validateCapacity(3, shift, existing)).not.toThrow();
    });

    it('debería lanzar BadRequestError si se supera la capacidad', () => {
      const existing = [makeReservation('13:00', 8)];
      expect(() => service.validateCapacity(3, shift, existing)).toThrow(
        BadRequestError,
      );
    });

    it('debería ignorar reservas CANCELLED al calcular la ocupación', () => {
      const existing = [
        makeReservation('13:00', 8, ReservationStatus.CANCELLED),
      ];
      expect(() => service.validateCapacity(5, shift, existing)).not.toThrow();
    });

    it('debería ignorar reservas REJECTED al calcular la ocupación', () => {
      const existing = [
        makeReservation('13:00', 8, ReservationStatus.REJECTED),
      ];
      expect(() => service.validateCapacity(5, shift, existing)).not.toThrow();
    });

    it('debería ignorar reservas de otros turnos al calcular la ocupación', () => {
      // reserva fuera del turno 13:00-16:00
      const existing = [makeReservation('20:00', 8)];
      expect(() => service.validateCapacity(5, shift, existing)).not.toThrow();
    });

    it('debería contar correctamente múltiples reservas activas', () => {
      const existing = [
        makeReservation('13:00', 3),
        makeReservation('14:00', 3),
        makeReservation('13:30', 2, ReservationStatus.CANCELLED), // no cuenta
      ];
      // ocupados: 3 + 3 = 6, solicitados: 5 → total 11 > 10 → error
      expect(() => service.validateCapacity(5, shift, existing)).toThrow(
        BadRequestError,
      );
    });
  });
});
