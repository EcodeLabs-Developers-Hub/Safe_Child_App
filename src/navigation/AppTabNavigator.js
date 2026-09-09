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
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

export const AppTabNavigator = () => {
  const { userProfile } = useAuth();
  const userRole = userProfile?.role || 'parent';
  const visibleTabs = {
    admin: ['HomeTab', 'StudentsTab', 'PickupsTab', 'AttendanceTab', 'OperationsTab', 'SecurityTab', 'ProfileTab'],
    teacher: ['HomeTab', 'StudentsTab', 'PickupsTab', 'AttendanceTab', 'OperationsTab', 'ProfileTab'],
    parent: ['HomeTab', 'StudentsTab', 'PickupsTab', 'ProfileTab'],
    security: ['HomeTab', 'SecurityTab', 'ProfileTab'],
    pickup_verifier: ['HomeTab', 'PickupsTab', 'ProfileTab'],
  }[userRole] || ['HomeTab', 'ProfileTab'];

  const isTabVisible = (tabName) => visibleTabs.includes(tabName);

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
        options={{ tabBarLabel: 'Students', tabBarButton: isTabVisible('StudentsTab') ? undefined : () => null }}
      />
      <Tab.Screen 
        name="PickupsTab" 
        component={PickupsScreen} 
        options={{ tabBarLabel: 'Pickups', tabBarButton: isTabVisible('PickupsTab') ? undefined : () => null }}
      />
      <Tab.Screen 
        name="AttendanceTab" 
        component={AttendanceScreen} 
        options={{ tabBarLabel: 'Attendance', tabBarButton: isTabVisible('AttendanceTab') ? undefined : () => null }}
      />
      <Tab.Screen 
        name="OperationsTab" 
        component={CampusOperationsScreen} 
        options={{ tabBarLabel: 'Ops', tabBarButton: isTabVisible('OperationsTab') ? undefined : () => null }}
      />
      <Tab.Screen 
        name="SecurityTab" 
        component={SecurityScreen} 
        options={{ tabBarLabel: 'Security', tabBarButton: isTabVisible('SecurityTab') ? undefined : () => null }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'Profile', tabBarButton: isTabVisible('ProfileTab') ? undefined : () => null }}
      />
    </Tab.Navigator>
  );
};
