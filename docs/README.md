# MesaViva API — Documentación

Documentación completa de **MesaViva API**, el backend de la plataforma
de reservas para restaurantes.

> 📁 **Documentación del cliente (frontend):** [`client/docs/`](../../client/docs/README.md)

---

## Índice

### 🚀 Primeros pasos

- [01 — Getting Started](./01-getting-started.md) — Instalación y puesta en marcha local

### 🏗️ Arquitectura

- [02 — Arquitectura](./02-architecture.md) — Arquitectura Hexagonal, patrones y decisiones técnicas

### 🗄️ Base de datos

- [03 — Base de datos](./03-database.md) — Entidades, relaciones y convenciones

### 📡 API Reference

- [Auth](./04-api/auth.md) — Login, logout y cambio de contraseña
- [Users](./04-api/users.md) — Gestión de administradores
- [Restaurants](./04-api/restaurants.md) — Listado y detalle de restaurantes
- [Settings](./04-api/settings.md) — Configuración operativa del restaurante
- [Reservations](./04-api/reservations.md) — Ciclo de vida de las reservas

### 🧩 Módulos

- [Auth](./05-modules/auth.md)
- [Users](./05-modules/users.md)
- [Restaurants](./05-modules/restaurants.md)
- [Settings](./05-modules/settings.md)
- [Reservations](./05-modules/reservations.md)
- [Notifications](./05-modules/notifications.md)
- [Shared](./05-modules/shared.md)

### ⚙️ Operaciones

- [06 — Despliegue](./06-deployment.md) — Producción con Coolify y Hetzner
- [07 — Testing](./07-testing.md) — Estrategia de tests y cobertura

### 📚 Referencias

- [08 — Notificaciones](./08-notifications.md) — Emails transaccionales con Resend
- [09 — Roadmap](./09-roadmap.md) — Estado actual e hitos futuros
- [10 — Referencia de errores](./10-error-reference.md) — Códigos y mensajes de error

---

## Resumen del proyecto

**MesaViva** es una plataforma SaaS B2B que permite a restaurantes gestionar sus reservas online.

| Aspecto       | Tecnología                            |
|---------------|---------------------------------------|
| Framework     | NestJS 11 + TypeScript                |
| Base de datos | PostgreSQL 16 + TypeORM               |
| Autenticación | JWT en cookie httpOnly + Passport     |
| Email         | Resend                                |
| Imágenes      | Cloudinary                            |
| Tests         | Jest (114 tests unitarios, 16 suites) |
| Arquitectura  | Hexagonal (Ports & Adapters)          |
| Despliegue    | Hetzner VPS + Coolify                 |

---

## Estado del proyecto

| Hito | Estado         | Descripción                                                                                                                            |
|------|----------------|----------------------------------------------------------------------------------------------------------------------------------------|
| H1   | ✅ Completo     | Auth, Users, Restaurants, Settings, Reservas básicas + **Frontend público** ✅                                                          |
| H2   | 🔄 En progreso | Gestión admin de reservas ✅ — Restaurants admin (GET) ✅ — Panel frontend (reservas) ✅ — Restaurants/Users CRUD + Settings UI pendiente |
| H3   | 📋 Planificado | Pagos con Stripe, depósitos                                                                                                            |

---

## Inicio rápido

```bash
# Clonar e instalar
git clone https://github.com/tu-usuario/mesaviva.git
cd mesaviva/api
npm install

# Configurar entorno
cp .env.example .env

# Levantar base de datos
docker-compose up -d

# Poblar BD con superadmin
npm run seed

# Iniciar en modo desarrollo
npm run start:dev
```

API disponible en: `http://localhost:3001/api/v1`

---

## Convenciones de la documentación

- 🚧 = Pendiente de implementación
- ✅ = Implementado y testeado
- ❌ = No aplica / no se implementará
- H1 / H2 / H3 = Hito de implementación



