# API — Configuración

Módulo responsable de la configuración operativa de cada restaurante:
horarios de apertura por día y turno, capacidad, intervalo de reservas
y modo de aceptación.

**Base URL:** `/api/v1/settings`

---

## Endpoints

| Método  | Ruta                      | Descripción                         | Rol requerido                   |
|---------|---------------------------|-------------------------------------|---------------------------------|
| `GET`   | `/settings/:restaurantId` | Ver configuración de un restaurante | `SUPERADMIN` `RESTAURANT_ADMIN` |
| `PATCH` | `/settings/:restaurantId` | Crear o actualizar configuración    | `SUPERADMIN` `RESTAURANT_ADMIN` |

---

## GET `/settings/:restaurantId`

Devuelve la configuración operativa completa de un restaurante.

Un `RESTAURANT_ADMIN` solo puede consultar la configuración de su propio restaurante.
Un `SUPERADMIN` puede consultar la de cualquiera.

### Auth requerida

```
@Auth(UserRole.SUPERADMIN, UserRole.RESTAURANT_ADMIN)
Cookie: auth_token=<jwt>
```

### Request

**Path params:**

| Parámetro      | Tipo   | Descripción        |
|----------------|--------|--------------------|
| `restaurantId` | `uuid` | ID del restaurante |

### Respuestas

**✅ 200 OK**

```json
{
  "id": "e5f6a7b8-c9d0-1234-efab-345678901234",
  "restaurantId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "openingHours": {
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
      },
      {
        "open": "20:00",
        "close": "23:30",
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
  },
  "timeSlotInterval": 30,
  "depositAmount": 10,
  "acceptanceMode": "AUTO",
  "timestamps": {
    "createdAt": "2026-01-15T09:00:00.000Z",
    "updatedAt": "2026-02-20T14:30:00.000Z"
  }
}
```

**❌ 404 Not Found — Restaurante no existe**

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Restaurant with id b2c3d4e5-... not found",
  "timestamp": "2026-03-01T10:00:00.000Z",
  "path": "/api/v1/settings/b2c3d4e5-..."
}
```

**❌ 404 Not Found — Settings no configuradas todavía**

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Settings for restaurant with id b2c3d4e5-... not found",
  "timestamp": "2026-03-01T10:00:00.000Z",
  "path": "/api/v1/settings/b2c3d4e5-..."
}
```

**❌ 403 Forbidden — Admin intentando ver settings de otro restaurante**

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "You can only view settings of your own restaurant",
  "timestamp": "2026-03-01T10:00:00.000Z",
  "path": "/api/v1/settings/b2c3d4e5-..."
}
```

---

## PATCH `/settings/:restaurantId`

Crea o actualiza la configuración operativa de un restaurante.

- Si el restaurante **no tiene settings**, actúa como creación y **todos los campos son obligatorios**.
- Si el restaurante **ya tiene settings**, actúa como actualización parcial — solo se actualizan los campos enviados.

Un `RESTAURANT_ADMIN` solo puede modificar la configuración de su propio restaurante.

### Auth requerida

```
@Auth(UserRole.SUPERADMIN, UserRole.RESTAURANT_ADMIN)
Cookie: auth_token=<jwt>
```

### Request

**Path params:**

| Parámetro      | Tipo   | Descripción        |
|----------------|--------|--------------------|
| `restaurantId` | `uuid` | ID del restaurante |

**Body (todos los campos opcionales en modo actualización):**

```json
{
  "openingHours": {
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
      },
      {
        "open": "20:00",
        "close": "23:30",
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
  },
  "timeSlotInterval": 30,
  "depositAmount": 10,
  "acceptanceMode": "AUTO"
}
```

**Validaciones:**

| Campo                | Tipo             | Reglas                                         |
|----------------------|------------------|------------------------------------------------|
| `openingHours`       | `object`         | Opcional. Debe incluir los 7 días de la semana |
| `openingHours[día]`  | `TimeRange[]`    | Array de turnos. Array vacío = día cerrado     |
| `TimeRange.open`     | `string`         | Formato `HH:mm`                                |
| `TimeRange.close`    | `string`         | Formato `HH:mm`                                |
| `TimeRange.capacity` | `integer`        | Mínimo 1                                       |
| `timeSlotInterval`   | `15 \| 30 \| 60` | Opcional. Minutos entre slots de reserva       |
| `depositAmount`      | `number`         | Opcional. Euros. Mínimo 0                      |
| `acceptanceMode`     | `AUTO \| MANUAL` | Opcional                                       |

### Respuestas

**✅ 200 OK**

Devuelve la configuración completa actualizada (mismo formato que el GET).

**❌ 400 Bad Request — Primera configuración sin todos los campos**

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "All fields are required when creating settings for the first time",
  "timestamp": "2026-03-01T10:00:00.000Z",
  "path": "/api/v1/settings/b2c3d4e5-..."
}
```

**❌ 403 Forbidden — Admin intentando modificar settings de otro restaurante**

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "You can only update settings of your own restaurant",
  "timestamp": "2026-03-01T10:00:00.000Z",
  "path": "/api/v1/settings/b2c3d4e5-..."
}
```

### Flujo interno

```
1. Verificar JWT + rol válido
2. Buscar restaurante por ID → 404 si no existe
3. Verificar que el RESTAURANT_ADMIN es el dueño → 403 si no
4. Buscar settings existentes del restaurante
5a. Si existen → actualizar solo los campos enviados (PATCH parcial)
5b. Si no existen → validar que todos los campos estén presentes → crear
6. Persistir y devolver resultado
```

---

## Modelo de datos

### Settings

```typescript
{
    id: string;
    restaurantId: string;
    openingHours: OpeningHours;
    timeSlotInterval: 15 | 30 | 60;
    depositAmount: number;          // euros
    acceptanceMode: AcceptanceMode;
    timestamps: {
        createdAt: Date;
        updatedAt: Date;
    }
    ;
}
```

### OpeningHours

Objeto con los 7 días de la semana. Cada día contiene un array de turnos.
Un array vacío indica que el restaurante está cerrado ese día.

```typescript
{
    monday: TimeRange[];
    tuesday: TimeRange[];
    wednesday: TimeRange[];
    thursday: TimeRange[];
    friday: TimeRange[];
    saturday: TimeRange[];
    sunday: TimeRange[];
}
```

### TimeRange

```typescript
{
    open: string;      // HH:mm
    close: string;     // HH:mm
    capacity: number;  // comensales máximos simultáneos en este turno
}
```

### AcceptanceMode

| Valor    | Comportamiento                                                         |
|----------|------------------------------------------------------------------------|
| `AUTO`   | Las reservas se confirman automáticamente al crearse                   |
| `MANUAL` | Las reservas quedan en estado `PENDING` hasta que el admin las apruebe |

### TimeSlotInterval

| Valor | Descripción                                     |
|-------|-------------------------------------------------|
| `15`  | Slots cada 15 minutos (ej: 13:00, 13:15, 13:30) |
| `30`  | Slots cada 30 minutos (ej: 13:00, 13:30, 14:00) |
| `60`  | Slots cada hora (ej: 13:00, 14:00, 15:00)       |

---

## Siguientes pasos

- [API — Reservations](./reservations.md)
- [Módulo Settings](../05-modules/settings.md)
