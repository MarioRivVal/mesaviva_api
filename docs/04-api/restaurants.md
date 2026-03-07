# API — Restaurantes

Módulo responsable de la gestión de restaurantes de la plataforma.

**Base URL:** `/api/v1/restaurants`

---

## Endpoints

| Método | Ruta                 | Descripción                           | Auth      |
|--------|----------------------|---------------------------------------|-----------|
| `GET`  | `/restaurants`       | Listar restaurantes activos (público) | ❌ Público |
| `GET`  | `/restaurants/:slug` | Obtener detalle de un restaurante     | ❌ Público |

---

## GET `/restaurants`

Devuelve todos los restaurantes activos de la plataforma.
Solo se incluyen restaurantes con `isActive: true`.

### Request

No requiere autenticación ni parámetros.

### Respuestas

**✅ 200 OK**

```json
{
  "restaurants": [
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "name": "El Rincón Asturiano",
      "slug": "el-rincon-asturiano",
      "category": "RESTAURANT",
      "address": "Calle Mayor 1, Oviedo",
      "imageUrl": "https://res.cloudinary.com/mesaviva/image/upload/restaurants/abc123.jpg"
    },
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "name": "La Cervecería del Puerto",
      "slug": "la-cerveceria-del-puerto",
      "category": "BREWERY",
      "address": "Muelle Norte 12, Gijón",
      "imageUrl": "https://res.cloudinary.com/mesaviva/image/upload/restaurants/def456.jpg"
    }
  ],
  "total": 2
}
```

> Los restaurantes se ordenan alfabéticamente por nombre.
> El filtrado de inactivos se realiza en la capa de aplicación tras obtenerlos de la BD.

---

## GET `/restaurants/:slug`

Devuelve el detalle completo de un restaurante junto con su configuración operativa.
Solo disponible para restaurantes activos.

Usado por el frontend público para mostrar la página del restaurante
y cargar el formulario de reserva con los horarios disponibles.

### Request

**Path params:**

| Parámetro | Tipo     | Descripción                |
|-----------|----------|----------------------------|
| `slug`    | `string` | Slug único del restaurante |

**Ejemplo:**

```
GET /api/v1/restaurants/el-rincon-asturiano
```

### Respuestas

**✅ 200 OK**

```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "name": "El Rincón Asturiano",
  "slug": "el-rincon-asturiano",
  "category": "RESTAURANT",
  "address": "Calle Mayor 1, Oviedo",
  "email": "info@rinconasturiano.com",
  "phone": "985123456",
  "imageUrl": "https://res.cloudinary.com/mesaviva/image/upload/restaurants/abc123.jpg",
  "settings": {
    "openingHours": {
      "monday": [],
      "tuesday": [],
      "wednesday": [{ "open": "13:00", "close": "16:00", "capacity": 40 }],
      "thursday": [{ "open": "13:00", "close": "16:00", "capacity": 40 }],
      "friday": [
        { "open": "13:00", "close": "16:00", "capacity": 40 },
        { "open": "20:00", "close": "23:00", "capacity": 50 }
      ],
      "saturday": [
        { "open": "13:00", "close": "16:30", "capacity": 50 },
        { "open": "20:00", "close": "23:30", "capacity": 50 }
      ],
      "sunday": [{ "open": "13:00", "close": "16:30", "capacity": 50 }]
    },
    "timeSlotInterval": 30,
    "depositAmount": 10,
    "acceptanceMode": "AUTO"
  }
}
```

> `settings` puede ser `null` si el restaurante todavía no ha configurado sus horarios.
> El frontend debe gestionar este caso (ej. mostrar un mensaje de "próximamente").

**❌ 404 Not Found — Restaurante no existe o está inactivo**

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Restaurant with id el-rincon-asturiano not found",
  "timestamp": "2026-03-01T10:00:00.000Z",
  "path": "/api/v1/restaurants/el-rincon-asturiano"
}
```

> Los restaurantes inactivos devuelven `404` (no `403`) para evitar revelar
> su existencia al público.

---

## Modelo de datos

### Restaurant (público)

```typescript
{
    id: string;
    name: string;
    slug: string;
    category: RestaurantCategory;
    address: string;
    email: string;
    phone: string;
    imageUrl: string;
    settings: PublicSettings | null;
}
```

### RestaurantCategory

| Valor        | Descripción |
|--------------|-------------|
| `RESTAURANT` | Restaurante |
| `BAR`        | Bar         |
| `BREWERY`    | Cervecería  |
| `TEA_HOUSE`  | Casa de té  |

### PublicSettings

```typescript
{
    openingHours: {
        monday: TimeRange[];
        tuesday: TimeRange[];
        wednesday: TimeRange[];
        thursday: TimeRange[];
        friday: TimeRange[];
        saturday: TimeRange[];
        sunday: TimeRange[];
    }
    ;
    timeSlotInterval: 15 | 30 | 60;  // minutos
    depositAmount: number;            // euros
    acceptanceMode: 'AUTO' | 'MANUAL';
}
```

### TimeRange

```typescript
{
    open: string;      // HH:mm — hora de apertura del turno
    close: string;     // HH:mm — hora de cierre del turno
    capacity: number;  // comensales máximos en el turno
}
```

### Slug

El slug se genera automáticamente desde el nombre del restaurante
al momento de su creación. Si existe colisión se añade sufijo:

```
"El Rincón Asturiano"  →  "el-rincon-asturiano"
"Café & Bar Oviedo"    →  "cafe-bar-oviedo"
"La Sidrería Güeña"    →  "la-sidreira-guena"

// colisión:
"el-rincon-asturiano"    (existe)
"el-rincon-asturiano-{timestamp}"  ← nuevo
```

---

## Endpoints pendientes (H2)

| Método  | Ruta                      | Descripción                      | Auth                            |
|---------|---------------------------|----------------------------------|---------------------------------|
| `GET`   | `/restaurants/mine`       | Ver mis restaurantes             | `RESTAURANT_ADMIN`              |
| `PATCH` | `/restaurants/:id`        | Actualizar datos del restaurante | `RESTAURANT_ADMIN` `SUPERADMIN` |
| `PATCH` | `/restaurants/:id/status` | Activar / desactivar restaurante | `SUPERADMIN`                    |

---

## Siguientes pasos

- [API — Settings](./settings.md)
- [API — Reservations](./reservations.md)
- [Módulo Restaurants](../05-modules/restaurants.md)
