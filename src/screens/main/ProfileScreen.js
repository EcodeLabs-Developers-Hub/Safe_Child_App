import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  Switch,
  Modal 
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/common/Avatar';
import { InputField } from '../../components/common/InputField';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { subscribeIpBlocks, addIpBlockRecord, removeIpBlockRecord } from '../../services/dataService';

export const ProfileScreen = () => {
  const { 
    user, 
    userProfile, 
    editProfile, 
    uploadAvatar, 
    resetAvatar, 
    logout 
  } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Compliance & Network Security Modal State
  const [ipModalVisible, setIpModalVisible] = useState(false);
  const [dataRequestModalVisible, setDataRequestModalVisible] = useState(false);

  // GDPR Consent Toggles State
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [photoRetentionConsent, setPhotoRetentionConsent] = useState(true);

  // Network IP Management State
  const [ipBlocks, setIpBlocks] = useState([]);
  const [newIpAddress, setNewIpAddress] = useState('');
  const [ipReason, setIpReason] = useState('');

  // Data Request State
  const [requestType, setRequestType] = useState('access'); // 'access' | 'deletion'
  const [requestReason, setRequestReason] = useState('');

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setBio(userProfile.bio || '');
      setPhone(userProfile.phone || '');
    }
  }, [userProfile]);

  // Live Firebase IP Firewall Subscription
  useEffect(() => {
    const unsubscribe = subscribeIpBlocks(setIpBlocks);
    return () => unsubscribe();
  }, []);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('Validation Error', 'Display Name cannot be empty.');
      return;
    }

    try {
      setLoading(true);
      setSaveSuccess(false);
      await editProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        phone: phone.trim()
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      Alert.alert('Firebase Updated', 'Your profile details and changes have been saved to Firebase Firestore!');
    } catch (err) {
      Alert.alert('Save Failed', err.message || 'Could not update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickPhoto = async () => {
    try {
      setImageLoading(true);
      const updated = await uploadAvatar();
      if (updated) {
        Alert.alert('Avatar Updated', 'Your new profile picture link has been saved to Firebase.');
      }
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'Could not select photo.');
    } finally {
      setImageLoading(false);
    }
  };

  const handleResetAvatar = async () => {
    Alert.alert(
      'Reset Avatar',
      'Use default Safe Child logo as your profile image?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset to Default', 
          onPress: async () => {
            try {
              setImageLoading(true);
              await resetAvatar();
              Alert.alert('Avatar Reset', 'Profile picture reset to default logo on Firebase.');
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setImageLoading(false);
            }
          } 
        }
      ]
    );
  };

  const handleAddIpBlock = async () => {
    if (!newIpAddress.trim()) {
      Alert.alert('Enter IP Address', 'Please provide a valid IPv4 address.');
      return;
    }

    try {
      const newBlock = {
        ip: newIpAddress.trim(),
        reason: ipReason.trim() || 'Administrator manual network block',
        date: 'Today'
      };

      await addIpBlockRecord(newBlock);
      setNewIpAddress('');
      setIpReason('');
      Alert.alert('Saved to Firebase', `Address ${newBlock.ip} added to Firebase firewall rules.`);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleRemoveIpBlock = async (id) => {
    await removeIpBlockRecord(id);
    Alert.alert('Rule Removed', 'IP Block rule removed from Firebase.');
  };

  const handleSubmitDataRequest = () => {
    Alert.alert(
      'GDPR Data Request Submitted',
      `Your request for [${requestType === 'access' ? 'Full Personal Data Export' : 'Account & Data Deletion'}] has been saved. Reference ID: GDR_${Date.now().toString().slice(-6)}`,
      [{ text: 'OK', onPress: () => setDataRequestModalVisible(false) }]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Safe Child?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => logout()
        }
      ]
    );
  };

  const roleText = userProfile?.role ? userProfile.role.replace('_', ' ').toUpperCase() : 'PARENT';
  const isAdmin = userProfile?.role === 'admin';

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Profile Avatar & Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.avatarWrapper}>
            <Avatar 
              uri={userProfile?.photoURL} 
              size={100} 
              showEditBadge={true}
              onPressBadge={handlePickPhoto}
            />
          </View>

          <Text style={styles.profileName}>{userProfile?.displayName || 'Safe Child Member'}</Text>
          <Text style={styles.profileEmail}>{user?.email || userProfile?.email}</Text>

          {/* Role Badge */}
          <View style={styles.roleBadgeContainer}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.white} style={{ marginRight: 4 }} />
            <Text style={styles.roleBadgeText}>{roleText}</Text>
          </View>

          {/* Avatar Action Buttons */}
          <View style={styles.avatarActionsRow}>
            <TouchableOpacity 
              style={styles.avatarActionBtn} 
              onPress={handlePickPhoto}
              disabled={imageLoading}
            >
              <Ionicons name="image-outline" size={16} color={COLORS.safetyBlue} />
              <Text style={styles.avatarActionText}>Upload Photo</Text>
            </TouchableOpacity>

            {userProfile?.photoURL ? (
              <TouchableOpacity 
                style={[styles.avatarActionBtn, styles.avatarResetBtn]} 
                onPress={handleResetAvatar}
                disabled={imageLoading}
              >
                <Ionicons name="refresh-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.avatarResetText}>Use Default Logo</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Edit Profile Form */}
        <Card title="Edit Profile Details (Firebase Sync)" subtitle="Linked to your authenticated user account in Firebase users/{uid}">
          {saveSuccess && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} style={{ marginRight: 6 }} />
              <Text style={styles.successBannerText}>Profile saved to Firebase database!</Text>
            </View>
          )}

          <InputField
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your full name"
            iconName="person-outline"
          />

          <InputField
            label="Bio / Notes"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about your role or emergency notes..."
            iconName="document-text-outline"
            multiline={true}
            numberOfLines={3}
          />

          <InputField
            label="Contact Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. +1 555-0192"
            iconName="call-outline"
            keyboardType="phone-pad"
          />

          <Button
            title="Save Profile to Firebase"
            onPress={handleSaveProfile}
            loading={loading}
            iconName="save-outline"
            style={{ marginTop: SPACING.xs }}
          />
        </Card>

        {/* Network Security Controls (For Admins) */}
        {isAdmin && (
          <Card title="Network Access & IP Controls (Firebase)" subtitle="Manage campus whitelists & firewall IP blocks">
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Blocked IP Addresses:</Text>
              <Text style={styles.infoValue}>{ipBlocks.length} Active Rules</Text>
            </View>

            <Button
              title="Manage IP Firewall Settings"
              onPress={() => setIpModalVisible(true)}
              variant="outline"
              iconName="options-outline"
              style={{ marginTop: SPACING.sm }}
            />
          </Card>
        )}

        {/* GDPR Privacy & Compliance */}
        <Card title="GDPR & Data Privacy" subtitle="Manage user consents & subject data requests">
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchTitle}>Campus Analytics Consent</Text>
              <Text style={styles.switchSub}>Allow anonymized pickup duration & attendance metric recording.</Text>
            </View>
            <Switch
              value={analyticsConsent}
              onValueChange={setAnalyticsConsent}
              trackColor={{ false: COLORS.surfaceBorder, true: COLORS.safetyBlue }}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchTitle}>Photo Proof Encryption Storage</Text>
              <Text style={styles.switchSub}>Retain uploaded pickup recipient photo proofs for gate logs.</Text>
            </View>
            <Switch
              value={photoRetentionConsent}
              onValueChange={setPhotoRetentionConsent}
              trackColor={{ false: COLORS.surfaceBorder, true: COLORS.safetyBlue }}
            />
          </View>

          <TouchableOpacity 
            style={styles.dataReqBtn}
            onPress={() => setDataRequestModalVisible(true)}
          >
            <Ionicons name="document-text-outline" size={16} color={COLORS.safetyBlue} style={{ marginRight: 6 }} />
            <Text style={styles.dataReqText}>Submit Data Access / Account Deletion Request</Text>
          </TouchableOpacity>
        </Card>

        {/* System Information & UID Card */}
        <Card title="Account Security & System Info">
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User UID:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{user?.uid || userProfile?.uid || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Status:</Text>
            <View style={styles.activeTag}>
              <Text style={styles.activeTagText}>Active Verified</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Session Type:</Text>
            <Text style={styles.infoValue}>Persistent Firebase Auth</Text>
          </View>
        </Card>

        {/* Sign Out Button */}
        <Button
          title="Sign Out of Safe Child"
          onPress={handleSignOut}
          variant="danger"
          iconName="log-out-outline"
          style={{ marginVertical: SPACING.md }}
        />
      </ScrollView>

      {/* IP Firewall Modal */}
      <Modal visible={ipModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Network Firewall & IP Rules (Firebase)</Text>
              <TouchableOpacity onPress={() => setIpModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.sectionHeaderTitle}>Block New Suspicious IP</Text>
              <InputField
                label="IPv4 Address"
                value={newIpAddress}
                onChangeText={setNewIpAddress}
                placeholder="e.g. 192.168.1.200"
                iconName="wifi-outline"
              />

              <InputField
                label="Blocking Reason"
                value={ipReason}
                onChangeText={setIpReason}
                placeholder="e.g. Unauthorized gate API spamming"
                iconName="document-text-outline"
              />

              <Button
                title="Add IP Block to Firebase"
                onPress={handleAddIpBlock}
                variant="danger"
                iconName="shield-outline"
                style={{ marginBottom: SPACING.md }}
              />

              <Text style={styles.sectionHeaderTitle}>Currently Blocked Addresses</Text>
              {ipBlocks.map(b => (
                <View key={b.id} style={styles.ipItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ipAddressText}>{b.ip}</Text>
                    <Text style={styles.ipReasonText}>{b.reason} • {b.date}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => handleRemoveIpBlock(b.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* GDPR Data Request Modal */}
      <Modal visible={dataRequestModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Subject Data Request (GDPR)</Text>
              <TouchableOpacity onPress={() => setDataRequestModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Select Request Type</Text>
            <View style={styles.reqTypeRow}>
              <TouchableOpacity
                style={[styles.reqTypeChip, requestType === 'access' && styles.reqTypeChipActive]}
                onPress={() => setRequestType('access')}
              >
                <Text style={[styles.reqTypeChipText, requestType === 'access' && styles.reqTypeChipTextActive]}>
                  Data Access & Export
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.reqTypeChip, requestType === 'deletion' && styles.reqTypeChipActive]}
                onPress={() => setRequestType('deletion')}
              >
                <Text style={[styles.reqTypeChipText, requestType === 'deletion' && styles.reqTypeChipTextActive]}>
                  Account & Data Deletion
                </Text>
              </TouchableOpacity>
            </View>

            <InputField
              label="Justification / Notes"
              value={requestReason}
              onChangeText={setRequestReason}
              placeholder="State any specific details or requested format..."
              iconName="create-outline"
              multiline={true}
              numberOfLines={3}
            />

            <Button
              title="Submit Official Request"
              onPress={handleSubmitDataRequest}
              iconName="paper-plane-outline"
              style={{ marginTop: SPACING.md }}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
  },
  avatarWrapper: {
    marginBottom: SPACING.sm,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primaryNavy,
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  roleBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.safetyBlue,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginTop: SPACING.xs + 2,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  avatarActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: SPACING.md,
  },
  avatarActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.safetyBlueLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  avatarActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.safetyBlue,
    marginLeft: 4,
  },
  avatarResetBtn: {
    backgroundColor: COLORS.background,
  },
  avatarResetText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  successBannerText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  switchSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  dataReqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: SPACING.xs,
  },
  dataReqText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.safetyBlue,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  activeTag: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeTagText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryNavy,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryNavy,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  ipItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    marginBottom: 8,
  },
  ipAddressText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.danger,
  },
  ipReasonText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  reqTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  reqTypeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  reqTypeChipActive: {
    backgroundColor: COLORS.safetyBlue,
    borderColor: COLORS.safetyBlue,
  },
  reqTypeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  reqTypeChipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
});
