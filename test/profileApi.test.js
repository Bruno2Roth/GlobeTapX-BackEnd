import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import authMiddleware from '../src/api/middlewares/auth.js';
import storageService from '../src/application/services/storageService.js';
import paisService from '../src/application/services/paisService.js';
import {
    isSupportedLanguageCode,
    toPublicUser,
} from '../src/application/dtos/userProfile.js';

process.env.JWT_SECRET = 'unit-test-secret';

const responseRecorder = () => {
    const response = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
    };
    return response;
};

test('Bearer es obligatorio y se rechaza Basic', () => {
    const noHeaderResponse = responseRecorder();
    authMiddleware.required({ headers: {} }, noHeaderResponse, () => {});
    assert.equal(noHeaderResponse.statusCode, 401);
    assert.deepEqual(noHeaderResponse.body, { success: false, message: 'No autorizado' });

    const basicResponse = responseRecorder();
    authMiddleware.required({ headers: { authorization: 'Basic token' } }, basicResponse, () => {});
    assert.equal(basicResponse.statusCode, 401);

    const token = jwt.sign({ id: 123 }, process.env.JWT_SECRET);
    const validRequest = { headers: { authorization: `Bearer ${token}` } };
    let nextCalled = false;
    authMiddleware.required(validRequest, responseRecorder(), () => { nextCalled = true; });
    assert.equal(nextCalled, true);
    assert.equal(validRequest.user.id, 123);
});

test('DTO público de usuario no expone credenciales y normaliza idioma', () => {
    const user = toPublicUser({
        ID: 123,
        nombre: 'Ada',
        mail: 'ada@example.com',
        paisActual: 1,
        idiomaPreferido: 'xx',
        fotoPath: 'usuarios/123/foto.webp',
        contrasena: 'secret',
        service_role_key: 'secret',
    }, { protocol: 'https', get: () => 'api.example.com' });

    assert.deepEqual(Object.keys(user), [
        'id',
        'nombreCompleto',
        'mail',
        'paisActual',
        'idiomaPreferido',
        'fotoPerfil',
    ]);
    assert.equal(user.idiomaPreferido, 'es');
    assert.equal(user.fotoPerfil, 'https://api.example.com/api/auth/foto/123');
    assert.equal('contrasena' in user, false);
});

test('solo se aceptan los ocho códigos de idioma', () => {
    for (const code of ['es', 'en', 'fr', 'it', 'pt', 'ko', 'zh', 'he']) {
        assert.equal(isSupportedLanguageCode(code), true);
    }
    assert.equal(isSupportedLanguageCode('en-US'), false);
    assert.equal(isSupportedLanguageCode('xx'), false);
});

test('foto valida multipart, path estable y MIME permitido', async () => {
    const calls = [];
    const repository = {
        bucket: 'perfil',
        async uploadAsync(path, buffer, options) {
            calls.push({ path, size: buffer.length, options });
        },
        async getUrlAsync(path) {
            return `https://signed.example/${path}`;
        },
    };
    const service = new storageService(repository);
    const result = await service.uploadProfilePhoto(7, {
        fieldname: 'fotoPerfil',
        mimetype: 'image/webp',
        buffer: Buffer.from('webp'),
        size: 4,
    });

    assert.equal(result.path, 'usuarios/7/foto.webp');
    assert.equal(calls[0].options.upsert, true);
    assert.equal(await service.getPhotoUrl(result.path), 'https://signed.example/usuarios/7/foto.webp');

    await assert.rejects(
        service.uploadProfilePhoto(7, {
            fieldname: 'fotoPerfil',
            mimetype: 'text/plain',
            buffer: Buffer.from('no'),
            size: 2,
        }),
        error => error.statusCode === 400,
    );
});

test('países responden desde backup sin esperar una BD caída', async () => {
    const repository = {
        async getAllAsync() {
            throw Object.assign(new Error('database down'), { code: 'ECONNREFUSED' });
        },
    };
    const service = new paisService(repository);
    const started = performance.now();
    const countries = await service.getAllAsync();
    const elapsed = performance.now() - started;

    assert.ok(elapsed < 100, `backup tardó ${elapsed}ms`);
    assert.ok(countries.length > 0);
    assert.equal(service.getCacheStatus().source, 'backup');
    assert.equal(countries.find(country => country.codigo === 'AR').ID, 1);
    assert.equal(countries.find(country => country.codigo === 'AU').ID, 2);
});
