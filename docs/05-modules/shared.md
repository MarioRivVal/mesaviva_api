# Módulo Shared

El módulo `shared` contiene toda la infraestructura transversal
que utilizan el resto de módulos. No pertenece a ningún dominio
de negocio concreto.

---

## Principio de inclusión

Un elemento va a `shared` si cumple **al menos una** de estas condiciones:

- Lo usan **dos o más módulos**
- Es infraestructura técnica sin lógica de negocio
- Define un **contrato** (port) que múltiples módulos deben implementar

---

## Estructura

```
shared/
├── domain/
│   ├── constants/
│   │   └── validation.constants.ts
│   ├── errors/
│   │   └── domain.errors.ts
│   ├── ports/
│   │   └── password-hasher.port.ts
│   └── utils/
│       ├── generate-slug.util.ts
│       └── password-generator.util.ts
├── infrastructure/
│   ├── config/
│   │   └── pipes.config.ts
│   ├── database/
│   │   └── typeorm.config.ts
│   ├── decorators/
│   │   ├── auth.decorator.ts
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── filters/
│   │   └── domain-exception.filter.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   └── services/
│       └── bcrypt-password-hasher.service.ts
└── shared.module.ts
```

---

## Domain

### `constants/validation.constants.ts`

Expresiones regulares y mensajes de validación reutilizables
en los DTOs HTTP de todos los módulos.

```typescript
import {
    PHONE_SPAIN_PATTERN,
    PHONE_SPAIN_MESSAGE,
} from '@shared/domain/constants/validation.constants';

// uso en DTOs
@Matches(PHONE_SPAIN_PATTERN, {message: PHONE_SPAIN_MESSAGE})
phone
:
string;
```

| Constante             | Descripción                                    |
|-----------------------|------------------------------------------------|
| `PHONE_SPAIN_PATTERN` | Regex para teléfonos españoles fijos y móviles |
| `PHONE_SPAIN_MESSAGE` | Mensaje de error estandarizado                 |

**Formato válido:**

```
612345678       ← móvil sin prefijo
+34612345678    ← móvil con prefijo
985123456       ← fijo
+34985123456    ← fijo con prefijo
```

---

### `errors/domain.errors.ts`

Todos los errores de dominio en un único archivo.
Los use cases lanzan estos errores — nunca excepciones de NestJS.

```typescript
import {
    ConflictError,
    NotFoundError,
} from '@shared/domain/errors/domain.errors';

// uso en use cases
throw new ConflictError('User with email already exists');
throw new NotFoundError('Restaurant', id);
```

| Error               | HTTP | Uso                        |
|---------------------|------|----------------------------|
| `DomainErrors`      | —    | Clase base abstracta       |
| `ConflictError`     | 409  | Recurso ya existe          |
| `NotFoundError`     | 404  | Recurso no encontrado      |
| `BadRequestError`   | 400  | Datos inválidos de negocio |
| `UnauthorizedError` | 401  | Sin autenticación          |
| `ForbiddenError`    | 403  | Sin permisos               |

> Los errores de dominio son clases TypeScript puras — sin imports de NestJS.
> El `DomainExceptionFilter` los intercepta y los transforma en respuestas HTTP.

---

### `ports/password-hasher.port.ts`

Contrato para el servicio de hash de contraseñas.
Permite cambiar la implementación (bcrypt, argon2...) sin tocar los use cases.

```typescript
// uso en use cases
constructor(private
readonly
passwordHasher: PasswordHasherPort
)
{
}

const hash = await this.passwordHasher.hash('password123');
const isValid = await this.passwordHasher.compare('password123', hash);
```

| Método                    | Descripción                  |
|---------------------------|------------------------------|
| `hash(password)`          | Genera hash bcrypt           |
| `compare(password, hash)` | Compara password con su hash |

---

### `utils/generate-slug.util.ts`

Función pura que transforma un texto en un slug URL-friendly.
Maneja correctamente caracteres españoles (acentos, ñ).

```typescript
import {generateSlug} from '@shared/domain/utils/generate-slug.util';

generateSlug('El Rincón Asturiano')  // → 'el-rincon-asturiano'
generateSlug('Café & Bar Oviedo')    // → 'cafe-bar-oviedo'
generateSlug('La Sidrería Güeña')   // → 'la-sidreira-guena'
```

**Transformaciones aplicadas:**

1. Convertir a minúsculas
2. Descomponer caracteres acentuados (NFD) y eliminar diacríticos
3. Reemplazar `ñ` → `n`
4. Eliminar caracteres no alfanuméricos excepto espacios y guiones
5. Reemplazar espacios por guiones

---

### `utils/password-generator.util.ts`

Función pura que genera contraseñas temporales seguras.

```typescript
import {generateTemporaryPassword} from '@shared/domain/utils/password-generator.util';

const password = generateTemporaryPassword();     // longitud 12 (default)
const password = generateTemporaryPassword(16);   // longitud personalizada
```

**Garantías:**

- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número
- Al menos 1 símbolo (`!@#$%&*?-_`)
- Orden aleatorio (shuffle Fisher-Yates)

> No usa `@Injectable()` — es una función pura sin estado ni dependencias.
> Se importa directamente, no se inyecta.

---

## Infrastructure

### `config/pipes.config.ts`

Configura el `ValidationPipe` global de NestJS.
Se registra una sola vez en `main.ts`.

```typescript
// main.ts
globalPipesConfig(app);
```

**Opciones activas:**

| Opción                 | Valor  | Efecto                                 |
|------------------------|--------|----------------------------------------|
| `whitelist`            | `true` | Elimina campos no declarados en el DTO |
| `forbidNonWhitelisted` | `true` | Lanza error si hay campos extra        |
| `transform`            | `true` | Transforma tipos automáticamente       |

---

### `database/typeorm.config.ts`

Factory de configuración de TypeORM leída desde variables de entorno.
Se usa en `app.module.ts` con `TypeOrmModule.forRootAsync()`.

```typescript
// app.module.ts
TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: getTypeOrmConfig,
})
```

---

### `decorators/auth.decorator.ts`

Combina `JwtAuthGuard` + `RolesGuard` + `@Roles()` en un único decorador.

```typescript
import {Auth} from '@shared/infrastructure/decorators/auth.decorator';
import {UserRole} from '@modules/users/domain/enums/user-role.enum';

// ❌ antes — verboso
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN)
@Post('restaurant-admin')

// ✅ ahora
@Auth(UserRole.SUPERADMIN)
@Post('restaurant-admin')

// múltiples roles
@Auth(UserRole.SUPERADMIN, UserRole.RESTAURANT_ADMIN)
@Get('me')
```

---

### `decorators/current-user.decorator.ts`

Extrae el usuario autenticado del request en los controllers.

```typescript
import {CurrentUser} from '@shared/infrastructure/decorators/current-user.decorator';

@Get('me')
@Auth(UserRole.RESTAURANT_ADMIN)
getProfile(@CurrentUser()
user: User
)
{
    return user;
}
```

---

### `decorators/roles.decorator.ts`

Define los roles requeridos para un endpoint.
Usado internamente por `@Auth()` — normalmente no se usa directamente.

```typescript
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

---

### `filters/domain-exception.filter.ts`

Filtro global que intercepta **todos** los errores de la aplicación
y los transforma en respuestas HTTP consistentes.

**Jerarquía de manejo:**

```
1. HttpException de NestJS  → pasa tal cual con su status code
2. ConflictError            → 409 Conflict
3. NotFoundError            → 404 Not Found
4. BadRequestError          → 400 Bad Request
5. UnauthorizedError        → 401 Unauthorized
6. ForbiddenError           → 403 Forbidden
7. Cualquier otro error     → 500 Internal Server Error
```

**Formato de respuesta estándar:**

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "User with email admin@test.com already exists",
  "timestamp": "2026-02-25T10:00:00.000Z",
  "path": "/api/v1/users/restaurant-admin"
}
```

Los errores `5xx` se loguean automáticamente con el stack trace
usando el `Logger` de NestJS.

---

### `guards/jwt-auth.guard.ts`

Verifica que el request incluya un JWT válido.
Acepta el token desde **cookie httpOnly** o **Authorization header**.

```
Cookie: auth_token=<jwt>
Authorization: Bearer <jwt>
```

Lanza `401 Unauthorized` si el token es inválido o está ausente.

---

### `guards/roles.guard.ts`

Verifica que el usuario autenticado tenga el rol requerido.
Lee los roles del decorador `@Roles()` mediante `Reflector`.

Lanza `403 Forbidden` si el rol no coincide.

---

### `services/bcrypt-password-hasher.service.ts`

Implementación concreta del `PasswordHasherPort` usando **bcrypt**.

| Parámetro   | Valor  |
|-------------|--------|
| Salt rounds | `10`   |
| Algoritmo   | bcrypt |

Se registra en `SharedModule` vinculado al port:

```typescript
// shared.module.ts
{
    provide: PasswordHasherPort,
        useClass
:
    BcryptPasswordHasher,
}
```

Los módulos que necesiten hashear contraseñas importan `SharedModule`
e inyectan `PasswordHasherPort` — nunca `BcryptPasswordHasher` directamente.

---

## SharedModule

```typescript

@Module({
    providers: [
        {
            provide: PasswordHasherPort,
            useClass: BcryptPasswordHasher,
        },
    ],
    exports: [PasswordHasherPort],
})
export class SharedModule {
}
```

**Importado en:**

- `AppModule` — disponible globalmente
- `AuthModule` — para comparar passwords en login
- `UsersModule` — para hashear passwords al crear admins

---

## Path aliases

Todos los imports desde `shared` usan el alias `@shared`:

```typescript
import {ConflictError} from '@shared/domain/errors/domain.errors';
import {Auth} from '@shared/infrastructure/decorators/auth.decorator';
import {generateSlug} from '@shared/domain/utils/generate-slug.util';
```

Configurado en `tsconfig.json`:

```json
{
  "paths": {
    "@shared/*": [
      "src/shared/*"
    ],
    "@modules/*": [
      "src/modules/*"
    ]
  }
}
```

