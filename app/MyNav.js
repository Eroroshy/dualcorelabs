import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Contexto de Autenticación
import { AuthContext } from "../app/context/AuthContext";

// Pantallas
import ScreenEditProfile from "./tabs/account/ScreenEditProfile";
import ScreenLogin from "./tabs/account/ScreenLogin";
import ResetPasswordScreen from "./tabs/account/ScreenResetPassword";
import ScreenSignUp from "./tabs/account/ScreenSignUp";
import ScreenAdmin from "./tabs/admin/ScreenAdmin";
import ScreenCalculator from "./tabs/calculator/ScreenCalculator";
import ScreenGym from "./tabs/gym/ScreenGym";
import PerfilHome from "./tabs/home/perfilhome";
import ScreenHistory from "./tabs/home/ScreenHistory";
import ScreenHome from "./tabs/home/ScreenHome";
import ScreenOnboarding from "./tabs/home/ScreenOnboarding";
import DetailLibrary from "./tabs/library/DetailLibrary";
import ScreenLibrary from "./tabs/library/ScreenLibrary";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export function MyNavigation() {
  const { user, loading: authLoading, needsPasswordReset } = useContext(AuthContext);
  
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [onboardingStorageKey, setOnboardingStorageKey] = useState(null);

  // Verificar Onboarding
  useEffect(() => {
    let mounted = true;

    const checkOnboardingState = async () => {
      if (!user?.id) {
        if (!mounted) return;
        setShouldShowOnboarding(false);
        setOnboardingStorageKey(null);
        setOnboardingReady(true);
        return;
      }

      const storageKey = `@viewedOnboarding_${user.id}`;
      const viewed = await AsyncStorage.getItem(storageKey);

      if (!mounted) return;

      setOnboardingStorageKey(storageKey);
      setShouldShowOnboarding(viewed === null);
      setOnboardingReady(true);
    };

    if (!authLoading) {
      setOnboardingReady(false);
      checkOnboardingState();
    }

    return () => {
      mounted = false;
    };
  }, [authLoading, user?.id]);

  // 1. PANTALLA DE CARGA
  if (authLoading || (user && !onboardingReady)) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#88adff" />
      </View>
    );
  }

  // 2. ⚡ BÓVEDA DE SEGURIDAD
  if (needsPasswordReset) {
    return <ForceResetStack />;
  }

  // 3. ONBOARDING
  if (user && shouldShowOnboarding) {
    return (
      <ScreenOnboarding
        storageKey={onboardingStorageKey}
        onFinish={() => setShouldShowOnboarding(false)}
      />
    );
  }

  // 4. NAVEGACIÓN NORMAL
  return user ? <AppStack /> : <AuthStack />;
}

// 🔐 Bóveda Infranqueable (Fondo oscuro por defecto agregado)
function ForceResetStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false, 
        cardStyle: { backgroundColor: '#0c0e10' } 
      }}
    >
      <Stack.Screen 
        name="ResetPassword" 
        component={ResetPasswordScreen}
        options={{
          headerShown: true,
          title: 'Cambiar Contraseña',
          headerStyle: { backgroundColor: '#111416', borderBottomColor: '#24282c', borderBottomWidth: 1, shadowColor: 'transparent' },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff', fontFamily: 'Lexend_700Bold' },
          headerLeft: () => null, 
          gestureEnabled: false, 
        }}
      />
    </Stack.Navigator>
  );
}

// 🔐 Flujo de Autenticación (Fondo oscuro por defecto agregado)
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#0c0e10' } }}>
      <Stack.Screen name="Login" component={ScreenLogin} />
      <Stack.Screen name="Register" component={ScreenSignUp} />
    </Stack.Navigator>
  );
}

// 📱 Stack Principal de la Aplicación
function AppStack() {
  return (
    <Stack.Navigator
      initialRouteName="Tabs"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0c0e10' }, // Evita parpadeos blancos globales
      }}
    >
      <Stack.Screen name="Tabs" component={AppTabs} />
      
      <Stack.Screen 
        name="ResetPasswordNormal" 
        component={ResetPasswordScreen} 
        options={{
          headerShown: true,
          title: 'Cambiar Contraseña',
          headerStyle: { backgroundColor: '#111416', borderBottomColor: '#24282c', borderBottomWidth: 1 },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff', fontFamily: 'Lexend_700Bold' },
        }}
      />
      
      <Stack.Screen
        name="Editar Perfil"
        component={ScreenEditProfile}
        options={{
          headerShown: true,
          title: 'Editar Perfil',
          headerStyle: { backgroundColor: '#111416', borderBottomColor: '#24282c', borderBottomWidth: 1 },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff', fontFamily: 'Lexend_700Bold' },
        }}
      />
      <Stack.Screen name="ScreenCalculator" component={ScreenCalculator} />
    </Stack.Navigator>
  );
}

// 📊 Menú de Pestañas Inferiores Responsivo
function AppTabs() {
  const insets = useSafeAreaInsets();
  // Ajuste perfecto responsivo para que no quede volando muy arriba en pantallas sin notch
  const tabBarBottom = insets.bottom > 0 ? insets.bottom : 12;
  const { t } = useTranslation(); 
  const { user } = useContext(AuthContext);

  const rawRole = user?.profile?.rol || 'user';
  const userRole = rawRole.toLowerCase().trim(); 
  const isAdminOrTester = userRole === 'admin' || userRole === 'tester';

  const tabScreens = [
    { name: "HOME", component: ScreenHome, label: t("tab_home", "HOME"), icon: "view-dashboard" },
    { name: "LIBRARY", component: StackExercises, label: t("tab_library", "LIBRARY"), icon: "dumbbell" },
    { name: "PROGRESS", component: ScreenHistory, label: t("tab_progress", "PROGRESS"), icon: "chart-timeline-variant" },
    { name: "GYMS", component: ScreenGym, label: t("tab_gyms", "GYMS"), icon: "map-marker-radius" },
    { name: "PROFILE", component: PerfilHome, label: t("tab_profile", "PROFILE"), icon: "account" },
  ];

  if (isAdminOrTester) {
    tabScreens.push({ 
      name: "ADMIN", 
      component: ScreenAdmin, 
      label: t("tab_admin", "PANEL"), 
      icon: "shield-account",
      activeColor: "#ff716c"
    });
  }

  return (
    <Tab.Navigator
      screenOptions={{
        ...styles.nav,
        tabBarStyle: [styles.nav.tabBarStyle, { bottom: tabBarBottom }],
        // Evita que las vistas de las pestañas tengan fondo blanco por debajo
        sceneContainerStyle: { backgroundColor: '#0c0e10' } 
      }}
    >
      {tabScreens.map((screen) => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={{
            tabBarLabel: screen.label,
            tabBarIcon: ({ color, focused }) => (
              <View style={tabStyle(focused)}>
                <MaterialCommunityIcons 
                  name={screen.icon} 
                  color={focused && screen.activeColor ? screen.activeColor : color} 
                  size={24}
                />
              </View>
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

// 🏋️ Sub-Stack de Ejercicios (Corregido el color de fondo para eliminar la pestaña blanca)
function StackExercises() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#0c0e10' } // ¡MATA EL FONDO BLANCO EN DETAIL LIBRARY!
      }}
    >
      <Stack.Screen name="Library" component={ScreenLibrary} />
      <Stack.Screen 
        name="Más Detalles" 
        component={DetailLibrary} 
        options={{ 
          headerShown: true,
          headerStyle: { backgroundColor: '#111416', borderBottomColor: '#24282c', borderBottomWidth: 1 },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff', fontFamily: 'Lexend_700Bold' },
        }} 
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: '#0c0e10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nav: {
    headerShown: false,
    tabBarStyle: {
      backgroundColor: "#111416", // Un gris muy oscuro texturizado en lugar de negro puro para que contraste con el fondo
      borderTopWidth: 0,
      position: "absolute",
      left: 16,
      right: 16,
      height: 64,
      paddingBottom: 8,
      paddingTop: 8,
      borderRadius: 20,
      elevation: 5, // Sombra sutil en Android
      shadowColor: "#000", // Sombra sutil en iOS
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
    tabBarActiveTintColor: "#88adff",
    tabBarInactiveTintColor: "#aaabad",
    tabBarLabelStyle: {
      fontFamily: "Manrope_600SemiBold",
      fontSize: 9,
      letterSpacing: 0.5,
      marginTop: 2,
    },
  },
});

const tabStyle = (focused) => ({
  backgroundColor: focused ? "#1d2226" : "transparent",
  paddingVertical: 6,
  paddingHorizontal: 14,
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center",
});