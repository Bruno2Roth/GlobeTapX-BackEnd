import express from 'express';
import cors from 'cors';
import AuthController from '../api/controllers/auth.js';
import authMiddleware from '../api/middlewares/auth.js';
import AgendaUsuarioController from '../api/controllers/agendausuarioController.js';
import CategoriaController from '../api/controllers/categoriaController.js';
import CategoriaEmergenciaController from '../api/controllers/categoriaEmergenciaController.js';
import ContenidoPorCategoriaController from '../api/controllers/contenidoCategoriaController.js';
import EstadisticasController from '../api/controllers/estadisticasController.js';
import EventoController from '../api/controllers/eventoController.js';
import EventoFavoritoController from '../api/controllers/eventoFavoritoController.js';
import PaisController from '../api/controllers/paisController.js';
import UbicacionController from '../api/controllers/ubicacionController.js';
import UsuarioController from '../api/controllers/usuarioController.js';
import TraduccionController from '../api/controllers/traduccionController.js';
import LogCambiosController from '../api/controllers/zLogCambiosController.js';
import CurrencyController from '../api/controllers/currencyController.js';
import ClimaController from '../api/controllers/climaController.js';
import IdiomaController from '../api/controllers/idiomaController.js';
import PaisInfoController from '../api/controllers/paisInfoController.js';
import NumerosEmergenciaController from '../api/controllers/numerosEmergenciaController.js';
import StorageController from '../api/controllers/storageController.js';
import { sendPublicError, logInternalError } from '../api/errors.js';
import { recordRequestMetric } from '../observability/requestMetrics.js';

// Se crea la instancia principal de la aplicación Express.
const app = express();

// Permite que Express confíe en el proxy para obtener IPs reales si se usa detrás de un proxy.
app.set('trust proxy', 1);

// Habilita CORS para permitir peticiones desde otros dominios.
app.use(cors());

// Configura el parser JSON y URL-encoded con límites razonables para evitar abuso.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Middleware para medir tiempo de respuesta y registrar métricas por cada petición.
app.use((req, res, next) => {
    const startedAt = process.hrtime.bigint();
    const requestPath = req.originalUrl.split('?')[0];

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        const rawRoutePath = req.route?.path
            ? `${req.baseUrl}${req.route.path}`
            : requestPath;
        const routePath = rawRoutePath.length > 1
            ? rawRoutePath.replace(/\/+$/, '')
            : rawRoutePath;

        // Registra la métrica de la solicitud para observabilidad.
        recordRequestMetric(req.method, routePath, durationMs, res.statusCode);

        // Registro informativo para depuración y monitoreo.
        console.info('[http-request]', JSON.stringify({
            method: req.method,
            path: routePath,
            status: res.statusCode,
            durationMs: Number(durationMs.toFixed(2)),
        }));
    });

    next();
});

// Determina si una ruta es pública y no requiere autenticación.
const publicApiRequest = (req) => {
    if (req.method === 'OPTIONS') return true;

    const path = req.path;

    // Rutas de autenticación públicas.
    if (path === '/auth/login' || path === '/auth/register' || path === '/auth/status') return true;

    // Endpoints públicos de país e información de país.
    if (path === '/pais' || path.startsWith('/pais/')) return true;
    if (path === '/paisInfo' || path.startsWith('/paisInfo/')) return true;

    // Endpoints públicos de idioma y traducciones.
    if (req.method === 'GET' && (
        path === '/idioma/supported'
        || path === '/idioma/translations'
        || path === '/idioma/catalogo'
        || path.startsWith('/idioma/catalogo/')
        || path === '/idioma/byCountry'
        || /^\/idioma\/byCountry\/\d+$/.test(path)
    )) return true;

    // Traducciones y datos generales públicos.
    if (path === '/traduccion' || path.startsWith('/traduccion/')) return true;
    if (path === '/country' || path.startsWith('/country/')) return true;
    if (path === '/data' || path.startsWith('/data/')) return true;

    return false;
};

// Middleware global para proteger todas las rutas bajo /api, excepto las públicas.
app.use('/api', (req, res, next) => {
    if (publicApiRequest(req)) return next();
    return authMiddleware.required(req, res, next);
});

// Rutas de autenticación.
app.use('/api/auth', AuthController);

// Rutas de agenda y usuarios.
app.use('/api/agendaUsuario', AgendaUsuarioController);
app.use('/api/usuario', UsuarioController);

// Rutas de contenido y categorías.
app.use('/api/categoria', CategoriaController);
app.use('/api/categoriaEmergencia', CategoriaEmergenciaController);
app.use('/api/contenidoPorCategoria', ContenidoPorCategoriaController);
app.use('/api/estadisticas', EstadisticasController);
app.use('/api/evento', EventoController);
app.use('/api/eventoFavorito', EventoFavoritoController);

// Rutas geográficas y de ubicación.
app.use('/api/pais', PaisController);
app.use('/api/ubicacion', UbicacionController);
app.use('/api/paisInfo', PaisInfoController);

// Rutas de configuración, clima, divisas e idiomas.
app.use('/api/storage', StorageController);
app.use('/api/traduccion', TraduccionController);
app.use('/api/currency', CurrencyController);
app.use('/api/clima', ClimaController);
app.use('/api/idioma', IdiomaController);
app.use('/api', NumerosEmergenciaController);
app.use('/api/logCambios', LogCambiosController);

// Ruta base para verificar que la API está levantada.
app.get('/', (req, res) => res.status(200).send('GlobeTapX API'));

// Maneja rutas no encontradas o inválidas.
app.use((req, res) => res.status(400).json({
    success: false,
    message: 'Solicitud no válida',
}));

// Middleware global para manejar errores del sistema.
app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    // Registra el error interno para observabilidad.
    logInternalError(`${req.method} ${req.path}`, error);

    // Si el error es por payload demasiado grande o JSON inválido, responde como solicitud inválida.
    if (error?.type === 'entity.too.large' || error?.type === 'entity.parse.failed') {
        return res.status(400).json({ success: false, message: 'Solicitud no válida' });
    }

    // Para el resto de errores, se responde de forma segura al cliente.
    return sendPublicError(res, error, 'Error al procesar la solicitud');
});

export default app;
