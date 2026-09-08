import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Modal 
} from 'react-native';
import { Card } from '../../components/common/Card';
import { InputField } from '../../components/common/InputField';
import { Button } from '../../components/common/Button';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { subscribeAttendance, updateAttendanceRecord } from '../../services/dataService';

const GRADES = ['All', 'Grade 1A', 'Grade 2A', 'Grade 3C', 'Grade 4B'];

export const AttendanceScreen = () => {
  const [roster, setRoster] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  // Note Modal State
  const [activeNoteStudent, setActiveNoteStudent] = useState(null);
  const [noteText, setNoteText] = useState('');

  // Live Firebase Subscription
  useEffect(() => {
    const unsubscribe = subscribeAttendance((liveRoster) => {
      setRoster(liveRoster);
    });
    return () => unsubscribe();
  }, []);

  const toggleStatus = async (studentId, newStatus) => {
    const existing = roster.find(r => r.id === studentId);
    const note = existing ? (existing.note || '') : '';
    await updateAttendanceRecord(studentId, newStatus, note);
  };

  const handleOpenNoteModal = (student) => {
    setActiveNoteStudent(student);
    setNoteText(student.note || '');
  };

  const handleSaveNote = async () => {
    if (activeNoteStudent) {
      await updateAttendanceRecord(activeNoteStudent.id, activeNoteStudent.status, noteText.trim());
      setActiveNoteStudent(null);
      setNoteText('');
      Alert.alert('Firebase Updated', 'Teacher note saved to Firebase.');
    }
  };

  const handleSaveAttendance = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      Alert.alert('Attendance Synced', 'Today\'s student attendance log is synchronized with Firebase Firestore.');
    }, 500);
  };

  const getBadgeStyle = (status) => {
    switch (status) {
      case 'Present': return { bg: COLORS.successLight, text: COLORS.success };
      case 'Late': return { bg: COLORS.warningLight, text: COLORS.warning };
      case 'Absent': default: return { bg: COLORS.dangerLight, text: COLORS.danger };
    }
  };

  // Filtered Roster
  const filteredRoster = roster.filter(st => {
    const nameMatch = (st.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (st.guardian || '').toLowerCase().includes(searchQuery.toLowerCase());
    const gradeMatch = selectedGrade === 'All' || st.grade === selectedGrade;
    return nameMatch && gradeMatch;
  });

  // Calculate Stats
  const total = roster.length || 1;
  const presentCount = roster.filter(r => r.status === 'Present').length;
  const lateCount = roster.filter(r => r.status === 'Late').length;
  const absentCount = roster.filter(r => r.status === 'Absent').length;

  const presentPct = Math.round((presentCount / total) * 100);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>Daily Attendance Roster</Text>
            <Text style={styles.pageSubtitle}>Class Roster • {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} (Firebase)</Text>
          </View>
          <Button 
            title="Save Log" 
            onPress={handleSaveAttendance} 
            loading={saving}
            iconName="checkmark-done"
            style={styles.saveBtn}
          />
        </View>

        {/* Analytics Summary Card */}
        <Card style={styles.analyticsCard}>
          <View style={styles.statBoxRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: COLORS.success }]}>{presentCount}</Text>
              <Text style={styles.statLbl}>Present ({presentPct}%)</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: COLORS.warning }]}>{lateCount}</Text>
              <Text style={styles.statLbl}>Late Arrival</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: COLORS.danger }]}>{absentCount}</Text>
              <Text style={styles.statLbl}>Absent</Text>
            </View>
          </View>
        </Card>

        {/* Search & Filter Bar */}
        <InputField
          placeholder="Filter roster by student or guardian..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          iconName="search-outline"
          style={{ marginBottom: SPACING.xs }}
        />

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

        {/* Roster Table */}
        <Card title="Attendance Register (Firebase Sync)">
          {filteredRoster.map((student) => (
            <View key={student.id} style={styles.studentRow}>
              <View style={styles.studentHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentSub}>{student.grade} • Guardian: {student.guardian}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.noteIconBtn}
                  onPress={() => handleOpenNoteModal(student)}
                >
                  <Ionicons 
                    name={student.note ? "document-text" : "document-text-outline"} 
                    size={20} 
                    color={student.note ? COLORS.safetyBlue : COLORS.textMuted} 
                  />
                </TouchableOpacity>
              </View>

              {student.note ? (
                <View style={styles.existingNoteBox}>
                  <Text style={styles.existingNoteText}>Note: {student.note}</Text>
                </View>
              ) : null}

              <View style={styles.statusButtonsRow}>
                {['Present', 'Absent', 'Late'].map((st) => {
                  const active = student.status === st;
                  const badge = getBadgeStyle(st);
                  return (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusBtn,
                        active && { backgroundColor: badge.bg, borderColor: badge.text }
                      ]}
                      onPress={() => toggleStatus(student.id, st)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.statusBtnText, active && { color: badge.text, fontWeight: '700' }]}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>

      {/* Teacher Note Modal */}
      <Modal visible={!!activeNoteStudent} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Attendance Note (Firebase)</Text>
              <TouchableOpacity onPress={() => setActiveNoteStudent(null)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {activeNoteStudent && (
              <Text style={styles.studentNoteTitle}>{activeNoteStudent.name} ({activeNoteStudent.grade})</Text>
            )}

            <InputField
              label="Teacher / Guardian Explanation Note"
              value={noteText}
              onChangeText={setNoteText}
              placeholder="e.g. Medical reason, doctor appointment, late transport..."
              iconName="create-outline"
              multiline={true}
              numberOfLines={3}
            />

            <Button
              title="Save Note to Firebase"
              onPress={handleSaveNote}
              iconName="checkmark"
              style={{ marginTop: SPACING.sm }}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
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
  saveBtn: {
    height: 40,
    paddingHorizontal: 12,
  },
  analyticsCard: {
    marginBottom: SPACING.md,
  },
  statBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLbl: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.surfaceBorder,
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
  studentRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  studentSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  noteIconBtn: {
    padding: 6,
  },
  existingNoteBox: {
    backgroundColor: COLORS.safetyBlueLight,
    padding: SPACING.xs + 2,
    borderRadius: RADIUS.sm,
    marginBottom: 8,
  },
  existingNoteText: {
    fontSize: 12,
    color: COLORS.safetyBlue,
    fontStyle: 'italic',
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  statusBtnText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
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
  },
  modalHeader: {
    flexDirection: 'row',
    justify.content: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryNavy,
  },
  studentNoteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.safetyBlue,
    marginBottom: SPACING.md,
  },
});
