/**
 * ==============================================================
 * JCS BUSINESS SUITE WEB
 * AuthenticationService.ts
 * --------------------------------------------------------------
 * Firebase Authentication service used by the Business
 * Registration Engine.
 *
 * Single responsibility:
 * - Create the Firebase Authentication account for a Business Owner.
 * - Update the Firebase display name.
 * - Return an application-owned result object.
 *
 * This service does not create:
 * - Business
 * - AppUser
 * - AppSettings
 * - PlatformClient
 * - Business DNA
 * ==============================================================
 */

import {
  createUserWithEmailAndPassword,
  deleteUser,
  updateProfile,
  type Auth,
  type User,
} from "firebase/auth";

/**
 * Information required to create the Business Owner's
 * Firebase Authentication account.
 */
export interface CreateBusinessOwnerAccountRequest {
  email: string;
  password: string;
  fullName: string;
}

/**
 * Application-owned authentication result.
 *
 * Other JCS modules should depend on this result instead of
 * depending directly on Firebase's UserCredential type.
 */
export interface BusinessOwnerAuthenticationResult {
  firebaseUID: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
  providerID: string;
  createdAt: string;
}

/**
 * Standardized authentication error used by the registration
 * workflow.
 */
export class AuthenticationServiceError extends Error {
  readonly code: string;
  readonly originalError?: unknown;

  constructor(
    code: string,
    message: string,
    originalError?: unknown
  ) {
    super(message);

    this.name = "AuthenticationServiceError";
    this.code = code;
    this.originalError = originalError;

    Object.setPrototypeOf(
      this,
      AuthenticationServiceError.prototype
    );
  }
}

/**
 * Firebase Authentication service for business registration.
 */
export class AuthenticationService {
  private readonly auth: Auth;

  constructor(auth: Auth) {
    this.auth = auth;
  }

  /**
   * Creates the Firebase account for the Business Owner.
   *
   * Workflow:
   * 1. Validate and normalize input.
   * 2. Create the Firebase Authentication account.
   * 3. Save the owner's full name in the Firebase profile.
   * 4. Return a JCS-owned result.
   *
   * If profile configuration fails after account creation, the
   * newly-created Firebase user is removed as a rollback action.
   */
  async createBusinessOwnerAccount(
    request: CreateBusinessOwnerAccountRequest
  ): Promise<BusinessOwnerAuthenticationResult> {
    const normalizedRequest =
      this.normalizeAndValidateRequest(request);

    let createdUser: User | null = null;

    try {
      const credential =
        await createUserWithEmailAndPassword(
          this.auth,
          normalizedRequest.email,
          normalizedRequest.password
        );

      createdUser = credential.user;

      await updateProfile(createdUser, {
        displayName: normalizedRequest.fullName,
      });

      return {
        firebaseUID: createdUser.uid,
        email:
          createdUser.email ??
          normalizedRequest.email,
        fullName:
          createdUser.displayName ??
          normalizedRequest.fullName,
        emailVerified: createdUser.emailVerified,
        providerID:
          createdUser.providerData[0]?.providerId ??
          "password",
        createdAt:
          createdUser.metadata.creationTime ??
          new Date().toISOString(),
      };
    } catch (error: unknown) {
      if (createdUser) {
        await this.rollbackCreatedUser(createdUser);
      }

      throw this.normalizeFirebaseError(error);
    }
  }

  /**
   * Removes a newly-created Firebase user when a later
   * authentication setup step fails.
   */
  private async rollbackCreatedUser(
    user: User
  ): Promise<void> {
    try {
      await deleteUser(user);
    } catch (rollbackError: unknown) {
      console.error(
        "[AuthenticationService] Unable to rollback Firebase user:",
        rollbackError
      );
    }
  }

  /**
   * Validates and normalizes registration input.
   */
  private normalizeAndValidateRequest(
    request: CreateBusinessOwnerAccountRequest
  ): CreateBusinessOwnerAccountRequest {
    if (!request || typeof request !== "object") {
      throw new AuthenticationServiceError(
        "auth/invalid-request",
        "A valid Business Owner authentication request is required."
      );
    }

    const email = request.email
      .trim()
      .toLowerCase();

    const password = request.password;
    const fullName = request.fullName.trim();

    if (!fullName) {
      throw new AuthenticationServiceError(
        "auth/missing-full-name",
        "The Business Owner's full name is required."
      );
    }

    if (!email) {
      throw new AuthenticationServiceError(
        "auth/missing-email",
        "The Business Owner's email address is required."
      );
    }

    if (!this.isValidEmail(email)) {
      throw new AuthenticationServiceError(
        "auth/invalid-email",
        "Enter a valid Business Owner email address."
      );
    }

    if (!password) {
      throw new AuthenticationServiceError(
        "auth/missing-password",
        "A password is required."
      );
    }

    if (password.length < 8) {
      throw new AuthenticationServiceError(
        "auth/weak-password",
        "The password must contain at least 8 characters."
      );
    }

    return {
      email,
      password,
      fullName,
    };
  }

  /**
   * Lightweight client-side email validation.
   *
   * Firebase remains responsible for definitive validation.
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Converts Firebase and unknown errors into stable JCS errors.
   */
  private normalizeFirebaseError(
    error: unknown
  ): AuthenticationServiceError {
    const firebaseCode = this.readErrorCode(error);

    switch (firebaseCode) {
      case "auth/email-already-in-use":
        return new AuthenticationServiceError(
          firebaseCode,
          "An account already exists with this email address.",
          error
        );

      case "auth/invalid-email":
        return new AuthenticationServiceError(
          firebaseCode,
          "The email address is not valid.",
          error
        );

      case "auth/weak-password":
        return new AuthenticationServiceError(
          firebaseCode,
          "The password does not meet Firebase security requirements.",
          error
        );

      case "auth/operation-not-allowed":
        return new AuthenticationServiceError(
          firebaseCode,
          "Email and password registration is not enabled in Firebase Authentication.",
          error
        );

      case "auth/network-request-failed":
        return new AuthenticationServiceError(
          firebaseCode,
          "The authentication request could not reach Firebase. Check the internet connection and try again.",
          error
        );

      case "auth/too-many-requests":
        return new AuthenticationServiceError(
          firebaseCode,
          "Firebase temporarily blocked this request because of unusual activity. Try again later.",
          error
        );

      default:
        return new AuthenticationServiceError(
          firebaseCode ??
            "auth/unknown-registration-error",
          this.readErrorMessage(error) ??
            "Firebase could not create the Business Owner account.",
          error
        );
    }
  }

  /**
   * Safely reads a Firebase-style error code.
   */
  private readErrorCode(
    error: unknown
  ): string | null {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof error.code === "string"
    ) {
      return error.code;
    }

    return null;
  }

  /**
   * Safely reads an error message.
   */
  private readErrorMessage(
    error: unknown
  ): string | null {
    if (error instanceof Error) {
      return error.message;
    }

    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return error.message;
    }

    if (
      typeof error === "string" &&
      error.trim()
    ) {
      return error.trim();
    }

    return null;
  }
}

export default AuthenticationService;