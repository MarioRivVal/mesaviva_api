# API — Usuarios

Módulo responsable de la gestión de administradores de la plataforma.

**Base URL:** `/api/v1/users`

> Los comensales no tienen cuenta en el sistema. Sus datos
> se almacenan directamente en la reserva.

---

## Endpoints

| Método  | Ruta                       | Descripción                | Rol requerido                   |
|---------|----------------------------|----------------------------|---------------------------------|
| `POST`  | `/users/restaurant-admin`  | Crear admin de restaurante | `SUPERADMIN`                    |
| `GET`   | `/users/restaurant-admins` | Listar todos los admins    | `SUPERADMIN`                    |
| `GET`   | `/users/me`                | Ver mi perfil              | `RESTAURANT_ADMIN` `SUPERADMIN` |
| `PATCH` | `/users/:id`               | Actualizar admin           | `SUPERADMIN`                    |
| `PATCH` | `/users/:id/status`        | Activar / desactivar admin | `SUPERADMIN`                    |

---

## POST `/users/restaurant-admin`

Crea un nuevo administrador de restaurante junto con su restaurante.
Envía un email de bienvenida con las credenciales temporales.

### Auth requerida

```
@Auth(UserRole.SUPERADMIN)
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
  "email": "admin@restaurante.com",
  "firstName": "Mario",
  "lastName": "Rivera",
  "phone": "612345678",
  "restaurantName": "El Rincón Asturiano",
  "restaurantPhone": "985123456",
  "restaurantAddress": "Calle Mayor 1, Oviedo",
  "restaurantCategory": "RESTAURANT",
  "restaurantEmail": "info@rinconasturiano.com",
  "restaurantImageUrl": "https://res.cloudinary.com/mesaviva/image/upload/restaurants/abc123.jpg"
}
```

**Validaciones:**

| Campo                | Tipo     | Reglas                                            |
|----------------------|----------|---------------------------------------------------|
| `email`              | `string` | Formato email válido, requerido                   |
| `firstName`          | `string` | Mínimo 2 caracteres, requerido                    |
| `lastName`           | `string` | Mínimo 2 caracteres, requerido                    |
| `phone`              | `string` | Teléfono español válido (fijo o móvil)            |
| `restaurantName`     | `string` | Mínimo 2 caracteres, requerido                    |
| `restaurantPhone`    | `string` | Teléfono español válido (fijo o móvil)            |
| `restaurantAddress`  | `string` | Mínimo 5 caracteres, requerido                    |
| `restaurantCategory` | `enum`   | `RESTAURANT` \| `BAR` \| `BREWERY` \| `TEA_HOUSE` |
| `restaurantEmail`    | `string` | Formato email válido, requerido                   |
| `restaurantImageUrl` | `string` | URL válida (previamente subida a Cloudinary)      |

**Formato teléfono español:**

```
612345678       ← móvil sin prefijo   ✅
+34612345678    ← móvil con prefijo   ✅
985123456       ← fijo Asturias       ✅
+34985123456    ← fijo con prefijo    ✅
```

### Respuestas

**✅ 201 Created**

```json
{
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "admin@restaurante.com",
    "firstName": "Mario",
    "lastName": "Rivera",
    "phone": "612345678",
    "role": "RESTAURANT_ADMIN",
    "mustChangePassword": true
  },
  "restaurant": {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "name": "El Rincón Asturiano",
    "slug": "el-rincon-asturiano",
    "adminId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "phone": "985123456",
    "address": "Calle Mayor 1, Oviedo",
    "category": "RESTAURANT",
    "email": "info@rinconasturiano.com",
    "imageUrl": "https://res.cloudinary.com/mesaviva/image/upload/restaurants/abc123.jpg"
  },
  "temporaryPassword": "Xk3#mP9qRs"
}
```

> ⚠️ `temporaryPassword` solo aparece en la respuesta de creación.
> Se envía también por email al administrador.
> El frontend debe mostrarlo al superadmin para que pueda comunicárselo
> al restaurante en caso de que el email no llegue.

**❌ 409 Conflict — Email ya registrado**

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "User with email admin@restaurante.com already exists",
  "timestamp": "2026-02-25T10:00:00.000Z",
  "path": "/api/v1/users/restaurant-admin"
}
```

**❌ 401 Unauthorized — Sin sesión**

```json
{
  "statusCode": 401,
  "error": "UnauthorizedException",
  "message": "Invalid or missing token",
  "timestamp": "2026-02-25T10:00:00.000Z",
  "path": "/api/v1/users/restaurant-admin"
}
```

**❌ 403 Forbidden — Rol insuficiente**

```json
{
  "statusCode": 403,
  "error": "ForbiddenException",
  "message": "Access denied. Required roles: SUPERADMIN",
  "timestamp": "2026-02-25T10:00:00.000Z",
  "path": "/api/v1/users/restaurant-admin"
}
```

**❌ 400 Bad Request — Validación fallida**

```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": "phone must match /^(\\+34|0034)?[6789]\\d{8}$/ regular expression",
  "timestamp": "2026-02-25T10:00:00.000Z",
  "path": "/api/v1/users/restaurant-admin"
}
```

### Flujo interno

```
1. Verificar JWT + rol SUPERADMIN
2. Comprobar que el email no existe
3. Generar contraseña temporal (12 chars, mayús + minus + num + símbolo)
4. Hashear contraseña con bcrypt (saltRounds: 10)
5. Generar slug desde el nombre del restaurante
6. Verificar unicidad del slug (añadir sufijo si colisiona)
7. Crear entidad User con static create()
8. Persistir User
9. Crear entidad Restaurant con static create()
10. Persistir Restaurant (rollback de User si falla)
11. Enviar email de bienvenida con Resend
12. Devolver resultado
```

---

## GET `/users/restaurant-admins`

Lista todos los administradores de restaurante.

> 🚧 **Pendiente de implementación — H2**

### Auth requerida

```
@Auth(UserRole.SUPERADMIN)
Cookie: auth_token=<jwt>
```

### Respuesta esperada

**✅ 200 OK**

```json
{
  "admins": [
    {
      "id": "a1b2c3d4-...",
      "email": "admin@restaurante.com",
      "firstName": "Mario",
      "lastName": "Rivera",
      "phone": "612345678",
      "role": "RESTAURANT_ADMIN",
      "isActive": true,
      "createdAt": "2026-02-25T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

Los administradores se ordenan por `createdAt DESC` (más recientes primero).

---

## GET `/users/me`

Devuelve el perfil del usuario autenticado.

> 🚧 **Pendiente de implementación — H2**

### Auth requerida

```
@Auth(UserRole.RESTAURANT_ADMIN, UserRole.SUPERADMIN)
```

### Respuesta esperada

**✅ 200 OK**

```json
{
  "id": "a1b2c3d4-...",
  "email": "admin@restaurante.com",
  "firstName": "Mario",
  "lastName": "Rivera",
  "phone": "612345678",
  "role": "RESTAURANT_ADMIN",
  "isActive": true,
  "createdAt": "2026-02-25T10:00:00.000Z"
}
```

---

## PATCH `/users/:id`

Actualiza los datos de un administrador.

> 🚧 **Pendiente de implementación — H2**

### Auth requerida

```
@Auth(UserRole.SUPERADMIN)
```

### Request

```json
{
  "firstName": "Mario",
  "lastName": "Rivera Valverde",
  "phone": "698765432"
}
```

Todos los campos son opcionales. Solo se actualizan los enviados.

### Respuesta esperada

**✅ 200 OK** — Devuelve el usuario actualizado.

**❌ 404 Not Found** — Si el ID no existe.

---

## PATCH `/users/:id/status`

Activa o desactiva la cuenta de un administrador.
Un administrador desactivado no puede iniciar sesión.

> 🚧 **Pendiente de implementación — H2**

### Auth requerida

```
@Auth(UserRole.SUPERADMIN)
```

### Request

No requiere body. El estado se invierte automáticamente (`toggle`).

### Respuesta esperada

**✅ 200 OK**

```json
{
  "id": "a1b2c3d4-...",
  "isActive": false,
  "updatedAt": "2026-02-25T10:00:00.000Z"
}
```

**❌ 404 Not Found** — Si el ID no existe.

---

## Modelo de datos

### User

```typescript
{
    id: string;              // UUID v4
    email: string;           // único en la plataforma
    firstName: string;
    lastName: string;
    phone: string;           // teléfono español
    role: UserRole;          // SUPERADMIN | RESTAURANT_ADMIN | USER
    mustChangePassword: boolean;
    isActive: boolean;
    createdAt: Date;         // UTC
    updatedAt: Date;         // UTC
}
```

> `passwordHash` nunca se expone en ningún endpoint.

### UserRole

| Valor              | Descripción                                  |
|--------------------|----------------------------------------------|
| `SUPERADMIN`       | Gestión completa de la plataforma            |
| `RESTAURANT_ADMIN` | Gestión de su restaurante y reservas         |
| `USER`             | Reservado para v3 (programa de fidelización) |

---

## Siguientes pasos

- [API — Restaurants](./restaurants.md)
- [API — Settings](./settings.md)
- [Módulo Users](../05-modules/users.md)
- [Roadmap H2](../09-roadmap.md)
