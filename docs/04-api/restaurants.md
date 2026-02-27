# API — Restaurantes

Módulo responsable de la gestión de restaurantes de la plataforma.

**Base URL:** `/api/v1/restaurants`

---

## Estado

| Endpoint                        | Estado       |
|---------------------------------|--------------|
| `GET /restaurants`              | 🚧 Pendiente |
| `GET /restaurants/:slug`        | 🚧 Pendiente |
| `GET /restaurants/mine`         | 🚧 Pendiente |
| `PATCH /restaurants/:id`        | 🚧 Pendiente |
| `PATCH /restaurants/:id/status` | 🚧 Pendiente |

> Los endpoints se documentarán conforme se implementen.

---

## Modelo de datos

### Restaurant

```typescript
{
    id: string;                      // UUID v4
    name: string;
    slug: string;                    // generado desde el nombre, único
    adminId: string;                 // ID del RESTAURANT_ADMIN responsable
    phone: string;                   // teléfono español
    address: string;
    category: RestaurantCategory;
    email: string;
    imageUrl: string;                // URL de Cloudinary
    isActive: boolean;
    createdAt: Date;                 // UTC
    updatedAt: Date;                 // UTC
}
```

### RestaurantCategory

| Valor        | Descripción |
|--------------|-------------|
| `RESTAURANT` | Restaurante |
| `BAR`        | Bar         |
| `BREWERY`    | Cervecería  |
| `TEA_HOUSE`  | Casa de té  |

### Slug

El slug se genera automáticamente desde el nombre del restaurante
al momento de su creación:

```
"El Rincón Asturiano"  →  "el-rincon-asturiano"
"Café & Bar Oviedo"    →  "cafe-bar-oviedo"
```

Si ya existe un slug igual se añade sufijo:

```
"el-rincon-asturiano"    (existe)
"el-rincon-asturiano-2"  ← nuevo
```

---

## Siguientes pasos

- [API — Settings](./settings.md)
- [API — Reservations](./reservations.md)