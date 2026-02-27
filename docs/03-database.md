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

### `settings` *(próximamente — H1)*

Configuración operativa de cada restaurante.

| Columna           | Tipo          | Descripción                          |
|-------------------|---------------|--------------------------------------|
| `id`              | `uuid`        | PK                                   |
| `restaurantId`    | `uuid`        | FK lógica hacia `restaurants`        |
| `dayOfWeek`       | `smallint`    | 0 = lunes … 6 = domingo              |
| `openTime`        | `time`        | Hora de apertura del turno           |
| `closeTime`       | `time`        | Hora de cierre del turno             |
| `maxCapacity`     | `smallint`    | Comensales máximos por turno         |
| `intervalMinutes` | `smallint`    | Intervalo de reservas (15/30/60 min) |
| `acceptanceMode`  | `enum`        | `AUTO` \| `MANUAL`                   |
| `depositRequired` | `boolean`     | Requiere depósito al reservar        |
| `depositAmount`   | `decimal`     | Importe del depósito en euros        |
| `isActive`        | `boolean`     | Turno activo/inactivo                |
| `createdAt`       | `timestamptz` | AUTO                                 |
| `updatedAt`       | `timestamptz` | AUTO                                 |

---

### `reservations` *(próximamente — H1)*

Reservas realizadas por comensales. No requieren cuenta de usuario.

| Columna             | Tipo          | Descripción                         |
|---------------------|---------------|-------------------------------------|
| `id`                | `uuid`        | PK                                  |
| `restaurantId`      | `uuid`        | FK lógica hacia `restaurants`       |
| `customerName`      | `varchar`     | Nombre del comensal                 |
| `customerLastName`  | `varchar`     | Apellidos del comensal              |
| `customerEmail`     | `varchar`     | Email para notificaciones           |
| `customerPhone`     | `varchar`     | Teléfono de contacto                |
| `date`              | `date`        | Fecha de la reserva                 |
| `time`              | `time`        | Hora de la reserva                  |
| `numberOfPeople`    | `smallint`    | Número de comensales                |
| `status`            | `enum`        | Estado de la reserva                |
| `notes`             | `text`        | Notas adicionales del comensal      |
| `rejectionReason`   | `text`        | Motivo de rechazo (si aplica)       |
| `cancellationToken` | `uuid`        | Token único para cancelar sin login |
| `paymentStatus`     | `enum`        | Estado del pago (si hay depósito)   |
| `paymentIntentId`   | `varchar`     | ID de Stripe (si hay depósito)      |
| `createdAt`         | `timestamptz` | AUTO                                |
| `updatedAt`         | `timestamptz` | AUTO                                |

**Enum `ReservationStatus`:**

| Valor       | Descripción                           |
|-------------|---------------------------------------|
| `PENDING`   | Pendiente de aprobación (modo MANUAL) |
| `CONFIRMED` | Confirmada                            |
| `REJECTED`  | Rechazada por el restaurante          |
| `CANCELLED` | Cancelada por el comensal             |

**Enum `PaymentStatus`:**

| Valor             | Descripción       |
|-------------------|-------------------|
| `PENDING_PAYMENT` | Pendiente de pago |
| `PAID`            | Depósito pagado   |
| `FAILED`          | Pago fallido      |
| `REFUNDED`        | Depósito devuelto |

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