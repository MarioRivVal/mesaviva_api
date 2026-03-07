# Referencia de errores

Catálogo completo de todos los errores que puede devolver la API,
con sus códigos HTTP, mensajes y contexto de uso.

---

## Formato estándar de error

Todos los errores siguen la misma estructura JSON:

```json
{
  "statusCode": 409,
  "error": "ConflictError",
  "message": "User with email admin@restaurante.com already exists",
  "timestamp": "2026-03-01T10:00:00.000Z",
  "path": "/api/v1/users/restaurant-admin"
}
```

| Campo        | Tipo     | Descripción                               |
|--------------|----------|-------------------------------------------|
| `statusCode` | `number` | Código HTTP del error                     |
| `error`      | `string` | Tipo de error (clase de dominio o NestJS) |
| `message`    | `string` | Descripción legible del error             |
| `timestamp`  | `string` | Fecha/hora en UTC (ISO 8601)              |
| `path`       | `string` | Endpoint que generó el error              |

---

## Códigos de error

### 400 Bad Request

Errores de validación o reglas de negocio violadas.

| Contexto                            | Mensaje                                                                  |
|-------------------------------------|--------------------------------------------------------------------------|
| Validación de DTO (class-validator) | `email must be an email`                                                 |
| Validación de DTO                   | `phone must match /^(\\+34\|0034)?[6789]\\d{8}$/ regular expression`     |
| Validación de DTO                   | `restaurantCategory must be one of: RESTAURANT, BAR, BREWERY, TEA_HOUSE` |
| Reserva: grupo muy grande           | `For groups of 10 or more please contact the restaurant directly`        |
| Reserva: poca antelación            | `Reservations must be made at least 30 minutes in advance`               |
| Reserva: día cerrado                | `Restaurant is closed on sundays`                                        |
| Reserva: fuera de horario           | `Restaurant is not open at 18:00 on mondays`                             |
| Reserva: último slot pasado         | `Last reservation is at 15:00`                                           |
| Reserva: intervalo incorrecto       | `Time must align with 30-minute intervals. Next valid time: 13:30`       |
| Reserva: sin capacidad              | `No capacity available for this shift. Available: 6 people`              |
| Reserva: restaurante inactivo       | `This restaurant is not accepting reservations`                          |
| Reserva: estado no cancelable       | `Only pending or confirmed reservations can be cancelled`                |
| Reserva: transición inválida        | `Only pending reservations can be accepted`                              |
| Reserva: transición inválida        | `Only pending reservations can be rejected`                              |
| Auth: contraseña actual incorrecta  | `Current password is incorrect`                                          |
| Auth: nueva contraseña igual        | `New password must be different from current password`                   |
| Auth: fortaleza de contraseña       | `Password does not meet requirements: minimum 8 characters, ...`         |
| Settings: primera config incompleta | `All fields are required when creating settings for the first time`      |

---

### 401 Unauthorized

El request no tiene sesión válida o las credenciales son incorrectas.

| Contexto             | Mensaje                       |
|----------------------|-------------------------------|
| Login fallido        | `Datos de acceso incorrectos` |
| Sin cookie de sesión | `Invalid or missing token`    |
| Token JWT expirado   | `Invalid or missing token`    |
| Usuario desactivado  | `Invalid or missing token`    |

---

### 403 Forbidden

El usuario está autenticado pero no tiene permisos para realizar la acción.

| Contexto                           | Mensaje                                                   |
|------------------------------------|-----------------------------------------------------------|
| Rol insuficiente en endpoint       | `Access denied. Required roles: SUPERADMIN`               |
| Admin viendo settings de otro      | `You can only view settings of your own restaurant`       |
| Admin modificando settings de otro | `You can only update settings of your own restaurant`     |
| Admin gestionando otra reserva     | `You can only manage reservations of your own restaurant` |

---

### 404 Not Found

El recurso solicitado no existe o está desactivado.

| Contexto                       | Mensaje                                          |
|--------------------------------|--------------------------------------------------|
| Restaurante no existe          | `Restaurant with id {id} not found`              |
| Restaurante inactivo (público) | `Restaurant with id {slug} not found`            |
| Settings no configuradas       | `Settings for restaurant with id {id} not found` |
| Reserva no existe              | `Reservation with id {id} not found`             |
| Reserva: token inválido        | `Reservation not found or token is invalid`      |
| Usuario no existe              | `User with id {id} not found`                    |

> ⚠️ Los restaurantes inactivos devuelven `404` en lugar de `403` para
> evitar revelar su existencia al público.

---

### 409 Conflict

El recurso ya existe o hay un conflicto de estado.

| Contexto                       | Mensaje                                        |
|--------------------------------|------------------------------------------------|
| Email de usuario duplicado     | `User with email {email} already exists`       |
| Email de restaurante duplicado | `Restaurant with email {email} already exists` |

---

### 429 Too Many Requests

Rate limiting activado.

| Contexto                   | Mensaje             | Límite                |
|----------------------------|---------------------|-----------------------|
| Login: demasiados intentos | `Too Many Requests` | 5 intentos por minuto |

---

### 500 Internal Server Error

Error inesperado del servidor. No debería ocurrir en condiciones normales.

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Internal server error",
  "timestamp": "2026-03-01T10:00:00.000Z",
  "path": "/api/v1/..."
}
```

---

## Errores de dominio vs. errores de NestJS

La API distingue dos tipos de errores:

### Errores de dominio

Lanzados por los use cases con clases TypeScript puras (sin dependencia de NestJS).
El `DomainExceptionFilter` los intercepta y transforma en respuestas HTTP.

```typescript
// Jerarquía de errores de dominio
DomainErrors(abstracta)
├── ConflictError     → 409
├── NotFoundError     → 404
├── BadRequestError   → 400
├── UnauthorizedError → 401
└── ForbiddenError    → 403
```

**Ejemplo de uso en use case:**

```typescript
// ✅ Correcto — sin dependencia de NestJS
throw new NotFoundError('Restaurant', id);
throw new ConflictError(`User with email ${email} already exists`);
```

### Errores de NestJS (validación HTTP)

Los errores de validación de DTOs (`class-validator`) son lanzados
automáticamente por el `ValidationPipe` global y no pasan por
el `DomainExceptionFilter`.

Su formato es ligeramente diferente:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "email must be an email",
    "phone must be a string"
  ]
}
```

---

## Cómo manejar errores en el cliente

### Manejo genérico recomendado

```typescript
try {
    const response = await fetch('/api/v1/reservations', {...});

    if (!response.ok) {
        const error = await response.json();

        switch (error.statusCode) {
            case 400:
                // Mostrar error de validación al usuario
                showValidationError(error.message);
                break;
            case 401:
                // Redirigir al login
                router.push('/login');
                break;
            case 404:
                // Mostrar página de no encontrado
                showNotFound();
                break;
            case 409:
                // Mostrar conflicto (ej. email ya registrado)
                showConflictError(error.message);
                break;
            case 429:
                // Mostrar mensaje de espera
                showRateLimitError();
                break;
            default:
                // Error genérico del servidor
                showGenericError();
        }
        return;
    }

    const data = await response.json();
    // ...procesar respuesta exitosa

} catch (networkError) {
    // Error de red (sin conexión, CORS, etc.)
    showNetworkError();
}
```

---

## Siguientes pasos

- [API Reference — Auth](./04-api/auth.md)
- [Roadmap](./09-roadmap.md)


