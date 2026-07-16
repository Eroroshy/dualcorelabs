-- ============================================================
--  KINETIC – Usuarios y permisos
--  Complementa las políticas RLS ya activas en Supabase
--  (ver captura "Screenshot_2026-07-15_203803.png": políticas
--  por comando -SELECT/INSERT/UPDATE/DELETE- aplicadas a los
--  roles internos "authenticated" y "public").
-- ============================================================

-- ------------------------------------------------------------
-- 1. Roles a nivel de base de datos (fuera de Supabase Auth)
--    Usados por procesos de backend/administración que se
--    conectan directamente por PgAdmin / pooler (puerto 6543).
-- ------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kinetic_admin') THEN
        CREATE ROLE kinetic_admin LOGIN PASSWORD 'CAMBIAR_EN_PRODUCCION' NOSUPERUSER CREATEDB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kinetic_backend') THEN
        CREATE ROLE kinetic_backend LOGIN PASSWORD 'CAMBIAR_EN_PRODUCCION' NOSUPERUSER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kinetic_readonly') THEN
        CREATE ROLE kinetic_readonly LOGIN PASSWORD 'CAMBIAR_EN_PRODUCCION' NOSUPERUSER;
    END IF;
END;
$$;

-- kinetic_admin: control total sobre el esquema (migraciones, mantenimiento)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kinetic_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kinetic_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO kinetic_admin;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA public TO kinetic_admin;

-- kinetic_backend: lectura/escritura operativa (usado por la API/Edge Functions),
-- sin permiso para borrar catálogos ni alterar estructura
GRANT SELECT, INSERT, UPDATE ON
    public.usuarios, public.perfiles, public.ejercicios_favoritos,
    public.rutinas, public.rutina_ejercicios, public.registro_progreso,
    public.sesiones, public.notificaciones
TO kinetic_backend;
GRANT SELECT ON public.ejercicios_catalogo, public.gyms, public.resenas_gimnasios TO kinetic_backend;
GRANT EXECUTE ON FUNCTION public.fn_calcular_1rm(numeric, integer) TO kinetic_backend;
GRANT EXECUTE ON FUNCTION public.fn_progreso_semanal(uuid, integer) TO kinetic_backend;
GRANT EXECUTE ON FUNCTION public.fn_gimnasios_cercanos(numeric, numeric, numeric) TO kinetic_backend;
GRANT EXECUTE ON PROCEDURE public.sp_registrar_progreso(uuid, varchar, varchar, numeric, integer, integer) TO kinetic_backend;
GRANT EXECUTE ON PROCEDURE public.sp_crear_rutina_completa(uuid, varchar, text, varchar, integer, jsonb) TO kinetic_backend;

-- kinetic_readonly: solo consulta, para reportes/analítica del equipo docente
GRANT SELECT ON ALL TABLES IN SCHEMA public TO kinetic_readonly;

-- ------------------------------------------------------------
-- 2. Roles a nivel de aplicación (Supabase Auth / RLS)
--    No se crean aquí: los administra Supabase, pero las
--    políticas de la base sí dependen de ellos.
--
--    authenticated  -> cualquier usuario con sesión válida;
--                       acceso restringido a sus propios datos
--                       vía auth.uid() = usuario_id (RLS).
--    public         -> acceso sin sesión (solo lectura donde
--                       aplica: catálogo de ejercicios, gyms).
--    service_role    -> usado por Edge Functions/servidor,
--                       equivalente a kinetic_backend, hace
--                       bypass de RLS.
-- ------------------------------------------------------------

-- Ejemplo de política diferenciada para un rol "admin" aplicativo,
-- igual al patrón "Admins y Testers pueden ver todos los perfiles"
-- ya presente en la tabla usuarios (ver captura adjunta). El rol
-- se lee del custom claim "role" incluido en el JWT de Supabase Auth.
CREATE POLICY IF NOT EXISTS "admins_pueden_ver_todo_progreso"
    ON public.registro_progreso FOR SELECT
    USING (
        auth.uid() = usuario_id
        OR (auth.jwt() ->> 'role') IN ('admin', 'tester')
    );

-- ============================================================
-- FIN DE USUARIOS Y PERMISOS
-- ============================================================
