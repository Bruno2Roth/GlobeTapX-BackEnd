import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'authorization-unit-test-secret';

const { default: app } = await import('../src/app/app.js');
const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
});

const baseUrl = `http://127.0.0.1:${server.address().port}`;

const tokenFor = (id, claims = {}) => jwt.sign(
    { id, ...claims },
    process.env.JWT_SECRET,
    { algorithm: 'HS256' },
);

const request = (path, options = {}, id = 1) => fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
        Authorization: `Bearer ${tokenFor(id)}`,
        ...(options.headers || {}),
    },
});

test.after(() => new Promise((resolve, reject) => {
    server.close(error => (error ? reject(error) : resolve()));
}));

test('un usuario no puede leer recursos asociados a otro usuario', async () => {
    const paths = [
        '/api/usuario/2',
        '/api/agendaUsuario/2',
        '/api/estadisticas/usuario/2',
        '/api/estadisticas/eventos/2',
        '/api/eventoFavorito?IDUsuario=2',
        '/api/storage/profile/2',
        '/api/auth/foto/2',
        '/api/logCambios?usuarioId=2',
    ];

    for (const path of paths) {
        const response = await request(path);
        assert.equal(response.status, 403, path);
    }
});

test('las operaciones administrativas no aceptan una cuenta comun', async () => {
    const cases = [
        ['/api/usuario', { method: 'GET' }],
        ['/api/usuario', { method: 'POST', body: '{"isAdmin":true}' }],
        ['/api/evento', { method: 'POST', body: '{"IDUsuario":2}' }],
        ['/api/estadisticas', { method: 'POST', body: '{"IDUsuario":2}' }],
        ['/api/estadisticas/1', { method: 'PUT', body: '{}' }],
        ['/api/usuario/1', { method: 'PUT', body: '{"isAdmin":true}' }],
    ];

    for (const [path, options] of cases) {
        const response = await request(path, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        assert.equal(response.status, 403, `${options.method} ${path}`);
    }
});

test('la foto de perfil ya no es una ruta publica', async () => {
    const response = await fetch(`${baseUrl}/api/auth/foto/1`);
    assert.equal(response.status, 401);
});
