import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode } from 'base64-arraybuffer';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as FileSystem from 'expo-file-system/legacy';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import React, { createContext, useEffect, useState } from "react";
import { Platform } from 'react-native';
import { supabase } from "../subapaseClient";

// Configuración global de cómo se muestran las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ⚡ LÓGICA PRO: REGISTRO DE NOTIFICACIONES PUSH
  const registerForPushNotificationsAsync = async (userId) => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#88adff',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Permiso de notificaciones denegado.');
        return;
      }
      
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      
      // Guardar el token en Supabase para este usuario
      if (token) {
        await supabase
          .from('perfiles')
          .update({ push_token: token })
          .eq('usuario_id', userId);
      }
    } else {
      console.log('Las notificaciones Push necesitan un dispositivo físico (no funciona en emuladores).');
    }

    return token;
  };

  // ⚡ Interceptor de Deep Links
  useEffect(() => {
    const processDeepLink = async (url) => {
      if (!url) return;
      const accessToken = url.match(/access_token=([^&]+)/)?.[1];
      const refreshToken = url.match(/refresh_token=([^&]+)/)?.[1];
      const parsed = Linking.parse(url);
      const code = parsed.queryParams?.code;

      if (accessToken && refreshToken) {
        try {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        } catch (error) { console.error("Error link:", error); }
      } else if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch (error) { console.error("Error código:", error); }
      }
    };

    Linking.getInitialURL().then(processDeepLink);
    const subscription = Linking.addEventListener('url', ({ url }) => processDeepLink(url));
    return () => subscription.remove();
  }, []);

  // Listener de autenticación activa
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session) {
          await fetchUserProfile(session.user);
          // Pedir permisos y registrar token cada vez que inician sesión
          registerForPushNotificationsAsync(session.user.id);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error Auth:", error);
      } finally {
        setLoading(false); 
      }
    });

    return () => authListener?.subscription?.unsubscribe();
  }, []);

  // Descarga del perfil con CACHÉ OFFLINE
  const fetchUserProfile = async (supabaseUser) => {
    try {
      const { data: profile, error } = await supabase.from("perfiles").select("*").eq("usuario_id", supabaseUser.id).single();
      if (error && error.code !== "PGRST116") throw error; 

      const finalUser = { id: supabaseUser.id, email: supabaseUser.email, user_metadata: supabaseUser.user_metadata, profile: profile || null };
      await AsyncStorage.setItem('@offline_user_profile', JSON.stringify(finalUser));
      setUser(finalUser);
    } catch (err) {
      console.warn("Offline fallback", err.message);
      const cachedData = await AsyncStorage.getItem('@offline_user_profile');
      if (cachedData) setUser(JSON.parse(cachedData));
      else setUser({ id: supabaseUser.id, email: supabaseUser.email, user_metadata: supabaseUser.user_metadata, profile: null });
    }
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      if (!prev) return null;
      const newUserState = { ...prev, profile: { ...prev.profile, ...updatedData.profile } };
      AsyncStorage.setItem('@offline_user_profile', JSON.stringify(newUserState)).catch(e => console.error(e));
      return newUserState;
    });
  };

  const updateAvatar = async (imageUri) => {
    try {
      const userId = user?.id;
      if (!userId) throw new Error("No sesión activa.");
      const base64Data = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
      const arrayBuffer = decode(base64Data);
      const fileExt = imageUri.split('?')[0].split('.').pop() || 'jpg';
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, arrayBuffer, { contentType: `image/${fileExt}`, upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const { error: profileError } = await supabase.from("perfiles").update({ foto_url: urlData.publicUrl }).eq("usuario_id", userId);
      if (profileError) throw profileError;

      updateUser({ profile: { foto_url: urlData.publicUrl } });
      return urlData.publicUrl;
    } catch (error) { throw error; }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('@offline_user_profile');
      setUser(null);
    } catch (error) { console.error("Logout error:", error); }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, updateUser, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};