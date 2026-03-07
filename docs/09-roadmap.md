# Roadmap

Estado actual del proyecto e hitos de desarrollo planificados.

---

## Visión del producto

**MesaViva** es una plataforma SaaS B2B que permite a restaurantes gestionar
sus reservas online de forma autónoma. Los comensales pueden reservar sin
crear una cuenta. Los administradores de restaurante gestionan todo desde
un panel web.

---

## Hitos de desarrollo

| Hito | Fecha      | Estado           |
|------|------------|------------------|
| H0   | 22/02/2026 | ✅ Entregado      |
| H1   | 15/03/2026 | ✅ Completo       |
| H2   | 05/04/2026 | 🔄 En desarrollo |
| H3   | 03/05/2026 | 📋 Planificado   |

---

### H1 — MVP Core ✅ Completo

El hito 1 cubre el flujo completo de reservas end-to-end: desde que el
superadmin da de alta un restaurante hasta que un comensal hace y cancela
una reserva.

#### Auth

- [x] Login con JWT en cookie httpOnly
- [x] Logout
- [x] Rate limiting (5 intentos/minuto)
- [x] Protección de rutas por rol (`SUPERADMIN`, `RESTAURANT_ADMIN`)

#### Users

- [x] Crear administrador de restaurante con contraseña temporal
- [x] Email de bienvenida con credenciales

#### Restaurants

- [x] Listado público de restaurantes activos
- [x] Detalle público por slug con settings incluidos
- [x] Generación automática de slug único

#### Settings

- [x] Configurar horarios de apertura (múltiples franjas por día, incluye cruce de medianoche)
- [x] Configurar intervalo de slots (15/30/60 min)
- [x] Modo de aceptación AUTO / MANUAL
- [x] Importe de depósito (preparado para H3)
- [x] Actualización parcial (PATCH semántico)

#### Reservations

- [x] Creación pública de reservas sin cuenta
- [x] Validación completa de reglas de negocio (grupo, antelación, horario, intervalo, capacidad)
- [x] Modo AUTO: confirmación inmediata
- [x] Modo MANUAL: reserva en estado PENDING
- [x] Cancelación pública mediante token único con caducidad (un solo uso)
- [x] Notificaciones por email en todos los eventos

#### Notifications

- [x] Email de bienvenida al nuevo admin
- [x] Email al admin con cada nueva reserva
- [x] Email de confirmación / pendiente al comensal
- [x] Email de cancelación al comensal
- [x] Email de rechazo al comensal con motivo
- [x] Modo dev: redirección de emails a dirección de prueba

#### Testing

- [x] 102 tests unitarios cubriendo todos los use cases y el servicio de validación

---

### H2 — Panel de administración 🔄 En desarrollo

El hito 2 añade el panel de gestión para los administradores de restaurante,
incluyendo la gestión manual de reservas y la administración de su restaurante.

#### Reservas (admin) ✅ Backend implementado

- [x] `GET /reservations` — Listar reservas con filtros (fecha, estado, restaurante)
- [x] `GET /reservations/:id` — Detalle de reserva
- [x] `PATCH /reservations/:id/confirm` — Confirmar reserva pendiente + email al cliente
- [x] `PATCH /reservations/:id/reject` — Rechazar reserva con motivo + email
- [x] `PATCH /reservations/:id/cancel` — Cancelar reserva (desde el admin) + email

#### Auth ✅ Backend implementado

- [x] `PATCH /auth/change-password` — Cambio de contraseña obligatorio tras primer login

#### Restaurants (admin) ✅ Backend implementado (parcial)

- [x] `GET /restaurants/mine` — Ver mis restaurantes (RESTAURANT_ADMIN)
- [x] `GET /restaurants/owner/:adminId` — Ver restaurantes de un admin (SUPERADMIN + RESTAURANT_ADMIN propio)
- [ ] `POST /restaurants` — Crear restaurante (SUPERADMIN)
- [ ] `PATCH /restaurants/:id` — Actualizar nombre, teléfono, dirección, imagen
- [ ] `PATCH /restaurants/:id/status` — Activar / desactivar restaurante

#### Users (superadmin) ⬜ Pendiente

- [ ] `GET /users/restaurant-admins` — Listar todos los admins
- [ ] `GET /users/me` — Ver mi perfil
- [ ] `PATCH /users/:id` — Actualizar datos del admin
- [ ] `PATCH /users/:id/status` — Activar / desactivar cuenta

#### Upload ⬜ Pendiente

- [ ] `POST /upload/restaurant-image` — Subida de imagen del restaurante a Cloudinary

#### Frontend ✅ Parcialmente implementado

- [x] Panel admin: listado de reservas con filtro por restaurante
- [x] Panel admin: detalle de reserva con acciones (confirmar, rechazar, cancelar)
- [x] Panel admin: login con redirección inteligente por rol
- [x] Panel admin: cancelación pública por token (página `/reservas/cancelar/[token]`)
- [x] Panel admin: middleware de protección de rutas (`middleware.ts`)
- [x] Componentes layout: `AppLayout`, `NavBar` (responsive, sidebar móvil), `Breadcrumbs`, `Logo`
- [ ] Panel admin: gestión de settings del restaurante
- [ ] Panel admin: gestión de perfil del admin

#### Tests

- [x] Tests para `ConfirmReservationUseCase`, `RejectReservationUseCase`, `CancelReservationUseCase`,
  `GetReservationsUseCase`
- [x] Tests para `ChangePasswordUseCase`
- [x] Tests para `GetReservationUseCase` (detalle de reserva individual) — H2
- [x] Tests para `GetRestaurantsUseCase` (listado admin de restaurantes) — H2
- [ ] Tests para use cases de restaurants update y users admin (pendiente)

---

### H3 — Pagos y entrega final 📋 Planificado

El hito 3 añade el sistema de depósitos/señas para reducir cancelaciones
de último momento, el despliegue en producción y la memoria final.

#### Stripe Integration

- [ ] `POST /payments/create-intent` — Crear PaymentIntent en Stripe
- [ ] `POST /payments/webhook` — Webhook de Stripe para confirmar pagos
- [ ] Flujo: `PENDING_PAYMENT` → `CONFIRMED` (pago OK)
- [ ] Devolución automática del depósito al cancelar dentro del plazo
- [ ] Email al comensal con enlace de pago
- [ ] Panel de admin con estado de pagos

#### Base de datos

- [ ] Tabla `payments` (estructura ya definida en el esquema)
- [ ] Campos de pago en `reservations` (ya preparados: `paymentId`, `paymentStatus`, `paymentDeadline`)

#### Despliegue

- [ ] Dockerfile multi-stage para backend y frontend
- [ ] Pipeline CI/CD (GitHub Actions: lint + tests + build + deploy)
- [ ] Despliegue en VPS Hetzner con Coolify
- [ ] Migraciones TypeORM explícitas (reemplazar `synchronize: true`)

---

## Deuda técnica

| Item                 | Prioridad | Descripción                                     |
|----------------------|-----------|-------------------------------------------------|
| Migraciones TypeORM  | Alta      | Reemplazar `synchronize: true` en producción    |
| Dockerfile           | Alta      | Crear imagen Docker optimizada multi-stage      |
| Pipeline CI/CD       | Media     | GitHub Actions con tests + build + deploy       |
| Filtros en BD        | Media     | Mover filtros del servidor a la query SQL       |
| Transacciones de BD  | Media     | Reemplazar rollback manual por transacciones    |
| Tests de integración | Baja      | Repositorios contra BD en memoria (sqlite)      |
| OpenAPI / Swagger    | Baja      | Documentación interactiva con `@nestjs/swagger` |
| Paginación           | Baja      | Para listados con muchos registros              |
| Colección Postman    | Baja      | `docs/postman/mesaviva.json`                    |

---

## Historial de versiones

| Versión | Fecha        | Descripción                                               |
|---------|--------------|-----------------------------------------------------------|
| 0.1.0   | Enero 2026   | Setup inicial del proyecto                                |
| 0.5.0   | Febrero 2026 | H1 completo: MVP core funcional                           |
| 0.6.0   | Marzo 2026   | Documentación completa + inicio H2 (endpoints de gestión) |
| 0.7.0   | 7 marzo 2026 | Panel admin frontend (reservas + detalle) + middleware    |

---

## Siguientes pasos inmediatos (H2)

1. Endpoints de restaurants admin (`POST /restaurants`, `PATCH /:id`, `PATCH /:id/status`).
2. Endpoints de users admin (`GET /restaurant-admins`, `GET /me`, `PATCH /:id`, `PATCH /:id/status`).
3. Upload de imagen (`POST /upload/restaurant-image` con Cloudinary).
4. Panel admin frontend: settings + perfil del admin.

---

## Referencias

- [Getting Started](./01-getting-started.md)
- [Arquitectura](./02-architecture.md)
- [Referencia de errores](./10-error-reference.md)
