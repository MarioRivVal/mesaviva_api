# Testing

MesaViva API usa **Jest** con tests unitarios de use cases y servicios de dominio.
La arquitectura hexagonal hace que el dominio sea testeable en aislamiento total,
sin base de datos ni framework.

---

## Filosofía de testing

> Testeamos **lógica de negocio**, no infraestructura.

| Qué se testea        | Cómo                                          |
|----------------------|-----------------------------------------------|
| Use cases            | Jest + mocks de repositorios y servicios      |
| Servicios de dominio | Jest puro — sin mocks (lógica pura)           |
| Repositorios TypeORM | ❌ No — se confía en TypeORM                   |
| Controllers          | ❌ No — la validación la cubre class-validator |
| Filtros y guards     | ❌ No — infraestructura estable                |

La capa de dominio no importa NestJS ni TypeORM, por lo que los tests
son rápidos y sin efectos secundarios.

---

## Ejecutar tests

```bash
# Todos los tests
npm test

# En modo watch (reruns al guardar)
npm run test:watch

# Con cobertura
npm run test:cov

# Un archivo concreto
npm test -- login.use-case
```

---

## Estructura de tests

```
test/
└── modules/
    ├── auth/
    │   └── application/
    │       └── use-cases/
    │           ├── login.use-case.spec.ts
    │           └── change-password.use-case.spec.ts
    ├── restaurants/
    │   └── application/
    │       └── use-cases/
    │           ├── get-public-restaurant.use-case.spec.ts
    │           ├── get-restaurants.use-case.spec.ts          ← nuevo H2
    │           └── list-public-restaurants.use-case.spec.ts
    ├── reservations/
    │   └── application/
    │       ├── services/
    │       │   └── reservation-validator.service.spec.ts
    │       └── use-cases/
    │           ├── create-reservation.use-case.spec.ts
    │           ├── cancel-by-token.use-case.spec.ts
    │           ├── cancel-reservation.use-case.spec.ts
    │           ├── confirm-reservation.use-case.spec.ts
    │           ├── get-reservation.use-case.spec.ts          ← nuevo H2
    │           ├── get-reservations.use-case.spec.ts
    │           └── reject-reservation.use-case.spec.ts
    ├── settings/
    │   └── application/
    │       └── use-cases/
    │           ├── get-settings.use-case.spec.ts
    │           └── update-settings.use-case.spec.ts
    └── users/
        └── application/
            └── use-cases/
                └── create-restaurant-admin.use-case.spec.ts
```

> La estructura de `test/` espeja exactamente la de `src/modules/`
> para facilitar la navegación.

---

## Cobertura actual

| Módulo           | Archivo                                    | Tests   | Casos cubiertos                                                                                               |
|------------------|--------------------------------------------|---------|---------------------------------------------------------------------------------------------------------------|
| **Auth**         | `login.use-case.spec.ts`                   | 4       | Login OK, usuario inexistente, contraseña errónea, `mustChangePassword`                                       |
| **Auth**         | `change-password.use-case.spec.ts`         | 7       | Cambio OK, usuario no existe, contraseña incorrecta, igual a la actual, sin mayúscula, sin símbolo, fortaleza |
| **Users**        | `create-restaurant-admin.use-case.spec.ts` | 5       | Creación OK, email duplicado, slug único, rollback BD, email bienvenida                                       |
| **Restaurants**  | `get-public-restaurant.use-case.spec.ts`   | 5       | Detalle OK, settings null, no existe, inactivo, campos completos                                              |
| **Restaurants**  | `list-public-restaurants.use-case.spec.ts` | 5       | Solo activos, lista vacía, sin activos, campos públicos, conteo correcto                                      |
| **Restaurants**  | `get-restaurants.use-case.spec.ts`         | 5       | OK propietario, lista vacía, forbidden otro admin, superadmin libre, mapeo de campos                          |
| **Settings**     | `get-settings.use-case.spec.ts`            | 5       | OK superadmin, OK propietario, forbidden otro admin, restaurante no existe, settings no existen               |
| **Settings**     | `update-settings.use-case.spec.ts`         | 6       | Actualizar, crear, campos faltantes, forbidden, superadmin libre                                              |
| **Reservations** | `create-reservation.use-case.spec.ts`      | 8       | AUTO/MANUAL, sin restaurante, inactivo, sin settings, validadores, emails                                     |
| **Reservations** | `cancel-by-token.use-case.spec.ts`         | 8       | Cancelar CONFIRMED/PENDING, token inválido, sin restaurante, estados inválidos, emails                        |
| **Reservations** | `cancel-reservation.use-case.spec.ts`      | 7       | Cancelar CONFIRMED/PENDING, ya cancelada, rechazada, no existe, forbidden, email                              |
| **Reservations** | `confirm-reservation.use-case.spec.ts`     | 7       | Confirmar PENDING, ya confirmada, cancelada, no existe, forbidden, notas con/sin email                        |
| **Reservations** | `reject-reservation.use-case.spec.ts`      | 7       | Rechazar PENDING, ya confirmada, ya rechazada, cancelada, no existe, forbidden, motivo                        |
| **Reservations** | `get-reservations.use-case.spec.ts`        | 6       | OK propietario, restaurante no existe, forbidden, superadmin libre, lista vacía, filtros                      |
| **Reservations** | `get-reservation.use-case.spec.ts`         | 5       | OK propietario, reserva no existe, restaurante no existe, forbidden otro admin, superadmin libre              |
| **Reservations** | `reservation-validator.service.spec.ts`    | 21      | Grupo, antelación, horario (día cerrado, sin turno, último slot), intervalos, capacidad                       |
| **Total**        |                                            | **114** |                                                                                                               |

> **Nota:** Los test suites `get-reservation.use-case.spec.ts` y `get-restaurants.use-case.spec.ts`
> se añadieron en la iteración H2 (7 marzo 2026) y no están comiteados aún.

---

## Patrón de tests

Todos los tests siguen el mismo patrón para consistencia:

### 1. Factories de datos de prueba

```typescript
// Funciones que crean objetos de prueba reutilizables
const makeUser = (overrides: Partial<User> = {}): User =>
    Object.assign(new User('id', 'Mario', 'Rivera', ...), overrides);

const makeInput = (overrides = {}): CreateReservationInput => ({
    restaurantId: 'restaurant-id',
    date: '2026-03-15',
    // ...valores por defecto razonables
    ...overrides,
});
```

### 2. Mocks de ports

```typescript
// Se mockean los ports (interfaces), no las implementaciones
let reservationRepository: jest.Mocked<ReservationRepositoryPort>;

beforeEach(() => {
    reservationRepository = {
        findById: jest.fn(),
        findByToken: jest.fn(),
        findByRestaurantAndFilters: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
    } as jest.Mocked<ReservationRepositoryPort>;

    useCase = new CreateReservationUseCase(reservationRepository, ...);
});
```

### 3. Estructura de cada test

```typescript
it('debería [resultado esperado] cuando [condición]', async () => {
    // Arrange — configurar mocks
    reservationRepository.findByToken.mockResolvedValue(makeReservation());

    // Act — ejecutar
    const result = await useCase.execute({token: 'valid-token'});

    // Assert — verificar
    expect(result.success).toBe(true);
    expect(reservationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({status: ReservationStatus.CANCELLED}),
    );
});
```

### 4. Tests de error

```typescript
it('debería lanzar NotFoundError si el token no existe', async () => {
    reservationRepository.findByToken.mockResolvedValue(null);

    await expect(
        useCase.execute({token: 'token-invalido'}),
    ).rejects.toThrow(NotFoundError);

    // Verificar que no hubo efectos secundarios
    expect(reservationRepository.save).not.toHaveBeenCalled();
});
```

---

## Convenciones

| Elemento            | Convención                                         |
|---------------------|----------------------------------------------------|
| Nombres de tests    | Español — `'debería [verbo] cuando [condición]'`   |
| Factories           | `make[Entidad]()` con overrides opcionales         |
| Mocks               | `jest.Mocked<Port>` para tipado fuerte             |
| Imports             | Path aliases `@modules/...` y `@shared/...`        |
| `beforeEach`        | Recrea instancias frescas en cada test             |
| Efectos secundarios | Siempre verificar que no ocurren en tests de error |

---

## Configuración

**`jest.config.js`** (vía `package.json`):

```json
{
  "jest": {
    "moduleNameMapper": {
      "^@modules/(.*)$": "<rootDir>/src/modules/$1",
      "^@shared/(.*)$": "<rootDir>/src/shared/$1"
    },
    "rootDir": ".",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "testEnvironment": "node"
  }
}
```

Los path aliases en tests (`@modules/`, `@shared/`) funcionan gracias
al `moduleNameMapper` de Jest — no requieren `tsconfig-paths`.

---

## Añadir un nuevo test

1. Crear el archivo en `test/modules/<módulo>/application/<use-cases|services>/`
2. Nombrar el archivo `<nombre>.use-case.spec.ts` o `<nombre>.service.spec.ts`
3. Importar la clase bajo test con path alias (`@modules/...`)
4. Crear factories para los datos de prueba
5. Mockear los ports con `jest.Mocked<Port>`
6. Cubrir: caso feliz, errores de negocio y efectos secundarios

### Checklist rápida para nuevos use cases

Cuando se añade un nuevo use case en `src/`, revisar si tiene test:

| Tipo de archivo          | ¿Necesita test? | Dónde                                          |
|--------------------------|-----------------|------------------------------------------------|
| `*.use-case.ts`          | ✅ Sí            | `test/modules/<módulo>/application/use-cases/` |
| `*.service.ts` (dominio) | ✅ Sí            | `test/modules/<módulo>/application/services/`  |
| Repositorios TypeORM     | ❌ No            | Se confía en TypeORM                           |
| Controllers              | ❌ No            | La validación la cubre class-validator         |
| Guards / decoradores     | ❌ No            | Infraestructura estable                        |

---

## Siguientes pasos

- Añadir tests para use cases de H2 (update restaurant, list admins, update restaurant status)
- Considerar tests de integración para el repositorio TypeORM en un entorno de BD en memoria
- Configurar cobertura mínima en CI con `--coverageThreshold`
- [Despliegue](./06-deployment.md)
- [Roadmap](./09-roadmap.md)
