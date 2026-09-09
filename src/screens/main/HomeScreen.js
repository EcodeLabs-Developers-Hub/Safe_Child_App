import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import {
  subscribeStudentsForUser,
  subscribeAttendance,
  subscribePickups,
  subscribeAlerts,
  subscribeAnnouncements,
  getConnectedChildren
} from '../../services/dataService';

export const HomeScreen = ({ navigation }) => {
  const { userProfile } = useAuth();
  const userName = userProfile?.displayName || 'Campus Member';
  const userRole = userProfile?.role || null;
  const visibleTabs = {
    admin: ['StudentsTab', 'PickupsTab', 'AttendanceTab', 'OperationsTab', 'SecurityTab'],
    teacher: ['StudentsTab', 'PickupsTab', 'AttendanceTab', 'OperationsTab'],
    parent: ['StudentsTab', 'PickupsTab'],
    security: ['SecurityTab'],
    pickup_verifier: ['PickupsTab'],
  }[userRole] || [];
  const canSeeTab = (tabName) => visibleTabs.includes(tabName);

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);

  // Live Firebase Subscriptions
  useEffect(() => {
    const unsubStudents = subscribeStudentsForUser((liveStudents) => {
      setStudents(liveStudents);
    }, userProfile);
    const unsubAttendance = subscribeAttendance((liveAttendance) => {
      setAttendance(liveAttendance);
    }, userProfile);
    const unsubPickups = subscribePickups(setPickups, userProfile);
    const unsubAlerts = subscribeAlerts(setAlerts);
    const unsubAnnouncements = subscribeAnnouncements(setAnnouncements);
    return () => {
      unsubStudents();
      unsubAttendance();
      unsubPickups();
      unsubAlerts();
      unsubAnnouncements();
    };
  }, [userProfile]);

  // Filter children connected to logged-in user
  const connectedChildren = getConnectedChildren(students, userProfile);

  // Helper to get student's live attendance status for today
  const getStudentAttendance = (studentName) => {
    const record = attendance.find(a => (a.name || '').toLowerCase() === studentName.toLowerCase());
    return record ? record.status : 'Unknown';
  };

  const getAttendanceBadgeStyle = (status) => {
    switch (status) {
      case 'Present': return { bg: COLORS.successLight, text: COLORS.success, icon: 'checkmark-circle' };
      case 'Late': return { bg: COLORS.warningLight, text: COLORS.warning, icon: 'time' };
      case 'Absent': return { bg: COLORS.dangerLight, text: COLORS.danger, icon: 'close-circle' };
      default: return { bg: '#f3f4f6', text: COLORS.textMuted, icon: 'help-circle' };
    }
  };

  const getRoleBadgeTitle = (role) => {
    switch (role) {
      case 'admin': return 'CAMPUS SYSTEM ADMINISTRATOR';
      case 'teacher': return 'FACULTY & CLASS TEACHER';
      case 'pickup_verifier': return 'GATE VERIFICATION OFFICER';
      case 'security': return 'CAMPUS SECURITY COMMAND';
      case 'parent': return 'PARENT & GUARDIAN';
      default: return 'ACCOUNT';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Welcome Banner */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeTextCol}>
          <Text style={styles.greetingText}>Welcome back,</Text>
          <Text style={styles.userNameText}>{userName}</Text>
          <Text style={styles.roleSubtext}>
            {getRoleBadgeTitle(userRole)} • EDUCAL COMPLEX
          </Text>
        </View>
        <Avatar 
          uri={userProfile?.photoURL} 
          size={56} 
          onPress={() => navigation.navigate('ProfileTab')}
        />
      </View>

      {/* Connected Children Section (Primary view for parents) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>
          {userRole === 'parent' ? 'My Connected Children' : userRole ? 'Connected Wards & Roster' : 'Account profile unavailable'}
        </Text>
        {canSeeTab('StudentsTab') && (
          <TouchableOpacity onPress={() => navigation.navigate('StudentsTab')}>
            <Text style={styles.viewAllText}>Manage ({connectedChildren.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      {connectedChildren.length === 0 ? (
        <Card style={styles.emptyChildCard}>
          <View style={styles.emptyChildRow}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="people-outline" size={28} color={COLORS.safetyBlue} />
            </View>
            <View style={styles.emptyTextCol}>
              <Text style={styles.emptyChildTitle}>No Children Linked Yet</Text>
              <Text style={styles.emptyChildSub}>
                Link your registered ward or add a new student profile under your parent account.
              </Text>
            </View>
          </View>
          {canSeeTab('StudentsTab') && (
            <Button
              title="Register / Link Child"
              onPress={() => navigation.navigate('StudentsTab')}
              variant="secondary"
              iconName="person-add-outline"
              style={{ marginTop: SPACING.xs }}
            />
          )}
        </Card>
      ) : (
        <View style={styles.childrenListContainer}>
          {connectedChildren.map((child) => {
            const childFullName = `${child.firstName} ${child.lastName}`;
            const attStatus = getStudentAttendance(childFullName);
            const badgeStyle = getAttendanceBadgeStyle(attStatus);

            return (
              <Card key={child.id} style={styles.childCard}>
                <View style={styles.childCardTop}>
                  <Avatar uri={child.photoUri} size={54} />
                  <View style={styles.childInfoCol}>
                    <View style={styles.childNameRow}>
                      <Text style={styles.childName}>{childFullName}</Text>
                      <View style={[styles.attBadge, { backgroundColor: badgeStyle.bg }]}>
                        <Ionicons name={badgeStyle.icon} size={12} color={badgeStyle.text} style={{ marginRight: 3 }} />
                        <Text style={[styles.attBadgeText, { color: badgeStyle.text }]}>{attStatus}</Text>
                      </View>
                    </View>
                    <Text style={styles.childGradeText}>{child.grade} • Educal Complex</Text>
                    <Text style={styles.childTeacherText}>Teacher: {child.teacherName}</Text>
                  </View>
                </View>

                <View style={styles.cardMetaDivider} />

                <View style={styles.childActionRow}>
                  <TouchableOpacity 
                    style={styles.childPrimaryBtn}
                    onPress={() => navigation.navigate('PickupsTab', { studentId: child.id })}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="car-outline" size={16} color={COLORS.white} />
                    <Text style={styles.childPrimaryBtnText}>Request Pickup</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.childSecondaryBtn}
                    onPress={() => setSelectedChild(child)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="person-outline" size={16} color={COLORS.safetyBlue} />
                    <Text style={styles.childSecondaryBtnText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* Quick Action Grid */}
      <Text style={styles.sectionTitle}>System Operations & Shortcuts</Text>
      <View style={styles.gridRow}>
        {canSeeTab('StudentsTab') && <TouchableOpacity
          style={[styles.gridCard, { backgroundColor: '#eff6ff' }]} 
          onPress={() => navigation.navigate('StudentsTab')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#2563eb' }]}>
            <Ionicons name="school-outline" size={24} color={COLORS.white} />
          </View>
          <Text style={styles.gridCardTitle}>Student Registry</Text>
          <Text style={styles.gridCardSub}>View roster & details</Text>
        </TouchableOpacity>}

        {canSeeTab('PickupsTab') && <TouchableOpacity
          style={[styles.gridCard, { backgroundColor: '#f0fdf4' }]} 
          onPress={() => navigation.navigate('PickupsTab')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#16a34a' }]}>
            <Ionicons name="car-outline" size={24} color={COLORS.white} />
          </View>
          <Text style={styles.gridCardTitle}>Pickups & Gate</Text>
          <Text style={styles.gridCardSub}>Requests & PIN lookup</Text>
        </TouchableOpacity>}

        {canSeeTab('AttendanceTab') && <TouchableOpacity
          style={[styles.gridCard, { backgroundColor: '#fefce8' }]} 
          onPress={() => navigation.navigate('AttendanceTab')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#ca8a04' }]}>
            <Ionicons name="clipboard-outline" size={24} color={COLORS.white} />
          </View>
          <Text style={styles.gridCardTitle}>Daily Attendance</Text>
          <Text style={styles.gridCardSub}>Status & teacher notes</Text>
        </TouchableOpacity>}

        {canSeeTab('OperationsTab') && <TouchableOpacity
          style={[styles.gridCard, { backgroundColor: '#faf5ff' }]} 
          onPress={() => navigation.navigate('OperationsTab')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#9333ea' }]}>
            <Ionicons name="bus-outline" size={24} color={COLORS.white} />
          </View>
          <Text style={styles.gridCardTitle}>Campus Ops</Text>
          <Text style={styles.gridCardSub}>Bus routes & PTA</Text>
        </TouchableOpacity>}

        {canSeeTab('SecurityTab') && <TouchableOpacity
          style={[styles.gridCard, { backgroundColor: '#fff1f2' }]} 
          onPress={() => navigation.navigate('SecurityTab')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#dc2626' }]}>
            <Ionicons name="shield-alert-outline" size={24} color={COLORS.white} />
          </View>
          <Text style={styles.gridCardTitle}>Security Hub</Text>
          <Text style={styles.gridCardSub}>Alerts & analytics</Text>
        </TouchableOpacity>}

        <TouchableOpacity 
          style={[styles.gridCard, { backgroundColor: '#f3f4f6' }]} 
          onPress={() => navigation.navigate('ProfileTab')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#4b5563' }]}>
            <Ionicons name="person-outline" size={24} color={COLORS.white} />
          </View>
          <Text style={styles.gridCardTitle}>Profile & Rules</Text>
          <Text style={styles.gridCardSub}>IP & GDPR settings</Text>
        </TouchableOpacity>
      </View>

      {/* Safety Summary Stat Cards */}
      <Text style={styles.sectionTitle}>Campus Live Status</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{attendance.filter((item) => item.status === 'Present').length}</Text>
          <Text style={styles.statLabel}>Students Present</Text>
          <View style={styles.statIndicatorGood} />
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pickups.filter((item) => item.status === 'Pending' || item.status === 'Approved').length}</Text>
          <Text style={styles.statLabel}>Active Pickups</Text>
          <View style={styles.statIndicatorWarn} />
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{alerts.filter((item) => item.status !== 'Resolved').length}</Text>
          <Text style={styles.statLabel}>Unresolved Alerts</Text>
          <View style={styles.statIndicatorSafe} />
        </View>
      </View>

      {/* Bulletins Preview Card */}
      <Card 
        title="School Bulletins & Announcements" 
        headerRight={canSeeTab('OperationsTab') && (
          <TouchableOpacity onPress={() => navigation.navigate('OperationsTab')}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.safetyBlue }}>View All</Text>
          </TouchableOpacity>
        )}
      >
        {announcements.length === 0 ? (
          <Text style={styles.emptyChildSub}>No announcements found.</Text>
        ) : announcements.slice(0, 2).map((announcement) => (
          <View style={styles.announcementItem} key={announcement.id}>
            <View style={styles.bulletDot} />
            <View style={styles.announcementContent}>
              <Text style={styles.announcementTitle}>{announcement.title}</Text>
              <Text style={styles.announcementBody}>{announcement.body}</Text>
              <Text style={styles.announcementTime}>{announcement.date}</Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Child Detail Modal */}
      <Modal visible={!!selectedChild} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedChild && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Child Profile Record</Text>
                  <TouchableOpacity onPress={() => setSelectedChild(null)}>
                    <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailHeaderBox}>
                  <Avatar uri={selectedChild.photoUri} size={70} />
                  <Text style={styles.detailName}>{selectedChild.firstName} {selectedChild.lastName}</Text>
                  <Text style={styles.detailGrade}>{selectedChild.grade} • Educal Complex</Text>
                </View>

                <View style={styles.detailSection}>
                  <View style={styles.detailItem}>
                    <Ionicons name="easel-outline" size={18} color={COLORS.safetyBlue} />
                    <View style={styles.detailItemText}>
                      <Text style={styles.detailItemLabel}>Assigned Class Teacher</Text>
                      <Text style={styles.detailItemVal}>{selectedChild.teacherName}</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <Ionicons name="person-outline" size={18} color={COLORS.safetyBlue} />
                    <View style={styles.detailItemText}>
                      <Text style={styles.detailItemLabel}>Guardian Name</Text>
                      <Text style={styles.detailItemVal}>{selectedChild.guardianName}</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <Ionicons name="mail-outline" size={18} color={COLORS.safetyBlue} />
                    <View style={styles.detailItemText}>
                      <Text style={styles.detailItemLabel}>Guardian Email</Text>
                      <Text style={styles.detailItemVal}>{selectedChild.guardianEmail}</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <Ionicons name="stats-chart-outline" size={18} color={COLORS.success} />
                    <View style={styles.detailItemText}>
                      <Text style={styles.detailItemLabel}>Attendance Rate</Text>
                      <Text style={[styles.detailItemVal, { color: COLORS.success, fontWeight: '800' }]}>
                        {selectedChild.attendanceRate || 'Not available'}
                      </Text>
                    </View>
                  </View>
                </View>

                <Button
                  title="Close Profile"
                  onPress={() => setSelectedChild(null)}
                  variant="secondary"
                  style={{ marginTop: SPACING.md }}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryNavy,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  welcomeTextCol: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  greetingText: {
    fontSize: 13,
    color: '#93c5fd',
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 2,
  },
  roleSubtext: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryNavy,
    marginBottom: SPACING.sm + 2,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: SPACING.lg,
  },
  gridCard: {
    width: '48%',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  gridCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryNavy,
  },
  gridCardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 4,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    position: 'relative',
    ...SHADOWS.small,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primaryNavy,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  statIndicatorGood: {
    height: 3,
    backgroundColor: COLORS.success,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    borderBottomLeftRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
  },
  statIndicatorWarn: {
    height: 3,
    backgroundColor: COLORS.warning,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    borderBottomLeftRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
  },
  statIndicatorSafe: {
    height: 3,
    backgroundColor: COLORS.safetyBlue,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    borderBottomLeftRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
  },
  announcementItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.safetyBlue,
    marginTop: 6,
    marginRight: 10,
  },
  announcementContent: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  announcementBody: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  announcementTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm + 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.safetyBlue,
  },
  emptyChildCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.md,
  },
  emptyChildRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.safetyBlueLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  emptyTextCol: {
    flex: 1,
  },
  emptyChildTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryNavy,
  },
  emptyChildSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  childrenListContainer: {
    marginBottom: SPACING.lg,
    gap: 12,
  },
  childCard: {
    padding: SPACING.md,
  },
  childCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childInfoCol: {
    flex: 1,
    marginLeft: SPACING.sm + 4,
  },
  childNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  childName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryNavy,
  },
  attBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  attBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  childGradeText: {
    fontSize: 12,
    color: COLORS.safetyBlue,
    fontWeight: '600',
    marginTop: 2,
  },
  childTeacherText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cardMetaDivider: {
    height: 1,
    backgroundColor: COLORS.background,
    marginVertical: SPACING.sm,
  },
  childActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  childPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.safetyBlue,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  childPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
    marginLeft: 4,
  },
  childSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.safetyBlueLight,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  childSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.safetyBlue,
    marginLeft: 4,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryNavy,
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

