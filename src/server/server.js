import 'dotenv/config'
import express 	from "express";    // hacer npm i express
import cors 	from "cors";          // hacer npm i cors

// Controllers
import AuthController                   from './../api/controllers/auth.js'
import authMiddleware                   from './../api/middlewares/auth.js'
import AgendaUsuarioController          from "./../api/controllers/agendausuarioController.js"
import CategoriaController              from "./../api/controllers/categoriaController.js"
import CategoriaEmergenciaController    from "./../api/controllers/categoriaEmergenciaController.js"
import ContenidoPorCategoriaController  from "./../api/controllers/contenidoCategoriaController.js"
import EstadisticasController           from "./../api/controllers/estadisticasController.js"
import EventoController                 from "./../api/controllers/eventoController.js"
import EventoFavoritoController         from "./../api/controllers/eventoFavoritoController.js"
import PaisController                   from "./../api/controllers/paisController.js"
import PreferenciaUsuarioController     from "./../api/controllers/preferenciaUsuarioController.js"
import UbicacionController              from "./../api/controllers/ubicacionController.js"
import UsuarioController                from "./../api/controllers/usuarioController.js"
import TraduccionController             from "./../api/controllers/traduccionController.js"
import LogCambiosController             from "./../api/controllers/zLogCambiosController.js"
import CurrencyController               from "./../api/controllers/currencyController.js"
import ClimaController                  from "./../api/controllers/climaController.js"
import IdiomaController                 from "./../api/controllers/idiomaController.js"
import PaisInfoController               from "./../api/controllers/paisInfoController.js"
import NumerosEmergenciaController     from "./../api/controllers/numerosEmergenciaController.js"


const app  = express();
const port = process.env.PORT || 3000;  // si no esta definido en el archivo .env uso el 3000.


// Agrego los Middlewares
app.use(cors());
app.use(express.json());

// Debug middleware - para el auth
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} | Auth: ${req.headers.authorization ? 'SÍ' : 'NO'}`);
    next();
});


// Auth middleware: verifica login en TODAS las rutas excepto /auth
/* app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/auth')) {
        return next();
    }
    return authMiddleware.required(req, res, next);
}); */

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
app.use("/api/ubicacion", UbicacionController);
app.use("/api/usuario", UsuarioController);
app.use("/api/traduccion", TraduccionController);
app.use("/api/currency", CurrencyController);
app.use("/api/clima", ClimaController);
app.use("/api/idioma", IdiomaController);
app.use("/api/paisInfo", PaisInfoController);
app.use("/api", NumerosEmergenciaController);
app.use("/api/logCambios", LogCambiosController);

// Middleware global de errores
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Error interno del servidor',
    });
});

//
// Inicio el Server y lo pongo a escuchar.
//
app.listen(port, () => {	// Inicio el servidor WEB (escuchar)
    console.log("server.js");
    console.log(`Listening on http://localhost:${port}`)
})