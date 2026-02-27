# API — Configuración

Módulo responsable de la configuración operativa de cada restaurante:
horarios, capacidad, intervalos y modo de aceptación.

**Base URL:** `/api/v1/settings`

---

## Estado

| Endpoint                      | Estado       |
|-------------------------------|--------------|
| `POST /settings`              | 🚧 Pendiente |
| `GET /settings/:restaurantId` | 🚧 Pendiente |
| `PATCH /settings/:id`         | 🚧 Pendiente |

> Los endpoints se documentarán conforme se implementen.

---

## Modelo de datos previsto

### Settings

```typescript
{
    id: string;
    restaurantId: string;
    dayOfWeek: number;          // 0 = lunes … 6 = domingo
    openTime: string;           // HH:mm
    closeTime: string;          // HH:mm
    maxCapacity: number;
    intervalMinutes: 15 | 30 | 60;
    acceptanceMode: AcceptanceMode;
    depositRequired: boolean;
    depositAmount: number;      // euros
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
```

### AcceptanceMode

| Valor    | Descripción                                     |
|----------|-------------------------------------------------|
| `AUTO`   | Reserva se confirma automáticamente             |
| `MANUAL` | Reserva queda pendiente de aprobación del admin |

---

## Siguientes pasos

- [API — Reservations](./reservations.md)