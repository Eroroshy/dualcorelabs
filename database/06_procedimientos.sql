-- ============================================================
--  KINETIC – Procedimientos almacenados
-- ============================================================

-- ============================================================
-- PROCEDIMIENTO 1: sp_registrar_progreso
-- Inserta un set de entrenamiento y, si superó el mejor 1RM
-- histórico del usuario para ese ejercicio, genera una
-- notificación de "nuevo récord personal".
-- ============================================================
CREATE OR REPLACE PROCEDURE public.sp_registrar_progreso(
    p_usuario_id       UUID,
    p_ejercicio_api_id CHARACTER VARYING,
    p_nombre_ejercicio CHARACTER VARYING,
    p_peso_kg          NUMERIC,
    p_repeticiones     INTEGER,
    p_series           INTEGER DEFAULT 1
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_1rm_nuevo   NUMERIC;
    v_1rm_previo  NUMERIC;
BEGIN
    v_1rm_nuevo := public.fn_calcular_1rm(p_peso_kg, p_repeticiones);

    SELECT MAX(pr_calculado_1rm) INTO v_1rm_previo
    FROM public.registro_progreso
    WHERE usuario_id = p_usuario_id
      AND nombre_ejercicio = p_nombre_ejercicio;

    INSERT INTO public.registro_progreso (
        usuario_id, ejercicio_api_id, nombre_ejercicio,
        peso_kg, repeticiones, series
    ) VALUES (
        p_usuario_id, p_ejercicio_api_id, p_nombre_ejercicio,
        p_peso_kg, p_repeticiones, p_series
    );
    -- volumen_total y pr_calculado_1rm los completa trg_calcular_metricas_progreso

    IF v_1rm_previo IS NOT NULL AND v_1rm_nuevo > v_1rm_previo THEN
        INSERT INTO public.notificaciones(usuario_id, tipo, titulo, mensaje)
        VALUES (
            p_usuario_id,
            'record_personal',
            '¡Nuevo récord personal!',
            'Superaste tu 1RM en ' || p_nombre_ejercicio || ': ' || v_1rm_nuevo || ' kg'
        );
    END IF;

    COMMIT;
END;
$$;


-- ============================================================
-- PROCEDIMIENTO 2: sp_crear_rutina_completa
-- Crea una rutina y todos sus ejercicios asociados en una sola
-- transacción, a partir de un arreglo JSON enviado por la app.
-- Si algo falla, no se guarda ni la rutina ni los ejercicios.
-- ============================================================
CREATE OR REPLACE PROCEDURE public.sp_crear_rutina_completa(
    p_usuario_id       UUID,
    p_nombre           CHARACTER VARYING,
    p_descripcion      TEXT,
    p_objetivo         CHARACTER VARYING,
    p_duracion_semanas INTEGER,
    p_ejercicios       JSONB   -- [{"ejercicio_api_id":"..","orden":1,"series_objetivo":4,"repeticiones_objetivo":10,"peso_sugerido_kg":40,"dia_semana":1}, ...]
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_rutina_id UUID;
    v_item      JSONB;
BEGIN
    INSERT INTO public.rutinas (usuario_id, nombre, descripcion, objetivo, duracion_semanas)
    VALUES (p_usuario_id, p_nombre, p_descripcion, p_objetivo, p_duracion_semanas)
    RETURNING id INTO v_rutina_id;
    -- trg_notificar_rutina_creada dispara la notificación automáticamente

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_ejercicios)
    LOOP
        INSERT INTO public.rutina_ejercicios (
            rutina_id, ejercicio_api_id, orden,
            series_objetivo, repeticiones_objetivo, peso_sugerido_kg, dia_semana
        ) VALUES (
            v_rutina_id,
            v_item->>'ejercicio_api_id',
            (v_item->>'orden')::integer,
            (v_item->>'series_objetivo')::integer,
            (v_item->>'repeticiones_objetivo')::integer,
            (v_item->>'peso_sugerido_kg')::numeric,
            (v_item->>'dia_semana')::integer
        );
    END LOOP;

    COMMIT;
END;
$$;


-- ============================================================
-- PROCEDIMIENTO 3: sp_desactivar_usuario
-- Baja lógica de un usuario: lo marca inactivo, cierra todas
-- sus sesiones activas y deja constancia en la bitácora.
-- ============================================================
CREATE OR REPLACE PROCEDURE public.sp_desactivar_usuario(
    p_usuario_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.usuarios
       SET activo = false
     WHERE id = p_usuario_id;
    -- trg_auditoria_usuarios registra el cambio de estado

    UPDATE public.sesiones
       SET activo = false
     WHERE usuario_id = p_usuario_id
       AND activo = true;

    INSERT INTO public.bitacora_auditoria(accion)
    VALUES ('DESACTIVACION manual del usuario ' || p_usuario_id || ' y cierre de sus sesiones activas');

    COMMIT;
END;
$$;

-- ============================================================
-- FIN DE PROCEDIMIENTOS
-- ============================================================
