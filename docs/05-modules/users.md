# Módulo Users

Gestión de administradores de la plataforma. Los comensales no tienen
cuenta — sus datos se almacenan directamente en la reserva.

---

## Estructura

```
users/
├── domain/
│   ├── entities/
│   │   └── user.entity.ts                      # Entidad de dominio User
│   ├── enums/
│   │   └── user-role.enum.ts                   # SUPERADMIN | RESTAURANT_ADMIN | USER
│   └── ports/
│       └── user.repository.port.ts             # Contrato del repositorio
├── application/
│   ├── dtos/
│   │   └── create-restaurant-admin.dto.ts      # Tipos de entrada/salida
│   └── use-cases/
│       └── create-restaurant-admin.use-case.ts # Lógica de creación
├── infrastructure/
│   ├── controllers/
│   │   ├── dtos/
│   │   │   └── create-restaurant-admin.http-dto.ts # Validación HTTP
│   │   └── users.controller.ts
│   └── persistence/
│       ├── user.orm-entity.ts                  # Entidad TypeORM
│       └── user.typeorm.repository.ts          # Implementación del repositorio
└── users.module.ts
```

---

## Entidad de dominio: `User`

```typescript
class User {
  readonly id: string;
  firstName: string;
  lastName: string;
  phone: string;
  readonly email: string;
  passwordHash: string;
  readonly role: UserRole;
  mustChangePassword: boolean;
  isActive: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  get fullName(): string  // firstName + lastName

  static create(params): User
}
```

**Notas de diseño:**

- `email` y `role` son `readonly` — no se pueden cambiar después de la creación
- `passwordHash` tiene `select: false` en la ORM entity — nunca se devuelve en queries normales
- `fullName` es un getter computado, no se persiste

---

## Port: `UserRepositoryPort`

```typescript
abstract class UserRepositoryPort {
    abstract findByEmail(email: string): Promise<User | null>;

    abstract findByEmailWithPassword(email: string): Promise<User | null>;

    abstract findById(id: string): Promise<User | null>;

    abstract findAllRestaurantAdmins(): Promise<User[]>;

    abstract save(user: User): Promise<User>;

    abstract delete(id: string): Promise<void>;
}
```

> `findByEmailWithPassword` es el único método que usa `QueryBuilder` con
> `.addSelect('user.passwordHash')` para obtener el hash en el login.

---

## Use Cases

### `CreateRestaurantAdminUseCase`

Crea un nuevo administrador de restaurante junto con su restaurante asociado.

**Input:**

```typescript
interface CreateRestaurantAdminInput {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    restaurantName: string;
    restaurantPhone: string;
    restaurantAddress: string;
    restaurantCategory: RestaurantCategory;
    restaurantEmail: string;
    restaurantImageUrl: string;
}
```

**Flujo:**

1. Verificar que el email no está registrado → `ConflictError` si existe
2. Generar contraseña temporal con `generateTemporaryPassword()`
3. Hashear con `PasswordHasherPort.hash()`
4. Generar slug desde el nombre del restaurante
5. Verificar unicidad del slug (sufijo `{timestamp}` si colisiona)
6. Crear y persistir `User`
7. Crear y persistir `Restaurant` — si falla, hace rollback del `User`
8. Enviar email de bienvenida con `EmailServicePort.sendWelcomeToNewAdmin()`
9. Devolver usuario, restaurante y contraseña temporal

**Mecanismo de rollback:**

```typescript
const savedUser = await this.userRepository.save(user);
try {
    savedRestaurant = await this.restaurantRepository.save(restaurant);
} catch (error) {
    await this.userRepository.delete(savedUser.id); // ← rollback
    throw error;
}
```

> No usa transacciones de BD — el rollback es manual. Suficiente para H1.

---

## Enum: `UserRole`

| Valor              | Descripción                                 |
|--------------------|---------------------------------------------|
| `SUPERADMIN`       | Acceso total. Gestiona la plataforma entera |
| `RESTAURANT_ADMIN` | Gestiona su restaurante y sus reservas      |
| `USER`             | Reservado para v3 (programa fidelización)   |

---

## Tests

| Archivo                                    | Cobertura                                                            |
|--------------------------------------------|----------------------------------------------------------------------|
| `create-restaurant-admin.use-case.spec.ts` | Creación OK, email duplicado, slug único, rollback, email bienvenida |

---

## Siguientes pasos

- [API — Users](../04-api/users.md)
- [Módulo Restaurants](./restaurants.md)

