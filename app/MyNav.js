import { Ionicons } from '@expo/vector-icons';
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

  if (needsPasswordReset) {
    return <ForceResetStack />;
  }

  if (user && shouldShowOnboarding) {
    return (
      <ScreenOnboarding
        storageKey={onboardingStorageKey}
        onFinish={() => setShouldShowOnboarding(false)}
      />
    );
  }

  return user ? <AppStack /> : <AuthStack />;
}

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

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#0c0e10' } }}>
      <Stack.Screen name="Login" component={ScreenLogin} />
      <Stack.Screen name="Register" component={ScreenSignUp} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      initialRouteName="Tabs"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0c0e10' }, 
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

function AppTabs() {
  const insets = useSafeAreaInsets();
  const tabBarBottom = insets.bottom > 0 ? insets.bottom : 12;
  const { t } = useTranslation(); 
  const { user } = useContext(AuthContext);

  const rawRole = user?.profile?.rol || 'user';
  const userRole = rawRole.toLowerCase().trim(); 
  const isAdmin = (userRole === 'admin');

  // Lógica estricta: Si es admin, solo carga 1 pestaña. Si es user/tester, carga las 5.
  let tabScreens = [];

  if (isAdmin) {
    tabScreens = [
      { 
        name: "ADMIN", 
        component: ScreenAdmin, 
        label: t("tab_admin", "PANEL"), 
        icon: "shield-outline", 
        activeColor: "#ff716c"
      }
    ];
  } else {
    tabScreens = [
      { name: "HOME", component: ScreenHome, label: t("tab_home", "HOME"), icon: "home-outline" },
      { name: "LIBRARY", component: StackExercises, label: t("tab_library", "LIBRARY"), icon: "library-outline" },
      { name: "PROGRESS", component: ScreenHistory, label: t("tab_progress", "PROGRESS"), icon: "stats-chart-outline" },
      { name: "GYMS", component: ScreenGym, label: t("tab_gyms", "GYMS"), icon: "map-outline" },
      { name: "PROFILE", component: PerfilHome, label: t("tab_profile", "PROFILE"), icon: "person-outline" },
    ];
  }

  return (
    <Tab.Navigator
      screenOptions={{
        ...styles.nav,
        tabBarStyle: [styles.nav.tabBarStyle, { bottom: tabBarBottom }],
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
            tabBarIcon: ({ color, focused }) => {
              const iconColor = (focused && screen.activeColor) ? screen.activeColor : color;
              
              return <Ionicons name={screen.icon} color={iconColor} size={24} />;
            },
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

function StackExercises() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#0c0e10' } 
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
      backgroundColor: "#111416", 
      borderTopWidth: 0,
      position: "absolute",
      left: 16,
      right: 16,
      height: 72,
      paddingBottom: 10,
      paddingTop: 10,
      borderRadius: 20,
      elevation: 5, 
      shadowColor: "#000", 
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
