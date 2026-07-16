
import { supabase } from '../app/subapaseClient';

/**
 * SERVICIOS PARA LA APLICACIÓN KINETIC
 * Este archivo conecta tu frontend con las funciones y procedimientos almacenados de Supabase.
 * (Recuerda que los Triggers no se ponen aquí porque se ejecutan solos en la Base de Datos).
 */
export const kineticService = {

  // ==========================================
  // FUNCIONES (Para consultar y traer datos)
  // ==========================================

  /**
   * Obtiene el total de sesiones completadas por un usuario.
   * @param {string} userId - El ID (UUID) del usuario.
   * @returns {Promise<number>} Número de sesiones.
   */
  async getTotalSesiones(userId) {
    const { data, error } = await supabase.rpc('fn_total_sesiones_usuario', {
      p_usuario_id: userId
    });

    if (error) {
      console.error("Error en fn_total_sesiones_usuario:", error.message);
      throw error;
    }
    return data; // Devuelve un número limpio
  },

  /**
   * Obtiene la cantidad de ejercicios favoritos de un usuario.
   * @param {string} userId - El ID (UUID) del usuario.
   * @returns {Promise<number>} Cantidad de favoritos.
   */
  async getCantidadFavoritos(userId) {
    const { data, error } = await supabase.rpc('fn_contar_ejercicios_favoritos', {
      p_usuario_id: userId
    });

    if (error) {
      console.error("Error en fn_contar_ejercicios_favoritos:", error.message);
      throw error;
    }
    return data;
  },

  /**
   * Obtiene el total de rutinas creadas por un usuario.
   * @param {string} userId - El ID (UUID) del usuario.
   * @returns {Promise<number>} Total de rutinas.
   */
  async getTotalRutinas(userId) {
    const { data, error } = await supabase.rpc('fn_total_rutinas_usuario', {
      p_usuario_id: userId
    });

    if (error) {
      console.error("Error en fn_total_rutinas_usuario:", error.message);
      throw error;
    }
    return data;
  },


  // ==========================================
  // PROCEDIMIENTOS ALMACENADOS (Para hacer acciones)
  // ==========================================

  /**
   * Registra el final de un entrenamiento (Crea la sesión y dispara la notificación automáticamente).
   * @param {string} userId - El ID del usuario.
   * @param {string} rutinaId - El ID de la rutina completada.
   */
  async registrarSesionEntrenamiento(userId, rutinaId) {
    const { data, error } = await supabase.rpc('sp_registrar_sesion_entrenamiento', {
      p_usuario_id: userId,
      p_rutina_id: rutinaId
    });

    if (error) {
      console.error("Error en sp_registrar_sesion_entrenamiento:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  /**
   * Agrega de forma segura un ejercicio a favoritos (Evita duplicados).
   * @param {string} userId - El ID del usuario.
   * @param {string} ejercicioId - El ID del ejercicio en el catálogo.
   */
  async agregarEjercicioFavorito(userId, ejercicioId) {
    const { data, error } = await supabase.rpc('sp_agregar_favorito_seguro', {
      p_usuario_id: userId,
      p_ejercicio_id: ejercicioId
    });

    if (error) {
      console.error("Error en sp_agregar_favorito_seguro:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  /**
   * Envía una notificación manual personalizada a un usuario.
   * @param {string} userId - El ID del usuario.
   * @param {string} mensaje - El texto de la notificación.
   */
  async enviarNotificacion(userId, mensaje) {
    const { data, error } = await supabase.rpc('sp_enviar_notificacion_usuario', {
      p_usuario_id: userId,
      p_mensaje: mensaje
    });

    if (error) {
      console.error("Error en sp_enviar_notificacion_usuario:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  }
};