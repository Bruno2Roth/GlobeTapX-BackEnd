import test from 'node:test';
import assert from 'node:assert/strict';
import feriadosService from '../src/application/services/feriadosService.js';

const countries = [{ ID: 1, nombre: 'Argentina', codigo: 'AR' }];

test('consulta el proveedor con el país validado y normaliza feriados', async () => {
    const calls = [];
    const service = new feriadosService({
        paises: { getAllAsync: async () => countries },
        httpClient: {
            async get(url) {
                calls.push(url);
                return { data: [{
                    date: '2026-12-25',
                    localName: 'Navidad',
                    name: 'Christmas Day',
                    countryCode: 'AR',
                    global: true,
                }] };
            },
        },
    });

    const result = await service.getPublicHolidaysAsync('ar', 2026);
    assert.deepEqual(calls, ['https://date.nager.at/api/v3/PublicHolidays/2026/AR']);
    assert.equal(result[0].localName, 'Navidad');
});

test('rechaza país y año inválidos antes de llamar al proveedor', async () => {
    const service = new feriadosService({
        paises: { getAllAsync: async () => countries },
        httpClient: { get: async () => { throw new Error('no debe llamarse'); } },
    });

    await assert.rejects(service.getPublicHolidaysAsync('ZZ', 2026), error => error.statusCode === 400);
    await assert.rejects(service.getPublicHolidaysAsync('AR', 1800), error => error.statusCode === 400);
});

test('oculta detalles del proveedor cuando el servicio externo falla', async () => {
    const service = new feriadosService({
        paises: { getAllAsync: async () => countries },
        httpClient: { get: async () => { throw new Error('remote password and host'); } },
    });

    await assert.rejects(
        service.getPublicHolidaysAsync('AR', 2026),
        error => error.statusCode === 503
            && error.publicMessage === 'Servicio de feriados temporalmente no disponible'
            && !error.publicMessage.includes('password'),
    );
});
