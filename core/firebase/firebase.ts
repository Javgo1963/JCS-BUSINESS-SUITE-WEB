"use client";

import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";

import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFunctions, type Functions } from "firebase/functions";

// MARK: - Firebase Configuration

/**
 * Public Firebase configuration for the JCS Business Suite web application.
 *
 * These values come from:
 *
 * Firebase Console
 * → Project Settings
 * → General
 * → Your apps
 * → Web app
 *
 * Variables beginning with NEXT_PUBLIC_ are available to the browser.
 * Authorization and data protection must always be enforced through:
 *
 * - Firebase Authentication
 * - Firestore Security Rules
 * - Storage Security Rules
 * - Cloud Functions authorization
 */
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// MARK: - Configuration Validation

const requiredFirebaseEnvironmentVariables = {
  NEXT_PUBLIC_FIREBASE_API_KEY:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,

  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,

  NEXT_PUBLIC_FIREBASE_PROJECT_ID:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,

  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,

  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,

  NEXT_PUBLIC_FIREBASE_APP_ID:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missingFirebaseEnvironmentVariables = Object.entries(
  requiredFirebaseEnvironmentVariables
)
  .filter(([, value]) => !value?.trim())
  .map(([key]) => key);

if (missingFirebaseEnvironmentVariables.length > 0) {
  throw new Error(
    [
      "JCS Business Suite Firebase configuration is incomplete.",
      "",
      "Missing environment variables:",
      ...missingFirebaseEnvironmentVariables.map(
        (variableName) => `- ${variableName}`
      ),
      "",
      "Add the missing values to the .env.local file and restart the Next.js development server.",
    ].join("\n")
  );
}

// MARK: - Firebase Application

/**
 * Next.js can evaluate modules more than once during development because of
 * Fast Refresh.
 *
 * getApps() prevents Firebase from creating duplicate default applications.
 */
const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// MARK: - Firebase Services

const firebaseAuth: Auth = getAuth(firebaseApp);

const firestoreDatabase: Firestore = getFirestore(firebaseApp);

const firebaseStorage: FirebaseStorage = getStorage(firebaseApp);

const firebaseFunctionsRegion =
  process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION?.trim() ||
  "us-central1";

const firebaseFunctions: Functions = getFunctions(
  firebaseApp,
  firebaseFunctionsRegion
);

// MARK: - Exports

export {
  firebaseApp,
  firebaseAuth,
  firestoreDatabase,
  firebaseStorage,
  firebaseFunctions,
  firebaseFunctionsRegion,
};

/**
 * Short aliases for modules where the meaning remains clear.
 */
export const app = firebaseApp;
export const auth = firebaseAuth;
export const db = firestoreDatabase;
export const storage = firebaseStorage;
export const functions = firebaseFunctions;