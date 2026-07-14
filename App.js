import { NavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import React, { useEffect } from 'react'; // IMPORTANTE: Añadido useEffect
import { Platform, Text, View } from 'react-native'; // IMPORTANTE: Añadido Platform
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// LO NUEVO PARA NOTIFICACIONES
import * as Notifications from 'expo-notifications';

import { MyNavigation } from './app/MyNav';
import { AuthProvider } from './app/context/AuthContext';

// FONTS
import { Lexend_700Bold, Lexend_800ExtraBold } from '@expo-google-fonts/lexend';
import {
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold
} from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';

// CONFIGURACIÓN: Cómo se comportan las notificaciones si la app está abierta en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0c0e10', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#eeeef0', fontFamily: 'Lexend_700Bold', fontSize: 16, textAlign: 'center' }}>
            Algo salió mal. Reinicia la app.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const linking = {
  prefixes: [Linking.createURL('/'), 'kinetic://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
    },
  },
};

export default function App() {

  // EFECTO PARA INICIALIZAR NOTIFICACIONES Y OBTENER TU TOKEN
  useEffect(() => {
    async function configurarNotificaciones() {
      // 1. Solicitar permisos al usuario en el teléfono
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('¡El usuario rechazó los permisos de notificación!');
        return;
      }

      // 2. Configurar obligatoriamente el Canal de Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7A',
        });
      }

      // 3. Obtener el Token Nativo del APK para meter en la herramienta de Expo
      // Nota: Reemplaza con tu ProjectID de EAS si usas getExpoPushTokenAsync, 
      // o usa getDevicePushTokenAsync para FCM directo. Aquí usamos el nativo del dispositivo:
      try {
        const tokenData = await Notifications.getDevicePushTokenAsync();
        console.log("==========================================");
        console.log("TU TOKEN PARA EL APK ACTUAL:");
        console.log(tokenData.data);
        console.log("==========================================");
      } catch (error) {
        console.log("Error obteniendo el token:", error);
      }
    }

    configurarNotificaciones();
  }, []);
  
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
    <ErrorBoundary>
      <AuthProvider>
        <SafeAreaProvider>
          <NavigationContainer linking={linking}>
            <PaperProvider>
              <MyNavigation />
            </PaperProvider>
          </NavigationContainer>
        </SafeAreaProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}