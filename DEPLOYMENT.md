# 🛡️ Safe Child — React Native Mobile Application Deployment & Setup Guide

This guide provides step-by-step instructions for installing, configuring, testing, and deploying the **Safe Child** cross-platform React Native application (iOS & Android) with Firebase Authentication and Profile Management.

---

## 📋 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [Local Project Installation](#-local-project-installation)
3. [Firebase Authentication & Firestore Setup](#-firebase-authentication--firestore-setup)
4. [User Profile System Architecture](#-user-profile-system-architecture)
5. [Running the Application](#-running-the-application)
6. [iOS Build & App Store Deployment](#-ios-build--app-store-deployment)
7. [Android Build & Google Play Deployment](#-android-build--google-play-deployment)
8. [Production Security & Optimization Checklist](#-production-security--optimization-checklist)

---

## ⚡ Prerequisites

Before getting started, ensure you have the following installed on your development workstation:

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Expo CLI**: Installed globally or executed via `npx expo`
- **iOS Development**: macOS with Xcode 15+ and CocoaPods (for iOS Simulator & Native Builds)
- **Android Development**: Android Studio with Android SDK API Level 34+ and Java JDK 17
- **Firebase Account**: Access to [Firebase Console](https://console.firebase.google.com/)

---

## 📦 Local Project Installation

1. **Navigate to the Project Directory**:
   ```bash
   cd c:\xampp2\htdocs\Safe_Child_App
   ```

2. **Install Dependencies**:
   Execute the following command to install all React Native, Expo, Navigation, and Firebase packages:
   ```bash
   npm install
   ```

3. **Verify Package Dependencies**:
   Key installed modules include:
   - `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`
   - `firebase` (v10+)
   - `@react-native-async-storage/async-storage` (For persistent auth sessions and offline cache)
   - `expo-image-picker` (For uploading profile pictures and pickup recipient photo proofs)
   - `react-native-safe-area-context` & `react-native-screens`

---

## 🔥 Firebase Authentication & Firestore Setup

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it `safe-child-app`.
3. Enable or skip Google Analytics, then click **Create Project**.

  ### 2. Enable Email & Password Authentication
  1. In your project dashboard, navigate to **Build** ➔ **Authentication**.
  2. Click **Get Started** and select **Email/Password**.
  3. Toggle **Enable** for Email/Password authentication and click **Save**.

  ### 3. Initialize Firestore Database
  1. Navigate to **Build** ➔ **Firestore Database**.
  2. Click **Create Database**.
  3. Choose your database location and select **Start in production mode**.
  4. Apply the following Firestore Security Rules to protect user profiles:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User Profile Rules
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false; // Profiles are soft-deleted or managed by admin
    }
    
    // Pickup Request Rules
    match /pickup_requests/{requestId} {
      allow read, write: if request.auth != null;
    }
    
    // Attendance Rules
    match /attendance/{attendanceId} {
      allow read, write: if request.auth != null;
    }
    
    // Security Alerts Rules
    match /alerts/{alertId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Connect Web Application Credentials
1. In Firebase Console, go to **Project Settings** (Gear icon) ➔ **General**.
2. Scroll to **Your apps** and click the **Web icon (`</>`)** to register a web application.
3. Copy your `firebaseConfig` keys and open `src/config/firebase.js` in the codebase:

```javascript
// src/config/firebase.js
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

## 👤 User Profile System Architecture

The user profile management system in **Safe Child** links profile records to the authenticated user's `uid`:

```text
[ Auth Screen: Login / Sign Up ] 
            │
            ▼ (Firebase Auth / persistent AsyncStorage session)
[ User UID ] ───► [ Firestore: users/{uid} ] & [ Local Cache ]
                        ├── displayName (String)
                        ├── bio (String)
                        ├── role ('parent' | 'teacher' | 'pickup_verifier' | 'security' | 'admin')
                        ├── phone (String)
                        ├── photoURL (URI / null) ──► Uses default bundled Safe Child logo asset if null
                        └── updatedAt (Timestamp)
```

### Profile Features:
- **Default Avatar**: When a user registers or clears their avatar, the app defaults to the bundled logo icon (`assets/logo.png`).
- **Photo Upload**: Tapping the avatar badge opens device photo library using `expo-image-picker`.
- **Persistent Sessions**: User authentication state persists automatically across app restarts via `@react-native-async-storage/async-storage`.

---

## 📱 Running the Application

### 1. Launch Expo Development Server
```bash
npx expo start
```

### 2. Platform Specific Execution
- **Android Simulator / Device**:
  ```bash
  npx expo start --android
  ```
- **iOS Simulator** (macOS only):
  ```bash
  npx expo start --ios
  ```
- **Web Preview**:
  ```bash
  npx expo start --web
  ```

---

## 🍎 iOS Build & App Store Deployment

Deploying Safe Child to TestFlight and the Apple App Store uses Expo Application Services (EAS):

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Configure EAS Project**:
   ```bash
   eas build:configure
   ```

3. **Build iOS Production Archive (`.ipa`)**:
   ```bash
   eas build --platform ios --profile production
   ```

4. **Submit to TestFlight / App Store**:
   ```bash
   eas submit --platform ios
   ```
   *Note: Ensure your Apple Developer Account has accepted agreements in App Store Connect.*

---

## 🤖 Android Build & Google Play Deployment

1. **Build Android App Bundle (`.aab`) or Standalone APK**:
   ```bash
   # Build Production Android App Bundle (.aab) for Google Play Store:
   eas build --platform android --profile production

   # Build Standalone APK for Direct Device Installation:
   eas build --platform android --profile preview
   ```

2. **Google Play Console Upload**:
   - Create a new application in [Google Play Console](https://play.google.com/console/).
   - Complete store listing (title: **Safe Child**, descriptions, screenshots, privacy policy).
   - Upload the generated `.aab` file under **Production** or **Internal Testing**.

---

## 🔒 Production Security & Optimization Checklist

- [x] **Persistent Session Storage**: Verified through `AsyncStorage` + Firebase auth state listener.
- [x] **Input Validation & Sanitization**: Comprehensive inline error banners on Login, Sign Up, and Profile edit screens.
- [x] **Cross-Platform Responsive Design**: Safe area padding, notch awareness, and flexible card grids across iOS and Android viewports.
- [x] **Media Upload Permissions**: Configured in `app.json` for camera and media library permissions.
- [x] **Fallback Resilience**: Robust fallback handling ensures uninterrupted operation during offline/network degradation scenarios.

---

*Safe Child Campus Safety & Pickup Management Mobile App — Engineered with React Native, Firebase, and Expo.*
