# API — Autenticación

Módulo responsable de la autenticación de administradores mediante
**JWT almacenado en cookie httpOnly**.

**Base URL:** `/api/v1/auth`

---

## Endpoints

| Método  | Ruta                    | Descripción                       | Auth                            |
|---------|-------------------------|-----------------------------------|---------------------------------|
| `POST`  | `/auth/login`           | Iniciar sesión                    | ❌ Público                       |
| `POST`  | `/auth/logout`          | Cerrar sesión                     | ❌ Público                       |
| `PATCH` | `/auth/change-password` | Cambiar contraseña (primer login) | `RESTAURANT_ADMIN` `SUPERADMIN` |

---

## POST `/auth/login`

Autentica a un administrador y establece la cookie de sesión.

### Rate limiting

Máximo **5 intentos por minuto** por IP. Superado el límite devuelve `429`.

### Request

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "email": "superadmin@mesaviva.com",
  "password": "SuperAdmin123!"
}
```

**Validaciones:**

```
| Campo      | Tipo     | Reglas                          |
|------------|----------|---------------------------------|
| `email`    | `string` | Formato email válido, requerido |
| `password` | `string` | No vacío, requerido             |
```

### Respuestas

**✅ 200 OK — Login correcto**

```json
{
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "superadmin@mesaviva.com",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "SUPERADMIN",
    "mustChangePassword": false
  }
}
```

El token JWT se establece automáticamente como cookie httpOnly:

```
Set-Cookie: auth_token=eyJhbGciOiJIUzI1NiJ9...; 
          HttpOnly; 
          SameSite=Strict; 
          Max-Age=604800
```

> En producción se añade también el flag `Secure` (solo HTTPS).

---

**❌ 401 Unauthorized — Credenciales incorrectas**

```json
{
  "statusCode": 401,
  "error": "UnauthorizedError",
  "message": "Datos de acceso incorrectos",
  "timestamp": "2026-02-25T10:00:00.000Z",
  "path": "/api/v1/auth/login"
}
```

**❌ 400 Bad Request — Validación fallida**

```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": "email must be an email",
  "timestamp": "2026-02-25T10:00:00.000Z",
  "path": "/api/v1/auth/login"
}
```

**❌ 429 Too Many Requests — Rate limit superado**

```json
{
  "statusCode": 429,
  "error": "ThrottlerException",
  "message": "Too Many Requests",
  "timestamp": "2026-02-25T10:00:00.000Z",
  "path": "/api/v1/auth/login"
}
```

### Flujo interno

```
1. Validar body con class-validator
2. Buscar usuario por email (con passwordHash seleccionado)
3. Comparar password con bcrypt
4. Si inválido → lanzar UnauthorizedError
5. Si válido → generar JWT con { sub: userId, role }
6. Establecer cookie httpOnly con el token
7. Devolver datos del usuario
```

---

## POST `/auth/logout`

Elimina la cookie de sesión del cliente.

### Request

No requiere body ni autenticación previa.
Si no hay sesión activa, la operación se completa igualmente (idempotente).

### Respuestas

**✅ 200 OK**

```json
{
  "message": "Logged out successfully"
}
```

La cookie se elimina en la respuesta:

```
Set-Cookie: auth_token=; 
          HttpOnly; 
          SameSite=Strict; 
          Max-Age=0
```

---

## PATCH `/auth/change-password`

Permite a un administrador cambiar su contraseña. Es obligatorio
completar este paso cuando `mustChangePassword: true` (primer login
con contraseña temporal).

El sistema valida también que la nueva contraseña cumpla los requisitos
de fortaleza y que sea diferente a la actual.

### Auth requerida

```
@Auth(UserRole.SUPERADMIN, UserRole.RESTAURANT_ADMIN)
Cookie: auth_token=<jwt>
```

### Request

**Headers:**

```
Content-Type: application/json
Cookie: auth_token=<jwt>
```

**Body:**

```json
{
  "currentPassword": "TempPassword123!",
  "newPassword": "MiNuevaContraseña2026!"
}
```

**Validaciones:**

| Campo             | Tipo     | Reglas                                                                           |
|-------------------|----------|----------------------------------------------------------------------------------|
| `currentPassword` | `string` | Requerido                                                                        |
| `newPassword`     | `string` | Mínimo 8 chars, ≥1 mayúscula, ≥1 minúscula, ≥1 número, ≥1 símbolo (`!@#$%&*?-_`) |

### Respuestas

**✅ 200 OK — Contraseña actualizada**

```json
{
  "message": "Password changed successfully"
}
```

Tras el cambio exitoso, `mustChangePassword` se establece a `false`.

**❌ 400 Bad Request — Contraseña actual incorrecta**

```json
{
  "statusCode": 400,
  "error": "BadRequestError",
  "message": "Current password is incorrect",
  "timestamp": "2026-02-25T10:00:00.000Z",
  "path": "/api/v1/auth/change-password"
}
```

**❌ 400 Bad Request — Nueva contraseña igual a la actual**

```json
{
  "statusCode": 400,
  "error": "BadRequestError",
  "message": "New password must be different from current password",
  "timestamp": "2026-02-25T10:00:00.000Z",
  "path": "/api/v1/auth/change-password"
}
```

**❌ 400 Bad Request — Contraseña no cumple requisitos de fortaleza**

```json
{
  "statusCode": 400,
  "error": "BadRequestError",
  "message": "Password does not meet requirements: at least one uppercase letter, at least one symbol (!@#$%&*?-_)",
  "timestamp": "2026-02-25T10:00:00.000Z",
  "path": "/api/v1/auth/change-password"
}
```

### Flujo interno

```
1. Verificar JWT + usuario activo
2. Validar fortaleza de newPassword (8 chars, mayús, minus, número, símbolo)
3. Cargar usuario con passwordHash (findByEmailWithPassword)
4. Comparar currentPassword con hash almacenado → 400 si incorrecto
5. Verificar que newPassword !== currentPassword → 400 si son iguales
6. Hashear newPassword con bcrypt
7. Actualizar passwordHash y mustChangePassword = false
8. Persistir cambios
9. Devolver confirmación
```

---

## Uso del token en endpoints protegidos

El token JWT puede enviarse de dos formas:

### Opción A — Cookie automática (recomendada para el frontend)

El navegador envía la cookie automáticamente en cada request
al mismo dominio. No requiere ninguna configuración adicional.

```javascript
// fetch del frontend — la cookie se envía automáticamente
fetch('/api/v1/users/restaurant-admin', {
    method: 'POST',
    credentials: 'include',   // ← necesario para enviar cookies
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
})
```

### Opción B — Authorization header (para Postman / clientes externos)

```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

---

## JWT Payload

El token contiene el siguiente payload:

```json
{
  "sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "role": "SUPERADMIN",
  "iat": 1740484800,
  "exp": 1741089600
}
```

| Campo  | Descripción                          |
|--------|--------------------------------------|
| `sub`  | ID del usuario                       |
| `role` | Rol del usuario                      |
| `iat`  | Fecha de emisión (Unix timestamp)    |
| `exp`  | Fecha de expiración (Unix timestamp) |

---

## Campo `mustChangePassword`

Cuando un `RESTAURANT_ADMIN` es creado por un `SUPERADMIN`, recibe
una contraseña temporal y `mustChangePassword: true`.

El frontend debe redirigir al usuario a la pantalla de cambio de
contraseña si este campo es `true`.

```json
{
  "user": {
    "mustChangePassword": true
    // ← redirigir a cambio de password
  }
}
```

---

## Seguridad

| Medida          | Implementación                           |
|-----------------|------------------------------------------|
| Cookie httpOnly | Previene acceso desde JavaScript (XSS)   |
| SameSite Strict | Previene ataques CSRF                    |
| Secure flag     | Solo HTTPS en producción                 |
| Rate limiting   | 5 intentos/min por IP (fuerza bruta)     |
| bcrypt          | Hash de contraseñas con salt rounds = 10 |
| JWT firmado     | Secret definido en variables de entorno  |

---

## Siguientes pasos

- [API — Users](./users.md)
- [API — Restaurants](./restaurants.md)