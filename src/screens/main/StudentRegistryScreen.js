import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert, 
  Modal,
  Linking
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { InputField } from '../../components/common/InputField';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { subscribeStudentsForUser, addStudentRecord, updateStudentRecord, getConnectedChildren } from '../../services/dataService';

const GRADES = ['All', 'My Children', 'Grade 1A', 'Grade 2A', 'Grade 3C', 'Grade 4B'];

export const StudentRegistryScreen = ({ navigation }) => {
  const { userProfile } = useAuth();
  const userRole = userProfile?.role || null;

  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(userRole === 'parent' ? 'My Children' : 'All');
  
  // Registration Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [grade, setGrade] = useState('Grade 4B');
  const [guardianName, setGuardianName] = useState(userProfile?.displayName || '');
  const [guardianEmail, setGuardianEmail] = useState(userProfile?.email || '');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [teacherName, setTeacherName] = useState('Mr. Joshua Ofori');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [studentPhotoUri, setStudentPhotoUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  // Detail Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportSubject, setReportSubject] = useState('Safe Child student update');
  const [reportBody, setReportBody] = useState('');

  // Open add modal and ensure guardian details are auto-filled for parent
  const handleOpenAddModal = () => {
    setGuardianName(userProfile?.displayName || '');
    setGuardianEmail(userProfile?.email || '');
    setAddModalVisible(true);
  };

  const handleOpenStudentDetails = (student) => {
    setSelectedStudent(student);
    setTeacherName(student.teacherName || '');
    setTeacherEmail(student.teacherEmail || '');
  };

  const handleCallGuardian = async () => {
    const phone = selectedStudent?.guardianPhone || selectedStudent?.emergencyContact;
    if (!phone) {
      Alert.alert('Phone unavailable', 'No guardian phone number is saved for this student.');
      return;
    }
    const url = `tel:${phone.replace(/[^0-9+]/g, '')}`;
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Unable to open phone', 'This device cannot open the phone dialer.');
    }
  };

  const handleOpenParentReport = () => {
    if (!selectedStudent?.guardianEmail) {
      Alert.alert('Email unavailable', 'No guardian email is saved for this student.');
      return;
    }
    setReportSubject(`Safe Child report: ${selectedStudent.firstName} ${selectedStudent.lastName}`);
    setReportBody(`Dear ${selectedStudent.guardianName || 'Parent/Guardian'},\n\nStudent: ${selectedStudent.firstName} ${selectedStudent.lastName}\nGrade: ${selectedStudent.grade || 'N/A'}\n\nReport:\n\nRegards,\nSafe Child Administration`);
    setReportModalVisible(true);
  };

  const handleSendParentReport = async () => {
    const email = selectedStudent?.guardianEmail;
    if (!email) return;
    const url = `mailto:${email}?subject=${encodeURIComponent(reportSubject)}&body=${encodeURIComponent(reportBody)}`;
    if (await Linking.canOpenURL(url)) {
      setReportModalVisible(false);
      await Linking.openURL(url);
    } else {
      Alert.alert('Unable to open email', 'No email application is available on this device.');
    }
  };

  // Live Firebase Firestore Realtime Subscription
  useEffect(() => {
    const unsubscribe = subscribeStudentsForUser((liveList) => {
      setStudents(liveList);
    }, userProfile);
    return () => unsubscribe();
  }, [userProfile]);

  const handlePickStudentPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Access to photos is required for student avatar upload.');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!res.canceled && res.assets.length > 0) {
      setStudentPhotoUri(res.assets[0].uri);
    }
  };

  const handleAddStudent = async () => {
    if (!firstName.trim() || !lastName.trim() || !guardianName.trim()) {
      Alert.alert('Required Fields', 'Please enter student full name and guardian name.');
      return;
    }

    setLoading(true);
    try {
      const newStudentData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        grade,
        guardianName: guardianName.trim(),
        guardianEmail: guardianEmail.trim() || userProfile?.email || '',
        guardianPhone: guardianPhone.trim(),
        teacherName: teacherName.trim(),
        teacherEmail: teacherEmail.trim().toLowerCase(),
        status: 'Active',
        photoUri: studentPhotoUri,
        attendanceRate: '100%',
        emergencyContact: guardianPhone.trim()
      };

      await addStudentRecord(newStudentData);
      setAddModalVisible(false);

      // Reset form
      setFirstName('');
      setLastName('');
      setTeacherEmail('');
      setStudentPhotoUri(null);

      Alert.alert('Student Saved to Firebase', `${newStudentData.firstName} ${newStudentData.lastName} has been registered and connected to your profile.`);
    } catch (err) {
      console.error('Student Firestore write failed:', err);
      Alert.alert(
        'Error Saving Student',
        `${err.message || 'Could not save student to Firebase.'}${err.code ? `\n\nFirebase code: ${err.code}` : ''}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTeacherAssignment = async () => {
    if (!selectedStudent || userRole !== 'admin') return;
    const normalizedEmail = teacherEmail.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      Alert.alert('Teacher Email Required', 'Enter the email address used by the teacher to sign in.');
      return;
    }

    try {
      setAssignmentLoading(true);
      await updateStudentRecord(selectedStudent.id, {
        teacherName: teacherName.trim(),
        teacherEmail: normalizedEmail
      });
      setSelectedStudent((current) => ({
        ...current,
        teacherName: teacherName.trim(),
        teacherEmail: normalizedEmail
      }));
      Alert.alert('Student Updated', 'The student has been reassigned to the new teacher.');
    } catch (err) {
      Alert.alert('Unable to update student', err.message || 'Please check your connection and try again.');
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Filtered Students
  const filteredStudents = students.filter(st => {
    const fullName = `${st.firstName} ${st.lastName}`.toLowerCase();
    const guardian = (st.guardianName || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesQuery = fullName.includes(query) || guardian.includes(query) || (st.grade || '').toLowerCase().includes(query);
    
    if (!matchesQuery) return false;

    if (selectedGrade === 'My Children') {
      const myChildren = getConnectedChildren(students, userProfile);
      return myChildren.some(c => c.id === st.id);
    }

    const matchesGrade = selectedGrade === 'All' || st.grade === selectedGrade;
    return matchesGrade;
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.pageTitle}>Student Registry</Text>
            <Text style={styles.pageSubtitle}>Official Educal Complex student roster (Firebase Sync)</Text>
          </View>
          {(userRole === 'admin' || userRole === 'teacher' || userRole === 'parent') && (
            <TouchableOpacity 
              style={styles.addBtn}
              onPress={handleOpenAddModal}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add" size={18} color={COLORS.white} />
              <Text style={styles.addBtnText}>Add Student</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Input */}
        <InputField
          placeholder="Search student by name, guardian, or grade..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          iconName="search-outline"
          style={{ marginBottom: SPACING.sm }}
        />

        {/* Grade Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {GRADES.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.gradeChip, selectedGrade === g && styles.gradeChipActive]}
              onPress={() => setSelectedGrade(g)}
            >
              <Text style={[styles.gradeChipText, selectedGrade === g && styles.gradeChipTextActive]}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Student Cards Grid */}
        {filteredStudents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Students Found</Text>
            <Text style={styles.emptySub}>No student records match your current search or filter criteria.</Text>
          </View>
        ) : (
          filteredStudents.map((st) => (
            <Card key={st.id} style={styles.studentCard}>
              <View style={styles.cardHeaderRow}>
                <Avatar uri={st.photoUri} size={54} />
                <View style={styles.cardMainInfo}>
                  <Text style={styles.studentFullName}>{st.firstName} {st.lastName}</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.gradeBadge}>
                      <Text style={styles.gradeBadgeText}>{st.grade}</Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <View style={styles.greenDot} />
                      <Text style={styles.statusBadgeText}>{st.status}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.detailBtn}
                  onPress={() => handleOpenStudentDetails(st)}
                >
                  <Ionicons name="chevron-forward" size={20} color={COLORS.safetyBlue} />
                </TouchableOpacity>
              </View>

              <View style={styles.cardMetaDivider} />

              <View style={styles.metaRow}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Guardian</Text>
                  <Text style={styles.metaValue}>{st.guardianName}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Assigned Teacher</Text>
                  <Text style={styles.metaValue}>{st.teacherName}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Attendance Rate</Text>
                  <Text style={[styles.metaValue, { color: COLORS.success, fontWeight: '800' }]}>
                    {st.attendanceRate}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Add Student Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register New Student (Firebase)</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <InputField
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="e.g. Ethan"
                iconName="person-outline"
              />

              <InputField
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                placeholder="e.g. Vance"
                iconName="person-outline"
              />

              <InputField
                label="Grade Level"
                value={grade}
                onChangeText={setGrade}
                placeholder="e.g. Grade 4B"
                iconName="school-outline"
              />

              <InputField
                label="Guardian Full Name"
                value={guardianName}
                onChangeText={setGuardianName}
                placeholder="e.g. Eleanor Vance"
                iconName="people-outline"
              />

              <InputField
                label="Guardian Email"
                value={guardianEmail}
                onChangeText={setGuardianEmail}
                placeholder="e.g. guardian@example.com"
                iconName="mail-outline"
                keyboardType="email-address"
              />

              <InputField
                label="Guardian Phone"
                value={guardianPhone}
                onChangeText={setGuardianPhone}
                placeholder="e.g. +1 555-0182"
                iconName="call-outline"
                keyboardType="phone-pad"
              />

              <InputField
                label="Assigned Teacher"
                value={teacherName}
                onChangeText={setTeacherName}
                placeholder="e.g. Mr. Joshua Ofori"
                iconName="easel-outline"
              />

              <InputField
                label="Teacher Email"
                value={teacherEmail}
                onChangeText={setTeacherEmail}
                placeholder="e.g. teacher@example.com"
                iconName="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Student Photo Picker */}
              <Text style={styles.photoUploadLabel}>Student Profile Picture (Optional)</Text>
              <TouchableOpacity 
                style={styles.uploadArea} 
                onPress={handlePickStudentPhoto}
                activeOpacity={0.8}
              >
                {studentPhotoUri ? (
                  <Image source={{ uri: studentPhotoUri }} style={styles.uploadPreviewImage} />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="camera-outline" size={28} color={COLORS.safetyBlue} />
                    <Text style={styles.uploadText}>Select Student Photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Button
                title="Save Student to Firebase"
                onPress={handleAddStudent}
                loading={loading}
                iconName="checkmark-circle-outline"
                style={{ marginTop: SPACING.sm }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Student Detail Modal */}
      <Modal visible={!!selectedStudent} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedStudent && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Student Profile Record</Text>
                  <TouchableOpacity onPress={() => setSelectedStudent(null)}>
                    <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailHeaderBox}>
                  <Avatar uri={selectedStudent.photoUri} size={70} />
                  <Text style={styles.detailName}>{selectedStudent.firstName} {selectedStudent.lastName}</Text>
                  <Text style={styles.detailGrade}>{selectedStudent.grade} • Educal Complex</Text>
                </View>

                <View style={styles.detailSection}>
                  <View style={styles.detailItem}>
                    <Ionicons name="person-outline" size={18} color={COLORS.safetyBlue} />
                    <View style={styles.detailItemText}>
                      <Text style={styles.detailItemLabel}>Guardian</Text>
                      <Text style={styles.detailItemVal}>{selectedStudent.guardianName}</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <Ionicons name="mail-outline" size={18} color={COLORS.safetyBlue} />
                    <View style={styles.detailItemText}>
                      <Text style={styles.detailItemLabel}>Guardian Email</Text>
                      <Text style={styles.detailItemVal}>{selectedStudent.guardianEmail}</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <Ionicons name="call-outline" size={18} color={COLORS.safetyBlue} />
                    <View style={styles.detailItemText}>
                      <Text style={styles.detailItemLabel}>Guardian Phone</Text>
                      <Text style={styles.detailItemVal}>{selectedStudent.guardianPhone}</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <Ionicons name="alert-circle-outline" size={18} color={COLORS.danger} />
                    <View style={styles.detailItemText}>
                      <Text style={styles.detailItemLabel}>Emergency Contact</Text>
                      <Text style={styles.detailItemVal}>{selectedStudent.emergencyContact}</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <Ionicons name="easel-outline" size={18} color={COLORS.safetyBlue} />
                    <View style={styles.detailItemText}>
                      <Text style={styles.detailItemLabel}>Assigned Teacher</Text>
                      <Text style={styles.detailItemVal}>{selectedStudent.teacherName || 'Not assigned'}</Text>
                      <Text style={styles.detailItemVal}>{selectedStudent.teacherEmail || 'Teacher email not assigned'}</Text>
                    </View>
                  </View>
                </View>

                {userRole === 'admin' && (
                  <View style={styles.parentActionsRow}>
                    <TouchableOpacity style={styles.parentActionButton} onPress={handleCallGuardian}>
                      <Ionicons name="call-outline" size={18} color={COLORS.white} />
                      <Text style={styles.parentActionText}>Call Parent</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.parentActionButton, styles.emailActionButton]} onPress={handleOpenParentReport}>
                      <Ionicons name="mail-outline" size={18} color={COLORS.white} />
                      <Text style={styles.parentActionText}>Email Report</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {userRole === 'admin' && (
                  <>
                    <InputField
                      label="Reassign Teacher Name"
                      value={teacherName}
                      onChangeText={setTeacherName}
                      placeholder="Teacher full name"
                      iconName="person-outline"
                    />
                    <InputField
                      label="Reassign Teacher Email"
                      value={teacherEmail}
                      onChangeText={setTeacherEmail}
                      placeholder="Email used to sign in"
                      iconName="mail-outline"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <Button
                      title="Save Teacher Assignment"
                      onPress={handleSaveTeacherAssignment}
                      loading={assignmentLoading}
                      iconName="save-outline"
                      style={{ marginTop: SPACING.sm }}
                    />
                  </>
                )}

                <Button
                  title="Close Profile"
                  onPress={() => setSelectedStudent(null)}
                  variant="secondary"
                  style={{ marginTop: SPACING.md }}
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={reportModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Email Parent Report</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.reportRecipient}>To: {selectedStudent?.guardianEmail}</Text>
            <InputField
              label="Subject"
              value={reportSubject}
              onChangeText={setReportSubject}
              iconName="text-outline"
            />
            <InputField
              label="Report Message"
              value={reportBody}
              onChangeText={setReportBody}
              placeholder="Write the report for the parent..."
              iconName="create-outline"
              multiline={true}
              numberOfLines={7}
            />
            <Button
              title="Open Email App"
              onPress={handleSendParentReport}
              iconName="send-outline"
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
    paddingHorizontal: 12,
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
  chipScroll: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  gradeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginRight: 8,
  },
  gradeChipActive: {
    backgroundColor: COLORS.safetyBlue,
    borderColor: COLORS.safetyBlue,
  },
  gradeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  gradeChipTextActive: {
    color: COLORS.white,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginTop: SPACING.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryNavy,
    marginTop: SPACING.sm,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  studentCard: {
    marginBottom: SPACING.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMainInfo: {
    flex: 1,
    marginLeft: SPACING.sm + 4,
  },
  studentFullName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryNavy,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  gradeBadge: {
    backgroundColor: COLORS.safetyBlueLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  gradeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.safetyBlue,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  detailBtn: {
    padding: 6,
  },
  cardMetaDivider: {
    height: 1,
    backgroundColor: COLORS.background,
    marginVertical: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 2,
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
    maxHeight: '88%',
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
  photoUploadLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  uploadArea: {
    height: 80,
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
  detailHeaderBox: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
    marginBottom: SPACING.md,
  },
  detailName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primaryNavy,
    marginTop: SPACING.xs,
  },
  detailGrade: {
    fontSize: 13,
    color: COLORS.safetyBlue,
    fontWeight: '600',
    marginTop: 2,
  },
  detailSection: {
    gap: 12,
  },
  parentActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.md,
  },
  parentActionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  emailActionButton: {
    backgroundColor: COLORS.safetyBlue,
  },
  parentActionText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  reportRecipient: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  detailItemText: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  detailItemLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  detailItemVal: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
});
