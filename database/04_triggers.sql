-- ============================================================
--  KINETIC – Triggers
--  Requiere: kinetic_schema_v2.sql ya ejecutado
-- ============================================================

-- ------------------------------------------------------------
-- Tabla de apoyo para auditoría (referenciada en el MER)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bitacora_auditoria (
    id       UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    accion   TEXT NOT NULL,
    fecha    TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- ============================================================
-- TRIGGER 1: trg_calcular_metricas_progreso
-- Calcula automáticamente volumen_total y pr_calculado_1rm
-- (fórmula de Epley) cada vez que se inserta o actualiza un
-- registro de progreso, evitando que el cliente móvil tenga
-- que enviar esos cálculos.
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_trg_calcular_metricas_progreso()
RETURNS TRIGGER AS $$
BEGIN
    NEW.volumen_total    := NEW.peso_kg * NEW.repeticiones * COALESCE(NEW.series, 1);
    NEW.pr_calculado_1rm := ROUND(NEW.peso_kg * (1 + (NEW.repeticiones::numeric / 30.0)), 2);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calcular_metricas_progreso ON public.registro_progreso;
CREATE TRIGGER trg_calcular_metricas_progreso
    BEFORE INSERT OR UPDATE OF peso_kg, repeticiones, series
    ON public.registro_progreso
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_trg_calcular_metricas_progreso();


-- ============================================================
-- TRIGGER 2: trg_auditoria_usuarios
-- Registra en bitacora_auditoria cada alta, baja o cambio
-- sensible (email / estado activo) sobre la tabla usuarios.
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_trg_auditoria_usuarios()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.bitacora_auditoria(accion)
        VALUES ('ALTA usuario ' || NEW.id || ' (' || NEW.email || ')');
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.email IS DISTINCT FROM OLD.email OR NEW.activo IS DISTINCT FROM OLD.activo THEN
            INSERT INTO public.bitacora_auditoria(accion)
            VALUES ('CAMBIO usuario ' || OLD.id ||
                    ' email: ' || OLD.email || ' -> ' || NEW.email ||
                    ' | activo: ' || OLD.activo || ' -> ' || NEW.activo);
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.bitacora_auditoria(accion)
        VALUES ('BAJA usuario ' || OLD.id || ' (' || OLD.email || ')');
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auditoria_usuarios ON public.usuarios;
CREATE TRIGGER trg_auditoria_usuarios
    AFTER INSERT OR UPDATE OR DELETE
    ON public.usuarios
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_trg_auditoria_usuarios();


-- ============================================================
-- TRIGGER 3: trg_notificar_rutina_creada
-- Cuando un usuario crea una rutina nueva, se genera de forma
-- automática una notificación de bienvenida a esa rutina.
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_trg_notificar_rutina_creada()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notificaciones(usuario_id, tipo, titulo, mensaje)
    VALUES (
        NEW.usuario_id,
        'rutina',
        'Nueva rutina creada',
        'Tu rutina "' || NEW.nombre || '" se creó correctamente. ¡Éxito en tu entrenamiento!'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notificar_rutina_creada ON public.rutinas;
CREATE TRIGGER trg_notificar_rutina_creada
    AFTER INSERT
    ON public.rutinas
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_trg_notificar_rutina_creada();

-- ============================================================
-- FIN DE TRIGGERS
-- ============================================================
