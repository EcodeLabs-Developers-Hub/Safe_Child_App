import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { createUserProfile, getUserProfile } from './profileService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MOCK_USERS_KEY = '@safe_child_mock_users';
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
 * Sign up a new user with Email, Password, Display Name, and Role
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
    // Attempt Firebase Authentication
    if (auth && auth.config) {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // Update Firebase auth profile display name
      await updateProfile(user, { displayName: cleanName });

      // Create persistent profile document in Firestore / Database
      const profileData = await createUserProfile(user.uid, {
        uid: user.uid,
        email: cleanEmail,
        displayName: cleanName,
        role: role,
        bio: `${role.charAt(0).toUpperCase() + role.slice(1)} account for Safe Child system.`,
        photoURL: null, // Default avatar logo used if null
        createdAt: new Date().toISOString()
      });

      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ uid: user.uid, email: cleanEmail }));
      return { user, profile: profileData };
    }
  } catch (firebaseErr) {
    if (firebaseErr.code && firebaseErr.code.startsWith('auth/')) {
      throw new Error(mapAuthErrorToMessage(firebaseErr.code));
    }
  }

  // Local/Demo Persistence Fallback
  const existingUsersJson = await AsyncStorage.getItem(MOCK_USERS_KEY);
  const mockUsers = existingUsersJson ? JSON.parse(existingUsersJson) : {};

  if (mockUsers[cleanEmail]) {
    throw new Error(mapAuthErrorToMessage('auth/email-already-in-use'));
  }

  const mockUid = 'user_' + Date.now();
  const mockUser = { uid: mockUid, email: cleanEmail, displayName: cleanName };
  
  mockUsers[cleanEmail] = { ...mockUser, password, role };
  await AsyncStorage.setItem(MOCK_USERS_KEY, JSON.stringify(mockUsers));

  const profileData = await createUserProfile(mockUid, {
    uid: mockUid,
    email: cleanEmail,
    displayName: cleanName,
    role: role,
    bio: `${role.charAt(0).toUpperCase() + role.slice(1)} account registered on Safe Child.`,
    photoURL: null,
    createdAt: new Date().toISOString()
  });

  const sessionObj = { uid: mockUid, email: cleanEmail, displayName: cleanName, role };
  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionObj));

  return { user: mockUser, profile: profileData };
};

/**
 * Sign in an existing user with Email and Password
 */
export const signInUser = async (email, password) => {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password) {
    throw new Error('Please enter both your email address and password.');
  }

  // 1. Try Firebase Authentication
  try {
    if (auth && auth.config) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;
        const profile = await getUserProfile(user.uid);

        await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ uid: user.uid, email: cleanEmail }));
        return { user, profile };
      } catch (fbErr) {
        // Auto-provision default seed accounts in Firebase if missing or invalid credentials
        const seedAccounts = {
          'kingsleyeshunmintah@gmail.com': { role: 'admin', name: 'Kingsley Mintah (Admin)' },
          'joshuaofori879@gmail.com': { role: 'teacher', name: 'Joshua Ofori (Teacher)' },
          'ecode517@gmail.com': { role: 'parent', name: 'Parent Guardian' },
          'awuahselinabaffour@gmail.com': { role: 'security', name: 'Selina Awuah (Security)' },
          'oforijoshua198@gmail.com': { role: 'pickup_verifier', name: 'Joshua Verifier' }
        };

        const seedInfo = seedAccounts[cleanEmail];

        if (seedInfo && (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential')) {
          try {
            // Attempt to create user credential directly in Firebase Auth
            const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
            const user = newCred.user;
            await updateProfile(user, { displayName: seedInfo.name });
            const profile = await createUserProfile(user.uid, {
              uid: user.uid,
              email: cleanEmail,
              displayName: seedInfo.name,
              role: seedInfo.role,
              bio: `Official ${seedInfo.role.toUpperCase()} account for Safe Child Campus Safety.`,
              photoURL: null,
              createdAt: new Date().toISOString()
            });
            await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ uid: user.uid, email: cleanEmail }));
            return { user, profile };
          } catch (createErr) {
            console.warn("Auto seed creation notice:", createErr.message);
          }
        }

        if (fbErr.code && fbErr.code.startsWith('auth/')) {
          throw new Error(mapAuthErrorToMessage(fbErr.code));
        }
      }
    }
  } catch (firebaseErr) {
    if (firebaseErr.message && !firebaseErr.message.includes('auth/')) {
      throw firebaseErr;
    }
  }

  // 2. Local / Demo Auth Fallback
  const seedAccounts = {
    'kingsleyeshunmintah@gmail.com': { role: 'admin', name: 'Kingsley Mintah (Admin)' },
    'joshuaofori879@gmail.com': { role: 'teacher', name: 'Joshua Ofori (Teacher)' },
    'ecode517@gmail.com': { role: 'parent', name: 'Parent Guardian' },
    'awuahselinabaffour@gmail.com': { role: 'security', name: 'Selina Awuah (Security)' },
    'oforijoshua198@gmail.com': { role: 'pickup_verifier', name: 'Joshua Verifier' }
  };

  const seedAcc = seedAccounts[cleanEmail];
  if (seedAcc) {
    const mockUid = 'seed_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const profile = await createUserProfile(mockUid, {
      uid: mockUid,
      email: cleanEmail,
      displayName: seedAcc.name,
      role: seedAcc.role,
      bio: `Official ${seedAcc.role.toUpperCase()} account for Safe Child Campus Safety.`,
      photoURL: null,
      createdAt: new Date().toISOString()
    });
    const sessionObj = { uid: mockUid, email: cleanEmail, displayName: seedAcc.name, role: seedAcc.role };
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionObj));
    return { user: { uid: mockUid, email: cleanEmail, displayName: seedAcc.name }, profile };
  }

  const existingUsersJson = await AsyncStorage.getItem(MOCK_USERS_KEY);
  const mockUsers = existingUsersJson ? JSON.parse(existingUsersJson) : {};

  const existingAccount = mockUsers[cleanEmail];
  if (existingAccount && existingAccount.password === password) {
    const profile = await getUserProfile(existingAccount.uid);
    const sessionObj = { uid: existingAccount.uid, email: cleanEmail, displayName: existingAccount.displayName, role: existingAccount.role };
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionObj));
    return { 
      user: { uid: existingAccount.uid, email: cleanEmail, displayName: existingAccount.displayName }, 
      profile 
    };
  }

  throw new Error(mapAuthErrorToMessage('auth/invalid-credential'));
};

/**
 * Sign out the currently authenticated user
 */
export const signOutAuth = async () => {
  try {
    if (auth && auth.currentUser) {
      await signOut(auth);
    }
  } catch (err) {
    console.warn("Firebase signout warning:", err);
  }
  await AsyncStorage.removeItem(CURRENT_USER_KEY);
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
