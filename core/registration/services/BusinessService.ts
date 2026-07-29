/**
 * ==============================================================
 * JCS BUSINESS SUITE WEB
 * BusinessService.ts
 * --------------------------------------------------------------
 * Firestore service responsible for creating the operational
 * Business document during Business Owner registration.
 *
 * Single responsibility:
 * - Generate the official businessID.
 * - Create the Business document in Firestore.
 * - Return a JCS-owned result object.
 * - Support rollback if a later registration step fails.
 *
 * This service does not create:
 * - Firebase Authentication users
 * - AppUser
 * - AppSettings
 * - PlatformClient
 * - Business DNA
 * ==============================================================
 */

import {
  collection,
  deleteDoc,
  doc,
  setDoc,
  Timestamp,
  type Firestore,
} from "firebase/firestore";

/**
 * Official Firestore collection used for operational businesses.
 *
 * Keep this name identical across:
 * - Web
 * - iPhone
 * - iPad
 * - Mac
 * - Future Android and Windows clients
 */
export const BUSINESS_COLLECTION_NAME = "businesses";

/**
 * Information required to create an operational business.
 */
export interface CreateBusinessRequest {
  businessName: string;

  /**
   * Firebase Authentication UID of the Business Owner.
   */
  firebaseUID: string;

  /**
   * Stable owner identifier used throughout JCS Business Suite.
   *
   * At this stage it normally matches firebaseUID, but the field
   * remains explicit so the architecture does not depend on that
   * assumption forever.
   */
  ownerUID: string;

  /**
   * Optional business category collected during signup.
   */
  businessCategory?: string;

  /**
   * Optional invitation that originated the registration.
   */
  invitationID?: string;

  /**
   * Optional platform client record prepared before registration.
   */
  platformClientID?: string;
}

/**
 * Application-owned result returned after the business document
 * has been created.
 */
export interface BusinessCreationResult {
  businessID: string;
  ownerUID: string;
  firebaseUID: string;
  businessName: string;
  businessCategory?: string;
  documentPath: string;
  createdAt: string;
}

/**
 * Firestore shape stored in the businesses collection.
 */
export interface BusinessFirestoreDocument {
  id: string;
  businessID: string;

  businessName: string;
  normalizedBusinessName: string;

  ownerUID: string;
  firebaseUID: string;

  businessCategory: string | null;

  platformClientID: string | null;
  invitationID: string | null;

  status: "active";
  isActive: boolean;

  source: "web";
  schemaVersion: number;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Standardized BusinessService error.
 */
export class BusinessServiceError extends Error {
  readonly code: string;
  readonly originalError?: unknown;

  constructor(
    code: string,
    message: string,
    originalError?: unknown
  ) {
    super(message);

    this.name = "BusinessServiceError";
    this.code = code;
    this.originalError = originalError;

    Object.setPrototypeOf(
      this,
      BusinessServiceError.prototype
    );
  }
}

/**
 * Firestore service that creates the operational business.
 */
export class BusinessService {
  private readonly db: Firestore;
  private readonly collectionName: string;

  constructor(
    db: Firestore,
    collectionName: string = BUSINESS_COLLECTION_NAME
  ) {
    this.db = db;
    this.collectionName = collectionName;
  }

  /**
   * Creates the official Business document.
   *
   * The Firestore document ID becomes the official businessID.
   */
  async createBusiness(
    request: CreateBusinessRequest
  ): Promise<BusinessCreationResult> {
    const normalizedRequest =
      this.normalizeAndValidateRequest(request);

    const businessReference = doc(
      collection(this.db, this.collectionName)
    );

    const businessID = businessReference.id;
    const now = Timestamp.now();

    const businessDocument: BusinessFirestoreDocument = {
      id: businessID,
      businessID,

      businessName: normalizedRequest.businessName,
      normalizedBusinessName:
        normalizedRequest.businessName.toLowerCase(),

      ownerUID: normalizedRequest.ownerUID,
      firebaseUID: normalizedRequest.firebaseUID,

      businessCategory:
        normalizedRequest.businessCategory ?? null,

      platformClientID:
        normalizedRequest.platformClientID ?? null,

      invitationID:
        normalizedRequest.invitationID ?? null,

      status: "active",
      isActive: true,

      source: "web",
      schemaVersion: 1,

      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(
        businessReference,
        businessDocument
      );

      return {
        businessID,
        ownerUID: normalizedRequest.ownerUID,
        firebaseUID: normalizedRequest.firebaseUID,
        businessName: normalizedRequest.businessName,
        businessCategory:
          normalizedRequest.businessCategory,
        documentPath: businessReference.path,
        createdAt: now.toDate().toISOString(),
      };
    } catch (error: unknown) {
      throw this.normalizeFirestoreError(error);
    }
  }

  /**
   * Deletes a Business document as a rollback operation.
   *
   * This method will be used by the registration executor if a
   * later step fails after the business has already been created.
   */
  async rollbackBusiness(
    businessID: string
  ): Promise<void> {
    const normalizedBusinessID =
      this.requireText(
        businessID,
        "A businessID is required to rollback a business."
      );

    try {
      const businessReference = doc(
        this.db,
        this.collectionName,
        normalizedBusinessID
      );

      await deleteDoc(businessReference);
    } catch (error: unknown) {
      console.error(
        "[BusinessService] Unable to rollback Business document:",
        error
      );
    }
  }

  /**
   * Validates and normalizes input before writing to Firestore.
   */
  private normalizeAndValidateRequest(
    request: CreateBusinessRequest
  ): CreateBusinessRequest {
    if (!request || typeof request !== "object") {
      throw new BusinessServiceError(
        "business/invalid-request",
        "A valid Business creation request is required."
      );
    }

    const businessName = this.requireText(
      request.businessName,
      "The business name is required."
    );

    const firebaseUID = this.requireText(
      request.firebaseUID,
      "The Firebase UID is required to create the business."
    );

    const ownerUID = this.requireText(
      request.ownerUID,
      "The owner UID is required to create the business."
    );

    const businessCategory =
      this.optionalText(request.businessCategory);

    const invitationID =
      this.optionalText(request.invitationID);

    const platformClientID =
      this.optionalText(request.platformClientID);

    return {
      businessName,
      firebaseUID,
      ownerUID,
      businessCategory,
      invitationID,
      platformClientID,
    };
  }

  /**
   * Requires a non-empty string.
   */
  private requireText(
    value: unknown,
    message: string
  ): string {
    if (typeof value !== "string") {
      throw new BusinessServiceError(
        "business/missing-required-field",
        message
      );
    }

    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new BusinessServiceError(
        "business/missing-required-field",
        message
      );
    }

    return normalizedValue;
  }

  /**
   * Normalizes an optional string.
   */
  private optionalText(
    value: unknown
  ): string | undefined {
    if (typeof value !== "string") {
      return undefined;
    }

    const normalizedValue = value.trim();

    return normalizedValue || undefined;
  }

  /**
   * Converts Firestore and unknown errors into stable JCS errors.
   */
  private normalizeFirestoreError(
    error: unknown
  ): BusinessServiceError {
    const code = this.readErrorCode(error);

    switch (code) {
      case "permission-denied":
      case "firestore/permission-denied":
        return new BusinessServiceError(
          code,
          "Firestore security rules did not allow creation of the business.",
          error
        );

      case "unavailable":
      case "firestore/unavailable":
        return new BusinessServiceError(
          code,
          "Firestore is temporarily unavailable. Check the connection and try again.",
          error
        );

      case "unauthenticated":
      case "firestore/unauthenticated":
        return new BusinessServiceError(
          code,
          "The Business Owner must be authenticated before the business can be created.",
          error
        );

      case "deadline-exceeded":
      case "firestore/deadline-exceeded":
        return new BusinessServiceError(
          code,
          "Firestore took too long to create the business. Try again.",
          error
        );

      default:
        return new BusinessServiceError(
          code ?? "business/firestore-write-failed",
          this.readErrorMessage(error) ??
            "Firestore could not create the business.",
          error
        );
    }
  }

  /**
   * Reads a Firebase-style error code safely.
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
   * Reads an error message safely.
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

export default BusinessService;