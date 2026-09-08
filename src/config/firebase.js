import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your actual Firebase Project Config from Firebase Console
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

// Initialize Firebase App singleton safely
let app;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (err) {
    console.warn("Firebase initialization warning:", err.message);
  }
} else {
  app = getApp();
}

// Initialize Firebase Auth with React Native AsyncStorage persistence
let auth;
try {
  if (app) {
    auth = getAuth(app);
  }
} catch (e) {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (authErr) {
    console.warn("Auth initialization fallback:", authErr);
  }
}

// Initialize Firestore Database
let db = null;
if (app) {
  try {
    db = getFirestore(app);
  } catch (dbErr) {
    console.warn("Firestore initialization fallback:", dbErr);
  }
}

export { app, auth, db };
