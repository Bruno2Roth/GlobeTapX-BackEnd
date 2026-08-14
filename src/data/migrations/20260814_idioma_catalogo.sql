-- El catálogo local usa IDs estables: 1 es, 2 en, 3 fr, 4 it,
-- 5 pt, 6 ko, 7 zh y 8 he.
-- La columna actual es varchar, por lo que esta migración es compatible
-- con la estructura existente y puede ejecutarse más de una vez.

UPDATE "Usuario"
SET "idiomaPreferido" = CASE LOWER(TRIM("idiomaPreferido"))
    WHEN 'es' THEN '1'
    WHEN 'en' THEN '2'
    WHEN 'fr' THEN '3'
    WHEN 'it' THEN '4'
    WHEN 'pt' THEN '5'
    WHEN 'ko' THEN '6'
    WHEN 'zh' THEN '7'
    WHEN 'he' THEN '8'
    ELSE "idiomaPreferido"
END
WHERE LOWER(TRIM("idiomaPreferido")) IN ('es', 'en', 'fr', 'it', 'pt', 'ko', 'zh', 'he');
