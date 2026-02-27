# MesaViva API

Backend de la plataforma **MesaViva** — sistema de gestión de reservas para restaurantes del mercado europeo, orientado
inicialmente al mercado español.

Construido con **NestJS**, **TypeScript** y **PostgreSQL** siguiendo los principios de **Arquitectura Hexagonal**.

---

## Índice de documentación

| Documento                                           | Descripción                                |
|-----------------------------------------------------|--------------------------------------------|
| [Getting Started](./docs/01-getting-started.md)     | Requisitos, instalación y arranque local   |
| [Arquitectura](./docs/02-architecture.md)           | Decisiones técnicas, estructura y patrones |
| [Base de datos](./docs/03-database.md)              | Entidades, relaciones y esquema            |
| [API — Auth](./docs/04-api/auth.md)                 | Endpoints de autenticación                 |
| [API — Users](./docs/04-api/users.md)               | Endpoints de gestión de usuarios           |
| [API — Restaurants](./docs/04-api/restaurants.md)   | Endpoints de restaurantes                  |
| [API — Settings](./docs/04-api/settings.md)         | Endpoints de configuración                 |
| [API — Reservations](./docs/04-api/reservations.md) | Endpoints de reservas                      |
| [Módulo Shared](./docs/05-modules/shared.md)        | Infraestructura compartida                 |
| [Despliegue](./docs/06-deployment.md)               | Producción, variables de entorno y Docker  |

---

## Stack tecnológico

### Backend

| Tecnología   | Versión | Uso                    |
|--------------|---------|------------------------|
| Node.js      | 24.x    | Runtime                |
| NestJS       | 11.x    | Framework              |
| TypeScript   | 5.x     | Lenguaje               |
| TypeORM      | 0.3.x   | ORM                    |
| PostgreSQL   | 16.x    | Base de datos          |
| Passport JWT | 4.x     | Autenticación          |
| Resend       | 4.x     | Emails transaccionales |
| Stripe       | —       | Pagos (H3)             |
| Cloudinary   | 2.x     | Gestión de imágenes    |

### Infraestructura

| Tecnología        | Uso                      |
|-------------------|--------------------------|
| Docker / OrbStack | Entorno de desarrollo    |
| Coolify           | Despliegue en producción |
| Hetzner VPS       | Servidor de producción   |

---

## Arquitectura

El proyecto implementa **Arquitectura Hexagonal** (Ports & Adapters) organizada por módulos de negocio:

```plaintext
src/
├── modules/
│   ├── auth/            # Autenticación y JWT
│   ├── users/           # Gestión de administradores
│   ├── restaurants/     # Gestión de restaurantes
│   ├── settings/        # Configuración operativa
│   ├── reservations/    # Gestión de reservas
│   ├── payments/        # Pagos con Stripe (H3)
│   └── notifications/   # Emails transaccionales
└── shared/              # Infraestructura compartida
```

Cada módulo sigue la estructura:

```plaintext
módulo/
├── domain/ # Lógica pura — sin dependencias de framework 
├── application/ # Casos de uso — orquesta el dominio 
└── infrastructure/# Controllers, ORM, servicios externos
```

---

## Roles del sistema

| Rol                | Descripción                          |
|--------------------|--------------------------------------|
| `SUPERADMIN`       | Gestión completa de la plataforma    |
| `RESTAURANT_ADMIN` | Gestión de su restaurante y reservas |
| Guest              | Realiza reservas sin registro        |

---

## Estado del proyecto

| Hito | Estado | Descripción                                     |
|------|--------|-------------------------------------------------|
| H0   | ✅      | Anteproyecto y arquitectura base                |
| H1   | 🚧     | MVP — reserva pública + configuración operativa |
| H2   | ⏳      | Panel de gestión + emails + pruebas             |
| H3   | ⏳      | Depósito configurable con Stripe                |

---

## Arranque rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/mesaviva.git
cd mesaviva/api

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Levantar base de datos
docker-compose up -d

# 5. Ejecutar seeds
npm run seed

# 6. Arrancar en desarrollo
npm run start:dev

```

Consulta [Getting Started](./docs/01-getting-started.md)  para la guía completa.

```bash
npm run start:dev   # Arrancar en modo desarrollo
npm run build       # Compilar para producción
npm run start:prod  # Arrancar en modo producción
npm run seed        # Poblar BD con datos iniciales
npm run lint        # Ejecutar linter
npm run test        # Ejecutar tests unitarios
npm run test:e2e    # Ejecutar tests end-to-end
```

## Autor

### Mario Rivera Valverde

### DAM · The Power Education · 2024/2026

### Tutora: Olga Moreno Martín