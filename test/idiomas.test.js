import test from 'node:test';
import assert from 'node:assert/strict';
import traduccionService from '../src/application/services/traduccionService.js';
import {
    getLanguageCatalog,
    getTag,
    getTagValue,
    getSupportedLanguages,
    resolveLanguage,
    resolveLanguageForWrite,
} from '../src/idiomas/index.js';
import { normalizeLanguageCode, normalizeLanguageId } from '../src/application/dtos/userProfile.js';

test('el catálogo tiene IDs estables para los ocho idiomas', () => {
    const supported = getSupportedLanguages();
    assert.deepEqual(
        supported.map(language => [language.id, language.codigoIdioma]),
        [[1, 'es'], [2, 'en'], [3, 'fr'], [4, 'it'], [5, 'pt'], [6, 'ko'], [7, 'zh'], [8, 'he']],
    );
    assert.equal(resolveLanguage('2').codigoIdioma, 'en');
    assert.equal(resolveLanguage('en').id, 2);
    assert.equal(resolveLanguageForWrite(2).codigoIdioma, 'en');
    assert.equal(resolveLanguageForWrite('en-US'), null);
    assert.equal(normalizeLanguageCode('2'), 'en');
    assert.equal(normalizeLanguageId('en'), 2);
});

test('los tags se resuelven por idioma y tagId', () => {
    const catalog = getLanguageCatalog(2);
    assert.equal(catalog.codigoIdioma, 'en');
    assert.equal(catalog.tags[0].id, 1);
    assert.equal(catalog.tags[0].clave, 'profile.title');
    assert.equal(catalog.tags[0].valor, 'Profile');
    assert.deepEqual(getTag(2, 1), {
        id: 1,
        tagId: 1,
        clave: 'profile.title',
        valor: 'Profile',
    });
    assert.equal(getTagValue('es', 'profile.title'), 'Perfil');
    assert.equal(getTagValue('en', 'Perfil'), 'Profile');
});

test('la traducción local no realiza llamadas externas y acepta tagId', async () => {
    const service = new traduccionService();
    const result = await service.translateBatchAsync([
        { tagId: 1 },
        'profile.save',
    ], 2);

    assert.equal(result[0].tagId, 1);
    assert.equal(result[0].translatedText, 'Profile');
    assert.equal(result[0].targetLanguageId, 2);
    assert.equal(result[0].source, 'catalogo-local');
    assert.equal(result[1].translatedText, 'Save');
});
