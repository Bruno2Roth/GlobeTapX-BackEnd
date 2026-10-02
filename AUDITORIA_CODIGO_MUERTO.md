# Auditoría de código muerto, duplicado y archivos innecesarios

## Alcance y método

Auditoría realizada en modo solo lectura. No se modificó código fuente, no se borraron archivos, no se crearon commits ni se abrieron Pull Requests.

Se revisaron:

- `index.js`, `src/server/server.js`, `package.json` y los tests.
- El registro de Express en `src/app/app.js`.
- Imports/exports estáticos con `rg`.
- Controllers, services, repositories, helpers, entidades y configuraciones.
- Rutas registradas y métodos realmente invocados.
- Dependencias de `package.json`.
- SQL, migraciones, scripts y documentación.

`package.json` tiene dos formas de iniciar el servidor:

- `main: index.js`
- `npm start` y `npm run watch`: `src/server/server.js`

Los 20 controllers existentes están importados y montados en `app.js`. No se encontró un controller completamente desregistrado.

`npm test` no pudo ejecutarse normalmente porque el entorno bloquea el spawn de procesos con `EPERM`. Los tres archivos se ejecutaron directamente y pasaron: 11 tests en total. Todos los `.js` pasan `node --check`.

## A. Código que se puede eliminar con alta confianza

### A1. Entidades nunca importadas

**Archivos:**

`src/application/entities/`:

- `agendaUsuario.js`
- `categoria.js`
- `clima.js`
- `contenidoCategoria.js`
- `estadisticas.js`
- `evento.js`
- `idiomaSoportado.js`
- `numerosEmergencia.js`
- `pais.js`
- `preferenciasUsuario.js`
- `registroEstadisticas.js`
- `traduccion.js`
- `ubicacion.js`
- `usuario.js`
- `zlogCambios.js`

**Código involucrado:** clases exportadas por defecto, definidas desde la línea 1 de cada archivo.

**Por qué:** sólo cuatro entidades se importan actualmente: `currency.js`, `eventoFavorito.js`, `paisInfo.js` y `storageFile.js`. Los repositories devuelven `res.rows` directamente y no instancian estas entidades.

**Referencias buscadas:** `rg 'from .*entities/' src test index.js` sólo encontró esos cuatro imports. No hay `import()` dinámicos, loaders por directorio ni `require()` de estas entidades.

**Certeza:** seguro dentro del repositorio actual.

**Qué haría:** eliminar los 15 archivos.

**Qué podría romperse:** consumidores externos que importen directamente estas clases desde `src/`. No forman parte de los entry points del backend.

**Tests:** no existen tests directos para estas entidades. Los tests actuales pasan sin importarlas.

### A2. Repository de idiomas obsoleto

**Archivo:** `src/data/repositories/idiomaRepository.js:1-16`.

**Código involucrado:** `idiomaRepository.getIdiomasSoportadosAsync()`.

**Por qué:** `idiomaService` utiliza el catálogo estático de `src/idiomas/index.js`; nunca importa este repository.

**Referencias buscadas:** no hay imports de `idiomaRepository.js` en `src`, `test` ni `index.js`.

**Certeza:** seguro dentro del backend actual.

**Qué haría:** eliminar el archivo.

**Qué podría romperse:** código externo que lo importe directamente.

**Tests:** `test/idiomas.test.js` cubre el catálogo estático, no este repository.

### A3. Implementación antigua de traducciones

**Archivos:**

- `src/data/repositories/traduccionRepository.js:1-20`
- `src/helpers/mymemoryTranslationHelper.js:1-108`

**Código involucrado:** queries contra la tabla `Traduccion`, cliente MyMemory y caché de traducción.

**Por qué:** `src/application/services/traduccionService.js:13-15` documenta que las rutas ya no dependen de MyMemory ni de la tabla `Traduccion`. El servicio actual usa `src/idiomas/index.js`.

**Referencias buscadas:** no hay imports de ninguno de los dos archivos. No hay rutas ni tests que los instancien.

**Certeza:** seguro dentro del backend actual.

**Qué haría:** eliminar ambos módulos.

**Qué podría romperse:** consumidores externos directos o una migración futura al sistema antiguo.

**Tests:** `test/idiomas.test.js` verifica la traducción local y que no se realicen llamadas externas.

### A4. Service y repository de preferencias sin consumidores

**Archivos:**

- `src/application/services/preferenciaUsuarioService.js`
- `src/data/repositories/preferenciaUsuarioRepository.js`

**Código involucrado:** CRUD completo de `PreferenciaUsuario`.

**Por qué:** el controller montado en `src/api/controllers/preferenciaUsuarioController.js:5-6` sólo devuelve `{ message: 'preferenciaUsuario controller (placeholder)' }` y no importa el service.

**Referencias buscadas:** no hay imports de estos dos archivos en el grafo de ejecución.

**Certeza:** segura respecto del runtime actual; la decisión de producto sobre preferencias requiere revisión.

**Qué haría:** eliminar service y repository en el PR de limpieza. Mantener el controller placeholder hasta decidir si la ruta debe eliminarse.

**Qué podría romperse:** eliminar la ruta podría romper clientes que actualmente reciben el `200` placeholder.

**Tests:** no hay tests relacionados.

### A5. Configuración sin uso en moneda

**Archivo:** `src/application/services/currencyService.js:8-11`.

**Código involucrado:** `this.apiSecret = process.env.CURRENCY_API_SECRET`.

**Por qué:** `apiSecret` sólo se asigna y nunca se lee. La conversión usa únicamente `this.apiKey`. La variable tampoco figura en `.env.template`.

**Referencias buscadas:** `rg 'apiSecret|CURRENCY_API_SECRET'` sólo devuelve esa asignación.

**Certeza:** segura.

**Qué haría:** eliminar la propiedad y su configuración asociada si existiera en despliegues.

**Qué podría romperse:** ninguna ruta actual; sólo una futura integración que pretendiera usar esa credencial.

**Tests:** no hay tests de moneda.

## B. Código probablemente obsoleto

### B1. Métodos sin consumidores visibles

**Ubicación y elementos:**

- `agendaUsuarioService.getByEventoAsync()` y `agendaUsuarioRepository.getByEventoAsync()`.
- `eventosRepository.getCercanosAsync()`.
- `estadisticasService.getAllEventosAsync()` y `registroEstadisticasRepository.getAllAsync()`.
- `paisInfoService.getAllRulesAsync()`, `getRulesByPaisIdAsync()`, `getRulesByPaisNameAsync()` y sus métodos repository.
- `zLogCambiosRepository.updateAsync()` y `deleteByIdAsync()`.
- `usuariosService.getByNombreAsync()`.
- `usuariosService.getIdiomaPreferidoAsync()`.
- `usuariosService.getIdiomasSoportados()`.
- `usuariosRepository.getIdiomaPreferidoAsync()`.
- `traduccionService.getTodasLasTraduccionesAsync()`.

**Por qué:** no hay llamadas desde controllers, rutas, tests ni otros services. En varios casos existe una ruta parecida, pero usa otra implementación.

**Referencias buscadas:** búsquedas por nombre de método en `src`, `test` e `index.js`.

**Certeza:** probable; requiere revisar si algún consumidor externo importa los services directamente.

**Qué haría:** eliminar o unificar después de confirmar el contrato externo.

**Qué podría romperse:** APIs internas usadas por otro repositorio o scripts no presentes aquí.

**Tests:** no hay tests específicos para estos métodos.

### B2. Exports sin consumidores externos

**Ubicación y elementos:**

- `src/idiomas/index.js:15,55,59,155`: `IDIOMAS`, `getLanguageById`, `isSupportedLanguage`, `getTagDefinitions`.
- `src/api/middlewares/auth.js:26`: `optional`.
- `src/observability/requestMetrics.js:21,30`: `getRequestMetrics`, `resetRequestMetrics`.
- `src/helpers/timezoneMap.js:38`: export default de `countryUtcOffset`.
- `src/configs/SPConfig.js:12`: export de `DB_QUERY_TIMEOUT_MS`.
- `src/application/dtos/userProfile.js:8`: reexport de `SUPPORTED_LANGUAGE_CODES`.

**Por qué:** no hay imports externos de esos símbolos. Algunos se utilizan internamente, por lo que no debe eliminarse el archivo completo automáticamente.

**Referencias buscadas:** imports nombrados en `src`, `test` e `index.js`.

**Certeza:** probable; las exports podrían formar parte de una API de módulos no documentada.

**Qué haría:** reducir exports sólo después de confirmar que el backend no se consume como librería.

**Qué podría romperse:** imports directos desde scripts o aplicaciones externas.

**Tests:** no hay tests para esos exports concretos.

### B3. Controller placeholder

**Archivo:** `src/api/controllers/preferenciaUsuarioController.js:1-8`.

**Por qué:** está registrado en `app.js:90`, pero no implementa ningún caso de uso real.

**Certeza:** probable obsolescencia, no código muerto absoluto porque la ruta responde.

**Qué haría:** investigar si la funcionalidad fue abandonada; luego implementar o retirar controller, service, repository y tabla de forma coordinada.

**Qué podría romperse:** clientes actuales podrían depender de `/api/preferenciaUsuario`.

**Tests:** no hay tests.

### B4. Helper de frontend dentro del backend

**Archivo:** `src/helpers/translatePage.js`.

**Código involucrado:** usa `window`, `document`, `MutationObserver` y `localStorage`.

**Por qué:** no tiene imports ni consumidores en este repositorio y no puede ejecutarse en Node.

**Certeza:** probable; podría ser un artefacto para copiar al frontend.

**Qué haría:** confirmar el repositorio frontend y moverlo o eliminarlo del backend.

**Qué podría romperse:** el frontend externo podría estar importándolo por ruta directa.

**Tests:** no hay tests de navegador.

### B5. Dos entry points de servidor

**Archivos:**

- `index.js:1-8`
- `src/server/server.js:1-16`
- `package.json:8-12`

**Por qué:** ambos levantan la misma app, pero con configuraciones distintas. `npm start` usa `server.js`; `node .` usa `index.js`.

**Certeza:** probable duplicación, no eliminación segura.

**Qué haría:** elegir un único entry point y conservar el otro como wrapper compatible.

**Qué podría romperse:** `node .`, despliegues existentes o tests que importen `server.js`.

**Tests:** no hay test de arranque.

### B6. Archivos operativos y documentación

**Elementos:**

- `backup_database.cjs`
- `supabase_backup.sql`
- `completar.sql`
- `src/data/migrations/*.sql`
- `PROMPT_REFACTORIZACION_FRONTEND.md`

**Por qué:** no son imports de runtime. El script de backup tampoco aparece en `package.json`.

**Certeza:** requiere revisión manual; pueden ser herramientas operativas o documentos de entrega.

**Qué haría:** no eliminar sin confirmar con el responsable de base de datos/frontend.

**Qué podría romperse:** backups, datos iniciales, migraciones o documentación de coordinación.

**Tests:** no existen tests.

## C. Código duplicado

### C1. Rutas de emergencia duplicadas

**Archivo:** `src/api/controllers/numerosEmergenciaController.js:42-57` y `:71-86`.

**Solapamiento:** `GET /api/country/:code` y `GET /api/data/:code` ejecutan prácticamente el mismo bloque completo.

**Referencias:** el comentario `Alias corto` confirma que la segunda ruta es un alias.

**Certeza:** seguro que hay duplicación; probablemente intencional por compatibilidad.

**Qué haría:** extraer un handler común y conservar ambas rutas.

**Qué podría romperse:** eliminar una ruta puede romper clientes antiguos.

**Tests:** no existen tests de estas rutas.

### C2. Actualización de usuario repetida

**Archivo:** `src/api/controllers/usuarioController.js:209-231` y `:283-305`.

**Solapamiento:** `PUT /api/usuario` y `PUT /api/usuario/:id` repiten validación, construcción de update, llamada al service y manejo de errores. Sólo cambia de dónde sale el ID.

**Certeza:** seguro que la lógica está duplicada.

**Qué haría:** extraer un handler común que reciba el ID resuelto.

**Qué podría romperse:** cambiar diferencias sutiles de compatibilidad entre body y parámetro.

**Tests:** sólo se verifica autorización administrativa, no actualizaciones exitosas.

### C3. Tres superficies para fotos de perfil

**Archivos:**

- `auth.js:124-146`
- `storageController.js:37-51`
- `usuarioController.js:248-280`
- `storageController.js:54-88`

**Solapamiento:** las rutas de `auth`, `storage` y `usuario` llaman a los mismos métodos de `usuariosService` para leer, subir y borrar fotos.

**Certeza:** seguro que hay solapamiento; el README declara compatibilidad con `/api/usuario/:id/foto`.

**Qué haría:** conservar aliases públicos y centralizar handlers/respuestas.

**Qué podría romperse:** cambiar formas de respuesta o eliminar aliases rompe clientes.

**Tests:** `profileApi.test.js` cubre el service y `authorizationApi.test.js` cubre sólo respuestas 403/401.

### C4. Aliases de idioma

**Archivo:** `src/api/controllers/idiomaController.js`.

**Solapamientos:**

- `/supported` y `/catalogo` llaman exactamente a `getIdiomasSoportadosAsync()`.
- `/api/usuario/idioma` y `/api/idioma/preferred` actualizan el mismo dato mediante `cambiarIdiomaAsync`.
- Las lecturas usan dos métodos compatibles sobre el mismo concepto.

**Certeza:** duplicación/compatibilidad probable.

**Qué haría:** centralizar validación y mantener aliases mientras existan clientes antiguos.

**Qué podría romperse:** cambiar respuestas o eliminar rutas públicas.

**Tests:** `test/idiomas.test.js` prueba el catálogo, pero no estos endpoints HTTP.

### C5. Traducción local contra implementaciones antiguas

**Archivos:**

- `src/application/services/traduccionService.js`
- `src/data/repositories/traduccionRepository.js`
- `src/helpers/mymemoryTranslationHelper.js`

**Solapamiento:** existen tres modelos de traducción: tabla SQL, API MyMemory y catálogo local. Sólo el catálogo local está conectado.

**Certeza:** seguro respecto del runtime; requiere confirmar si se conserva compatibilidad histórica.

**Qué haría:** conservar catálogo local y retirar las otras dos implementaciones.

**Qué podría romperse:** importaciones externas directas o una migración pendiente.

**Tests:** los tests actuales favorecen la implementación local.

### C6. Validación de email repetida

**Archivos:**

- `src/api/controllers/auth.js:22-27`
- `src/application/services/usuariosService.js:54-60`

**Solapamiento:** ambos aplican una expresión regular de email y validan string no vacío.

**Certeza:** seguro que existe duplicación; puede ser defensa en profundidad.

**Qué haría:** centralizar la normalización/validación en un helper compartido, manteniendo validación en el service.

**Qué podría romperse:** cambiar mensajes o aceptar/rechazar formatos distintos.

**Tests:** no hay una matriz de tests de validación de email.

## D. Dependencias npm potencialmente innecesarias

No se encontraron dependencias npm sin uso confirmado.

| Dependencia | Uso encontrado |
|---|---|
| `@supabase/supabase-js` | `src/configs/storageConfig.js` |
| `axios` | clima, moneda, ubicación, agenda y helper antiguo; sigue siendo necesaria |
| `bcrypt` | registro/login |
| `cors` | `src/app/app.js` |
| `dotenv` | server, configuración DB y backup |
| `express` | app y controllers |
| `express-rate-limit` | login |
| `jsonwebtoken` | auth, middleware y tests |
| `multer` | subida de fotos |
| `pg` | pool DB y backup |

No eliminaría ninguna dependencia en el PR. Retirar MyMemory no permite quitar `axios`, porque Axios sigue siendo usado por código activo.

## E. Código que parecía muerto pero no debe eliminarse

- `src/app/app.js`: todos los 20 controllers están montados; no hay controllers sin registro.
- `currency.js`, `eventoFavorito.js`, `paisInfo.js` y `storageFile.js`: tienen imports y usos reales.
- `emergencyPaisHelper.js`, `timezoneMap.js` y `src/shared/withTimeout.js`: tienen consumidores activos.
- `usuariosService.getBymailAsync()`: se usa en login y registro, aunque el README documente una ruta `/api/usuario/mail/:mail` que hoy no existe.
- `usuariosService.getPreferredLanguageCodeAsync()` y `getIdiomaPreferidoConFallbackAsync()`: se usan desde las rutas de idioma.
- `registroEstadisticasRepository.deleteByUsuarioAsync()`, `agendaUsuarioRepository.deleteByUsuarioAsync()` y otros deletes: se usan al eliminar usuarios.
- `test/*.test.js`: están incluidos automáticamente por `npm test`; no son archivos sobrantes.
- `package-lock.json`, `.env.template` y las migraciones SQL: no deben eliminarse por no tener imports.
- `backup_database.cjs`, `supabase_backup.sql` y `completar.sql`: son artefactos operativos, no código muerto automáticamente.
- No se encontraron bloques de código ejecutable comentado; los comentarios encontrados son documentación o compatibilidad.

También hay documentación desactualizada:

- README menciona traducción externa, pero el backend usa catálogo local.
- README documenta `/api/usuario/mail/:mail`, `PUT /api/evento` y `/api/numerosEmergencia`, rutas que no coinciden exactamente con Express.
- README enlaza `docs/PERFIL_API.md` y `docs/FRONTEND_IDIOMAS_Y_PERFIL.md`, pero `docs/` no existe.

Esto requiere corrección documental, no eliminación automática de código.

## F. Propuesta de Pull Request

Propondría un único PR pequeño de limpieza, sin cambiar rutas ni contratos:

1. Eliminar las 15 entidades no importadas.
2. Eliminar:
   - `src/data/repositories/idiomaRepository.js`
   - `src/data/repositories/traduccionRepository.js`
   - `src/helpers/mymemoryTranslationHelper.js`
3. Eliminar:
   - `src/application/services/preferenciaUsuarioService.js`
   - `src/data/repositories/preferenciaUsuarioRepository.js`
4. Quitar `currencyService.apiSecret`, que no tiene consumidores.
5. No tocar todavía:
   - `preferenciaUsuarioController.js`
   - aliases HTTP
   - `index.js`/`server.js`
   - migraciones y SQL
   - `translatePage.js`
   - métodos probablemente obsoletos que podrían ser API externa

### Verificación propuesta

- `node --check` sobre todos los `.js`.
- Tests existentes.
- Smoke test de importación de `src/app/app.js`.
- Revisión final de imports con `rg`.

La refactorización de aliases, métodos huérfanos y entry points debería ser un segundo PR, después de confirmar el contrato con el frontend y los despliegues.
