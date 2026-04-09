import AwesomeIcon from '@react-native-vector-icons/material-design-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import ScreenCalculator from './tabs/calculator/ScreenCalculator';
import ScreenHome from './tabs/home/ScreenHome';
import ScreenLibrary from './tabs/library/ScreenLibrary';
import ScreenRoutine from './tabs/routine/ScreenRoutine';

const Tab = createBottomTabNavigator();

export function MyNavigation() {
  return (
    <Tab.Navigator
      screenOptions={{
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
      }}
    >
      <Tab.Screen
        name="PROFILE"
        component={ScreenHome}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                backgroundColor: focused ? "#171a1c" : "transparent",
                padding: 6,
                borderRadius: 10,
              }}
            >
              <AwesomeIcon name="account" color={color}  />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="LIBRARY"
        component={ScreenLibrary}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                backgroundColor: focused ? "#171a1c" : "transparent",
                padding: 6,
                borderRadius: 10,
              }}
            >
              <AwesomeIcon name="dumbbell" color={color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="PR CALC"
        component={ScreenCalculator}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                backgroundColor: focused ? "#171a1c" : "transparent",
                padding: 6,
                borderRadius: 10,
              }}
            >
              <AwesomeIcon name="calculator-variant-outline" color={color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="LOG"
        component={ScreenRoutine}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                backgroundColor: focused ? "#171a1c" : "transparent",
                padding: 6,
                borderRadius: 10,
              }}
            >
              <AwesomeIcon name="notebook-check" color={color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );}