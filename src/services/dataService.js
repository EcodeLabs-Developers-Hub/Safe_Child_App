import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { auth } from '../config/firebase';
import { db } from '../config/firebase';

const requireDatabase = () => {
  if (!db) throw new Error('Firebase database is not configured.');
  if (!auth?.currentUser) throw new Error('You must be signed in to save student records.');
  return db;
};

const subscribeCollection = (collectionName, callback, filters = []) => {
  if (!db) {
    callback([]);
    return () => {};
  }

  const source = filters.length
    ? query(collection(db, collectionName), ...filters)
    : collection(db, collectionName);

  return onSnapshot(
    source,
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    (error) => {
      console.error(`Unable to load ${collectionName}:`, error);
      callback([]);
    }
  );
};

const addRecord = async (collectionName, data) => {
  const reference = await addDoc(collection(requireDatabase(), collectionName), {
    ...data,
    createdByUid: auth.currentUser.uid,
    createdAt: serverTimestamp()
  });
  console.info(`Firebase write succeeded: ${collectionName}/${reference.id}`);
  return { id: reference.id, ...data };
};

const updateRecord = async (collectionName, id, data) => {
  await updateDoc(doc(requireDatabase(), collectionName, id), {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const subscribeStudents = (callback) => subscribeCollection('students', callback);
export const subscribeStudentsForUser = (callback, userProfile) => {
  if (!userProfile) {
    callback([]);
    return () => {};
  }
  if (userProfile?.role !== 'parent') return subscribeStudents(callback);
  return subscribeCollection('students', callback, [where('guardianEmail', '==', userProfile.email)]);
};
export const addStudentRecord = (data) => addRecord('students', data);
export const subscribePickups = (callback, userProfile) => {
  if (!userProfile) {
    callback([]);
    return () => {};
  }
  if (userProfile?.role !== 'parent') return subscribeCollection('pickup_requests', callback);
  return subscribeCollection('pickup_requests', callback, [where('createdByUid', '==', auth.currentUser.uid)]);
};
export const addPickupRequestRecord = async (data) => {
  const database = requireDatabase();
  const reference = await addDoc(collection(database, 'pickup_requests'), {
    ...data,
    createdByUid: auth.currentUser.uid,
    createdAt: serverTimestamp()
  });
  const pinCode = data.pinCode || String(
    [...reference.id].reduce((total, character) => total + character.charCodeAt(0), 0) % 10000
  ).padStart(4, '0');
  if (!data.pinCode) await updateDoc(reference, { pinCode });
  return { id: reference.id, ...data, pinCode };
};
export const updatePickupStatusRecord = (id, status) => updateRecord('pickup_requests', id, { status });
export const subscribeAuthorizedContacts = (callback, userProfile) => {
  if (!userProfile) {
    callback([]);
    return () => {};
  }
  if (userProfile?.role !== 'parent') return subscribeCollection('authorized_contacts', callback);
  return subscribeCollection('authorized_contacts', callback, [where('createdByUid', '==', auth.currentUser.uid)]);
};
export const addAuthorizedContactRecord = (data) => addRecord('authorized_contacts', data);
export const subscribeAttendance = (callback, userProfile) => {
  if (!userProfile) {
    callback([]);
    return () => {};
  }
  if (userProfile?.role !== 'parent') return subscribeCollection('attendance', callback);
  return subscribeCollection('attendance', callback, [where('guardianEmail', '==', userProfile.email)]);
};
export const updateAttendanceRecord = (id, status, note = '') => updateRecord('attendance', id, { status, note });
export const subscribeAlerts = (callback) => subscribeCollection('alerts', callback);
export const addAlertRecord = (data) => addRecord('alerts', data);
export const updateAlertStatusRecord = (id, status) => updateRecord('alerts', id, { status });
export const subscribeBusSchedules = (callback) => subscribeCollection('bus_schedules', callback);
export const addBusScheduleRecord = (data) => addRecord('bus_schedules', data);
export const subscribePtaMeetings = (callback) => subscribeCollection('pta_meetings', callback);
export const addPtaMeetingRecord = (data) => addRecord('pta_meetings', data);
export const updatePtaRsvpRecord = (id, rsvpStatus) => updateRecord('pta_meetings', id, { rsvpStatus });
export const subscribeAnnouncements = (callback) => subscribeCollection('announcements', callback);
export const publishAnnouncementRecord = (data) => addRecord('announcements', data);
export const subscribePickupAudits = (callback, userProfile) => {
  if (!userProfile) {
    callback([]);
    return () => {};
  }
  if (userProfile?.role === 'parent') {
    callback([]);
    return () => {};
  }
  return subscribeCollection('pickup_audits', callback);
};
export const addPickupAuditRecord = (data) => addRecord('pickup_audits', data);
export const subscribeIpBlocks = (callback) => subscribeCollection('ip_blocks', callback);
export const addIpBlockRecord = (data) => addRecord('ip_blocks', data);
export const removeIpBlockRecord = async (id) => deleteDoc(doc(requireDatabase(), 'ip_blocks', id));

export const getConnectedChildren = (studentsList = [], userProfile = null) => {
  if (!userProfile) return [];
  const userEmail = (userProfile.email || '').toLowerCase().trim();
  const userName = (userProfile.displayName || '').toLowerCase().trim();

  return studentsList.filter((student) => {
    const guardianEmail = (student.guardianEmail || '').toLowerCase().trim();
    const guardianName = (student.guardianName || '').toLowerCase().trim();
    return (userEmail && guardianEmail === userEmail) ||
      (userName && guardianName && guardianName === userName);
  });
};