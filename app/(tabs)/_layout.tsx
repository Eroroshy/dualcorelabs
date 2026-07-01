import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Sigue apagado para que no interfiera
        tabBarActiveTintColor: '#88adff', // Color azul KINETIC cuando la pestaña está activa
        tabBarInactiveTintColor: '#747578', // Gris apagado para las inactivas
        tabBarStyle: {
          backgroundColor: '#111416', // Fondo oscuro premium para la barra inferior
          borderTopWidth: 1,
          borderTopColor: '#24282c', // Línea sutil superior para dividir
          paddingBottom: 5,
          height: 60,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home', // Mantiene tu pestaña original
          tabBarIcon: ({ color }) => <Ionicons size={28} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore', // Mantiene tu pestaña original
          tabBarIcon: ({ color }) => <Ionicons size={28} name="paper-plane" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial', // Mantiene tu pestaña original
          tabBarIcon: ({ color }) => <Ionicons size={28} name="bar-chart" color={color} />,
        }}
      />
    </Tabs>
  );
}