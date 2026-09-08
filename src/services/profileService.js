import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const PROFILES_STORAGE_KEY = '@safe_child_user_profiles_v1';

/**
 * Creates or overwrites user profile document linked to UID
 */
export const createUserProfile = async (uid, initialData) => {
  const defaultProfile = {
    uid,
    displayName: initialData.displayName || 'Safe Child User',
    email: initialData.email || '',
    bio: initialData.bio || 'Safe Child campus member.',
    role: initialData.role || 'parent',
    phone: initialData.phone || '',
    photoURL: initialData.photoURL || null, // null triggers default logo avatar
    updatedAt: new Date().toISOString(),
    createdAt: initialData.createdAt || new Date().toISOString()
  };

  // 1. Try Firestore persistence
  try {
    if (db) {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, defaultProfile, { merge: true });
    }
  } catch (err) {
    console.warn('Firestore profile save notice:', err.message);
  }

  // 2. Always sync to local AsyncStorage cache for instant offline responsiveness
  try {
    const rawCache = await AsyncStorage.getItem(PROFILES_STORAGE_KEY);
    const profiles = rawCache ? JSON.parse(rawCache) : {};
    profiles[uid] = { ...profiles[uid], ...defaultProfile };
    await AsyncStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  } catch (cacheErr) {
    console.warn('AsyncStorage cache error:', cacheErr);
  }

  return defaultProfile;
};

/**
 * Fetches profile by user UID
 */
export const getUserProfile = async (uid) => {
  if (!uid) return null;

  // 1. Check local AsyncStorage cache first for immediate load
  let cachedProfile = null;
  try {
    const rawCache = await AsyncStorage.getItem(PROFILES_STORAGE_KEY);
    if (rawCache) {
      const profiles = JSON.parse(rawCache);
      cachedProfile = profiles[uid];
    }
  } catch (e) {
    console.warn('Cache read error:', e);
  }

  // 2. Fetch fresh data from Firestore
  try {
    if (db) {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const firestoreData = snap.data();
        // Update local cache
        const rawCache = await AsyncStorage.getItem(PROFILES_STORAGE_KEY);
        const profiles = rawCache ? JSON.parse(rawCache) : {};
        profiles[uid] = firestoreData;
        await AsyncStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
        return firestoreData;
      }
    }
  } catch (err) {
    console.warn('Firestore profile fetch notice:', err.message);
  }

  if (cachedProfile) {
    return cachedProfile;
  }

  // Generate fallback default profile if none exists yet
  return {
    uid,
    displayName: 'User',
    email: '',
    bio: 'Safe Child app member.',
    role: 'parent',
    photoURL: null,
    updatedAt: new Date().toISOString()
  };
};

/**
 * Updates profile fields (displayName, bio, phone, photoURL, role)
 */
export const updateUserProfile = async (uid, updateFields) => {
  if (!uid) throw new Error('Invalid user ID.');

  const updatedData = {
    ...updateFields,
    updatedAt: new Date().toISOString()
  };

  // 1. Update Firestore
  try {
    if (db) {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, updatedData);
    }
  } catch (err) {
    console.warn('Firestore update warning:', err.message);
  }

  // 2. Update AsyncStorage cache
  const rawCache = await AsyncStorage.getItem(PROFILES_STORAGE_KEY);
  const profiles = rawCache ? JSON.parse(rawCache) : {};
  const currentProfile = profiles[uid] || { uid };
  const mergedProfile = { ...currentProfile, ...updatedData };
  profiles[uid] = mergedProfile;
  await AsyncStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));

  return mergedProfile;
};

/**
 * Launches device photo picker using Expo ImagePicker and updates user avatar URL
 */
export const pickProfileImage = async (uid) => {
  // Request media library permission
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (permissionResult.granted === false) {
    throw new Error('Permission to access camera roll is required to upload a profile picture.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    const selectedUri = result.assets[0].uri;
    
    // Save photo URL in user profile
    const updatedProfile = await updateUserProfile(uid, { photoURL: selectedUri });
    return updatedProfile;
  }

  return null;
};

/**
 * Resets profile picture back to default app logo avatar
 */
export const resetProfileImageToDefault = async (uid) => {
  return await updateUserProfile(uid, { photoURL: null });
};
