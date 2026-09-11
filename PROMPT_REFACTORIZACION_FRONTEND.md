# Prompt para refactorizar `GlobeTapX-FrontEnd`

Trabajá únicamente sobre:

`C:\Users\rothb\Downloads\GlobeTapX-FrontEnd`

No modifiques `GlobeTapX-BackEnd` ni `ATIENDE_FRONTEND`.

## Objetivo

Refactorizar el frontend para que exista una sola fuente de verdad para:

1. Las llamadas HTTP al backend.
2. El token de autenticación.
3. El usuario autenticado y su foto.

Aplicá DRY a la infraestructura y usá un `SessionContext` de React para el estado de sesión.

## Problemas que tenés que resolver

- Actualmente hay dos implementaciones completas y paralelas de HTTP: `src/config.js` usa `fetch` y `src/services/api.js` usa `axios`.
- Hay funciones de API duplicadas, especialmente las relacionadas con eventos, en distintos archivos.
- El usuario autenticado se replica en `localStorage`, `authSession`, caches y estados locales que se sincronizan manualmente.
- Varias pantallas leen `localStorage.getItem("userId")` o `localStorage.getItem("user")` para decidir qué usuario consultar.
- Algunas funciones envían un `userId` recibido del cliente aunque la identidad correcta debe salir del token verificado por el servidor.
- El frontend tiene que dejar de tratar datos enviados por el cliente como autoridad para permisos o identidad.

## Arquitectura requerida

### 1. Cliente HTTP único

- Convertí `src/services/api.js` en el único cliente HTTP del backend.
- Mantené allí la base URL, el agregado del Bearer token, el manejo de errores de red y la reacción ante `401`/`431`.
- Agregá un adaptador `request()` si ayuda a migrar llamadas existentes, pero debe usar internamente el mismo cliente Axios.
- No hagas navegación ni manipules directamente el estado de React desde los interceptores.
- Ante expiración o rechazo de sesión, limpiá el token y emití un evento de sesión expirada para que `SessionContext` actualice la UI.
- No debe quedar otro wrapper `fetch` para llamadas al backend.
- Las llamadas a servicios públicos externos que no son el backend pueden conservar `fetch`.

### 2. Servicio único de endpoints

- Creá un módulo central, por ejemplo `src/services/backendApi.js`, que concentre todos los endpoints del backend.
- Migrá allí login, registro, usuario, foto, países, categorías, agenda, clima y eventos.
- Reemplazá `src/services/evento.js` por reexportaciones del servicio central o eliminá la duplicación sin romper imports.
- Eliminá `src/config.js` cuando ya no tenga consumidores.
- No mantengas dos funciones con el mismo propósito en archivos distintos.

### 3. Contexto único de sesión

- Creá `src/context/SessionContext.jsx` con un `SessionProvider` y un hook `useSession()`.
- El contexto debe ser la única fuente de verdad en React para `user`, `photo`, `userId`, `loading` e `isAuthenticated`.
- Centralizá allí login, registro, logout, carga inicial mediante `/auth/me`, actualización del usuario y carga de la foto.
- Persistí únicamente el token como credencial. No uses `localStorage` como fuente de verdad del usuario.
- No guardes copias paralelas de `user`, `userId` o `fotoPerfil` para que las pantallas las lean.
- Si existen caches viejas de identidad, eliminá su uso y limpiá sus valores durante la migración.
- `ProtectedRoute` debe depender de `useSession()`, no de una lectura directa de `localStorage`.
- Los componentes `Header`, `TopBar`, `ProfileCard`, login, registro, perfil y selector de idioma deben consumir `useSession()`.

### 4. Identidad y autorización

- Nunca uses un `userId` enviado por el cliente para decidir permisos, propiedad o identidad.
- Para operaciones del usuario actual, el frontend debe llamar endpoints que resuelvan la identidad desde el JWT.
- No envíes `IDUsuario`/`usuarioId` en el body de operaciones de agenda, idioma o perfil cuando el endpoint ya puede obtenerlo del token.
- Si el backend conserva esos campos por compatibilidad, el servidor debe ignorar valores distintos al usuario del token; el frontend no debe depender de ellos.
- Para datos de otro usuario, solo debe existir acceso si el endpoint y el backend lo autorizan explícitamente, por ejemplo una regla de administrador.
- No confíes en `userId`, `IsAdmin`, permisos, roles o identidad provenientes del body, query string o estado manipulable del cliente.

### 5. Migración de pantallas

Migrá todas las pantallas y componentes que actualmente importan `config.js`, `authSession`, `userProfileService` o leen `localStorage` para obtener la identidad. Como mínimo revisá:

- `src/App.jsx`
- `src/Pages/login.jsx`
- `src/Pages/perfil.jsx`
- `src/Pages/agenda.jsx`
- `src/Pages/clima.jsx`
- `src/Pages/documentacion.jsx`
- `src/Pages/vidaDiaria.jsx`
- `src/Pages/reglas.jsx`
- `src/Pages/home.jsx`
- `src/Pages/numEmergencia.jsx`
- `src/Pages/eventos.jsx`
- `src/Pages/detalleEvento.jsx`
- `src/Pages/horario.jsx`
- `src/Componentes/Header/Header.jsx`
- `src/Componentes/TopBar/TopBar.jsx`
- `src/Componentes/ProfileCard/ProfileCard.jsx`
- `src/Componentes/LanguageSelector/LanguageSelector.jsx`
- `src/Componentes/RegisterForm/RegisterForm.jsx`
- `src/services/languageService.js`

En cada caso:

- Usá `const { user, ... } = useSession()`.
- Derivá `userId` únicamente de `user?.id` cuando sea indispensable para una ruta de lectura autorizada.
- No vuelvas a crear estados locales que representen otra copia completa del usuario.
- Después de actualizar el perfil, idioma o foto, actualizá el contexto; no sincronices manualmente varias caches.
- Mantené los estados locales solo para datos propios de la pantalla, como formularios, filtros, loading o errores.

### 6. Idioma y datos auxiliares

- `getPreferredLanguage` y `updatePreferredLanguage` deben usar la identidad del token y no depender de un `usuarioId` suministrado por la pantalla.
- Países, categorías y demás catálogos pueden tener cache de datos, pero no deben usarse para representar la sesión o la identidad.
- Los caches de contenido por pantalla pueden mantenerse si no contienen autoridad de autenticación ni permisos.

## Compatibilidad y calidad

- Conservá los contratos de respuesta actuales del backend y normalizá respuestas `{ success, data }` cuando sea necesario.
- No rompas las rutas existentes.
- Protegé cualquier ruta que requiera sesión, incluido horario si usa datos del usuario.
- Evitá cambios de estilos o textos que no sean necesarios para esta refactorización.
- Revisá imports sin uso, funciones duplicadas, dependencias de `useEffect` y errores de lint.
- No incluyas tokens, usuarios reales ni datos personales en archivos nuevos.

## Verificación obligatoria

Ejecutá desde `GlobeTapX-FrontEnd`:

```bash
npm run lint
npm run build
```

Además comprobá que:

- no haya imports de `src/config.js`;
- no haya llamadas al backend con `fetch` fuera del cliente central;
- no haya lecturas de `localStorage` para `user`, `userId` o `fotoPerfil` fuera del manejo central del token/migración;
- no haya dos implementaciones de los mismos endpoints;
- ninguna pantalla pueda elegir la cuenta afectada enviando un `userId` arbitrario;
- el logout, un `401` y la recarga de la aplicación actualicen correctamente el contexto.

## Entregables

1. Código refactorizado en `GlobeTapX-FrontEnd`.
2. Un archivo `REFACTORIZACION_FRONTEND.md` con un resumen breve de los cambios, archivos principales y verificaciones ejecutadas.
3. Una nota explícita de cualquier limitación o endpoint que todavía requiera compatibilidad con parámetros antiguos.
