import type { User } from "firebase/auth";

import type {
  AppUserRecord,
  UserRole,
} from "@/types/app-user";

// MARK: - Authentication Inputs

export interface SignInCredentials {
  email: string;
  password: string;
  rememberSession?: boolean;
}

export interface CreateAccountCredentials {
  email: string;
  password: string;
  fullName?: string;
}

export interface ResetPasswordInput {
  email: string;
}

// MARK: - Authentication Context

export interface AuthContextValue {
  // Firebase Authentication user
  user: User | null;

  // Firestore JCS Business Suite user
  appUser: AppUserRecord | null;

  // Authentication state
  isLoading: boolean;
  isLoadingBusinessContext: boolean;

  isAuthenticated: boolean;
  isBusinessContextReady: boolean;

  // Errors
  error: string | null;
  businessContextError: string | null;

  // Core business identity
  firebaseUID: string | null;
  businessID: string | null;
  ownerUID: string | null;
  businessName: string | null;

  // Role
  role: UserRole | null;

  // Platform and business access
  isPlatformAdministrator: boolean;
  isBusinessOwner: boolean;
  isBusinessAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
  isCustomer: boolean;
  isProvider: boolean;
  isBusinessStaff: boolean;

  // User status
  isActiveUser: boolean;

  // Authentication actions
  signIn: (
    credentials: SignInCredentials
  ) => Promise<void>;

  createAccount: (
    credentials: CreateAccountCredentials
  ) => Promise<void>;

  signOut: () => Promise<void>;

  resetPassword: (
    input: ResetPasswordInput
  ) => Promise<void>;

  sendVerificationEmail: () => Promise<void>;

  refreshUser: () => Promise<void>;

  // Firestore business-context actions
  refreshBusinessContext: () => Promise<void>;

  clearError: () => void;
  clearBusinessContextError: () => void;
}