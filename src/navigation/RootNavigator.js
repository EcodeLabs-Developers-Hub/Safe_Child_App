import React from 'react';
import { View, ActivityIndicator, StyleSheet, Image, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { AppTabNavigator } from './AppTabNavigator';
import { COLORS } from '../theme/theme';

const LOGO = require('../../assets/logo.png');

export const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={LOGO} style={styles.splashLogo} resizeMode="contain" />
        <Text style={styles.splashTitle}>Safe Child</Text>
        <ActivityIndicator size="large" color={COLORS.white} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryNavy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    padding: 4,
  },
  splashTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 12,
    letterSpacing: 0.5,
  },
});
