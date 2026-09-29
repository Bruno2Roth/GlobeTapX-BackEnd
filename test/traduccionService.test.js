import test from 'node:test';
import assert from 'node:assert/strict';
import TraduccionService from '../src/application/services/traduccionService.js';

test('dynamic batch translates free event text while preserving result order', async () => {
    const service = new TraduccionService();
    service.dynamicTranslator.translateTextAsync = async (text, target, source) => {
        assert.equal(target, 'en');
        assert.equal(source, 'es');
        return { translatedText: `translated: ${text}` };
    };
    const result = await service.translateBatchAsync(['Festival', 'Descripción'], 'en', 'es', true);
    assert.deepEqual(result.map(item => item.translatedText), [
        'translated: Festival', 'translated: Descripción',
    ]);
});

test('ordinary catalog requests do not send free text to external translation', async () => {
    const service = new TraduccionService();
    service.dynamicTranslator.translateTextAsync = () => { throw new Error('unexpected network call'); };
    const result = await service.translateBatchAsync(['Texto libre'], 'en', 'es');
    assert.equal(result[0].translatedText, 'Texto libre');
});
