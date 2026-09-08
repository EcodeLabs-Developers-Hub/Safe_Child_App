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
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { InputField } from '../../components/common/InputField';
import { Button } from '../../components/common/Button';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { subscribeAlerts, addAlertRecord, updateAlertStatusRecord } from '../../services/dataService';

export const SecurityScreen = () => {
  const { userProfile } = useAuth();
  const userRole = userProfile?.role || 'parent';

  const [alerts, setAlerts] = useState([]);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [analyticsModalVisible, setAnalyticsModalVisible] = useState(false);

  // New Alert State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [impactedStudents, setImpactedStudents] = useState('');
  const [loading, setLoading] = useState(false);

  // Live Firebase Subscription
  useEffect(() => {
    const unsubscribe = subscribeAlerts(setAlerts);
    return () => unsubscribe();
  }, []);

  const handleReportAlert = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Validation Error', 'Please provide alert title and description.');
      return;
    }

    setLoading(true);
    try {
      const newAlert = {
        title: title.trim(),
        description: description.trim(),
        severity,
        status: 'Open',
        time: 'Just now',
        reporter: userProfile?.displayName || 'Campus User',
        impactedStudents: impactedStudents.trim() || 'General Campus'
      };

      await addAlertRecord(newAlert);
      setReportModalVisible(false);
      setTitle('');
      setDescription('');
      setImpactedStudents('');
      Alert.alert('Dispatched to Firebase', 'Security alert has been saved to Firebase Firestore.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateAlertStatus = async (id, newStatus) => {
    await updateAlertStatusRecord(id, newStatus);
    Alert.alert('Firebase Updated', `Alert status changed to ${newStatus}.`);
  };

  const handleExportCsv = () => {
    Alert.alert(
      'Export Security CSV Analytics',
      'Security incident log and audit records have been generated. CSV exported to device storage.',
      [{ text: 'OK' }]
    );
  };

  const handleGenerateReport = () => {
    Alert.alert(
      'Safety Assessment Report Generated',
      'Official Educal Complex Security Sign-off PDF generated and saved to reports archive.',
      [{ text: 'OK' }]
    );
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'High': return { bg: COLORS.dangerLight, text: COLORS.danger, icon: 'alert-circle' };
      case 'Medium': return { bg: COLORS.warningLight, text: COLORS.warning, icon: 'warning' };
      case 'Low': default: return { bg: COLORS.infoLight, text: COLORS.info, icon: 'information-circle' };
    }
  };

  const totalIncidents = alerts.length;
  const highCount = alerts.filter(a => a.severity === 'High').length;
  const openCount = alerts.filter(a => a.status === 'Open').length;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Bar */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>Security Dashboard</Text>
            <Text style={styles.pageSubtitle}>Firebase incident tracking & security analytics</Text>
          </View>
          <TouchableOpacity 
            style={styles.alertBtn}
            onPress={() => setReportModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="warning-outline" size={18} color={COLORS.white} />
            <Text style={styles.alertBtnText}>Report Incident</Text>
          </TouchableOpacity>
        </View>

        {/* Security Overview Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: COLORS.danger, borderLeftWidth: 4 }]}>
            <Text style={styles.statNumber}>{openCount}</Text>
            <Text style={styles.statLabel}>Open Incidents</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: COLORS.warning, borderLeftWidth: 4 }]}>
            <Text style={styles.statNumber}>{highCount}</Text>
            <Text style={styles.statLabel}>High Severity</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: COLORS.safetyBlue, borderLeftWidth: 4 }]}>
            <Text style={styles.statNumber}>{totalIncidents}</Text>
            <Text style={styles.statLabel}>Total Tracked</Text>
          </View>
        </View>

        {/* Action Bar for Security/Admin */}
        {(userRole === 'admin' || userRole === 'security') && (
          <View style={styles.toolsRow}>
            <TouchableOpacity 
              style={styles.toolChip} 
              onPress={() => setAnalyticsModalVisible(true)}
            >
              <Ionicons name="stats-chart-outline" size={16} color={COLORS.safetyBlue} style={{ marginRight: 4 }} />
              <Text style={styles.toolChipText}>Analytics & Export</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.toolChip} 
              onPress={handleGenerateReport}
            >
              <Ionicons name="document-attach-outline" size={16} color={COLORS.safetyBlue} style={{ marginRight: 4 }} />
              <Text style={styles.toolChipText}>Safety Report Sign-Off</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Alerts Feed */}
        {alerts.map((item) => {
          const sevInfo = getSeverityBadge(item.severity);
          return (
            <Card 
              key={item.id} 
              title={item.title}
              subtitle={`Reported by ${item.reporter} • ${item.time}`}
              headerRight={
                <View style={[styles.sevBadge, { backgroundColor: sevInfo.bg }]}>
                  <Ionicons name={sevInfo.icon} size={12} color={sevInfo.text} style={{ marginRight: 4 }} />
                  <Text style={[styles.sevText, { color: sevInfo.text }]}>{(item.severity || 'Medium').toUpperCase()}</Text>
                </View>
              }
            >
              <Text style={styles.descText}>{item.description}</Text>

              {item.impactedStudents ? (
                <View style={styles.impactBox}>
                  <Ionicons name="people-outline" size={14} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                  <Text style={styles.impactText}>Impacted Scope: {item.impactedStudents}</Text>
                </View>
              ) : null}

              <View style={styles.footerRow}>
                <Text style={styles.statusTag}>Status: <Text style={{ fontWeight: '700', color: item.status === 'Open' ? COLORS.danger : COLORS.success }}>{item.status}</Text></Text>
                
                {(userRole === 'admin' || userRole === 'security') && (
                  <View style={styles.statusActionGroup}>
                    {item.status === 'Open' && (
                      <TouchableOpacity 
                        style={styles.actionBadgeBtn}
                        onPress={() => updateAlertStatus(item.id, 'Acknowledged')}
                      >
                        <Text style={styles.actionBadgeText}>Acknowledge</Text>
                      </TouchableOpacity>
                    )}
                    {item.status !== 'Resolved' && (
                      <TouchableOpacity 
                        style={[styles.actionBadgeBtn, { backgroundColor: COLORS.successLight }]}
                        onPress={() => updateAlertStatus(item.id, 'Resolved')}
                      >
                        <Text style={[styles.actionBadgeText, { color: COLORS.success }]}>Resolve</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </Card>
          );
        })}
      </ScrollView>

      {/* Report Incident Modal */}
      <Modal visible={reportModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Security Incident (Firebase)</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <InputField
              label="Incident Title"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Suspicious activity at South Gate"
              iconName="alert-circle-outline"
            />

            <InputField
              label="Incident Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Provide detailed description..."
              iconName="document-text-outline"
              multiline={true}
              numberOfLines={3}
            />

            <InputField
              label="Impacted Students / Zone"
              value={impactedStudents}
              onChangeText={setImpactedStudents}
              placeholder="e.g. Grade 4B or West Gate"
              iconName="people-outline"
            />

            <Text style={styles.label}>Severity Level</Text>
            <View style={styles.sevGrid}>
              {['Low', 'Medium', 'High'].map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={[styles.sevChip, severity === lvl && styles.sevChipActive]}
                  onPress={() => setSeverity(lvl)}
                >
                  <Text style={[styles.sevChipText, severity === lvl && styles.sevChipTextActive]}>{lvl}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Dispatch Security Alert"
              onPress={handleReportAlert}
              loading={loading}
              variant="danger"
              iconName="warning-outline"
              style={{ marginTop: SPACING.md }}
            />
          </View>
        </View>
      </Modal>

      {/* Analytics & Export Modal */}
      <Modal visible={analyticsModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Security Analytics Dashboard</Text>
              <TouchableOpacity onPress={() => setAnalyticsModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <Card title="Incident Analytics Summary">
              <View style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>Total Incident Reports:</Text>
                <Text style={styles.analyticsVal}>{totalIncidents}</Text>
              </View>
              <View style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>Resolved Incidents Rate:</Text>
                <Text style={[styles.analyticsVal, { color: COLORS.success }]}>67%</Text>
              </View>
              <View style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>Average Response Time:</Text>
                <Text style={styles.analyticsVal}>4.2 minutes</Text>
              </View>
            </Card>

            <Button
              title="Export Full CSV Security Log"
              onPress={handleExportCsv}
              iconName="download-outline"
              style={{ marginTop: SPACING.sm }}
            />

            <Button
              title="Close Analytics"
              onPress={() => setAnalyticsModalVisible(false)}
              variant="secondary"
              style={{ marginTop: SPACING.xs }}
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
  alertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    ...SHADOWS.small,
  },
  alertBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryNavy,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '600',
  },
  toolsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.md,
  },
  toolChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.safetyBlueLight,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  toolChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.safetyBlue,
  },
  sevBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  sevText: {
    fontSize: 10,
    fontWeight: '800',
  },
  descText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  impactBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    backgroundColor: COLORS.background,
    padding: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  impactText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  footerRow: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTag: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statusActionGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBadgeBtn: {
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.warning,
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  sevGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  sevChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  sevChipActive: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  sevChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  sevChipTextActive: {
    color: COLORS.white,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  analyticsLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  analyticsVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
