/*
 * JCS Business Suite
 * PlatformClientDomain.ts
 *
 * Domain normalization and business rules for PlatformClient.
 *
 * Responsibilities:
 *
 * - Normalize Firestore documents.
 * - Preserve compatibility with the Apple application.
 * - Calculate PlatformClient derived state.
 * - Determine platform access.
 * - Detect Executive Center attention conditions.
 * - Calculate global platform metrics.
 * - Search, filter and sort platform clients.
 *
 * React components and Firestore write operations must not
 * live in this file.
 */

import {
  PLATFORM_BILLING_PROVIDER_VALUES,
  PLATFORM_BILLING_PROVIDERS,
  PLATFORM_CLIENT_STATUSES,
  PLATFORM_CLIENT_STATUS_VALUES,
  PLATFORM_ONBOARDING_STATUSES,
  PLATFORM_ONBOARDING_STATUS_VALUES,
  PLATFORM_OWNER_ACCOUNT_STATUSES,
  PLATFORM_OWNER_ACCOUNT_STATUS_VALUES,
  PLATFORM_OWNER_INVITATION_STATUSES,
  PLATFORM_OWNER_INVITATION_STATUS_VALUES,
  PLATFORM_SUBSCRIPTION_STATUSES,
  PLATFORM_SUBSCRIPTION_STATUS_VALUES,

  type FirestoreTimestampLike,
  type PlatformBillingProvider,
  type PlatformClientDerivedState,
  type PlatformClientFilter,
  type PlatformClientFirestoreData,
  type PlatformClientFirestorePayload,
  type PlatformClientQueryOptions,
  type PlatformClientRecord,
  type PlatformClientSortField,
  type PlatformClientViewModel,
  type PlatformDateValue,
  type PlatformExecutiveAttentionItem,
  type PlatformExecutiveAttentionReason,
  type PlatformExecutiveAttentionSeverity,
  type PlatformExecutiveMetrics,
  type PlatformModuleCollectionValue,
  type PlatformOnboardingStatus,
  type PlatformOwnerAccountStatus,
  type PlatformOwnerInvitationRecord,
  type PlatformOwnerInvitationStatus,
  type PlatformSortDirection,
  type PlatformSubscriptionStatus,
  type PlatformClientStatus,
} from "./PlatformExecutiveTypes";

// ============================================================
// MARK: - Domain Defaults
// ============================================================

const DEFAULT_TRIAL_LENGTH_DAYS = 7;

const DEFAULT_LOCALE_IDENTIFIER =
  "en-US";

const DEFAULT_TIME_ZONE_IDENTIFIER =
  "America/New_York";

const DEFAULT_COUNTRY =
  "USA";

const DEFAULT_PLAN_NAME =
  "Starter";

const DEFAULT_RISK_LEVEL =
  "Normal";

const MILLISECONDS_PER_DAY =
  86_400_000;

// ============================================================
// MARK: - Primitive Normalization
// ============================================================

export function cleanPlatformText(
  value: unknown
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function cleanPlatformEmail(
  value: unknown
): string {
  return cleanPlatformText(
    value
  ).toLowerCase();
}

export function cleanPlatformUppercaseText(
  value: unknown
): string {
  return cleanPlatformText(
    value
  ).toUpperCase();
}

export function platformNumber(
  value: unknown,
  fallback = 0
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    const parsedValue =
      Number(value);

    if (
      Number.isFinite(
        parsedValue
      )
    ) {
      return parsedValue;
    }
  }

  return fallback;
}

export function platformNonNegativeNumber(
  value: unknown,
  fallback = 0
): number {
  return Math.max(
    platformNumber(
      value,
      fallback
    ),
    0
  );
}

export function platformInteger(
  value: unknown,
  fallback = 0
): number {
  const normalized =
    platformNumber(
      value,
      fallback
    );

  return Math.trunc(
    normalized
  );
}

export function platformNonNegativeInteger(
  value: unknown,
  fallback = 0
): number {
  return Math.max(
    platformInteger(
      value,
      fallback
    ),
    0
  );
}

export function platformPositiveInteger(
  value: unknown,
  fallback = 1
): number {
  return Math.max(
    platformInteger(
      value,
      fallback
    ),
    1
  );
}

export function platformBoolean(
  value: unknown,
  fallback = false
): boolean {
  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    typeof value === "number"
  ) {
    return value !== 0;
  }

  if (
    typeof value === "string"
  ) {
    const normalized =
      value
        .trim()
        .toLowerCase();

    if (
      normalized === "true" ||
      normalized === "1" ||
      normalized === "yes"
    ) {
      return true;
    }

    if (
      normalized === "false" ||
      normalized === "0" ||
      normalized === "no"
    ) {
      return false;
    }
  }

  return fallback;
}

// ============================================================
// MARK: - Date Normalization
// ============================================================

function isFirestoreTimestampLike(
  value: unknown
): value is FirestoreTimestampLike {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const candidate =
    value as Partial<
      FirestoreTimestampLike
    >;

  return (
    typeof candidate.seconds ===
      "number" &&
    typeof candidate.nanoseconds ===
      "number"
  );
}

export function platformDate(
  value: PlatformDateValue,
  fallback: Date | null = null
): Date | null {
  if (
    value instanceof Date
  ) {
    const copiedDate =
      new Date(
        value.getTime()
      );

    return Number.isNaN(
      copiedDate.getTime()
    )
      ? fallback
      : copiedDate;
  }

  if (
    isFirestoreTimestampLike(
      value
    )
  ) {
    if (
      typeof value.toDate ===
      "function"
    ) {
      const convertedDate =
        value.toDate();

      if (
        !Number.isNaN(
          convertedDate.getTime()
        )
      ) {
        return convertedDate;
      }
    }

    const milliseconds =
      value.seconds * 1000 +
      Math.floor(
        value.nanoseconds /
          1_000_000
      );

    const convertedDate =
      new Date(milliseconds);

    return Number.isNaN(
      convertedDate.getTime()
    )
      ? fallback
      : convertedDate;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const convertedDate =
      new Date(value);

    return Number.isNaN(
      convertedDate.getTime()
    )
      ? fallback
      : convertedDate;
  }

  return fallback;
}

export function requiredPlatformDate(
  value: PlatformDateValue,
  fallback: Date
): Date {
  return (
    platformDate(
      value,
      fallback
    ) ??
    new Date(
      fallback.getTime()
    )
  );
}

export function startOfPlatformDay(
  date: Date
): Date {
  const result =
    new Date(
      date.getTime()
    );

  result.setHours(
    0,
    0,
    0,
    0
  );

  return result;
}

export function addPlatformDays(
  date: Date,
  days: number
): Date {
  const result =
    new Date(
      date.getTime()
    );

  result.setDate(
    result.getDate() +
      days
  );

  return result;
}

export function addPlatformMonths(
  date: Date,
  months: number
): Date {
  const result =
    new Date(
      date.getTime()
    );

  result.setMonth(
    result.getMonth() +
      months
  );

  return result;
}

// ============================================================
// MARK: - Enum Normalization
// ============================================================

function normalizedEnumValue<T extends string>(
  value: unknown,
  allowedValues:
    readonly T[],
  fallback: T
): T {
  const cleanedValue =
    cleanPlatformText(
      value
    );

  const exactMatch =
    allowedValues.find(
      (candidate) =>
        candidate ===
        cleanedValue
    );

  if (exactMatch) {
    return exactMatch;
  }

  const normalizedValue =
    cleanedValue.toLowerCase();

  const caseInsensitiveMatch =
    allowedValues.find(
      (candidate) =>
        candidate.toLowerCase() ===
        normalizedValue
    );

  return (
    caseInsensitiveMatch ??
    fallback
  );
}

export function normalizePlatformBillingProvider(
  value: unknown
): PlatformBillingProvider {
  return normalizedEnumValue(
    value,
    PLATFORM_BILLING_PROVIDER_VALUES,
    PLATFORM_BILLING_PROVIDERS.none
  );
}

export function normalizePlatformSubscriptionStatus(
  value: unknown
): PlatformSubscriptionStatus {
  return normalizedEnumValue(
    value,
    PLATFORM_SUBSCRIPTION_STATUS_VALUES,
    PLATFORM_SUBSCRIPTION_STATUSES.inactive
  );
}

export function normalizePlatformClientStatus(
  value: unknown
): PlatformClientStatus {
  return normalizedEnumValue(
    value,
    PLATFORM_CLIENT_STATUS_VALUES,
    PLATFORM_CLIENT_STATUSES.onboarding
  );
}

export function normalizePlatformOwnerAccountStatus(
  value: unknown
): PlatformOwnerAccountStatus {
  return normalizedEnumValue(
    value,
    PLATFORM_OWNER_ACCOUNT_STATUS_VALUES,
    PLATFORM_OWNER_ACCOUNT_STATUSES
      .pendingRegistration
  );
}

export function normalizePlatformOwnerInvitationStatus(
  value: unknown
): PlatformOwnerInvitationStatus {
  return normalizedEnumValue(
    value,
    PLATFORM_OWNER_INVITATION_STATUS_VALUES,
    PLATFORM_OWNER_INVITATION_STATUSES
      .notInvited
  );
}

export function normalizePlatformOnboardingStatus(
  value: unknown
): PlatformOnboardingStatus {
  return normalizedEnumValue(
    value,
    PLATFORM_ONBOARDING_STATUS_VALUES,
    PLATFORM_ONBOARDING_STATUSES
      .notStarted
  );
}

// ============================================================
// MARK: - Collection Normalization
// ============================================================

export function normalizePlatformStringArray(
  value:
    PlatformModuleCollectionValue
): string[] {
  let candidateValues:
    unknown[] = [];

  if (
    Array.isArray(value)
  ) {
    candidateValues =
      value;
  } else if (
    typeof value === "string"
  ) {
    const cleanedValue =
      value.trim();

    if (!cleanedValue) {
      return [];
    }

    try {
      const decodedValue =
        JSON.parse(
          cleanedValue
        );

      if (
        Array.isArray(
          decodedValue
        )
      ) {
        candidateValues =
          decodedValue;
      } else {
        candidateValues =
          cleanedValue.split(",");
      }
    } catch {
      candidateValues =
        cleanedValue.split(",");
    }
  }

  const normalizedValues =
    candidateValues
      .map(
        cleanPlatformText
      )
      .filter(
        (item) =>
          item.length > 0
      );

  return Array.from(
    new Set(
      normalizedValues
    )
  ).sort(
    (firstValue, secondValue) =>
      firstValue.localeCompare(
        secondValue,
        undefined,
        {
          sensitivity:
            "base",
        }
      )
  );
}

export function encodePlatformStringArray(
  values: readonly string[]
): string {
  const normalizedValues =
    normalizePlatformStringArray(
      [...values]
    );

  return JSON.stringify(
    normalizedValues
  );
}

export function normalizePlatformTags(
  value: unknown
): string[] {
  if (
    Array.isArray(value)
  ) {
    return Array.from(
      new Set(
        value
          .map(
            cleanPlatformText
          )
          .filter(Boolean)
      )
    );
  }

  const cleanedValue =
    cleanPlatformText(
      value
    );

  if (!cleanedValue) {
    return [];
  }

  return Array.from(
    new Set(
      cleanedValue
        .split(/[,;\n]/)
        .map(
          (tag) =>
            tag.trim()
        )
        .filter(Boolean)
    )
  );
}

export function encodePlatformTags(
  values: readonly string[]
): string {
  return normalizePlatformTags(
    [...values]
  ).join(", ");
}

// ============================================================
// MARK: - Record Normalization
// ============================================================

export function normalizePlatformClientRecord(
  documentID: string,
  source:
    PlatformClientFirestoreData,
  now: Date = new Date()
): PlatformClientRecord {
  const cleanedDocumentID =
    cleanPlatformText(
      documentID
    );

  const businessID =
    cleanPlatformText(
      source.businessID
    ) ||
    cleanedDocumentID;

  const trialLengthDays =
    platformPositiveInteger(
      source.trialLengthDays,
      DEFAULT_TRIAL_LENGTH_DAYS
    );

  const createdAt =
    requiredPlatformDate(
      source.createdAt,
      now
    );

  const updatedAt =
    requiredPlatformDate(
      source.updatedAt,
      createdAt
    );

  const trialStartDate =
    requiredPlatformDate(
      source.trialStartDate,
      createdAt
    );

  const trialEndDate =
    requiredPlatformDate(
      source.trialEndDate,
      addPlatformDays(
        trialStartDate,
        trialLengthDays
      )
    );

  const enabledModules =
    normalizePlatformStringArray(
      source.enabledModules ??
        source.enabledModulesRawValue
    );

  const disabledModules =
    normalizePlatformStringArray(
      source.disabledModules ??
        source.disabledModulesRawValue
    );

  return {
    documentID:
      cleanedDocumentID ||
      businessID,

    businessID,

    ownerUID:
      cleanPlatformText(
        source.ownerUID
      ),

    ownerFirebaseUID:
      cleanPlatformText(
        source.ownerFirebaseUID
      ),

    businessName:
      cleanPlatformText(
        source.businessName
      ),

    industry:
      cleanPlatformText(
        source.industry
      ),

    businessCategory:
      cleanPlatformText(
        source.businessCategory
      ),

    businessModeRawValue:
      cleanPlatformText(
        source.businessModeRawValue
      ) ||
      "Retail",

    localeIdentifier:
      cleanPlatformText(
        source.localeIdentifier
      ) ||
      DEFAULT_LOCALE_IDENTIFIER,

    timeZoneIdentifier:
      cleanPlatformText(
        source.timeZoneIdentifier
      ) ||
      DEFAULT_TIME_ZONE_IDENTIFIER,

    ownerFullName:
      cleanPlatformText(
        source.ownerFullName
      ),

    ownerEmail:
      cleanPlatformEmail(
        source.ownerEmail
      ),

    ownerPhone:
      cleanPlatformText(
        source.ownerPhone
      ),

    ownerAccountStatus:
      normalizePlatformOwnerAccountStatus(
        source.ownerAccountStatusRawValue
      ),

    ownerInvitationStatus:
      normalizePlatformOwnerInvitationStatus(
        source.ownerInvitationStatusRawValue
      ),

    ownerInvitationCode:
      cleanPlatformUppercaseText(
        source.ownerInvitationCode
      ),

    ownerInvitationLink:
      cleanPlatformText(
        source.ownerInvitationLink
      ),

    ownerInvitationSentAt:
      platformDate(
        source.ownerInvitationSentAt
      ),

    ownerInvitationAcceptedAt:
      platformDate(
        source.ownerInvitationAcceptedAt
      ),

    businessPhone:
      cleanPlatformText(
        source.businessPhone
      ),

    businessEmail:
      cleanPlatformEmail(
        source.businessEmail
      ),

    supportEmail:
      cleanPlatformEmail(
        source.supportEmail
      ),

    website:
      cleanPlatformText(
        source.website
      ),

    taxID:
      cleanPlatformText(
        source.taxID
      ),

    addressLine1:
      cleanPlatformText(
        source.addressLine1
      ),

    addressLine2:
      cleanPlatformText(
        source.addressLine2
      ),

    city:
      cleanPlatformText(
        source.city
      ),

    state:
      cleanPlatformText(
        source.state
      ),

    zipCode:
      cleanPlatformText(
        source.zipCode
      ),

    country:
      cleanPlatformText(
        source.country
      ) ||
      DEFAULT_COUNTRY,

    secondaryContactName:
      cleanPlatformText(
        source.secondaryContactName
      ),

    secondaryContactEmail:
      cleanPlatformEmail(
        source.secondaryContactEmail
      ),

    secondaryContactPhone:
      cleanPlatformText(
        source.secondaryContactPhone
      ),

    billingContactName:
      cleanPlatformText(
        source.billingContactName
      ),

    billingContactEmail:
      cleanPlatformEmail(
        source.billingContactEmail
      ),

    billingContactPhone:
      cleanPlatformText(
        source.billingContactPhone
      ),

    clientStatus:
      normalizePlatformClientStatus(
        source.clientStatusRawValue
      ),

    onboardingStatus:
      normalizePlatformOnboardingStatus(
        source.onboardingStatusRawValue
      ),

    archivedAt:
      platformDate(
        source.archivedAt
      ),

    pendingDeletionAt:
      platformDate(
        source.pendingDeletionAt
      ),

    deletionRequestedByUID:
      cleanPlatformText(
        source.deletionRequestedByUID
      ),

    planName:
      cleanPlatformText(
        source.planName
      ) ||
      DEFAULT_PLAN_NAME,

    subscriptionStatus:
      normalizePlatformSubscriptionStatus(
        source.subscriptionStatus
      ),

    monthlyPrice:
      platformNonNegativeNumber(
        source.monthlyPrice
      ),

    isActive:
      platformBoolean(
        source.isActive,
        true
      ),

    trialLengthDays,

    trialStartDate,

    trialEndDate,

    subscriptionStartDate:
      platformDate(
        source.subscriptionStartDate
      ),

    subscriptionEndDate:
      platformDate(
        source.subscriptionEndDate
      ),

    nextBillingDate:
      platformDate(
        source.nextBillingDate
      ),

    lastPaymentDate:
      platformDate(
        source.lastPaymentDate
      ),

    gracePeriodEndDate:
      platformDate(
        source.gracePeriodEndDate
      ),

    suspensionReason:
      cleanPlatformText(
        source.suspensionReason
      ),

    cancellationReason:
      cleanPlatformText(
        source.cancellationReason
      ),

    billingProvider:
      normalizePlatformBillingProvider(
        source.billingProviderRawValue
      ),

    appleOriginalTransactionID:
      cleanPlatformText(
        source.appleOriginalTransactionID
      ),

    appleProductID:
      cleanPlatformText(
        source.appleProductID
      ),

    stripeCustomerID:
      cleanPlatformText(
        source.stripeCustomerID
      ),

    stripeSubscriptionID:
      cleanPlatformText(
        source.stripeSubscriptionID
      ),

    employeeLimit:
      platformNonNegativeInteger(
        source.employeeLimit,
        3
      ),

    customerLimit:
      platformNonNegativeInteger(
        source.customerLimit,
        100
      ),

    productLimit:
      platformNonNegativeInteger(
        source.productLimit,
        100
      ),

    storageLimitGB:
      platformNonNegativeNumber(
        source.storageLimitGB,
        1
      ),

    canCreateInvitations:
      platformBoolean(
        source.canCreateInvitations,
        true
      ),

    canUseAutomaticLogo:
      platformBoolean(
        source.canUseAutomaticLogo,
        true
      ),

    enabledModules,

    disabledModules,

    businessInviteCode:
      cleanPlatformUppercaseText(
        source.businessInviteCode
      ),

    accountManagerName:
      cleanPlatformText(
        source.accountManagerName
      ),

    internalTags:
      normalizePlatformTags(
        source.internalTags
      ),

    riskLevel:
      cleanPlatformText(
        source.riskLevel
      ) ||
      DEFAULT_RISK_LEVEL,

    notes:
      cleanPlatformText(
        source.notes
      ),

    lastLoginDate:
      platformDate(
        source.lastLoginDate
      ),

    lastSyncDate:
      platformDate(
        source.lastSyncDate
      ),

    lastOwnerPasswordResetRequestedAt:
      platformDate(
        source
          .lastOwnerPasswordResetRequestedAt
      ),

    lastOwnerAccessDisabledAt:
      platformDate(
        source
          .lastOwnerAccessDisabledAt
      ),

    lastOwnerAccessEnabledAt:
      platformDate(
        source
          .lastOwnerAccessEnabledAt
      ),

    createdByPlatformUID:
      cleanPlatformText(
        source.createdByPlatformUID
      ),

    updatedByPlatformUID:
      cleanPlatformText(
        source.updatedByPlatformUID
      ),

    createdAt,

    updatedAt,
  };
}

// ============================================================
// MARK: - Display Helpers
// ============================================================

export function platformClientDisplayBusinessName(
  client:
    Pick<
      PlatformClientRecord,
      "businessName"
    >
): string {
  return (
    cleanPlatformText(
      client.businessName
    ) ||
    "Unnamed Business"
  );
}

export function platformClientDisplayOwnerName(
  client:
    Pick<
      PlatformClientRecord,
      | "ownerFullName"
      | "ownerEmail"
    >
): string {
  return (
    cleanPlatformText(
      client.ownerFullName
    ) ||
    cleanPlatformEmail(
      client.ownerEmail
    ) ||
    "Unregistered Owner"
  );
}

export function platformClientDisplayBusinessEmail(
  client:
    Pick<
      PlatformClientRecord,
      | "businessEmail"
      | "supportEmail"
    >
): string {
  return (
    cleanPlatformEmail(
      client.businessEmail
    ) ||
    cleanPlatformEmail(
      client.supportEmail
    ) ||
    "No Business Email"
  );
}

export function platformClientFullAddress(
  client:
    Pick<
      PlatformClientRecord,
      | "addressLine1"
      | "addressLine2"
      | "city"
      | "state"
      | "zipCode"
      | "country"
    >
): string {
  return [
    client.addressLine1,
    client.addressLine2,
    client.city,
    client.state,
    client.zipCode,
    client.country,
  ]
    .map(
      cleanPlatformText
    )
    .filter(Boolean)
    .join(", ");
}

export function platformClientHasContactInformation(
  client:
    Pick<
      PlatformClientRecord,
      | "businessPhone"
      | "businessEmail"
      | "supportEmail"
      | "website"
    >
): boolean {
  return [
    client.businessPhone,
    client.businessEmail,
    client.supportEmail,
    client.website,
  ].some(
    (value) =>
      cleanPlatformText(
        value
      ).length > 0
  );
}

// ============================================================
// MARK: - Trial Helpers
// ============================================================

export function platformTrialDaysRemaining(
  trialEndDate: Date,
  now: Date = new Date()
): number {
  const currentDay =
    startOfPlatformDay(
      now
    );

  const endingDay =
    startOfPlatformDay(
      trialEndDate
    );

  const difference =
    endingDay.getTime() -
    currentDay.getTime();

  return Math.max(
    Math.round(
      difference /
        MILLISECONDS_PER_DAY
    ),
    0
  );
}

export function platformClientIsTrialExpired(
  client:
    Pick<
      PlatformClientRecord,
      | "subscriptionStatus"
      | "trialEndDate"
    >,
  now: Date = new Date()
): boolean {
  return (
    client.subscriptionStatus ===
      PLATFORM_SUBSCRIPTION_STATUSES
        .freeTrial &&
    now.getTime() >
      client.trialEndDate.getTime()
  );
}

export function platformClientDisplaySubscriptionStatus(
  client:
    Pick<
      PlatformClientRecord,
      | "subscriptionStatus"
      | "trialEndDate"
    >,
  now: Date = new Date()
): string {
  return platformClientIsTrialExpired(
    client,
    now
  )
    ? PLATFORM_SUBSCRIPTION_STATUSES
        .trialExpired
    : client.subscriptionStatus;
}

// ============================================================
// MARK: - Access Rules
// ============================================================

export function platformClientCanAccessApp(
  client:
    Pick<
      PlatformClientRecord,
      | "isActive"
      | "clientStatus"
      | "subscriptionStatus"
      | "trialEndDate"
      | "gracePeriodEndDate"
    >,
  now: Date = new Date()
): boolean {
  if (!client.isActive) {
    return false;
  }

  if (
    client.clientStatus ===
      PLATFORM_CLIENT_STATUSES.archived ||
    client.clientStatus ===
      PLATFORM_CLIENT_STATUSES
        .pendingDeletion ||
    client.clientStatus ===
      PLATFORM_CLIENT_STATUSES.canceled
  ) {
    return false;
  }

  switch (
    client.subscriptionStatus
  ) {
    case PLATFORM_SUBSCRIPTION_STATUSES
      .active:
      return true;

    case PLATFORM_SUBSCRIPTION_STATUSES
      .gracePeriod:
      return client.gracePeriodEndDate
        ? now.getTime() <=
            client.gracePeriodEndDate.getTime()
        : true;

    case PLATFORM_SUBSCRIPTION_STATUSES
      .freeTrial:
      return !platformClientIsTrialExpired(
        client,
        now
      );

    case PLATFORM_SUBSCRIPTION_STATUSES
      .pastDue:

    case PLATFORM_SUBSCRIPTION_STATUSES
      .trialExpired:

    case PLATFORM_SUBSCRIPTION_STATUSES
      .suspended:

    case PLATFORM_SUBSCRIPTION_STATUSES
      .canceled:

    case PLATFORM_SUBSCRIPTION_STATUSES
      .inactive:
      return false;

    default:
      return false;
  }
}

export function platformClientIsBillingConfigured(
  client:
    Pick<
      PlatformClientRecord,
      | "billingProvider"
      | "appleOriginalTransactionID"
      | "appleProductID"
      | "stripeCustomerID"
      | "stripeSubscriptionID"
    >
): boolean {
  switch (
    client.billingProvider
  ) {
    case PLATFORM_BILLING_PROVIDERS
      .apple:
      return Boolean(
        cleanPlatformText(
          client.appleOriginalTransactionID
        ) ||
          cleanPlatformText(
            client.appleProductID
          )
      );

    case PLATFORM_BILLING_PROVIDERS
      .stripe:
      return Boolean(
        cleanPlatformText(
          client.stripeCustomerID
        ) ||
          cleanPlatformText(
            client.stripeSubscriptionID
          )
      );

    case PLATFORM_BILLING_PROVIDERS
      .manual:
      return true;

    case PLATFORM_BILLING_PROVIDERS
      .none:
      return false;

    default:
      return false;
  }
}

export function platformClientIsOwnerRegistered(
  client:
    Pick<
      PlatformClientRecord,
      | "ownerFirebaseUID"
      | "ownerAccountStatus"
    >
): boolean {
  return (
    cleanPlatformText(
      client.ownerFirebaseUID
    ).length > 0 &&
    client.ownerAccountStatus ===
      PLATFORM_OWNER_ACCOUNT_STATUSES
        .active
  );
}

export function platformClientIsOnboardingComplete(
  client:
    Pick<
      PlatformClientRecord,
      "onboardingStatus"
    >
): boolean {
  return (
    client.onboardingStatus ===
    PLATFORM_ONBOARDING_STATUSES
      .ready
  );
}

// ============================================================
// MARK: - Invitation Rules
// ============================================================

export function platformClientHasPendingOwnerInvitation(
  client:
    Pick<
      PlatformClientRecord,
      "ownerInvitationStatus"
    >
): boolean {
  return (
    client.ownerInvitationStatus ===
      PLATFORM_OWNER_INVITATION_STATUSES
        .pending ||
    client.ownerInvitationStatus ===
      PLATFORM_OWNER_INVITATION_STATUSES
        .sent
  );
}

export function platformClientCanPrepareOwnerInvitation(
  client:
    Pick<
      PlatformClientRecord,
      | "ownerFirebaseUID"
      | "ownerAccountStatus"
      | "ownerInvitationStatus"
    >
): boolean {
  return (
    !platformClientIsOwnerRegistered(
      client
    ) &&
    client.ownerInvitationStatus ===
      PLATFORM_OWNER_INVITATION_STATUSES
        .notInvited
  );
}

export function platformClientCanSendPreparedOwnerInvitation(
  client:
    Pick<
      PlatformClientRecord,
      | "ownerFirebaseUID"
      | "ownerAccountStatus"
      | "ownerInvitationStatus"
      | "ownerInvitationCode"
      | "ownerInvitationLink"
    >
): boolean {
  return (
    !platformClientIsOwnerRegistered(
      client
    ) &&
    client.ownerInvitationStatus ===
      PLATFORM_OWNER_INVITATION_STATUSES
        .pending &&
    Boolean(
      cleanPlatformText(
        client.ownerInvitationCode
      )
    ) &&
    Boolean(
      cleanPlatformText(
        client.ownerInvitationLink
      )
    )
  );
}

export function platformClientCanResendOwnerInvitation(
  client:
    Pick<
      PlatformClientRecord,
      | "ownerFirebaseUID"
      | "ownerAccountStatus"
      | "ownerInvitationStatus"
      | "ownerInvitationCode"
      | "ownerInvitationLink"
    >
): boolean {
  return (
    !platformClientIsOwnerRegistered(
      client
    ) &&
    client.ownerInvitationStatus ===
      PLATFORM_OWNER_INVITATION_STATUSES
        .sent &&
    Boolean(
      cleanPlatformText(
        client.ownerInvitationCode
      )
    ) &&
    Boolean(
      cleanPlatformText(
        client.ownerInvitationLink
      )
    )
  );
}

export function platformClientCanReplaceOwnerInvitation(
  client:
    Pick<
      PlatformClientRecord,
      | "ownerFirebaseUID"
      | "ownerAccountStatus"
      | "ownerInvitationStatus"
    >
): boolean {
  if (
    platformClientIsOwnerRegistered(
      client
    )
  ) {
    return false;
  }

  switch (
    client.ownerInvitationStatus
  ) {
    case "Pending":
    case "Sent":
    case "Expired":
    case "Canceled":
      return true;

    case "Not Invited":
    case "Accepted":
    default:
      return false;
  }
}
export function platformClientCanCancelOwnerInvitation(
  client:
    Pick<
      PlatformClientRecord,
      | "ownerFirebaseUID"
      | "ownerAccountStatus"
      | "ownerInvitationStatus"
    >
): boolean {
  if (
    platformClientIsOwnerRegistered(
      client
    )
  ) {
    return false;
  }

  switch (
    client.ownerInvitationStatus
  ) {
    case "Pending":
    case "Sent":
      return true;

    case "Not Invited":
    case "Accepted":
    case "Expired":
    case "Canceled":
    default:
      return false;
  }
}

// ============================================================
// MARK: - Executive Attention Rules
// ============================================================

export function platformClientExecutiveAttentionReason(
  client:
    PlatformClientRecord,
  now: Date = new Date()
):
  PlatformExecutiveAttentionReason |
  null {
  if (
    client.clientStatus ===
    PLATFORM_CLIENT_STATUSES
      .pendingDeletion
  ) {
    return "pending-deletion";
  }

  if (
    client.clientStatus ===
    PLATFORM_CLIENT_STATUSES
      .archived
  ) {
    return "archived";
  }

  if (!client.isActive) {
    return "inactive";
  }

  if (
    platformClientIsTrialExpired(
      client,
      now
    )
  ) {
    return "trial-expired";
  }

  if (
    client.subscriptionStatus ===
    PLATFORM_SUBSCRIPTION_STATUSES
      .pastDue
  ) {
    return "subscription-past-due";
  }

  if (
    client.ownerAccountStatus ===
    PLATFORM_OWNER_ACCOUNT_STATUSES
      .disabled
  ) {
    return "owner-access-disabled";
  }

  if (
    client.ownerAccountStatus ===
    PLATFORM_OWNER_ACCOUNT_STATUSES
      .locked
  ) {
    return "owner-account-locked";
  }

  if (
    !platformClientIsOwnerRegistered(
      client
    )
  ) {
    return "owner-registration-pending";
  }

  if (
    !platformClientIsOnboardingComplete(
      client
    )
  ) {
    return "onboarding-incomplete";
  }

  if (
    !platformClientCanAccessApp(
      client,
      now
    )
  ) {
    return "application-access-restricted";
  }

  return null;
}

export function platformExecutiveAttentionSeverity(
  reason:
    PlatformExecutiveAttentionReason
): PlatformExecutiveAttentionSeverity {
  switch (reason) {
    case "pending-deletion":
    case "trial-expired":
    case "owner-account-locked":
      return "critical";

    case "archived":
    case "inactive":
    case "subscription-past-due":
    case "owner-access-disabled":
    case "owner-registration-pending":
    case "onboarding-incomplete":
    case "application-access-restricted":
      return "warning";

    default:
      return "informational";
  }
}

export function platformExecutiveAttentionTitle(
  reason:
    PlatformExecutiveAttentionReason
): string {
  switch (reason) {
    case "pending-deletion":
      return "Deletion Pending";

    case "archived":
      return "Business Archived";

    case "inactive":
      return "Business Inactive";

    case "trial-expired":
      return "Trial Expired";

    case "owner-registration-pending":
      return "Owner Registration Pending";

    case "onboarding-incomplete":
      return "Onboarding Incomplete";

    case "application-access-restricted":
      return "Application Access Restricted";

    case "subscription-past-due":
      return "Subscription Past Due";

    case "owner-access-disabled":
      return "Owner Access Disabled";

    case "owner-account-locked":
      return "Owner Account Locked";
  }
}

export function platformExecutiveAttentionMessage(
  reason:
    PlatformExecutiveAttentionReason
): string {
  switch (reason) {
    case "pending-deletion":
      return (
        "This business is marked for the protected deletion workflow."
      );

    case "archived":
      return (
        "This business has been removed from active platform operations."
      );

    case "inactive":
      return (
        "Normal application access is disabled until the business is activated again."
      );

    case "trial-expired":
      return (
        "The configured trial period has ended and subscription follow-up may be required."
      );

    case "owner-registration-pending":
      return (
        "The invited Business Owner has not completed account registration."
      );

    case "onboarding-incomplete":
      return (
        "Business setup remains incomplete and may require Platform Administration assistance."
      );

    case "application-access-restricted":
      return (
        "Subscription or administrative conditions currently prevent application access."
      );

    case "subscription-past-due":
      return (
        "The subscription is past due and requires billing follow-up."
      );

    case "owner-access-disabled":
      return (
        "The Business Owner account has been administratively disabled."
      );

    case "owner-account-locked":
      return (
        "The Business Owner account is locked and requires administrative review."
      );
  }
}

export function platformClientNeedsExecutiveAttention(
  client:
    PlatformClientRecord,
  now: Date = new Date()
): boolean {
  return (
    platformClientExecutiveAttentionReason(
      client,
      now
    ) !== null
  );
}

// ============================================================
// MARK: - Derived State
// ============================================================

export function createPlatformClientDerivedState(
  client:
    PlatformClientRecord,
  now: Date = new Date()
): PlatformClientDerivedState {
  const displayBusinessName =
    platformClientDisplayBusinessName(
      client
    );

  const displayOwnerName =
    platformClientDisplayOwnerName(
      client
    );

  const displayBusinessEmail =
    platformClientDisplayBusinessEmail(
      client
    );

  const fullAddress =
    platformClientFullAddress(
      client
    );

  const trialDaysRemaining =
    platformTrialDaysRemaining(
      client.trialEndDate,
      now
    );

  const isTrialExpired =
    platformClientIsTrialExpired(
      client,
      now
    );

  const canAccessApp =
    platformClientCanAccessApp(
      client,
      now
    );

  const isOwnerRegistered =
    platformClientIsOwnerRegistered(
      client
    );

  const attentionReason =
    platformClientExecutiveAttentionReason(
      client,
      now
    );

  return {
    displayBusinessName,
    displayOwnerName,
    displayBusinessEmail,

    fullAddress,

    hasAddress:
      fullAddress.length > 0,

    hasBusinessContactInformation:
      platformClientHasContactInformation(
        client
      ),

    trialDaysRemaining,

    isTrialExpired,

    displaySubscriptionStatus:
      platformClientDisplaySubscriptionStatus(
        client,
        now
      ),

    canAccessApp,

    isBillingConfigured:
      platformClientIsBillingConfigured(
        client
      ),

    isOwnerRegistered,

    isOnboardingComplete:
      platformClientIsOnboardingComplete(
        client
      ),

    isArchived:
      client.clientStatus ===
      PLATFORM_CLIENT_STATUSES
        .archived,

    isPendingDeletion:
      client.clientStatus ===
      PLATFORM_CLIENT_STATUSES
        .pendingDeletion,

    hasPendingOwnerInvitation:
      platformClientHasPendingOwnerInvitation(
        client
      ),

    canPrepareOwnerInvitation:
      platformClientCanPrepareOwnerInvitation(
        client
      ),

    canSendPreparedOwnerInvitation:
      platformClientCanSendPreparedOwnerInvitation(
        client
      ),

    canResendOwnerInvitation:
      platformClientCanResendOwnerInvitation(
        client
      ),

    canReplaceOwnerInvitation:
      platformClientCanReplaceOwnerInvitation(
        client
      ),

    canCancelOwnerInvitation:
      platformClientCanCancelOwnerInvitation(
        client
      ),

    ownerInvitationDisplayStatus:
      isOwnerRegistered
        ? PLATFORM_OWNER_INVITATION_STATUSES
            .accepted
        : client.ownerInvitationStatus,

    needsExecutiveAttention:
      attentionReason !== null,

    executiveAttentionReason:
      attentionReason,
  };
}

export function createPlatformClientViewModel(
  client:
    PlatformClientRecord,
  now: Date = new Date()
): PlatformClientViewModel {
  return {
    ...client,

    ...createPlatformClientDerivedState(
      client,
      now
    ),
  };
}

export function normalizePlatformClientViewModel(
  documentID: string,
  source:
    PlatformClientFirestoreData,
  now: Date = new Date()
): PlatformClientViewModel {
  return createPlatformClientViewModel(
    normalizePlatformClientRecord(
      documentID,
      source,
      now
    ),
    now
  );
}

export function normalizePlatformClientCollection(
  documents:
    readonly {
      id: string;
      data:
        PlatformClientFirestoreData;
    }[],
  now: Date = new Date()
): PlatformClientViewModel[] {
  return documents
    .map(
      (document) =>
        normalizePlatformClientViewModel(
          document.id,
          document.data,
          now
        )
    )
    .sort(
      (
        firstClient,
        secondClient
      ) =>
        firstClient
          .displayBusinessName
          .localeCompare(
            secondClient
              .displayBusinessName,
            undefined,
            {
              sensitivity:
                "base",
            }
          )
    );
}

// ============================================================
// MARK: - Attention Items
// ============================================================

export function createPlatformExecutiveAttentionItem(
  client:
    PlatformClientViewModel
): PlatformExecutiveAttentionItem | null {
  const reason =
    client
      .executiveAttentionReason;

  if (!reason) {
    return null;
  }

  return {
    id:
      `${client.businessID}-${reason}`,

    businessID:
      client.businessID,

    businessName:
      client.displayBusinessName,

    ownerName:
      client.displayOwnerName,

    reason,

    severity:
      platformExecutiveAttentionSeverity(
        reason
      ),

    title:
      platformExecutiveAttentionTitle(
        reason
      ),

    message:
      platformExecutiveAttentionMessage(
        reason
      ),

    createdAt:
      client.updatedAt,
  };
}

export function createPlatformExecutiveAttentionItems(
  clients:
    readonly PlatformClientViewModel[]
): PlatformExecutiveAttentionItem[] {
  return clients
    .map(
      createPlatformExecutiveAttentionItem
    )
    .filter(
      (
        item
      ): item is PlatformExecutiveAttentionItem =>
        item !== null
    )
    .sort(
      (
        firstItem,
        secondItem
      ) => {
        const severityOrder:
          Record<
            PlatformExecutiveAttentionSeverity,
            number
          > = {
            critical: 0,
            warning: 1,
            informational: 2,
          };

        const severityDifference =
          severityOrder[
            firstItem.severity
          ] -
          severityOrder[
            secondItem.severity
          ];

        if (
          severityDifference !== 0
        ) {
          return severityDifference;
        }

        return firstItem
          .businessName
          .localeCompare(
            secondItem.businessName,
            undefined,
            {
              sensitivity:
                "base",
            }
          );
      }
    );
}

// ============================================================
// MARK: - Invitation Record Normalization
// ============================================================

export function normalizePlatformOwnerInvitationRecord(
  documentID: string,
  source:
    Record<string, unknown>,
  now: Date = new Date()
): PlatformOwnerInvitationRecord {
  const createdAt =
    requiredPlatformDate(
      source.createdAt as
        PlatformDateValue,
      now
    );

  return {
    id:
      cleanPlatformText(
        documentID
      ),

    businessID:
      cleanPlatformText(
        source.businessID
      ),

    ownerUID:
      cleanPlatformText(
        source.ownerUID
      ),

    invitedByPlatformUID:
      cleanPlatformText(
        source
          .invitedByPlatformUID ??
          source.invitedByUID
      ),

    ownerFullName:
      cleanPlatformText(
        source.ownerFullName ??
          source.fullName
      ),

    ownerEmail:
      cleanPlatformEmail(
        source.ownerEmail ??
          source.email
      ),

    ownerPhone:
      cleanPlatformText(
        source.ownerPhone ??
          source.phone
      ),

    invitationCode:
      cleanPlatformUppercaseText(
        source.invitationCode ??
          source.inviteCode
      ),

    invitationLink:
      cleanPlatformText(
        source.invitationLink ??
          source.inviteLink
      ),

    status:
      normalizePlatformOwnerInvitationStatus(
        source.status ??
          source.statusRawValue
      ),

    expiresAt:
      platformDate(
        source.expiresAt as
          PlatformDateValue
      ),

    sentAt:
      platformDate(
        source.sentAt as
          PlatformDateValue
      ),

    acceptedAt:
      platformDate(
        source.acceptedAt as
          PlatformDateValue
      ),

    canceledAt:
      platformDate(
        source.canceledAt as
          PlatformDateValue
      ),

    createdAt,

    updatedAt:
      requiredPlatformDate(
        source.updatedAt as
          PlatformDateValue,
        createdAt
      ),
  };
}

export function platformInvitationIsExpired(
  invitation:
    PlatformOwnerInvitationRecord,
  now: Date = new Date()
): boolean {
  return Boolean(
    invitation.expiresAt &&
      invitation.expiresAt.getTime() <
        now.getTime()
  );
}

export function platformInvitationIsActive(
  invitation:
    PlatformOwnerInvitationRecord,
  now: Date = new Date()
): boolean {
  if (
    platformInvitationIsExpired(
      invitation,
      now
    )
  ) {
    return false;
  }

  return (
    invitation.status ===
      PLATFORM_OWNER_INVITATION_STATUSES
        .pending ||
    invitation.status ===
      PLATFORM_OWNER_INVITATION_STATUSES
        .sent
  );
}

// ============================================================
// MARK: - Platform Metrics
// ============================================================

export function createPlatformExecutiveMetrics(
  clients:
    readonly PlatformClientViewModel[],
  invitations:
    readonly PlatformOwnerInvitationRecord[] = [],
  now: Date = new Date()
): PlatformExecutiveMetrics {
  const totalBusinesses =
    clients.length;

  const activeBusinesses =
    clients.filter(
      (client) =>
        client.isActive &&
        !client.isArchived &&
        !client.isPendingDeletion
    ).length;

  const activeSubscriptions =
    clients.filter(
      (client) =>
        client.canAccessApp &&
        client.trialDaysRemaining <=
          0 &&
        !client.isTrialExpired
    ).length;

  const activeTrials =
    clients.filter(
      (client) =>
        client
          .subscriptionStatus ===
          PLATFORM_SUBSCRIPTION_STATUSES
            .freeTrial &&
        client.trialDaysRemaining >
          0 &&
        !client.isTrialExpired &&
        !client.isArchived &&
        !client.isPendingDeletion
    ).length;

  const expiredTrials =
    clients.filter(
      (client) =>
        client.isTrialExpired
    ).length;

  const restrictedAccess =
    clients.filter(
      (client) =>
        !client.canAccessApp
    ).length;

  const onboardingComplete =
    clients.filter(
      (client) =>
        client
          .isOnboardingComplete
    ).length;

  const registeredOwners =
    clients.filter(
      (client) =>
        client.isOwnerRegistered
    ).length;

  const businessesNeedingAttention =
    clients.filter(
      (client) =>
        client
          .needsExecutiveAttention
    ).length;

  const payingBusinesses =
    clients.filter(
      (client) =>
        client.monthlyPrice > 0
    ).length;

  const monthlyRevenue =
    clients.reduce(
      (
        total,
        client
      ) =>
        total +
        Math.max(
          client.monthlyPrice,
          0
        ),
      0
    );

  const averageMonthlyRevenue =
    payingBusinesses > 0
      ? monthlyRevenue /
        payingBusinesses
      : 0;

  const accessEnabledCount =
    clients.filter(
      (client) =>
        client.canAccessApp
    ).length;

  const accessPercentage =
    totalBusinesses > 0
      ? accessEnabledCount /
        totalBusinesses
      : 0;

  const pendingOwnerInvitations =
    invitations.filter(
      (invitation) =>
        platformInvitationIsActive(
          invitation,
          now
        )
    ).length;

  return {
    totalBusinesses,
    activeBusinesses,

    activeSubscriptions,
    activeTrials,
    expiredTrials,

    restrictedAccess,

    onboardingComplete,
    registeredOwners,

    businessesNeedingAttention,

    payingBusinesses,

    monthlyRevenue,
    averageMonthlyRevenue,

    accessEnabledCount,
    accessPercentage,

    pendingOwnerInvitations,
  };
}

// ============================================================
// MARK: - Search
// ============================================================

export function platformClientSearchValues(
  client:
    PlatformClientViewModel
): string[] {
  return [
    client.businessID,
    client.documentID,

    client.displayBusinessName,
    client.businessName,

    client.displayOwnerName,
    client.ownerFullName,
    client.ownerEmail,
    client.ownerPhone,

    client.businessEmail,
    client.supportEmail,
    client.businessPhone,

    client.industry,
    client.businessCategory,
    client.businessModeRawValue,

    client.planName,
    client.displaySubscriptionStatus,

    client.clientStatus,
    client.onboardingStatus,

    client.city,
    client.state,
    client.zipCode,
    client.country,

    client.accountManagerName,
    client.riskLevel,

    ...client.internalTags,
    ...client.enabledModules,
    ...client.disabledModules,
  ]
    .map(
      cleanPlatformText
    )
    .filter(Boolean);
}

export function platformClientMatchesSearch(
  client:
    PlatformClientViewModel,
  searchText: string
): boolean {
  const normalizedSearchText =
    cleanPlatformText(
      searchText
    ).toLowerCase();

  if (!normalizedSearchText) {
    return true;
  }

  return platformClientSearchValues(
    client
  ).some(
    (value) =>
      value
        .toLowerCase()
        .includes(
          normalizedSearchText
        )
  );
}

export function findExactPlatformClientMatch(
  clients:
    readonly PlatformClientViewModel[],
  searchText: string
): PlatformClientViewModel | null {
  const normalizedSearchText =
    cleanPlatformText(
      searchText
    ).toLowerCase();

  if (!normalizedSearchText) {
    return null;
  }

  return (
    clients.find(
      (client) =>
        [
          client.businessID,
          client.documentID,
          client.displayBusinessName,
          client.ownerEmail,
          client.businessEmail,
          client.supportEmail,
        ]
          .map(
            (value) =>
              value.toLowerCase()
          )
          .includes(
            normalizedSearchText
          )
    ) ??
    null
  );
}

// ============================================================
// MARK: - Filtering
// ============================================================

export function platformClientMatchesFilter(
  client:
    PlatformClientViewModel,
  filter:
    PlatformClientFilter
): boolean {
  switch (filter) {
    case "all":
      return true;

    case "active":
      return (
        client.isActive &&
        !client.isArchived &&
        !client.isPendingDeletion
      );

    case "inactive":
      return !client.isActive;

    case "onboarding":
      return !client.isOnboardingComplete;

    case "trial":
      return (
        client.subscriptionStatus ===
          PLATFORM_SUBSCRIPTION_STATUSES
            .freeTrial &&
        !client.isTrialExpired
      );

    case "trial-expired":
      return client.isTrialExpired;

    case "past-due":
      return (
        client.subscriptionStatus ===
        PLATFORM_SUBSCRIPTION_STATUSES
          .pastDue
      );

    case "restricted":
      return !client.canAccessApp;

    case "archived":
      return client.isArchived;

    case "pending-deletion":
      return client.isPendingDeletion;

    case "owner-registration-pending":
      return !client.isOwnerRegistered;

    case "needs-attention":
      return client.needsExecutiveAttention;

    default:
      return true;
  }
}

// ============================================================
// MARK: - Sorting
// ============================================================

function platformSortText(
  firstValue: string,
  secondValue: string
): number {
  return firstValue.localeCompare(
    secondValue,
    undefined,
    {
      sensitivity:
        "base",
      numeric:
        true,
    }
  );
}

function platformSortDate(
  firstValue: Date,
  secondValue: Date
): number {
  return (
    firstValue.getTime() -
    secondValue.getTime()
  );
}

export function comparePlatformClients(
  firstClient:
    PlatformClientViewModel,
  secondClient:
    PlatformClientViewModel,
  sortField:
    PlatformClientSortField,
  sortDirection:
    PlatformSortDirection
): number {
  let comparison = 0;

  switch (sortField) {
    case "businessName":
      comparison =
        platformSortText(
          firstClient
            .displayBusinessName,
          secondClient
            .displayBusinessName
        );
      break;

    case "ownerFullName":
      comparison =
        platformSortText(
          firstClient
            .displayOwnerName,
          secondClient
            .displayOwnerName
        );
      break;

    case "createdAt":
      comparison =
        platformSortDate(
          firstClient.createdAt,
          secondClient.createdAt
        );
      break;

    case "updatedAt":
      comparison =
        platformSortDate(
          firstClient.updatedAt,
          secondClient.updatedAt
        );
      break;

    case "monthlyPrice":
      comparison =
        firstClient.monthlyPrice -
        secondClient.monthlyPrice;
      break;

    case "trialEndDate":
      comparison =
        platformSortDate(
          firstClient.trialEndDate,
          secondClient.trialEndDate
        );
      break;

    case "clientStatus":
      comparison =
        platformSortText(
          firstClient.clientStatus,
          secondClient.clientStatus
        );
      break;

    case "subscriptionStatus":
      comparison =
        platformSortText(
          firstClient
            .displaySubscriptionStatus,
          secondClient
            .displaySubscriptionStatus
        );
      break;

    default:
      comparison = 0;
  }

  return sortDirection ===
    "descending"
    ? comparison * -1
    : comparison;
}

// ============================================================
// MARK: - Query Pipeline
// ============================================================

export function queryPlatformClients(
  clients:
    readonly PlatformClientViewModel[],
  options:
    PlatformClientQueryOptions
): PlatformClientViewModel[] {
  const filteredClients =
    clients.filter(
      (client) =>
        platformClientMatchesSearch(
          client,
          options.searchText
        ) &&
        platformClientMatchesFilter(
          client,
          options.filter
        )
    );

  const sortedClients =
    [...filteredClients].sort(
      (
        firstClient,
        secondClient
      ) =>
        comparePlatformClients(
          firstClient,
          secondClient,
          options.sortField,
          options.sortDirection
        )
    );

  if (
    typeof options.limit ===
      "number" &&
    options.limit >= 0
  ) {
    return sortedClients.slice(
      0,
      options.limit
    );
  }

  return sortedClients;
}

// ============================================================
// MARK: - Dashboard Prioritization
// ============================================================

export function platformClientDashboardPriority(
  client:
    PlatformClientViewModel
): number {
  switch (
    client
      .executiveAttentionReason
  ) {
    case "pending-deletion":
      return 0;

    case "trial-expired":
      return 1;

    case "owner-account-locked":
      return 2;

    case "inactive":
      return 3;

    case "archived":
      return 4;

    case "subscription-past-due":
      return 5;

    case "owner-access-disabled":
      return 6;

    case "owner-registration-pending":
      return 7;

    case "onboarding-incomplete":
      return 8;

    case "application-access-restricted":
      return 9;

    case null:
      return 10;

    default:
      return 10;
  }
}

export function platformDashboardClients(
  clients:
    readonly PlatformClientViewModel[],
  limit = 8
): PlatformClientViewModel[] {
  return [...clients]
    .sort(
      (
        firstClient,
        secondClient
      ) => {
        const priorityDifference =
          platformClientDashboardPriority(
            firstClient
          ) -
          platformClientDashboardPriority(
            secondClient
          );

        if (
          priorityDifference !== 0
        ) {
          return priorityDifference;
        }

        return firstClient
          .displayBusinessName
          .localeCompare(
            secondClient
              .displayBusinessName,
            undefined,
            {
              sensitivity:
                "base",
            }
          );
      }
    )
    .slice(
      0,
      Math.max(
        limit,
        0
      )
    );
}

// ============================================================
// MARK: - Platform Client Collections
// ============================================================

export function platformClientsNeedingAttention(
  clients:
    readonly PlatformClientViewModel[]
): PlatformClientViewModel[] {
  return clients
    .filter(
      (client) =>
        client.needsExecutiveAttention
    )
    .sort(
      (
        firstClient,
        secondClient
      ) =>
        platformClientDashboardPriority(
          firstClient
        ) -
        platformClientDashboardPriority(
          secondClient
        )
    );
}

export function platformPendingOwnerRegistrationClients(
  clients:
    readonly PlatformClientViewModel[]
): PlatformClientViewModel[] {
  return clients.filter(
    (client) =>
      !client.isOwnerRegistered &&
      !client.isArchived &&
      !client.isPendingDeletion
  );
}

export function platformSubscriptionClients(
  clients:
    readonly PlatformClientViewModel[]
): PlatformClientViewModel[] {
  return clients.filter(
    (client) =>
      Boolean(
        cleanPlatformText(
          client.planName
        )
      ) ||
      client.trialDaysRemaining >
        0 ||
      client.isTrialExpired
  );
}

export function platformBillingClients(
  clients:
    readonly PlatformClientViewModel[]
): PlatformClientViewModel[] {
  return clients.filter(
    (client) =>
      client.monthlyPrice > 0 ||
      Boolean(
        cleanPlatformText(
          client.planName
        )
      )
  );
}

// ============================================================
// MARK: - Firestore Payload
// ============================================================

export function createPlatformClientFirestorePayload(
  client:
    PlatformClientRecord
): PlatformClientFirestorePayload {
  return {
    businessID:
      cleanPlatformText(
        client.businessID
      ),

    ownerUID:
      cleanPlatformText(
        client.ownerUID
      ),

    ownerFirebaseUID:
      cleanPlatformText(
        client.ownerFirebaseUID
      ),

    businessName:
      cleanPlatformText(
        client.businessName
      ),

    industry:
      cleanPlatformText(
        client.industry
      ),

    businessCategory:
      cleanPlatformText(
        client.businessCategory
      ),

    businessModeRawValue:
      cleanPlatformText(
        client.businessModeRawValue
      ),

    localeIdentifier:
      cleanPlatformText(
        client.localeIdentifier
      ) ||
      DEFAULT_LOCALE_IDENTIFIER,

    timeZoneIdentifier:
      cleanPlatformText(
        client.timeZoneIdentifier
      ) ||
      DEFAULT_TIME_ZONE_IDENTIFIER,

    ownerFullName:
      cleanPlatformText(
        client.ownerFullName
      ),

    ownerEmail:
      cleanPlatformEmail(
        client.ownerEmail
      ),

    ownerPhone:
      cleanPlatformText(
        client.ownerPhone
      ),

    ownerAccountStatusRawValue:
      client.ownerAccountStatus,

    ownerInvitationStatusRawValue:
      client.ownerInvitationStatus,

    ownerInvitationCode:
      cleanPlatformUppercaseText(
        client.ownerInvitationCode
      ),

    ownerInvitationLink:
      cleanPlatformText(
        client.ownerInvitationLink
      ),

    ...(client.ownerInvitationSentAt
      ? {
          ownerInvitationSentAt:
            client.ownerInvitationSentAt,
        }
      : {}),

    ...(client.ownerInvitationAcceptedAt
      ? {
          ownerInvitationAcceptedAt:
            client
              .ownerInvitationAcceptedAt,
        }
      : {}),

    businessPhone:
      cleanPlatformText(
        client.businessPhone
      ),

    businessEmail:
      cleanPlatformEmail(
        client.businessEmail
      ),

    supportEmail:
      cleanPlatformEmail(
        client.supportEmail
      ),

    website:
      cleanPlatformText(
        client.website
      ),

    taxID:
      cleanPlatformText(
        client.taxID
      ),

    addressLine1:
      cleanPlatformText(
        client.addressLine1
      ),

    addressLine2:
      cleanPlatformText(
        client.addressLine2
      ),

    city:
      cleanPlatformText(
        client.city
      ),

    state:
      cleanPlatformText(
        client.state
      ),

    zipCode:
      cleanPlatformText(
        client.zipCode
      ),

    country:
      cleanPlatformText(
        client.country
      ) ||
      DEFAULT_COUNTRY,

    secondaryContactName:
      cleanPlatformText(
        client.secondaryContactName
      ),

    secondaryContactEmail:
      cleanPlatformEmail(
        client.secondaryContactEmail
      ),

    secondaryContactPhone:
      cleanPlatformText(
        client.secondaryContactPhone
      ),

    billingContactName:
      cleanPlatformText(
        client.billingContactName
      ),

    billingContactEmail:
      cleanPlatformEmail(
        client.billingContactEmail
      ),

    billingContactPhone:
      cleanPlatformText(
        client.billingContactPhone
      ),

    clientStatusRawValue:
      client.clientStatus,

    onboardingStatusRawValue:
      client.onboardingStatus,

    ...(client.archivedAt
      ? {
          archivedAt:
            client.archivedAt,
        }
      : {}),

    ...(client.pendingDeletionAt
      ? {
          pendingDeletionAt:
            client.pendingDeletionAt,
        }
      : {}),

    deletionRequestedByUID:
      cleanPlatformText(
        client.deletionRequestedByUID
      ),

    planName:
      cleanPlatformText(
        client.planName
      ),

    subscriptionStatus:
      client.subscriptionStatus,

    monthlyPrice:
      Math.max(
        client.monthlyPrice,
        0
      ),

    isActive:
      client.isActive,

    trialLengthDays:
      Math.max(
        client.trialLengthDays,
        1
      ),

    trialStartDate:
      client.trialStartDate,

    trialEndDate:
      client.trialEndDate,

    ...(client.subscriptionStartDate
      ? {
          subscriptionStartDate:
            client.subscriptionStartDate,
        }
      : {}),

    ...(client.subscriptionEndDate
      ? {
          subscriptionEndDate:
            client.subscriptionEndDate,
        }
      : {}),

    ...(client.nextBillingDate
      ? {
          nextBillingDate:
            client.nextBillingDate,
        }
      : {}),

    ...(client.lastPaymentDate
      ? {
          lastPaymentDate:
            client.lastPaymentDate,
        }
      : {}),

    ...(client.gracePeriodEndDate
      ? {
          gracePeriodEndDate:
            client.gracePeriodEndDate,
        }
      : {}),

    suspensionReason:
      cleanPlatformText(
        client.suspensionReason
      ),

    cancellationReason:
      cleanPlatformText(
        client.cancellationReason
      ),

    billingProviderRawValue:
      client.billingProvider,

    appleOriginalTransactionID:
      cleanPlatformText(
        client.appleOriginalTransactionID
      ),

    appleProductID:
      cleanPlatformText(
        client.appleProductID
      ),

    stripeCustomerID:
      cleanPlatformText(
        client.stripeCustomerID
      ),

    stripeSubscriptionID:
      cleanPlatformText(
        client.stripeSubscriptionID
      ),

    employeeLimit:
      Math.max(
        client.employeeLimit,
        0
      ),

    customerLimit:
      Math.max(
        client.customerLimit,
        0
      ),

    productLimit:
      Math.max(
        client.productLimit,
        0
      ),

    storageLimitGB:
      Math.max(
        client.storageLimitGB,
        0
      ),

    canCreateInvitations:
      client.canCreateInvitations,

    canUseAutomaticLogo:
      client.canUseAutomaticLogo,

    enabledModulesRawValue:
      encodePlatformStringArray(
        client.enabledModules
      ),

    disabledModulesRawValue:
      encodePlatformStringArray(
        client.disabledModules
      ),

    enabledModules:
      normalizePlatformStringArray(
        client.enabledModules
      ),

    disabledModules:
      normalizePlatformStringArray(
        client.disabledModules
      ),

    businessInviteCode:
      cleanPlatformUppercaseText(
        client.businessInviteCode
      ),

    accountManagerName:
      cleanPlatformText(
        client.accountManagerName
      ),

    internalTags:
      encodePlatformTags(
        client.internalTags
      ),

    riskLevel:
      cleanPlatformText(
        client.riskLevel
      ) ||
      DEFAULT_RISK_LEVEL,

    notes:
      cleanPlatformText(
        client.notes
      ),

    ...(client.lastLoginDate
      ? {
          lastLoginDate:
            client.lastLoginDate,
        }
      : {}),

    ...(client.lastSyncDate
      ? {
          lastSyncDate:
            client.lastSyncDate,
        }
      : {}),

    ...(client
      .lastOwnerPasswordResetRequestedAt
      ? {
          lastOwnerPasswordResetRequestedAt:
            client
              .lastOwnerPasswordResetRequestedAt,
        }
      : {}),

    ...(client
      .lastOwnerAccessDisabledAt
      ? {
          lastOwnerAccessDisabledAt:
            client
              .lastOwnerAccessDisabledAt,
        }
      : {}),

    ...(client
      .lastOwnerAccessEnabledAt
      ? {
          lastOwnerAccessEnabledAt:
            client
              .lastOwnerAccessEnabledAt,
        }
      : {}),

    createdByPlatformUID:
      cleanPlatformText(
        client.createdByPlatformUID
      ),

    updatedByPlatformUID:
      cleanPlatformText(
        client.updatedByPlatformUID
      ),

    createdAt:
      client.createdAt,

    updatedAt:
      client.updatedAt,
  };
}