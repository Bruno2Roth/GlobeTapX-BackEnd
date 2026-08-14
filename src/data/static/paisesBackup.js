// Fallback local con los países más usados por GlobeTapX. El caché se
// reemplaza por los datos de la BD cuando una actualización tiene éxito.
// El formato conserva las columnas consumidas por paisService.
const backup = [
    ['Argentina', 'AR'], ['Bolivia', 'BO'], ['Brasil', 'BR'], ['Chile', 'CL'],
    ['Colombia', 'CO'], ['Costa Rica', 'CR'], ['Cuba', 'CU'], ['Ecuador', 'EC'],
    ['El Salvador', 'SV'], ['Guatemala', 'GT'], ['Honduras', 'HN'], ['México', 'MX'],
    ['Nicaragua', 'NI'], ['Panamá', 'PA'], ['Paraguay', 'PY'], ['Perú', 'PE'],
    ['Uruguay', 'UY'], ['Venezuela', 'VE'], ['Estados Unidos', 'US'], ['Canadá', 'CA'],
    ['España', 'ES'], ['Francia', 'FR'], ['Alemania', 'DE'], ['Italia', 'IT'],
    ['Portugal', 'PT'], ['Inglaterra', 'GB'], ['Irlanda', 'IE'], ['Países Bajos', 'NL'],
    ['Bélgica', 'BE'], ['Suiza', 'CH'], ['Austria', 'AT'], ['Dinamarca', 'DK'],
    ['Suecia', 'SE'], ['Noruega', 'NO'], ['Finlandia', 'FI'], ['Polonia', 'PL'],
    ['República Checa', 'CZ'], ['Grecia', 'GR'], ['Turquía', 'TR'], ['Rusia', 'RU'],
    ['Ucrania', 'UA'], ['Croacia', 'HR'], ['Serbia', 'RS'], ['Eslovenia', 'SI'],
    ['China', 'CN'], ['Japón', 'JP'], ['Corea del Sur', 'KR'], ['India', 'IN'],
    ['Indonesia', 'ID'], ['Tailandia', 'TH'], ['Vietnam', 'VN'], ['Filipinas', 'PH'],
    ['Malasia', 'MY'], ['Singapur', 'SG'], ['Emiratos Árabes Unidos', 'AE'],
    ['Arabia Saudita', 'SA'], ['Irak', 'IQ'], ['Irán', 'IR'], ['Israel', 'IL'],
    ['Jordania', 'JO'], ['Sudáfrica', 'ZA'], ['Egipto', 'EG'], ['Nigeria', 'NG'],
    ['Kenia', 'KE'], ['Etiopía', 'ET'], ['Tanzania', 'TZ'], ['Ghana', 'GH'],
    ['Costa de Marfil', 'CI'], ['Senegal', 'SN'], ['Camerún', 'CM'], ['Angola', 'AO'],
    ['Argelia', 'DZ'], ['Marruecos', 'MA'], ['Túnez', 'TN'], ['Australia', 'AU'],
    ['Nueva Zelanda', 'NZ'], ['Fiyi', 'FJ'],
];

// IDs observados en la tabla actual de GlobeTapX. Los países adicionales
// reciben IDs posteriores para que el fallback conserve las referencias
// existentes de paisActual.
const KNOWN_DATABASE_IDS = Object.freeze({
    AR: 1,
    AU: 2,
    US: 3,
    BR: 4,
    GB: 5,
    FR: 6,
    IL: 7,
    KR: 8,
    CN: 9,
    IT: 10,
    ES: 11,
    CL: 12,
});

let nextAdditionalId = 13;
const countries = backup.map(([nombre, codigo]) => ({
    ID: KNOWN_DATABASE_IDS[codigo] || nextAdditionalId++,
    nombre,
    codigo,
    descripcion: null,
    imagen: null,
}));

export const PAISES_BACKUP = Object.freeze(countries);
export default PAISES_BACKUP;
