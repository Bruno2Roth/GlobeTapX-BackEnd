import 'dotenv/config'

if (process.env.NODE_ENV !== 'production') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // esto es para que no tire error de certificado http
}
import express 	from "express";	// hacer npm i express
import cors 	from "cors";	// hacer npm i cors

// Controllers
import AuthController                   from './../api/controllers/auth.js'
import AgendaUsuarioController          from "./../api/controllers/agendausuarioController.js"
import CategoriaController              from "./../api/controllers/categoriaController.js"
import CategoriaEmergenciaController    from "./../api/controllers/categoriaEmergenciaController.js"
import ContenidoPorCategoriaController  from "./../api/controllers/contenidoCategoriaController.js"
import EstadisticasController           from "./../api/controllers/estadisticasController.js"
import EventoController                 from "./../api/controllers/eventoController.js"
import EventoFavoritoController         from "./../api/controllers/eventoFavoritoController.js"
import PaisController                   from "./../api/controllers/paisController.js"
import PreferenciaUsuarioController     from "./../api/controllers/preferenciaUsuarioController.js"
// ContenidoPaisController eliminado
// TipoAdminController eliminado
import UbicacionController              from "./../api/controllers/ubicacionController.js"
import UsuarioController                from "./../api/controllers/usuarioController.js"
import TraduccionController             from "./../api/controllers/traduccionController.js"
import HistorialController              from "./../api/controllers/zHistorialController.js"
import LogCambiosController             from "./../api/controllers/zLogCambiosController.js"
import CurrencyController               from "./../api/controllers/currencyController.js"
import ClimaController                  from "./../api/controllers/climaController.js"

const app  = express();
const port = process.env.PORT || 3000;  // si no esta definido en el archivo .env uso el 3000.

// Agrego los Middlewares
app.use(cors());         // Middleware de CORS
app.use(express.json()); // Middleware para parsear y comprender JSON

// Endpoints (todos los Routers)
app.use("/api/auth", AuthController);
app.use("/api/agendaUsuario", AgendaUsuarioController);
app.use("/api/categoria", CategoriaController);
app.use("/api/categoriaEmergencia", CategoriaEmergenciaController);
app.use("/api/contenidoPorCategoria", ContenidoPorCategoriaController);
app.use("/api/estadisticas", EstadisticasController);
app.use("/api/evento", EventoController);
app.use("/api/eventoFavorito", EventoFavoritoController);
app.use("/api/pais", PaisController);
app.use("/api/preferenciaUsuario", PreferenciaUsuarioController);
// /api/contenidoPais removed
// /api/tipoAdmin removed
app.use("/api/ubicacion", UbicacionController);
app.use("/api/usuario", UsuarioController);
app.use("/api/traduccion", TraduccionController);
app.use("/api/currency", CurrencyController);
app.use("/api/clima", ClimaController);
app.use("/api/historial", HistorialController);
app.use("/api/logCambios", LogCambiosController);

//
// Inicio el Server y lo pongo a escuchar.
//
app.listen(port, () => {	// Inicio el servidor WEB (escuchar)
    console.log("server.js");
    console.log(`Listening on http://localhost:${port}`)
})
  