import test from 'node:test';
import assert from 'node:assert/strict';
import { sendPublicError } from '../src/api/errors.js';

const response = () => ({
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
});

test('los errores internos no exponen detalles al cliente', () => {
    const res = response();
    sendPublicError(res, new Error('password=secret; relation Usuario does not exist'), 'Error al procesar la solicitud');

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Error al procesar la solicitud',
    });
    assert.equal(JSON.stringify(res.body).includes('secret'), false);
});

test('un error de dependencia devuelve mensaje genérico y 503', () => {
    const res = response();
    sendPublicError(
        res,
        Object.assign(new Error('upstream token leaked'), { code: 'ECONNRESET' }),
        'Servicio temporalmente no disponible',
    );

    assert.equal(res.statusCode, 503);
    assert.equal(res.body.message, 'Servicio temporalmente no disponible');
    assert.equal(JSON.stringify(res.body).includes('upstream'), false);
});
