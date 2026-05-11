import 'dotenv/config'
import express 	from "express";	// hacer npm i express
import cors 	from "cors";	// hacer npm i cors

// Controllers
import AgendaUsuarioController          from "./controllers/agendaUsuario-controller.js"
import CategoriaController              from "./controllers/categoria-controller.js"
import CategoriaEmergenciaController    from "./controllers/categoriaEmergencia-controller.js"
import ContenidoPaisController          from "./controllers/contenidoPais-controller.js"
import ContenidoPorCategoriaController  from "./controllers/contenidoPorCategoria-controller.js"
import EstadisticasController           from "./controllers/estadisticas-controller.js"
import EventoController                 from "./controllers/evento-controller.js"
import EventoFavoritoController         from "./controllers/eventoFavorito-controller.js"
import MultimediaController             from "./controllers/multimedia-controller.js"
import PaisController                   from "./controllers/pais-controller.js"
import PreferenciasUsuarioController    from "./controllers/preferenciasUsuario-controller.js"
import PreferenciaUsuarioController     from "./controllers/preferenciaUsuario-controller.js"
import TipoAdminController              from "./controllers/tipoAdmin-controller.js"
import UbicacionController              from "./controllers/ubicacion-controller.js"
import UsuarioController                from "./controllers/usuario-controller.js"
import HistorialController              from "./controllers/historial-controller.js"
import LogCambiosController             from "./controllers/logCambios-controller.js"

const app  = express();
const port = process.env.PORT || 3000;  // si no esta definido en el archivo .env uso el 3000.

// Agrego los Middlewares
app.use(cors());         // Middleware de CORS
app.use(express.json()); // Middleware para parsear y comprender JSON

// Endpoints (todos los Routers)
app.use("/api/agendaUsuario", AgendaUsuarioController);
app.use("/api/categoria", CategoriaController);
app.use("/api/categoriaEmergencia", CategoriaEmergenciaController);
app.use("/api/contenidoPais", ContenidoPaisController);
app.use("/api/contenidoPorCategoria", ContenidoPorCategoriaController);
app.use("/api/estadisticas", EstadisticasController);
app.use("/api/evento", EventoController);
app.use("/api/eventoFavorito", EventoFavoritoController);
app.use("/api/multimedia", MultimediaController);
app.use("/api/pais", PaisController);
app.use("/api/preferenciasUsuario", PreferenciasUsuarioController);
app.use("/api/preferenciaUsuario", PreferenciaUsuarioController);
app.use("/api/tipoAdmin", TipoAdminController);
app.use("/api/ubicacion", UbicacionController);
app.use("/api/usuario", UsuarioController);
app.use("/api/historial", HistorialController);
app.use("/api/logCambios", LogCambiosController);

//
// Inicio el Server y lo pongo a escuchar.
//
app.listen(port, () => {	// Inicio el servidor WEB (escuchar)
    console.log("server.js");
    console.log(`Listening on http://localhost:${port}`)
})
  