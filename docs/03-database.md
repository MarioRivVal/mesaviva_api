# Base de datos

MesaViva utiliza **PostgreSQL 16** como base de datos relacional,
accedida mediante **TypeORM** con el patrón Repository.

---

## Configuración

| Parámetro   | Desarrollo      | Producción            |
|-------------|-----------------|-----------------------|
| Puerto      | `5434`          | Variable de entorno   |
| Synchronize | `true`          | `false` (migraciones) |
| Logging     | `error`, `warn` | `error`               |
| Timezone    | `UTC`           | `UTC`                 |

> ⚠️ `synchronize: true` crea y modifica tablas automáticamente en desarrollo.
> En producción se desactiva y se usan migraciones para controlar los cambios de esquema.

---

## Convenciones

| Elemento            | Convención             | Ejemplo                          |
|---------------------|------------------------|----------------------------------|
| Nombres de tablas   | snake_case plural      | `users`, `restaurants`           |
| Nombres de columnas | camelCase              | `firstName`, `isActive`          |
| Primary keys        | UUID v4                | `gen_random_uuid()`              |
| Timestamps          | `timestamptz` (UTC)    | `createdAt`, `updatedAt`         |
| Enums               | PostgreSQL native enum | `UserRole`, `RestaurantCategory` |

---

## Entidades

### `users`

Almacena los administradores de la plataforma. Los comensales no tienen
cuenta — sus datos se guardan directamente en la reserva.

| Columna              | Tipo          | Restricciones           | Descripción                                  |
|----------------------|---------------|-------------------------|----------------------------------------------|
| `id`                 | `uuid`        | PK                      | Identificador único                          |
| `firstName`          | `varchar`     | NOT NULL                | Nombre                                       |
| `lastName`           | `varchar`     | NOT NULL                | Apellidos                                    |
| `phone`              | `varchar`     | NOT NULL                | Teléfono de contacto                         |
| `email`              | `varchar`     | NOT NULL, UNIQUE        | Email de acceso                              |
| `passwordHash`       | `varchar`     | NOT NULL, select: false | Hash bcrypt de la contraseña                 |
| `role`               | `enum`        | NOT NULL                | `SUPERADMIN` \| `RESTAURANT_ADMIN` \| `USER` |
| `mustChangePassword` | `boolean`     | DEFAULT true            | Fuerza cambio en primer login                |
| `isActive`           | `boolean`     | DEFAULT true            | Cuenta activa/desactivada                    |
| `createdAt`          | `timestamptz` | AUTO                    | Fecha de creación                            |
| `updatedAt`          | `timestamptz` | AUTO                    | Fecha de última modificación                 |

**Índices:**

- `email` — UNIQUE (búsqueda frecuente en login y validaciones)

**Notas:**

- `passwordHash` tiene `select: false` — nunca se devuelve en queries normales.
  Para obtenerlo se usa `findByEmailWithPassword()` con `QueryBuilder`.
- El rol `USER` está reservado para la v3 del producto (programa de fidelización).

---

### `restaurants`

Cada restaurante pertenece a un `RESTAURANT_ADMIN`.
Un admin puede gestionar múltiples restaurantes.

| Columna     | Tipo          | Restricciones    | Descripción                      |
|-------------|---------------|------------------|----------------------------------|
| `id`        | `uuid`        | PK               | Identificador único              |
| `name`      | `varchar`     | NOT NULL         | Nombre del restaurante           |
| `slug`      | `varchar`     | NOT NULL, UNIQUE | URL-friendly del nombre          |
| `adminId`   | `uuid`        | NOT NULL         | ID del administrador responsable |
| `phone`     | `varchar`     | NOT NULL         | Teléfono de contacto             |
| `address`   | `varchar`     | NOT NULL         | Dirección física                 |
| `category`  | `enum`        | NOT NULL         | Tipo de establecimiento          |
| `email`     | `varchar`     | NOT NULL         | Email del establecimiento        |
| `imageUrl`  | `varchar`     | NOT NULL         | URL de imagen en Cloudinary      |
| `isActive`  | `boolean`     | DEFAULT true     | Restaurante activo/inactivo      |
| `createdAt` | `timestamptz` | AUTO             | Fecha de creación                |
| `updatedAt` | `timestamptz` | AUTO             | Fecha de última modificación     |

**Índices:**

- `slug` — UNIQUE (rutas públicas `/restaurantes/:slug`)
- `email` — UNIQUE (un email por establecimiento)

**Enum `RestaurantCategory`:**

| Valor        | Descripción |
|--------------|-------------|
| `RESTAURANT` | Restaurante |
| `BAR`        | Bar         |
| `BREWERY`    | Cervecería  |
| `TEA_HOUSE`  | Casa de té  |

**Notas:**

- `adminId` es una foreign key lógica (sin constraint TypeORM) hacia `users.id`.
  Se mantiene así para respetar los principios de la arquitectura hexagonal
  — cada módulo es responsable de sus propios datos.
- El `slug` se genera automáticamente desde el nombre del restaurante
  al momento de su creación. Si existe colisión, se añade un sufijo numérico
  (`el-rincon-asturiano-2`).

---

### `settings`

Configuración operativa de cada restaurante.

| Columna            | Tipo          | Restricciones    | Descripción                                     |
|--------------------|---------------|------------------|-------------------------------------------------|
| `id`               | `uuid`        | PK               | Identificador único                             |
| `restaurantId`     | `uuid`        | NOT NULL, UNIQUE | FK lógica hacia `restaurants` (1 a 1)           |
| `openingHours`     | `jsonb`       | NOT NULL         | Horarios por día y turno (ver estructura abajo) |
| `timeSlotInterval` | `smallint`    | NOT NULL         | Intervalo de reservas: `15`, `30` o `60` min    |
| `depositAmount`    | `decimal`     | DEFAULT 0        | Importe del depósito en euros                   |
| `acceptanceMode`   | `enum`        | DEFAULT AUTO     | `AUTO` \| `MANUAL`                              |
| `createdAt`        | `timestamptz` | AUTO             | Fecha de creación                               |
| `updatedAt`        | `timestamptz` | AUTO             | Fecha de última modificación                    |

**Estructura del campo `openingHours` (JSONB):**

```json
{
  "monday": [],
  "tuesday": [],
  "wednesday": [
    {
      "open": "13:00",
      "close": "16:00",
      "capacity": 40
    }
  ],
  "thursday": [
    {
      "open": "13:00",
      "close": "16:00",
      "capacity": 40
    }
  ],
  "friday": [
    {
      "open": "13:00",
      "close": "16:00",
      "capacity": 40
    },
    {
      "open": "20:00",
      "close": "23:00",
      "capacity": 50
    }
  ],
  "saturday": [
    {
      "open": "13:00",
      "close": "16:30",
      "capacity": 50
    }
  ],
  "sunday": [
    {
      "open": "13:00",
      "close": "16:30",
      "capacity": 50
    }
  ]
}
```

> Un array vacío para un día indica que el restaurante está cerrado ese día.
> El uso de JSONB permite múltiples turnos por día (comida + cena) sin tablas adicionales.

**Notas:**

- `restaurantId` tiene restricción UNIQUE — un restaurante tiene exactamente una configuración
- `depositAmount` se almacena como `decimal` pero TypeORM lo devuelve como `string` en PostgreSQL.
  El repositorio hace el cast a `number` en `toDomain()` para evitar bugs aritméticos silenciosos

---

### `reservations`

Reservas realizadas por comensales. No requieren cuenta de usuario.

| Columna             | Tipo          | Restricciones    | Descripción                                 |
|---------------------|---------------|------------------|---------------------------------------------|
| `id`                | `uuid`        | PK               | Identificador único                         |
| `restaurantId`      | `uuid`        | NOT NULL         | FK lógica hacia `restaurants`               |
| `date`              | `date`        | NOT NULL         | Fecha de la reserva (`YYYY-MM-DD`)          |
| `time`              | `varchar`     | NOT NULL         | Hora de la reserva (`HH:mm`)                |
| `numberOfPeople`    | `integer`     | NOT NULL         | Número de comensales                        |
| `customerName`      | `varchar`     | NOT NULL         | Nombre del comensal                         |
| `customerLastName`  | `varchar`     | NOT NULL         | Apellidos del comensal                      |
| `customerEmail`     | `varchar`     | NOT NULL         | Email para notificaciones                   |
| `customerPhone`     | `varchar`     | NOT NULL         | Teléfono de contacto                        |
| `notes`             | `text`        | NULLABLE         | Notas adicionales del comensal              |
| `status`            | `enum`        | DEFAULT PENDING  | Estado de la reserva                        |
| `depositAmount`     | `decimal`     | DEFAULT 0        | Importe del depósito en euros               |
| `paymentStatus`     | `enum`        | DEFAULT PENDING  | Estado del pago                             |
| `paymentId`         | `varchar`     | NULLABLE         | ID del proveedor de pagos (H3)              |
| `paymentMethod`     | `varchar`     | NULLABLE         | Método de pago (H3)                         |
| `paymentDeadline`   | `timestamptz` | NULLABLE         | Límite para pagar el depósito (H3)          |
| `rejectionReason`   | `text`        | NULLABLE         | Motivo de rechazo (si aplica)               |
| `cancellationToken` | `uuid`        | NOT NULL, UNIQUE | Token único para cancelar sin autenticación |
| `createdAt`         | `timestamptz` | AUTO             | Fecha de creación                           |
| `updatedAt`         | `timestamptz` | AUTO             | Fecha de última modificación                |

**Índices:**

- `cancellationToken` — UNIQUE + INDEX (búsqueda frecuente en cancelaciones públicas)

**Enum `ReservationStatus`:**

| Valor             | Descripción                           |
|-------------------|---------------------------------------|
| `PENDING`         | Pendiente de aprobación (modo MANUAL) |
| `CONFIRMED`       | Confirmada (auto o manualmente)       |
| `REJECTED`        | Rechazada por el restaurante          |
| `CANCELLED`       | Cancelada por el comensal             |
| `PENDING_PAYMENT` | Pendiente de pago del depósito (H3)   |

**Enum `PaymentStatus`:**

| Valor      | Descripción       |
|------------|-------------------|
| `PENDING`  | Sin pago iniciado |
| `PAID`     | Depósito pagado   |
| `REFUNDED` | Depósito devuelto |
| `FAILED`   | Pago fallido      |

**Notas:**

- Los comensales no tienen cuenta — todos sus datos se guardan en la reserva
- `cancellationToken` es un UUID generado con `crypto.randomUUID()` en el momento de la creación
- Los campos de pago (`paymentId`, `paymentMethod`, `paymentDeadline`) están preparados para H3 (Stripe)

---

### `payments` *(próximamente — H3)*

Registro de pagos asociados a reservas con depósito.

| Columna                 | Tipo          | Descripción                                           |
|-------------------------|---------------|-------------------------------------------------------|
| `id`                    | `uuid`        | PK                                                    |
| `reservationId`         | `uuid`        | FK lógica hacia `reservations`                        |
| `stripePaymentIntentId` | `varchar`     | ID del PaymentIntent en Stripe                        |
| `amount`                | `decimal`     | Importe en euros                                      |
| `currency`              | `varchar`     | DEFAULT `eur`                                         |
| `status`                | `enum`        | `PENDING_PAYMENT` \| `PAID` \| `FAILED` \| `REFUNDED` |
| `createdAt`             | `timestamptz` | AUTO                                                  |
| `updatedAt`             | `timestamptz` | AUTO                                                  |

---

## Relaciones

```
users ──────────────── restaurants
1                        N
(un admin puede tener múltiples restaurantes)

restaurants ─────────── settings
   1                      N
   (un restaurante tiene configuración por día/turno)

restaurants ─────────── reservations
   1                      N
   (un restaurante tiene múltiples reservas)

reservations ─────────── payments
    1                      1
    (una reserva tiene un pago si hay depósito)
```

---

## Diagrama ER simplificado

```
┌──────────────┐          ┌─────────────────┐
│    users     │          │   restaurants   │
├──────────────┤          ├─────────────────┤
│ id (PK)      │◄─────────│ adminId         │
│ email        │  1    N  │ id (PK)         │
│ role         │          │ name            │
│ firstName    │          │ slug            │
│ passwordHash │          │ category        │
│ isActive     │          │ isActive        │
└──────────────┘          └──────┬──────────┘
                                 │ 1
                        ─────────┼──────────
                        N        │         N
                ┌────────────────┴┐  ┌─────────────────┐
                │    settings     │  │  reservations   │
                ├─────────────────┤  ├─────────────────┤
                │ id (PK)         │  │ id (PK)         │
                │ restaurantId    │  │ restaurantId    │
                │ dayOfWeek       │  │ customerName    │
                │ openTime        │  │ date / time     │
                │ closeTime       │  │ status          │
                │ maxCapacity     │  │ cancellationToken│
                │ intervalMinutes │  │ paymentStatus   │
                │ acceptanceMode  │  └────────┬────────┘
                └─────────────────┘           │ 1
                                              │
                                     ┌────────┴────────┐
                                     │    payments     │
                                     ├─────────────────┤
                                     │ id (PK)         │
                                     │ reservationId   │
                                     │ stripeIntentId  │
                                     │ amount          │
                                     │ status          │
                                     └─────────────────┘
```

---

## Timestamps y zonas horarias

Todos los timestamps usan el tipo `timestamptz` de PostgreSQL:

- **Almacenamiento:** siempre en UTC internamente
- **TypeORM config:** `extra: { timezone: 'UTC' }`
- **Decoradores:** `@CreateDateColumn({ type: 'timestamptz' })`
- **Frontend:** transforma UTC a la zona horaria local del usuario
  mediante `Intl.DateTimeFormat` o `date-fns`

Esto garantiza el funcionamiento correcto en cualquier país europeo
sin necesidad de conversiones en el backend.

---

## Migraciones

> ⚠️ Las migraciones están pendientes de configuración para el entorno de producción.

En producción se desactivará `synchronize: true` y se usarán
migraciones de TypeORM para controlar los cambios de esquema de forma
segura y reversible.

```bash
# Generar migración (pendiente de configurar)
npm run migration:generate -- src/database/migrations/NombreMigracion

# Ejecutar migraciones pendientes
npm run migration:run

# Revertir última migración
npm run migration:revert
```

---

## Siguientes pasos

- [API Reference — Auth](./04-api/auth.md)
- [API Reference — Users](./04-api/users.md)