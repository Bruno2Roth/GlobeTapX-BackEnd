import test from 'node:test';
import assert from 'node:assert/strict';
import paisService from '../src/application/services/paisService.js';

const makeRepository = (getAllAsync) => ({ getAllAsync });

test('country timeout stays above PostgreSQL query and connection timeouts', () => {
    const previousValues = {
        countries: process.env.COUNTRIES_DB_TIMEOUT_MS,
        query: process.env.DB_QUERY_TIMEOUT_MS,
        connection: process.env.DB_CONNECTION_TIMEOUT_MS,
    };

    process.env.COUNTRIES_DB_TIMEOUT_MS = '750';
    process.env.DB_QUERY_TIMEOUT_MS = '5000';
    process.env.DB_CONNECTION_TIMEOUT_MS = '5000';

    try {
        const service = new paisService(makeRepository(async () => []));
        assert.equal(service.databaseTimeoutMs, 6000);
    } finally {
        for (const [key, value] of Object.entries({
            COUNTRIES_DB_TIMEOUT_MS: previousValues.countries,
            DB_QUERY_TIMEOUT_MS: previousValues.query,
            DB_CONNECTION_TIMEOUT_MS: previousValues.connection,
        })) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    }
});

test('database errors are not returned as successful empty country lists', async () => {
    const originalWarn = console.warn;
    console.warn = () => {};
    try {
        const service = new paisService(makeRepository(async () => {
            throw Object.assign(new Error('query timed out'), { code: 'ETIMEDOUT' });
        }));

        await assert.rejects(
            service.getAllAsync(),
            (error) => error.code === 'DB_UNAVAILABLE',
        );
    } finally {
        console.warn = originalWarn;
    }
});

test('cached countries remain available when a refresh fails', async () => {
    const originalWarn = console.warn;
    console.warn = () => {};
    try {
        const service = new paisService(makeRepository(async () => {
            throw Object.assign(new Error('database unavailable'), { code: 'ECONNRESET' });
        }));
        service.cachedCountries = [{ ID: 1, nombre: 'Argentina', codigo: 'AR' }];
        service.cacheSource = 'database';
        service.cacheExpiresAt = 0;

        const countries = await service.getAllAsync();
        assert.equal(countries.length, 1);
        assert.equal(countries[0].nombre, 'Argentina');
    } finally {
        console.warn = originalWarn;
    }
});
