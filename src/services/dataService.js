import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local storage backup keys for offline resilience
const CACHE_KEYS = {
  STUDENTS: '@safe_child_cache_students',
  PICKUPS: '@safe_child_cache_pickups',
  CONTACTS: '@safe_child_cache_contacts',
  ATTENDANCE: '@safe_child_cache_attendance',
  ALERTS: '@safe_child_cache_alerts',
  BUS: '@safe_child_cache_bus',
  PTA: '@safe_child_cache_pta',
  ANNOUNCEMENTS: '@safe_child_cache_announcements',
  IP_BLOCKS: '@safe_child_cache_ip_blocks'
};

// Initial Seed Data for automatic Firebase Firestore database initialization
const SEED_DATA = {
  students: [
    {
      firstName: 'Ethan',
      lastName: 'Vance',
      grade: 'Grade 4B',
      guardianName: 'Eleanor Vance',
      guardianEmail: 'ecode517@gmail.com',
      guardianPhone: '+1 555-0182',
      teacherName: 'Mr. Joshua Ofori',
      status: 'Active',
      photoUri: null,
      attendanceRate: '96%',
      emergencyContact: '+1 555-0199 (Father)',
      createdAt: new Date().toISOString()
    },
    {
      firstName: 'Maya',
      lastName: 'Vance',
      grade: 'Grade 1A',
      guardianName: 'Eleanor Vance',
      guardianEmail: 'ecode517@gmail.com',
      guardianPhone: '+1 555-0182',
      teacherName: 'Mrs. Selina Awuah',
      status: 'Active',
      photoUri: null,
      attendanceRate: '98%',
      emergencyContact: '+1 555-0199 (Father)',
      createdAt: new Date().toISOString()
    },
    {
      firstName: 'Lucas',
      lastName: 'Ofori',
      grade: 'Grade 4B',
      guardianName: 'Joshua Ofori',
      guardianEmail: 'joshuaofori879@gmail.com',
      guardianPhone: '+1 555-0144',
      teacherName: 'Mr. Kingsley Mintah',
      status: 'Active',
      photoUri: null,
      attendanceRate: '91%',
      emergencyContact: '+1 555-0177 (Mother)',
      createdAt: new Date().toISOString()
    },
    {
      firstName: 'Sophia',
      lastName: 'Mintah',
      grade: 'Grade 3C',
      guardianName: 'Kingsley Mintah',
      guardianEmail: 'kingsleyeshunmintah@gmail.com',
      guardianPhone: '+1 555-0111',
      teacherName: 'Mrs. Selina Awuah',
      status: 'Active',
      photoUri: null,
      attendanceRate: '89%',
      emergencyContact: '+1 555-0122 (Aunt)',
      createdAt: new Date().toISOString()
    },
    {
      firstName: 'Daniel',
      lastName: 'Awuah',
      grade: 'Grade 2A',
      guardianName: 'Selina Awuah',
      guardianEmail: 'awuahselinabaffour@gmail.com',
      guardianPhone: '+1 555-0155',
      teacherName: 'Mr. Joshua Ofori',
      status: 'Active',
      photoUri: null,
      attendanceRate: '100%',
      emergencyContact: '+1 555-0188 (Father)',
      createdAt: new Date().toISOString()
    }
  ],
  pickup_requests: [
    {
      studentName: 'Ethan Vance (Grade 4B)',
      pickupName: 'Sarah Vance (Aunt)',
      pickupPhone: '+1 555-0182',
      status: 'Approved',
      time: '03:30 PM Today',
      pinCode: '7482',
      notes: 'Authorized family member with photo ID.',
      imageUri: null,
      createdAt: new Date().toISOString()
    },
    {
      studentName: 'Maya Vance (Grade 1A)',
      pickupName: 'Robert Vance (Father)',
      pickupPhone: '+1 555-0199',
      status: 'Verified',
      time: '02:45 PM Today',
      pinCode: '9103',
      notes: 'Primary parent pickup.',
      imageUri: null,
      createdAt: new Date().toISOString()
    }
  ],
  authorized_contacts: [
    {
      name: 'Sarah Vance',
      relation: 'Aunt',
      phone: '+1 555-0182',
      status: 'Active',
      photoUri: null
    },
    {
      name: 'Robert Vance',
      relation: 'Father / Co-Guardian',
      phone: '+1 555-0199',
      status: 'Active',
      photoUri: null
    }
  ],
  attendance: [
    { name: 'Ethan Vance', grade: 'Grade 4B', status: 'Present', guardian: 'Eleanor Vance', note: '' },
    { name: 'Maya Vance', grade: 'Grade 1A', status: 'Present', guardian: 'Eleanor Vance', note: '' },
    { name: 'Lucas Ofori', grade: 'Grade 4B', status: 'Late', guardian: 'Joshua Ofori', note: 'Arrived at 08:20 AM due to traffic.' },
    { name: 'Sophia Mintah', grade: 'Grade 3C', status: 'Absent', guardian: 'Kingsley Mintah', note: 'Excused for dental appointment.' },
    { name: 'Daniel Awuah', grade: 'Grade 2A', status: 'Present', guardian: 'Selina Awuah', note: '' }
  ],
  alerts: [
    {
      title: 'Unidentified Vehicle at West Gate',
      description: 'Vehicle parked near pickup bay without authorized campus pass.',
      severity: 'Medium',
      status: 'Acknowledged',
      time: '10 mins ago',
      reporter: 'Campus Gate Security',
      impactedStudents: 'Ethan Vance, Maya Vance',
      createdAt: new Date().toISOString()
    },
    {
      title: 'Severe Weather Warning',
      description: 'Heavy rain expected during afternoon dismissal. All indoor pickups active.',
      severity: 'Low',
      status: 'Resolved',
      time: '2 hours ago',
      reporter: 'Safety Admin',
      impactedStudents: 'All Campus Students',
      createdAt: new Date().toISOString()
    }
  ],
  bus_schedules: [
    {
      routeNumber: 'Route 101 — North Ridge & Cantonments',
      driverName: 'Mr. Emmanuel Mensah',
      driverPhone: '+233 24 555 0192',
      departureTime: '06:45 AM',
      arrivalTime: '07:30 AM',
      status: 'On Time',
      notes: 'Stops at Ridge Hospital junction & Airport Residential.'
    },
    {
      routeNumber: 'Route 204 — East Legon & Spintex',
      driverName: 'Mr. David Boateng',
      driverPhone: '+233 20 888 4120',
      departureTime: '06:30 AM',
      arrivalTime: '07:35 AM',
      status: 'Delayed',
      notes: 'Slight traffic delay along Accra Mall bypass.'
    }
  ],
  pta_meetings: [
    {
      title: 'Term 3 General PTA Conference',
      date: 'Friday, Sept 18, 2026 • 04:00 PM',
      location: 'Main Assembly Auditorium & Zoom Stream',
      agenda: 'Campus security system review, student pickup protocol upgrades, and annual sports day budget approval.',
      rsvpStatus: 'Going'
    }
  ],
  announcements: [
    {
      title: 'Mandatory Gate Photo Verification System',
      body: 'All parents are reminded that starting Monday, campus gate security verifiers will strictly match recipient photo proofs before student release.',
      date: 'Today • Campus Safety Board',
      category: 'Urgent'
    },
    {
      title: 'Inter-House Athletics Championship',
      body: 'Join us this Saturday at 09:00 AM for the annual campus sports meet. Refreshments and spectator seats available.',
      date: 'Yesterday • Sports Dept',
      category: 'Events'
    }
  ],
  ip_blocks: [
    { ip: '197.210.12.9', reason: 'Repeated failed login brute-force attempts', date: 'Sept 04, 2026' }
  ]
};

/**
 * Helper to update local cache
 */
const updateLocalCache = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Cache write error [${key}]:`, err);
  }
};

/**
 * Helper to get local cache
 */
const getLocalCache = async (key, fallback = []) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};

/**
 * Auto seed Firestore collection if empty
 */
const autoSeedCollection = async (collectionName, seedItems) => {
  if (!db) return;
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      for (const item of seedItems) {
        await addDoc(colRef, item);
      }
    }
  } catch (err) {
    console.warn(`Auto seed notice [${collectionName}]:`, err.message);
  }
};

// ==========================================
// 1. STUDENTS SERVICE
// ==========================================
export const subscribeStudents = (callback) => {
  if (db) {
    autoSeedCollection('students', SEED_DATA.students);
    const colRef = collection(db, 'students');
    return onSnapshot(colRef, 
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateLocalCache(CACHE_KEYS.STUDENTS, list);
        callback(list);
      },
      async (err) => {
        console.warn("Firestore Students sub notice:", err.message);
        const cached = await getLocalCache(CACHE_KEYS.STUDENTS, SEED_DATA.students);
        callback(cached);
      }
    );
  } else {
    getLocalCache(CACHE_KEYS.STUDENTS, SEED_DATA.students).then(callback);
    return () => {};
  }
};

export const addStudentRecord = async (studentData) => {
  const item = { ...studentData, createdAt: new Date().toISOString() };
  if (db) {
    try {
      const docRef = await addDoc(collection(db, 'students'), item);
      return { id: docRef.id, ...item };
    } catch (err) {
      console.warn("Firestore addStudent warning:", err.message);
    }
  }
  const cached = await getLocalCache(CACHE_KEYS.STUDENTS, SEED_DATA.students);
  const newItem = { id: 'st_' + Date.now(), ...item };
  const updated = [newItem, ...cached];
  await updateLocalCache(CACHE_KEYS.STUDENTS, updated);
  return newItem;
};

// ==========================================
// 2. PICKUP REQUESTS & AUTHORIZED CONTACTS SERVICE
// ==========================================
export const subscribePickups = (callback) => {
  if (db) {
    autoSeedCollection('pickup_requests', SEED_DATA.pickup_requests);
    const colRef = collection(db, 'pickup_requests');
    return onSnapshot(colRef,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateLocalCache(CACHE_KEYS.PICKUPS, list);
        callback(list);
      },
      async (err) => {
        const cached = await getLocalCache(CACHE_KEYS.PICKUPS, SEED_DATA.pickup_requests);
        callback(cached);
      }
    );
  } else {
    getLocalCache(CACHE_KEYS.PICKUPS, SEED_DATA.pickup_requests).then(callback);
    return () => {};
  }
};

export const addPickupRequestRecord = async (requestData) => {
  const item = { ...requestData, createdAt: new Date().toISOString() };
  if (db) {
    try {
      const docRef = await addDoc(collection(db, 'pickup_requests'), item);
      return { id: docRef.id, ...item };
    } catch (err) {
      console.warn("Firestore addPickup warning:", err.message);
    }
  }
  const cached = await getLocalCache(CACHE_KEYS.PICKUPS, SEED_DATA.pickup_requests);
  const newItem = { id: 'req_' + Date.now(), ...item };
  const updated = [newItem, ...cached];
  await updateLocalCache(CACHE_KEYS.PICKUPS, updated);
  return newItem;
};

export const updatePickupStatusRecord = async (requestId, status) => {
  if (db) {
    try {
      const docRef = doc(db, 'pickup_requests', requestId);
      await updateDoc(docRef, { status, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.warn("Firestore updatePickupStatus warning:", err.message);
    }
  }
  const cached = await getLocalCache(CACHE_KEYS.PICKUPS, SEED_DATA.pickup_requests);
  const updated = cached.map(p => p.id === requestId ? { ...p, status } : p);
  await updateLocalCache(CACHE_KEYS.PICKUPS, updated);
};

export const subscribeAuthorizedContacts = (callback) => {
  if (db) {
    autoSeedCollection('authorized_contacts', SEED_DATA.authorized_contacts);
    const colRef = collection(db, 'authorized_contacts');
    return onSnapshot(colRef,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateLocalCache(CACHE_KEYS.CONTACTS, list);
        callback(list);
      },
      async () => {
        const cached = await getLocalCache(CACHE_KEYS.CONTACTS, SEED_DATA.authorized_contacts);
        callback(cached);
      }
    );
  } else {
    getLocalCache(CACHE_KEYS.CONTACTS, SEED_DATA.authorized_contacts).then(callback);
    return () => {};
  }
};

export const addAuthorizedContactRecord = async (contactData) => {
  const item = { ...contactData, createdAt: new Date().toISOString() };
  if (db) {
    try {
      const docRef = await addDoc(collection(db, 'authorized_contacts'), item);
      return { id: docRef.id, ...item };
    } catch (err) {
      console.warn("Firestore addContact warning:", err.message);
    }
  }
  const cached = await getLocalCache(CACHE_KEYS.CONTACTS, SEED_DATA.authorized_contacts);
  const newItem = { id: 'auth_' + Date.now(), ...item };
  const updated = [newItem, ...cached];
  await updateLocalCache(CACHE_KEYS.CONTACTS, updated);
  return newItem;
};

// ==========================================
// 3. DAILY ATTENDANCE SERVICE
// ==========================================
export const subscribeAttendance = (callback) => {
  if (db) {
    autoSeedCollection('attendance', SEED_DATA.attendance);
    const colRef = collection(db, 'attendance');
    return onSnapshot(colRef,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateLocalCache(CACHE_KEYS.ATTENDANCE, list);
        callback(list);
      },
      async () => {
        const cached = await getLocalCache(CACHE_KEYS.ATTENDANCE, SEED_DATA.attendance);
        callback(cached);
      }
    );
  } else {
    getLocalCache(CACHE_KEYS.ATTENDANCE, SEED_DATA.attendance).then(callback);
    return () => {};
  }
};

export const updateAttendanceRecord = async (id, status, note = '') => {
  if (db) {
    try {
      const docRef = doc(db, 'attendance', id);
      await updateDoc(docRef, { status, note, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.warn("Firestore updateAttendance warning:", err.message);
    }
  }
  const cached = await getLocalCache(CACHE_KEYS.ATTENDANCE, SEED_DATA.attendance);
  const updated = cached.map(item => item.id === id ? { ...item, status, note } : item);
  await updateLocalCache(CACHE_KEYS.ATTENDANCE, updated);
};

// ==========================================
// 4. SECURITY ALERTS SERVICE
// ==========================================
export const subscribeAlerts = (callback) => {
  if (db) {
    autoSeedCollection('alerts', SEED_DATA.alerts);
    const colRef = collection(db, 'alerts');
    return onSnapshot(colRef,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateLocalCache(CACHE_KEYS.ALERTS, list);
        callback(list);
      },
      async () => {
        const cached = await getLocalCache(CACHE_KEYS.ALERTS, SEED_DATA.alerts);
        callback(cached);
      }
    );
  } else {
    getLocalCache(CACHE_KEYS.ALERTS, SEED_DATA.alerts).then(callback);
    return () => {};
  }
};

export const addAlertRecord = async (alertData) => {
  const item = { ...alertData, createdAt: new Date().toISOString() };
  if (db) {
    try {
      const docRef = await addDoc(collection(db, 'alerts'), item);
      return { id: docRef.id, ...item };
    } catch (err) {
      console.warn("Firestore addAlert warning:", err.message);
    }
  }
  const cached = await getLocalCache(CACHE_KEYS.ALERTS, SEED_DATA.alerts);
  const newItem = { id: 'alt_' + Date.now(), ...item };
  const updated = [newItem, ...cached];
  await updateLocalCache(CACHE_KEYS.ALERTS, updated);
  return newItem;
};

export const updateAlertStatusRecord = async (alertId, status) => {
  if (db) {
    try {
      const docRef = doc(db, 'alerts', alertId);
      await updateDoc(docRef, { status, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.warn("Firestore updateAlertStatus warning:", err.message);
    }
  }
  const cached = await getLocalCache(CACHE_KEYS.ALERTS, SEED_DATA.alerts);
  const updated = cached.map(a => a.id === alertId ? { ...a, status } : a);
  await updateLocalCache(CACHE_KEYS.ALERTS, updated);
};

// ==========================================
// 5. CAMPUS OPERATIONS (BUS, PTA, ANNOUNCEMENTS)
// ==========================================
export const subscribeBusSchedules = (callback) => {
  if (db) {
    autoSeedCollection('bus_schedules', SEED_DATA.bus_schedules);
    const colRef = collection(db, 'bus_schedules');
    return onSnapshot(colRef,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateLocalCache(CACHE_KEYS.BUS, list);
        callback(list);
      },
      async () => {
        const cached = await getLocalCache(CACHE_KEYS.BUS, SEED_DATA.bus_schedules);
        callback(cached);
      }
    );
  } else {
    getLocalCache(CACHE_KEYS.BUS, SEED_DATA.bus_schedules).then(callback);
    return () => {};
  }
};

export const addBusScheduleRecord = async (busData) => {
  const item = { ...busData, createdAt: new Date().toISOString() };
  if (db) {
    try {
      const docRef = await addDoc(collection(db, 'bus_schedules'), item);
      return { id: docRef.id, ...item };
    } catch (err) {
      console.warn("Firestore addBusSchedule warning:", err.message);
    }
  }
  const cached = await getLocalCache(CACHE_KEYS.BUS, SEED_DATA.bus_schedules);
  const newItem = { id: 'bus_' + Date.now(), ...item };
  const updated = [newItem, ...cached];
  await updateLocalCache(CACHE_KEYS.BUS, updated);
  return newItem;
};

export const subscribePtaMeetings = (callback) => {
  if (db) {
    autoSeedCollection('pta_meetings', SEED_DATA.pta_meetings);
    const colRef = collection(db, 'pta_meetings');
    return onSnapshot(colRef,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateLocalCache(CACHE_KEYS.PTA, list);
        callback(list);
      },
      async () => {
        const cached = await getLocalCache(CACHE_KEYS.PTA, SEED_DATA.pta_meetings);
        callback(cached);
      }
    );
  } else {
    getLocalCache(CACHE_KEYS.PTA, SEED_DATA.pta_meetings).then(callback);
    return () => {};
  }
};

export const addPtaMeetingRecord = async (ptaData) => {
  const item = { ...ptaData, createdAt: new Date().toISOString() };
  if (db) {
    try {
      const docRef = await addDoc(collection(db, 'pta_meetings'), item);
      return { id: docRef.id, ...item };
    } catch (err) {
      console.warn("Firestore addPta warning:", err.message);
    }
  }
  const cached = await getLocalCache(CACHE_KEYS.PTA, SEED_DATA.pta_meetings);
  const newItem = { id: 'pta_' + Date.now(), ...item };
  const updated = [newItem, ...cached];
  await updateLocalCache(CACHE_KEYS.PTA, updated);
  return newItem;
};

export const updatePtaRsvpRecord = async (meetingId, rsvpStatus) => {
  if (db) {
    try {
      const docRef = doc(db, 'pta_meetings', meetingId);
      await updateDoc(docRef, { rsvpStatus });
    } catch (err) {
      console.warn("Firestore updatePtaRsvp warning:", err.message);
    }
  }
  const cached = await getLocalCache(CACHE_KEYS.PTA, SEED_DATA.pta_meetings);
  const updated = cached.map(m => m.id === meetingId ? { ...m, rsvpStatus } : m);
  await updateLocalCache(CACHE_KEYS.PTA, updated);
};

export const subscribeAnnouncements = (callback) => {
  if (db) {
    autoSeedCollection('announcements', SEED_DATA.announcements);
    const colRef = collection(db, 'announcements');
    return onSnapshot(colRef,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateLocalCache(CACHE_KEYS.ANNOUNCEMENTS, list);
        callback(list);
      },
      async () => {
        const cached = await getLocalCache(CACHE_KEYS.ANNOUNCEMENTS, SEED_DATA.announcements);
        callback(cached);
      }
    );
  } else {
    getLocalCache(CACHE_KEYS.ANNOUNCEMENTS, SEED_DATA.announcements).then(callback);
    return () => {};
  }
};

// ==========================================
// 6. NETWORK IP FIREWALL SERVICE
// ==========================================
export const subscribeIpBlocks = (callback) => {
  if (db) {
    autoSeedCollection('ip_blocks', SEED_DATA.ip_blocks);
    const colRef = collection(db, 'ip_blocks');
    return onSnapshot(colRef,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateLocalCache(CACHE_KEYS.IP_BLOCKS, list);
        callback(list);
      },
      async () => {
        const cached = await getLocalCache(CACHE_KEYS.IP_BLOCKS, SEED_DATA.ip_blocks);
        callback(cached);
      }
    );
  } else {
    getLocalCache(CACHE_KEYS.IP_BLOCKS, SEED_DATA.ip_blocks).then(callback);
    return () => {};
  }
};

export const addIpBlockRecord = async (ipData) => {
  const item = { ...ipData, createdAt: new Date().toISOString() };
  if (db) {
    try {
      const docRef = await addDoc(collection(db, 'ip_blocks'), item);
      return { id: docRef.id, ...item };
    } catch (err) {
      console.warn("Firestore addIpBlock warning:", err.message);
    }
  }
  const cached = await getLocalCache(CACHE_KEYS.IP_BLOCKS, SEED_DATA.ip_blocks);
  const newItem = { id: 'ip_' + Date.now(), ...item };
  const updated = [newItem, ...cached];
  await updateLocalCache(CACHE_KEYS.IP_BLOCKS, updated);
  return newItem;
};

export const removeIpBlockRecord = async (id) => {
  if (db) {
    try {
      await deleteDoc(doc(db, 'ip_blocks', id));
    } catch (err) {
      console.warn("Firestore removeIpBlock warning:", err.message);
    }
  }
  const cached = await getLocalCache(CACHE_KEYS.IP_BLOCKS, SEED_DATA.ip_blocks);
  const updated = cached.filter(x => x.id !== id);
  await updateLocalCache(CACHE_KEYS.IP_BLOCKS, updated);
};

// ==========================================
// 7. CONNECTED CHILDREN HELPER
// ==========================================
export const getConnectedChildren = (studentsList = [], userProfile = null) => {
  if (!userProfile) return [];
  const userEmail = (userProfile.email || '').toLowerCase().trim();
  const userName = (userProfile.displayName || '').toLowerCase().trim();

  return studentsList.filter(st => {
    const gEmail = (st.guardianEmail || '').toLowerCase().trim();
    const gName = (st.guardianName || '').toLowerCase().trim();

    // Direct email match
    if (userEmail && (gEmail === userEmail || (gEmail === 'parent@example.com' && userEmail === 'ecode517@gmail.com'))) {
      return true;
    }
    // Direct name match or partial name match
    if (userName && gName && (gName.includes(userName) || userName.includes(gName))) {
      return true;
    }
    // Fallback for demo parent account
    if (userProfile.role === 'parent' && (userEmail === 'ecode517@gmail.com' || gEmail === userEmail)) {
      return true;
    }
    return false;
  });
};

