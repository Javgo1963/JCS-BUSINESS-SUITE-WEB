import type { User } from "firebase/auth";

import {
  createAccountWithEmail,
  getCurrentAuthUser,
  observeAuthState as observeFirebaseAuthState,
  reloadCurrentAuthUser,
  requestPasswordReset,
  sendCurrentUserVerificationEmail,
  signInWithEmail,
  signOutCurrentUser,
} from "@/core/firebase/auth";

import type {
  CreateAccountCredentials,
  ResetPasswordInput,
  SignInCredentials,
} from "@/types/auth";

// MARK: - Auth State

export function observeAuthState(
  observer: (user: User | null) => void
) {
  return observeFirebaseAuthState(observer);
}

// MARK: - Current User

export function getCurrentUser(): User | null {
  return getCurrentAuthUser();
}

// MARK: - Sign In

export async function signIn(
  credentials: SignInCredentials
): Promise<User> {
  const credential = await signInWithEmail(
    credentials.email,
    credentials.password,
    credentials.rememberSession ?? true
  );

  return credential.user;
}

// MARK: - Create Account

export async function createAccount(
  credentials: CreateAccountCredentials
): Promise<User> {
  const credential = await createAccountWithEmail(
    credentials.email,
    credentials.password,
    credentials.fullName
  );

  return credential.user;
}

// MARK: - Sign Out

export async function signOut(): Promise<void> {
  await signOutCurrentUser();
}

// MARK: - Password Reset

export async function resetPassword(
  input: ResetPasswordInput
): Promise<void> {
  await requestPasswordReset(input.email);
}

// MARK: - Email Verification

export async function sendVerificationEmail(): Promise<void> {
  await sendCurrentUserVerificationEmail();
}

// MARK: - Refresh User

export async function refreshUser(): Promise<User | null> {
  return reloadCurrentAuthUser();
}

// MARK: - Service Object

export const AuthService = {
  observeAuthState,
  getCurrentUser,
  signIn,
  createAccount,
  signOut,
  resetPassword,
  sendVerificationEmail,
  refreshUser,
};