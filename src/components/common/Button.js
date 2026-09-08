import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

export const Button = ({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger'
  loading = false,
  disabled = false,
  iconName = null,
  style,
  textStyle,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return COLORS.surfaceBorder;
    switch (variant) {
      case 'secondary':
        return COLORS.safetyBlueLight;
      case 'outline':
        return 'transparent';
      case 'danger':
        return COLORS.danger;
      case 'primary':
      default:
        return COLORS.safetyBlue;
    }
  };

  const getTextColor = () => {
    if (disabled) return COLORS.textMuted;
    switch (variant) {
      case 'secondary':
        return COLORS.safetyBlue;
      case 'outline':
        return COLORS.safetyBlue;
      case 'danger':
      case 'primary':
      default:
        return COLORS.white;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && { borderWidth: 1.5, borderColor: COLORS.safetyBlue },
        variant === 'primary' && SHADOWS.small,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {iconName && (
            <Ionicons
              name={iconName}
              size={18}
              color={getTextColor()}
              style={{ marginRight: SPACING.xs + 2 }}
            />
          )}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
});
