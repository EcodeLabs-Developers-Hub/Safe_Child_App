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
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage, auth } from '../../config/firebase';
import * as ImagePicker from 'expo-image-picker';
import { 
  subscribePickups, 
  addPickupRequestRecord, 
  updatePickupStatusRecord,
  subscribeAuthorizedContacts,
  addAuthorizedContactRecord,
  subscribeStudentsForUser,
  getConnectedChildren,
  subscribePickupAudits,
  addPickupAuditRecord,
  addAlertRecord
} from '../../services/dataService';

export const PickupsScreen = ({ route }) => {
  const { userProfile } = useAuth();
  const userRole = userProfile?.role || null;

  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'verifier' | 'audit_log' | 'whitelist'
  const [pickups, setPickups] = useState([]);
  const [authorizedContacts, setAuthorizedContacts] = useState([]);
  const [students, setStudents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // New Request Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedChildIds, setSelectedChildIds] = useState([]);
  const [pickupName, setPickupName] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [proofImageUri, setProofImageUri] = useState(null);
  const [proofViewerUri, setProofViewerUri] = useState(null);
  const [loading, setLoading] = useState(false);

  // Gate PIN Verifier Tool State
  const [searchPin, setSearchPin] = useState('');
  const [matchedRequest, setMatchedRequest] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null); // null | { status: 'SUCCESS'|'REJECTED', data, pin }

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
    }, userProfile);
    const unsubContacts = subscribeAuthorizedContacts((liveContacts) => {
      setAuthorizedContacts(liveContacts);
    }, userProfile);
    const unsubStudents = subscribeStudentsForUser((liveStudents) => {
      setStudents(liveStudents);
    }, userProfile);
    const unsubAudits = subscribePickupAudits((liveAudits) => {
      setAuditLogs(liveAudits);
    }, userProfile);
    return () => {
      unsubPickups();
      unsubContacts();
      unsubStudents();
      unsubAudits();
    };
  }, [userProfile]);

  // Handle incoming route params from child card shortcut
  useEffect(() => {
    if (route?.params?.studentId) {
      setSelectedChildIds((currentIds) => currentIds.includes(route.params.studentId)
        ? currentIds
        : [...currentIds, route.params.studentId]);
      setModalVisible(true);
    }
  }, [route?.params?.studentId]);

  const connectedChildren = getConnectedChildren(students, userProfile);
  const canArrangePickup = userRole === 'parent' && connectedChildren.length > 0;
  const selectedChildren = connectedChildren.filter((child) => selectedChildIds.includes(child.id));

  const toggleChildSelection = (childId) => {
    setSelectedChildIds((currentIds) => currentIds.includes(childId)
      ? currentIds.filter((id) => id !== childId)
      : [...currentIds, childId]);
  };

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
    if (!canArrangePickup) {
      Alert.alert('Pickup unavailable', 'Only parent accounts with connected children can arrange pickups.');
      return;
    }
    if (selectedChildren.length === 0 || !pickupName.trim()) {
      Alert.alert('Missing Fields', 'Select at least one connected child and enter the authorized pickup recipient name.');
      return;
    }

    setLoading(true);
    try {
      let proofUrl = null;
      if (proofImageUri) {
        const response = await fetch(proofImageUri);
        const blob = await response.blob();
        const proofRef = ref(storage, `pickup_proofs/${auth.currentUser.uid}/${Date.now()}.jpg`);
        await uploadBytes(proofRef, blob, { contentType: 'image/jpeg' });
        proofUrl = await getDownloadURL(proofRef);
      }
      const newReqData = {
        studentName: selectedChildren.map((child) => `${child.firstName} ${child.lastName}`).join(', '),
        studentIds: selectedChildren.map((child) => child.id),
        studentNames: selectedChildren.map((child) => `${child.firstName} ${child.lastName}`),
        pickupName: pickupName.trim(),
        pickupPhone: pickupPhone.trim(),
        status: 'Pending',
        time: 'Today (Pending Approval)',
        notes: notes.trim(),
        imageUri: proofUrl,
        createdAt: new Date().toISOString()
      };

      const savedRequest = await addPickupRequestRecord(newReqData);
      setModalVisible(false);

      // Reset form
      setSelectedChildIds([]);
      setPickupName('');
      setPickupPhone('');
      setNotes('');
      setProofImageUri(null);

      Alert.alert('Request Saved to Database', `Pickup authorization created. Verification PIN Code: ${savedRequest.pinCode}`);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save request to Database.');
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
        phone: contactPhone.trim(),
        status: 'Active',
        photoUri: contactPhotoUri
      };

      await addAuthorizedContactRecord(newContact);
      setContactModalVisible(false);
      setContactName('');
      setContactRelation('');
      setContactPhone('');
      setContactPhotoUri(null);

      Alert.alert('Saved to Database', `${newContact.name} saved to Database pre-authorized contacts whitelist.`);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // Gate PIN Verification Lookup (Figure 4.14 Success & Rejection)
  const handlePinLookup = async () => {
    const cleanPin = searchPin.trim();
    if (!cleanPin) {
      Alert.alert('Enter PIN', 'Please type the 4-digit verification PIN provided by recipient.');
      return;
    }

    const officerName = userProfile?.displayName || 'Gate Officer';
    const found = pickups.find(p => p.pinCode === cleanPin);

    if (found && (found.status === 'Approved' || found.status === 'Verified' || found.status === 'Pending')) {
      setMatchedRequest(found);
      setVerificationResult({ status: 'SUCCESS', data: found });

      await addPickupAuditRecord({
        studentName: found.studentName,
        pickupName: found.pickupName,
        pickupPhone: found.pickupPhone,
        pinCode: cleanPin,
        status: 'VERIFIED_SUCCESS',
        verifierName: officerName,
        notes: 'Verification code matched active authorization. Recipient identity validated.'
      });
    } else {
      setMatchedRequest(null);
      setVerificationResult({ status: 'REJECTED', pin: cleanPin });

      await addPickupAuditRecord({
        studentName: 'Unidentified Student',
        pickupName: 'Unverified Claimer',
        pickupPhone: 'Unknown',
        pinCode: cleanPin,
        status: 'REJECTED_INVALID_PIN',
        verifierName: officerName,
        notes: `Invalid or expired PIN (${cleanPin}) presented at campus gate. Handover halted.`
      });

      await addAlertRecord({
        title: `Invalid Pickup PIN Attempt (${cleanPin})`,
        description: `Unverified claimer presented invalid PIN code ${cleanPin} at main gate.`,
        severity: 'High',
        status: 'Unresolved',
        time: 'Just now',
        reporter: officerName,
        impactedStudents: 'Gate Security Area'
      });
    }
  };

  // Status transitions saved live to Firebase
  const updateStatus = async (id, newStatus) => {
    try {
      await updatePickupStatusRecord(id, newStatus);
      if (matchedRequest && matchedRequest.id === id) {
        setMatchedRequest({ ...matchedRequest, status: newStatus });
      }
      Alert.alert('Database Updated', `Pickup request marked as ${newStatus}.`);
    } catch (err) {
      Alert.alert('Unable to update request', err.message || 'Please check your connection and try again.');
    }
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
            <Text style={styles.pageSubtitle}>Live gate verification & PIN security</Text>
          </View>
          {canArrangePickup && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text style={styles.addBtnText}>New Request</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Navigation Mode Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'requests' && styles.tabBtnActive]}
            onPress={() => setActiveTab('requests')}
          >
            <Ionicons name="list-outline" size={15} color={activeTab === 'requests' ? COLORS.white : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>Active Requests</Text>
          </TouchableOpacity>

          {(userRole === 'admin' || userRole === 'pickup_verifier') && (
            <>
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'verifier' && styles.tabBtnActive]}
                onPress={() => setActiveTab('verifier')}
              >
                <Ionicons name="keypad-outline" size={15} color={activeTab === 'verifier' ? COLORS.white : COLORS.textSecondary} />
                <Text style={[styles.tabText, activeTab === 'verifier' && styles.tabTextActive]}>Gate Verifier</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'audit_log' && styles.tabBtnActive]}
                onPress={() => setActiveTab('audit_log')}
              >
                <Ionicons name="time-outline" size={15} color={activeTab === 'audit_log' ? COLORS.white : COLORS.textSecondary} />
                <Text style={[styles.tabText, activeTab === 'audit_log' && styles.tabTextActive]}>Audit Log</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'whitelist' && styles.tabBtnActive]}
            onPress={() => setActiveTab('whitelist')}
          >
            <Ionicons name="people-outline" size={15} color={activeTab === 'whitelist' ? COLORS.white : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'whitelist' && styles.tabTextActive]}>Contacts</Text>
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
                    <TouchableOpacity onPress={() => setProofViewerUri(item.imageUri)}>
                      <Image source={{ uri: item.imageUri }} style={styles.proofThumb} />
                    </TouchableOpacity>
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

        {/* TAB 2: GATE VERIFIER PORTAL (Figure 4.14: Success & Rejected Verification) */}
        {activeTab === 'verifier' && (
          <View>
            <Card title="Campus Gate PIN Verification Portal" subtitle="Validate physical recipient PIN & photo proof">
              <InputField
                label="Enter 4-Digit One-Time PIN"
                value={searchPin}
                onChangeText={(val) => { setSearchPin(val); setVerificationResult(null); }}
                placeholder="e.g. 7482"
                iconName="keypad-outline"
                keyboardType="number-pad"
              />

              <Button
                title="Verify PIN & Match Recipient"
                onPress={handlePinLookup}
                iconName="shield-checkmark-outline"
              />
            </Card>

            {/* Figure 4.14: SUCCESS VALIDATION SCREEN */}
            {verificationResult?.status === 'SUCCESS' && matchedRequest && (
              <Card style={{ borderColor: COLORS.success, borderWidth: 2, backgroundColor: '#f0fdf4' }}>
                <View style={styles.successHeaderRow}>
                  <Ionicons name="checkmark-circle" size={44} color={COLORS.success} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.successTitle}>VERIFICATION SUCCESSFUL</Text>
                    <Text style={styles.successSub}>Authorized Handover Match Confirmed</Text>
                  </View>
                </View>

                <View style={styles.matchBox}>
                  <Text style={styles.matchTitle}>Student: {matchedRequest.studentName}</Text>
                  <Text style={styles.matchSub}>Authorized Recipient: <Text style={styles.boldText}>{matchedRequest.pickupName}</Text></Text>
                  <Text style={styles.matchSub}>Phone Contact: {matchedRequest.pickupPhone}</Text>
                  <Text style={styles.matchSub}>PIN Code Match: <Text style={{ fontWeight: '800', color: COLORS.success }}>{matchedRequest.pinCode}</Text></Text>
                  <Text style={styles.matchSub}>Notes: {matchedRequest.notes || 'No notes provided.'}</Text>
                </View>

                {matchedRequest.imageUri && (
                  <View style={styles.proofPreviewBox}>
                    <Text style={styles.proofLabel}>Verified Recipient Photo Proof:</Text>
                    <TouchableOpacity onPress={() => setProofViewerUri(matchedRequest.imageUri)}>
                      <Image source={{ uri: matchedRequest.imageUri }} style={styles.proofThumb} />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.actionRow}>
                  {matchedRequest.status !== 'Released' ? (
                    <Button
                      title="Confirm Release & Log Handover"
                      onPress={() => updateStatus(matchedRequest.id, 'Released')}
                      iconName="checkmark-done-circle-outline"
                      style={styles.flexBtn}
                    />
                  ) : (
                    <View style={styles.releasedBadgeBox}>
                      <Ionicons name="checkmark-done" size={18} color={COLORS.success} />
                      <Text style={styles.releasedBadgeText}>Student Released & Logged</Text>
                    </View>
                  )}
                </View>
              </Card>
            )}

            {/* Figure 4.14: REJECTED VERIFICATION ATTEMPT SCREEN */}
            {verificationResult?.status === 'REJECTED' && (
              <Card style={{ borderColor: COLORS.danger, borderWidth: 2, backgroundColor: '#fff1f2' }}>
                <View style={styles.rejectedHeaderRow}>
                  <Ionicons name="close-circle" size={44} color={COLORS.danger} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.rejectedTitle}>VERIFICATION REJECTED</Text>
                    <Text style={styles.rejectedSub}>Invalid, Expired, or Used Verification Code</Text>
                  </View>
                </View>

                <View style={styles.rejectedInstructionCard}>
                  <Ionicons name="alert-circle" size={24} color={COLORS.danger} style={{ marginBottom: 4 }} />
                  <Text style={styles.rejectedInstructionHeading}>ACTION REQUIRED FOR SECURITY OFFICER:</Text>
                  <Text style={styles.rejectedInstructionBody}>
                    DO NOT RELEASE STUDENT. ESCALATE CASE TO CAMPUS SECURITY COMMAND IMMEDIATELY.
                  </Text>
                  <Text style={styles.rejectedMetaText}>Attempted PIN: {verificationResult.pin} • Incident Logged on Audit</Text>
                </View>

                <View style={styles.actionRow}>
                  <Button
                    title="Retry Code Entry"
                    onPress={() => { setVerificationResult(null); setSearchPin(''); }}
                    variant="secondary"
                    iconName="refresh-outline"
                    style={styles.flexBtn}
                  />
                  {(userRole === 'admin' || userRole === 'security') && (
                    <Button
                      title="Alert Security Command"
                      onPress={() => navigation.navigate('SecurityTab')}
                      iconName="shield-alert-outline"
                      style={[styles.flexBtn, { backgroundColor: COLORS.danger }]}
                    />
                  )}
                </View>
              </Card>
            )}
          </View>
        )}

        {/* TAB 3: PICKUP HISTORY AND VERIFICATION AUDIT RECORD (Figure 4.15) */}
        {activeTab === 'audit_log' && (
          <View>
            <Card title="Pickup Verification Audit Records" subtitle="Complete auditable log of gate release attempts">
              {auditLogs.length === 0 ? (
                <Text style={{ textAlign: 'center', color: COLORS.textMuted, padding: SPACING.md }}>No audit logs recorded yet.</Text>
              ) : (
                auditLogs.map((log) => {
                  const isSuccess = log.status === 'VERIFIED_SUCCESS';
                  return (
                    <View key={log.id} style={styles.auditRow}>
                      <View style={styles.auditHeader}>
                        <View style={[styles.auditBadge, { backgroundColor: isSuccess ? COLORS.successLight : COLORS.dangerLight }]}>
                          <Ionicons name={isSuccess ? "checkmark-circle" : "close-circle"} size={14} color={isSuccess ? COLORS.success : COLORS.danger} style={{ marginRight: 4 }} />
                          <Text style={[styles.auditBadgeText, { color: isSuccess ? COLORS.success : COLORS.danger }]}>
                            {isSuccess ? 'VERIFIED HANDOVER' : 'REJECTED ATTEMPT'}
                          </Text>
                        </View>
                        <Text style={styles.auditTime}>{log.timestamp}</Text>
                      </View>

                      <Text style={styles.auditTitle}>{log.studentName}</Text>
                      <Text style={styles.auditSub}>Recipient / Claimer: <Text style={styles.boldText}>{log.pickupName}</Text> ({log.pickupPhone})</Text>
                      <Text style={styles.auditSub}>PIN Code Presented: <Text style={{ fontWeight: '700' }}>{log.pinCode}</Text> • Verifier: {log.verifierName}</Text>
                      {log.notes ? <Text style={styles.auditNotes}>Note: {log.notes}</Text> : null}
                    </View>
                  );
                })
              )}
            </Card>
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
      <Modal visible={modalVisible && canArrangePickup} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Pickup Request</Text>
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
                      const selected = selectedChildIds.includes(child.id);
                      return (
                        <TouchableOpacity
                          key={child.id}
                          style={[
                            styles.childPickChip,
                            selected && styles.childPickChipActive
                          ]}
                          onPress={() => toggleChildSelection(child.id)}
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

              <View style={{ marginBottom: SPACING.sm }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginBottom: 6 }}>
                  Selected Children ({selectedChildren.length})
                </Text>
                <Text style={{ color: selectedChildren.length ? COLORS.textPrimary : COLORS.textMuted }}>
                  {selectedChildren.length
                    ? selectedChildren.map((child) => `${child.firstName} ${child.lastName}`).join(', ')
                    : 'Select one or more connected children above.'}
                </Text>
              </View>

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

      <Modal visible={!!proofViewerUri} animationType="fade" transparent={true} onRequestClose={() => setProofViewerUri(null)}>
        <View style={styles.proofViewerOverlay}>
          <TouchableOpacity style={styles.proofViewerClose} onPress={() => setProofViewerUri(null)}>
            <Ionicons name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>
          {proofViewerUri && <Image source={{ uri: proofViewerUri }} style={styles.proofViewerImage} resizeMode="contain" />}
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
  proofViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  proofViewerImage: {
    width: '100%',
    height: '80%',
  },
  proofViewerClose: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 1,
    padding: SPACING.xs,
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
