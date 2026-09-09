import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { InputField } from '../../components/common/InputField';
import { Button } from '../../components/common/Button';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const LOGO_IMAGE = require('../../../assets/logo.png');

export const LoginScreen = ({ navigation }) => {
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email.trim() || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert('Forgot Password', 'Please type your registered email address in the email field above, then tap Forgot Password.');
      return;
    }

    Alert.alert(
      'Reset Password',
      `Send password reset link to ${email.trim()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Link', 
          onPress: async () => {
            try {
              await resetPassword(email.trim());
              Alert.alert('Password Reset Sent', 'Check your email inbox for instructions to reset your password.');
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          } 
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.headerBox}>
          <Image source={LOGO_IMAGE} style={styles.logo} resizeMode="contain" />
          <Text style={styles.appTitle}>Safe Child</Text>
          <Text style={styles.appSubtitle}>Campus Safety & Pickup Verification System</Text>
        </View>

        {/* Form Container */}
        <View style={styles.formCard}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.instructionText}>Sign in to your Safe Child account</Text>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="warning" size={18} color={COLORS.danger} style={{ marginRight: 8 }} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          <InputField
            label="Email Address"
            value={email}
            onChangeText={(txt) => { setEmail(txt); setErrorMessage(''); }}
            placeholder="e.g. parent@example.com"
            iconName="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <InputField
            label="Password"
            value={password}
            onChangeText={(txt) => { setPassword(txt); setErrorMessage(''); }}
            placeholder="Enter your password"
            iconName="lock-closed-outline"
            secureTextEntry={true}
          />

          <TouchableOpacity style={styles.forgotPassBtn} onPress={handleForgotPassword}>
            <Text style={styles.forgotPassText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            iconName="log-in-outline"
            style={styles.signInButton}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.noAccountText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryNavy,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 18,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.white,
    padding: 4,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#93c5fd',
    marginTop: 2,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.large,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primaryNavy,
  },
  instructionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerLight,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: '600',
  },
  quickFillLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickFillScroll: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  quickFillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.safetyBlueLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  quickFillChipActive: {
    backgroundColor: COLORS.safetyBlue,
    borderColor: COLORS.safetyBlue,
  },
  quickFillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.safetyBlue,
  },
  quickFillTextActive: {
    color: COLORS.white,
  },
  forgotPassBtn: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.md,
  },
  forgotPassText: {
    fontSize: 13,
    color: COLORS.safetyBlue,
    fontWeight: '600',
  },
  signInButton: {
    marginTop: SPACING.xs,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginHorizontal: SPACING.sm,
    fontWeight: '600',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAccountText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 6,
  },
  registerLink: {
    fontSize: 14,
    color: COLORS.safetyBlue,
    fontWeight: '700',
  },
});
