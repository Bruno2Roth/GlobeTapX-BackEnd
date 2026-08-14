/**
 * IDs estables de los textos que puede renderizar el frontend.
 *
 * El ID no cambia entre idiomas: solo cambia el valor guardado en cada
 * archivo de idioma. Esto permite que el frontend pida "idioma 2, tag 1"
 * sin depender de textos traducidos ni de una consulta a la base de datos.
 */
export const TAG_DEFINITIONS = Object.freeze([
    Object.freeze({ id: 1, clave: 'profile.title' }),
    Object.freeze({ id: 2, clave: 'profile.name' }),
    Object.freeze({ id: 3, clave: 'profile.email' }),
    Object.freeze({ id: 4, clave: 'profile.country' }),
    Object.freeze({ id: 5, clave: 'profile.language' }),
    Object.freeze({ id: 6, clave: 'profile.photo' }),
    Object.freeze({ id: 7, clave: 'profile.changePhoto' }),
    Object.freeze({ id: 8, clave: 'profile.save' }),
    Object.freeze({ id: 9, clave: 'profile.cancel' }),
    Object.freeze({ id: 10, clave: 'profile.loading' }),
    Object.freeze({ id: 11, clave: 'profile.error' }),
    Object.freeze({ id: 12, clave: 'common.loading' }),
    Object.freeze({ id: 13, clave: 'common.error' }),
    Object.freeze({ id: 14, clave: 'common.retry' }),
    Object.freeze({ id: 15, clave: 'common.close' }),
    Object.freeze({ id: 16, clave: 'common.search' }),
    Object.freeze({ id: 17, clave: 'common.noResults' }),
    Object.freeze({ id: 18, clave: 'auth.login' }),
    Object.freeze({ id: 19, clave: 'auth.register' }),
    Object.freeze({ id: 20, clave: 'auth.email' }),
    Object.freeze({ id: 21, clave: 'auth.password' }),
    Object.freeze({ id: 22, clave: 'auth.submit' }),
    Object.freeze({ id: 23, clave: 'language.select' }),
    Object.freeze({ id: 24, clave: 'language.saved' }),
    Object.freeze({ id: 25, clave: 'photo.invalidType' }),
    Object.freeze({ id: 26, clave: 'photo.tooLarge' }),
    Object.freeze({ id: 27, clave: 'photo.notAvailable' }),
    Object.freeze({ id: 28, clave: 'countries.title' }),
    Object.freeze({ id: 29, clave: 'countries.select' }),
    Object.freeze({ id: 30, clave: 'countries.loading' }),
    Object.freeze({ id: 31, clave: 'common.back' }),
    Object.freeze({ id: 32, clave: 'common.next' }),
]);

export const TAG_KEY_BY_ID = Object.freeze(
    Object.fromEntries(TAG_DEFINITIONS.map(tag => [String(tag.id), tag.clave])),
);

export const TAG_ID_BY_KEY = Object.freeze(
    Object.fromEntries(TAG_DEFINITIONS.map(tag => [tag.clave, tag.id])),
);
