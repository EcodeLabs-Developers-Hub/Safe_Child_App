import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  signInUser, 
  signUpUser, 
  signOutAuth, 
  resetUserPassword 
} from '../services/authService';
import { 
  getUserProfile, 
  updateUserProfile, 
  pickProfileImage, 
  resetProfileImageToDefault 
} from '../services/profileService';

const CURRENT_USER_KEY = '@safe_child_current_session';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize and check existing persistent session on app startup
  useEffect(() => {
    const initializeAuthSession = async () => {
      try {
        setLoading(true);
        const storedSessionJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
        if (storedSessionJson) {
          const sessionData = JSON.parse(storedSessionJson);
          if (sessionData && sessionData.uid) {
            setUser({ uid: sessionData.uid, email: sessionData.email });
            const profile = await getUserProfile(sessionData.uid);
            setUserProfile(profile);
          }
        }
      } catch (err) {
        console.warn('Failed to restore session:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuthSession();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const { user: authUser, profile } = await signInUser(email, password);
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
    try {
      await signOutAuth();
    } finally {
      setUser(null);
      setUserProfile(null);
      setAuthError(null);
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
