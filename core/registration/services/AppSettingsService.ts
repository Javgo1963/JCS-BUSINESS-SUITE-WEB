/**
 * ==============================================================
 * JCS BUSINESS SUITE WEB
 * AppSettingsService.ts
 * --------------------------------------------------------------
 * Firestore service responsible for creating the initial
 * AppSettings document during Business Owner registration.
 *
 * Firestore structure:
 *
 * appSettings/{businessID}
 *
 * This implementation mirrors the logical structure of
 * AppSettings.swift:
 *
 * - Tenant / Business identity
 * - Company information
 * - Localization
 * - Financial settings
 * - Branding
 * - Logo behavior
 * - Cloud synchronization
 * - Timestamps
 *
 * Single responsibility:
 * - Create the initial AppSettings document.
 * - Normalize business configuration values.
 * - Support rollback if a later registration step fails.
 *
 * This service does not:
 * - Create Firebase Authentication users.
 * - Create Business documents.
 * - Create AppUser documents.
 * - Create PlatformClient documents.
 * - Create Business DNA.
 * ==============================================================
 */

import {
  deleteDoc,
  doc,
  setDoc,
  Timestamp,
  type Firestore,
} from "firebase/firestore";

/**
 * Official Firestore collection used for business settings.
 *
 * Every business has exactly one primary AppSettings document:
 *
 * appSettings/{businessID}
 */
export const APP_SETTINGS_COLLECTION_NAME = "appSettings";

/**
 * Default values synchronized with AppSettings.swift.
 */
export const DEFAULT_COMPANY_NAME = "My Company";
export const DEFAULT_ACCENT_COLOR_NAME = "blue";
export const DEFAULT_LANGUAGE_CODE = "system";

/**
 * Information required to create the initial AppSettings document.
 */
export interface CreateAppSettingsRequest {
  /**
   * Official JCS operational business identifier.
   */
  businessID: string;

  /**
   * Stable identifier of the Business Owner.
   */
  ownerUID: string;

  /**
   * UID of the user creating the settings.
   *
   * During normal Business Owner registration this will usually
   * match ownerUID and firebaseUID.
   */
  createdByUID: string;

  /**
   * Business or company name.
   */
  companyName: string;

  addressLine1?: string;
  addressLine2?: string;

  phone?: string;
  email?: string;

  /**
   * Examples:
   * - system
   * - en
   * - es
   * - es-US
   */
  languageCode?: string;

  /**
   * Tax percentage represented from 0 through 100.
   *
   * Examples:
   * - 0
   * - 6.5
   * - 7.25
   */
  taxPercent?: number;

  logoFileName?: string;
  backgroundFileName?: string;
  accentColorName?: string;

  /**
   * Determines whether the application accent color should also
   * be applied to compatible logos.
   */
  useAccentColorForLogo?: boolean;
}

/**
 * Result returned after the AppSettings document is created.
 */
export interface AppSettingsCreationResult {
  appSettingsID: string;

  firebaseDocumentID: string;

  businessID: string;
  ownerUID: string;
  createdByUID: string;

  companyName: string;
  languageCode: string;

  taxPercent: number;
  accentColorName: string;
  useAccentColorForLogo: boolean;

  documentPath: string;

  createdAt: string;
  updatedAt: string;
  lastCloudSyncDate: string;
}

/**
 * Firestore representation of AppSettings.swift.
 */
export interface AppSettingsFirestoreDocument {
  // Identity

  id: string;

  // Tenant / Business

  businessID: string;
  ownerUID: string;
  createdByUID: string;

  // Company Information

  companyName: string;

  /**
   * Stored explicitly for cross-platform compatibility and easier
   * reading from JavaScript clients.
   *
   * In Swift, businessName is computed from companyName.
   */
  businessName: string;

  addressLine1: string;
  addressLine2: string;

  phone: string;
  email: string;

  // Localization

  languageCode: string;

  // Financial

  taxPercent: number;

  // Branding

  logoFileName: string;
  backgroundFileName: string;
  accentColorName: string;

  // Logo Behavior

  useAccentColorForLogo: boolean;

  // Cloud Synchronization

  firebaseDocumentID: string;
  needsCloudSync: boolean;
  lastCloudSyncDate: Timestamp;

  // Platform Metadata

  source: "web";
  schemaVersion: number;

  // Timestamps

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Standardized AppSettingsService error.
 */
export class AppSettingsServiceError extends Error {
  readonly code: string;
  readonly originalError?: unknown;

  constructor(
    code: string,
    message: string,
    originalError?: unknown
  ) {
    super(message);

    this.name = "AppSettingsServiceError";
    this.code = code;
    this.originalError = originalError;

    Object.setPrototypeOf(
      this,
      AppSettingsServiceError.prototype
    );
  }
}

/**
 * Normalized internal request used after validation.
 */
interface NormalizedCreateAppSettingsRequest {
  businessID: string;
  ownerUID: string;
  createdByUID: string;

  companyName: string;

  addressLine1: string;
  addressLine2: string;

  phone: string;
  email: string;

  languageCode: string;

  taxPercent: number;

  logoFileName: string;
  backgroundFileName: string;
  accentColorName: string;

  useAccentColorForLogo: boolean;
}

/**
 * Firestore service responsible for creating the initial settings
 * belonging to a newly registered business.
 */
export class AppSettingsService {
  private readonly db: Firestore;
  private readonly collectionName: string;

  constructor(
    db: Firestore,
    collectionName: string = APP_SETTINGS_COLLECTION_NAME
  ) {
    this.db = db;
    this.collectionName = collectionName;
  }

  /**
   * Creates the initial AppSettings document.
   *
   * The businessID is used as the Firestore document ID:
   *
   * appSettings/{businessID}
   *
   * This guarantees one canonical settings document per business.
   */
  async createAppSettings(
    request: CreateAppSettingsRequest
  ): Promise<AppSettingsCreationResult> {
    const normalizedRequest =
      this.normalizeAndValidateRequest(request);

    const firebaseDocumentID =
      normalizedRequest.businessID;

    const appSettingsReference = doc(
      this.db,
      this.collectionName,
      firebaseDocumentID
    );

    const appSettingsID =
      this.createStableLocalID();

    const now = Timestamp.now();

    const appSettingsDocument: AppSettingsFirestoreDocument = {
      // Identity

      id: appSettingsID,

      // Tenant / Business

      businessID:
        normalizedRequest.businessID,

      ownerUID:
        normalizedRequest.ownerUID,

      createdByUID:
        normalizedRequest.createdByUID,

      // Company Information

      companyName:
        normalizedRequest.companyName,

      businessName:
        normalizedRequest.companyName,

      addressLine1:
        normalizedRequest.addressLine1,

      addressLine2:
        normalizedRequest.addressLine2,

      phone:
        normalizedRequest.phone,

      email:
        normalizedRequest.email,

      // Localization

      languageCode:
        normalizedRequest.languageCode,

      // Financial

      taxPercent:
        normalizedRequest.taxPercent,

      // Branding

      logoFileName:
        normalizedRequest.logoFileName,

      backgroundFileName:
        normalizedRequest.backgroundFileName,

      accentColorName:
        normalizedRequest.accentColorName,

      // Logo Behavior

      useAccentColorForLogo:
        normalizedRequest.useAccentColorForLogo,

      // Cloud Synchronization

      firebaseDocumentID,

      /**
       * The web registration engine writes directly to Firestore.
       * Therefore, this document is already synchronized.
       */
      needsCloudSync: false,

      lastCloudSyncDate: now,

      // Platform Metadata

      source: "web",
      schemaVersion: 1,

      // Timestamps

      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(
        appSettingsReference,
        appSettingsDocument
      );

      const timestamp =
        now.toDate().toISOString();

      return {
        appSettingsID,

        firebaseDocumentID,

        businessID:
          normalizedRequest.businessID,

        ownerUID:
          normalizedRequest.ownerUID,

        createdByUID:
          normalizedRequest.createdByUID,

        companyName:
          normalizedRequest.companyName,

        languageCode:
          normalizedRequest.languageCode,

        taxPercent:
          normalizedRequest.taxPercent,

        accentColorName:
          normalizedRequest.accentColorName,

        useAccentColorForLogo:
          normalizedRequest.useAccentColorForLogo,

        documentPath:
          appSettingsReference.path,

        createdAt: timestamp,
        updatedAt: timestamp,
        lastCloudSyncDate: timestamp,
      };
    } catch (error: unknown) {
      throw this.normalizeFirestoreError(error);
    }
  }

  /**
   * Deletes the AppSettings document as a rollback action.
   *
   * The registration executor will use this if a later registration
   * step fails after AppSettings has already been created.
   */
  async rollbackAppSettings(
    businessID: string
  ): Promise<void> {
    const normalizedBusinessID =
      this.requireText(
        businessID,
        "A business ID is required to rollback AppSettings."
      );

    try {
      const appSettingsReference = doc(
        this.db,
        this.collectionName,
        normalizedBusinessID
      );

      await deleteDoc(appSettingsReference);
    } catch (error: unknown) {
      console.error(
        "[AppSettingsService] Unable to rollback AppSettings:",
        error
      );
    }
  }

  /**
   * Validates and normalizes all values before writing to Firestore.
   *
   * This mirrors the normalization behavior in AppSettings.swift.
   */
  private normalizeAndValidateRequest(
    request: CreateAppSettingsRequest
  ): NormalizedCreateAppSettingsRequest {
    if (!request || typeof request !== "object") {
      throw new AppSettingsServiceError(
        "app-settings/invalid-request",
        "A valid AppSettings creation request is required."
      );
    }

    const businessID =
      this.requireText(
        request.businessID,
        "The business ID is required to create AppSettings."
      );

    const ownerUID =
      this.requireText(
        request.ownerUID,
        "The owner UID is required to create AppSettings."
      );

    const createdByUID =
      this.requireText(
        request.createdByUID,
        "The creator UID is required to create AppSettings."
      );

    const companyName =
      this.normalizeCompanyName(
        request.companyName
      );

    const email =
      this.normalizeEmail(
        request.email
      );

    if (
      email &&
      !this.isValidEmail(email)
    ) {
      throw new AppSettingsServiceError(
        "app-settings/invalid-email",
        "Enter a valid company email address."
      );
    }

    return {
      businessID,
      ownerUID,
      createdByUID,

      companyName,

      addressLine1:
        this.optionalText(
          request.addressLine1
        ) ?? "",

      addressLine2:
        this.optionalText(
          request.addressLine2
        ) ?? "",

      phone:
        this.optionalText(
          request.phone
        ) ?? "",

      email,

      languageCode:
        this.normalizeLanguageCode(
          request.languageCode
        ),

      taxPercent:
        this.clampTaxPercent(
          request.taxPercent
        ),

      logoFileName:
        this.optionalText(
          request.logoFileName
        ) ?? "",

      backgroundFileName:
        this.optionalText(
          request.backgroundFileName
        ) ?? "",

      accentColorName:
        this.normalizeAccentColorName(
          request.accentColorName
        ),

      useAccentColorForLogo:
        request.useAccentColorForLogo !== false,
    };
  }

  /**
   * Creates the UUID-style identity corresponding to AppSettings.id
   * in the SwiftData model.
   */
  private createStableLocalID(): string {
    if (
      typeof globalThis.crypto !== "undefined" &&
      typeof globalThis.crypto.randomUUID === "function"
    ) {
      return globalThis.crypto.randomUUID();
    }

    /**
     * Compatibility fallback for environments where randomUUID
     * is unavailable.
     */
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      (character) => {
        const randomValue =
          Math.floor(Math.random() * 16);

        const value =
          character === "x"
            ? randomValue
            : (randomValue & 0x3) | 0x8;

        return value.toString(16);
      }
    );
  }

  /**
   * Requires a non-empty normalized string.
   */
  private requireText(
    value: unknown,
    message: string
  ): string {
    if (typeof value !== "string") {
      throw new AppSettingsServiceError(
        "app-settings/missing-required-field",
        message
      );
    }

    const normalizedValue =
      value.trim();

    if (!normalizedValue) {
      throw new AppSettingsServiceError(
        "app-settings/missing-required-field",
        message
      );
    }

    return normalizedValue;
  }

  /**
   * Normalizes optional text values.
   */
  private optionalText(
    value: unknown
  ): string | undefined {
    if (typeof value !== "string") {
      return undefined;
    }

    const normalizedValue =
      value.trim();

    return normalizedValue || undefined;
  }

  /**
   * Mirrors AppSettings.normalizedCompanyName().
   */
  private normalizeCompanyName(
    value: unknown
  ): string {
    if (typeof value !== "string") {
      return DEFAULT_COMPANY_NAME;
    }

    const normalizedValue =
      value.trim();

    return normalizedValue ||
      DEFAULT_COMPANY_NAME;
  }

  /**
   * Mirrors AppSettings.normalizedEmail().
   */
  private normalizeEmail(
    value: unknown
  ): string {
    if (typeof value !== "string") {
      return "";
    }

    return value
      .trim()
      .toLowerCase();
  }

  /**
   * Mirrors AppSettings.normalizedLanguageCode().
   */
  private normalizeLanguageCode(
    value: unknown
  ): string {
    if (typeof value !== "string") {
      return DEFAULT_LANGUAGE_CODE;
    }

    const normalizedValue =
      value.trim();

    return normalizedValue ||
      DEFAULT_LANGUAGE_CODE;
  }

  /**
   * Mirrors AppSettings.normalizedAccentColorName().
   */
  private normalizeAccentColorName(
    value: unknown
  ): string {
    if (typeof value !== "string") {
      return DEFAULT_ACCENT_COLOR_NAME;
    }

    const normalizedValue =
      value.trim();

    return normalizedValue ||
      DEFAULT_ACCENT_COLOR_NAME;
  }

  /**
   * Mirrors AppSettings.clampedTaxPercent().
   *
   * Valid range:
   * 0 through 100.
   */
  private clampTaxPercent(
    value: unknown
  ): number {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value)
    ) {
      return 0;
    }

    return Math.min(
      Math.max(value, 0),
      100
    );
  }

  /**
   * Lightweight email validation.
   */
  private isValidEmail(
    email: string
  ): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );
  }

  /**
   * Converts Firestore and unknown errors into stable JCS errors.
   */
  private normalizeFirestoreError(
    error: unknown
  ): AppSettingsServiceError {
    const code =
      this.readErrorCode(error);

    switch (code) {
      case "permission-denied":
      case "firestore/permission-denied":
        return new AppSettingsServiceError(
          code,
          "Firestore security rules did not allow creation of AppSettings.",
          error
        );

      case "unauthenticated":
      case "firestore/unauthenticated":
        return new AppSettingsServiceError(
          code,
          "The Business Owner must be authenticated before AppSettings can be created.",
          error
        );

      case "unavailable":
      case "firestore/unavailable":
        return new AppSettingsServiceError(
          code,
          "Firestore is temporarily unavailable. Check the connection and try again.",
          error
        );

      case "deadline-exceeded":
      case "firestore/deadline-exceeded":
        return new AppSettingsServiceError(
          code,
          "Firestore took too long to create AppSettings. Try again.",
          error
        );

      case "already-exists":
      case "firestore/already-exists":
        return new AppSettingsServiceError(
          code,
          "AppSettings already exists for this business.",
          error
        );

      default:
        return new AppSettingsServiceError(
          code ??
            "app-settings/firestore-write-failed",
          this.readErrorMessage(error) ??
            "Firestore could not create AppSettings.",
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

export default AppSettingsService;