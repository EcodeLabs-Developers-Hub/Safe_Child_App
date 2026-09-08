export const COLORS = {
  primaryNavy: '#002045',
  safetyBlue: '#1960a3',
  safetyBlueLight: '#e6f0fa',
  accentBlue: '#2563eb',
  background: '#f8f9ff',
  surface: '#ffffff',
  surfaceBorder: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  white: '#ffffff',
  
  // Status Colors
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  danger: '#ba1a1a',
  dangerLight: '#fee2e2',
  info: '#0284c7',
  infoLight: '#e0f2fe',
  
  // Role Badges
  roleAdmin: '#7c3aed',
  roleTeacher: '#059669',
  roleParent: '#1960a3',
  roleVerifier: '#d97706',
  roleSecurity: '#dc2626',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#002045',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#002045',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#002045',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const TYPOGRAPHY = {
  titleLarge: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primaryNavy,
    letterSpacing: -0.5,
  },
  titleMedium: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primaryNavy,
  },
  titleSmall: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
};
