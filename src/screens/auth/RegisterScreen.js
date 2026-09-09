import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { InputField } from '../../components/common/InputField';
import { Button } from '../../components/common/Button';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const ROLES = [
  { id: 'parent', label: 'Parent / Guardian', icon: 'people-outline' },
  { id: 'teacher', label: 'Teacher', icon: 'school-outline' },
  { id: 'pickup_verifier', label: 'Pickup Verifier', icon: 'checkmark-circle-outline' },
  { id: 'security', label: 'Security Team', icon: 'shield-checkmark-outline' }
];

export const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('parent');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    setErrorMessage('');

    if (!displayName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter a password.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await register(email, password, displayName, 'parent');
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          <Text style={styles.backText}>Back to Sign In</Text>
        </TouchableOpacity>

        <View style={styles.formCard}>
          <Text style={styles.title}>Parent & Guardian Sign Up</Text>
          <Text style={styles.subtitle}>Register for Safe Child parent portal</Text>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={COLORS.danger} style={{ marginRight: 8 }} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          <InputField
            label="Full Name"
            value={displayName}
            onChangeText={(txt) => { setDisplayName(txt); setErrorMessage(''); }}
            placeholder="e.g. Eleanor Vance"
            iconName="person-outline"
            autoCapitalize="words"
          />

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
            placeholder="At least 6 characters"
            iconName="lock-closed-outline"
            secureTextEntry={true}
          />

          <InputField
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(txt) => { setConfirmPassword(txt); setErrorMessage(''); }}
            placeholder="Re-enter password"
            iconName="checkmark-done-outline"
            secureTextEntry={true}
          />

          {/* Account Role Information Banner */}
          <View style={styles.roleNoticeBox}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.safetyBlue} style={{ marginRight: 8 }} />
            <Text style={styles.roleNoticeText}>
              Self-registered accounts are created as <Text style={{ fontWeight: '700' }}>Parent / Guardian</Text>. Specialized staff access (Teacher, Security, Verifier, Admin) is assigned by Campus Administrators.
            </Text>
          </View>

          <Button
            title="Create Parent Account"
            onPress={handleRegister}
            loading={loading}
            iconName="person-add-outline"
            style={{ marginTop: SPACING.md }}
          />
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
    padding: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  backText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.large,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primaryNavy,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
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
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.xs,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  roleNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.safetyBlueLight,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  roleNoticeText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primaryNavy,
    lineHeight: 16,
  },
});
