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
│   │   ├── reservation-validator.service.ts   # Validaciones de reglas de negocio
│   │   └── reservation-access.service.ts      # Autorización: ownership + resolución
│   └── use-cases/
│       ├── create-reservation.use-case.ts     # Crear reserva + emails
│       ├── cancel-by-token.use-case.ts        # Cancelar sin login (token público)
│       ├── get-reservations.use-case.ts       # Listar reservas con filtros (admin)
│       ├── confirm-reservation.use-case.ts    # Admin confirma reserva PENDING
│       ├── reject-reservation.use-case.ts     # Admin rechaza reserva PENDING
│       └── cancel-reservation.use-case.ts     # Admin cancela reserva
├── infrastructure/
│   ├── controllers/
│   │   ├── dtos/
│   │   │   ├── create-reservation.http-dto.ts
│   │   │   ├── reject-reservation.http-dto.ts
│   │   │   └── get-reservations-query.http-dto.ts
│   │   └── reservations.controller.ts
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

## `ReservationAccessService`

Servicio de aplicación compartido por los use cases de admin.
Centraliza la resolución de la reserva + restaurante y la verificación de ownership.

```typescript
async resolveAndAuthorize(
    reservationId: string,
    currentUser: User,
): Promise<{ reservation: Reservation; restaurant: Restaurant }>
```

**Flujo:**

1. Busca la reserva por ID → `NotFoundError` si no existe
2. Busca el restaurante de la reserva → `NotFoundError` si no existe
3. Si el usuario es `RESTAURANT_ADMIN` y no es el dueño del restaurante → `ForbiddenError`
4. Devuelve `{ reservation, restaurant }`

> Todos los use cases de admin (`ConfirmReservationUseCase`, `RejectReservationUseCase`,
> `CancelReservationUseCase`) lo usan para evitar duplicar esta lógica.

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

### `GetReservationsUseCase`

Lista las reservas de un restaurante con filtros opcionales.

**Dependencias:**

- `ReservationRepositoryPort`
- `RestaurantRepositoryPort`

**Flujo:**

```
1. Buscar restaurante → 404 si no existe
2. Verificar isActive → 400 si no
3. Llamar al repositorio con los filtros → reserva por defecto: todos los estados, hoy
4. Devolver reservas
```

### `ConfirmReservationUseCase`

Permite al administrador confirmar una reserva en estado `PENDING`.
Usa `ReservationAccessService` para resolver la reserva y verificar el ownership.

**Dependencias:**

- `ReservationRepositoryPort`
- `RestaurantRepositoryPort`
- `EmailServicePort`
- `ReservationAccessService`

**Flujo:**

```
1. resolveAndAuthorize(reservationId, currentUser) → 404 / 403 si falla
2. reservation.accept() → 400 si no está en PENDING
3. Persistir
4. Email de confirmación al comensal (sendReservationAccepted)
```

### `RejectReservationUseCase`

Permite al administrador rechazar una reserva en estado `PENDING`
proporcionando un motivo que se guarda en `rejectionReason`.

**Dependencias:**

- `ReservationRepositoryPort`
- `RestaurantRepositoryPort`
- `EmailServicePort`
- `ReservationAccessService`

**Flujo:**

```
1. resolveAndAuthorize(reservationId, currentUser) → 404 / 403 si falla
2. reservation.reject(reason) → 400 si no está en PENDING
3. Persistir (guarda rejectionReason en BD)
4. Email de rechazo al comensal con el motivo (sendReservationRejected)
```

### `CancelReservationUseCase`

Permite al administrador cancelar una reserva (`PENDING` o `CONFIRMED`).
Distinto de `CancelByTokenUseCase`: este requiere autenticación.

**Dependencias:**

- `ReservationRepositoryPort`
- `RestaurantRepositoryPort`
- `EmailServicePort`
- `ReservationAccessService`

**Flujo:**

```
1. resolveAndAuthorize(reservationId, currentUser) → 404 / 403 si falla
2. reservation.cancel() → 400 si no está en PENDING o CONFIRMED
3. Persistir
4. Email de cancelación al comensal (sendReservationCancelled)
```

### `GetReservationsUseCase`

Lista las reservas de un restaurante con filtros opcionales.

**Dependencias:**

- `ReservationRepositoryPort`
- `RestaurantRepositoryPort`

**Flujo:**

```
1. Buscar restaurante → 404 si no existe
2. Si RESTAURANT_ADMIN: verificar que es el dueño → 403 si no
3. Si SUPERADMIN: puede ver cualquier restaurante
4. Llamar findByRestaurantAndFilters con los filtros opcionales
5. Devolver array (vacío si no hay reservas)
```

---

## Endpoints implementados

| Método   | Ruta                          | Use Case                    | Auth                            |
|----------|-------------------------------|-----------------------------|---------------------------------|
| `POST`   | `/reservations`               | `CreateReservationUseCase`  | ❌ Público                       |
| `DELETE` | `/reservations/cancel/:token` | `CancelByTokenUseCase`      | ❌ Público                       |
| `GET`    | `/reservations`               | `GetReservationsUseCase`    | `RESTAURANT_ADMIN` `SUPERADMIN` |
| `PATCH`  | `/reservations/:id/confirm`   | `ConfirmReservationUseCase` | `RESTAURANT_ADMIN` `SUPERADMIN` |
| `PATCH`  | `/reservations/:id/reject`    | `RejectReservationUseCase`  | `RESTAURANT_ADMIN` `SUPERADMIN` |
| `PATCH`  | `/reservations/:id/cancel`    | `CancelReservationUseCase`  | `RESTAURANT_ADMIN` `SUPERADMIN` |

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

| Archivo                                 | Tests | Casos cubiertos                                                                                 |
|-----------------------------------------|-------|-------------------------------------------------------------------------------------------------|
| `create-reservation.use-case.spec.ts`   | 8     | AUTO/MANUAL, restaurante inexistente/inactivo, sin settings, validadores, emails                |
| `cancel-by-token.use-case.spec.ts`      | 8     | Cancelar CONFIRMED/PENDING, token inválido, sin restaurante, estados no cancelables, emails     |
| `cancel-reservation.use-case.spec.ts`   | 7     | Cancelar CONFIRMED/PENDING, ya cancelada, rechazada, no existe, forbidden, email                |
| `confirm-reservation.use-case.spec.ts`  | 7     | Confirmar PENDING, ya confirmada, cancelada, no existe, forbidden, notas con/sin email          |
| `reject-reservation.use-case.spec.ts`   | 7     | Rechazar PENDING, ya confirmada, ya rechazada, cancelada, no existe, forbidden, motivo          |
| `get-reservations.use-case.spec.ts`     | 6     | OK propietario, restaurante no existe, forbidden, superadmin libre, lista vacía, filtros        |
| `reservation-validator.service.spec.ts` | 21    | Grupo (9/10), antelación, horario (día cerrado, hora fuera, último slot), intervalos, capacidad |

---

## Siguientes pasos

- [API — Reservations](../04-api/reservations.md)
- [Despliegue](../06-deployment.md)

