import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/main/HomeScreen';
import { StudentRegistryScreen } from '../screens/main/StudentRegistryScreen';
import { PickupsScreen } from '../screens/main/PickupsScreen';
import { AttendanceScreen } from '../screens/main/AttendanceScreen';
import { CampusOperationsScreen } from '../screens/main/CampusOperationsScreen';
import { SecurityScreen } from '../screens/main/SecurityScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { Header } from '../components/common/Header';
import { COLORS } from '../theme/theme';

const Tab = createBottomTabNavigator();

export const AppTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        header: () => <Header navigation={navigation} />,
        tabBarActiveTintColor: COLORS.safetyBlue,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.surfaceBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'StudentsTab') {
            iconName = focused ? 'school' : 'school-outline';
          } else if (route.name === 'PickupsTab') {
            iconName = focused ? 'car' : 'car-outline';
          } else if (route.name === 'AttendanceTab') {
            iconName = focused ? 'clipboard' : 'clipboard-outline';
          } else if (route.name === 'OperationsTab') {
            iconName = focused ? 'bus' : 'bus-outline';
          } else if (route.name === 'SecurityTab') {
            iconName = focused ? 'shield-checkmark' : 'shield-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size || 20} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ tabBarLabel: 'Home' }} 
      />
      <Tab.Screen 
        name="StudentsTab" 
        component={StudentRegistryScreen} 
        options={{ tabBarLabel: 'Students' }} 
      />
      <Tab.Screen 
        name="PickupsTab" 
        component={PickupsScreen} 
        options={{ tabBarLabel: 'Pickups' }} 
      />
      <Tab.Screen 
        name="AttendanceTab" 
        component={AttendanceScreen} 
        options={{ tabBarLabel: 'Attendance' }} 
      />
      <Tab.Screen 
        name="OperationsTab" 
        component={CampusOperationsScreen} 
        options={{ tabBarLabel: 'Ops' }} 
      />
      <Tab.Screen 
        name="SecurityTab" 
        component={SecurityScreen} 
        options={{ tabBarLabel: 'Security' }} 
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'Profile' }} 
      />
    </Tab.Navigator>
  );
};
