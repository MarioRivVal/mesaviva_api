# Notificaciones por Email

Documentación completa del sistema de emails transaccionales de MesaViva,
implementado con [Resend](https://resend.com).

---

## Proveedor

| Aspecto      | Detalle                               |
|--------------|---------------------------------------|
| Proveedor    | Resend                                |
| Formato      | HTML responsive                       |
| Idioma       | Español                               |
| From name    | `MesaViva` (configurable por env)     |
| From address | `noreply@mesaviva.com` (configurable) |

---

## Configuración de entorno

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_NAME=MesaViva
EMAIL_FROM_ADDRESS=noreply@mesaviva.com

# Solo en desarrollo — redirige todos los emails a esta dirección
EMAIL_DEV_REDIRECT=tu@email.com
```

---

## Resumen de emails

| # | Template                | Destinatario | Evento que lo dispara                | Hito  |
|---|-------------------------|--------------|--------------------------------------|-------|
| 1 | `welcome-admin`         | Admin        | Creación de nuevo administrador      | H1 ✅  |
| 2 | `new-reservation-admin` | Admin        | Nueva reserva creada (AUTO o MANUAL) | H1 ✅  |
| 3 | `reservation-accepted`  | Comensal     | Reserva creada en modo AUTO          | H1 ✅  |
| 4 | `reservation-pending`   | Comensal     | Reserva creada en modo MANUAL        | H1 ✅  |
| 5 | `reservation-rejected`  | Comensal     | Admin rechaza una reserva pendiente  | H2 🔄 |
| 6 | `reservation-cancelled` | Comensal     | Comensal cancela mediante token      | H1 ✅  |

---

## Detalle de cada email

### 1. Bienvenida al admin (`welcome-admin`)

**Asunto:** `🎉 Bienvenido a MesaViva - Credenciales de Acceso`

Enviado cuando el superadmin crea un nuevo `RESTAURANT_ADMIN`.
Incluye las credenciales temporales para el primer acceso.

**Datos incluidos:**

- Nombre del admin
- Email de acceso
- Contraseña temporal (generada aleatoriamente)
- Nombre del restaurante creado
- Enlace directo al panel de administración

> ⚠️ Después del primer login con estas credenciales, el sistema
> obliga a cambiar la contraseña (`mustChangePassword: true`).

---

### 2. Nueva reserva al admin (`new-reservation-admin`)

**Asunto (modo AUTO):** `✅ Nueva Reserva Confirmada`  
**Asunto (modo MANUAL):** `🔔 Nueva Reserva Pendiente de Aprobación`

Notifica al administrador del restaurante cada vez que llega una reserva.
El asunto y contenido varía según el modo de aceptación configurado.

**Datos incluidos:**

- Nombre completo del comensal
- Teléfono y email del comensal
- Fecha, hora y número de personas
- Notas especiales (si las hay)
- Estado actual de la reserva
- Enlace al panel para gestionar/aprobar la reserva

---

### 3. Confirmación al comensal (`reservation-accepted`)

**Asunto:** `✅ Reserva Confirmada`

Se envía cuando la reserva se confirma automáticamente (modo `AUTO`),
o cuando el admin la acepta manualmente (modo `MANUAL`, H2).

**Datos incluidos:**

- Nombre del restaurante y su dirección
- Fecha y hora confirmada
- Número de personas
- **Enlace único de cancelación** (incluye `cancellationToken`)

---

### 4. Solicitud recibida al comensal (`reservation-pending`)

**Asunto:** `🕐 Solicitud de Reserva Recibida`

Se envía cuando la reserva queda en estado `PENDING` (modo `MANUAL`).
El comensal sabe que su solicitud fue recibida y está pendiente de aprobación.

**Datos incluidos:**

- Nombre del restaurante
- Datos de la reserva solicitada
- Mensaje de que el restaurante confirmará en breve
- **Enlace único de cancelación** (para desistir si cambia de planes)

---

### 5. Reserva rechazada al comensal (`reservation-rejected`)

> 🔄 **Pendiente — H2** (use case `RejectReservationUseCase`)

**Asunto:** `❌ Reserva No Disponible`

Enviado cuando el admin rechaza una reserva en estado `PENDING`.

**Datos incluidos:**

- Nombre del restaurante
- Datos de la reserva rechazada
- **Motivo del rechazo** proporcionado por el admin
- Invitación a intentar con otra fecha

---

### 6. Cancelación al comensal (`reservation-cancelled`)

**Asunto:** `Reserva Cancelada`

Confirmación de que la cancelación iniciada por el comensal
fue procesada correctamente.

**Datos incluidos:**

- Nombre del restaurante
- Datos de la reserva cancelada
- Invitación a volver a reservar en el futuro

---

## Enlace de cancelación

Todos los emails al comensal incluyen un enlace de cancelación.
Este enlace contiene el `cancellationToken` único de la reserva:

```
https://mesaviva.com/cancelar/d4e5f6a7-b8c9-0123-defa-234567890123
```

El frontend captura el token de la URL y llama a:

```
DELETE /api/v1/reservations/cancel/:token
```

**Características del token:**

- UUID v4 generado con `crypto.randomUUID()` en el momento de crear la reserva
- Único e irrepetible
- No expira — la cancelación está disponible hasta que la reserva cambie de estado
- No requiere autenticación

---

## Modo desarrollo

En entorno de desarrollo, todos los emails se redirigen a `EMAIL_DEV_REDIRECT`
para evitar enviar emails a destinatarios reales.

```typescript
private
getRecipient(realEmail
:
string
):
string
{
    if (this.isDev && this.devRedirect) {
        return this.devRedirect;
    }
    return realEmail;
}
```

**Ejemplo:**

```
# Reserva creada para: cliente@gmail.com
# Email enviado a:     dev@miempresa.com  ← EMAIL_DEV_REDIRECT
```

---

## Tolerancia a fallos

El envío de emails es **no bloqueante**. Si Resend falla, el error
se registra en el logger pero **no interrumpe** la operación principal:

```typescript
try {
    await this.resend.emails.send({...});
} catch (error) {
    this.logger.error(`Error enviando email`, error);
    // La reserva ya está creada — el fallo de email no la revierte
}
```

Esto garantiza que una caída del proveedor de email no impida que
los comensales puedan hacer reservas.

---

## Siguientes pasos

- [Módulo Notifications](../05-modules/notifications.md)
- [Roadmap](./09-roadmap.md)

