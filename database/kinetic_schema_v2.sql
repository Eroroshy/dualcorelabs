-- ============================================================
--  KINETIC – Script DDL Actualizado
--  Generado desde esquema real de Supabase
--  Fecha: 29 de junio de 2026
--  Proyecto: @epicmatrix/kinetic-app
-- ============================================================

-- Extensiones necesarias (ya activas en Supabase, se incluyen por referencia)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- 1. USUARIOS
-- Tabla base de autenticación propia
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
    id              UUID                        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre          CHARACTER VARYING           NOT NULL,
    email           CHARACTER VARYING           NOT NULL UNIQUE,
    password_hash   TEXT                        NOT NULL,
    fecha_registro  TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    activo          BOOLEAN                     DEFAULT true
);

-- ============================================================
-- 2. PERFILES
-- Datos físicos y de objetivo del usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS public.perfiles (
    id                  UUID                        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id          UUID                        NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    nombre              TEXT,
    edad                INTEGER,
    peso_kg             NUMERIC,
    altura_cm           NUMERIC,
    nivel_experiencia   CHARACTER VARYING           DEFAULT 'principiante',
    objetivo            CHARACTER VARYING,
    foto_url            TEXT,
    actualizado_en      TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- ============================================================
-- 3. EJERCICIOS_CATALOGO
-- Catálogo sincronizado desde la Workout API externa
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ejercicios_catalogo (
    id               CHARACTER VARYING           NOT NULL PRIMARY KEY,
    nombre           CHARACTER VARYING           NOT NULL,
    grupo_muscular   CHARACTER VARYING,
    categoria        CHARACTER VARYING,
    nivel_dificultad CHARACTER VARYING,
    instrucciones    TEXT,
    imagen_url       TEXT,
    fuente_api       CHARACTER VARYING           DEFAULT 'workout_api',
    sincronizado_en  TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- ============================================================
-- 4. EJERCICIOS_FAVORITOS
-- Ejercicios marcados como favoritos por el usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ejercicios_favoritos (
    id               UUID                        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id       UUID                        NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    ejercicio_api_id CHARACTER VARYING,
    nombre_ejercicio CHARACTER VARYING           NOT NULL,
    grupo_muscular   CHARACTER VARYING,
    categoria        CHARACTER VARYING,
    fecha_guardado   TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- ============================================================
-- 5. RUTINAS
-- Rutinas de entrenamiento creadas por el usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rutinas (
    id               UUID                        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id       UUID                        NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    nombre           CHARACTER VARYING           NOT NULL,
    descripcion      TEXT,
    objetivo         CHARACTER VARYING,
    duracion_semanas INTEGER,
    activa           BOOLEAN                     DEFAULT true,
    creado_en        TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- ============================================================
-- 6. RUTINA_EJERCICIOS
-- Ejercicios que componen cada rutina (tabla pivote)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rutina_ejercicios (
    id                    UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rutina_id             UUID          NOT NULL REFERENCES public.rutinas(id) ON DELETE CASCADE,
    ejercicio_api_id      CHARACTER VARYING,
    orden                 INTEGER       NOT NULL,
    series_objetivo       INTEGER,
    repeticiones_objetivo INTEGER,
    peso_sugerido_kg      NUMERIC,
    dia_semana            INTEGER
);

-- ============================================================
-- 7. REGISTRO_PROGRESO
-- Historial de sets/cargas registrados por el usuario
-- Incluye cálculo automático de 1RM (fórmula Epley)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.registro_progreso (
    id               UUID                         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id       UUID                         NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    ejercicio_api_id CHARACTER VARYING,
    nombre_ejercicio CHARACTER VARYING            NOT NULL,
    peso_kg          NUMERIC                      NOT NULL,
    repeticiones     INTEGER                      NOT NULL,
    series           INTEGER                      DEFAULT 1,
    volumen_total    NUMERIC,
    pr_calculado_1rm NUMERIC,
    fecha            DATE                         DEFAULT CURRENT_DATE,
    fecha_registro   TIMESTAMP WITHOUT TIME ZONE  DEFAULT now(),
    creado_el        TIMESTAMP WITH TIME ZONE     DEFAULT now()
);

-- ============================================================
-- 8. SESIONES
-- Control de sesiones activas y tokens JWT
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sesiones (
    id          UUID                        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id  UUID                        NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    token_jwt   TEXT                        NOT NULL,
    dispositivo CHARACTER VARYING,
    activo      BOOLEAN                     DEFAULT true,
    creado_en   TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    expira_en   TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

-- ============================================================
-- 9. NOTIFICACIONES
-- Notificaciones push/in-app para el usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notificaciones (
    id          UUID                        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id  UUID                        NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo        CHARACTER VARYING           NOT NULL,
    titulo      CHARACTER VARYING           NOT NULL,
    mensaje     TEXT                        NOT NULL,
    leida       BOOLEAN                     DEFAULT false,
    creado_en   TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    leida_en    TIMESTAMP WITHOUT TIME ZONE
);

-- ============================================================
-- 10. GYMS
-- Gimnasios con soporte geoespacial (PostGIS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gyms (
    id       UUID  NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name     TEXT  NOT NULL,
    address  TEXT,
    phone    TEXT,
    location GEOGRAPHY(Point, 4326)  -- coordenadas lat/lng via PostGIS
);

-- ============================================================
-- 11. RESENAS_GIMNASIOS
-- Reseñas y calificaciones de gimnasios por usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS public.resenas_gimnasios (
    id           UUID                        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    gimnasio_id  UUID                        NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    usuario_id   UUID                        REFERENCES public.usuarios(id) ON DELETE SET NULL,
    calificacion INTEGER                     NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario   TEXT,
    fecha_resena TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- ============================================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================================

ALTER TABLE public.usuarios          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ejercicios_favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rutinas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rutina_ejercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registro_progreso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resenas_gimnasios ENABLE ROW LEVEL SECURITY;

-- Usuarios: solo ven su propio registro
CREATE POLICY "usuarios_solo_propio"
    ON public.usuarios FOR ALL
    USING (auth.uid() = id);

-- Perfiles: solo el dueño
CREATE POLICY "perfil_solo_propio"
    ON public.perfiles FOR ALL
    USING (auth.uid() = usuario_id);

-- Favoritos: solo el dueño
CREATE POLICY "favoritos_solo_propio"
    ON public.ejercicios_favoritos FOR ALL
    USING (auth.uid() = usuario_id);

-- Rutinas: solo el dueño
CREATE POLICY "rutinas_solo_propio"
    ON public.rutinas FOR ALL
    USING (auth.uid() = usuario_id);

-- Rutina_ejercicios: acceso a través de la rutina del usuario
CREATE POLICY "rutina_ejercicios_solo_propio"
    ON public.rutina_ejercicios FOR ALL
    USING (
        rutina_id IN (
            SELECT id FROM public.rutinas WHERE usuario_id = auth.uid()
        )
    );

-- Registro de progreso: solo el dueño
CREATE POLICY "progreso_solo_propio"
    ON public.registro_progreso FOR ALL
    USING (auth.uid() = usuario_id);

-- Sesiones: solo el dueño
CREATE POLICY "sesiones_solo_propio"
    ON public.sesiones FOR ALL
    USING (auth.uid() = usuario_id);

-- Notificaciones: solo el dueño
CREATE POLICY "notificaciones_solo_propio"
    ON public.notificaciones FOR ALL
    USING (auth.uid() = usuario_id);

-- Gyms: lectura pública, escritura solo admin
CREATE POLICY "gyms_lectura_publica"
    ON public.gyms FOR SELECT
    USING (true);

-- Reseñas: lectura pública, escritura solo el autor
CREATE POLICY "resenas_lectura_publica"
    ON public.resenas_gimnasios FOR SELECT
    USING (true);

CREATE POLICY "resenas_escritura_propia"
    ON public.resenas_gimnasios FOR INSERT
    WITH CHECK (auth.uid() = usuario_id);

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
