import { NavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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

export default function App() {
  const linking = {
    prefixes: [Linking.createURL('/'), 'kinetic://'],
    config: {
      screens: {
        ResetPassword: 'reset-password',
      },
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
