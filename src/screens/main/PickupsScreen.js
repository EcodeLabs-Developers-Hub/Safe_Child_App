import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert, 
  Modal 
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { InputField } from '../../components/common/InputField';
import { Button } from '../../components/common/Button';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { 
  subscribePickups, 
  addPickupRequestRecord, 
  updatePickupStatusRecord,
  subscribeAuthorizedContacts,
  addAuthorizedContactRecord,
  subscribeStudents,
  getConnectedChildren
} from '../../services/dataService';

export const PickupsScreen = ({ route }) => {
  const { userProfile } = useAuth();
  const userRole = userProfile?.role || 'parent';

  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'verifier' | 'whitelist'
  const [pickups, setPickups] = useState([]);
  const [authorizedContacts, setAuthorizedContacts] = useState([]);
  const [students, setStudents] = useState([]);

  // New Request Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [pickupName, setPickupName] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [proofImageUri, setProofImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  // Gate PIN Verifier Tool State
  const [searchPin, setSearchPin] = useState('');
  const [matchedRequest, setMatchedRequest] = useState(null);

  // New Pre-Authorized Contact Modal
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactPhotoUri, setContactPhotoUri] = useState(null);

  // Live Firebase Subscriptions
  useEffect(() => {
    const unsubPickups = subscribePickups((liveList) => {
      setPickups(liveList);
    });
    const unsubContacts = subscribeAuthorizedContacts((liveContacts) => {
      setAuthorizedContacts(liveContacts);
    });
    const unsubStudents = subscribeStudents((liveStudents) => {
      setStudents(liveStudents);
    });
    return () => {
      unsubPickups();
      unsubContacts();
      unsubStudents();
    };
  }, []);

  // Handle incoming route params from child card shortcut
  useEffect(() => {
    if (route?.params?.studentName) {
      setStudentName(route.params.studentName);
      setModalVisible(true);
    }
  }, [route?.params]);

  const connectedChildren = getConnectedChildren(students, userProfile);

  const handlePickProofImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Needed', 'Access to photos is required to attach recipient photo proof.');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!res.canceled && res.assets.length > 0) {
      setProofImageUri(res.assets[0].uri);
    }
  };

  const handleCreateRequest = async () => {
    if (!studentName.trim() || !pickupName.trim()) {
      Alert.alert('Missing Fields', 'Please enter student name and authorized pickup recipient name.');
      return;
    }

    setLoading(true);
    try {
      const newPin = Math.floor(1000 + Math.random() * 9000).toString();
      const newReqData = {
        studentName: studentName.trim(),
        pickupName: pickupName.trim(),
        pickupPhone: pickupPhone.trim() || '+1 555-0000',
        status: 'Pending',
        time: 'Today (Pending Approval)',
        pinCode: newPin,
        notes: notes.trim() || 'Standard pickup request.',
        imageUri: proofImageUri,
        createdAt: new Date().toISOString()
      };

      await addPickupRequestRecord(newReqData);
      setModalVisible(false);

      // Reset form
      setStudentName('');
      setPickupName('');
      setPickupPhone('');
      setNotes('');
      setProofImageUri(null);

      Alert.alert('Request Saved to Firebase', `Pickup authorization created! Verification PIN Code: ${newPin}`);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save request to Firebase.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAuthorizedContact = async () => {
    if (!contactName.trim() || !contactRelation.trim()) {
      Alert.alert('Missing Fields', 'Please enter contact full name and relation.');
      return;
    }

    try {
      const newContact = {
        name: contactName.trim(),
        relation: contactRelation.trim(),
        phone: contactPhone.trim() || '+1 555-0100',
        status: 'Active',
        photoUri: contactPhotoUri
      };

      await addAuthorizedContactRecord(newContact);
      setContactModalVisible(false);
      setContactName('');
      setContactRelation('');
      setContactPhone('');
      setContactPhotoUri(null);

      Alert.alert('Saved to Firebase', `${newContact.name} saved to Firebase pre-authorized contacts whitelist.`);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // Gate PIN Verification Lookup
  const handlePinLookup = () => {
    if (!searchPin.trim()) {
      Alert.alert('Enter PIN', 'Please type the 4-digit verification PIN provided by recipient.');
      return;
    }

    const found = pickups.find(p => p.pinCode === searchPin.trim());
    if (found) {
      setMatchedRequest(found);
    } else {
      Alert.alert('Invalid PIN', 'No active pickup authorization matches the entered PIN code.');
      setMatchedRequest(null);
    }
  };

  // Status transitions saved live to Firebase
  const updateStatus = async (id, newStatus) => {
    await updatePickupStatusRecord(id, newStatus);
    if (matchedRequest && matchedRequest.id === id) {
      setMatchedRequest({ ...matchedRequest, status: newStatus });
    }
    Alert.alert('Firebase Updated', `Pickup request marked as ${newStatus}.`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Released': return COLORS.success;
      case 'Verified': return COLORS.safetyBlue;
      case 'Approved': return COLORS.info;
      case 'Pending': default: return COLORS.warning;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.pageTitle}>Child Pickup Verification</Text>
            <Text style={styles.pageSubtitle}>Firebase live gate verification & PIN security</Text>
          </View>
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color={COLORS.white} />
            <Text style={styles.addBtnText}>New Request</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Mode Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'requests' && styles.tabBtnActive]}
            onPress={() => setActiveTab('requests')}
          >
            <Ionicons name="list-outline" size={16} color={activeTab === 'requests' ? COLORS.white : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>Active Requests</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'verifier' && styles.tabBtnActive]}
            onPress={() => setActiveTab('verifier')}
          >
            <Ionicons name="keypad-outline" size={16} color={activeTab === 'verifier' ? COLORS.white : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'verifier' && styles.tabTextActive]}>Gate Verifier Portal</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'whitelist' && styles.tabBtnActive]}
            onPress={() => setActiveTab('whitelist')}
          >
            <Ionicons name="people-outline" size={16} color={activeTab === 'whitelist' ? COLORS.white : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'whitelist' && styles.tabTextActive]}>Pre-Authorized</Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: ACTIVE REQUESTS LIST */}
        {activeTab === 'requests' && (
          <View>
            {pickups.map((item) => (
              <Card 
                key={item.id} 
                title={item.studentName} 
                subtitle={`Scheduled: ${item.time}`}
                headerRight={
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                }
              >
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                  <Text style={styles.detailText}>Recipient: <Text style={styles.boldText}>{item.pickupName}</Text></Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="call-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                  <Text style={styles.detailText}>Phone: {item.pickupPhone}</Text>
                </View>

                {item.notes ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="document-text-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                    <Text style={styles.detailText}>Notes: {item.notes}</Text>
                  </View>
                ) : null}

                {/* PIN Code Box */}
                <View style={styles.pinBox}>
                  <View>
                    <Text style={styles.pinLabel}>One-Time Gate PIN</Text>
                    <Text style={styles.pinValue}>{item.pinCode}</Text>
                  </View>
                  <Ionicons name="key-outline" size={24} color={COLORS.safetyBlue} />
                </View>

                {item.imageUri && (
                  <View style={styles.proofPreviewBox}>
                    <Text style={styles.proofLabel}>Attached Recipient Photo Proof:</Text>
                    <Image source={{ uri: item.imageUri }} style={styles.proofThumb} />
                  </View>
                )}

                {/* Action Controls for Staff */}
                {(userRole === 'admin' || userRole === 'pickup_verifier') && (
                  <View style={styles.actionRow}>
                    {item.status === 'Pending' && (
                      <Button
                        title="Approve Request"
                        onPress={() => updateStatus(item.id, 'Approved')}
                        iconName="checkmark-outline"
                        style={styles.flexBtn}
                      />
                    )}
                    {item.status === 'Approved' && (
                      <Button
                        title="Verify Gate Arrival"
                        onPress={() => updateStatus(item.id, 'Verified')}
                        iconName="shield-checkmark-outline"
                        style={styles.flexBtn}
                      />
                    )}
                    {item.status === 'Verified' && (
                      <Button
                        title="Mark Released"
                        onPress={() => updateStatus(item.id, 'Released')}
                        variant="secondary"
                        iconName="log-out-outline"
                        style={styles.flexBtn}
                      />
                    )}
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}

        {/* TAB 2: GATE VERIFIER PORTAL */}
        {activeTab === 'verifier' && (
          <View>
            <Card title="Campus Gate PIN Verification Portal" subtitle="Validate physical recipient PIN & photo proof">
              <InputField
                label="Enter 4-Digit One-Time PIN"
                value={searchPin}
                onChangeText={setSearchPin}
                placeholder="e.g. 7482"
                iconName="keypad-outline"
                keyboardType="number-pad"
              />

              <Button
                title="Verify PIN & Match Recipient"
                onPress={handlePinLookup}
                iconName="search-outline"
              />
            </Card>

            {matchedRequest && (
              <Card 
                title="PIN Match Verified!" 
                subtitle={`PIN: ${matchedRequest.pinCode}`}
                headerRight={
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(matchedRequest.status) + '20' }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(matchedRequest.status) }]}>
                      {matchedRequest.status.toUpperCase()}
                    </Text>
                  </View>
                }
                style={{ borderColor: COLORS.success, borderWidth: 2 }}
              >
                <View style={styles.matchBox}>
                  <Text style={styles.matchTitle}>{matchedRequest.studentName}</Text>
                  <Text style={styles.matchSub}>Authorized Recipient: <Text style={styles.boldText}>{matchedRequest.pickupName}</Text></Text>
                  <Text style={styles.matchSub}>Phone Contact: {matchedRequest.pickupPhone}</Text>
                  <Text style={styles.matchSub}>Scheduled: {matchedRequest.time}</Text>
                </View>

                <View style={styles.actionRow}>
                  {matchedRequest.status !== 'Verified' && matchedRequest.status !== 'Released' && (
                    <Button
                      title="1. Confirm Photo & Verify"
                      onPress={() => updateStatus(matchedRequest.id, 'Verified')}
                      iconName="checkmark-circle-outline"
                      style={styles.flexBtn}
                    />
                  )}
                  {matchedRequest.status !== 'Released' && (
                    <Button
                      title="2. Approve Gate Release"
                      onPress={() => updateStatus(matchedRequest.id, 'Released')}
                      variant="secondary"
                      iconName="exit-outline"
                      style={styles.flexBtn}
                    />
                  )}
                </View>
              </Card>
            )}
          </View>
        )}

        {/* TAB 3: PRE-AUTHORIZED CONTACTS WHITELIST */}
        {activeTab === 'whitelist' && (
          <View>
            <Button
              title="Add Pre-Authorized Contact"
              onPress={() => setContactModalVisible(true)}
              iconName="person-add-outline"
              style={{ marginBottom: SPACING.md }}
            />

            {authorizedContacts.map((contact) => (
              <Card key={contact.id} title={contact.name} subtitle={contact.relation}>
                <View style={styles.detailRow}>
                  <Ionicons name="call-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                  <Text style={styles.detailText}>Phone: {contact.phone}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.success} style={{ marginRight: 6 }} />
                  <Text style={styles.detailText}>Authorization Status: <Text style={{ color: COLORS.success, fontWeight: '700' }}>Pre-Approved</Text></Text>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* New Pickup Request Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Pickup Request (Firebase)</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              {connectedChildren.length > 0 && (
                <View style={{ marginBottom: SPACING.sm }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginBottom: 6 }}>
                    Quick Select Connected Child:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 4 }}>
                    {connectedChildren.map(child => {
                      const label = `${child.firstName} ${child.lastName} (${child.grade})`;
                      const selected = studentName === label;
                      return (
                        <TouchableOpacity
                          key={child.id}
                          style={[
                            styles.childPickChip,
                            selected && styles.childPickChipActive
                          ]}
                          onPress={() => setStudentName(label)}
                          activeOpacity={0.8}
                        >
                          <Ionicons 
                            name={selected ? "checkmark-circle" : "person-circle-outline"} 
                            size={14} 
                            color={selected ? COLORS.white : COLORS.safetyBlue} 
                            style={{ marginRight: 4 }}
                          />
                          <Text style={[styles.childPickChipText, selected && styles.childPickChipTextActive]}>
                            {child.firstName} ({child.grade})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              <InputField
                label="Student Name & Grade"
                value={studentName}
                onChangeText={setStudentName}
                placeholder="e.g. Ethan Vance (Grade 4B)"
                iconName="school-outline"
              />

              <InputField
                label="Authorized Recipient Name"
                value={pickupName}
                onChangeText={setPickupName}
                placeholder="e.g. Sarah Vance (Aunt)"
                iconName="person-outline"
              />

              <InputField
                label="Recipient Phone Number"
                value={pickupPhone}
                onChangeText={setPickupPhone}
                placeholder="e.g. +1 555-0182"
                iconName="call-outline"
                keyboardType="phone-pad"
              />

              <InputField
                label="Pickup Notes / Justification"
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Doctor appointment early departure"
                iconName="create-outline"
                multiline={true}
              />

              {/* Photo Proof Upload */}
              <Text style={styles.proofUploadLabel}>Recipient Photo Proof (Optional)</Text>
              <TouchableOpacity 
                style={styles.uploadArea} 
                onPress={handlePickProofImage}
                activeOpacity={0.8}
              >
                {proofImageUri ? (
                  <Image source={{ uri: proofImageUri }} style={styles.uploadPreviewImage} />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="camera-outline" size={28} color={COLORS.safetyBlue} />
                    <Text style={styles.uploadText}>Tap to select recipient photo proof</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Button
                title="Submit Pickup Authorization"
                onPress={handleCreateRequest}
                loading={loading}
                iconName="checkmark-circle-outline"
                style={{ marginTop: SPACING.md }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Pre-Authorized Contact Modal */}
      <Modal visible={contactModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Pre-Authorized Contact</Text>
              <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <InputField
              label="Contact Full Name"
              value={contactName}
              onChangeText={setContactName}
              placeholder="e.g. Grandparent or Family Driver"
              iconName="person-outline"
            />

            <InputField
              label="Relationship to Child"
              value={contactRelation}
              onChangeText={setContactRelation}
              placeholder="e.g. Grandmother / Designated Driver"
              iconName="people-outline"
            />

            <InputField
              label="Phone Number"
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="e.g. +1 555-0144"
              iconName="call-outline"
              keyboardType="phone-pad"
            />

            <Button
              title="Save Pre-Authorized Contact"
              onPress={handleAddAuthorizedContact}
              iconName="checkmark-circle-outline"
              style={{ marginTop: SPACING.md }}
            />
          </View>
        </View>
      </Modal>
    </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primaryNavy,
  },
  pageSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.safetyBlue,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    ...SHADOWS.small,
  },
  addBtnText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 4,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primaryNavy,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pinBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.safetyBlueLight,
    padding: SPACING.sm + 4,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
  },
  pinLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.safetyBlue,
  },
  pinValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryNavy,
    letterSpacing: 3,
  },
  proofPreviewBox: {
    marginTop: SPACING.sm,
  },
  proofLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  proofThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.md,
  },
  flexBtn: {
    flex: 1,
    height: 42,
  },
  matchBox: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryNavy,
    marginBottom: 4,
  },
  matchSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  proofUploadLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  uploadArea: {
    height: 90,
    borderWidth: 1.5,
    borderColor: COLORS.surfaceBorder,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    marginBottom: SPACING.md,
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 12,
    color: COLORS.safetyBlue,
    marginTop: 4,
    fontWeight: '500',
  },
  uploadPreviewImage: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.md,
  },
  childPickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.safetyBlueLight,
    borderWidth: 1,
    borderColor: COLORS.safetyBlue,
    marginRight: 8,
  },
  childPickChipActive: {
    backgroundColor: COLORS.safetyBlue,
    borderColor: COLORS.safetyBlue,
  },
  childPickChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.safetyBlue,
  },
  childPickChipTextActive: {
    color: COLORS.white,
  },
});
