import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { createUserProfile, getUserProfile } from './profileService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_USER_KEY = '@safe_child_current_session';

/**
 * Maps raw Firebase auth error codes to clear, actionable user messages
 */
export const mapAuthErrorToMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'The email address format is invalid. Please check and try again.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try logging in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This user account has been disabled by an administrator.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a moment and try again.';
    default:
      if (typeof errorCode === 'string' && errorCode.length > 0) {
        return errorCode.replace('auth/', '').replace(/-/g, ' ');
      }
      return 'An unexpected authentication error occurred. Please try again.';
  }
};

/**
 * Sign up a new user with Email, Password, Display Name, and Role (default: parent)
 */
export const signUpUser = async (email, password, displayName, role = 'parent') => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = displayName.trim();

  if (!cleanEmail || !password || !cleanName) {
    throw new Error('Please fill in all required fields.');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  try {
    if (auth && auth.config) {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: cleanName });
      await sendEmailVerification(user);

      const profileData = await createUserProfile(user.uid, {
        uid: user.uid,
        email: cleanEmail,
        displayName: cleanName,
        role: 'parent',
        bio: '',
        photoURL: null,
        createdAt: new Date().toISOString()
      });

      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ uid: user.uid, email: cleanEmail }));
      return { user, profile: profileData };
    } else {
      throw new Error('Firebase Authentication is not configured. Please check your config.');
    }
  } catch (firebaseErr) {
    if (firebaseErr.code && firebaseErr.code.startsWith('auth/')) {
      throw new Error(mapAuthErrorToMessage(firebaseErr.code));
    }
    throw firebaseErr;
  }
};

/**
 * Sign in an existing user with Email and Password strictly using Firebase Auth
 */
export const signInUser = async (email, password) => {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password) {
    throw new Error('Please enter both your email address and password.');
  }

  try {
    if (auth && auth.config) {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;
      let profile = await getUserProfile(user.uid);

      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ uid: user.uid, email: cleanEmail }));
      return { user, profile };
    } else {
      throw new Error('Firebase Authentication is not configured.');
    }
  } catch (firebaseErr) {
    if (firebaseErr.code && firebaseErr.code.startsWith('auth/')) {
      throw new Error(mapAuthErrorToMessage(firebaseErr.code));
    }
    throw firebaseErr;
  }
};

/**
 * Sign out the currently authenticated user
 */
export const signOutAuth = async () => {
  if (!auth) throw new Error('Firebase Authentication is not configured.');
  console.info('Signing out Firebase user:', auth.currentUser?.uid || 'no active user');
  await signOut(auth);
  await AsyncStorage.removeItem(CURRENT_USER_KEY);
};

export const sendVerificationEmail = async () => {
  if (!auth?.currentUser) throw new Error('You must be signed in to request verification.');
  if (auth.currentUser.emailVerified) return false;
  await sendEmailVerification(auth.currentUser);
  return true;
};

/**
 * Send password reset email
 */
export const resetUserPassword = async (email) => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Please enter a valid email address.');
  }

  try {
    if (auth && auth.config) {
      await sendPasswordResetEmail(auth, cleanEmail);
      return true;
    }
  } catch (err) {
    if (err.code) throw new Error(mapAuthErrorToMessage(err.code));
  }

  return true;
};
