# API — Reservas

Módulo central del negocio. Gestiona el ciclo de vida completo
de las reservas desde la solicitud pública hasta su resolución.

**Base URL:** `/api/v1/reservations`

---

## Endpoints

| Método   | Ruta                          | Descripción                     | Auth      |
|----------|-------------------------------|---------------------------------|-----------|
| `POST`   | `/reservations`               | Crear una nueva reserva         | ❌ Público |
| `DELETE` | `/reservations/cancel/:token` | Cancelar reserva mediante token | ❌ Público |

---

## POST `/reservations`

Crea una nueva solicitud de reserva para un restaurante.
No requiere autenticación — cualquier comensal puede reservar.

El estado inicial depende de la configuración del restaurante:

- `AcceptanceMode.AUTO` → estado `CONFIRMED` + email de confirmación
- `AcceptanceMode.MANUAL` → estado `PENDING` + email de solicitud recibida

En ambos casos el restaurante recibe un email de notificación.

### Request

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "restaurantId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "date": "2026-03-15",
  "time": "13:30",
  "numberOfPeople": 4,
  "customerName": "María",
  "customerLastName": "González",
  "customerEmail": "maria@email.com",
  "customerPhone": "612345678",
  "notes": "Somos alérgicos a los frutos secos"
}
```

**Validaciones:**

| Campo              | Tipo      | Reglas                                            |
|--------------------|-----------|---------------------------------------------------|
| `restaurantId`     | `string`  | UUID v4 válido, requerido                         |
| `date`             | `string`  | Formato `YYYY-MM-DD`, requerido                   |
| `time`             | `string`  | Formato `HH:mm`, requerido                        |
| `numberOfPeople`   | `integer` | Entre 1 y 20, requerido                           |
| `customerName`     | `string`  | Mínimo 2 caracteres, requerido                    |
| `customerLastName` | `string`  | Mínimo 2 caracteres, requerido                    |
| `customerEmail`    | `string`  | Formato email válido, requerido                   |
| `customerPhone`    | `string`  | Teléfono español válido (fijo o móvil), requerido |
| `notes`            | `string`  | Opcional                                          |

> ⚠️ Para grupos de 10 o más personas el sistema rechaza la reserva online
> y solicita contactar con el restaurante directamente.

### Respuestas

**✅ 201 Created — Reserva creada (modo AUTO)**

```json
{
  "reservation": {
    "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "restaurantId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "date": "2026-03-15",
    "time": "13:30",
    "numberOfPeople": 4,
    "status": "CONFIRMED",
    "cancellationToken": "d4e5f6a7-b8c9-0123-defa-234567890123"
  },
  "message": "Reservation confirmed successfully"
}
```

**✅ 201 Created — Reserva creada (modo MANUAL)**

```json
{
  "reservation": {
    "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "restaurantId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "date": "2026-03-15",
    "time": "13:30",
    "numberOfPeople": 4,
    "status": "PENDING",
    "cancellationToken": "d4e5f6a7-b8c9-0123-defa-234567890123"
  },
  "message": "Reservation request received. You will be notified once the restaurant confirms"
}
```

**❌ 404 Not Found — Restaurante no existe**

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Restaurant with id b2c3d4e5-... not found",
  "timestamp": "2026-03-01T10:00:00.000Z",
  "path": "/api/v1/reservations"
}
```

**❌ 400 Bad Request — Restaurante inactivo**

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "This restaurant is not accepting reservations",
  "timestamp": "2026-03-01T10:00:00.000Z",
  "path": "/api/v1/reservations"
}
```

**❌ 400 Bad Request — Validaciones de negocio**

Posibles mensajes según la regla infringida:

```json
{
  "message": "For groups of 10 or more please contact the restaurant directly"
}
{
  "message": "Reservations must be made at least 30 minutes in advance"
}
{
  "message": "Restaurant is closed on sundays"
}
{
  "message": "Restaurant is not open at 18:00 on mondays"
}
{
  "message": "Last reservation is at 15:00"
}
{
  "message": "Time must align with 30-minute intervals. Next valid time: 13:30"
}
{
  "message": "No capacity available for this shift. Available: 6 people"
}
```

### Flujo interno

```
1. Buscar restaurante por ID → 404 si no existe
2. Verificar restaurante activo → 400 si no
3. Buscar settings del restaurante → 404 si no configurado
4. Obtener reservas existentes para esa fecha
5. Validar tamaño del grupo (máx. 9 online)
6. Validar antelación mínima (30 minutos)
7. Validar horario de apertura y obtener turno
8. Validar intervalo de slots
9. Validar capacidad disponible en el turno
10. Determinar estado inicial según acceptanceMode
11. Crear y persistir reserva con cancellationToken único
12. Enviar email al admin del restaurante
13. Enviar email de confirmación o pendiente al comensal
14. Devolver resultado
```

---

## DELETE `/reservations/cancel/:token`

Cancela una reserva existente usando el `cancellationToken` único.
No requiere autenticación — el token actúa como identificador seguro.

El `cancellationToken` se incluye en todos los emails enviados al comensal
en forma de enlace directo.

### Request

**Path params:**

| Parámetro | Tipo     | Descripción                                  |
|-----------|----------|----------------------------------------------|
| `token`   | `string` | UUID único de cancelación recibido por email |

**Ejemplo:**

```
DELETE /api/v1/reservations/cancel/d4e5f6a7-b8c9-0123-defa-234567890123
```

### Respuestas

**✅ 200 OK — Cancelación exitosa**

```json
{
  "success": true,
  "message": "Reservation cancelled successfully"
}
```

Al cancelar:

- Se actualiza el estado de la reserva a `CANCELLED`
- El comensal recibe un email de confirmación de cancelación

**❌ 404 Not Found — Token inválido o no existe**

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Reservation not found or token is invalid",
  "timestamp": "2026-03-01T10:00:00.000Z",
  "path": "/api/v1/reservations/cancel/token-invalido"
}
```

**❌ 400 Bad Request — La reserva no se puede cancelar**

La reserva solo puede cancelarse si está en estado `PENDING` o `CONFIRMED`.

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Only pending or confirmed reservations can be cancelled",
  "timestamp": "2026-03-01T10:00:00.000Z",
  "path": "/api/v1/reservations/cancel/d4e5f6a7-..."
}
```

---

## Modelo de datos

### Reservation

```typescript
{
    id: string;                  // UUID v4
    restaurantId: string;        // referencia al restaurante
    customerName: string;
    customerLastName: string;
    customerEmail: string;
    customerPhone: string;
    date: string;                // YYYY-MM-DD
    time: string;                // HH:mm
    numberOfPeople: number;
    status: ReservationStatus;
    notes: string | null;
    rejectionReason: string | null;
    cancellationToken: string;   // UUID único, no expira
    depositAmount: number;       // euros, 0 si no hay depósito
    paymentStatus: PaymentStatus;
    paymentId: string | null;
    paymentMethod: string | null;
    paymentDeadline: Date | null;
    createdAt: Date;             // UTC
    updatedAt: Date;             // UTC
}
```

### ReservationStatus

| Valor             | Descripción                                          |
|-------------------|------------------------------------------------------|
| `PENDING`         | Pendiente de aprobación (restaurante en modo MANUAL) |
| `CONFIRMED`       | Confirmada (auto o manualmente por el restaurante)   |
| `REJECTED`        | Rechazada por el restaurante                         |
| `CANCELLED`       | Cancelada por el comensal                            |
| `PENDING_PAYMENT` | Pendiente de pago de depósito (H3)                   |

### PaymentStatus

| Valor      | Descripción       |
|------------|-------------------|
| `PENDING`  | Sin pago iniciado |
| `PAID`     | Depósito pagado   |
| `REFUNDED` | Depósito devuelto |
| `FAILED`   | Pago fallido      |

---

## Reglas de negocio

### Validaciones automáticas al crear

| Regla                     | Detalle                                                       |
|---------------------------|---------------------------------------------------------------|
| Grupo máximo online       | Máximo 9 personas. ≥10 debe llamar al restaurante             |
| Antelación mínima         | Al menos 30 minutos antes de la hora reservada                |
| Horario de apertura       | La hora debe estar dentro de un turno activo                  |
| Tiempo mínimo de servicio | Reserva al menos 60 min antes del cierre del turno            |
| Intervalo de slots        | Alineada con el `timeSlotInterval` configurado (15/30/60 min) |
| Capacidad disponible      | Suma de comensales confirmados/pendientes del turno           |

### Transiciones de estado válidas

```
PENDING    → CONFIRMED  (admin acepta)
PENDING    → REJECTED   (admin rechaza)
PENDING    → CANCELLED  (comensal cancela)
CONFIRMED  → CANCELLED  (comensal cancela)
```

---

## Notificaciones por email

| Evento                  | Destinatario          | Asunto                                   |
|-------------------------|-----------------------|------------------------------------------|
| Reserva creada (AUTO)   | Admin del restaurante | ✅ Nueva Reserva Confirmada               |
| Reserva creada (MANUAL) | Admin del restaurante | 🔔 Nueva Reserva Pendiente de Aprobación |
| Reserva creada (AUTO)   | Comensal              | ✅ Reserva Confirmada                     |
| Reserva creada (MANUAL) | Comensal              | 🕐 Solicitud de Reserva Recibida         |
| Reserva cancelada       | Comensal              | Reserva Cancelada                        |

---

## Siguientes pasos

- [Módulo Reservations](../05-modules/reservations.md)
- [Despliegue](../06-deployment.md)