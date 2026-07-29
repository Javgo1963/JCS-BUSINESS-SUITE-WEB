import type { User } from "firebase/auth";

import {
  createAccountWithEmail,
  getCurrentAuthUser,
  observeAuthState,
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

export const AuthService = {
  observeAuthState(
    observer: (user: User | null) => void
  ) {
    return observeAuthState(observer);
  },

  getCurrentUser(): User | null {
    return getCurrentAuthUser();
  },

  async signIn(
    credentials: SignInCredentials
  ): Promise<User> {
    const credential = await signInWithEmail(
      credentials.email,
      credentials.password,
      credentials.rememberSession ?? true
    );

    return credential.user;
  },

  async createAccount(
    credentials: CreateAccountCredentials
  ): Promise<User> {
    const credential = await createAccountWithEmail(
      credentials.email,
      credentials.password,
      credentials.fullName
    );

    return credential.user;
  },

  async signOut(): Promise<void> {
    await signOutCurrentUser();
  },

  async resetPassword(
    input: ResetPasswordInput
  ): Promise<void> {
    await requestPasswordReset(input.email);
  },

  async sendVerificationEmail(): Promise<void> {
    await sendCurrentUserVerificationEmail();
  },

  async refreshUser(): Promise<User | null> {
    return reloadCurrentAuthUser();
  },
};