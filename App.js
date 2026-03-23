import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { MyNavigation } from './app/MyNav';

export default function App() {
  return (
    <NavigationContainer>
    <PaperProvider>
      <MyNavigation/> 
    </PaperProvider>
    </NavigationContainer> 
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});