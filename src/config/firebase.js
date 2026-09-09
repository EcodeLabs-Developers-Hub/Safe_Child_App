import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDH5uckDVSQTknkAx35eCJ7YFodDPXeM4g",
  authDomain: "safe-child-app-2a1d0.firebaseapp.com",
  databaseURL: "https://safe-child-app-2a1d0-default-rtdb.firebaseio.com",
  projectId: "safe-child-app-2a1d0",
  storageBucket: "safe-child-app-2a1d0.firebasestorage.app",
  messagingSenderId: "1057703537738",
  appId: "1:1057703537738:web:aa3b43d501cd15a64d4ab3",
  measurementId: "G-C539EB8BGX"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth with React Native AsyncStorage persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (e) {
  try {
    auth = getAuth(app);
  } catch (authErr) {
    console.error('Firebase Auth initialization failed:', authErr);
    throw authErr;
  }
}

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage, firebaseConfig };
