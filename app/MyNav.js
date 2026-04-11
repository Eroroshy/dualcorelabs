import AwesomeIcon from "@react-native-vector-icons/material-design-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useContext } from "react";
import { StyleSheet, View } from "react-native";

import { AuthContext } from "../app/context/AuthContext";

// SCREENS
import ScreenCalculator from "./tabs/calculator/ScreenCalculator";
import ScreenHome from "./tabs/home/ScreenHome";
import DetailLibrary from "./tabs/library/DetailLibrary";
import ScreenLibrary from "./tabs/library/ScreenLibrary";

import ScreenEditProfile from "./tabs/account/ScreenEditProfile";
import ScreenLogin from "./tabs/account/ScreenLogin";
import ScreenSignUp from "./tabs/account/ScreenSignUp";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export function MyNavigation() {
  const { user } = useContext(AuthContext);

  return user ? <AppStack /> : <AuthStack />;
}

//
// 🔐 AUTH STACK (NO LOGUEADO)
//
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={ScreenLogin} />
      <Stack.Screen name="Register" component={ScreenSignUp} />
    </Stack.Navigator>
  );
}

//
// 📱 STACK PRINCIPAL (LOGUEADO)
//
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={AppTabs} />
      <Stack.Screen name="EditProfile" component={ScreenEditProfile} />
      <Stack.Screen name="Más Detalles" component={DetailLibrary} />
    </Stack.Navigator>
  );
}

//
// 📊 TABS
//
function AppTabs() {
  return (
    <Tab.Navigator screenOptions={styles.nav}>

      <Tab.Screen
        name="PROFILE"
        component={ScreenHome}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={tabStyle(focused)}>
              <AwesomeIcon name="account" color={color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="LIBRARY"
        component={StackExercises}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={tabStyle(focused)}>
              <AwesomeIcon name="dumbbell" color={color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="PR CALC"
        component={ScreenCalculator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={tabStyle(focused)}>
              <AwesomeIcon name="calculator-variant-outline" color={color} />
            </View>
          ),
        }}
      />

    </Tab.Navigator>
  );
}

//
// 📚 STACK LIBRARY
//
function StackExercises() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Library" component={ScreenLibrary} />
      <Stack.Screen name="Más Detalles" component={DetailLibrary} />
    </Stack.Navigator>
  );
}

//
// 🎨 ESTILOS
//
const styles = StyleSheet.create({
  nav: {
    headerShown: false,
    tabBarStyle: {
      backgroundColor: "#0c0e10",
      borderTopWidth: 0,
      height: 80,
      paddingBottom: 10,
      paddingTop: 10,
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