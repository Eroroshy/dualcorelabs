import { NavigationContainer } from '@react-navigation/native';
import React, { useContext } from 'react';
import { PaperProvider } from 'react-native-paper';

import { MyNavigation } from './app/MyNav';

import { AuthContext, AuthProvider } from './app/context/AuthContext';

// FONTS
import { Lexend_700Bold, Lexend_800ExtraBold } from '@expo-google-fonts/lexend';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold
} from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';

function RootNavigation() {
  const { user } = useContext(AuthContext);

  return <MyNavigation user={user} />;
}

export default function App() {

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
      <NavigationContainer>
        <PaperProvider>
          <RootNavigation />
        </PaperProvider>
      </NavigationContainer>
    </AuthProvider>
  );
}
