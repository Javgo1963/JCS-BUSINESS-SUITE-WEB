"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { User } from "firebase/auth";

import { AuthContext } from "@/core/contexts/AuthContext";

import { AppUserService } from "@/core/services/AppUserService";
import { AuthService } from "@/core/services/AuthService";

import type {
  AppUserRecord,
  UserRole,
} from "@/types/app-user";

import type {
  AuthContextValue,
  CreateAccountCredentials,
  ResetPasswordInput,
  SignInCredentials,
} from "@/types/auth";

// MARK: - Props

interface AuthProviderProps {
  children: ReactNode;
}

// MARK: - Error Helper

function getErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  if (
    error instanceof Error &&
    error.message.trim().length > 0
  ) {
    return error.message;
  }

  return fallbackMessage;
}

// MARK: - Auth Provider

export function AuthProvider({
  children,
}: AuthProviderProps) {
  // MARK: - Firebase Authentication State

  const [user, setUser] =
    useState<User | null>(null);

  // MARK: - JCS Business Context State

  const [appUser, setAppUser] =
    useState<AppUserRecord | null>(null);

  // MARK: - Loading State

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    isLoadingBusinessContext,
    setIsLoadingBusinessContext,
  ] = useState(false);

  // MARK: - Error State

  const [error, setError] =
    useState<string | null>(null);

  const [
    businessContextError,
    setBusinessContextError,
  ] = useState<string | null>(null);

  // MARK: - Load Business Context

  const loadBusinessContext =
    useCallback(
      async (
        firebaseUser: User | null
      ): Promise<void> => {
        if (!firebaseUser) {
          setAppUser(null);
          setBusinessContextError(null);
          setIsLoadingBusinessContext(false);

          return;
        }

        setIsLoadingBusinessContext(true);
        setBusinessContextError(null);

        try {
          const loadedAppUser =
            await AppUserService.getUserByFirebaseUID(
              firebaseUser.uid
            );

          setAppUser(loadedAppUser);

          if (!loadedAppUser) {
            setBusinessContextError(
              "The authenticated user does not yet have a JCS Business Suite user profile."
            );
          }
        } catch (businessError) {
          console.error(
            "JCS Business Suite business-context error:",
            businessError
          );

          setAppUser(null);

          setBusinessContextError(
            getErrorMessage(
              businessError,
              "Unable to load the JCS Business Suite business context."
            )
          );
        } finally {
          setIsLoadingBusinessContext(false);
        }
      },
      []
    );

  // MARK: - Observe Firebase Authentication

  useEffect(() => {
    let isMounted = true;

    const unsubscribe =
      AuthService.observeAuthState(
        (firebaseUser) => {
          if (!isMounted) {
            return;
          }

          setUser(firebaseUser);
          setError(null);

          void loadBusinessContext(
            firebaseUser
          ).finally(() => {
            if (isMounted) {
              setIsLoading(false);
            }
          });
        }
      );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [loadBusinessContext]);

  // MARK: - Authentication Actions

  const signIn =
    useCallback(
      async (
        credentials: SignInCredentials
      ): Promise<void> => {
        setError(null);
        setBusinessContextError(null);

        try {
          const authenticatedUser =
            await AuthService.signIn(
              credentials
            );

          setUser(authenticatedUser);

          await loadBusinessContext(
            authenticatedUser
          );
        } catch (signInError) {
          console.error(
            "JCS Business Suite sign-in error:",
            signInError
          );

          setError(
            getErrorMessage(
              signInError,
              "Unable to sign in. Verify your email and password and try again."
            )
          );

          throw signInError;
        }
      },
      [loadBusinessContext]
    );

  const createAccount =
    useCallback(
      async (
        credentials: CreateAccountCredentials
      ): Promise<void> => {
        setError(null);
        setBusinessContextError(null);

        try {
          const createdUser =
            await AuthService.createAccount(
              credentials
            );

          setUser(createdUser);

          /*
           A newly authenticated Firebase user may not yet have a
           Firestore AppUser document.

           BusinessSignUpView or the invitation-acceptance flow will
           create the operational business, owner identity and AppUser
           record as one coordinated registration operation.
          */
          await loadBusinessContext(
            createdUser
          );
        } catch (createAccountError) {
          console.error(
            "JCS Business Suite account-creation error:",
            createAccountError
          );

          setError(
            getErrorMessage(
              createAccountError,
              "Unable to create the account."
            )
          );

          throw createAccountError;
        }
      },
      [loadBusinessContext]
    );

  const signOut =
    useCallback(
      async (): Promise<void> => {
        setError(null);
        setBusinessContextError(null);

        try {
          await AuthService.signOut();

          setUser(null);
          setAppUser(null);
          setIsLoadingBusinessContext(false);
        } catch (signOutError) {
          console.error(
            "JCS Business Suite sign-out error:",
            signOutError
          );

          setError(
            getErrorMessage(
              signOutError,
              "Unable to sign out."
            )
          );

          throw signOutError;
        }
      },
      []
    );

  const resetPassword =
    useCallback(
      async (
        input: ResetPasswordInput
      ): Promise<void> => {
        setError(null);

        try {
          await AuthService.resetPassword(
            input
          );
        } catch (resetPasswordError) {
          console.error(
            "JCS Business Suite password-reset error:",
            resetPasswordError
          );

          setError(
            getErrorMessage(
              resetPasswordError,
              "Unable to send the password reset email."
            )
          );

          throw resetPasswordError;
        }
      },
      []
    );

  const sendVerificationEmail =
    useCallback(
      async (): Promise<void> => {
        setError(null);

        try {
          await AuthService.sendVerificationEmail();
        } catch (verificationError) {
          console.error(
            "JCS Business Suite email-verification error:",
            verificationError
          );

          setError(
            getErrorMessage(
              verificationError,
              "Unable to send the verification email."
            )
          );

          throw verificationError;
        }
      },
      []
    );

  const refreshUser =
    useCallback(
      async (): Promise<void> => {
        setError(null);

        try {
          const refreshedUser =
            await AuthService.refreshUser();

          setUser(refreshedUser);

          await loadBusinessContext(
            refreshedUser
          );
        } catch (refreshError) {
          console.error(
            "JCS Business Suite user-refresh error:",
            refreshError
          );

          setError(
            getErrorMessage(
              refreshError,
              "Unable to refresh the authenticated user."
            )
          );

          throw refreshError;
        }
      },
      [loadBusinessContext]
    );

  // MARK: - Business Context Actions

  const refreshBusinessContext =
    useCallback(
      async (): Promise<void> => {
        await loadBusinessContext(user);
      },
      [
        user,
        loadBusinessContext,
      ]
    );

  // MARK: - Error Actions

  const clearError =
    useCallback((): void => {
      setError(null);
    }, []);

  const clearBusinessContextError =
    useCallback((): void => {
      setBusinessContextError(null);
    }, []);

  // MARK: - Authentication Identity

  const isAuthenticated =
    user !== null;

  const firebaseUID =
    user?.uid ?? null;

  // MARK: - Business Identity

  const businessID =
    appUser?.businessID || null;

  const ownerUID =
    appUser?.ownerUID || null;

  const businessName =
    appUser?.businessName || null;

  const role: UserRole | null =
    appUser?.role ?? null;

  // MARK: - Platform Role

  const isPlatformAdministrator =
    appUser?.isPlatformAdministrator ??
    false;

  // MARK: - Business Roles

  const isBusinessOwner =
    !isPlatformAdministrator &&
    (appUser?.isBusinessOwner ?? false);

  /*
   The standard "admin" role represents a business administrator.

   A Business Owner is also treated as a Business Admin, but neither
   role receives access to the Platform Executive Center.
  */
  const isBusinessAdmin =
    !isPlatformAdministrator &&
    (
      isBusinessOwner ||
      role === "admin"
    );

  const isManager =
    !isPlatformAdministrator &&
    role === "manager";

  const isEmployee =
    !isPlatformAdministrator &&
    role === "employee";

  const isCustomer =
    !isPlatformAdministrator &&
    role === "customer";

  const isProvider =
    !isPlatformAdministrator &&
    role === "provider";

  /*
   PlatformAdmin is intentionally excluded.

   PlatformAdmin belongs to the global platform context and is routed
   exclusively to the Platform Executive Center.

   Business staff operates inside one business context.
  */
  const isBusinessStaff =
    isBusinessOwner ||
    isBusinessAdmin ||
    isManager ||
    isEmployee;

  // MARK: - User Status

  const isActiveUser =
    appUser?.isActive ?? false;

  /*
   Authentication and business-context loading are separate.

   A Firebase user can be authenticated while the corresponding
   Firestore AppUser document is still being loaded or has not yet
   been created by the business-registration flow.
  */
  const isBusinessContextReady =
    isAuthenticated &&
    appUser !== null &&
    !isLoadingBusinessContext;

  // MARK: - Context Value

  const value: AuthContextValue =
    useMemo(
      () => ({
        // Firebase Authentication

        user,
        isAuthenticated,

        // JCS Firestore User

        appUser,
        isBusinessContextReady,

        // Loading

        isLoading,
        isLoadingBusinessContext,

        // Errors

        error,
        businessContextError,

        // Core Identity

        firebaseUID,
        businessID,
        ownerUID,
        businessName,

        // Role

        role,

        // Platform Access

        isPlatformAdministrator,

        // Business Access

        isBusinessOwner,
        isBusinessAdmin,
        isManager,
        isEmployee,
        isCustomer,
        isProvider,
        isBusinessStaff,

        // User Status

        isActiveUser,

        // Authentication Actions

        signIn,
        createAccount,
        signOut,
        resetPassword,
        sendVerificationEmail,
        refreshUser,

        // Business Context Actions

        refreshBusinessContext,

        // Error Actions

        clearError,
        clearBusinessContextError,
      }),
      [
        user,
        isAuthenticated,

        appUser,
        isBusinessContextReady,

        isLoading,
        isLoadingBusinessContext,

        error,
        businessContextError,

        firebaseUID,
        businessID,
        ownerUID,
        businessName,

        role,

        isPlatformAdministrator,

        isBusinessOwner,
        isBusinessAdmin,
        isManager,
        isEmployee,
        isCustomer,
        isProvider,
        isBusinessStaff,

        isActiveUser,

        signIn,
        createAccount,
        signOut,
        resetPassword,
        sendVerificationEmail,
        refreshUser,

        refreshBusinessContext,

        clearError,
        clearBusinessContextError,
      ]
    );

  // MARK: - Provider

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}