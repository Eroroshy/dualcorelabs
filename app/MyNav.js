import FontAwesome from '@expo/vector-icons/FontAwesome';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import ScreenHome from './tabs/home/ScreenHome';
import ScreenAbout from './tabs/home/about/ScreenAbout';


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export function MyNavigation () { 
    return ( 
        <Tab.Navigator>
            <Tab.Screen 
                name="Home" 
                component={ScreenHome}
                options={{ 
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                    <FontAwesome name="home" color={color} size={size} />
                )  
                 }}
            />

            <Tab.Screen
                name="about"
                component={ScreenAbout}
                options={{ 
                    tabBarIcon: ({ color, size }) => (
                    <FontAwesome name="home" color={color} size={size} />
                )  
                 }}
            />


        </Tab.Navigator>
    )
}
