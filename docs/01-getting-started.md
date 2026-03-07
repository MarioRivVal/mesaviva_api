# Getting Started

Guía completa para levantar **MesaViva API** en local desde cero.

---

## Requisitos previos

| Herramienta       | Versión mínima | Descarga                             |
|-------------------|----------------|--------------------------------------|
| Node.js           | 22.x LTS       | [nodejs.org](https://nodejs.org)     |
| npm               | 10.x           | Incluido con Node.js                 |
| Docker / OrbStack | —              | [orbstack.dev](https://orbstack.dev) |
| Git               | —              | [git-scm.com](https://git-scm.com)   |

> **Recomendado:** Usar [nvm](https://github.com/nvm-sh/nvm) para gestionar versiones de Node.js y evitar problemas de
> permisos con paquetes globales.

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/mesaviva.git
cd mesaviva/api
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```bash
# ── Aplicación ──────────────────────────────
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# ── Base de datos ────────────────────────────
DB_HOST=localhost
DB_PORT=5434
DB_USER=mario
DB_PASSWORD=mario
DB_NAME=restaurant_reservations

# ── JWT ──────────────────────────────────────
JWT_SECRET=cambia_esto_por_un_secreto_seguro
JWT_EXPIRES_IN=86400

# ── Email (Resend) ───────────────────────────
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_NAME=MesaViva
EMAIL_FROM_ADDRESS=noreply@mesaviva.com
EMAIL_DEV_REDIRECT=tu@email.com

# ── Cloudinary ───────────────────────────────
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

> ⚠️ El archivo `.env` está en `.gitignore` y nunca debe subirse al repositorio.  
> Consulta `.env.example` para ver todas las variables disponibles.

---

## Base de datos

### Levantar PostgreSQL con Docker

```bash
# desde la raíz del proyecto mesaviva/
docker-compose up -d
```

El `docker-compose.yml` levanta:

| Servicio      | Puerto | Descripción             |
|---------------|--------|-------------------------|
| PostgreSQL 16 | `5434` | Base de datos principal |

### Verificar que está corriendo

```bash
docker-compose ps
```

Deberías ver el contenedor `restaurant_db` con estado `Up`.

### Conectar con Beekeeper Studio

```
Host:     localhost
Port:     5434
User:     mario
Password: mario
Database: restaurant_reservations
```

> Las tablas se crean automáticamente al arrancar la aplicación gracias a `synchronize: true` en desarrollo.  
> ⚠️ En producción se usan migraciones. Ver [Despliegue](../06-deployment.md).

---

## Seeds

Los seeds poblan la base de datos con datos iniciales necesarios para el funcionamiento del sistema.

```bash
npm run seed
```

Esto crea:

| Dato       | Email                     | Password         |
|------------|---------------------------|------------------|
| Superadmin | `superadmin@mesaviva.com` | `SuperAdmin123!` |

> ⚠️ Cambia la contraseña del superadmin en producción.

Si ejecutas el seed más de una vez, detecta los datos existentes y los omite:

```bash
🌱 Iniciando seeds...
⏭️  Superadmin ya existe, omitiendo...
🌱 Seeds completados
```

---

## Arrancar la aplicación

```bash
npm run start:dev
```

Si todo está correcto verás:

```bash
🚀 MesaViva API corriendo en: http://localhost:3001/api/v1
```

---

## Verificar que funciona

### Test rápido con curl

```bash
# Login con el superadmin
curl -X POST http://localhost:3001/api/v1/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"superadmin@mesaviva.com","password":"SuperAdmin123!"}' \
-c cookies.txt

# Respuesta esperada
{
"user": {
  "id": "uuid...",
  "email": "superadmin@mesaviva.com",
  "role": "SUPERADMIN",
  "firstName": "Super",
  "lastName": "Admin",
  "mustChangePassword": false
}
}
```

### Con Postman

Importa la colección disponible en `docs/postman/mesaviva.json` *(próximamente)*.

---

## Estructura de carpetas

```
api/
├── src/
│   ├── modules/           # Módulos de negocio
│   │   ├── auth/
│   │   ├── users/
│   │   ├── restaurants/
│   │   ├── settings/
│   │   ├── reservations/
│   │   ├── payments/
│   │   └── notifications/
│   ├── shared/            # Infraestructura compartida
│   └── database/
│       └── seeds/         # Scripts de seed
├── docs/                  # Documentación
├── docker-compose.yml
├── .env.example
└── package.json
```

> Consulta [Arquitectura](../02-architecture.md) para entender la estructura interna de cada módulo.

---

## Solución de problemas comunes

### Error: `EACCES permission denied` al instalar paquetes globales

```bash
# Instalar nvm y gestionar Node sin sudo
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 22
nvm use 22
```

### Error: `connect ECONNREFUSED 127.0.0.1:5434`

La base de datos no está corriendo. Verifica Docker:

```bash
docker-compose up -d
docker-compose ps
```

### Error: `JWT_SECRET must be defined`

Falta la variable en `.env`. Asegúrate de haber copiado `.env.example`:

```bash
cp .env.example .env
```

### Las tablas no se crean en la BD

Verifica que `NODE_ENV=development` en `.env` para que `synchronize: true` esté activo.

---

## Siguientes pasos

- [Arquitectura del proyecto](./02-architecture.md)
- [Referencia de la API](./04-api/auth.md)