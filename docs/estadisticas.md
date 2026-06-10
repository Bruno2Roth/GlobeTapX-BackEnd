# Sistema de Estadísticas

## Resumen

El sistema de estadísticas está compuesto por dos partes que funcionan juntas:

1. **Estadísticas agregadas** (`Estadisticas`) — un registro por usuario con contadores acumulados
2. **Timeline de eventos** (`RegistroEstadisticas`) — historial cronológico de acciones del usuario

---

## Endpoints

### Estadísticas agregadas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/estadisticas` | Obtener todas las estadísticas (admin) |
| `GET` | `/api/estadisticas/usuario/:usuarioId` | Estadísticas de un usuario específico |
| `GET` | `/api/estadisticas/:id` | Estadística por ID |
| `POST` | `/api/estadisticas` | Crear registro de estadísticas para un usuario |
| `PUT` | `/api/estadisticas/:id` | Actualizar estadísticas (admin) |

### Timeline de eventos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/estadisticas/eventos/:usuarioId` | Timeline de eventos de un usuario |
| `POST` | `/api/estadisticas/evento` | Registrar un evento + auto-actualizar stats |

---

## Tabla: `Estadisticas`

Un registro por usuario con los contadores acumulados.

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `ID` | `SERIAL PK` | | ID único del registro |
| `IDUsuario` | `INTEGER` | | FK al usuario |
| `paisesVisitados` | `INTEGER` | `0` | Cantidad de países visitados |
| `expediciones` | `INTEGER` | `0` | Expediciones creadas |
| `eventosAsistidos` | `INTEGER` | `0` | Eventos a los que asistió |
| `continentesVisitados` | `INTEGER` | `0` | Continentes visitados |
| `diasViajando` | `INTEGER` | `0` | Días totales de viaje |
| `nivelViajero` | `INTEGER` | `1` | Nivel / badge del usuario |
| `ultimaUbicacion` | `VARCHAR` | `null` | Última ubicación conocida |
| `fechaActualizacion` | `TIMESTAMP` | `now()` | Última actualización |

---

## Tabla: `RegistroEstadisticas`

Historial cronológico de acciones del usuario (timeline).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `ID` | `SERIAL PK` | ID único del registro |
| `IDUsuario` | `INTEGER` | FK al usuario |
| `tipoEvento` | `VARCHAR(100)` | Tipo de evento (ver lista abajo) |
| `detalle` | `TEXT` | Info adicional en JSON |
| `fecha` | `TIMESTAMP` | Fecha del evento |

---

## Tipos de evento y auto-actualización

Cuando se llama a `POST /api/estadisticas/evento`, el sistema:
1. Guarda el evento en `RegistroEstadisticas`
2. Incrementa automáticamente el campo correspondiente en `Estadisticas`

| `tipoEvento` | Campo que se incrementa |
|---|---|
| `visita_pais` | `paisesVisitados` |
| `creacion_expedicion` | `expediciones` |
| `asistencia_evento` | `eventosAsistidos` |
| `visita_continente` | `continentesVisitados` |
| `inicio_viaje` | `diasViajando` |

Si el usuario no tiene aún un registro en `Estadisticas`, se crea automáticamente con el valor inicial.

---

## Cómo usarlo desde otros controladores

Cualquier controller puede registrar eventos importando el service:

```js
import estadisticasService from '../../application/services/estadisticasService.js';

const statsService = new estadisticasService();

// En el handler, después de la acción:
await statsService.logEventoAsync(usuarioId, 'visita_pais', { pais: 'Argentina' });
// o directamente vía HTTP:
// POST /api/estadisticas/evento  { usuarioId, tipoEvento, detalle }
```

---

## Migración SQL

Antes de usar, ejecutar `src/data/migrations/estadisticas_historial.sql` en la base de datos (Supabase SQL Editor).

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
    "fecha" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registro_estadisticas_usuario
ON "RegistroEstadisticas" ("IDUsuario");
```

---

## Nota: limpieza al eliminar usuario

Si se agrega eliminación de usuarios, conviene borrar también los registros de `RegistroEstadisticas` junto con los de `Estadisticas`. Actualmente `usuariosService.js` ya elimina de `Estadisticas` al borrar un usuario (`deleteByUsuarioAsync`), pero no de `RegistroEstadisticas` — habría que agregarlo.

---

## Ejemplos Postman / curl

### GET /api/estadisticas
Obtener todas las estadísticas (admin).
```
GET http://localhost:3000/api/estadisticas
```

Respuesta:
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "idusuario": 1,
            "paisesvisitados": 5,
            "expediciones": 3,
            "eventosasistidos": 2,
            "continentesvisitados": 2,
            "diasviajando": 15,
            "nivelviajero": 3,
            "ultimaubicacion": "Buenos Aires",
            "fechaactualizacion": "2026-06-10T12:00:00.000Z"
        }
    ]
}
```

### GET /api/estadisticas/usuario/:usuarioId
Estadísticas de un usuario específico (requiere token del mismo usuario o admin).
```
GET http://localhost:3000/api/estadisticas/usuario/1
Authorization: Bearer <token>
```

Respuesta:
```json
{
    "success": true,
    "data": {
        "id": 1,
        "idusuario": 1,
        "paisesvisitados": 5,
        "expediciones": 3,
        "eventosasistidos": 2,
        "continentesvisitados": 2,
        "diasviajando": 15,
        "nivelviajero": 3,
        "ultimaubicacion": null,
        "fechaactualizacion": null
    }
}
```

### GET /api/estadisticas/:id
Estadística por ID del registro.
```
GET http://localhost:3000/api/estadisticas/1
```

Respuesta:
```json
{
    "success": true,
    "data": {
        "id": 1,
        "idusuario": 1,
        "paisesvisitados": 5,
        ...
    }
}
```

### POST /api/estadisticas
Crear registro de estadísticas para un usuario.
```
POST http://localhost:3000/api/estadisticas
Content-Type: application/json

{
    "IDUsuario": 1
}
```

Respuesta:
```json
{
    "success": true,
    "data": {
        "id": 2
    }
}
```

Con valores iniciales personalizados:
```json
{
    "IDUsuario": 2,
    "paisesVisitados": 3,
    "expediciones": 1,
    "nivelViajero": 2
}
```

### POST /api/estadisticas/evento
Registrar un evento en el timeline y auto-actualizar las stats agregadas.
```
POST http://localhost:3000/api/estadisticas/evento
Content-Type: application/json

{
    "usuarioId": 1,
    "tipoEvento": "visita_pais",
    "detalle": {
        "pais": "Argentina",
        "ciudad": "Buenos Aires",
        "fecha": "2026-06-10"
    }
}
```

Respuesta:
```json
{
    "success": true,
    "message": "Evento registrado y estadísticas actualizadas"
}
```

Ejemplos para cada tipo de evento:

| Body | Efecto |
|------|--------|
| `{ "usuarioId": 1, "tipoEvento": "visita_pais", "detalle": { "pais": "Brasil" } }` | `paisesVisitados++` |
| `{ "usuarioId": 1, "tipoEvento": "creacion_expedicion", "detalle": { "nombre": "Expedición Amazonas" } }` | `expediciones++` |
| `{ "usuarioId": 1, "tipoEvento": "asistencia_evento", "detalle": { "evento": "Carnaval" } }` | `eventosAsistidos++` |
| `{ "usuarioId": 1, "tipoEvento": "visita_continente", "detalle": { "continente": "América del Sur" } }` | `continentesVisitados++` |
| `{ "usuarioId": 1, "tipoEvento": "inicio_viaje", "detalle": { "destino": "Perú" } }` | `diasViajando++` |

### GET /api/estadisticas/eventos/:usuarioId
Obtener el timeline de eventos de un usuario.
```
GET http://localhost:3000/api/estadisticas/eventos/1
```

Respuesta:
```json
{
    "success": true,
    "data": [
        {
            "id": 3,
            "idusuario": 1,
            "tipoevento": "visita_pais",
            "detalle": "{\"pais\":\"Argentina\",\"ciudad\":\"Buenos Aires\"}",
            "fecha": "2026-06-10T12:00:00.000Z"
        },
        {
            "id": 2,
            "idusuario": 1,
            "tipoevento": "creacion_expedicion",
            "detalle": "{\"nombre\":\"Expedición Amazonas\"}",
            "fecha": "2026-06-09T10:00:00.000Z"
        }
    ]
}
```

### PUT /api/estadisticas/:id
Actualizar estadísticas (admin). Solo enviar los campos a modificar.
```
PUT http://localhost:3000/api/estadisticas/1
Content-Type: application/json

{
    "paisesVisitados": 10,
    "nivelViajero": 5
}
```

Respuesta:
```json
{
    "success": true,
    "message": "Estadísticas actualizadas",
    "rowsAffected": 1
}
```

> ⚠️ El `:id` es el ID del registro en la tabla `Estadisticas`, no el ID del usuario. Para buscar por usuario usá `GET /api/estadisticas/usuario/:usuarioId`.
