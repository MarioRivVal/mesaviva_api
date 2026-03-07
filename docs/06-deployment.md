# Despliegue

Guía de despliegue de MesaViva API en entorno de producción.

---

## Infraestructura

| Componente    | Servicio      | Descripción                              |
|---------------|---------------|------------------------------------------|
| Servidor      | Hetzner VPS   | Servidor privado virtual en Europa       |
| Orquestación  | Coolify       | Self-hosted PaaS sobre Docker            |
| Base de datos | PostgreSQL 16 | Contenedor Docker gestionado por Coolify |
| Dominio       | —             | A configurar                             |
| SSL           | Let's Encrypt | Gestionado automáticamente por Coolify   |

---

## Variables de entorno en producción

Todas las variables se configuran en el panel de Coolify.
**Nunca** se suben al repositorio.

```bash
# ── Aplicación ────────────────────────────────────
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://mesaviva.com

# ── Base de datos ─────────────────────────────────
DB_HOST=<host_interno_coolify>
DB_PORT=5432
DB_USER=<usuario_seguro>
DB_PASSWORD=<password_seguro>
DB_NAME=restaurant_reservations

# ── JWT ───────────────────────────────────────────
JWT_SECRET=<secreto_largo_y_aleatorio_minimo_64_chars>
JWT_EXPIRES_IN=86400

# ── Email (Resend) ────────────────────────────────
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_NAME=MesaViva
EMAIL_FROM_ADDRESS=noreply@mesaviva.com

# ── Cloudinary ────────────────────────────────────
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>

# ── Stripe (H3) ───────────────────────────────────
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
```

> ⚠️ En producción `NODE_ENV=production` desactiva `synchronize: true`
> y activa el flag `Secure` en las cookies.

---

## Checklist antes de desplegar

### Seguridad

- [ ] `JWT_SECRET` tiene mínimo 64 caracteres aleatorios
- [ ] `DB_PASSWORD` es una contraseña robusta
- [ ] `NODE_ENV=production` configurado
- [ ] `synchronize: false` en TypeORM (se aplica automáticamente)
- [ ] CORS configurado solo para el dominio de producción
- [ ] Variables de entorno configuradas en Coolify, no en archivos

### Base de datos

- [ ] Migraciones ejecutadas antes del primer arranque
- [ ] Backup automático configurado en Coolify
- [ ] Seed de superadmin ejecutado
- [ ] Password del superadmin cambiada tras el primer login

### Aplicación

- [ ] `npm run build` compila sin errores
- [ ] Todos los endpoints críticos probados en staging
- [ ] Logs de errores configurados

---

## Docker

### `Dockerfile`

> 🚧 Pendiente de crear

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

### `.dockerignore`

> 🚧 Pendiente de crear

```
node_modules
dist
.env
.git
docs
```

---

## Migraciones

> 🚧 Pendiente de configurar

En producción `synchronize: false`. Los cambios de esquema
se aplican mediante migraciones de TypeORM de forma controlada y reversible.

```bash
# Generar migración desde cambios en entidades
npm run migration:generate -- src/database/migrations/NombreMigracion

# Ejecutar migraciones pendientes
npm run migration:run

# Revertir última migración
npm run migration:revert
```

Scripts a añadir en `package.json`:

```json
{
  "scripts": {
    "migration:generate": "typeorm-ts-node-commonjs migration:generate",
    "migration:run": "typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts",
    "migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/database/data-source.ts"
  }
}
```

---

## Backups

Configurados en Coolify con política:

| Tipo               | Frecuencia | Retención |
|--------------------|------------|-----------|
| Backup completo BD | Diario     | 7 días    |
| Backup completo BD | Semanal    | 4 semanas |

---

## Monitorización

> 🚧 Pendiente de configurar

| Herramienta     | Uso                         |
|-----------------|-----------------------------|
| Logs de Coolify | Errores de aplicación       |
| Uptime Kuma     | Disponibilidad del servicio |

---

## Generación del JWT_SECRET

```bash
# Generar un secreto seguro de 64 caracteres
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## CI/CD con GitHub Actions

> 🚧 Pendiente de configurar

Pipeline recomendado con GitHub Actions que se ejecuta en cada push a `main`:

```yaml
# .github/workflows/deploy.yml
name: Deploy MesaViva API

on:
  push:
    branches: [ main ]

jobs:
  test:
    name: Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: api/package-lock.json
      - name: Install dependencies
        run: npm ci
        working-directory: api
      - name: Run tests
        run: npm test
        working-directory: api
      - name: Build
        run: npm run build
        working-directory: api

  deploy:
    name: Deploy to Coolify
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Coolify deploy webhook
        run: |
          curl -X POST "${{ secrets.COOLIFY_WEBHOOK_URL }}" \
            -H "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}"
```

**Secrets necesarios en GitHub:**

| Secret                | Descripción                          |
|-----------------------|--------------------------------------|
| `COOLIFY_WEBHOOK_URL` | URL del webhook de deploy en Coolify |
| `COOLIFY_TOKEN`       | Token de autenticación de Coolify    |

---

## Siguientes pasos

- Crear `Dockerfile` y `.dockerignore` en la raíz de `api/`
- Configurar migraciones de TypeORM (`data-source.ts`)
- Crear pipeline `.github/workflows/deploy.yml`
- Configurar dominio y SSL en panel de Coolify
- [Testing](./07-testing.md)
- [Roadmap](./09-roadmap.md)
