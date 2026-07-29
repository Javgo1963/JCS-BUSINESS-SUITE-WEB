import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type Unsubscribe,
  type User,
  type UserCredential,
} from "firebase/auth";

import { auth } from "@/core/firebase/firebase";

// MARK: - Helpers

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function requireEmail(email: string): string {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  return normalizedEmail;
}

function requirePassword(password: string): string {
  const normalizedPassword = password.trim();

  if (!normalizedPassword) {
    throw new Error("Password is required.");
  }

  return normalizedPassword;
}

// MARK: - Persistence

export async function configureAuthPersistence(
  rememberSession: boolean = true
): Promise<void> {
  await setPersistence(
    auth,
    rememberSession
      ? browserLocalPersistence
      : browserSessionPersistence
  );
}

// MARK: - Observer

export function observeAuthState(
  observer: (user: User | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, observer);
}

// MARK: - Current User

export function getCurrentAuthUser(): User | null {
  return auth.currentUser;
}

// MARK: - Sign In

export async function signInWithEmail(
  email: string,
  password: string,
  rememberSession: boolean = true
): Promise<UserCredential> {
  const normalizedEmail = requireEmail(email);
  const validatedPassword = requirePassword(password);

  await configureAuthPersistence(rememberSession);

  return signInWithEmailAndPassword(
    auth,
    normalizedEmail,
    validatedPassword
  );
}

// MARK: - Create Account

export async function createAccountWithEmail(
  email: string,
  password: string,
  fullName?: string
): Promise<UserCredential> {
  const normalizedEmail = requireEmail(email);
  const validatedPassword = requirePassword(password);

  await configureAuthPersistence(true);

  const credential =
    await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      validatedPassword
    );

  const normalizedFullName = fullName?.trim();

  if (normalizedFullName) {
    await updateProfile(credential.user, {
      displayName: normalizedFullName,
    });
  }

  return credential;
}

// MARK: - Sign Out

export async function signOutCurrentUser(): Promise<void> {
  await signOut(auth);
}

// MARK: - Password Reset

export async function requestPasswordReset(
  email: string
): Promise<void> {
  const normalizedEmail = requireEmail(email);

  await sendPasswordResetEmail(
    auth,
    normalizedEmail
  );
}

// MARK: - Email Verification

export async function sendCurrentUserVerificationEmail(): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "No authenticated user is available."
    );
  }

  await sendEmailVerification(user);
}

// MARK: - Reload User

export async function reloadCurrentAuthUser(): Promise<User | null> {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  await reload(user);

  return auth.currentUser;
}