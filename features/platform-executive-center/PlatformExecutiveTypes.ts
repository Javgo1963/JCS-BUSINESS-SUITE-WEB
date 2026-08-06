/*
 * JCS Business Suite
 * PlatformExecutiveTypes.ts
 *
 * Shared domain contracts for the Web Platform Executive Center.
 *
 * This file mirrors the SwiftData PlatformClient model while
 * remaining compatible with Firestore documents created by:
 *
 * - The Apple application
 * - The JCS Business Suite web application
 * - Platform Administration workflows
 *
 * No React code or Firestore write operations should live here.
 */

// ============================================================
// MARK: - Generic Utilities
// ============================================================

export type Nullable<T> =
  T | null;

export type OptionalNullable<T> =
  T | null | undefined;

/**
 * Structural representation of a Firestore Timestamp.
 *
 * This avoids importing Firebase directly into the domain
 * contracts while still supporting Timestamp values.
 */
export interface FirestoreTimestampLike {
  seconds: number;
  nanoseconds: number;

  toDate?: () => Date;
}

/**
 * Date formats that may be returned by Firestore, APIs,
 * local fixtures or serialized application state.
 */
export type PlatformDateValue =
  | Date
  | FirestoreTimestampLike
  | string
  | number
  | null
  | undefined;

/**
 * Firestore documents may contain either arrays or the legacy
 * JSON-string representation used by the Apple application.
 */
export type PlatformModuleCollectionValue =
  | string[]
  | string
  | null
  | undefined;

// ============================================================
// MARK: - Billing Provider
// ============================================================

export const PLATFORM_BILLING_PROVIDERS = {
  manual: "Manual",
  apple: "Apple",
  stripe: "Stripe",
  none: "None",
} as const;

export type PlatformBillingProviderKey =
  keyof typeof PLATFORM_BILLING_PROVIDERS;

export type PlatformBillingProvider =
  (typeof PLATFORM_BILLING_PROVIDERS)[
    PlatformBillingProviderKey
  ];

export const PLATFORM_BILLING_PROVIDER_VALUES =
  Object.values(
    PLATFORM_BILLING_PROVIDERS
  ) as PlatformBillingProvider[];

// ============================================================
// MARK: - Subscription Status
// ============================================================

export const PLATFORM_SUBSCRIPTION_STATUSES = {
  freeTrial: "Free Trial",
  active: "Active",
  pastDue: "Past Due",
  gracePeriod: "Grace Period",
  trialExpired: "Trial Expired",
  suspended: "Suspended",
  canceled: "Canceled",
  inactive: "Inactive",
} as const;

export type PlatformSubscriptionStatusKey =
  keyof typeof PLATFORM_SUBSCRIPTION_STATUSES;

export type PlatformSubscriptionStatus =
  (typeof PLATFORM_SUBSCRIPTION_STATUSES)[
    PlatformSubscriptionStatusKey
  ];

export const PLATFORM_SUBSCRIPTION_STATUS_VALUES =
  Object.values(
    PLATFORM_SUBSCRIPTION_STATUSES
  ) as PlatformSubscriptionStatus[];

// ============================================================
// MARK: - Platform Client Status
// ============================================================

export const PLATFORM_CLIENT_STATUSES = {
  invited: "Invited",
  onboarding: "Onboarding",
  active: "Active",
  suspended: "Suspended",
  canceled: "Canceled",
  archived: "Archived",
  pendingDeletion:
    "Pending Deletion",
} as const;

export type PlatformClientStatusKey =
  keyof typeof PLATFORM_CLIENT_STATUSES;

export type PlatformClientStatus =
  (typeof PLATFORM_CLIENT_STATUSES)[
    PlatformClientStatusKey
  ];

export const PLATFORM_CLIENT_STATUS_VALUES =
  Object.values(
    PLATFORM_CLIENT_STATUSES
  ) as PlatformClientStatus[];

// ============================================================
// MARK: - Owner Account Status
// ============================================================

export const PLATFORM_OWNER_ACCOUNT_STATUSES = {
  invited: "Invited",
  pendingRegistration:
    "Pending Registration",
  active: "Active",
  disabled: "Disabled",
  locked: "Locked",
  removed: "Removed",
} as const;

export type PlatformOwnerAccountStatusKey =
  keyof typeof PLATFORM_OWNER_ACCOUNT_STATUSES;

export type PlatformOwnerAccountStatus =
  (typeof PLATFORM_OWNER_ACCOUNT_STATUSES)[
    PlatformOwnerAccountStatusKey
  ];

export const PLATFORM_OWNER_ACCOUNT_STATUS_VALUES =
  Object.values(
    PLATFORM_OWNER_ACCOUNT_STATUSES
  ) as PlatformOwnerAccountStatus[];

// ============================================================
// MARK: - Owner Invitation Status
// ============================================================

export const PLATFORM_OWNER_INVITATION_STATUSES = {
  notInvited: "Not Invited",
  pending: "Pending",
  sent: "Sent",
  accepted: "Accepted",
  expired: "Expired",
  canceled: "Canceled",
} as const;

export type PlatformOwnerInvitationStatusKey =
  keyof typeof PLATFORM_OWNER_INVITATION_STATUSES;

export type PlatformOwnerInvitationStatus =
  (typeof PLATFORM_OWNER_INVITATION_STATUSES)[
    PlatformOwnerInvitationStatusKey
  ];

export const PLATFORM_OWNER_INVITATION_STATUS_VALUES =
  Object.values(
    PLATFORM_OWNER_INVITATION_STATUSES
  ) as PlatformOwnerInvitationStatus[];

// ============================================================
// MARK: - Onboarding Status
// ============================================================

export const PLATFORM_ONBOARDING_STATUSES = {
  notStarted: "Not Started",
  ownerInvited: "Owner Invited",
  ownerRegistered:
    "Owner Registered",
  businessCreated:
    "Business Created",
  settingsCompleted:
    "Settings Completed",
  logoCompleted:
    "Logo Completed",
  subscriptionConfigured:
    "Subscription Configured",
  ready: "Ready",
} as const;

export type PlatformOnboardingStatusKey =
  keyof typeof PLATFORM_ONBOARDING_STATUSES;

export type PlatformOnboardingStatus =
  (typeof PLATFORM_ONBOARDING_STATUSES)[
    PlatformOnboardingStatusKey
  ];

export const PLATFORM_ONBOARDING_STATUS_VALUES =
  Object.values(
    PLATFORM_ONBOARDING_STATUSES
  ) as PlatformOnboardingStatus[];

// ============================================================
// MARK: - Platform Risk Level
// ============================================================

export const PLATFORM_RISK_LEVELS = {
  normal: "Normal",
  review: "Review",
  elevated: "Elevated",
  high: "High",
  critical: "Critical",
} as const;

export type PlatformRiskLevel =
  (typeof PLATFORM_RISK_LEVELS)[
    keyof typeof PLATFORM_RISK_LEVELS
  ];

// ============================================================
// MARK: - Platform Executive Section
// ============================================================

export const PLATFORM_EXECUTIVE_SECTIONS = {
  dashboard: "dashboard",
  clients: "clients",
  invitations: "invitations",
  subscriptions: "subscriptions",
  billing: "billing",
  analytics: "analytics",
  reports: "reports",
  settings: "settings",
} as const;

export type PlatformExecutiveSection =
  (typeof PLATFORM_EXECUTIVE_SECTIONS)[
    keyof typeof PLATFORM_EXECUTIVE_SECTIONS
  ];

export interface PlatformExecutiveSectionDefinition {
  id: PlatformExecutiveSection;

  title: string;
  compactTitle: string;
  subtitle: string;

  icon: string;

  group:
    | "Overview"
    | "Clients"
    | "Revenue"
    | "Intelligence"
    | "Administration";
}

export const PLATFORM_EXECUTIVE_SECTION_DEFINITIONS:
  readonly PlatformExecutiveSectionDefinition[] = [
    {
      id:
        PLATFORM_EXECUTIVE_SECTIONS
          .dashboard,

      title:
        "Executive Dashboard",

      compactTitle:
        "Dashboard",

      subtitle:
        "Executive platform overview",

      icon:
        "command",

      group:
        "Overview",
    },

    {
      id:
        PLATFORM_EXECUTIVE_SECTIONS
          .clients,

      title:
        "Business Owners",

      compactTitle:
        "Clients",

      subtitle:
        "Manage businesses and owners",

      icon:
        "building.2.fill",

      group:
        "Clients",
    },

    {
      id:
        PLATFORM_EXECUTIVE_SECTIONS
          .invitations,

      title:
        "Owner Invitations",

      compactTitle:
        "Invitations",

      subtitle:
        "Owner invitation management",

      icon:
        "person.badge.plus",

      group:
        "Clients",
    },

    {
      id:
        PLATFORM_EXECUTIVE_SECTIONS
          .subscriptions,

      title:
        "Subscriptions",

      compactTitle:
        "Subscriptions",

      subtitle:
        "Plans, trials and platform access",

      icon:
        "rectangle.stack.fill",

      group:
        "Revenue",
    },

    {
      id:
        PLATFORM_EXECUTIVE_SECTIONS
          .billing,

      title:
        "Billing",

      compactTitle:
        "Billing",

      subtitle:
        "Revenue and billing accounts",

      icon:
        "creditcard.fill",

      group:
        "Revenue",
    },

    {
      id:
        PLATFORM_EXECUTIVE_SECTIONS
          .analytics,

      title:
        "Platform Analytics",

      compactTitle:
        "Analytics",

      subtitle:
        "Platform business distribution",

      icon:
        "chart.xyaxis.line",

      group:
        "Intelligence",
    },

    {
      id:
        PLATFORM_EXECUTIVE_SECTIONS
          .reports,

      title:
        "Executive Reports",

      compactTitle:
        "Reports",

      subtitle:
        "Administrative data exports",

      icon:
        "doc.text.magnifyingglass",

      group:
        "Intelligence",
    },

    {
      id:
        PLATFORM_EXECUTIVE_SECTIONS
          .settings,

      title:
        "Platform Settings",

      compactTitle:
        "Settings",

      subtitle:
        "Executive Center controls",

      icon:
        "gearshape.2.fill",

      group:
        "Administration",
    },
  ] as const;

// ============================================================
// MARK: - System Status
// ============================================================

export type PlatformExecutiveSystemStatus =
  | "healthy"
  | "attention"
  | "degraded"
  | "offline";

export type PlatformExecutiveSyncStatus =
  | "idle"
  | "syncing"
  | "synced"
  | "failed";

export type PlatformExecutiveConnectionStatus =
  | "connected"
  | "connecting"
  | "disconnected"
  | "failed";

// ============================================================
// MARK: - Platform Client Firestore Source
// ============================================================

/**
 * Raw Firestore representation.
 *
 * Every property is optional because older documents may not
 * contain all fields from the current PlatformClient model.
 *
 * This interface must only represent stored data. Normalized
 * application code should consume PlatformClientRecord.
 */
export interface PlatformClientFirestoreData {
  // Identity

  businessID?: unknown;
  ownerUID?: unknown;
  ownerFirebaseUID?: unknown;

  // Business

  businessName?: unknown;
  industry?: unknown;
  businessCategory?: unknown;
  businessModeRawValue?: unknown;

  localeIdentifier?: unknown;
  timeZoneIdentifier?: unknown;

  // Owner

  ownerFullName?: unknown;
  ownerEmail?: unknown;
  ownerPhone?: unknown;

  // Owner account and invitation

  ownerAccountStatusRawValue?: unknown;
  ownerInvitationStatusRawValue?: unknown;

  ownerInvitationCode?: unknown;
  ownerInvitationLink?: unknown;

  ownerInvitationSentAt?:
    PlatformDateValue;

  ownerInvitationAcceptedAt?:
    PlatformDateValue;

  // Business contact

  businessPhone?: unknown;
  businessEmail?: unknown;
  supportEmail?: unknown;
  website?: unknown;
  taxID?: unknown;

  // Address

  addressLine1?: unknown;
  addressLine2?: unknown;
  city?: unknown;
  state?: unknown;
  zipCode?: unknown;
  country?: unknown;

  // Secondary contact

  secondaryContactName?: unknown;
  secondaryContactEmail?: unknown;
  secondaryContactPhone?: unknown;

  // Billing contact

  billingContactName?: unknown;
  billingContactEmail?: unknown;
  billingContactPhone?: unknown;

  // Lifecycle

  clientStatusRawValue?: unknown;
  onboardingStatusRawValue?: unknown;

  archivedAt?:
    PlatformDateValue;

  pendingDeletionAt?:
    PlatformDateValue;

  deletionRequestedByUID?: unknown;

  // Subscription

  planName?: unknown;
  subscriptionStatus?: unknown;
  monthlyPrice?: unknown;
  isActive?: unknown;

  // Trial

  trialLengthDays?: unknown;

  trialStartDate?:
    PlatformDateValue;

  trialEndDate?:
    PlatformDateValue;

  // Subscription dates

  subscriptionStartDate?:
    PlatformDateValue;

  subscriptionEndDate?:
    PlatformDateValue;

  nextBillingDate?:
    PlatformDateValue;

  lastPaymentDate?:
    PlatformDateValue;

  gracePeriodEndDate?:
    PlatformDateValue;

  // Suspension and cancellation

  suspensionReason?: unknown;
  cancellationReason?: unknown;

  // Billing provider

  billingProviderRawValue?: unknown;

  appleOriginalTransactionID?: unknown;
  appleProductID?: unknown;

  stripeCustomerID?: unknown;
  stripeSubscriptionID?: unknown;

  // Plan limits

  employeeLimit?: unknown;
  customerLimit?: unknown;
  productLimit?: unknown;
  storageLimitGB?: unknown;

  // Features and modules

  canCreateInvitations?: unknown;
  canUseAutomaticLogo?: unknown;

  enabledModulesRawValue?:
    PlatformModuleCollectionValue;

  disabledModulesRawValue?:
    PlatformModuleCollectionValue;

  /**
   * Future web-native array fields.
   *
   * The normalizer will support these in addition to the
   * Apple-compatible RawValue fields.
   */
  enabledModules?:
    PlatformModuleCollectionValue;

  disabledModules?:
    PlatformModuleCollectionValue;

  // General business join code

  businessInviteCode?: unknown;

  // Internal administration

  accountManagerName?: unknown;
  internalTags?: unknown;
  riskLevel?: unknown;
  notes?: unknown;

  // Activity and security

  lastLoginDate?:
    PlatformDateValue;

  lastSyncDate?:
    PlatformDateValue;

  lastOwnerPasswordResetRequestedAt?:
    PlatformDateValue;

  lastOwnerAccessDisabledAt?:
    PlatformDateValue;

  lastOwnerAccessEnabledAt?:
    PlatformDateValue;

  // Audit

  createdByPlatformUID?: unknown;
  updatedByPlatformUID?: unknown;

  createdAt?:
    PlatformDateValue;

  updatedAt?:
    PlatformDateValue;

  /**
   * Allows forward-compatible Firestore fields without
   * weakening the normalized PlatformClientRecord.
   */
  [key: string]: unknown;
}

// ============================================================
// MARK: - Normalized Platform Client Record
// ============================================================

/**
 * Fully normalized client record used by React components,
 * dashboard calculations and administrative services.
 */
export interface PlatformClientRecord {
  // Firestore identity

  documentID: string;

  // Identity

  businessID: string;

  /**
   * Permanent internal owner identifier.
   */
  ownerUID: string;

  /**
   * Firebase Authentication UID assigned after registration.
   */
  ownerFirebaseUID: string;

  // Business information

  businessName: string;
  industry: string;
  businessCategory: string;
  businessModeRawValue: string;

  localeIdentifier: string;
  timeZoneIdentifier: string;

  // Owner information

  ownerFullName: string;
  ownerEmail: string;
  ownerPhone: string;

  // Owner account and invitation

  ownerAccountStatus:
    PlatformOwnerAccountStatus;

  ownerInvitationStatus:
    PlatformOwnerInvitationStatus;

  ownerInvitationCode: string;
  ownerInvitationLink: string;

  ownerInvitationSentAt:
    Date | null;

  ownerInvitationAcceptedAt:
    Date | null;

  // Business contact information

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

  // Secondary contact

  secondaryContactName: string;
  secondaryContactEmail: string;
  secondaryContactPhone: string;

  // Billing contact

  billingContactName: string;
  billingContactEmail: string;
  billingContactPhone: string;

  // Client lifecycle

  clientStatus:
    PlatformClientStatus;

  onboardingStatus:
    PlatformOnboardingStatus;

  archivedAt:
    Date | null;

  pendingDeletionAt:
    Date | null;

  deletionRequestedByUID: string;

  // Subscription

  planName: string;

  subscriptionStatus:
    PlatformSubscriptionStatus;

  monthlyPrice: number;
  isActive: boolean;

  // Trial

  trialLengthDays: number;
  trialStartDate: Date;
  trialEndDate: Date;

  // Subscription dates

  subscriptionStartDate:
    Date | null;

  subscriptionEndDate:
    Date | null;

  nextBillingDate:
    Date | null;

  lastPaymentDate:
    Date | null;

  gracePeriodEndDate:
    Date | null;

  // Suspension and cancellation

  suspensionReason: string;
  cancellationReason: string;

  // Billing provider

  billingProvider:
    PlatformBillingProvider;

  appleOriginalTransactionID: string;
  appleProductID: string;

  stripeCustomerID: string;
  stripeSubscriptionID: string;

  // Plan limits

  employeeLimit: number;
  customerLimit: number;
  productLimit: number;
  storageLimitGB: number;

  // Features and modules

  canCreateInvitations: boolean;
  canUseAutomaticLogo: boolean;

  enabledModules: string[];
  disabledModules: string[];

  // General business join code

  businessInviteCode: string;

  // Internal administration

  accountManagerName: string;
  internalTags: string[];
  riskLevel: string;
  notes: string;

  // Activity and security

  lastLoginDate:
    Date | null;

  lastSyncDate:
    Date | null;

  lastOwnerPasswordResetRequestedAt:
    Date | null;

  lastOwnerAccessDisabledAt:
    Date | null;

  lastOwnerAccessEnabledAt:
    Date | null;

  // Audit

  createdByPlatformUID: string;
  updatedByPlatformUID: string;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// MARK: - Platform Client Derived State
// ============================================================

/**
 * Calculated values are intentionally separate from the stored
 * PlatformClientRecord.
 *
 * PlatformClientDomain.ts will produce this state.
 */
export interface PlatformClientDerivedState {
  displayBusinessName: string;
  displayOwnerName: string;
  displayBusinessEmail: string;

  fullAddress: string;

  hasAddress: boolean;
  hasBusinessContactInformation: boolean;

  trialDaysRemaining: number;
  isTrialExpired: boolean;

  displaySubscriptionStatus: string;

  canAccessApp: boolean;
  isBillingConfigured: boolean;

  isOwnerRegistered: boolean;
  isOnboardingComplete: boolean;

  isArchived: boolean;
  isPendingDeletion: boolean;

  hasPendingOwnerInvitation: boolean;
  canPrepareOwnerInvitation: boolean;
  canSendPreparedOwnerInvitation: boolean;
  canResendOwnerInvitation: boolean;
  canReplaceOwnerInvitation: boolean;
  canCancelOwnerInvitation: boolean;

  ownerInvitationDisplayStatus: string;

  needsExecutiveAttention: boolean;

  executiveAttentionReason:
    PlatformExecutiveAttentionReason | null;
}

export interface PlatformClientViewModel
  extends PlatformClientRecord,
    PlatformClientDerivedState {}

// ============================================================
// MARK: - Executive Attention
// ============================================================

export type PlatformExecutiveAttentionReason =
  | "pending-deletion"
  | "archived"
  | "inactive"
  | "trial-expired"
  | "owner-registration-pending"
  | "onboarding-incomplete"
  | "application-access-restricted"
  | "subscription-past-due"
  | "owner-access-disabled"
  | "owner-account-locked";

export type PlatformExecutiveAttentionSeverity =
  | "informational"
  | "warning"
  | "critical";

export interface PlatformExecutiveAttentionItem {
  id: string;

  businessID: string;
  businessName: string;
  ownerName: string;

  reason:
    PlatformExecutiveAttentionReason;

  severity:
    PlatformExecutiveAttentionSeverity;

  title: string;
  message: string;

  createdAt:
    Date | null;
}

// ============================================================
// MARK: - Platform Executive Metrics
// ============================================================

export interface PlatformExecutiveMetrics {
  totalBusinesses: number;
  activeBusinesses: number;

  activeSubscriptions: number;
  activeTrials: number;
  expiredTrials: number;

  restrictedAccess: number;

  onboardingComplete: number;
  registeredOwners: number;

  businessesNeedingAttention: number;

  payingBusinesses: number;

  monthlyRevenue: number;
  averageMonthlyRevenue: number;

  accessEnabledCount: number;
  accessPercentage: number;

  pendingOwnerInvitations: number;
}

export interface PlatformExecutiveMetricCard {
  id: string;

  title: string;
  value: string;
  message: string;

  icon: string;

  tone:
    | "accent"
    | "success"
    | "warning"
    | "danger"
    | "neutral";

  section?:
    PlatformExecutiveSection;
}

// ============================================================
// MARK: - Owner Invitation Record
// ============================================================

export interface PlatformOwnerInvitationRecord {
  id: string;

  businessID: string;
  ownerUID: string;

  invitedByPlatformUID: string;

  ownerFullName: string;
  ownerEmail: string;
  ownerPhone: string;

  invitationCode: string;
  invitationLink: string;

  status:
    PlatformOwnerInvitationStatus;

  expiresAt:
    Date | null;

  sentAt:
    Date | null;

  acceptedAt:
    Date | null;

  canceledAt:
    Date | null;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// MARK: - Filters and Sorting
// ============================================================

export type PlatformClientFilter =
  | "all"
  | "active"
  | "inactive"
  | "onboarding"
  | "trial"
  | "trial-expired"
  | "past-due"
  | "restricted"
  | "archived"
  | "pending-deletion"
  | "owner-registration-pending"
  | "needs-attention";

export type PlatformClientSortField =
  | "businessName"
  | "ownerFullName"
  | "createdAt"
  | "updatedAt"
  | "monthlyPrice"
  | "trialEndDate"
  | "clientStatus"
  | "subscriptionStatus";

export type PlatformSortDirection =
  | "ascending"
  | "descending";

export interface PlatformClientQueryOptions {
  searchText: string;

  filter:
    PlatformClientFilter;

  sortField:
    PlatformClientSortField;

  sortDirection:
    PlatformSortDirection;

  limit?: number;
}

// ============================================================
// MARK: - Sidebar Badges
// ============================================================

export type PlatformExecutiveBadgeStyle =
  | "accent"
  | "warning"
  | "critical"
  | "neutral";

export interface PlatformExecutiveSidebarBadge {
  count: number;

  style:
    PlatformExecutiveBadgeStyle;
}

export type PlatformExecutiveSidebarBadges =
  Partial<
    Record<
      PlatformExecutiveSection,
      PlatformExecutiveSidebarBadge
    >
  >;

// ============================================================
// MARK: - Breadcrumbs
// ============================================================

export interface PlatformExecutiveBreadcrumb {
  id: string;

  title: string;
  icon?: string;

  section?:
    PlatformExecutiveSection;
}

// ============================================================
// MARK: - Dialogs and Presentations
// ============================================================

export type PlatformExecutiveDestination =
  | {
      type: "client-detail";
      businessID: string;
    }
  | {
      type: "create-business";
    }
  | {
      type: "edit-business";
      businessID: string;
    }
  | {
      type: "owner-invitation";
      businessID: string;
    }
  | {
      type: "billing";
      businessID: string;
    }
  | {
      type: "subscription";
      businessID: string;
    }
  | {
      type: "analytics";
      businessID: string;
    }
  | {
      type: "invite-center";
    }
  | {
      type: "notifications";
    }
  | {
      type: "administrator-profile";
    }
  | {
      type: "sofia-assistant";
    }
  | {
      type: "command-palette";
    };

export type PlatformExecutiveConfirmation =
  | {
      type: "toggle-activation";

      businessID: string;
      businessName: string;

      currentlyActive: boolean;
    }
  | {
      type: "archive";

      businessID: string;
      businessName: string;
    }
  | {
      type: "restore";

      businessID: string;
      businessName: string;
    }
  | {
      type: "request-deletion";

      businessID: string;
      businessName: string;
    }
  | {
      type: "cancel-deletion";

      businessID: string;
      businessName: string;
    }
  | {
      type: "suspend";

      businessID: string;
      businessName: string;
    }
  | {
      type: "reactivate";

      businessID: string;
      businessName: string;
    }
  | {
      type: "cancel-subscription";

      businessID: string;
      businessName: string;
    }
  | {
      type: "sign-out";
    };

export interface PlatformExecutiveMessage {
  id: string;

  title: string;
  message: string;

  tone:
    | "success"
    | "information"
    | "warning"
    | "error";
}

// ============================================================
// MARK: - Administrative Update Inputs
// ============================================================

export interface PlatformClientBusinessProfileInput {
  businessName: string;
  industry: string;
  businessCategory: string;
  businessModeRawValue: string;

  businessPhone: string;
  businessEmail: string;
  supportEmail: string;

  website: string;
  taxID: string;

  localeIdentifier: string;
  timeZoneIdentifier: string;
}

export interface PlatformClientOwnerInput {
  ownerFullName: string;
  ownerEmail: string;
  ownerPhone: string;
}

export interface PlatformClientAddressInput {
  addressLine1: string;
  addressLine2: string;

  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PlatformClientSecondaryContactInput {
  secondaryContactName: string;
  secondaryContactEmail: string;
  secondaryContactPhone: string;
}

export interface PlatformClientBillingContactInput {
  billingContactName: string;
  billingContactEmail: string;
  billingContactPhone: string;
}

export interface PlatformClientPlanLimitsInput {
  employeeLimit: number;
  customerLimit: number;
  productLimit: number;
  storageLimitGB: number;
}

export interface PlatformClientFeatureAccessInput {
  canCreateInvitations: boolean;
  canUseAutomaticLogo: boolean;

  enabledModules: string[];
  disabledModules: string[];
}

export interface PlatformClientInternalInfoInput {
  accountManagerName: string;

  internalTags: string[];

  riskLevel: string;
  notes: string;
}

export interface PlatformClientBillingProviderInput {
  provider:
    PlatformBillingProvider;

  appleOriginalTransactionID: string;
  appleProductID: string;

  stripeCustomerID: string;
  stripeSubscriptionID: string;
}

export interface PlatformClientFreeTrialInput {
  days: number;
}

export interface PlatformClientMonthlyPlanInput {
  planName: string;
  monthlyPrice: number;

  billingProvider:
    PlatformBillingProvider;
}

export interface PlatformClientGracePeriodInput {
  days: number;
}

export interface PlatformClientReasonInput {
  reason: string;
}

// ============================================================
// MARK: - Firestore Mutation Metadata
// ============================================================

export interface PlatformMutationMetadata {
  platformUID: string;

  updatedAt?: Date;
}

export interface PlatformCreateMetadata
  extends PlatformMutationMetadata {
  createdAt?: Date;
}

// ============================================================
// MARK: - Platform Client Create Input
// ============================================================

export interface CreatePlatformClientInput {
  businessID: string;
  ownerUID: string;

  ownerFirebaseUID?: string;

  businessName: string;
  industry?: string;
  businessCategory?: string;
  businessModeRawValue?: string;

  localeIdentifier?: string;
  timeZoneIdentifier?: string;

  ownerFullName: string;
  ownerEmail: string;
  ownerPhone?: string;

  businessPhone?: string;
  businessEmail?: string;
  supportEmail?: string;

  website?: string;
  taxID?: string;

  addressLine1?: string;
  addressLine2?: string;

  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;

  planName?: string;
  monthlyPrice?: number;

  trialLengthDays?: number;

  billingProvider?:
    PlatformBillingProvider;

  employeeLimit?: number;
  customerLimit?: number;
  productLimit?: number;
  storageLimitGB?: number;

  enabledModules?: string[];
  disabledModules?: string[];

  businessInviteCode?: string;

  createdByPlatformUID: string;
}

// ============================================================
// MARK: - Firestore Payload Contract
// ============================================================

/**
 * Exact Apple-compatible write contract.
 *
 * The service layer will use this interface when constructing
 * platformClients/{businessID} payloads.
 */
export interface PlatformClientFirestorePayload {
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

  ownerAccountStatusRawValue:
    PlatformOwnerAccountStatus;

  ownerInvitationStatusRawValue:
    PlatformOwnerInvitationStatus;

  ownerInvitationCode: string;
  ownerInvitationLink: string;

  ownerInvitationSentAt?:
    Date;

  ownerInvitationAcceptedAt?:
    Date;

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

  clientStatusRawValue:
    PlatformClientStatus;

  onboardingStatusRawValue:
    PlatformOnboardingStatus;

  archivedAt?: Date;
  pendingDeletionAt?: Date;

  deletionRequestedByUID: string;

  planName: string;

  subscriptionStatus:
    PlatformSubscriptionStatus;

  monthlyPrice: number;
  isActive: boolean;

  trialLengthDays: number;
  trialStartDate: Date;
  trialEndDate: Date;

  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;

  nextBillingDate?: Date;
  lastPaymentDate?: Date;
  gracePeriodEndDate?: Date;

  suspensionReason: string;
  cancellationReason: string;

  billingProviderRawValue:
    PlatformBillingProvider;

  appleOriginalTransactionID: string;
  appleProductID: string;

  stripeCustomerID: string;
  stripeSubscriptionID: string;

  employeeLimit: number;
  customerLimit: number;
  productLimit: number;
  storageLimitGB: number;

  canCreateInvitations: boolean;
  canUseAutomaticLogo: boolean;

  /**
   * Legacy Apple-compatible JSON strings.
   */
  enabledModulesRawValue: string;
  disabledModulesRawValue: string;

  /**
   * Web-native arrays may be written alongside the legacy
   * values during a controlled migration.
   */
  enabledModules?: string[];
  disabledModules?: string[];

  businessInviteCode: string;

  accountManagerName: string;
  internalTags: string;
  riskLevel: string;
  notes: string;

  lastLoginDate?: Date;
  lastSyncDate?: Date;

  lastOwnerPasswordResetRequestedAt?:
    Date;

  lastOwnerAccessDisabledAt?:
    Date;

  lastOwnerAccessEnabledAt?:
    Date;

  createdByPlatformUID: string;
  updatedByPlatformUID: string;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// MARK: - Loading and Hook State
// ============================================================

export interface PlatformExecutiveCenterState {
  clients:
    PlatformClientViewModel[];

  invitations:
    PlatformOwnerInvitationRecord[];

  metrics:
    PlatformExecutiveMetrics;

  attentionItems:
    PlatformExecutiveAttentionItem[];

  selectedSection:
    PlatformExecutiveSection;

  selectedBusinessID:
    string | null;

  searchText: string;

  platformStatus:
    PlatformExecutiveSystemStatus;

  syncStatus:
    PlatformExecutiveSyncStatus;

  stripeStatus:
    PlatformExecutiveConnectionStatus;

  lastSyncDate:
    Date | null;

  isLoading: boolean;
  isRefreshing: boolean;
  isSaving: boolean;

  errorMessage:
    string | null;
}

// ============================================================
// MARK: - Firestore Collections
// ============================================================

export const PLATFORM_EXECUTIVE_COLLECTIONS = {
  platformClients:
    "platformClients",

  ownerInvitations:
    "platformBusinessOwnerInvitations",

  auditEvents:
    "platformAuditEvents",

  businesses:
    "businesses",

  users:
    "users",

  memberships:
    "businessMemberships",

  appSettings:
    "appSettings",
} as const;

export type PlatformExecutiveCollectionName =
  (typeof PLATFORM_EXECUTIVE_COLLECTIONS)[
    keyof typeof PLATFORM_EXECUTIVE_COLLECTIONS
  ];

// ============================================================
// MARK: - Audit Events
// ============================================================

export type PlatformAuditEventType =
  | "client-created"
  | "client-updated"
  | "business-activated"
  | "business-deactivated"
  | "business-suspended"
  | "business-reactivated"
  | "business-archived"
  | "business-restored"
  | "deletion-requested"
  | "deletion-canceled"
  | "trial-started"
  | "subscription-activated"
  | "subscription-past-due"
  | "grace-period-started"
  | "subscription-canceled"
  | "payment-recorded"
  | "owner-invitation-prepared"
  | "owner-invitation-sent"
  | "owner-invitation-resent"
  | "owner-invitation-canceled"
  | "owner-registered"
  | "owner-access-disabled"
  | "owner-access-enabled"
  | "modules-updated"
  | "limits-updated"
  | "internal-notes-updated"
  | "onboarding-updated";

export interface PlatformAuditEvent {
  id: string;

  type:
    PlatformAuditEventType;

  businessID: string;

  businessName: string;

  platformUID: string;

  title: string;
  message: string;

  previousValues?:
    Record<string, unknown>;

  updatedValues?:
    Record<string, unknown>;

  createdAt: Date;
}