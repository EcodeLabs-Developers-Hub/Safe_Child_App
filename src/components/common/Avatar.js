import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../theme/theme';

const DEFAULT_LOGO = require('../../../assets/logo.png');

export const Avatar = ({ 
  uri, 
  size = 70, 
  showEditBadge = false, 
  onPressBadge = null,
  onPress = null,
  style 
}) => {
  const badgeSize = Math.max(24, size * 0.32);

  const content = (
    <View style={[{ width: size, height: size, position: 'relative' }, style]}>
      <Image
        source={uri ? { uri } : DEFAULT_LOGO}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 }
        ]}
        resizeMode="cover"
      />
      {showEditBadge && (
        <TouchableOpacity 
          style={[
            styles.badge, 
            { 
              width: badgeSize, 
              height: badgeSize, 
              borderRadius: badgeSize / 2,
              bottom: 0,
              right: 0
            }
          ]}
          onPress={onPressBadge || onPress}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={badgeSize * 0.55} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (onPress && !showEditBadge) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: COLORS.safetyBlueLight,
    borderWidth: 2,
    borderColor: COLORS.white,
    ...SHADOWS.small,
  },
  badge: {
    position: 'absolute',
    backgroundColor: COLORS.safetyBlue,
    borderWidth: 2,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  }
});
