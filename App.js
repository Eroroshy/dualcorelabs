import { NavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MyNavigation } from './app/MyNav';
import { AuthProvider } from './app/context/AuthContext';

// IMPORTA TU CLIENTE DE SUPABASE
import { supabase } from './app/subapaseClient';

// FONTS
import { Lexend_700Bold, Lexend_800ExtraBold } from '@expo-google-fonts/lexend';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold
} from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';

export default function App() {
  
  // CONFIGURACIÓN DE LINKING INTERCEPTANDO LA URL PARA SUPABASE
  const linking = {
    prefixes: [Linking.createURL('/'), 'kinetic://'],
    config: {
      screens: {
        ResetPassword: 'reset-password',
      },
    },
    // Este método escucha la URL del correo, guarda la sesión en Supabase y luego navega
    async subscribe(listener) {
      const onReceiveURL = async ({ url }) => {
        if (url) {
          // Extrae el token hash de la URL y activa la sesión en caliente
          await supabase.auth.setSession(url);
        }
        // Retraso sutil para evitar interferencia con cambios de estado inmediatos
        setTimeout(() => listener(url), 0);
      };

      // Listener para cuando la aplicación ya está abierta en segundo plano
      const subscription = Linking.addEventListener('url', onReceiveURL);

      // Revisa si la aplicación se abrió desde cero (cerrada por completo) usando el enlace
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await supabase.auth.setSession(initialUrl);
        // Prioriza la navegación profunda antes de la carga de la ruta inicial nativa
        setTimeout(() => listener(initialUrl), 0);
      }

      return () => {
        subscription.remove();
      };
    },
  };

  const [fontsLoaded] = useFonts({
    Lexend_700Bold,
    Lexend_800ExtraBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <NavigationContainer linking={linking}>
          <PaperProvider>
            <MyNavigation />
          </PaperProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </AuthProvider>
  );
}