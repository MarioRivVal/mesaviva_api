# Módulo Restaurants

Gestión de restaurantes de la plataforma. Expone endpoints públicos
para que los comensales puedan explorar restaurantes y hacer reservas.

---

## Estructura

```
restaurants/
├── domain/
│   ├── entities/
│   │   └── restaurant.entity.ts           # Entidad de dominio Restaurant
│   ├── enums/
│   │   └── restaurant-category.enum.ts    # RESTAURANT | BAR | BREWERY | TEA_HOUSE
│   └── ports/
│       └── restaurant.repository.port.ts  # Contrato del repositorio
├── application/
│   ├── dtos/
│   │   └── restaurant.dto.ts              # Tipos públicos de entrada/salida
│   └── use-cases/
│       ├── get-public-restaurant.use-case.ts   # Detalle por slug
│       └── list-public-restaurants.use-case.ts # Listado público
├── infrastructure/
│   ├── controllers/
│   │   └── restaurants.controller.ts      # GET /restaurants y GET /restaurants/:slug
│   └── persistence/
│       ├── restaurant.orm-entity.ts       # Entidad TypeORM
│       └── restaurant.typeorm.repository.ts
└── restaurants.module.ts
```

---

## Entidad de dominio: `Restaurant`

```typescript
class Restaurant {
  readonly id: string;
  name: string;
  readonly adminId: string;
  phone: string;
  address: string;
  readonly category: RestaurantCategory;
  readonly email: string;
  imageUrl: string;
  slug: string;
  isActive: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  static create(params): Restaurant
}
```

**Notas de diseño:**

- `adminId`, `category` y `email` son `readonly` — no cambian tras la creación
- No hay FK constraint en base de datos hacia `users` — la integridad se gestiona
  en la capa de aplicación (arquitectura hexagonal: cada módulo gestiona sus datos)

---

## Port: `RestaurantRepositoryPort`

```typescript
abstract class RestaurantRepositoryPort {
    abstract findById(id: string): Promise<Restaurant | null>;

    abstract findBySlug(slug: string): Promise<Restaurant | null>;

    abstract findAll(): Promise<Restaurant[]>;

    abstract findAllByOwnerId(adminId: string): Promise<Restaurant[]>;

    abstract save(restaurant: Restaurant): Promise<Restaurant>;

    abstract delete(id: string): Promise<void>;
}
```

---

## Use Cases

### `ListPublicRestaurantsUseCase`

Devuelve todos los restaurantes activos ordenados alfabéticamente.

**Detalle de implementación:** `findAll()` devuelve todos los registros
y el filtrado de `isActive` se hace en memoria en la capa de aplicación.
Aceptable para el volumen actual; en H2 se moverá el filtro a la query.

### `GetPublicRestaurantUseCase`

Devuelve el detalle de un restaurante por slug junto con sus settings.

**Flujo:**

1. Buscar por slug → `NotFoundError` si no existe
2. Verificar `isActive` → `NotFoundError` si inactivo (no `403`, para no revelar su existencia)
3. Buscar settings → puede ser `null` (restaurante sin configurar)
4. Devolver datos combinados

---

## Enum: `RestaurantCategory`

| Valor        | Descripción |
|--------------|-------------|
| `RESTAURANT` | Restaurante |
| `BAR`        | Bar         |
| `BREWERY`    | Cervecería  |
| `TEA_HOUSE`  | Casa de té  |

---

## Módulo exporta

`RestaurantsModule` exporta `RestaurantRepositoryPort` para que
`ReservationsModule`, `SettingsModule` y `UsersModule` puedan
inyectarlo sin reimportar TypeORM.

```typescript
exports: [RestaurantRepositoryPort]
```

---

## Tests

| Archivo                                    | Cobertura                                                                                  |
|--------------------------------------------|--------------------------------------------------------------------------------------------|
| `get-public-restaurant.use-case.spec.ts`   | Detalle OK, settings null, restaurante inexistente, restaurante inactivo, campos completos |
| `list-public-restaurants.use-case.spec.ts` | Listado solo activos, conteo correcto                                                      |

---

## Siguientes pasos

- [API — Restaurants](../04-api/restaurants.md)
- [Módulo Settings](./settings.md)

