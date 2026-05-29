# GlobeTapX BackEnd — Peticiones de prueba (Postman / REST Client)

Este archivo contiene bloques listos para copiar/pegar en Postman o usar con la extensión **REST Client** de VSCode. Todas las peticiones usan `http://localhost:3000` por defecto; cambia la URL si tu servidor corre en otro puerto.

## Cómo usar

- Instalar dependencias y arrancar el servidor:

```bash
npm i
npm start

- Crear usuario (ejemplo mínimo)

POST http://localhost:3000/api/usuario
Content-Type: application/json

Body (JSON):

```json
{
  "nombre": "Prueba",
  "apellido": "Usuario",
  "email": "prueba2@example.com",
  "password": "secret",
  "fechaNacimiento": "1990-01-01"
}
```

Esperado: `201` con el `id` del usuario creado, o `400/409` si hay validación o email duplicado.

- Actualizar usuario (ejemplo)

PUT http://localhost:3000/api/usuario
Content-Type: application/json

Body (JSON):

```json
{
  "ID": 2, //este usuario no existe asi que falla cuando arregles esto quiero errores mas especificos
  "nombre": "NuevoNombre",
  "apellido": "NuevoApellido",
  "email": "usuario2@example.com",
  "password": "nuevasecret",
  "fechaNacimiento": "1990-01-01",
  "idiomaPreferido": "es"
}
```

Esperado: `200` con el número de filas afectadas. Si el `ID` no existe, el repositorio puede devolver `0`.

- Eliminar usuario por ID

DELETE http://localhost:3000/api/usuario/2

Esperado: `200` con número de filas afectadas (típicamente `1` si se eliminó).

---

## Endpoints `agendaUsuario` (ejemplos)

- Actualizar entrada (envía objeto con `ID`)

PUT http://localhost:3000/api/agendaUsuario
Content-Type: application/json
|
Body (JSON):

```json
{
  "ID": 1,
  "IDUsuario": 2,
  "IDEvento": 1,
  "interes": false,
  "recordatorio": true
}
```

- Eliminar entrada

DELETE http://localhost:3000/api/agendaUsuario/1

Esperado: `200` con número de filas afectadas.

---

## Autenticación (register / login)

Endpoints en `src/api/controllers/auth.js`:

- `POST /api/auth/login`:
  - Body: `{ "email": "<email>", "password": "<password>" }`.
  - Implementación actual: valida contra la tabla `Usuario` usando `usuariosService.getByEmailAsync`.
  - Si las credenciales son correctas devuelve `200` con `{ token, user }`.
  - Si no, devuelve `401`.

- `POST /api/auth/register`:
  - Crea un usuario usando `usuariosService.createAsync` y devuelve `201` con `{ id, message }`.

- `GET /api/auth/status`:
  - Verifica JWT en `Authorization: Bearer <token>` o en `?token=<token>`.

---

## Notas rápidas del proyecto

- Controladores: `src/api/controllers/`
- Servicios: `src/application/services/`
- Repositorios / consultas SQL: `src/data/repositories/`
- Los repositorios retornan `rows` o `rowCount` según la consulta.
- Revisa la consola del servidor para los logs de errores generados por los controladores/servicios.

Si quieres, genero también un archivo JSON importable para Postman con todas estas peticiones.
