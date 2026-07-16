-- ============================================================
--  KINETIC – Funciones
-- ============================================================

-- ============================================================
-- FUNCIÓN 1: fn_calcular_1rm
-- Calcula el 1RM estimado (fórmula de Epley) para cualquier
-- combinación peso/repeticiones. La usa el trigger de progreso
-- y también puede llamarse directamente desde la app.
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_calcular_1rm(
    p_peso_kg      NUMERIC,
    p_repeticiones INTEGER
)
RETURNS NUMERIC AS $$
BEGIN
    IF p_repeticiones <= 0 OR p_peso_kg <= 0 THEN
        RETURN 0;
    END IF;
    RETURN ROUND(p_peso_kg * (1 + (p_repeticiones::numeric / 30.0)), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ============================================================
-- FUNCIÓN 2: fn_progreso_semanal
-- Devuelve el volumen total y el mejor 1RM levantado por
-- semana para un usuario, en las últimas N semanas. Alimenta
-- las gráficas de progreso de la app móvil.
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_progreso_semanal(
    p_usuario_id UUID,
    p_semanas    INTEGER DEFAULT 8
)
RETURNS TABLE (
    semana        DATE,
    volumen_total NUMERIC,
    mejor_1rm     NUMERIC,
    sesiones      BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        date_trunc('week', rp.fecha)::date          AS semana,
        SUM(rp.volumen_total)                        AS volumen_total,
        MAX(rp.pr_calculado_1rm)                      AS mejor_1rm,
        COUNT(DISTINCT rp.fecha)                      AS sesiones
    FROM public.registro_progreso rp
    WHERE rp.usuario_id = p_usuario_id
      AND rp.fecha >= (CURRENT_DATE - (p_semanas * 7))
    GROUP BY date_trunc('week', rp.fecha)
    ORDER BY semana;
END;
$$ LANGUAGE plpgsql STABLE;


-- ============================================================
-- FUNCIÓN 3: fn_gimnasios_cercanos
-- Devuelve los gimnasios dentro de un radio (km) a partir de
-- una coordenada, ordenados por distancia, usando PostGIS.
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_gimnasios_cercanos(
    p_lat      NUMERIC,
    p_lng      NUMERIC,
    p_radio_km NUMERIC DEFAULT 5
)
RETURNS TABLE (
    id             UUID,
    name           TEXT,
    address        TEXT,
    distancia_km   NUMERIC,
    calificacion_promedio NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.id,
        g.name,
        g.address,
        ROUND((ST_Distance(
            g.location,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
        ) / 1000)::numeric, 2)                       AS distancia_km,
        ROUND(AVG(r.calificacion)::numeric, 1)        AS calificacion_promedio
    FROM public.gyms g
    LEFT JOIN public.resenas_gimnasios r ON r.gimnasio_id = g.id
    WHERE ST_DWithin(
        g.location,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_radio_km * 1000
    )
    GROUP BY g.id, g.name, g.address, g.location
    ORDER BY distancia_km;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- FIN DE FUNCIONES
-- ============================================================
