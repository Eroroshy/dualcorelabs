import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import React, { createContext, useEffect, useState } from "react";
import { supabase } from "../subapaseClient";

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listener de autenticación activa
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error en el listener de autenticación:", error);
      } finally {
        setLoading(false); 
      }
    });

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Descarga del perfil complementario desde la tabla 'perfiles'
  const fetchUserProfile = async (supabaseUser) => {
    try {
      const { data: profile, error } = await supabase
        .from("perfiles")
        .select("*")
        .eq("usuario_id", supabaseUser.id)
        .single();

      if (error && error.code !== "PGRST116") { 
        console.error("Error cargando perfil de base de datos:", error.message);
      }

      // 🔍 REGISTRO DE CONTROL (MIRA TU TERMINAL AQUÍ)
      console.log("=== CONTROL DE ROLES SUPABASE ===");
      console.log("ID de Usuario:", supabaseUser.id);
      console.log("Datos de Perfil descargados:", profile);
      console.log("Rol detectado:", profile?.rol);
      console.log("=================================");

      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email,
        user_metadata: supabaseUser.user_metadata,
        profile: profile || null,
      });
    } catch (err) {
      console.error("Error en fetchUserProfile:", err);
    }
  };

  // Modificar campos locales del perfil de usuario
  const updateUser = (updatedData) => {
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        profile: {
          ...prev.profile,
          ...updatedData.profile,
        },
      };
    });
  };

  // Gestión y procesamiento de fotos de perfil mediante binario ArrayBuffer
  const updateAvatar = async (imageUri) => {
    try {
      const userId = user?.id;
      if (!userId) throw new Error("No hay una sesión activa de usuario.");

      const base64Data = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64', 
      });

      const arrayBuffer = decode(base64Data);
      const cleanPath = imageUri.split('?')[0];
      const fileExt = cleanPath.split('.').pop() || 'jpg';
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      const { error: profileError } = await supabase
        .from("perfiles")
        .update({ foto_url: publicUrl }) 
        .eq("usuario_id", userId);

      if (profileError) throw profileError;

      setUser((prev) => ({
        ...prev,
        profile: {
          ...prev?.profile,
          foto_url: publicUrl,
        },
      }));

      return publicUrl;
    } catch (error) {
      console.error("Error crítico en updateAvatar:", error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Error al cerrar sesión:", error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, updateUser, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};