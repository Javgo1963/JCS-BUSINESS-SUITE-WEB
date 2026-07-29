/**
 * ==============================================================
 * JCS BUSINESS SUITE WEB
 * BusinessOwnerService.ts
 * --------------------------------------------------------------
 * Firestore service responsible for creating the AppUser document
 * for the Business Owner during business registration.
 *
 * This implementation mirrors the logical structure of AppUser.swift:
 *
 * - Identity
 * - Firebase / SaaS tenant identity
 * - Role
 * - Customer permissions
 * - Project permissions
 * - Business permissions
 * - Management permissions
 * - Compliance / facility permissions
 * - Reports / administrative permissions
 *
 * Single responsibility:
 * - Create the Business Owner AppUser document.
 * - Apply administrator permissions.
 * - Support rollback if a later registration step fails.
 *
 * This service does not:
 * - Create the Firebase Authentication account.
 * - Create the Business document.
 * - Create AppSettings.
 * - Create PlatformClient.
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
 * Official Firestore collection used for JCS application users.
 *
 * Keep this collection name synchronized across all platforms.
 */
export const APP_USERS_COLLECTION_NAME = "appUsers";

/**
 * Roles synchronized with UserRole in the Apple application.
 */
export type AppUserRole =
  | "admin"
  | "manager"
  | "employee"
  | "customer"
  | "provider";

/**
 * Request required to create the Business Owner AppUser.
 */
export interface CreateBusinessOwnerRequest {
  /**
   * Firebase Authentication UID.
   */
  firebaseUID: string;

  /**
   * Stable owner identifier.
   *
   * During initial business registration this normally matches
   * firebaseUID.
   */
  ownerUID: string;

  /**
   * Official operational business identifier.
   */
  businessID: string;

  businessName: string;

  fullName: string;
  email: string;

  /**
   * Username defaults to the normalized email address when omitted.
   */
  username?: string;

  phone?: string;
  addressLine1?: string;
  addressLine2?: string;

  /**
   * Business Owners are administrators by default.
   */
  role?: AppUserRole;

  /**
   * Must remain false for normal Business Owners.
   *
   * Platform administrator access must never be inferred from the
   * username, email address, business ownership, or role.
   */
  isPlatformAdministrator?: boolean;
}

/**
 * Result returned after creating the Business Owner AppUser.
 */
export interface BusinessOwnerCreationResult {
  appUserID: string;

  firebaseUID: string;
  ownerUID: string;
  businessID: string;

  businessName: string;
  fullName: string;
  email: string;
  username: string;

  role: AppUserRole;
  isBusinessOwner: boolean;
  isPlatformAdministrator: boolean;

  documentPath: string;
  createdAt: string;
}

/**
 * Permission structure mirrored from AppUser.swift.
 */
export interface AppUserPermissions {
  // Customer Store Permissions

  canAccessCustomerHome: boolean;
  canAccessCatalog: boolean;
  canAccessFavorites: boolean;
  canAccessCart: boolean;
  canAccessCheckout: boolean;
  canAccessCustomerAccount: boolean;
  canAccessOrderHistory: boolean;
  canAccessTracking: boolean;

  // Project / Event Customer Permissions

  canAccessProjects: boolean;
  canViewProjectDetails: boolean;
  canViewProjectPhotos: boolean;
  canViewProgressPhotos: boolean;
  canViewProjectGallery: boolean;
  canCreateProjects: boolean;
  canEditOwnProjects: boolean;
  canUploadProjectPhotos: boolean;
  canCommentOnProjects: boolean;

  // Business / Employee Permissions

  canAccessDashboard: boolean;
  canAccessPOS: boolean;
  canAccessProducts: boolean;
  canAccessInventory: boolean;
  canAccessOrders: boolean;
  canAccessReturns: boolean;
  canAccessServices: boolean;
  canAccessAppointments: boolean;
  canAccessTransportation: boolean;
  canAccessReceiving: boolean;
  canAccessShipping: boolean;
  canAccessBackorders: boolean;

  // Management Permissions

  canManageCustomers: boolean;
  canManageEmployees: boolean;
  canManageProviders: boolean;
  canManageAppUsers: boolean;
  canManageSettings: boolean;

  // Compliance / Facility Permissions

  canAccessCompliance: boolean;
  canManageCompliance: boolean;
  canAccessFacilities: boolean;
  canManageFacilities: boolean;

  // Reports / Administrative Permissions

  canAccessInsights: boolean;
  canExportReports: boolean;
  canSeeFinancials: boolean;
  canSeeCostsAndProfit: boolean;
}

/**
 * Firestore representation of AppUser.swift.
 *
 * profileImageData is intentionally omitted during registration.
 * Images should later be stored in Firebase Storage and represented
 * through a storage path or URL rather than raw binary Firestore data.
 */
export interface AppUserFirestoreDocument
  extends AppUserPermissions {
  // Identity

  id: string;
  appUserID: string;

  username: string;
  fullName: string;
  email: string;
  phone: string;

  addressLine1: string;
  addressLine2: string;

  roleRawValue: AppUserRole;
  role: AppUserRole;

  isActive: boolean;

  profileImageURL: string | null;
  profileImageStoragePath: string | null;

  // Firebase / SaaS Tenant

  firebaseUID: string;
  businessID: string;
  ownerUID: string;

  businessName: string;

  isBusinessOwner: boolean;
  isPlatformAdministrator: boolean;

  // Platform metadata

  source: "web";
  schemaVersion: number;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Standardized BusinessOwnerService error.
 */
export class BusinessOwnerServiceError extends Error {
  readonly code: string;
  readonly originalError?: unknown;

  constructor(
    code: string,
    message: string,
    originalError?: unknown
  ) {
    super(message);

    this.name = "BusinessOwnerServiceError";
    this.code = code;
    this.originalError = originalError;

    Object.setPrototypeOf(
      this,
      BusinessOwnerServiceError.prototype
    );
  }
}

/**
 * Firestore service responsible for creating the AppUser belonging
 * to the newly registered Business Owner.
 */
export class BusinessOwnerService {
  private readonly db: Firestore;
  private readonly collectionName: string;

  constructor(
    db: Firestore,
    collectionName: string = APP_USERS_COLLECTION_NAME
  ) {
    this.db = db;
    this.collectionName = collectionName;
  }

  /**
   * Creates the Business Owner AppUser document.
   *
   * The Firebase UID becomes the AppUser document ID.
   *
   * Benefits:
   * - Fast lookup after authentication.
   * - One canonical AppUser document per Firebase identity.
   * - Consistent identity across Web, iPhone, iPad and Mac.
   */
  async createBusinessOwner(
    request: CreateBusinessOwnerRequest
  ): Promise<BusinessOwnerCreationResult> {
    const normalizedRequest =
      this.normalizeAndValidateRequest(request);

    const appUserID = normalizedRequest.firebaseUID;

    const appUserReference = doc(
      this.db,
      this.collectionName,
      appUserID
    );

    const now = Timestamp.now();

    const role =
      normalizedRequest.role ?? "admin";

    const permissions =
      this.createDefaultPermissions(role);

    const appUserDocument: AppUserFirestoreDocument = {
      // Identity

      id: appUserID,
      appUserID,

      username: normalizedRequest.username,
      fullName: normalizedRequest.fullName,
      email: normalizedRequest.email,
      phone: normalizedRequest.phone,

      addressLine1:
        normalizedRequest.addressLine1,

      addressLine2:
        normalizedRequest.addressLine2,

      roleRawValue: role,
      role,

      isActive: true,

      profileImageURL: null,
      profileImageStoragePath: null,

      // Firebase / SaaS Tenant

      firebaseUID:
        normalizedRequest.firebaseUID,

      businessID:
        normalizedRequest.businessID,

      ownerUID:
        normalizedRequest.ownerUID,

      businessName:
        normalizedRequest.businessName,

      isBusinessOwner: true,

      isPlatformAdministrator:
        normalizedRequest.isPlatformAdministrator,

      // Permissions

      ...permissions,

      // Platform metadata

      source: "web",
      schemaVersion: 1,

      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(
        appUserReference,
        appUserDocument
      );

      return {
        appUserID,

        firebaseUID:
          normalizedRequest.firebaseUID,

        ownerUID:
          normalizedRequest.ownerUID,

        businessID:
          normalizedRequest.businessID,

        businessName:
          normalizedRequest.businessName,

        fullName:
          normalizedRequest.fullName,

        email:
          normalizedRequest.email,

        username:
          normalizedRequest.username,

        role,

        isBusinessOwner: true,

        isPlatformAdministrator:
          normalizedRequest.isPlatformAdministrator,

        documentPath:
          appUserReference.path,

        createdAt:
          now.toDate().toISOString(),
      };
    } catch (error: unknown) {
      throw this.normalizeFirestoreError(error);
    }
  }

  /**
   * Deletes the Business Owner AppUser document as a rollback action.
   *
   * This will be used by the registration executor if a later
   * registration operation fails.
   */
  async rollbackBusinessOwner(
    appUserID: string
  ): Promise<void> {
    const normalizedAppUserID =
      this.requireText(
        appUserID,
        "An AppUser ID is required to rollback the Business Owner."
      );

    try {
      const appUserReference = doc(
        this.db,
        this.collectionName,
        normalizedAppUserID
      );

      await deleteDoc(appUserReference);
    } catch (error: unknown) {
      console.error(
        "[BusinessOwnerService] Unable to rollback the Business Owner AppUser:",
        error
      );
    }
  }

  /**
   * Returns the default permissions for the supplied role.
   *
   * This mirrors AppUser.applyDefaultPermissions(for:) from Swift.
   */
  private createDefaultPermissions(
    role: AppUserRole
  ): AppUserPermissions {
    const permissions =
      this.createEmptyPermissions();

    switch (role) {
      case "customer":
        this.applyCustomerPermissions(
          permissions
        );
        break;

      case "provider":
        this.applyProviderPermissions(
          permissions
        );
        break;

      case "employee":
        this.applyEmployeePermissions(
          permissions
        );
        break;

      case "manager":
        this.applyManagerPermissions(
          permissions
        );
        break;

      case "admin":
        this.applyAdministratorPermissions(
          permissions
        );
        break;
    }

    return permissions;
  }

  /**
   * Creates a permission object with every permission disabled.
   *
   * This mirrors resetAllPermissions() from AppUser.swift.
   */
  private createEmptyPermissions(): AppUserPermissions {
    return {
      // Customer Store Permissions

      canAccessCustomerHome: false,
      canAccessCatalog: false,
      canAccessFavorites: false,
      canAccessCart: false,
      canAccessCheckout: false,
      canAccessCustomerAccount: false,
      canAccessOrderHistory: false,
      canAccessTracking: false,

      // Project Permissions

      canAccessProjects: false,
      canViewProjectDetails: false,
      canViewProjectPhotos: false,
      canViewProgressPhotos: false,
      canViewProjectGallery: false,
      canCreateProjects: false,
      canEditOwnProjects: false,
      canUploadProjectPhotos: false,
      canCommentOnProjects: false,

      // Business Permissions

      canAccessDashboard: false,
      canAccessPOS: false,
      canAccessProducts: false,
      canAccessInventory: false,
      canAccessOrders: false,
      canAccessReturns: false,
      canAccessServices: false,
      canAccessAppointments: false,
      canAccessTransportation: false,
      canAccessReceiving: false,
      canAccessShipping: false,
      canAccessBackorders: false,

      // Management Permissions

      canManageCustomers: false,
      canManageEmployees: false,
      canManageProviders: false,
      canManageAppUsers: false,
      canManageSettings: false,

      // Compliance / Facility Permissions

      canAccessCompliance: false,
      canManageCompliance: false,
      canAccessFacilities: false,
      canManageFacilities: false,

      // Reports / Admin Permissions

      canAccessInsights: false,
      canExportReports: false,
      canSeeFinancials: false,
      canSeeCostsAndProfit: false,
    };
  }

  /**
   * Mirrors applyDefaultCustomerPermissions().
   */
  private applyCustomerPermissions(
    permissions: AppUserPermissions
  ): void {
    permissions.canAccessCustomerHome = true;
    permissions.canAccessCatalog = true;
    permissions.canAccessFavorites = true;
    permissions.canAccessCart = true;
    permissions.canAccessCheckout = true;
    permissions.canAccessCustomerAccount = true;
    permissions.canAccessOrderHistory = true;
    permissions.canAccessTracking = true;
  }

  /**
   * Mirrors applyDefaultProviderPermissions().
   */
  private applyProviderPermissions(
    permissions: AppUserPermissions
  ): void {
    permissions.canAccessDashboard = true;
    permissions.canAccessTransportation = true;
  }

  /**
   * Mirrors applyDefaultEmployeePermissions().
   */
  private applyEmployeePermissions(
    permissions: AppUserPermissions
  ): void {
    permissions.canAccessDashboard = true;
    permissions.canAccessPOS = true;
    permissions.canAccessProducts = true;
    permissions.canAccessInventory = true;
    permissions.canAccessOrders = true;
    permissions.canAccessReturns = true;
    permissions.canAccessServices = true;
    permissions.canAccessAppointments = true;
    permissions.canAccessTransportation = true;
    permissions.canAccessReceiving = true;
    permissions.canAccessShipping = true;
  }

  /**
   * Mirrors applyDefaultManagerPermissions().
   */
  private applyManagerPermissions(
    permissions: AppUserPermissions
  ): void {
    this.applyEmployeePermissions(
      permissions
    );

    permissions.canAccessProjects = true;
    permissions.canViewProjectDetails = true;
    permissions.canViewProjectPhotos = true;
    permissions.canViewProgressPhotos = true;
    permissions.canViewProjectGallery = true;
    permissions.canCreateProjects = true;
    permissions.canEditOwnProjects = true;
    permissions.canUploadProjectPhotos = true;
    permissions.canCommentOnProjects = true;

    permissions.canAccessBackorders = true;

    permissions.canManageCustomers = true;
    permissions.canManageEmployees = true;
    permissions.canManageProviders = true;

    permissions.canAccessCompliance = true;
    permissions.canManageCompliance = true;

    permissions.canAccessFacilities = true;
    permissions.canManageFacilities = true;

    permissions.canAccessInsights = true;
    permissions.canExportReports = true;
    permissions.canSeeFinancials = true;
    permissions.canSeeCostsAndProfit = true;
  }

  /**
   * Mirrors applyDefaultAdministratorPermissions().
   */
  private applyAdministratorPermissions(
    permissions: AppUserPermissions
  ): void {
    this.applyManagerPermissions(
      permissions
    );

    permissions.canManageAppUsers = true;
    permissions.canManageSettings = true;
  }

  /**
   * Validates and normalizes the request.
   */
  private normalizeAndValidateRequest(
    request: CreateBusinessOwnerRequest
  ): Required<
    Omit<
      CreateBusinessOwnerRequest,
      "role"
    >
  > & {
    role: AppUserRole;
  } {
    if (!request || typeof request !== "object") {
      throw new BusinessOwnerServiceError(
        "app-user/invalid-request",
        "A valid Business Owner creation request is required."
      );
    }

    const firebaseUID =
      this.requireText(
        request.firebaseUID,
        "The Firebase UID is required to create the Business Owner."
      );

    const ownerUID =
      this.requireText(
        request.ownerUID,
        "The owner UID is required to create the Business Owner."
      );

    const businessID =
      this.requireText(
        request.businessID,
        "The business ID is required to create the Business Owner."
      );

    const businessName =
      this.requireText(
        request.businessName,
        "The business name is required to create the Business Owner."
      );

    const fullName =
      this.requireText(
        request.fullName,
        "The Business Owner full name is required."
      );

    const email =
      this.normalizeEmail(
        request.email
      );

    if (!email) {
      throw new BusinessOwnerServiceError(
        "app-user/missing-email",
        "The Business Owner email address is required."
      );
    }

    if (!this.isValidEmail(email)) {
      throw new BusinessOwnerServiceError(
        "app-user/invalid-email",
        "Enter a valid Business Owner email address."
      );
    }

    const username =
      this.optionalText(request.username) ??
      email;

    const role =
      request.role ?? "admin";

    if (!this.isValidRole(role)) {
      throw new BusinessOwnerServiceError(
        "app-user/invalid-role",
        "The selected AppUser role is not valid."
      );
    }

    return {
      firebaseUID,
      ownerUID,
      businessID,
      businessName,
      fullName,
      email,
      username,

      phone:
        this.optionalText(request.phone) ?? "",

      addressLine1:
        this.optionalText(
          request.addressLine1
        ) ?? "",

      addressLine2:
        this.optionalText(
          request.addressLine2
        ) ?? "",

      role,

      isPlatformAdministrator:
        request.isPlatformAdministrator === true,
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
      throw new BusinessOwnerServiceError(
        "app-user/missing-required-field",
        message
      );
    }

    const normalizedValue =
      value.trim();

    if (!normalizedValue) {
      throw new BusinessOwnerServiceError(
        "app-user/missing-required-field",
        message
      );
    }

    return normalizedValue;
  }

  /**
   * Normalizes an optional text value.
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
   * Normalizes an email like AppUser.normalizedEmail().
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
   * Validates roles synchronized with UserRole.
   */
  private isValidRole(
    role: string
  ): role is AppUserRole {
    return [
      "admin",
      "manager",
      "employee",
      "customer",
      "provider",
    ].includes(role);
  }

  /**
   * Converts Firestore and unknown errors into stable JCS errors.
   */
  private normalizeFirestoreError(
    error: unknown
  ): BusinessOwnerServiceError {
    const code =
      this.readErrorCode(error);

    switch (code) {
      case "permission-denied":
      case "firestore/permission-denied":
        return new BusinessOwnerServiceError(
          code,
          "Firestore security rules did not allow creation of the Business Owner AppUser.",
          error
        );

      case "unauthenticated":
      case "firestore/unauthenticated":
        return new BusinessOwnerServiceError(
          code,
          "The Business Owner must be authenticated before the AppUser can be created.",
          error
        );

      case "unavailable":
      case "firestore/unavailable":
        return new BusinessOwnerServiceError(
          code,
          "Firestore is temporarily unavailable. Check the connection and try again.",
          error
        );

      case "deadline-exceeded":
      case "firestore/deadline-exceeded":
        return new BusinessOwnerServiceError(
          code,
          "Firestore took too long to create the Business Owner. Try again.",
          error
        );

      default:
        return new BusinessOwnerServiceError(
          code ??
            "app-user/firestore-write-failed",
          this.readErrorMessage(error) ??
            "Firestore could not create the Business Owner AppUser.",
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

export default BusinessOwnerService;