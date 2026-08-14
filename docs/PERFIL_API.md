# Perfil: contrato, rendimiento y pruebas

## Contrato HTTP

Todas las rutas protegidas requieren exactamente el header:

```http
Authorization: Bearer <token>
```

Un header ausente, con otro esquema o con un JWT inválido responde:

```json
{
  "success": false,
  "message": "No autorizado"
}
```

### `GET /api/auth/me`

Responde `200` con una consulta SQL reducida y sin llamar a traducciones ni a
Storage:

```json
{
  "success": true,
  "user": {
    "id": 123,
    "nombreCompleto": "Nombre Apellido",
    "mail": "persona@ejemplo.com",
    "paisActual": 1,
    "idiomaPreferido": "es",
    "fotoPerfil": "https://api.ejemplo.com/api/auth/foto/123"
  }
}
```

`id` siempre es numérico y obligatorio. `idiomaPreferido` se normaliza a uno
de `es`, `en`, `fr`, `it`, `pt`, `ko`, `zh`, `he`; si el dato persistido es
nulo o inválido, se usa `es`. `fotoPerfil` es una URL de lectura perezosa: no
se espera a Storage durante `/me`. Al abrirla, el endpoint de foto genera la
URL firmada.

### `GET /api/auth/foto/:id`

Responde `200` incluso cuando el usuario no tiene foto:

```json
{
  "success": true,
  "fotoPerfil": "https://signed.example/...",
  "fotoPath": "usuarios/123/foto.webp"
}
```

Sin foto, ambos campos son `null`. La consulta usa únicamente `ID` y
`fotoPerfil`. Las nuevas cargas guardan solo `usuarios/<id>/foto.<ext>` en la
base de datos; nunca una URL firmada ni base64.

### `PUT /api/usuario/:id/foto`

Requiere `multipart/form-data` y exactamente un archivo en `fotoPerfil`.
Admite `image/jpeg`, `image/png`, `image/webp`, `image/gif` y `image/avif`, con
máximo de 5 MiB. La respuesta `200` tiene exactamente:

```json
{
  "success": true,
  "fotoPerfil": "https://signed.example/...",
  "fotoPath": "usuarios/123/foto.webp"
}
```

El usuario solo puede modificar su propio recurso, salvo un administrador.
El path es estable y se sube con `upsert`; la URL firmada se crea al terminar
la escritura y también al consultar la foto. Su TTL por defecto es 900
segundos y se puede cambiar con `SIGNED_URL_TTL_SECONDS`.

### Idioma

`GET /api/usuario/idioma?usuarioId=123`:

```json
{
  "success": true,
  "codigoIdioma": "en"
}
```

`PUT /api/usuario/idioma`:

```json
{
  "usuarioId": 123,
  "codigoIdioma": "en"
}
```

Responde `200` solo después de `UPDATE ... RETURNING "ID"`. La consulta de
lectura selecciona únicamente el idioma por la PK `Usuario("ID")`. `PUT
/api/usuario/:id` y `PUT /api/usuario` rechazan campos de idioma para forzar
el endpoint dedicado.

## Países: caché y backup

`GET /api/pais` usa stale-while-revalidate en memoria. La primera respuesta
sale inmediatamente del backup estático local (`src/data/static/paisesBackup.js`)
y una actualización a PostgreSQL se inicia en segundo plano. Las siguientes
respuestas usan la memoria durante `COUNTRIES_CACHE_TTL_MS` (10 minutos por
defecto). Si la BD falla o tarda más de `COUNTRIES_DB_TIMEOUT_MS` (750 ms), se
conserva el caché anterior o el backup. Solo se aplica a países; nunca se usa
para usuarios, idiomas escritos u otras escrituras.

La respuesta conserva el array histórico de países y añade el header interno
de diagnóstico `X-Countries-Cache: backup|database`.

## Timeouts y pool

- PostgreSQL: `DB_QUERY_TIMEOUT_MS=5000`, `DB_CONNECTION_TIMEOUT_MS=5000`,
  pool máximo `DB_POOL_MAX=10`.
- Storage/Supabase: `STORAGE_TIMEOUT_MS=8000`.
- URL firmada: `SIGNED_URL_TTL_SECONDS=900`.
- El middleware registra método, ruta normalizada, status y milisegundos sin
  query strings ni secretos en `[http-request]`.
- `src/observability/requestMetrics.js` mantiene conteo, promedio, mínimo,
  máximo y status por endpoint durante la vida del proceso.

## Índices

Ejecutar `src/data/migrations/20260814_profile_performance.sql` una vez:

- `idx_usuario_mail_normalized`: `LOWER(TRIM("mail"))` para login.
- `idx_usuario_profile_id_covering`: cubre la lectura mínima de `/auth/me`.
- `idx_usuario_idioma_por_usuario`: cubre `idiomaPreferido` junto con
  `Usuario("ID")`; la PK existente sigue siendo la ruta principal de acceso.

## Errores públicos

Las rutas nuevas usan siempre:

```json
{
  "success": false,
  "message": "Solicitud no válida"
}
```

Se usan `400` para datos inválidos, `401` para token/credenciales, `403` para
permisos y `503` para indisponibilidad temporal de PostgreSQL o Storage. Los
detalles técnicos se registran solo en logs internos y no se incluyen SQL,
stack traces, rutas, credenciales ni mensajes del proveedor.

## Pruebas y medición

La validación del cambio incluye:

- Sintaxis de todos los `.js` con `node --check`.
- Smoke HTTP de `400` (ID/body/formato inválido), `401` (sin Bearer), `403`
  (usuario autenticado sobre otro ID) y `503` (dependencia simulada con
  timeout).
- Pruebas unitarias del DTO de usuario, lista de idiomas, validación de foto
  y caché/backup de países.
- Casos de foto sin archivo, campo incorrecto, MIME no permitido, >5 MiB,
  foto ausente (`200` con `null`) y carga correcta.
- Casos de idioma inválido, usuario sin permiso, lectura y escritura correcta.

Smoke HTTP observado: `/api/auth/me` sin header `401`, con `Basic` `401`,
`/api/auth/foto/0` `400`, idioma de otro usuario `403`, body de idioma inválido
`400`, foto JSON/base64 `400`, MIME no permitido `400`, campo multipart
incorrecto `400`, `/auth/me` con PostgreSQL simulado caído `503` y
`/api/pais` con la misma caída `200` usando backup.

Los promedios reales dependen de la red, PostgreSQL y Storage configurados.
El proceso los registra por endpoint en `[http-request]` y los acumula en
`getRequestMetrics()`. No se presenta un promedio de producción como si fuera
una medición local.

Medición local ejecutada el 2026-08-14 contra el PostgreSQL configurado, con
10 solicitudes por endpoint y un JWT válido del usuario de prueba `2`:

| Endpoint | Promedio | Mínimo | Máximo | Status |
|---|---:|---:|---:|---:|
| `GET /api/auth/me` | 213.53 ms | 150.84 ms | 767.66 ms | 200 |
| `GET /api/auth/foto/:id` | 207.14 ms | 150.07 ms | 717.29 ms | 200 |
| `GET /api/usuario/idioma` | 151.06 ms | 150.51 ms | 152.15 ms | 200 |
| `GET /api/pais` | 0.69 ms | 0.52 ms | 1.82 ms | 200 |

La medición refleja la latencia de la instancia remota de PostgreSQL y no es
un SLA. `GET /api/pais` ya estaba servido desde memoria/backup; la consulta
de actualización se ejecutó en segundo plano. El usuario de la medición tenía
una referencia de foto legada resoluble sin Storage; una foto nueva en bucket
privado debe medirse nuevamente con las credenciales de Storage configuradas.

En el entorno local revisado, PostgreSQL respondió correctamente y existe el
bucket privado `perfil`, pero no había `SUPABASE_SERVICE_ROLE_KEY`; por eso la
integración real de carga/generación firmada queda correctamente protegida con
`503` hasta configurar esa variable. La validación de carga correcta se cubre
con el repositorio de Storage simulado en las pruebas unitarias.
