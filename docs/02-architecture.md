# Arquitectura

MesaViva API implementa **Arquitectura Hexagonal** (también conocida como
Ports & Adapters), organizada en módulos de negocio independientes sobre
el framework **NestJS**.

---

## ¿Por qué Arquitectura Hexagonal?

La elección de este patrón responde a tres objetivos concretos:

| Objetivo          | Cómo lo resuelve hexagonal                                                             |
|-------------------|----------------------------------------------------------------------------------------|
| **Escalabilidad** | Módulos independientes que crecen sin afectarse entre sí                               |
| **Testabilidad**  | El dominio no depende de frameworks — se testea en aislamiento                         |
| **Flexibilidad**  | Cambiar Resend por SendGrid, o Stripe por otro proveedor, no toca la lógica de negocio |

---

## Las tres capas

Cada módulo se divide en exactamente tres capas con una regla estricta
de dependencias:

```
┌─────────────────────────────────────┐
│         infrastructure/             │  ← conoce todo
│  controllers · ORM · APIs externas  │
├─────────────────────────────────────┤
│           application/              │  ← conoce domain
│         casos de uso · DTOs         │
├─────────────────────────────────────┤
│             domain/                 │  ← no conoce nada externo
│    entidades · ports · enums        │
└─────────────────────────────────────┘
```

### Regla de dependencias

```
domain      → no importa nada de NestJS ni TypeORM
application → solo importa de domain
infrastructure → puede importar todo
```

> Si un use case necesita enviar un email, no importa Resend directamente.
> Define un **port** (interfaz abstracta) y la infrastructure provee la implementación.
> Esto es la esencia de Ports & Adapters.

---

## Estructura completa del proyecto

```
src/
├── modules/
│   ├── auth/
│   │   ├── application/
│   │   │   ├── dtos/
│   │   │   │   └── login.dto.ts
│   │   │   └── use-cases/
│   │   │       └── login.use-case.ts
│   │   ├── infrastructure/
│   │   │   ├── config/
│   │   │   │   └── jwt.config.ts
│   │   │   ├── controllers/
│   │   │   │   ├── dtos/
│   │   │   │   │   └── login.http-dto.ts
│   │   │   │   └── auth.controller.ts
│   │   │   └── strategies/
│   │   │       └── jwt.strategy.ts
│   │   └── auth.module.ts
│   │
│   ├── users/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   ├── enums/
│   │   │   │   └── user-role.enum.ts
│   │   │   └── ports/
│   │   │       └── user.repository.port.ts
│   │   ├── application/
│   │   │   ├── dtos/
│   │   │   │   └── create-restaurant-admin.dto.ts
│   │   │   └── use-cases/
│   │   │       └── create-restaurant-admin.use-case.ts
│   │   ├── infrastructure/
│   │   │   ├── controllers/
│   │   │   │   ├── dtos/
│   │   │   │   │   └── create-restaurant-admin.http-dto.ts
│   │   │   │   └── users.controller.ts
│   │   │   └── persistence/
│   │   │       ├── user.orm-entity.ts
│   │   │       └── user.typeorm.repository.ts
│   │   └── users.module.ts
│   │
│   ├── restaurants/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── restaurant.entity.ts
│   │   │   ├── enums/
│   │   │   │   └── restaurant-category.enum.ts
│   │   │   └── ports/
│   │   │       └── restaurant.repository.port.ts
│   │   ├── infrastructure/
│   │   │   └── persistence/
│   │   │       ├── restaurant.orm-entity.ts
│   │   │       └── restaurant.typeorm.repository.ts
│   │   └── restaurants.module.ts
│   │
│   ├── settings/          # Configuración operativa (H1)
│   ├── reservations/      # Gestión de reservas (H1)
│   ├── payments/          # Stripe — depósito (H3)
│   │
│   └── notifications/
│       ├── application/
│       │   └── ports/
│       │       └── email.service.port.ts
│       ├── infrastructure/
│       │   └── resend/
│       │       ├── templates/
│       │       │   ├── welcome-admin.template.ts
│       │       │   ├── reservation-accepted.template.ts
│       │       │   ├── reservation-rejected.template.ts
│       │       │   └── new-reservation-admin.template.ts
│       │       └── resend-email.service.ts
│       └── notifications.module.ts
│
├── shared/
│   ├── domain/
│   │   ├── constants/
│   │   │   └── validation.constants.ts
│   │   ├── errors/
│   │   │   └── domain.errors.ts
│   │   ├── ports/
│   │   │   └── password-hasher.port.ts
│   │   └── utils/
│   │       ├── generate-slug.util.ts
│   │       └── password-generator.util.ts
│   ├── infrastructure/
│   │   ├── config/
│   │   │   └── pipes.config.ts
│   │   ├── database/
│   │   │   └── typeorm.config.ts
│   │   ├── decorators/
│   │   │   ├── auth.decorator.ts
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── filters/
│   │   │   └── domain-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── services/
│   │       └── bcrypt-password-hasher.service.ts
│   └── shared.module.ts
│
└── database/
  └── seeds/
      ├── seed.ts
      └── superadmin.seed.ts
```

---

## Patrones implementados

### Repository Pattern

El dominio define un **port** (clase abstracta) que declara el contrato
de acceso a datos. La infrastructure provee la implementación concreta con TypeORM.

```typescript
// domain/ports/user.repository.port.ts — contrato
export abstract class UserRepositoryPort {
    abstract findByEmail(email: string): Promise<User | null>;

    abstract save(user: User): Promise<User>;

// ...
}

// infrastructure/persistence/user.typeorm.repository.ts — implementación
export class UserTypeOrmRepository extends UserRepositoryPort {
    async findByEmail(email: string): Promise<User | null> {
        // lógica TypeORM
    }
}
```

### Use Case Pattern

Cada operación de negocio es un caso de uso con un único método `execute()`.
Recibe un input tipado y devuelve un resultado tipado.

```typescript
export class CreateRestaurantAdminUseCase {
    async execute(input: CreateRestaurantAdminInput): Promise<CreateRestaurantAdminResult> {
        // orquesta dominio, repositorios, emails
    }
}
```

### Static Factory Method

Las entidades de dominio exponen un método estático `create()` con
parámetros nombrados para evitar errores de orden en constructores
con muchos argumentos.

```typescript
// ❌ frágil — fácil equivocarse el orden
new Restaurant(id, name, adminId, phone, address, ...)

// ✅ robusto — el orden no importa
Restaurant.create({id, name, adminId, phone, address, ...})
```

### Dependency Injection con Ports

Los use cases inyectan el **port** (interfaz), no la implementación concreta.
NestJS resuelve la implementación en el módulo mediante `provide/useClass`.

```typescript
// use case — solo conoce el port
constructor(private
readonly
emailService: EmailServicePort
)
{
}

// módulo — resuelve la implementación
{
    provide: EmailServicePort,
        useClass
:
    ResendEmailService,
}
```

---

## Gestión de errores

### Errores de dominio

Los use cases lanzan errores de dominio (sin dependencia de NestJS):

```typescript
// shared/domain/errors/domain.errors.ts
export class ConflictError extends DomainError {
}

export class NotFoundError extends DomainError {
}

export class BadRequestError extends DomainError {
}

export class UnauthorizedError extends DomainError {
}

export class ForbiddenError extends DomainError {
}
```

### Exception Filter global

Un filtro centralizado en `shared/infrastructure/filters/` captura
todos los errores y los transforma en respuestas HTTP consistentes:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "User with email admin@test.com already exists",
  "timestamp": "2026-02-25T10:00:00.000Z",
  "path": "/api/v1/users/restaurant-admin"
}
```

---

## Seguridad

### Autenticación

- JWT almacenado en **cookie httpOnly** para prevenir ataques XSS
- La cookie acepta también `Authorization: Bearer <token>` para clientes que no soporten cookies
- Estrategia Passport JWT implementada en `auth/infrastructure/strategies/`

### Autorización

Control de acceso basado en roles (RBAC) mediante dos guards combinados
en un único decorador:

```typescript
// ❌ verboso
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN)
@Post('restaurant-admin')

// ✅ con el decorador @Auth()
@Auth(UserRole.SUPERADMIN)
@Post('restaurant-admin')
```

### Rate Limiting

El endpoint de login tiene protección contra fuerza bruta:

```typescript
@Throttle({default: {limit: 5, ttl: 60000}}) // 5 intentos por minuto
@Post('login')
```

---

## Convenciones de código

### Naming

| Elemento         | Convención           | Ejemplo                      |
|------------------|----------------------|------------------------------|
| Archivos         | kebab-case           | `user.orm-entity.ts`         |
| Clases           | PascalCase           | `UserTypeOrmRepository`      |
| Interfaces/Types | PascalCase           | `CreateRestaurantAdminInput` |
| Enums            | PascalCase           | `UserRole`                   |
| Valores de enum  | SCREAMING_SNAKE_CASE | `RESTAURANT_ADMIN`           |
| Métodos          | camelCase            | `findByEmail()`              |
| Variables        | camelCase            | `tempPassword`               |

### Path aliases

```typescript
import {ConflictError} from '@shared/domain/errors/domain.errors';
import {UserRepositoryPort} from '@modules/users/domain/ports/user.repository.port';
```

| Alias        | Resuelve a      |
|--------------|-----------------|
| `@shared/*`  | `src/shared/*`  |
| `@modules/*` | `src/modules/*` |

---

## Decisiones técnicas destacadas

### ¿Por qué PostgreSQL y no MongoDB?

Los datos de MesaViva son relacionales por naturaleza — reservas vinculadas
a restaurantes, configuraciones vinculadas a franjas horarias. PostgreSQL
ofrece integridad referencial y soporte nativo para zonas horarias (`timestamptz`).

### ¿Por qué timestamps en UTC en la BD?

Todos los timestamps se almacenan en UTC (`timestamptz`) y el frontend
los transforma a la zona horaria del usuario. Esto permite que la plataforma
funcione correctamente en cualquier mercado europeo.

### ¿Por qué cookies httpOnly y no localStorage?

Las cookies httpOnly no son accesibles desde JavaScript, lo que las hace
inmunes a ataques XSS. localStorage, en cambio, es accesible por cualquier
script en la página.

### ¿Por qué Stripe y no otros proveedores de pago?

Stripe es el proveedor con mejor documentación y APIs más maduras para
el mercado europeo. Soporta SEPA, tarjetas, y el concepto de `PaymentIntent`
encaja perfectamente con el modelo de depósito/seña de MesaViva.

---

## Siguientes pasos

- [Base de datos — entidades y relaciones](./03-database.md)
- [API Reference](./04-api/auth.md)
