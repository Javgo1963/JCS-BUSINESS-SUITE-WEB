/**
 * ==============================================================
 * JCS BUSINESS SUITE WEB
 * PlatformClientService.ts
 * --------------------------------------------------------------
 * Firestore service responsible for creating the PlatformClient
 * record for a newly registered business.
 *
 * Firestore structure:
 *
 * platformClients/{businessID}
 *
 * This document connects the operational business with the
 * JCS Business Suite Platform Executive Center.
 *
 * Single responsibility:
 * - Create the PlatformClient administrative record.
 * - Mirror the logical structure of PlatformClient.swift.
 * - Initialize onboarding, subscription, limits and module access.
 * - Support rollback if a later registration step fails.
 *
 * This service does not:
 * - Create Firebase Authentication users.
 * - Create Business documents.
 * - Create AppUser documents.
 * - Create AppSettings.
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

// MARK: - Collection

export const PLATFORM_CLIENTS_COLLECTION_NAME =
  "platformClients";

// MARK: - Billing Provider

export type PlatformBillingProvider =
  | "Manual"
  | "Apple"
  | "Stripe"
  | "None";

// MARK: - Subscription Status

export type PlatformSubscriptionStatus =
  | "Free Trial"
  | "Active"
  | "Past Due"
  | "Grace Period"
  | "Trial Expired"
  | "Suspended"
  | "Canceled"
  | "Inactive";

// MARK: - Platform Client Status

export type PlatformClientStatus =
  | "Invited"
  | "Onboarding"
  | "Active"
  | "Suspended"
  | "Canceled"
  | "Archived"
  | "Pending Deletion";

// MARK: - Owner Account Status

export type PlatformOwnerAccountStatus =
  | "Invited"
  | "Pending Registration"
  | "Active"
  | "Disabled"
  | "Locked"
  | "Removed";

// MARK: - Owner Invitation Status

export type PlatformOwnerInvitationStatus =
  | "Not Invited"
  | "Pending"
  | "Sent"
  | "Accepted"
  | "Expired"
  | "Canceled";

// MARK: - Onboarding Status

export type PlatformOnboardingStatus =
  | "Not Started"
  | "Owner Invited"
  | "Owner Registered"
  | "Business Created"
  | "Settings Completed"
  | "Logo Completed"
  | "Subscription Configured"
  | "Ready";

// MARK: - Defaults

export const DEFAULT_PLATFORM_PLAN_NAME =
  "Starter";

export const DEFAULT_PLATFORM_TRIAL_DAYS =
  7;

export const DEFAULT_BUSINESS_MODE =
  "Retail";

export const DEFAULT_LOCALE_IDENTIFIER =
  "en_US";

export const DEFAULT_TIME_ZONE_IDENTIFIER =
  "America/New_York";

export const DEFAULT_COUNTRY =
  "USA";

export const DEFAULT_RISK_LEVEL =
  "Normal";

// MARK: - Request

export interface CreatePlatformClientRequest {
  // Identity

  businessID: string;
  ownerUID: string;
  ownerFirebaseUID: string;

  // Business

  businessName: string;

  industry?: string;
  businessCategory?: string;
  businessModeRawValue?: string;

  localeIdentifier?: string;
  timeZoneIdentifier?: string;

  // Owner

  ownerFullName: string;
  ownerEmail: string;
  ownerPhone?: string;

  // Invitation summary

  ownerInvitationCode?: string;
  ownerInvitationLink?: string;
  ownerInvitationSentAt?: Date;

  // Business contact

  businessPhone?: string;
  businessEmail?: string;
  supportEmail?: string;
  website?: string;
  taxID?: string;

  // Address

  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;

  // Secondary contact

  secondaryContactName?: string;
  secondaryContactEmail?: string;
  secondaryContactPhone?: string;

  // Billing contact

  billingContactName?: string;
  billingContactEmail?: string;
  billingContactPhone?: string;

  // Subscription

  planName?: string;
  monthlyPrice?: number;
  trialLengthDays?: number;

  billingProvider?: PlatformBillingProvider;

  // Limits

  employeeLimit?: number;
  customerLimit?: number;
  productLimit?: number;
  storageLimitGB?: number;

  // Features

  canCreateInvitations?: boolean;
  canUseAutomaticLogo?: boolean;

  enabledModules?: Iterable<string>;
  disabledModules?: Iterable<string>;

  businessInviteCode?: string;

  // Internal administration

  accountManagerName?: string;
  internalTags?: string;
  riskLevel?: string;
  notes?: string;

  // Audit

  createdByPlatformUID?: string;
  updatedByPlatformUID?: string;
}

// MARK: - Result

export interface PlatformClientCreationResult {
  platformClientID: string;

  businessID: string;
  ownerUID: string;
  ownerFirebaseUID: string;

  businessName: string;
  ownerFullName: string;
  ownerEmail: string;

  clientStatus: PlatformClientStatus;
  ownerAccountStatus: PlatformOwnerAccountStatus;
  ownerInvitationStatus: PlatformOwnerInvitationStatus;
  onboardingStatus: PlatformOnboardingStatus;

  planName: string;
  subscriptionStatus: PlatformSubscriptionStatus;

  trialStartDate: string;
  trialEndDate: string;

  isActive: boolean;

  documentPath: string;

  createdAt: string;
  updatedAt: string;
}

// MARK: - Firestore Document

export interface PlatformClientFirestoreDocument {
  // Identity

  businessID: string;
  ownerUID: string;
  ownerFirebaseUID: string;

  // Business Information

  businessName: string;
  industry: string;
  businessCategory: string;
  businessModeRawValue: string;

  localeIdentifier: string;
  timeZoneIdentifier: string;

  // Owner Information

  ownerFullName: string;
  ownerEmail: string;
  ownerPhone: string;

  // Owner Account and Invitation

  ownerAccountStatusRawValue:
    PlatformOwnerAccountStatus;

  ownerInvitationStatusRawValue:
    PlatformOwnerInvitationStatus;

  ownerInvitationCode: string;
  ownerInvitationLink: string;

  ownerInvitationSentAt: Timestamp | null;
  ownerInvitationAcceptedAt: Timestamp | null;

  // Business Contact Information

  businessPhone: string;
  businessEmail: string;
  supportEmail: string;
  website: string;
  taxID: string;

  // Address

  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;

  // Secondary Contact

  secondaryContactName: string;
  secondaryContactEmail: string;
  secondaryContactPhone: string;

  // Billing Contact

  billingContactName: string;
  billingContactEmail: string;
  billingContactPhone: string;

  // Client Lifecycle

  clientStatusRawValue:
    PlatformClientStatus;

  onboardingStatusRawValue:
    PlatformOnboardingStatus;

  archivedAt: Timestamp | null;
  pendingDeletionAt: Timestamp | null;
  deletionRequestedByUID: string;

  // Subscription

  planName: string;
  subscriptionStatus:
    PlatformSubscriptionStatus;

  monthlyPrice: number;
  isActive: boolean;

  // Trial

  trialLengthDays: number;
  trialStartDate: Timestamp;
  trialEndDate: Timestamp;

  // Subscription Dates

  subscriptionStartDate: Timestamp | null;
  subscriptionEndDate: Timestamp | null;
  nextBillingDate: Timestamp | null;
  lastPaymentDate: Timestamp | null;
  gracePeriodEndDate: Timestamp | null;

  // Suspension and Cancellation

  suspensionReason: string;
  cancellationReason: string;

  // Billing Provider

  billingProviderRawValue:
    PlatformBillingProvider;

  appleOriginalTransactionID: string;
  appleProductID: string;

  stripeCustomerID: string;
  stripeSubscriptionID: string;

  // Plan Limits

  employeeLimit: number;
  customerLimit: number;
  productLimit: number;
  storageLimitGB: number;

  // Features and Modules

  canCreateInvitations: boolean;
  canUseAutomaticLogo: boolean;

  enabledModulesRawValue: string;
  disabledModulesRawValue: string;

  // General Business Join Code

  businessInviteCode: string;

  // Internal Administration

  accountManagerName: string;
  internalTags: string;
  riskLevel: string;
  notes: string;

  // Activity and Security

  lastLoginDate: Timestamp | null;
  lastSyncDate: Timestamp | null;

  lastOwnerPasswordResetRequestedAt:
    Timestamp | null;

  lastOwnerAccessDisabledAt:
    Timestamp | null;

  lastOwnerAccessEnabledAt:
    Timestamp | null;

  // Audit

  createdByPlatformUID: string;
  updatedByPlatformUID: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Platform Metadata

  source: "web";
  schemaVersion: number;
}

// MARK: - Error

export class PlatformClientServiceError extends Error {
  readonly code: string;
  readonly originalError?: unknown;

  constructor(
    code: string,
    message: string,
    originalError?: unknown
  ) {
    super(message);

    this.name =
      "PlatformClientServiceError";

    this.code = code;
    this.originalError = originalError;

    Object.setPrototypeOf(
      this,
      PlatformClientServiceError.prototype
    );
  }
}

// MARK: - Internal Normalized Request

interface NormalizedCreatePlatformClientRequest {
  businessID: string;
  ownerUID: string;
  ownerFirebaseUID: string;

  businessName: string;
  industry: string;
  businessCategory: string;
  businessModeRawValue: string;

  localeIdentifier: string;
  timeZoneIdentifier: string;

  ownerFullName: string;
  ownerEmail: string;
  ownerPhone: string;

  ownerInvitationCode: string;
  ownerInvitationLink: string;
  ownerInvitationSentAt: Date | null;

  businessPhone: string;
  businessEmail: string;
  supportEmail: string;
  website: string;
  taxID: string;

  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;

  secondaryContactName: string;
  secondaryContactEmail: string;
  secondaryContactPhone: string;

  billingContactName: string;
  billingContactEmail: string;
  billingContactPhone: string;

  planName: string;
  monthlyPrice: number;
  trialLengthDays: number;

  billingProvider:
    PlatformBillingProvider;

  employeeLimit: number;
  customerLimit: number;
  productLimit: number;
  storageLimitGB: number;

  canCreateInvitations: boolean;
  canUseAutomaticLogo: boolean;

  enabledModulesRawValue: string;
  disabledModulesRawValue: string;

  businessInviteCode: string;

  accountManagerName: string;
  internalTags: string;
  riskLevel: string;
  notes: string;

  createdByPlatformUID: string;
  updatedByPlatformUID: string;
}

// MARK: - Service

export class PlatformClientService {
  private readonly db: Firestore;
  private readonly collectionName: string;

  constructor(
    db: Firestore,
    collectionName: string =
      PLATFORM_CLIENTS_COLLECTION_NAME
  ) {
    this.db = db;
    this.collectionName = collectionName;
  }

  /**
   * Creates the PlatformClient document for the newly
   * registered business.
   *
   * Because registration has already created the owner,
   * business and AppSettings, the initial lifecycle is:
   *
   * ownerAccountStatusRawValue = Active
   * ownerInvitationStatusRawValue = Accepted
   * clientStatusRawValue = Onboarding
   * onboardingStatusRawValue = Settings Completed
   * subscriptionStatus = Free Trial
   */
  async createPlatformClient(
    request: CreatePlatformClientRequest
  ): Promise<PlatformClientCreationResult> {
    const normalizedRequest =
      this.normalizeAndValidateRequest(
        request
      );

    const platformClientID =
      normalizedRequest.businessID;

    const platformClientReference =
      doc(
        this.db,
        this.collectionName,
        platformClientID
      );

    const now =
      Timestamp.now();

    const trialStartDate =
      now;

    const trialEndDate =
      Timestamp.fromDate(
        this.addDays(
          now.toDate(),
          normalizedRequest.trialLengthDays
        )
      );

    const ownerInvitationWasUsed =
      Boolean(
        normalizedRequest.ownerInvitationCode ||
        normalizedRequest.ownerInvitationLink ||
        normalizedRequest.ownerInvitationSentAt
      );

    const ownerInvitationAcceptedAt =
      ownerInvitationWasUsed
        ? now
        : null;

    const document:
      PlatformClientFirestoreDocument = {
        // Identity

        businessID:
          normalizedRequest.businessID,

        ownerUID:
          normalizedRequest.ownerUID,

        ownerFirebaseUID:
          normalizedRequest.ownerFirebaseUID,

        // Business Information

        businessName:
          normalizedRequest.businessName,

        industry:
          normalizedRequest.industry,

        businessCategory:
          normalizedRequest.businessCategory,

        businessModeRawValue:
          normalizedRequest.businessModeRawValue,

        localeIdentifier:
          normalizedRequest.localeIdentifier,

        timeZoneIdentifier:
          normalizedRequest.timeZoneIdentifier,

        // Owner Information

        ownerFullName:
          normalizedRequest.ownerFullName,

        ownerEmail:
          normalizedRequest.ownerEmail,

        ownerPhone:
          normalizedRequest.ownerPhone,

        // Owner Account and Invitation

        ownerAccountStatusRawValue:
          "Active",

        ownerInvitationStatusRawValue:
          ownerInvitationWasUsed
            ? "Accepted"
            : "Not Invited",

        ownerInvitationCode:
          normalizedRequest.ownerInvitationCode,

        ownerInvitationLink:
          normalizedRequest.ownerInvitationLink,

        ownerInvitationSentAt:
          normalizedRequest.ownerInvitationSentAt
            ? Timestamp.fromDate(
                normalizedRequest.ownerInvitationSentAt
              )
            : null,

        ownerInvitationAcceptedAt,

        // Business Contact Information

        businessPhone:
          normalizedRequest.businessPhone,

        businessEmail:
          normalizedRequest.businessEmail,

        supportEmail:
          normalizedRequest.supportEmail,

        website:
          normalizedRequest.website,

        taxID:
          normalizedRequest.taxID,

        // Address

        addressLine1:
          normalizedRequest.addressLine1,

        addressLine2:
          normalizedRequest.addressLine2,

        city:
          normalizedRequest.city,

        state:
          normalizedRequest.state,

        zipCode:
          normalizedRequest.zipCode,

        country:
          normalizedRequest.country,

        // Secondary Contact

        secondaryContactName:
          normalizedRequest.secondaryContactName,

        secondaryContactEmail:
          normalizedRequest.secondaryContactEmail,

        secondaryContactPhone:
          normalizedRequest.secondaryContactPhone,

        // Billing Contact

        billingContactName:
          normalizedRequest.billingContactName,

        billingContactEmail:
          normalizedRequest.billingContactEmail,

        billingContactPhone:
          normalizedRequest.billingContactPhone,

        // Client Lifecycle

        clientStatusRawValue:
          "Onboarding",

        onboardingStatusRawValue:
          "Settings Completed",

        archivedAt: null,
        pendingDeletionAt: null,
        deletionRequestedByUID: "",

        // Subscription

        planName:
          normalizedRequest.planName,

        subscriptionStatus:
          "Free Trial",

        monthlyPrice:
          normalizedRequest.monthlyPrice,

        isActive: true,

        // Trial

        trialLengthDays:
          normalizedRequest.trialLengthDays,

        trialStartDate,
        trialEndDate,

        // Subscription Dates

        subscriptionStartDate: null,
        subscriptionEndDate: null,
        nextBillingDate: null,
        lastPaymentDate: null,
        gracePeriodEndDate: null,

        // Suspension and Cancellation

        suspensionReason: "",
        cancellationReason: "",

        // Billing Provider

        billingProviderRawValue:
          normalizedRequest.billingProvider,

        appleOriginalTransactionID: "",
        appleProductID: "",

        stripeCustomerID: "",
        stripeSubscriptionID: "",

        // Plan Limits

        employeeLimit:
          normalizedRequest.employeeLimit,

        customerLimit:
          normalizedRequest.customerLimit,

        productLimit:
          normalizedRequest.productLimit,

        storageLimitGB:
          normalizedRequest.storageLimitGB,

        // Features and Modules

        canCreateInvitations:
          normalizedRequest.canCreateInvitations,

        canUseAutomaticLogo:
          normalizedRequest.canUseAutomaticLogo,

        enabledModulesRawValue:
          normalizedRequest.enabledModulesRawValue,

        disabledModulesRawValue:
          normalizedRequest.disabledModulesRawValue,

        // General Business Join Code

        businessInviteCode:
          normalizedRequest.businessInviteCode,

        // Internal Administration

        accountManagerName:
          normalizedRequest.accountManagerName,

        internalTags:
          normalizedRequest.internalTags,

        riskLevel:
          normalizedRequest.riskLevel,

        notes:
          normalizedRequest.notes,

        // Activity and Security

        lastLoginDate: null,

        /**
         * This record is created directly in Firestore,
         * so it is synchronized at creation time.
         */
        lastSyncDate: now,

        lastOwnerPasswordResetRequestedAt:
          null,

        lastOwnerAccessDisabledAt:
          null,

        lastOwnerAccessEnabledAt:
          null,

        // Audit

        createdByPlatformUID:
          normalizedRequest.createdByPlatformUID,

        updatedByPlatformUID:
          normalizedRequest.updatedByPlatformUID,

        createdAt: now,
        updatedAt: now,

        // Platform Metadata

        source: "web",
        schemaVersion: 1,
      };

    try {
      await setDoc(
        platformClientReference,
        document
      );

      return {
        platformClientID,

        businessID:
          normalizedRequest.businessID,

        ownerUID:
          normalizedRequest.ownerUID,

        ownerFirebaseUID:
          normalizedRequest.ownerFirebaseUID,

        businessName:
          normalizedRequest.businessName,

        ownerFullName:
          normalizedRequest.ownerFullName,

        ownerEmail:
          normalizedRequest.ownerEmail,

        clientStatus:
          document.clientStatusRawValue,

        ownerAccountStatus:
          document.ownerAccountStatusRawValue,

        ownerInvitationStatus:
          document.ownerInvitationStatusRawValue,

        onboardingStatus:
          document.onboardingStatusRawValue,

        planName:
          document.planName,

        subscriptionStatus:
          document.subscriptionStatus,

        trialStartDate:
          trialStartDate
            .toDate()
            .toISOString(),

        trialEndDate:
          trialEndDate
            .toDate()
            .toISOString(),

        isActive:
          document.isActive,

        documentPath:
          platformClientReference.path,

        createdAt:
          now.toDate().toISOString(),

        updatedAt:
          now.toDate().toISOString(),
      };
    } catch (error: unknown) {
      throw this.normalizeFirestoreError(
        error
      );
    }
  }

  /**
   * Deletes the PlatformClient document as a rollback action.
   */
  async rollbackPlatformClient(
    businessID: string
  ): Promise<void> {
    const normalizedBusinessID =
      this.requireText(
        businessID,
        "A business ID is required to rollback the PlatformClient."
      );

    try {
      const reference =
        doc(
          this.db,
          this.collectionName,
          normalizedBusinessID
        );

      await deleteDoc(reference);
    } catch (error: unknown) {
      console.error(
        "[PlatformClientService] Unable to rollback PlatformClient:",
        error
      );
    }
  }

  // MARK: - Validation

  private normalizeAndValidateRequest(
    request: CreatePlatformClientRequest
  ): NormalizedCreatePlatformClientRequest {
    if (
      !request ||
      typeof request !== "object"
    ) {
      throw new PlatformClientServiceError(
        "platform-client/invalid-request",
        "A valid PlatformClient creation request is required."
      );
    }

    const businessID =
      this.requireText(
        request.businessID,
        "The business ID is required to create the PlatformClient."
      );

    const ownerUID =
      this.requireText(
        request.ownerUID,
        "The permanent owner UID is required to create the PlatformClient."
      );

    const ownerFirebaseUID =
      this.requireText(
        request.ownerFirebaseUID,
        "The Firebase UID is required to create the PlatformClient."
      );

    const businessName =
      this.requireText(
        request.businessName,
        "The business name is required to create the PlatformClient."
      );

    const ownerFullName =
      this.requireText(
        request.ownerFullName,
        "The owner full name is required to create the PlatformClient."
      );

    const ownerEmail =
      this.normalizeRequiredEmail(
        request.ownerEmail,
        "The owner email address is required."
      );

    const businessEmail =
      this.normalizeOptionalEmail(
        request.businessEmail
      );

    const supportEmail =
      this.normalizeOptionalEmail(
        request.supportEmail
      );

    const secondaryContactEmail =
      this.normalizeOptionalEmail(
        request.secondaryContactEmail
      );

    const billingContactEmail =
      this.normalizeOptionalEmail(
        request.billingContactEmail
      );

    return {
      businessID,
      ownerUID,
      ownerFirebaseUID,

      businessName,

      industry:
        this.optionalText(
          request.industry
        ) ?? "",

      businessCategory:
        this.optionalText(
          request.businessCategory
        ) ?? "",

      businessModeRawValue:
        this.optionalText(
          request.businessModeRawValue
        ) ??
        DEFAULT_BUSINESS_MODE,

      localeIdentifier:
        this.optionalText(
          request.localeIdentifier
        ) ??
        this.readBrowserLocale() ??
        DEFAULT_LOCALE_IDENTIFIER,

      timeZoneIdentifier:
        this.optionalText(
          request.timeZoneIdentifier
        ) ??
        this.readBrowserTimeZone() ??
        DEFAULT_TIME_ZONE_IDENTIFIER,

      ownerFullName,
      ownerEmail,

      ownerPhone:
        this.optionalText(
          request.ownerPhone
        ) ?? "",

      ownerInvitationCode:
        (
          this.optionalText(
            request.ownerInvitationCode
          ) ?? ""
        ).toUpperCase(),

      ownerInvitationLink:
        this.optionalText(
          request.ownerInvitationLink
        ) ?? "",

      ownerInvitationSentAt:
        this.normalizeOptionalDate(
          request.ownerInvitationSentAt
        ),

      businessPhone:
        this.optionalText(
          request.businessPhone
        ) ?? "",

      businessEmail,
      supportEmail,

      website:
        this.optionalText(
          request.website
        ) ?? "",

      taxID:
        this.optionalText(
          request.taxID
        ) ?? "",

      addressLine1:
        this.optionalText(
          request.addressLine1
        ) ?? "",

      addressLine2:
        this.optionalText(
          request.addressLine2
        ) ?? "",

      city:
        this.optionalText(
          request.city
        ) ?? "",

      state:
        this.optionalText(
          request.state
        ) ?? "",

      zipCode:
        this.optionalText(
          request.zipCode
        ) ?? "",

      country:
        this.optionalText(
          request.country
        ) ??
        DEFAULT_COUNTRY,

      secondaryContactName:
        this.optionalText(
          request.secondaryContactName
        ) ?? "",

      secondaryContactEmail,

      secondaryContactPhone:
        this.optionalText(
          request.secondaryContactPhone
        ) ?? "",

      billingContactName:
        this.optionalText(
          request.billingContactName
        ) ?? "",

      billingContactEmail,

      billingContactPhone:
        this.optionalText(
          request.billingContactPhone
        ) ?? "",

      planName:
        this.optionalText(
          request.planName
        ) ??
        DEFAULT_PLATFORM_PLAN_NAME,

      monthlyPrice:
        this.nonNegativeNumber(
          request.monthlyPrice,
          0
        ),

      trialLengthDays:
        this.positiveInteger(
          request.trialLengthDays,
          DEFAULT_PLATFORM_TRIAL_DAYS
        ),

      billingProvider:
        this.normalizeBillingProvider(
          request.billingProvider
        ),

      employeeLimit:
        this.nonNegativeInteger(
          request.employeeLimit,
          3
        ),

      customerLimit:
        this.nonNegativeInteger(
          request.customerLimit,
          100
        ),

      productLimit:
        this.nonNegativeInteger(
          request.productLimit,
          100
        ),

      storageLimitGB:
        this.nonNegativeNumber(
          request.storageLimitGB,
          1
        ),

      canCreateInvitations:
        request.canCreateInvitations !==
        false,

      canUseAutomaticLogo:
        request.canUseAutomaticLogo !==
        false,

      enabledModulesRawValue:
        this.encodeStringSet(
          request.enabledModules
        ),

      disabledModulesRawValue:
        this.encodeStringSet(
          request.disabledModules
        ),

      businessInviteCode:
        (
          this.optionalText(
            request.businessInviteCode
          ) ?? ""
        ).toUpperCase(),

      accountManagerName:
        this.optionalText(
          request.accountManagerName
        ) ?? "",

      internalTags:
        this.optionalText(
          request.internalTags
        ) ?? "",

      riskLevel:
        this.optionalText(
          request.riskLevel
        ) ??
        DEFAULT_RISK_LEVEL,

      notes:
        this.optionalText(
          request.notes
        ) ?? "",

      createdByPlatformUID:
        this.optionalText(
          request.createdByPlatformUID
        ) ?? "",

      updatedByPlatformUID:
        this.optionalText(
          request.updatedByPlatformUID
        ) ?? "",
    };
  }

  // MARK: - Normalization Helpers

  private requireText(
    value: unknown,
    message: string
  ): string {
    if (typeof value !== "string") {
      throw new PlatformClientServiceError(
        "platform-client/missing-required-field",
        message
      );
    }

    const normalized =
      value.trim();

    if (!normalized) {
      throw new PlatformClientServiceError(
        "platform-client/missing-required-field",
        message
      );
    }

    return normalized;
  }

  private optionalText(
    value: unknown
  ): string | undefined {
    if (typeof value !== "string") {
      return undefined;
    }

    const normalized =
      value.trim();

    return normalized || undefined;
  }

  private normalizeRequiredEmail(
    value: unknown,
    message: string
  ): string {
    if (typeof value !== "string") {
      throw new PlatformClientServiceError(
        "platform-client/missing-email",
        message
      );
    }

    const email =
      value.trim().toLowerCase();

    if (!email) {
      throw new PlatformClientServiceError(
        "platform-client/missing-email",
        message
      );
    }

    if (!this.isValidEmail(email)) {
      throw new PlatformClientServiceError(
        "platform-client/invalid-email",
        "Enter a valid owner email address."
      );
    }

    return email;
  }

  private normalizeOptionalEmail(
    value: unknown
  ): string {
    if (typeof value !== "string") {
      return "";
    }

    const email =
      value.trim().toLowerCase();

    if (
      email &&
      !this.isValidEmail(email)
    ) {
      throw new PlatformClientServiceError(
        "platform-client/invalid-email",
        `The email address "${email}" is not valid.`
      );
    }

    return email;
  }

  private isValidEmail(
    email: string
  ): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );
  }

  private normalizeOptionalDate(
    value: unknown
  ): Date | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (
      value instanceof Date &&
      !Number.isNaN(value.getTime())
    ) {
      return value;
    }

    throw new PlatformClientServiceError(
      "platform-client/invalid-date",
      "The owner invitation date is not valid."
    );
  }

  private nonNegativeNumber(
    value: unknown,
    fallback: number
  ): number {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value)
    ) {
      return fallback;
    }

    return Math.max(value, 0);
  }

  private nonNegativeInteger(
    value: unknown,
    fallback: number
  ): number {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value)
    ) {
      return fallback;
    }

    return Math.max(
      Math.trunc(value),
      0
    );
  }

  private positiveInteger(
    value: unknown,
    fallback: number
  ): number {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value)
    ) {
      return fallback;
    }

    return Math.max(
      Math.trunc(value),
      1
    );
  }

  private normalizeBillingProvider(
    value: unknown
  ): PlatformBillingProvider {
    switch (value) {
      case "Manual":
      case "Apple":
      case "Stripe":
      case "None":
        return value;

      default:
        return "None";
    }
  }

  /**
   * Mirrors PlatformClient.encodeStringSet().
   */
  private encodeStringSet(
    values: Iterable<string> | undefined
  ): string {
    if (!values) {
      return "[]";
    }

    const normalizedValues =
      Array.from(values)
        .map((value) =>
          typeof value === "string"
            ? value.trim()
            : ""
        )
        .filter(
          (value) => value.length > 0
        );

    const uniqueValues =
      Array.from(
        new Set(normalizedValues)
      ).sort();

    return JSON.stringify(
      uniqueValues
    );
  }

  private addDays(
    date: Date,
    days: number
  ): Date {
    const result =
      new Date(date.getTime());

    result.setDate(
      result.getDate() + days
    );

    return result;
  }

  private readBrowserLocale():
    | string
    | null {
    if (
      typeof navigator === "undefined"
    ) {
      return null;
    }

    const language =
      navigator.language?.trim();

    if (!language) {
      return null;
    }

    return language.replace(
      "-",
      "_"
    );
  }

  private readBrowserTimeZone():
    | string
    | null {
    try {
      const timeZone =
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone;

      return timeZone?.trim() || null;
    } catch {
      return null;
    }
  }

  // MARK: - Error Normalization

  private normalizeFirestoreError(
    error: unknown
  ): PlatformClientServiceError {
    const code =
      this.readErrorCode(error);

    switch (code) {
      case "permission-denied":
      case "firestore/permission-denied":
        return new PlatformClientServiceError(
          code,
          "Firestore security rules did not allow creation of the PlatformClient.",
          error
        );

      case "unauthenticated":
      case "firestore/unauthenticated":
        return new PlatformClientServiceError(
          code,
          "The Business Owner must be authenticated before the PlatformClient can be created.",
          error
        );

      case "unavailable":
      case "firestore/unavailable":
        return new PlatformClientServiceError(
          code,
          "Firestore is temporarily unavailable. Check the connection and try again.",
          error
        );

      case "deadline-exceeded":
      case "firestore/deadline-exceeded":
        return new PlatformClientServiceError(
          code,
          "Firestore took too long to create the PlatformClient. Try again.",
          error
        );

      case "already-exists":
      case "firestore/already-exists":
        return new PlatformClientServiceError(
          code,
          "A PlatformClient already exists for this business.",
          error
        );

      default:
        return new PlatformClientServiceError(
          code ??
            "platform-client/firestore-write-failed",
          this.readErrorMessage(error) ??
            "Firestore could not create the PlatformClient.",
          error
        );
    }
  }

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

export default PlatformClientService;