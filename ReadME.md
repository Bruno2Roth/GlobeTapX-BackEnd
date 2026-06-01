### GET /api/auth/status
- Con header `Authorization: Bearer <token>` o query `?token=<token>`.
- Respuesta esperada si es válido:
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "email": "usuario@example.com"
  }
}
```
- Si el token no existe o es inválido devuelve:
```json
{ "authenticated": false }
```

#### Uso posterior del token
- Después de hacer `POST /api/auth/login`, guarda el valor de `token`.
- Usa ese token en el header de autenticación para validar tu sesión.
- Ejemplo:
  - Header: `Authorization: Bearer eyJ...`
  - Request: `GET /api/auth/status`

> Actualmente este backend usa el token para verificar el estado de autenticación en `/api/auth/status`. No todos los endpoints del proyecto están protegidos por token todavía.

---

### Usuario
#### DELETE /api/usuario/:id
- Respuesta esperada 200:
```json
{
  "success": true,
  "message": "Usuario eliminado",
  "deleted": 1
}
```
### Países
### Idioma

#### GET /api/idioma/supported
- Devuelve idiomas soportados.

#### GET /api/idioma/preferred?usuarioId=<id>
- Devuelve idioma preferido para un usuario con fallback.

#### PUT /api/idioma/preferred
- Body:
```json
{
  "usuarioId": 1,
  "codigoIdioma": "es"
}
```
- Respuesta esperada 200 con objeto `data`.

---

### Ubicación

#### GET /api/ubicacion
- Query opcional:
  - `ip=<direccion_ip>`
- Devuelve datos de ubicación según IP.

---

### Traducción

#### POST /api/traduccion
- Body:
```json
{
  "text": "Hello",
  "targetLanguage": "es"
}
```
- Respuesta esperada 200:
```json
{
  "success": true,
  "data": { ...traducción... }
}
```

#### POST /api/traduccion/batch
- Body:
```json
{
  "texts": ["Hello", "World"],
  "targetLanguage": "es"
}
```
- Respuesta esperada 200 con traducciones en `data`.

---

### Moneda

#### GET /api/currency/country?country=<nombre>
- Devuelve información de moneda para un país.
- `400` si falta `country`.

#### GET /api/currency/convert?from=USD&to=EUR&amount=100
- Devuelve conversión de moneda.

---

### Clima

#### GET /api/clima/user-info
- Devuelve información de clima basada en la configuración actual.

#### GET /api/clima/country?country=<nombre>
- Devuelve clima para el país especificado.

---

### Endpoints adicionales (placeholders)

Estos endpoints existen pero actualmente devuelven mensajes placeholder o datos básicos:

- GET /api/categoria
- GET /api/categoriaEmergencia
- GET /api/contenidoPorCategoria
- GET /api/estadisticas
- GET /api/eventoFavorito
- GET /api/preferenciaUsuario
- GET /api/historial
- GET /api/logCambios

Ejemplo de respuesta actual:
```json
{ "message": "categoria controller (placeholder)" }
```

---

## Notas rápidas del proyecto

- Controladores: `src/api/controllers/`
- Servicios: `src/application/services/`
- Repositorios / consultas SQL: `src/data/repositories/`
- El backend usa `express`, `pg`, `jsonwebtoken`, `dotenv`.
- Revisa la consola del servidor para los logs de errores.

> Si prefieres, puedo también generar un archivo JSON importable para Postman con todas estas peticiones.
