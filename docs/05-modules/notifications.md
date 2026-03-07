# Módulo Notifications

Módulo transversal responsable del envío de emails transaccionales.
Implementa el patrón Ports & Adapters para desacoplar la lógica de negocio
del proveedor concreto de email.

---

## Estructura

```
notifications/
├── domain/
│   └── ports/
│       └── email.service.port.ts          # Contrato abstracto del servicio de email
└── infrastructure/
    └── resend/
        ├── resend-email.service.ts        # Implementación con Resend
        └── templates/
            ├── welcome-admin.template.ts              # Email de bienvenida al admin
            ├── new-reservation-admin.template.ts      # Notificación al admin: nueva reserva
            ├── reservation-accepted.template.ts       # Email al comensal: reserva confirmada
            ├── reservation-pending.template.ts        # Email al comensal: reserva pendiente
            ├── reservation-rejected.template.ts       # Email al comensal: reserva rechazada
            └── reservationCancelled.template.ts       # Email al comensal: reserva cancelada
```

---

## Port: `EmailServicePort`

Define el contrato que debe implementar cualquier proveedor de email.
Los use cases inyectan este port — nunca la implementación concreta.

```typescript
abstract class EmailServicePort {
    abstract sendWelcomeToNewAdmin(params: WelcomeAdminParams): Promise<void>;

    abstract sendNewReservationToAdmin(params: NewReservationAdminParams): Promise<void>;

    abstract sendReservationAccepted(params: ReservationAcceptedParams): Promise<void>;

    abstract sendReservationPending(params: ReservationPendingParams): Promise<void>;

    abstract sendReservationRejected(params: ReservationRejectedParams): Promise<void>;

    abstract sendReservationCancelled(params: ReservationCancelledParams): Promise<void>;
}
```

---

## Implementación: `ResendEmailService`

La implementación concreta del port que usa la API de [Resend](https://resend.com)
para el envío de emails HTML transaccionales.

### Configuración

| Variable de entorno  | Descripción                                      |
|----------------------|--------------------------------------------------|
| `RESEND_API_KEY`     | Clave API de Resend                              |
| `EMAIL_FROM_NAME`    | Nombre del remitente (ej. `MesaViva`)            |
| `EMAIL_FROM_ADDRESS` | Email del remitente (ej. `noreply@mesaviva.com`) |
| `EMAIL_DEV_REDIRECT` | Email de redirección en desarrollo (opcional)    |

### Modo desarrollo

En `NODE_ENV=development`, todos los emails se redirigen al `EMAIL_DEV_REDIRECT`
configurado, independientemente del destinatario real. Esto evita enviar emails
a clientes reales durante el desarrollo.

```
destinatario real: cliente@restaurant.com
email enviado a:   dev@tuempresa.com (EMAIL_DEV_REDIRECT)
```

Si `EMAIL_DEV_REDIRECT` no está configurado, se usa el destinatario real.

### Gestión de errores

Los errores en el envío de email se **capturan y logean** con `Logger`, pero
**no interrumpen el flujo** del use case. La reserva se crea igualmente aunque
falle el email.

```typescript
try {
    await this.resend.emails.send({...});
} catch (error) {
    this.logger.error(`Error enviando email a ${params.to}`, error);
    // No se relanza — el fallo de email no es fatal
}
```

---

## Emails del sistema

### 1. Bienvenida al nuevo admin

**Disparado por:** `CreateRestaurantAdminUseCase`  
**Destinatario:** Nuevo administrador de restaurante  
**Asunto:** `🎉 Bienvenido a MesaViva - Credenciales de Acceso`

**Contenido:**

- Nombre del admin
- Email de acceso
- Contraseña temporal generada
- Enlace al panel de administración
- Instrucciones para cambiar la contraseña

**Parámetros:**

```typescript
interface WelcomeAdminParams {
    to: string;              // email del destinatario
    adminName: string;       // nombre del admin
    email: string;           // email de acceso
    temporaryPassword: string; // contraseña temporal
    restaurantName: string;  // nombre de su restaurante
    loginUrl: string;        // URL del panel admin
}
```

---

### 2. Nueva reserva — notificación al admin

**Disparado por:** `CreateReservationUseCase`  
**Destinatario:** Administrador del restaurante  
**Asunto:**

- Modo `AUTO`: `✅ Nueva Reserva Confirmada`
- Modo `MANUAL`: `🔔 Nueva Reserva Pendiente de Aprobación`

**Contenido:**

- Datos del comensal (nombre, teléfono, email)
- Fecha y hora de la reserva
- Número de personas
- Notas adicionales
- Estado de la reserva
- Enlace al panel para gestionar la reserva

**Parámetros:**

```typescript
interface NewReservationAdminParams {
    to: string;              // email del admin del restaurante
    restaurantName: string;
    customerName: string;
    customerLastName: string;
    customerEmail: string;
    customerPhone: string;
    date: string;            // YYYY-MM-DD
    time: string;            // HH:mm
    numberOfPeople: number;
    notes: string | null;
    status: ReservationStatus; // CONFIRMED o PENDING
    dashboardUrl: string;    // URL del panel de gestión
}
```

---

### 3. Reserva confirmada — al comensal

**Disparado por:** `CreateReservationUseCase` (modo `AUTO`)  
**Destinatario:** Comensal  
**Asunto:** `✅ Reserva Confirmada`

**Contenido:**

- Datos de la reserva (restaurante, fecha, hora, personas)
- Enlace de cancelación (incluye `cancellationToken`)
- Instrucciones para llegar (dirección del restaurante)

**Parámetros:**

```typescript
interface ReservationAcceptedParams {
    to: string;
    customerName: string;
    restaurantName: string;
    restaurantAddress: string;
    date: string;
    time: string;
    numberOfPeople: number;
    cancellationUrl: string; // /cancelar/:token
}
```

---

### 4. Reserva pendiente — al comensal

**Disparado por:** `CreateReservationUseCase` (modo `MANUAL`)  
**Destinatario:** Comensal  
**Asunto:** `🕐 Solicitud de Reserva Recibida`

**Contenido:**

- Confirmación de que la solicitud fue recibida
- Datos de la reserva solicitada
- Aviso de que el restaurante confirmará en breve
- Enlace de cancelación

**Parámetros:**

```typescript
interface ReservationPendingParams {
    to: string;
    customerName: string;
    restaurantName: string;
    date: string;
    time: string;
    numberOfPeople: number;
    cancellationUrl: string;
}
```

---

### 5. Reserva rechazada — al comensal

**Disparado por:** `RejectReservationUseCase` *(pendiente — H2)*  
**Destinatario:** Comensal  
**Asunto:** `❌ Reserva No Disponible`

**Contenido:**

- Aviso del rechazo
- Motivo proporcionado por el restaurante
- Invitación a buscar otra fecha u otro restaurante

**Parámetros:**

```typescript
interface ReservationRejectedParams {
    to: string;
    customerName: string;
    restaurantName: string;
    date: string;
    time: string;
    numberOfPeople: number;
    rejectionReason: string;
}
```

---

### 6. Reserva cancelada — al comensal

**Disparado por:** `CancelByTokenUseCase`  
**Destinatario:** Comensal  
**Asunto:** `Reserva Cancelada`

**Contenido:**

- Confirmación de la cancelación
- Datos de la reserva cancelada
- Invitación a volver a reservar

**Parámetros:**

```typescript
interface ReservationCancelledParams {
    to: string;
    customerName: string;
    restaurantName: string;
    date: string;
    time: string;
    numberOfPeople: number;
}
```

---

## Registro en el módulo

```typescript
// notifications.module.ts
@Module({
    providers: [
        {
            provide: EmailServicePort,
            useClass: ResendEmailService,
        },
    ],
    exports: [EmailServicePort],
})
export class NotificationsModule {
}
```

`NotificationsModule` se importa en los módulos que necesitan enviar emails:

- `UsersModule` — email de bienvenida al crear admin
- `ReservationsModule` — emails del ciclo de vida de la reserva

---

## Cambiar de proveedor de email

Gracias al patrón Ports & Adapters, cambiar de Resend a SendGrid (o cualquier otro)
solo requiere:

1. Crear una nueva clase que extienda `EmailServicePort`
2. Implementar los 6 métodos abstractos
3. Cambiar `useClass` en el módulo:

```typescript
// De:
{
    provide: EmailServicePort, useClass
:
    ResendEmailService
}

// A:
{
    provide: EmailServicePort, useClass
:
    SendGridEmailService
}
```

Los use cases no necesitan ningún cambio.

---

## Siguientes pasos

- [API — Reservations](../04-api/reservations.md)
- [Módulo Shared](./shared.md)
- [Roadmap](../09-roadmap.md)

