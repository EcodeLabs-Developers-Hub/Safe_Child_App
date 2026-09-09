import { doc, getDoc, setDoc, collection, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore';
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
    bio: initialData.bio || '',
    role: initialData.role,
    phone: initialData.phone || '',
    photoURL: initialData.photoURL || null, // null triggers default logo avatar
    updatedAt: new Date().toISOString(),
    createdAt: initialData.createdAt || new Date().toISOString()
  };

  if (!db) throw new Error('Firebase database is not configured.');
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, defaultProfile, { merge: true });

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

  if (!db) throw new Error('Firebase database is not configured.');
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const profile = { uid, ...snap.data() };
  const rawCache = await AsyncStorage.getItem(PROFILES_STORAGE_KEY);
  const profiles = rawCache ? JSON.parse(rawCache) : {};
  profiles[uid] = profile;
  await AsyncStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  return profile;
};

export const subscribeUserProfile = (uid, onProfile, onError) => {
  if (!uid || !db) return () => {};

  return onSnapshot(
    doc(db, 'users', uid),
    (snapshot) => onProfile(snapshot.exists() ? { uid, ...snapshot.data() } : null),
    onError
  );
};

/**
 * Updates profile fields (displayName, bio, phone, photoURL, role)
 */
export const updateUserProfile = async (uid, updateFields) => {
  if (!uid) throw new Error('Invalid user ID.');

  const updatedData = {
    ...updateFields,
    updatedAt: serverTimestamp()
  };

  if (!db) throw new Error('Firebase database is not configured.');
  await setDoc(doc(db, 'users', uid), { uid, ...updatedData }, { merge: true });

  // 2. Update AsyncStorage cache
  const rawCache = await AsyncStorage.getItem(PROFILES_STORAGE_KEY);
  const profiles = rawCache ? JSON.parse(rawCache) : {};
  const currentProfile = profiles[uid] || { uid };
  const mergedProfile = { ...currentProfile, ...updateFields, uid, updatedAt: new Date().toISOString() };
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

/**
 * Fetches all registered user profiles (For Admin Role Management)
 */
export const getAllUserProfiles = async () => {
  if (!db) throw new Error('Firebase database is not configured.');
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Reassigns user role (Admin capability)
 */
export const updateUserRole = async (targetUid, newRole) => {
  return await updateUserProfile(targetUid, { role: newRole });
};

