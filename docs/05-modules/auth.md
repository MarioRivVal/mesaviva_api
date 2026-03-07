# Módulo Auth

Responsable de la autenticación de administradores mediante JWT
almacenado en cookie httpOnly.

---

## Estructura

```
auth/
├── application/
│   ├── dtos/
│   │   └── auth.dto.ts                    # Tipos de entrada/salida de use cases
│   └── use-cases/
│       ├── login.use-case.ts              # Lógica de autenticación
│       └── change-password.use-case.ts   # Cambio de contraseña
├── infrastructure/
│   ├── config/
│   │   └── jwt.config.ts                  # Configuración del módulo JWT
│   ├── controllers/
│   │   ├── dtos/
│   │   │   ├── login.http-dto.ts          # Validación HTTP del body de login
│   │   │   └── change-password.http-dto.ts # Validación HTTP del cambio de contraseña
│   │   └── auth.controller.ts             # Endpoints /auth/login, /auth/logout, /auth/change-password
│   └── strategies/
│       └── jwt.strategy.ts               # Estrategia Passport para verificar JWT
└── auth.module.ts
```

---

## Use Cases

### `LoginUseCase`

Valida las credenciales de un administrador y genera el JWT.

**Input:**

```typescript
interface LoginInput {
    email: string;
    password: string;
}
```

**Output:**

```typescript
interface LoginResult {
    accessToken: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: UserRole;
        mustChangePassword: boolean;
    };
}
```

**Flujo:**

1. Busca el usuario por email usando `findByEmailWithPassword()` — el único método que selecciona el `passwordHash`
2. Compara la contraseña con `PasswordHasherPort.compare()`
3. Si inválido → lanza `UnauthorizedError`
4. Si válido → genera JWT con `{ sub: userId, role }` via `JwtService`
5. Devuelve token y datos del usuario

> El token **no** se establece en cookie aquí — eso lo hace el controller.

---

## Estrategia JWT

`JwtStrategy` extiende `PassportStrategy` y verifica el token en cada
request a endpoints protegidos.

**Extrae el token de dos fuentes en orden:**

1. Cookie `auth_token` (opción preferida para el frontend)
2. Header `Authorization: Bearer <token>` (para Postman / integraciones)

**Validaciones en `validate(payload)`:**

- Busca el usuario por `payload.sub` en la base de datos
- Si el usuario no existe → `UnauthorizedException`
- Si `user.isActive === false` → `UnauthorizedException`
- Si todo OK → devuelve el objeto `User` (queda disponible en `request.user`)

---

## Controller

### `POST /auth/login`

- Llama a `LoginUseCase.execute()`
- Establece la cookie `auth_token` con el JWT
- Devuelve solo los datos del usuario (el token no va en el body)

**Cookie settings:**

| Flag       | Desarrollo | Producción |
|------------|------------|------------|
| `httpOnly` | ✅          | ✅          |
| `secure`   | ❌          | ✅          |
| `sameSite` | `strict`   | `strict`   |
| `maxAge`   | 7 días     | 7 días     |

### `POST /auth/logout`

- Limpia la cookie `auth_token` con `clearCookie()`
- Idempotente: funciona aunque no haya sesión activa
- No requiere autenticación

### `PATCH /auth/change-password`

- Protegido con `@Auth(SUPERADMIN, RESTAURANT_ADMIN)`
- Obtiene el usuario autenticado con `@CurrentUser()`
- Llama a `ChangePasswordUseCase.execute()`
- Devuelve `{ message: 'Password changed successfully' }`

---

## Use Case: `ChangePasswordUseCase`

Gestiona el cambio de contraseña de un administrador autenticado.

**Input:**

```typescript
interface ChangePasswordInput {
    currentUser: User;       // inyectado desde @CurrentUser()
    currentPassword: string;
    newPassword: string;
}
```

**Flujo:**

1. Valida la fortaleza de `newPassword` con `validatePasswordStrength()`
   (8 chars, mayús, minus, número, símbolo `!@#$%&*?-_`)
2. Carga el usuario con `findByEmailWithPassword()` para obtener el hash actual
3. Compara `currentPassword` con el hash → `BadRequestError` si incorrecto
4. Verifica que `newPassword !== currentPassword` → `BadRequestError` si son iguales
5. Hashea la nueva contraseña con `PasswordHasherPort.hash()`
6. Actualiza `user.passwordHash` y establece `user.mustChangePassword = false`
7. Persiste con `UserRepositoryPort.save()`

**Errores posibles:**

| Error             | Mensaje                                                |
|-------------------|--------------------------------------------------------|
| `BadRequestError` | `Password does not meet requirements: ...`             |
| `BadRequestError` | `Current password is incorrect`                        |
| `BadRequestError` | `New password must be different from current password` |

> `validatePasswordStrength` es una función pura en `@shared/domain/utils/`.
> Si la contraseña no cumple los requisitos, lanza un `BadRequestError`
> detallando exactamente qué condición no se cumple.

---

## Dependencias del módulo

```typescript
// auth.module.ts imports
JwtModule.registerAsync(...)   // configurado con JWT_SECRET y JWT_EXPIRATION
PassportModule
UsersModule                    // para acceder a UserRepositoryPort
SharedModule                   // para PasswordHasherPort
```

---

## Tests

| Archivo                            | Tests | Casos cubiertos                                                                                               |
|------------------------------------|-------|---------------------------------------------------------------------------------------------------------------|
| `login.use-case.spec.ts`           | 4     | Login OK, usuario inexistente, contraseña errónea, `mustChangePassword`                                       |
| `change-password.use-case.spec.ts` | 7     | Cambio OK, usuario no existe, contraseña incorrecta, igual a la actual, sin mayúscula, sin símbolo, fortaleza |

---

## Siguientes pasos

- [API — Auth](../04-api/auth.md)
- [Módulo Shared](./shared.md)

