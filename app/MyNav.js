import AsyncStorage from "@react-native-async-storage/async-storage";
import AwesomeIcon from "@react-native-vector-icons/material-design-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import * as Linking from "expo-linking";
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
  const { user, loading: authLoading } = useContext(AuthContext);
  
  // ⚡ Estado para saber a dónde mandarte al iniciar sesión desde el correo
  const [targetAppRoute, setTargetAppRoute] = useState("Tabs"); 
  
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [onboardingStorageKey, setOnboardingStorageKey] = useState(null);

  // Escuchar Deep Links para redirigir a Reset Password
  useEffect(() => {
    let mounted = true;

    const handleUrl = (url) => {
      if (!mounted || !url) return;
      const parsed = Linking.parse(url);
      const path = parsed.path || "";
      
      // Si el enlace de recuperación trae al usuario, configuramos la ruta objetivo
      if (path.includes("reset-password")) {
        setTargetAppRoute("ResetPassword");
      }
    };

    Linking.getInitialURL().then(handleUrl);

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleUrl(url);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

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

  if (authLoading || (user && !onboardingReady)) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#88adff" />
      </View>
    );
  }

  if (user && shouldShowOnboarding) {
    return (
      <ScreenOnboarding
        storageKey={onboardingStorageKey}
        onFinish={() => setShouldShowOnboarding(false)}
      />
    );
  }

  // 🔐 Flujo dinámico: Pasa la ruta objetivo al AppStack
  return user ? <AppStack initialRoute={targetAppRoute} /> : <AuthStack />;
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
function AppStack({ initialRoute = "Tabs" }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0c0e10' },
      }}
    >
      <Stack.Screen name="Tabs" component={AppTabs} />
      
      {/* Pantalla de Reseteo (Ahora vive en el área segura) */}
      <Stack.Screen 
        name="ResetPassword" 
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

// 📊 Menú de Pestañas Inferiores
function AppTabs() {
  const insets = useSafeAreaInsets();
  const tabBarBottom = Math.max(insets.bottom, 8) + 8;
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
                <AwesomeIcon 
                  name={screen.icon} 
                  color={focused && screen.activeColor ? screen.activeColor : color} 
                />
              </View>
            ),
          }}
        />
      ))}
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
  loadingScreen: {
    flex: 1,
    backgroundColor: '#0c0e10',
    justifyContent: 'center',
    alignItems: 'center',
  },
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