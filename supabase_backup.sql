-- GlobeTapX: esquema de la base de datos.
-- Este archivo contiene únicamente DDL; no contiene usuarios ni datos iniciales.
-- PostGIS crea sus objetos propios, incluyendo spatial_ref_sys y sus funciones.

BEGIN;

-- Extensión requerida por la columna geography de Ubicacion.
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Función auxiliar propia del proyecto.
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

-- Secuencias existentes en el esquema.
CREATE SEQUENCE IF NOT EXISTS "AgendaUsuario_ID_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS "Categoria_ID_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS "ContenidoPorCategoria_ID_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS "Estadisticas_ID_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS "EventoFavorito_ID_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS "EventoPais_ID_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS "LogCambios_ID_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS "PaisInfo_ID_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS "Pais_ID_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS "PreferenciaUsuario_ID_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS "RegistroEstadisticas_ID_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS "RegistroEstadisticas_ID_seq1" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS "Ubicacion_ID_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS "Usuario_ID_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS "countryemergencycontacts_id_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 NO CYCLE;

-- Tablas de la aplicación.
CREATE TABLE IF NOT EXISTS "AgendaUsuario" (
  "ID" int4 NOT NULL,
  "IDUsuario" int4,
  "IDEvento" int4,
  "recordatorio" timestamptz
);
CREATE TABLE IF NOT EXISTS "Categoria" (
  "ID" int4 NOT NULL,
  "nombre" varchar(100),
  "descripcion" varchar(500)
);
CREATE TABLE IF NOT EXISTS "ContenidoPorCategoria" (
  "ID" int4 NOT NULL,
  "IDPais" int4,
  "IDCategoria" int4,
  "titulo" varchar(100),
  "contenido" text,
  "creadoPor" int4,
  "fechaCreacion" timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "DocumentacionPais" (
  "IDPais" int8 NOT NULL,
  "documentacion" text NOT NULL
);
CREATE TABLE IF NOT EXISTS "Estadisticas" (
  "ID" int4 NOT NULL,
  "IDUsuario" int4 NOT NULL,
  "paisesVisitados" int4 DEFAULT 0,
  "expediciones" int4 DEFAULT 0,
  "ultimaUbicacion" varchar(150),
  "fechaActualizacion" timestamptz DEFAULT now(),
  "eventosAsistidos" int4 DEFAULT 0,
  "continentesVisitados" int4 DEFAULT 0,
  "diasViajando" int4 DEFAULT 0,
  "nivelViajero" int4 DEFAULT 1
);
CREATE TABLE IF NOT EXISTS "Evento" (
  "ID" int4 NOT NULL,
  "IDPais" int4,
  "IDCategoria" int4,
  "nombre" varchar(50),
  "descripcion" text,
  "fechaInicio" timestamptz,
  "fechaFin" timestamptz,
  "ubicacion" varchar(255)
);
CREATE TABLE IF NOT EXISTS "EventoFavorito" (
  "ID" int4 NOT NULL,
  "IDUsuario" int4 NOT NULL,
  "IDEvento" int4 NOT NULL,
  "fechaAgregado" timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "NumerosEmergenciaa" (
  "id" int4 NOT NULL,
  "country" varchar(100) NOT NULL,
  "countrycode" bpchar(2) NOT NULL,
  "ambulance" varchar(50) NOT NULL,
  "firedepartment" varchar(50) NOT NULL,
  "police" varchar(50) NOT NULL,
  "emergencydispatch" varchar(50),
  "createdat" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "Pais" (
  "ID" int4 NOT NULL,
  "nombre" varchar(100),
  "descripcion" varchar(500),
  "imagen" text,
  "codigo" varchar(2),
  "gmt" numeric
);
CREATE TABLE IF NOT EXISTS "PaisDocumentacion" (
  "IDPais" int8,
  "nombre" text NOT NULL,
  "codigo" text NOT NULL,
  "descripcion" text NOT NULL,
  "imagen" text NOT NULL,
  "documentacion" text NOT NULL,
  "reglas" text NOT NULL,
  "vidaDiaria" text NOT NULL
);
CREATE TABLE IF NOT EXISTS "PaisInfo" (
  "ID" int4 NOT NULL,
  "IDPais" int4 NOT NULL,
  "requisitosVisa" text,
  "vacunasObligatorias" text,
  "vacunasRecomendadas" text,
  "notasGenerales" text,
  "reglas" text,
  "vidaDiaria" text,
  "documentacion" text
);
CREATE TABLE IF NOT EXISTS "PreferenciaUsuario" (
  "ID" int4 NOT NULL,
  "IDUsuario" int4,
  "IDCategoria" int4,
  "nivelPreferencia" int4 DEFAULT 1
);
CREATE TABLE IF NOT EXISTS "RegistroEstadisticas" (
  "ID" int4 NOT NULL,
  "IDUsuario" int4 NOT NULL,
  "tipoEvento" varchar(100) NOT NULL,
  "detalle" text,
  "fecha" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "Ubicacion" (
  "ID" int4 NOT NULL,
  "IDUsuario" int4 NOT NULL,
  "posicion" geography NOT NULL,
  "ultimaActualizacion" timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "Usuario" (
  "ID" int4 NOT NULL,
  "nombre" varchar(50) NOT NULL,
  "mail" varchar(320) NOT NULL,
  "contrasena" varchar(255),
  "nombreCompleto" varchar(100),
  "numeroContacto" varchar(50),
  "isAdmin" bool,
  "esPremium" bool,
  "idiomaPreferido" varchar(10),
  "paisActual" int4,
  "fotoPerfil" text
);
CREATE TABLE IF NOT EXISTS "zLogCambios" (
  "ID" int4 NOT NULL,
  "IDUsuario" int4,
  "accion" varchar(50),
  "tipoEntidad" varchar(50),
  "IDEntidad" int4,
  "diferencia" text,
  "fechaCreacion" timestamptz DEFAULT now()
);

-- Claves y restricciones.
ALTER TABLE ONLY "AgendaUsuario" ADD CONSTRAINT "AgendaUsuario_pkey" PRIMARY KEY ("ID");
ALTER TABLE ONLY "Categoria" ADD CONSTRAINT "Categoria_pkey" PRIMARY KEY ("ID");
ALTER TABLE ONLY "ContenidoPorCategoria" ADD CONSTRAINT "ContenidoPorCategoria_pkey" PRIMARY KEY ("ID");
ALTER TABLE ONLY "DocumentacionPais" ADD CONSTRAINT "DocumentacionPais_pkey" PRIMARY KEY ("IDPais");
ALTER TABLE ONLY "Estadisticas" ADD CONSTRAINT "Estadisticas_pkey" PRIMARY KEY ("ID");
ALTER TABLE ONLY "Evento" ADD CONSTRAINT "EventoPais_pkey" PRIMARY KEY ("ID");
ALTER TABLE ONLY "EventoFavorito" ADD CONSTRAINT "EventoFavorito_pkey" PRIMARY KEY ("ID");
ALTER TABLE ONLY "NumerosEmergenciaa" ADD CONSTRAINT "countryemergencycontacts_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "Pais" ADD CONSTRAINT "Pais_pkey" PRIMARY KEY ("ID");
ALTER TABLE ONLY "PaisInfo" ADD CONSTRAINT "PaisInfo_pkey" PRIMARY KEY ("ID");
ALTER TABLE ONLY "PreferenciaUsuario" ADD CONSTRAINT "PreferenciaUsuario_pkey" PRIMARY KEY ("ID");
ALTER TABLE ONLY "RegistroEstadisticas" ADD CONSTRAINT "RegistroEstadisticas_pkey" PRIMARY KEY ("ID");
ALTER TABLE ONLY "Ubicacion" ADD CONSTRAINT "Ubicacion_pkey" PRIMARY KEY ("ID");
ALTER TABLE ONLY "Usuario" ADD CONSTRAINT "Usuario_pkey" PRIMARY KEY ("ID");
ALTER TABLE ONLY "zLogCambios" ADD CONSTRAINT "LogCambios_pkey" PRIMARY KEY ("ID");
ALTER TABLE ONLY "PaisInfo" ADD CONSTRAINT "PaisInfo_IDPais_key" UNIQUE ("IDPais");
ALTER TABLE ONLY "Usuario" ADD CONSTRAINT "Usuario_mail_key" UNIQUE ("mail");
ALTER TABLE ONLY "AgendaUsuario" ADD CONSTRAINT "AgendaUsuario_IDEvento_fkey" FOREIGN KEY ("IDEvento") REFERENCES "Evento"("ID") ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE ONLY "AgendaUsuario" ADD CONSTRAINT "AgendaUsuario_IDUsuario_fkey" FOREIGN KEY ("IDUsuario") REFERENCES "Usuario"("ID") ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE ONLY "ContenidoPorCategoria" ADD CONSTRAINT "ContenidoPorCategoria_IDCategoria_fkey" FOREIGN KEY ("IDCategoria") REFERENCES "Categoria"("ID") ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE ONLY "ContenidoPorCategoria" ADD CONSTRAINT "ContenidoPorCategoria_IDPais_fkey" FOREIGN KEY ("IDPais") REFERENCES "Pais"("ID") ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE ONLY "ContenidoPorCategoria" ADD CONSTRAINT "ContenidoPorCategoria_creadoPor_fkey" FOREIGN KEY ("creadoPor") REFERENCES "Usuario"("ID") ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE ONLY "Estadisticas" ADD CONSTRAINT "Estadisticas_IDUsuario_fkey" FOREIGN KEY ("IDUsuario") REFERENCES "Usuario"("ID") ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE ONLY "Evento" ADD CONSTRAINT "EventoPais_IDCategoria_fkey" FOREIGN KEY ("IDCategoria") REFERENCES "Categoria"("ID") ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE ONLY "Evento" ADD CONSTRAINT "EventoPais_IDPais_fkey" FOREIGN KEY ("IDPais") REFERENCES "Pais"("ID") ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE ONLY "EventoFavorito" ADD CONSTRAINT "EventoFavorito_IDEvento_fkey" FOREIGN KEY ("IDEvento") REFERENCES "Evento"("ID") ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE ONLY "EventoFavorito" ADD CONSTRAINT "EventoFavorito_IDUsuario_fkey" FOREIGN KEY ("IDUsuario") REFERENCES "Usuario"("ID") ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE ONLY "PaisInfo" ADD CONSTRAINT "PaisInfo_IDPais_fkey" FOREIGN KEY ("IDPais") REFERENCES "Pais"("ID") ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE ONLY "PreferenciaUsuario" ADD CONSTRAINT "PreferenciaUsuario_IDCategoria_fkey" FOREIGN KEY ("IDCategoria") REFERENCES "Categoria"("ID") ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE ONLY "PreferenciaUsuario" ADD CONSTRAINT "PreferenciaUsuario_IDUsuario_fkey" FOREIGN KEY ("IDUsuario") REFERENCES "Usuario"("ID") ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE ONLY "Ubicacion" ADD CONSTRAINT "Ubicacion_IDUsuario_fkey" FOREIGN KEY ("IDUsuario") REFERENCES "Usuario"("ID") ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE ONLY "Usuario" ADD CONSTRAINT "Usuario_paisActual_fkey" FOREIGN KEY ("paisActual") REFERENCES "Pais"("ID") ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE ONLY "zLogCambios" ADD CONSTRAINT "LogCambios_IDUsuario_fkey" FOREIGN KEY ("IDUsuario") REFERENCES "Usuario"("ID") ON UPDATE NO ACTION ON DELETE NO ACTION;

-- Índices secundarios.
CREATE UNIQUE INDEX IF NOT EXISTS "PaisDocumentacion_codigo_uq" ON public."PaisDocumentacion" USING btree (codigo);
CREATE INDEX IF NOT EXISTS "Usuario_paisActual_idx" ON public."Usuario" USING btree ("paisActual");
CREATE INDEX IF NOT EXISTS idx_pais_info_id_pais ON public."PaisInfo" USING btree ("IDPais");
CREATE INDEX IF NOT EXISTS idx_registro_estadisticas_usuario ON public."RegistroEstadisticas" USING btree ("IDUsuario");
CREATE UNIQUE INDEX IF NOT EXISTS uq_pais_documentacion_id_pais ON public."PaisDocumentacion" USING btree ("IDPais") WHERE ("IDPais" IS NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pais_documentacion_nombre ON public."PaisDocumentacion" USING btree (nombre);

-- RLS estaba habilitado en el backup original; se conserva ese estado.
ALTER TABLE "AgendaUsuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Categoria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContenidoPorCategoria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentacionPais" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Estadisticas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Evento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventoFavorito" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NumerosEmergenciaa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pais" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaisDocumentacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaisInfo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PreferenciaUsuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RegistroEstadisticas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ubicacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "zLogCambios" ENABLE ROW LEVEL SECURITY;

COMMIT;
