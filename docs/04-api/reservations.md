# API — Reservas

Módulo central del negocio. Gestiona el ciclo de vida completo
de las reservas desde la solicitud pública hasta su resolución.

**Base URL:** `/api/v1/reservations`

---

## Estado

| Endpoint                             | Estado       |
|--------------------------------------|--------------|
| `POST /reservations`                 | 🚧 Pendiente |
| `GET /reservations`                  | 🚧 Pendiente |
| `PATCH /reservations/:id/confirm`    | 🚧 Pendiente |
| `PATCH /reservations/:id/reject`     | 🚧 Pendiente |
| `DELETE /reservations/cancel/:token` | 🚧 Pendiente |

> Los endpoints se documentarán conforme se implementen.

---

## Modelo de datos previsto

### Reservation

```typescript
{
    id: string;
    restaurantId: string;
    customerName: string;
    customerLastName: string;
    customerEmail: string;
    customerPhone: string;
    date: string;               // YYYY-MM-DD
    time: string;               // HH:mm
    numberOfPeople: number;
    status: ReservationStatus;
    notes ? : string;
    rejectionReason ? : string;
    cancellationToken: string;  // UUID único para cancelar sin login
    paymentStatus ? : PaymentStatus;
    createdAt: Date;
    updatedAt: Date;
}
```

### ReservationStatus

| Valor       | Descripción                           |
|-------------|---------------------------------------|
| `PENDING`   | Pendiente de aprobación (modo MANUAL) |
| `CONFIRMED` | Confirmada                            |
| `REJECTED`  | Rechazada por el restaurante          |
| `CANCELLED` | Cancelada por el comensal             |

### PaymentStatus

| Valor             | Descripción                    |
|-------------------|--------------------------------|
| `PENDING_PAYMENT` | Pendiente de pago del depósito |
| `PAID`            | Depósito pagado                |
| `FAILED`          | Pago fallido                   |
| `REFUNDED`        | Depósito devuelto              |

---

## Siguientes pasos

- [Despliegue](../06-deployment.md)