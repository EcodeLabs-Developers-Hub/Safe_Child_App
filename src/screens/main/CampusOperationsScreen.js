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
import { 
  subscribeBusSchedules, 
  addBusScheduleRecord, 
  subscribePtaMeetings, 
  addPtaMeetingRecord, 
  updatePtaRsvpRecord, 
  subscribeAnnouncements,
  publishAnnouncementRecord
} from '../../services/dataService';

export const CampusOperationsScreen = () => {
  const { userProfile } = useAuth();
  const userRole = userProfile?.role || null;

  const [activeTab, setActiveTab] = useState('bus'); // 'bus' | 'pta' | 'announcements'
  const [busRoutes, setBusRoutes] = useState([]);
  const [ptaMeetings, setPtaMeetings] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Bus Modal State
  const [busModalVisible, setBusModalVisible] = useState(false);
  const [routeNumber, setRouteNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');

  // PTA Modal State
  const [ptaModalVisible, setPtaModalVisible] = useState(false);
  const [ptaTitle, setPtaTitle] = useState('');
  const [ptaDate, setPtaDate] = useState('');
  const [ptaLocation, setPtaLocation] = useState('');
  const [ptaAgenda, setPtaAgenda] = useState('');

  // Announcement Modal State (Figure 4.16)
  const [annModalVisible, setAnnModalVisible] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annCategory, setAnnCategory] = useState('Urgent');

  // Live Firebase Subscriptions
  useEffect(() => {
    const unsubBus = subscribeBusSchedules(setBusRoutes);
    const unsubPta = subscribePtaMeetings(setPtaMeetings);
    const unsubAnn = subscribeAnnouncements(setAnnouncements);
    return () => {
      unsubBus();
      unsubPta();
      unsubAnn();
    };
  }, []);

  const handleAddBusRoute = async () => {
    if (!routeNumber.trim() || !driverName.trim()) {
      Alert.alert('Required Fields', 'Please enter route details and driver name.');
      return;
    }

    try {
      const newRoute = {
        routeNumber: routeNumber.trim(),
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        departureTime: departureTime.trim(),
        arrivalTime: arrivalTime.trim(),
        status: 'On Time',
        notes: ''
      };

      await addBusScheduleRecord(newRoute);
      setBusModalVisible(false);
      setRouteNumber('');
      setDriverName('');
      setDriverPhone('');
      Alert.alert('Saved to Database', `Bus route ${newRoute.routeNumber} saved to Database Firestore.`);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleAddPtaMeeting = async () => {
    if (!ptaTitle.trim() || !ptaDate.trim()) {
      Alert.alert('Required Fields', 'Please enter meeting title and date/time.');
      return;
    }

    try {
      const newMeeting = {
        title: ptaTitle.trim(),
        date: ptaDate.trim(),
        location: ptaLocation.trim(),
        agenda: ptaAgenda.trim(),
        rsvpStatus: 'Going'
      };

      await addPtaMeetingRecord(newMeeting);
      setPtaModalVisible(false);
      setPtaTitle('');
      setPtaDate('');
      setPtaLocation('');
      setPtaAgenda('');
      Alert.alert('Saved to Database', `Meeting "${newMeeting.title}" broadcasted.`);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handlePublishAnnouncement = async () => {
    if (!annTitle.trim() || !annBody.trim()) {
      Alert.alert('Required Fields', 'Please enter announcement title and body message.');
      return;
    }

    try {
      const newAnn = {
        title: annTitle.trim(),
        body: annBody.trim(),
        category: annCategory,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      await publishAnnouncementRecord(newAnn);
      setAnnModalVisible(false);
      setAnnTitle('');
      setAnnBody('');
      Alert.alert('Saved to Database', 'School announcement published and active for all mobile users.');
    } catch (err) {
      Alert.alert('Publish Error', err.message);
    }
  };

  const toggleRsvp = async (meetingId, newStatus) => {
    try {
      await updatePtaRsvpRecord(meetingId, newStatus);
    } catch (err) {
      Alert.alert('Unable to update RSVP', err.message || 'Please check your connection and try again.');
    }
  };

  const getStatusBadgeColor = (st) => {
    switch (st) {
      case 'On Time': return { bg: COLORS.successLight, text: COLORS.success };
      case 'Delayed': return { bg: COLORS.warningLight, text: COLORS.warning };
      case 'Arrived': default: return { bg: COLORS.infoLight, text: COLORS.info };
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Urgent': return COLORS.danger;
      case 'Events': return COLORS.safetyBlue;
      case 'Academic': default: return COLORS.success;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.pageTitle}>Campus Operations</Text>
            <Text style={styles.pageSubtitle}>Transportation, PTA schedules & bulletins</Text>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'bus' && styles.tabBtnActive]}
            onPress={() => setActiveTab('bus')}
          >
            <Ionicons name="bus-outline" size={16} color={activeTab === 'bus' ? COLORS.white : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'bus' && styles.tabTextActive]}>Bus Schedules</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'pta' && styles.tabBtnActive]}
            onPress={() => setActiveTab('pta')}
          >
            <Ionicons name="calendar-outline" size={16} color={activeTab === 'pta' ? COLORS.white : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'pta' && styles.tabTextActive]}>PTA Meetings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'announcements' && styles.tabBtnActive]}
            onPress={() => setActiveTab('announcements')}
          >
            <Ionicons name="megaphone-outline" size={16} color={activeTab === 'announcements' ? COLORS.white : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'announcements' && styles.tabTextActive]}>Bulletins</Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: BUS SCHEDULES */}
        {activeTab === 'bus' && (
          <View>
            {userRole === 'admin' && (
              <Button
                title="Add New Bus Route"
                onPress={() => setBusModalVisible(true)}
                iconName="add-circle-outline"
                style={{ marginBottom: SPACING.md }}
              />
            )}

            {busRoutes.map((bus) => {
              const badge = getStatusBadgeColor(bus.status);
              return (
                <Card 
                  key={bus.id} 
                  title={bus.routeNumber}
                  headerRight={
                    <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: badge.text }]}>{bus.status}</Text>
                    </View>
                  }
                >
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                    <Text style={styles.detailText}>Driver: <Text style={styles.boldText}>{bus.driverName}</Text></Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                    <Text style={styles.detailText}>Driver Contact: {bus.driverPhone}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                    <Text style={styles.detailText}>Departs: {bus.departureTime} • Expected Arrival: {bus.arrivalTime}</Text>
                  </View>

                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>{bus.notes}</Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.callDriverBtn}
                    onPress={() => Alert.alert('Calling Driver', `Dialing ${bus.driverName} at ${bus.driverPhone}...`)}
                  >
                    <Ionicons name="call" size={14} color={COLORS.safetyBlue} style={{ marginRight: 4 }} />
                    <Text style={styles.callDriverText}>Contact Driver</Text>
                  </TouchableOpacity>
                </Card>
              );
            })}
          </View>
        )}

        {/* TAB 2: PTA MEETINGS */}
        {activeTab === 'pta' && (
          <View>
            {userRole === 'admin' && (
              <Button
                title="Post New PTA Meeting"
                onPress={() => setPtaModalVisible(true)}
                iconName="calendar-number-outline"
                style={{ marginBottom: SPACING.md }}
              />
            )}

            {ptaMeetings.map((pta) => (
              <Card key={pta.id} title={pta.title} subtitle={pta.date}>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={16} color={COLORS.safetyBlue} style={{ marginRight: 6 }} />
                  <Text style={styles.detailText}><Text style={styles.boldText}>{pta.location}</Text></Text>
                </View>

                <Text style={styles.agendaText}>{pta.agenda}</Text>

                <View style={styles.rsvpRow}>
                  <Text style={styles.rsvpLabel}>Your RSVP Status:</Text>
                  <View style={styles.rsvpBtnGroup}>
                    {['Going', 'Interested', 'Declined'].map((st) => (
                      <TouchableOpacity
                        key={st}
                        style={[styles.rsvpChip, pta.rsvpStatus === st && styles.rsvpChipActive]}
                        onPress={() => toggleRsvp(pta.id, st)}
                      >
                        <Text style={[styles.rsvpChipText, pta.rsvpStatus === st && styles.rsvpChipTextActive]}>
                          {st}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* TAB 3: SCHOOL BULLETINS (Figure 4.16: Creation and Display of Announcement) */}
        {activeTab === 'announcements' && (
          <View>
            {(userRole === 'admin' || userRole === 'teacher') && (
              <Button
                title="Publish School Announcement (Figure 4.16)"
                onPress={() => setAnnModalVisible(true)}
                iconName="megaphone-outline"
                style={{ marginBottom: SPACING.md }}
              />
            )}

            {announcements.map((item) => (
              <Card 
                key={item.id} 
                title={item.title} 
                subtitle={item.date}
                headerRight={
                  <View style={[styles.catTag, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
                    <Text style={[styles.catTagText, { color: getCategoryColor(item.category) }]}>
                      {(item.category || '').toUpperCase()}
                    </Text>
                  </View>
                }
              >
                <Text style={styles.bulletinBody}>{item.body}</Text>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Bus Route Modal */}
      <Modal visible={busModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Bus Route Schedule</Text>
              <TouchableOpacity onPress={() => setBusModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <InputField
              label="Route Name & Number"
              value={routeNumber}
              onChangeText={setRouteNumber}
              placeholder="e.g. Route 405 — Spintex Road"
              iconName="bus-outline"
            />

            <InputField
              label="Driver Name"
              value={driverName}
              onChangeText={setDriverName}
              placeholder="e.g. Mr. Kwame Appiah"
              iconName="person-outline"
            />

            <InputField
              label="Driver Phone"
              value={driverPhone}
              onChangeText={setDriverPhone}
              placeholder="e.g. +233 24 555 1234"
              iconName="call-outline"
              keyboardType="phone-pad"
            />

            <InputField
              label="Departure Time"
              value={departureTime}
              onChangeText={setDepartureTime}
              placeholder="e.g. 06:45 AM"
              iconName="time-outline"
            />

            <InputField
              label="Arrival Time"
              value={arrivalTime}
              onChangeText={setArrivalTime}
              placeholder="e.g. 07:35 AM"
              iconName="time-outline"
            />

            <Button
              title="Save Bus Schedule"
              onPress={handleAddBusRoute}
              iconName="checkmark-circle-outline"
              style={{ marginTop: SPACING.sm }}
            />
          </View>
        </View>
      </Modal>

      {/* Add PTA Meeting Modal */}
      <Modal visible={ptaModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post PTA Meeting</Text>
              <TouchableOpacity onPress={() => setPtaModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <InputField
              label="Meeting Title"
              value={ptaTitle}
              onChangeText={setPtaTitle}
              placeholder="e.g. Term 3 Executive PTA Meeting"
              iconName="calendar-outline"
            />

            <InputField
              label="Date & Time"
              value={ptaDate}
              onChangeText={setPtaDate}
              placeholder="e.g. Friday, Sept 25 • 04:30 PM"
              iconName="time-outline"
            />

            <InputField
              label="Location / Venue"
              value={ptaLocation}
              onChangeText={setPtaLocation}
              placeholder="e.g. Main Auditorium & Zoom"
              iconName="location-outline"
            />

            <InputField
              label="Agenda & Topics"
              value={ptaAgenda}
              onChangeText={setPtaAgenda}
              placeholder="Provide meeting agenda..."
              iconName="document-text-outline"
              multiline={true}
              numberOfLines={3}
            />

            <Button
              title="Broadcast PTA Schedule"
              onPress={handleAddPtaMeeting}
              iconName="checkmark-circle-outline"
              style={{ marginTop: SPACING.sm }}
            />
          </View>
        </View>
      </Modal>

      {/* Figure 4.16: Administrator Announcement Creation Modal */}
      <Modal visible={annModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Publish School Announcement (Admin)</Text>
              <TouchableOpacity onPress={() => setAnnModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <InputField
              label="Announcement Title"
              value={annTitle}
              onChangeText={setAnnTitle}
              placeholder="e.g. Mandatory Gate Photo Verification System"
              iconName="megaphone-outline"
            />

            <InputField
              label="Announcement Body Content"
              value={annBody}
              onChangeText={setAnnBody}
              placeholder="Enter announcement text for mobile users..."
              iconName="document-text-outline"
              multiline={true}
              numberOfLines={4}
            />

            <Text style={styles.rsvpLabel}>Category:</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: SPACING.md }}>
              {['Urgent', 'Events', 'Academic'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.rsvpChip, annCategory === cat && styles.rsvpChipActive]}
                  onPress={() => setAnnCategory(cat)}
                >
                  <Text style={[styles.rsvpChipText, annCategory === cat && styles.rsvpChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Publish Notice to Parent Users"
              onPress={handlePublishAnnouncement}
              iconName="paper-plane-outline"
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
  topBar: {
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
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  notesBox: {
    backgroundColor: COLORS.background,
    padding: SPACING.xs + 4,
    borderRadius: RADIUS.sm,
    marginTop: 4,
  },
  notesText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  callDriverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.safetyBlueLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.sm,
  },
  callDriverText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.safetyBlue,
  },
  agendaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginVertical: SPACING.xs,
  },
  rsvpRow: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
  },
  rsvpLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  rsvpBtnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  rsvpChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  rsvpChipActive: {
    backgroundColor: COLORS.safetyBlue,
    borderColor: COLORS.safetyBlue,
  },
  rsvpChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  rsvpChipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  catTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  catTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  bulletinBody: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
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
});
