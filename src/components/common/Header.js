import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from './Avatar';
import { COLORS, SPACING, SHADOWS } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const BRAND_LOGO = require('../../../assets/logo.png');

export const Header = ({ title = 'Safe Child', subtitle, navigation }) => {
  const { userProfile } = useAuth();

  const handleAvatarPress = () => {
    if (navigation) {
      navigation.navigate('ProfileTab');
    }
  };

  const roleText = userProfile?.role ? userProfile.role.replace('_', ' ').toUpperCase() : 'PARENT';

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <Image source={BRAND_LOGO} style={styles.logoMark} resizeMode="contain" />
        <View style={styles.titleContainer}>
          <Text style={styles.brandTitle}>{title}</Text>
          {subtitle ? (
            <Text style={styles.brandSubtitle}>{subtitle}</Text>
          ) : (
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{roleText}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {userProfile && (
        <View style={styles.profileSection}>
          <Avatar 
            uri={userProfile.photoURL} 
            size={42} 
            onPress={handleAvatarPress}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryNavy,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    ...SHADOWS.medium,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    marginRight: SPACING.sm + 2,
  },
  titleContainer: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  brandSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  profileSection: {
    marginLeft: SPACING.sm,
  }
});
