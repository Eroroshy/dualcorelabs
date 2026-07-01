import AwesomeIcon from "@react-native-vector-icons/material-design-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Contexto de Autenticación
import { AuthContext } from "../app/context/AuthContext";

// Pantallas
import ScreenEditProfile from "./tabs/account/ScreenEditProfile";
import ScreenLogin from "./tabs/account/ScreenLogin";
import ScreenSignUp from "./tabs/account/ScreenSignUp";
import ScreenAdmin from "./tabs/admin/ScreenAdmin";
import ScreenCalculator from "./tabs/calculator/ScreenCalculator";
import ScreenGym from "./tabs/gym/ScreenGym";
import PerfilHome from "./tabs/home/perfilhome";
import ScreenHistory from "./tabs/home/ScreenHistory";
import ScreenHome from "./tabs/home/ScreenHome";
import DetailLibrary from "./tabs/library/DetailLibrary";
import ScreenLibrary from "./tabs/library/ScreenLibrary";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export function MyNavigation() {
  const { user } = useContext(AuthContext);
  return user ? <AppStack /> : <AuthStack />;
}

// 🔐 Flujo de Autenticación (No logueado)
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={ScreenLogin} />
      <Stack.Screen name="Register" component={ScreenSignUp} />
    </Stack.Navigator>
  );
}

// 📱 Stack Principal de la Aplicación (Logueado)
function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0c0e10' },
      }}
    >
      <Stack.Screen name="Tabs" component={AppTabs} />
      <Stack.Screen
        name="Editar Perfil"
        component={ScreenEditProfile}
        options={{
          headerShown: true,
          title: 'Editar Perfil',
          headerStyle: {
            backgroundColor: '#111416',
            borderBottomColor: '#24282c',
            borderBottomWidth: 1,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            color: '#fff',
            fontFamily: 'Lexend_700Bold',
          },
        }}
      />
      <Stack.Screen name="Más Detalles" component={DetailLibrary} />
      <Stack.Screen name="ScreenCalculator" component={ScreenCalculator} />
    </Stack.Navigator>
  );
}

// 📊 Menú de Pestañas Inferiores
function AppTabs() {
  const insets = useSafeAreaInsets();
  const tabBarBottom = Math.max(insets.bottom, 8) + 8;
  const { t } = useTranslation(); 
  
  const { user } = useContext(AuthContext);
  
  // Limpieza estricta del rol para evitar fallos por mayúsculas o espacios
  const rawRole = user?.profile?.rol || 'user';
  const userRole = rawRole.toLowerCase().trim(); 
  
  // Condición de renderizado VIP (Admin o Tester)
  const isAdminOrTester = userRole === 'admin' || userRole === 'tester';

  return (
    <Tab.Navigator
      screenOptions={{
        ...styles.nav,
        tabBarStyle: [styles.nav.tabBarStyle, { bottom: tabBarBottom }],
      }}
    >
      <Tab.Screen
        name="HOME"
        component={ScreenHome}
        options={{
          tabBarLabel: t("tab_home", "HOME"),
          tabBarIcon: ({ color, focused }) => (
            <View style={tabStyle(focused)}>
              <AwesomeIcon name="view-dashboard" color={color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="LIBRARY"
        component={StackExercises}
        options={{
          tabBarLabel: t("tab_library", "LIBRARY"),
          tabBarIcon: ({ color, focused }) => (
            <View style={tabStyle(focused)}>
              <AwesomeIcon name="dumbbell" color={color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="PROGRESS"
        component={ScreenHistory}
        options={{
          tabBarLabel: t("tab_progress", "PROGRESS"),
          tabBarIcon: ({ color, focused }) => (
            <View style={tabStyle(focused)}>
              <AwesomeIcon name="chart-timeline-variant" color={color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="GYMS"
        component={ScreenGym}
        options={{
          tabBarLabel: t("tab_gyms", "GYMS"),
          tabBarIcon: ({ color, focused }) => (
            <View style={tabStyle(focused)}>
              <AwesomeIcon name="map-marker-radius" color={color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="PROFILE"
        component={PerfilHome}
        options={{
          tabBarLabel: t("tab_profile", "PROFILE"),
          tabBarIcon: ({ color, focused }) => (
            <View style={tabStyle(focused)}>
              <AwesomeIcon name="account" color={color} /> 
            </View>
          ),
        }}
      />

      {/* Pestaña secreta renderizada condicionalmente */}
      {isAdminOrTester && (
        <Tab.Screen
          name="ADMIN"
          component={ScreenAdmin}
          options={{
            tabBarLabel: t("tab_admin", "PANEL"),
            tabBarIcon: ({ color, focused }) => (
              <View style={tabStyle(focused)}>
                <AwesomeIcon name="shield-account" color={focused ? "#ff716c" : color} /> 
              </View>
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
}

function StackExercises() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Library" component={ScreenLibrary} />
      <Stack.Screen name="Más Detalles" component={DetailLibrary} options={{ headerShown: true }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  nav: {
    headerShown: false,
    tabBarStyle: {
      backgroundColor: "#0c0e10",
      borderTopWidth: 0,
      position: "absolute",
      left: 12,
      right: 12,
      height: 72,
      paddingBottom: 10,
      paddingTop: 8,
      borderRadius: 18,
      marginHorizontal: 0,
    },
    tabBarActiveTintColor: "#88adff",
    tabBarInactiveTintColor: "#aaabad",
    tabBarLabelStyle: {
      fontFamily: "Manrope_500Medium",
      fontSize: 10,
      letterSpacing: 1,
    },
  },
});

const tabStyle = (focused) => ({
  backgroundColor: focused ? "#171a1c" : "transparent",
  padding: 6,
  borderRadius: 10,
});