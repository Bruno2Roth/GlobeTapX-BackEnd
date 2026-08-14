import 'dotenv/config';
import http from 'node:http';
import app from '../app/app.js';

const port = Number(process.env.PORT) || 3000;
const server = http.createServer({ maxHeadersSize: 32768 }, app);

server.requestTimeout = Number(process.env.HTTP_REQUEST_TIMEOUT_MS) || 30000;
server.headersTimeout = Number(process.env.HTTP_HEADERS_TIMEOUT_MS) || 10000;
server.keepAliveTimeout = Number(process.env.HTTP_KEEP_ALIVE_TIMEOUT_MS) || 5000;

server.listen(port, () => {
    console.log(`GlobeTapX API escuchando en http://localhost:${port}`);
});

export { app, server };
