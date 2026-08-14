-- Ejecutar una vez en el SQL Editor de Supabase.
-- La PK de Usuario(ID) ya cubre las búsquedas por usuarioId. Estos índices
-- evitan escaneos para login y permiten resolver /auth/me desde un índice
-- cubierto cuando PostgreSQL puede hacer index-only scan.

CREATE INDEX IF NOT EXISTS idx_usuario_mail_normalized
    ON "Usuario" (LOWER(TRIM("mail")));

CREATE INDEX IF NOT EXISTS idx_usuario_profile_id_covering
    ON "Usuario" ("ID")
    INCLUDE ("nombreCompleto", "nombre", "mail", "paisActual", "idiomaPreferido", "fotoPerfil");

-- La consulta de GET /api/usuario/idioma y el UPDATE de idioma usan la PK
-- Usuario(ID); este índice cubriente deja disponible el valor preferido.
CREATE INDEX IF NOT EXISTS idx_usuario_idioma_por_usuario
    ON "Usuario" ("ID")
    INCLUDE ("idiomaPreferido");
