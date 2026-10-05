BEGIN;

-- Pais ya contiene nombre, código, descripción e imagen. PaisInfo conserva
-- la documentación, reglas y vida diaria: es la única fuente de esos textos.
DO $$
BEGIN
    IF to_regclass(format('%I.%I', current_schema(), 'PaisDocumentacion')) IS NOT NULL THEN
        IF EXISTS (
            SELECT 1
            FROM "PaisDocumentacion" pd
            WHERE NOT EXISTS (
                SELECT 1 FROM "Pais" p
                WHERE p."ID"::text = pd."IDPais"::text
                   OR (NULLIF(BTRIM(pd."codigo"), '') IS NOT NULL
                       AND UPPER(p."codigo") = UPPER(pd."codigo"))
                   OR (NULLIF(BTRIM(pd."nombre"), '') IS NOT NULL
                       AND LOWER(p."nombre") = LOWER(pd."nombre"))
            )
        ) THEN
            RAISE EXCEPTION 'PaisDocumentacion contains countries that cannot be matched to Pais; migration stopped without dropping source data';
        END IF;

        IF EXISTS (
            SELECT mapped."paisId"
            FROM "PaisDocumentacion" pd
            CROSS JOIN LATERAL (
                SELECT candidate."ID" AS "paisId"
                FROM "Pais" candidate
                WHERE candidate."ID"::text = pd."IDPais"::text
                   OR (NULLIF(BTRIM(pd."codigo"), '') IS NOT NULL
                       AND UPPER(candidate."codigo") = UPPER(pd."codigo"))
                   OR (NULLIF(BTRIM(pd."nombre"), '') IS NOT NULL
                       AND LOWER(candidate."nombre") = LOWER(pd."nombre"))
                ORDER BY CASE
                    WHEN candidate."ID"::text = pd."IDPais"::text THEN 0
                    WHEN UPPER(candidate."codigo") = UPPER(pd."codigo") THEN 1
                    ELSE 2
                END
                LIMIT 1
            ) mapped
            GROUP BY mapped."paisId"
            HAVING COUNT(*) > 1
        ) THEN
            RAISE EXCEPTION 'PaisDocumentacion contains multiple rows for one country; migration stopped without dropping source data';
        END IF;

        WITH matched AS (
            SELECT p."ID" AS "paisId", pd."nombre", pd."codigo",
                pd."descripcion", pd."imagen", pd."documentacion",
                pd."reglas", pd."vidaDiaria"
            FROM "PaisDocumentacion" pd
            CROSS JOIN LATERAL (
                SELECT candidate."ID"
                FROM "Pais" candidate
                WHERE candidate."ID"::text = pd."IDPais"::text
                   OR (NULLIF(BTRIM(pd."codigo"), '') IS NOT NULL
                       AND UPPER(candidate."codigo") = UPPER(pd."codigo"))
                   OR (NULLIF(BTRIM(pd."nombre"), '') IS NOT NULL
                       AND LOWER(candidate."nombre") = LOWER(pd."nombre"))
                ORDER BY CASE
                    WHEN candidate."ID"::text = pd."IDPais"::text THEN 0
                    WHEN UPPER(candidate."codigo") = UPPER(pd."codigo") THEN 1
                    ELSE 2
                END
                LIMIT 1
            ) p
            ORDER BY p."ID", pd."IDPais"
        )
        UPDATE "Pais" p
        SET "nombre" = COALESCE(NULLIF(BTRIM(p."nombre"), ''), matched."nombre"),
            "codigo" = COALESCE(NULLIF(BTRIM(p."codigo"), ''), matched."codigo"),
            "descripcion" = COALESCE(NULLIF(BTRIM(p."descripcion"), ''), matched."descripcion"),
            "imagen" = COALESCE(NULLIF(BTRIM(p."imagen"), ''), matched."imagen")
        FROM matched
        WHERE p."ID" = matched."paisId";

        WITH matched AS (
            SELECT p."ID" AS "paisId", pd."documentacion",
                pd."reglas", pd."vidaDiaria"
            FROM "PaisDocumentacion" pd
            CROSS JOIN LATERAL (
                SELECT candidate."ID"
                FROM "Pais" candidate
                WHERE candidate."ID"::text = pd."IDPais"::text
                   OR (NULLIF(BTRIM(pd."codigo"), '') IS NOT NULL
                       AND UPPER(candidate."codigo") = UPPER(pd."codigo"))
                   OR (NULLIF(BTRIM(pd."nombre"), '') IS NOT NULL
                       AND LOWER(candidate."nombre") = LOWER(pd."nombre"))
                ORDER BY CASE
                    WHEN candidate."ID"::text = pd."IDPais"::text THEN 0
                    WHEN UPPER(candidate."codigo") = UPPER(pd."codigo") THEN 1
                    ELSE 2
                END
                LIMIT 1
            ) p
            ORDER BY p."ID", pd."IDPais"
        ),
        numbered AS (
            SELECT
                (COALESCE((SELECT MAX("ID") FROM "PaisInfo"), 0)
                    + ROW_NUMBER() OVER (ORDER BY "paisId"))::integer AS "ID",
                *
            FROM matched
        )
        INSERT INTO "PaisInfo" AS current_info ("ID", "IDPais", "documentacion", "reglas", "vidaDiaria")
        SELECT "ID", "paisId", "documentacion", "reglas", "vidaDiaria"
        FROM numbered
        ON CONFLICT ("IDPais") DO UPDATE SET
            "documentacion" = CASE
                WHEN NULLIF(BTRIM(current_info."documentacion"), '') IS NULL
                    THEN EXCLUDED."documentacion"
                WHEN NULLIF(BTRIM(EXCLUDED."documentacion"), '') IS NULL
                    OR current_info."documentacion" = EXCLUDED."documentacion"
                    THEN current_info."documentacion"
                ELSE current_info."documentacion" || E'\n\n' || EXCLUDED."documentacion"
            END,
            "reglas" = COALESCE(NULLIF(BTRIM(current_info."reglas"), ''), EXCLUDED."reglas"),
            "vidaDiaria" = COALESCE(NULLIF(BTRIM(current_info."vidaDiaria"), ''), EXCLUDED."vidaDiaria");

        DROP TABLE "PaisDocumentacion";
    END IF;

    IF to_regclass(format('%I.%I', current_schema(), 'DocumentacionPais')) IS NOT NULL THEN
        IF EXISTS (
            SELECT 1
            FROM "DocumentacionPais" dp
            LEFT JOIN "Pais" p ON p."ID"::text = dp."IDPais"::text
            WHERE p."ID" IS NULL
        ) THEN
            RAISE EXCEPTION 'DocumentacionPais contains countries that cannot be matched to Pais; migration stopped without dropping source data';
        END IF;

        WITH numbered AS (
            SELECT
                (COALESCE((SELECT MAX("ID") FROM "PaisInfo"), 0)
                    + ROW_NUMBER() OVER (ORDER BY dp."IDPais"))::integer AS "ID",
                dp."IDPais"::integer AS "IDPais",
                dp."documentacion"
            FROM "DocumentacionPais" dp
        )
        INSERT INTO "PaisInfo" AS current_info ("ID", "IDPais", "documentacion")
        SELECT "ID", "IDPais", "documentacion"
        FROM numbered
        ON CONFLICT ("IDPais") DO UPDATE SET
            "documentacion" = CASE
                WHEN NULLIF(BTRIM(current_info."documentacion"), '') IS NULL
                    THEN EXCLUDED."documentacion"
                WHEN NULLIF(BTRIM(EXCLUDED."documentacion"), '') IS NULL
                    OR current_info."documentacion" = EXCLUDED."documentacion"
                    THEN current_info."documentacion"
                ELSE current_info."documentacion" || E'\n\n' || EXCLUDED."documentacion"
            END;

        DROP TABLE "DocumentacionPais";
    END IF;
END
$$;

-- Una cuenta conserva como máximo un registro por evento. Para instalaciones
-- con duplicados existentes se conserva el más antiguo (fecha, luego ID).
WITH ranked AS (
    SELECT ctid,
        ROW_NUMBER() OVER (
            PARTITION BY "IDUsuario", "IDEvento"
            ORDER BY "fechaAgregado" ASC NULLS LAST, "ID" ASC
        ) AS duplicate_number
    FROM "EventoFavorito"
)
DELETE FROM "EventoFavorito" f
USING ranked
WHERE f.ctid = ranked.ctid
  AND ranked.duplicate_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "EventoFavorito_usuario_evento_key"
    ON "EventoFavorito" ("IDUsuario", "IDEvento");

COMMIT;
