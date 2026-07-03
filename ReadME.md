# GlobeTapX BackEnd

Backend en Node.js + Express + PostgreSQL (Supabase).

---

## Stack

- **Runtime:** Node.js (ES Modules, `"type": "module"`)
- **Framework:** Express 4
- **Base de datos:** PostgreSQL (Supabase) vía `pg`
- **Autenticación:** JWT (`jsonwebtoken`)
- **Contraseñas:** bcrypt
- **Rate limiting:** `express-rate-limit`
- **Traducciones:** API externa
- **Moneda/Clima:** APIs externas

---

## Inicio rápido

```bash
npm install
# Configurar .env con DATABASE_URL y JWT_SECRET
npm start
# Servidor en http://localhost:3000
```

### .env

```
DATABASE_URL="postgresql://..."
PORT=3000
JWT_SECRET="tu_secreto"
CURRENCY_API_KEY="..."
URL_API_REMOTA="..."
```

---

## Autenticación

### POST /api/auth/register
```json
{
    "nombre": "Juan Pérez",
    "mail": "juan@test.com",
    "contrasena": "123456",
}
```
Respuesta: `{ "token": "...", "user": {...}, "message": "Usuario registrado" }`

### POST /api/auth/login
```json
{
    "mail": "juan@test.com",
    "contrasena": "123456"
}
```
Respuesta: `{ "token": "...", "user": {...} }`

### GET /api/auth/status
Header: `Authorization: Bearer <token>` o query: `?token=<token>`
```json
{ "authenticated": true, "user": { "id": 1, "mail": "...", "nombre": "..." } }
```

### GET /api/auth/me
Requiere token. Devuelve datos del usuario autenticado.

---

## Sistema de Estadísticas

Dos tablas: `Estadisticas` (stats agregadas por usuario, 1:1) y `RegistroEstadisticas` (timeline de eventos, 1:N).

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/estadisticas` | Todas las estadísticas (admin) |
| `GET` | `/api/estadisticas/generales` | Conteos globales (usuarios, eventos, favoritos) |
| `GET` | `/api/estadisticas/usuario/:usuarioId` | Stats de un usuario (requiere token propio o admin) |
| `GET` | `/api/estadisticas/:id` | Stats por ID del registro |
| `POST` | `/api/estadisticas` | Crear registro de stats |
| `POST` | `/api/estadisticas/evento` | Registrar evento + auto-actualizar stats |
| `PUT` | `/api/estadisticas/:id` | Actualizar stats (admin) |
| `GET` | `/api/estadisticas/eventos/:usuarioId` | Timeline de eventos de un usuario |

### Tabla `Estadisticas`

| Columna | Tipo | Default |
|---------|------|---------|
| `ID` | `SERIAL PK` | |
| `IDUsuario` | `INTEGER FK` | |
| `paisesVisitados` | `INTEGER` | `0` |
| `expediciones` | `INTEGER` | `0` |
| `eventosAsistidos` | `INTEGER` | `0` |
| `continentesVisitados` | `INTEGER` | `0` |
| `diasViajando` | `INTEGER` | `0` |
| `nivelViajero` | `INTEGER` | `1` |
| `ultimaUbicacion` | `VARCHAR` | `null` |
| `fechaActualizacion` | `TIMESTAMP` | `now()` |

### Tabla `RegistroEstadisticas`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `ID` | `SERIAL PK` | |
| `IDUsuario` | `INTEGER` | FK al usuario |
| `tipoEvento` | `VARCHAR(100)` | Tipo de acción |
| `detalle` | `TEXT` | Info adicional (JSON) |

### Tipos de evento

| `tipoEvento` | Campo que auto-incrementa |
|---|---|
| `visita_pais` | `paisesVisitados++` |
| `creacion_expedicion` | `expediciones++` |
| `asistencia_evento` | `eventosAsistidos++` |
| `visita_continente` | `continentesVisitados++` |
| `inicio_viaje` | `diasViajando++` |

Ejemplo:
```json
POST /api/estadisticas/evento
{
    "usuarioId": 1,
    "tipoEvento": "visita_pais",
    "detalle": { "pais": "Argentina" }
}
```

### Auto-log desde controllers

Al crear un evento via `POST /api/evento`, el sistema registra automáticamente un evento de tipo `creacion_expedicion` en el timeline del usuario.

---

## Usuarios

### GET /api/usuario
Lista todos los usuarios.

### GET /api/usuario/:id
Usuario por ID.

### GET /api/usuario/mail/:mail
Usuario por mail.

### DELETE /api/usuario/:id
Elimina usuario y sus referencias en cascada (agenda, estadísticas, timeline, contenido categoría).

### Idioma preferido

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/idioma/supported` | Idiomas soportados |
| `GET` | `/api/idioma/preferred?usuarioId=<id>` | Idioma con fallback |
| `PUT` | `/api/idioma/preferred` | Cambiar idioma |

---

## Países

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/pais` | Lista países |
| `GET` | `/api/pais/:id` | País por ID |
| `GET` | `/api/paisInfo` | Información adicional de países |

---

## Eventos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/evento` | Lista eventos |
| `GET` | `/api/evento/:id` | Evento por ID |
| `POST` | `/api/evento` | Crear evento (auto-log en estadísticas) |
| `PUT` | `/api/evento` | Actualizar evento |
| `DELETE` | `/api/evento/:id` | Eliminar evento |

### GET /api/eventoFavorito
Eventos favoritos.

### GET /api/categoria
Categorías de eventos.

---

## Ubicación

### GET /api/ubicacion?ip=<ip>
Datos de ubicación según IP.

---

## Traducción

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/traduccion` | Traducir texto |
| `POST` | `/api/traduccion/batch` | Traducir varios textos |

Body:
```json
{ "text": "Hello", "targetLanguage": "es" }
```

---

## Moneda

| Método | Ruta |
|--------|------|
| `GET` | `/api/currency/country?country=<nombre>` |
| `GET` | `/api/currency/convert?from=USD&to=EUR&amount=100` |

---

## Clima

| Método | Ruta |
|--------|------|
| `GET` | `/api/clima/user-info` |
| `GET` | `/api/clima/country?country=<nombre>` |

---

## Números de Emergencia

### GET /api/numerosEmergencia
Lista de números de emergencia por país.

---

## Estructura del proyecto

```
src/
├── api/controllers/      → Rutas Express (controladores HTTP)
├── application/
│   ├── entities/         → Modelos/entidades
│   └── services/         → Lógica de negocio
├── data/
│   ├── repositories/     → Queries SQL
│   └── migrations/       → Scripts SQL para migraciones
├── configs/              → Configuración (pool DB)
├── helpers/              → Helpers (traducción)
└── server/
    └── server.js         → Entry point
```

---

## Migraciones

Ejecutar en Supabase SQL Editor:

```sql
ALTER TABLE "Estadisticas"
ADD COLUMN IF NOT EXISTS "eventosAsistidos" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "continentesVisitados" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "diasViajando" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "nivelViajero" INTEGER DEFAULT 1;

CREATE TABLE IF NOT EXISTS "RegistroEstadisticas" (
    "ID" SERIAL PRIMARY KEY,
    "IDUsuario" INTEGER NOT NULL,
    "tipoEvento" VARCHAR(100) NOT NULL,
    "detalle" TEXT,
);

CREATE INDEX IF NOT EXISTS idx_registro_estadisticas_usuario
ON "RegistroEstadisticas" ("IDUsuario");
```
