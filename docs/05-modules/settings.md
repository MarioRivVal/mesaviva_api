# Módulo Settings

Configuración operativa de cada restaurante: horarios de apertura
por día y turno, capacidad máxima, intervalo de reservas y modo
de aceptación.

---

## Estructura

```
settings/
├── domain/
│   ├── constants/
│   │   └── time-slot-interval.const.ts    # [15, 30, 60] as const
│   ├── entities/
│   │   └── settings.entity.ts             # Entidad de dominio Settings
│   ├── enums/
│   │   └── acceptance-mode.enum.ts        # AUTO | MANUAL
│   ├── ports/
│   │   └── settings.repository.port.ts    # Contrato del repositorio
│   └── types/
│       └── opening-hours.type.ts          # OpeningHours, TimeRange, DayOfWeek
├── application/
│   ├── dtos/
│   │   └── settings.dto.ts                # Tipos de entrada/salida
│   └── use-cases/
│       ├── get-settings.use-case.ts       # Consulta con autorización
│       └── update-settings.use-case.ts   # Creación / actualización parcial
├── infrastructure/
│   ├── controllers/
│   │   ├── dtos/
│   │   │   └── update-settings.http-dto.ts # Validación HTTP (con nested validators)
│   │   └── settings.controller.ts
│   └── persistence/
│       ├── settings.orm-entity.ts         # openingHours como JSONB
│       └── settings.typeorm.repository.ts
└── settings.module.ts
```

---

## Entidad de dominio: `Settings`

```typescript
class Settings {
    readonly id: string;
    readonly restaurantId: string;
    openingHours: OpeningHours;
    timeSlotInterval: TimeSlotInterval;  // 15 | 30 | 60
    depositAmount: number;
    acceptanceMode: AcceptanceMode;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;

    static create(params): Settings
}
```

---

## Tipos de dominio

### `OpeningHours`

```typescript
interface OpeningHours {
    monday: TimeRange[];
    tuesday: TimeRange[];
    wednesday: TimeRange[];
    thursday: TimeRange[];
    friday: TimeRange[];
    saturday: TimeRange[];
    sunday: TimeRange[];
}
```

Un array vacío para un día indica que el restaurante está cerrado ese día.

### `TimeRange`

```typescript
interface TimeRange {
    open: string;      // HH:mm
    close: string;     // HH:mm
    capacity: number;  // comensales máximos en el turno
}
```

### `DayOfWeek`

```typescript
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
```

---

## Port: `SettingsRepositoryPort`

```typescript
abstract class SettingsRepositoryPort {
    abstract findByRestaurantId(restaurantId: string): Promise<Settings | null>;

    abstract save(settings: Settings): Promise<Settings>;
}
```

---

## Use Cases

### `GetSettingsUseCase`

Devuelve la configuración de un restaurante con control de acceso por rol.

- `RESTAURANT_ADMIN` → solo puede ver la de su restaurante (`ForbiddenError` si intenta otra)
- `SUPERADMIN` → puede ver cualquiera

### `UpdateSettingsUseCase`

Crea o actualiza la configuración de un restaurante.

**Comportamiento según existencia de settings:**

| Situación           | Comportamiento                                          |
|---------------------|---------------------------------------------------------|
| Settings no existen | Requiere todos los campos (`BadRequestError` si faltan) |
| Settings ya existen | Actualización parcial — solo campos enviados            |

**Control de acceso:**

- `RESTAURANT_ADMIN` → solo puede modificar la de su restaurante
- `SUPERADMIN` → puede modificar cualquiera

---

## Persistencia

`openingHours` se almacena como `JSONB` en PostgreSQL.
Esto permite consultas flexibles en el futuro y evita una tabla
de filas por día/turno que complicaría las queries.

`depositAmount` se almacena como `decimal(10,2)` — TypeORM lo
devuelve como `string` en PostgreSQL. El repositorio hace el cast
a `number` en `toDomain()`:

```typescript
depositAmount: Number(entity.depositAmount)
```

---

## Módulo exporta

`SettingsModule` exporta `SettingsRepositoryPort` para que
`ReservationsModule` pueda obtener la configuración al validar
una nueva reserva.

```typescript
exports: [SettingsRepositoryPort]
```

---

## Tests

| Archivo                            | Cobertura                                                                          |
|------------------------------------|------------------------------------------------------------------------------------|
| `get-settings.use-case.spec.ts`    | OK, restaurante inexistente, settings inexistentes, forbidden por rol              |
| `update-settings.use-case.spec.ts` | Actualizar existentes, crear nuevos, campos faltantes, forbidden, superadmin libre |

---

## Siguientes pasos

- [API — Settings](../04-api/settings.md)
- [Módulo Reservations](./reservations.md)

