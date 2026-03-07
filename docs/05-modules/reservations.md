# Módulo Reservations

Módulo central del negocio. Gestiona el ciclo de vida completo
de las reservas: creación pública, validación de reglas de negocio,
notificaciones por email y cancelación mediante token.

---

## Estructura

```
reservations/
├── domain/
│   ├── entities/
│   │   └── reservation.entity.ts              # Entidad con métodos de transición
│   ├── enums/
│   │   ├── reservation-status.enum.ts         # PENDING | CONFIRMED | REJECTED | CANCELLED | PENDING_PAYMENT
│   │   ├── payment-status.enum.ts             # PENDING | PAID | REFUNDED | FAILED
│   │   └── payment-method.enum.ts             # Para H3
│   ├── ports/
│   │   └── reservation.repository.port.ts     # Contrato del repositorio
│   └── types/
│       └── reservation-filter.type.ts         # Filtros para queries
├── application/
│   ├── dtos/
│   │   └── reservation.dto.ts                 # Tipos de entrada/salida
│   ├── services/
│   │   └── reservation-validator.service.ts   # Validaciones de reglas de negocio
│   └── use-cases/
│       ├── create-reservation.use-case.ts     # Crear reserva + emails
│       └── cancel-by-token.use-case.ts        # Cancelar sin login
├── infrastructure/
│   ├── controllers/
│   │   ├── dtos/
│   │   │   └── create-reservation.http-dto.ts # Validación HTTP del body
│   │   └── reservations.controller.ts         # POST y DELETE endpoints
│   └── persistence/
│       ├── reservation.orm-entity.ts          # Entidad TypeORM
│       └── reservation.typeorm.repository.ts  # QueryBuilder para filtros
└── reservations.module.ts
```

---

## Entidad de dominio: `Reservation`

```typescript
class Reservation {
    readonly id: string;
    readonly restaurantId: string;
    date: string;                    // YYYY-MM-DD
    time: string;                    // HH:mm
    numberOfPeople: number;
    readonly customerName: string;
    readonly customerLastName: string;
    readonly customerEmail: string;
    readonly customerPhone: string;
    notes: string | null;
    status: ReservationStatus;
    readonly depositAmount: number;
    paymentStatus: PaymentStatus;
    paymentId: string | null;
    paymentMethod: string | null;
    paymentDeadline: Date | null;
    rejectionReason: string | null;
    readonly cancellationToken: string;  // UUID único
    readonly createdAt?: Date;
    readonly updatedAt?: Date;

    static create(params): Reservation

    accept(): void

    reject(reason: string): void

    cancel(): void
}
```

### Métodos de transición de estado

| Método     | Estado inicial requerido | Estado final | Error si no cumple |
|------------|--------------------------|--------------|--------------------|
| `accept()` | `PENDING`                | `CONFIRMED`  | `BadRequestError`  |
| `reject()` | `PENDING`                | `REJECTED`   | `BadRequestError`  |
| `cancel()` | `PENDING` o `CONFIRMED`  | `CANCELLED`  | `BadRequestError`  |

---

## Port: `ReservationRepositoryPort`

```typescript
abstract class ReservationRepositoryPort {
    abstract findById(id: string): Promise<Reservation | null>;

    abstract findByToken(token: string): Promise<Reservation | null>;

    abstract findByRestaurantAndFilters(
        restaurantId: string,
        filters: ReservationFilters,
    ): Promise<Reservation[]>;

    abstract save(reservation: Reservation): Promise<Reservation>;

    abstract delete(id: string): Promise<void>;
}
```

### `ReservationFilters`

```typescript
interface ReservationFilters {
    status?: ReservationStatus;
    date?: string;        // filtro exacto YYYY-MM-DD
    startDate?: string;   // rango de fechas
    endDate?: string;
}
```

---

## `ReservationValidatorService`

Servicio de aplicación que encapsula todas las reglas de negocio
de validación. Se inyecta en `CreateReservationUseCase`.

| Método                                     | Regla que valida                                               |
|--------------------------------------------|----------------------------------------------------------------|
| `validateGroupSize(n)`                     | Máximo 9 personas online. ≥10 → `BadRequestError`              |
| `validateMinimumAdvanceTime(date, time)`   | Mínimo 30 min de antelación → `BadRequestError`                |
| `validateOpeningHours(date, time, hours)`  | La hora debe estar en un turno activo. Devuelve el `TimeRange` |
| `validateTimeSlotInterval(time, interval)` | La hora debe ser múltiplo del intervalo                        |
| `validateCapacity(n, shift, reservations)` | Suma de reservas activas en el turno no supera la capacidad    |

> **Nota de diseño:** El servicio recibe el array de reservas ya cargado
> (`findByRestaurantAndFilters` por fecha) y filtra en memoria por turno.
> Evita múltiples queries a la BD.

---

## Use Cases

### `CreateReservationUseCase`

Orquesta la creación completa de una reserva.

**Dependencias inyectadas:**

- `ReservationRepositoryPort`
- `RestaurantRepositoryPort`
- `SettingsRepositoryPort`
- `EmailServicePort`
- `ReservationValidatorService`

**Flujo completo:**

```
1. Buscar restaurante → 404 si no existe
2. Verificar isActive → 400 si no
3. Buscar settings → 404 si no configurado
4. Cargar reservas del día (para validar capacidad)
5. Validar grupo, antelación, horario, intervalo y capacidad
6. Determinar estado: AUTO → CONFIRMED, MANUAL → PENDING
7. Crear Reservation con cancellationToken = crypto.randomUUID()
8. Persistir
9. Email al admin del restaurante
10. Email de confirmación o pendiente al comensal
11. Devolver resultado con cancellationToken
```

### `CancelByTokenUseCase`

Cancela una reserva usando el `cancellationToken` público.
No requiere autenticación.

**Flujo:**

```
1. Buscar reserva por token → 404 si inválido
2. Buscar restaurante → 404 si no existe (integridad)
3. Llamar reservation.cancel() → 400 si estado no cancelable
4. Persistir
5. Email de cancelación al comensal
```

---

## Persistencia

`findByRestaurantAndFilters` usa `QueryBuilder` con filtros opcionales:

- `status` exacto
- `date` exacta
- Rango `startDate`/`endDate`

Resultados ordenados por `date DESC`, `time ASC`.

`cancellationToken` tiene índice `UNIQUE` en la base de datos para
garantizar que el `findByToken` sea rápido y no haya colisiones.

---

## Tests

| Archivo                                 | Cobertura                                                                                       |
|-----------------------------------------|-------------------------------------------------------------------------------------------------|
| `create-reservation.use-case.spec.ts`   | AUTO/MANUAL, restaurante inexistente/inactivo, sin settings, validadores, emails                |
| `cancel-by-token.use-case.spec.ts`      | Cancelar CONFIRMED/PENDING, token inválido, sin restaurante, estados no cancelables, emails     |
| `reservation-validator.service.spec.ts` | Grupo (9/10), antelación, horario (día cerrado, hora fuera, último slot), intervalos, capacidad |

---

## Siguientes pasos

- [API — Reservations](../04-api/reservations.md)
- [Despliegue](../06-deployment.md)

