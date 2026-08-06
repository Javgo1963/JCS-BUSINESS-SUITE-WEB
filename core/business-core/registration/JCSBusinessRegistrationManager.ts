import {
  createUserWithEmailAndPassword,
  deleteUser,
  type User,
} from "firebase/auth";

import { firebaseAuth } from "@/core/firebase/firebase";

// MARK: - Registration Stages

export type BusinessRegistrationStage =
  | "idle"
  | "validating"
  | "resolvingConfiguration"
  | "creatingAuthentication"
  | "creatingBusiness"
  | "creatingBusinessOwner"
  | "creatingAppSettings"
  | "creatingPlatformClient"
  | "creatingBusinessDNA"
  | "provisioningWorkspace"
  | "generatingLogo"
  | "completingInvitation"
  | "finalizing"
  | "completed"
  | "failed"
  | "cancelled";

// MARK: - Registration Progress

export interface BusinessRegistrationProgress {
  stage: BusinessRegistrationStage;
  percentage: number;
  message: string;
}

// MARK: - Registration Request

export interface JCSBusinessRegistrationRequest {
  // Business

  businessName: string;
  businessPhone: string;
  website: string;

  // Owner

  ownerFullName: string;
  ownerEmail: string;
  password: string;

  /**
   * The current form does not contain a separate owner phone field.
   * Until that field is added, BusinessSignUpView may pass
   * businessPhone here when both numbers are the same.
   */
  ownerPhone?: string;

  // Industry configuration

  industryCategoryKey: string;
  industryCategoryTitle: string;

  businessModeKey: string;
  businessModeName: string;

  recommendedModules: string[];

  // Optional Platform invitation

  platformInvitationCode?: string;

  // Locale

  localeIdentifier?: string;
  timeZoneIdentifier?: string;

  // Cancellation

  signal?: AbortSignal;
}

// MARK: - Registration Result

export interface JCSBusinessRegistrationResult {
  businessID: string;
  ownerUID: string;
  firebaseUID: string;

  businessName: string;

  industryCategoryKey: string;
  industryCategoryTitle: string;

  businessModeKey: string;
  businessModeName: string;

  businessInviteCode?: string;
  platformInvitationCode?: string;

  planName: string;
  trialLengthDays: number;

  generatedLogoFileName?: string;

  logoStatus?:
    | "pending"
    | "ready"
    | "fallback"
    | "failed";

  nextRoute?: string;
}

// MARK: - Normalized Registration Request

/**
 * Internal normalized representation.
 *
 * The password remains available only inside the registration manager
 * and is never sent to Firestore or to the provisioning engine.
 */
interface NormalizedRegistrationRequest {
  businessName: string;
  businessPhone: string;
  website: string;

  ownerFullName: string;
  ownerEmail: string;
  ownerPhone: string;

  password: string;

  industryCategoryKey: string;
  industryCategoryTitle: string;

  businessModeKey: string;
  businessModeName: string;

  recommendedModules: string[];

  platformInvitationCode?: string;

  localeIdentifier: string;
  timeZoneIdentifier: string;

  signal?: AbortSignal;
}

// MARK: - Provisioning Input

/**
 * Information delivered to BusinessCreationEngine after Firebase
 * Authentication has successfully created the owner account.
 *
 * The password is intentionally excluded.
 */
export interface JCSBusinessProvisioningInput {
  firebaseUser: User;
  firebaseUID: string;

  businessName: string;
  businessPhone: string;
  website: string;

  ownerFullName: string;
  ownerEmail: string;
  ownerPhone: string;

  industryCategoryKey: string;
  industryCategoryTitle: string;

  businessModeKey: string;
  businessModeName: string;

  recommendedModules: string[];

  platformInvitationCode?: string;

  localeIdentifier: string;
  timeZoneIdentifier: string;

  signal?: AbortSignal;
}

// MARK: - Progress Callback

export type BusinessRegistrationProgressCallback = (
  progress: BusinessRegistrationProgress
) => void;

// MARK: - Provisioning Engine Contract

/**
 * BusinessCreationEngine will implement this contract in Part 2.
 *
 * Keeping this contract here allows the Registration Manager to compile
 * now without directly depending on unfinished Firestore factories.
 */
export interface JCSBusinessProvisioningEngine {
  createBusiness(
    input: JCSBusinessProvisioningInput,
    onProgress?: BusinessRegistrationProgressCallback
  ): Promise<JCSBusinessRegistrationResult>;
}

// MARK: - Registration Error Codes

export type JCSBusinessRegistrationErrorCode =
  | "invalid-request"
  | "email-already-in-use"
  | "invalid-email"
  | "weak-password"
  | "authentication-failed"
  | "provisioning-engine-not-configured"
  | "business-creation-failed"
  | "rollback-failed"
  | "cancelled"
  | "unknown";

// MARK: - Registration Error

export class JCSBusinessRegistrationError extends Error {
  readonly code: JCSBusinessRegistrationErrorCode;

  readonly cause?: unknown;

  constructor(
    code: JCSBusinessRegistrationErrorCode,
    message: string,
    cause?: unknown
  ) {
    super(message);

    this.name = "JCSBusinessRegistrationError";
    this.code = code;
    this.cause = cause;

    Object.setPrototypeOf(
      this,
      JCSBusinessRegistrationError.prototype
    );
  }
}

// MARK: - Firebase Error Shape

interface FirebaseErrorLike {
  code?: string;
  message?: string;
}

// MARK: - Text Helpers

function cleanText(
  value: string | null | undefined
): string {
  return value?.trim() ?? "";
}

function normalizeEmail(value: string): string {
  return cleanText(value).toLowerCase();
}

function normalizePhone(value: string): string {
  return cleanText(value).replace(/\D/g, "");
}

function normalizeKey(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeInvitationCode(
  value: string | null | undefined
): string | undefined {
  const normalized = cleanText(value).toUpperCase();

  return normalized || undefined;
}

function normalizeWebsite(value: string): string {
  const website = cleanText(value);

  if (!website) {
    return "";
  }

  if (
    website.startsWith("https://") ||
    website.startsWith("http://")
  ) {
    return website;
  }

  return `https://${website}`;
}

function uniqueCleanStrings(
  values: readonly string[]
): string[] {
  const normalizedValues = values
    .map(cleanText)
    .filter(Boolean);

  return Array.from(
    new Set(normalizedValues)
  );
}

// MARK: - Validation Helpers

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    normalizeEmail(value)
  );
}

function isValidWebsite(value: string): boolean {
  const website = cleanText(value);

  if (!website) {
    return true;
  }

  try {
    const url = new URL(
      normalizeWebsite(website)
    );

    return Boolean(url.hostname);
  } catch {
    return false;
  }
}

function throwIfAborted(
  signal?: AbortSignal
): void {
  if (!signal?.aborted) {
    return;
  }

  throw new JCSBusinessRegistrationError(
    "cancelled",
    "Business registration was cancelled."
  );
}

// MARK: - Environment Helpers

function resolvedLocaleIdentifier(
  requestedLocale?: string
): string {
  const requested = cleanText(requestedLocale);

  if (requested) {
    return requested;
  }

  if (
    typeof navigator !== "undefined" &&
    navigator.language
  ) {
    return navigator.language;
  }

  return "en-US";
}

function resolvedTimeZoneIdentifier(
  requestedTimeZone?: string
): string {
  const requested = cleanText(requestedTimeZone);

  if (requested) {
    return requested;
  }

  try {
    return (
      Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone || "UTC"
    );
  } catch {
    return "UTC";
  }
}

// MARK: - Progress Helpers

function safePercentage(
  percentage: number
): number {
  return Math.max(
    0,
    Math.min(
      Math.round(percentage),
      100
    )
  );
}

function emitProgress(
  callback:
    | BusinessRegistrationProgressCallback
    | undefined,
  progress: BusinessRegistrationProgress
): void {
  callback?.({
    ...progress,
    percentage: safePercentage(
      progress.percentage
    ),
  });
}

// MARK: - Firebase Error Mapping

function firebaseErrorCodeFrom(
  error: unknown
): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    const firebaseError =
      error as FirebaseErrorLike;

    return cleanText(firebaseError.code);
  }

  return "";
}

function mapAuthenticationError(
  error: unknown
): JCSBusinessRegistrationError {
  const firebaseCode =
    firebaseErrorCodeFrom(error);

  switch (firebaseCode) {
    case "auth/email-already-in-use":
      return new JCSBusinessRegistrationError(
        "email-already-in-use",
        "An account already exists with this email address.",
        error
      );

    case "auth/invalid-email":
      return new JCSBusinessRegistrationError(
        "invalid-email",
        "Enter a valid email address.",
        error
      );

    case "auth/weak-password":
      return new JCSBusinessRegistrationError(
        "weak-password",
        "The password is not strong enough. Use at least 6 characters.",
        error
      );

    case "auth/network-request-failed":
      return new JCSBusinessRegistrationError(
        "authentication-failed",
        "The authentication service could not be reached. Check your internet connection and try again.",
        error
      );

    case "auth/too-many-requests":
      return new JCSBusinessRegistrationError(
        "authentication-failed",
        "Too many registration attempts were made. Wait a moment and try again.",
        error
      );

    case "auth/operation-not-allowed":
      return new JCSBusinessRegistrationError(
        "authentication-failed",
        "Email and password registration is not enabled in Firebase Authentication.",
        error
      );

    default:
      return new JCSBusinessRegistrationError(
        "authentication-failed",
        "The owner account could not be created.",
        error
      );
  }
}

// MARK: - Manager Configuration

export interface JCSBusinessRegistrationManagerConfiguration {
  provisioningEngine: JCSBusinessProvisioningEngine;
}

// MARK: - Registration Manager

export class JCSBusinessRegistrationManager {
  private static provisioningEngine:
    | JCSBusinessProvisioningEngine
    | null = null;

  /**
   * BusinessCreationEngine will be installed through this method
   * when Part 2 is added.
   */
  static configure(
    configuration:
      JCSBusinessRegistrationManagerConfiguration
  ): void {
    this.provisioningEngine =
      configuration.provisioningEngine;
  }

  /**
   * Indicates whether BusinessCreationEngine has already been connected.
   */
  static get isConfigured(): boolean {
    return this.provisioningEngine !== null;
  }

  // MARK: Register Business

  static async registerBusiness(
    request: JCSBusinessRegistrationRequest,
    onProgress?: BusinessRegistrationProgressCallback
  ): Promise<JCSBusinessRegistrationResult> {
    let newlyCreatedFirebaseUser:
      | User
      | null = null;

    let businessProvisioningCompleted = false;

    try {
      // MARK: Validate and Normalize

      emitProgress(onProgress, {
        stage: "validating",
        percentage: 5,
        message:
          "Validating your business information...",
      });

      throwIfAborted(request.signal);

      const normalizedRequest =
        this.normalizeAndValidateRequest(
          request
        );

      throwIfAborted(
        normalizedRequest.signal
      );

      // MARK: Resolve Business Configuration

      emitProgress(onProgress, {
        stage: "resolvingConfiguration",
        percentage: 12,
        message:
          "Resolving your business configuration...",
      });

      const provisioningEngine =
        this.requireProvisioningEngine();

      throwIfAborted(
        normalizedRequest.signal
      );

      // MARK: Create Firebase Authentication

      emitProgress(onProgress, {
        stage: "creatingAuthentication",
        percentage: 20,
        message:
          "Creating the business owner account...",
      });

      let ownerCredential;

      try {
        ownerCredential =
          await createUserWithEmailAndPassword(
            firebaseAuth,
            normalizedRequest.ownerEmail,
            normalizedRequest.password
          );
      } catch (error: unknown) {
        throw mapAuthenticationError(
          error
        );
      }

      newlyCreatedFirebaseUser =
        ownerCredential.user;

      throwIfAborted(
        normalizedRequest.signal
      );

      // MARK: Provision Business Workspace

      const provisioningInput:
        JCSBusinessProvisioningInput = {
          firebaseUser:
            newlyCreatedFirebaseUser,

          firebaseUID:
            newlyCreatedFirebaseUser.uid,

          businessName:
            normalizedRequest.businessName,

          businessPhone:
            normalizedRequest.businessPhone,

          website:
            normalizedRequest.website,

          ownerFullName:
            normalizedRequest.ownerFullName,

          ownerEmail:
            normalizedRequest.ownerEmail,

          ownerPhone:
            normalizedRequest.ownerPhone,

          industryCategoryKey:
            normalizedRequest.industryCategoryKey,

          industryCategoryTitle:
            normalizedRequest.industryCategoryTitle,

          businessModeKey:
            normalizedRequest.businessModeKey,

          businessModeName:
            normalizedRequest.businessModeName,

          recommendedModules:
            normalizedRequest.recommendedModules,

          platformInvitationCode:
            normalizedRequest.platformInvitationCode,

          localeIdentifier:
            normalizedRequest.localeIdentifier,

          timeZoneIdentifier:
            normalizedRequest.timeZoneIdentifier,

          signal:
            normalizedRequest.signal,
        };

      const result =
        await provisioningEngine.createBusiness(
          provisioningInput,
          onProgress
        );

      throwIfAborted(
        normalizedRequest.signal
      );

      businessProvisioningCompleted = true;

      // MARK: Finalize

      emitProgress(onProgress, {
        stage: "finalizing",
        percentage: 96,
        message:
          "Finalizing your business workspace...",
      });

      const finalResult:
        JCSBusinessRegistrationResult = {
          ...result,

          firebaseUID:
            result.firebaseUID ||
            newlyCreatedFirebaseUser.uid,

          businessName:
            result.businessName ||
            normalizedRequest.businessName,

          industryCategoryKey:
            result.industryCategoryKey ||
            normalizedRequest.industryCategoryKey,

          industryCategoryTitle:
            result.industryCategoryTitle ||
            normalizedRequest.industryCategoryTitle,

          businessModeKey:
            result.businessModeKey ||
            normalizedRequest.businessModeKey,

          businessModeName:
            result.businessModeName ||
            normalizedRequest.businessModeName,

          platformInvitationCode:
            result.platformInvitationCode ||
            normalizedRequest.platformInvitationCode,

          nextRoute:
            result.nextRoute ||
            "/dashboard",
        };

      emitProgress(onProgress, {
        stage: "completed",
        percentage: 100,
        message:
          "Your business workspace is ready.",
      });

      return finalResult;
    } catch (error: unknown) {
      const registrationError =
        this.normalizeRegistrationError(
          error
        );

      const wasCancelled =
        registrationError.code ===
        "cancelled";

      /*
       * Authentication cannot be part of a Firestore writeBatch.
       *
       * If Authentication succeeded but business provisioning failed,
       * remove the newly-created Firebase account so the owner can retry
       * registration using the same email address.
       */
      if (
        newlyCreatedFirebaseUser &&
        !businessProvisioningCompleted
      ) {
        try {
          await deleteUser(
            newlyCreatedFirebaseUser
          );
        } catch (rollbackError: unknown) {
          console.error(
            "❌ JCS registration authentication rollback failed:",
            rollbackError
          );

          if (!wasCancelled) {
            emitProgress(onProgress, {
              stage: "failed",
              percentage: 0,
              message:
                "Registration failed and the temporary owner account could not be removed automatically.",
            });

            throw new JCSBusinessRegistrationError(
              "rollback-failed",
              "The business was not created, but the temporary owner account could not be removed automatically. Contact the platform administrator before trying again.",
              {
                registrationError,
                rollbackError,
              }
            );
          }
        }
      }

      emitProgress(onProgress, {
        stage: wasCancelled
          ? "cancelled"
          : "failed",

        percentage: 0,

        message:
          registrationError.message,
      });

      throw registrationError;
    }
  }

  // MARK: Normalize and Validate Request

  private static normalizeAndValidateRequest(
    request: JCSBusinessRegistrationRequest
  ): NormalizedRegistrationRequest {
    const businessName = cleanText(
      request.businessName
    );

    const businessPhone =
      normalizePhone(
        request.businessPhone
      );

    const website =
      normalizeWebsite(
        request.website
      );

    const ownerFullName = cleanText(
      request.ownerFullName
    );

    const ownerEmail =
      normalizeEmail(
        request.ownerEmail
      );

    const ownerPhone =
      normalizePhone(
        request.ownerPhone ||
          request.businessPhone
      );

    const password =
      request.password;

    const industryCategoryKey =
      normalizeKey(
        request.industryCategoryKey
      );

    const industryCategoryTitle =
      cleanText(
        request.industryCategoryTitle
      );

    const businessModeKey =
      normalizeKey(
        request.businessModeKey
      );

    const businessModeName =
      cleanText(
        request.businessModeName
      );

    const recommendedModules =
      uniqueCleanStrings(
        request.recommendedModules ?? []
      );

    const platformInvitationCode =
      normalizeInvitationCode(
        request.platformInvitationCode
      );

    if (!businessName) {
      throw new JCSBusinessRegistrationError(
        "invalid-request",
        "Business name is required."
      );
    }

    if (!ownerFullName) {
      throw new JCSBusinessRegistrationError(
        "invalid-request",
        "The business owner's full name is required."
      );
    }

    if (!isValidEmail(ownerEmail)) {
      throw new JCSBusinessRegistrationError(
        "invalid-email",
        "Enter a valid owner email address."
      );
    }

    if (password.length < 6) {
      throw new JCSBusinessRegistrationError(
        "weak-password",
        "The password must contain at least 6 characters."
      );
    }

    if (!industryCategoryKey) {
      throw new JCSBusinessRegistrationError(
        "invalid-request",
        "Industry category is required."
      );
    }

    if (!industryCategoryTitle) {
      throw new JCSBusinessRegistrationError(
        "invalid-request",
        "Industry category title is required."
      );
    }

    if (!businessModeKey) {
      throw new JCSBusinessRegistrationError(
        "invalid-request",
        "Business mode is required."
      );
    }

    if (!businessModeName) {
      throw new JCSBusinessRegistrationError(
        "invalid-request",
        "Business mode name is required."
      );
    }

    if (!isValidWebsite(website)) {
      throw new JCSBusinessRegistrationError(
        "invalid-request",
        "Enter a valid business website."
      );
    }

    return {
      businessName,
      businessPhone,
      website,

      ownerFullName,
      ownerEmail,
      ownerPhone,

      password,

      industryCategoryKey,
      industryCategoryTitle,

      businessModeKey,
      businessModeName,

      recommendedModules,

      platformInvitationCode,

      localeIdentifier:
        resolvedLocaleIdentifier(
          request.localeIdentifier
        ),

      timeZoneIdentifier:
        resolvedTimeZoneIdentifier(
          request.timeZoneIdentifier
        ),

      signal:
        request.signal,
    };
  }

  // MARK: Require Provisioning Engine

  private static requireProvisioningEngine():
    JCSBusinessProvisioningEngine {
    if (this.provisioningEngine) {
      return this.provisioningEngine;
    }

    throw new JCSBusinessRegistrationError(
      "provisioning-engine-not-configured",
      "BusinessCreationEngine has not been connected to JCSBusinessRegistrationManager yet."
    );
  }

  // MARK: Normalize Registration Error

  private static normalizeRegistrationError(
    error: unknown
  ): JCSBusinessRegistrationError {
    if (
      error instanceof
      JCSBusinessRegistrationError
    ) {
      return error;
    }

    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      return new JCSBusinessRegistrationError(
        "cancelled",
        "Business registration was cancelled.",
        error
      );
    }

    if (
      error instanceof Error
    ) {
      return new JCSBusinessRegistrationError(
        "business-creation-failed",
        error.message ||
          "The business could not be created.",
        error
      );
    }

    return new JCSBusinessRegistrationError(
      "unknown",
      "The business could not be created because an unexpected error occurred.",
      error
    );
  }
}

// MARK: - Convenience Export

export async function registerJCSBusiness(
  request: JCSBusinessRegistrationRequest,
  onProgress?: BusinessRegistrationProgressCallback
): Promise<JCSBusinessRegistrationResult> {
  return JCSBusinessRegistrationManager.registerBusiness(
    request,
    onProgress
  );
}