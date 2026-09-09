import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  signInUser, 
  signUpUser, 
  signOutAuth, 
  resetUserPassword,
  sendVerificationEmail
} from '../services/authService';
import { 
  getUserProfile, 
  subscribeUserProfile,
  updateUserProfile, 
  pickProfileImage, 
  resetProfileImageToDefault 
} from '../services/profileService';
import { auth } from '../config/firebase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return undefined;
    }
    let unsubscribeProfile = () => {};
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribeProfile();
      unsubscribeProfile = () => {};
      setLoading(true);
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          const profile = await getUserProfile(firebaseUser.uid);
          if (!profile) {
            setAuthError(`No Firestore profile exists for Auth UID ${firebaseUser.uid}.`);
          }
          setUserProfile(profile);
          unsubscribeProfile = subscribeUserProfile(
            firebaseUser.uid,
            setUserProfile,
            () => setAuthError('Unable to watch your account data.')
          );
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        setAuthError('Unable to load your account data.');
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    });
    return () => {
      unsubscribeProfile();
      unsubscribeAuth();
    };
  }, []);

  // Login handler
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const { user: authUser, profile } = await signInUser(email, password);
      if (!profile) {
        await signOutAuth();
        throw new Error(`No Firestore profile exists for Auth UID ${authUser.uid}. Create users/${authUser.uid} with a role before using the app.`);
      }
      setUser(authUser);
      setUserProfile(profile);
      return profile;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Sign up handler
  const register = async (email, password, displayName, role) => {
    setAuthError(null);
    try {
      const { user: authUser, profile } = await signUpUser(email, password, displayName, role);
      setUser(authUser);
      setUserProfile(profile);
      return profile;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Logout handler
  const logout = async () => {
    setLoading(true);
    try {
      await signOutAuth();
      setUser(null);
      setUserProfile(null);
      setAuthError(null);
    } finally {
      setLoading(false);
    }
  };

  // Refresh user profile state
  const refreshProfile = async () => {
    if (user && user.uid) {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
      return profile;
    }
  };

  // Update profile fields (displayName, bio, phone, role)
  const editProfile = async (fields) => {
    if (!user || !user.uid) throw new Error('User not logged in.');
    const updated = await updateUserProfile(user.uid, fields);
    setUserProfile(updated);
    return updated;
  };

  // Upload/select profile picture
  const uploadAvatar = async () => {
    if (!user || !user.uid) throw new Error('User not logged in.');
    const updated = await pickProfileImage(user.uid);
    if (updated) {
      setUserProfile(updated);
    }
    return updated;
  };

  // Reset avatar to default Safe Child logo
  const resetAvatar = async () => {
    if (!user || !user.uid) throw new Error('User not logged in.');
    const updated = await resetProfileImageToDefault(user.uid);
    setUserProfile(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        authError,
        setAuthError,
        login,
        register,
        logout,
        sendVerificationEmail,
        resetPassword: resetUserPassword,
        refreshProfile,
        editProfile,
        uploadAvatar,
        resetAvatar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
