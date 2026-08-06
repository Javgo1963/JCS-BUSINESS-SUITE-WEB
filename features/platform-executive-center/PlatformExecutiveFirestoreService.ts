/*
 * JCS Business Suite
 * PlatformExecutiveFirestoreService.ts
 *
 * Firestore service for the Platform Executive Center.
 *
 * Responsibilities:
 *
 * - Read PlatformClient records.
 * - Subscribe to platform clients in real time.
 * - Read Platform Business Owner invitations.
 * - Execute protected administrative mutations.
 * - Preserve Apple/Web Firestore compatibility.
 * - Record platform audit events.
 *
 * IMPORTANT:
 *
 * Client-side access checks improve application behavior, but
 * Firestore Security Rules must remain the final authority.
 */

import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type DocumentReference,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import {
  db,
} from "@/core/firebase/firebase";

import {
  addPlatformDays,
  addPlatformMonths,
  cleanPlatformEmail,
  cleanPlatformText,
  createPlatformClientFirestorePayload,
  normalizePlatformClientRecord,
  normalizePlatformClientViewModel,
  normalizePlatformOwnerInvitationRecord,
  normalizePlatformStringArray,
  normalizePlatformTags,
  platformNonNegativeInteger,
  platformNonNegativeNumber,
  platformPositiveInteger,
} from "./PlatformClientDomain";

import {
  PLATFORM_BILLING_PROVIDERS,
  PLATFORM_CLIENT_STATUSES,
  PLATFORM_EXECUTIVE_COLLECTIONS,
  PLATFORM_ONBOARDING_STATUSES,
  PLATFORM_OWNER_ACCOUNT_STATUSES,
  PLATFORM_OWNER_INVITATION_STATUSES,
  PLATFORM_SUBSCRIPTION_STATUSES,

  type CreatePlatformClientInput,
  type PlatformAuditEventType,
  type PlatformBillingProvider,
  type PlatformClientAddressInput,
  type PlatformClientBillingContactInput,
  type PlatformClientBillingProviderInput,
  type PlatformClientBusinessProfileInput,
  type PlatformClientFeatureAccessInput,
  type PlatformClientFirestoreData,
  type PlatformClientFreeTrialInput,
  type PlatformClientGracePeriodInput,
  type PlatformClientInternalInfoInput,
  type PlatformClientMonthlyPlanInput,
  type PlatformClientOwnerInput,
  type PlatformClientPlanLimitsInput,
  type PlatformClientReasonInput,
  type PlatformClientRecord,
  type PlatformClientSecondaryContactInput,
  type PlatformClientViewModel,
  type PlatformOnboardingStatus,
  type PlatformOwnerInvitationRecord,
} from "./PlatformExecutiveTypes";

// ============================================================
// MARK: - Local Contracts
// ============================================================

export interface PlatformExecutiveActor {
  firebaseUID: string;

  isPlatformAdministrator: boolean;

  displayName?: string;
  email?: string;
}

export interface PlatformExecutiveMutationResult {
  businessID: string;

  updatedAt: Date;

  message: string;
}

export interface PlatformClientSubscriptionCallbacks {
  onClients:
    (
      clients:
        PlatformClientViewModel[]
    ) => void;

  onError?:
    (
      error: Error
    ) => void;
}

export interface PlatformInvitationSubscriptionCallbacks {
  onInvitations:
    (
      invitations:
        PlatformOwnerInvitationRecord[]
    ) => void;

  onError?:
    (
      error: Error
    ) => void;
}

interface PlatformAuditInput {
  type:
    PlatformAuditEventType;

  businessID: string;
  businessName: string;

  actor:
    PlatformExecutiveActor;

  title: string;
  message: string;

  previousValues?:
    Record<string, unknown>;

  updatedValues?:
    Record<string, unknown>;
}

interface PlatformTransactionContext {
  reference:
    DocumentReference<DocumentData>;

  currentRecord:
    PlatformClientRecord;

  now: Date;
}

// ============================================================
// MARK: - Service Error
// ============================================================

export class PlatformExecutiveServiceError
  extends Error {

  readonly code: string;

  constructor(
    code: string,
    message: string
  ) {
    super(message);

    this.name =
      "PlatformExecutiveServiceError";

    this.code =
      code;
  }
}

// ============================================================
// MARK: - Validation
// ============================================================

function requirePlatformAdministrator(
  actor:
    PlatformExecutiveActor
): void {
  const firebaseUID =
    cleanPlatformText(
      actor.firebaseUID
    );

  if (!firebaseUID) {
    throw new PlatformExecutiveServiceError(
      "platform-admin-uid-required",
      "A valid Platform Administrator Firebase UID is required."
    );
  }

  if (
    !actor.isPlatformAdministrator
  ) {
    throw new PlatformExecutiveServiceError(
      "platform-admin-required",
      "This action is available only to Platform Administrators."
    );
  }
}

function requireBusinessID(
  businessID: string
): string {
  const normalizedBusinessID =
    cleanPlatformText(
      businessID
    );

  if (!normalizedBusinessID) {
    throw new PlatformExecutiveServiceError(
      "business-id-required",
      "A valid Business ID is required."
    );
  }

  return normalizedBusinessID;
}

function requireText(
  value: string,
  fieldName: string
): string {
  const normalizedValue =
    cleanPlatformText(
      value
    );

  if (!normalizedValue) {
    throw new PlatformExecutiveServiceError(
      "required-field",
      `${fieldName} is required.`
    );
  }

  return normalizedValue;
}

// ============================================================
// MARK: - Firestore References
// ============================================================

function platformClientsCollection() {
  return collection(
    db,
    PLATFORM_EXECUTIVE_COLLECTIONS
      .platformClients
  );
}

function platformClientReference(
  businessID: string
) {
  return doc(
    db,
    PLATFORM_EXECUTIVE_COLLECTIONS
      .platformClients,
    requireBusinessID(
      businessID
    )
  );
}

function platformOwnerInvitationsCollection() {
  return collection(
    db,
    PLATFORM_EXECUTIVE_COLLECTIONS
      .ownerInvitations
  );
}

function platformAuditEventsCollection() {
  return collection(
    db,
    PLATFORM_EXECUTIVE_COLLECTIONS
      .auditEvents
  );
}

// ============================================================
// MARK: - Snapshot Conversion
// ============================================================

function platformClientFromSnapshot(
  snapshot:
    QueryDocumentSnapshot<DocumentData>,
  now: Date
): PlatformClientViewModel {
  return normalizePlatformClientViewModel(
    snapshot.id,
    snapshot.data() as
      PlatformClientFirestoreData,
    now
  );
}

function sortPlatformClients(
  clients:
    PlatformClientViewModel[]
): PlatformClientViewModel[] {
  return [...clients].sort(
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
            numeric:
              true,
          }
        )
  );
}

function sortPlatformInvitations(
  invitations:
    PlatformOwnerInvitationRecord[]
): PlatformOwnerInvitationRecord[] {
  return [...invitations].sort(
    (
      firstInvitation,
      secondInvitation
    ) =>
      secondInvitation
        .createdAt
        .getTime() -
      firstInvitation
        .createdAt
        .getTime()
  );
}

// ============================================================
// MARK: - Read Platform Clients
// ============================================================

export async function fetchPlatformClients(
  actor:
    PlatformExecutiveActor
): Promise<
  PlatformClientViewModel[]
> {
  requirePlatformAdministrator(
    actor
  );

  const snapshot =
    await getDocs(
      platformClientsCollection()
    );

  const now =
    new Date();

  const clients =
    snapshot.docs.map(
      (documentSnapshot) =>
        platformClientFromSnapshot(
          documentSnapshot,
          now
        )
    );

  return sortPlatformClients(
    clients
  );
}

export async function fetchPlatformClient(
  actor:
    PlatformExecutiveActor,
  businessID: string
): Promise<
  PlatformClientViewModel | null
> {
  requirePlatformAdministrator(
    actor
  );

  const normalizedBusinessID =
    requireBusinessID(
      businessID
    );

  const snapshot =
    await getDoc(
      platformClientReference(
        normalizedBusinessID
      )
    );

  if (!snapshot.exists()) {
    return null;
  }

  return normalizePlatformClientViewModel(
    snapshot.id,
    snapshot.data() as
      PlatformClientFirestoreData
  );
}

// ============================================================
// MARK: - Real-Time Platform Clients
// ============================================================

export function subscribeToPlatformClients(
  actor:
    PlatformExecutiveActor,
  callbacks:
    PlatformClientSubscriptionCallbacks
): Unsubscribe {
  requirePlatformAdministrator(
    actor
  );

  return onSnapshot(
    platformClientsCollection(),

    (snapshot) => {
      const now =
        new Date();

      const clients =
        snapshot.docs.map(
          (documentSnapshot) =>
            platformClientFromSnapshot(
              documentSnapshot,
              now
            )
        );

      callbacks.onClients(
        sortPlatformClients(
          clients
        )
      );
    },

    (error) => {
      callbacks.onError?.(
        error instanceof Error
          ? error
          : new Error(
              "Unable to load Platform Clients."
            )
      );
    }
  );
}

// ============================================================
// MARK: - Owner Invitations
// ============================================================

export async function fetchPlatformOwnerInvitations(
  actor:
    PlatformExecutiveActor
): Promise<
  PlatformOwnerInvitationRecord[]
> {
  requirePlatformAdministrator(
    actor
  );

  const snapshot =
    await getDocs(
      platformOwnerInvitationsCollection()
    );

  const now =
    new Date();

  const invitations =
    snapshot.docs.map(
      (documentSnapshot) =>
        normalizePlatformOwnerInvitationRecord(
          documentSnapshot.id,
          documentSnapshot.data(),
          now
        )
    );

  return sortPlatformInvitations(
    invitations
  );
}

export function subscribeToPlatformOwnerInvitations(
  actor:
    PlatformExecutiveActor,
  callbacks:
    PlatformInvitationSubscriptionCallbacks
): Unsubscribe {
  requirePlatformAdministrator(
    actor
  );

  return onSnapshot(
    platformOwnerInvitationsCollection(),

    (snapshot) => {
      const now =
        new Date();

      const invitations =
        snapshot.docs.map(
          (documentSnapshot) =>
            normalizePlatformOwnerInvitationRecord(
              documentSnapshot.id,
              documentSnapshot.data(),
              now
            )
        );

      callbacks.onInvitations(
        sortPlatformInvitations(
          invitations
        )
      );
    },

    (error) => {
      callbacks.onError?.(
        error instanceof Error
          ? error
          : new Error(
              "Unable to load Platform Owner invitations."
            )
      );
    }
  );
}

// ============================================================
// MARK: - Create Platform Client
// ============================================================

export async function createPlatformClient(
  actor:
    PlatformExecutiveActor,
  input:
    CreatePlatformClientInput
): Promise<
  PlatformClientViewModel
> {
  requirePlatformAdministrator(
    actor
  );

  const businessID =
    requireBusinessID(
      input.businessID
    );

  const ownerUID =
    requireText(
      input.ownerUID,
      "Owner UID"
    );

  const businessName =
    requireText(
      input.businessName,
      "Business name"
    );

  const ownerFullName =
    requireText(
      input.ownerFullName,
      "Owner name"
    );

  const ownerEmail =
    cleanPlatformEmail(
      input.ownerEmail
    );

  if (!ownerEmail) {
    throw new PlatformExecutiveServiceError(
      "owner-email-required",
      "A valid Business Owner email is required."
    );
  }

  const actorUID =
    cleanPlatformText(
      actor.firebaseUID
    );

  const now =
    new Date();

  const trialLengthDays =
    platformPositiveInteger(
      input.trialLengthDays,
      7
    );

  const trialEndDate =
    addPlatformDays(
      now,
      trialLengthDays
    );

  const record:
    PlatformClientRecord = {
      documentID:
        businessID,

      businessID,

      ownerUID,

      ownerFirebaseUID:
        cleanPlatformText(
          input.ownerFirebaseUID
        ),

      businessName,

      industry:
        cleanPlatformText(
          input.industry
        ),

      businessCategory:
        cleanPlatformText(
          input.businessCategory
        ),

      businessModeRawValue:
        cleanPlatformText(
          input.businessModeRawValue
        ) ||
        "Retail",

      localeIdentifier:
        cleanPlatformText(
          input.localeIdentifier
        ) ||
        "en-US",

      timeZoneIdentifier:
        cleanPlatformText(
          input.timeZoneIdentifier
        ) ||
        "America/New_York",

      ownerFullName,

      ownerEmail,

      ownerPhone:
        cleanPlatformText(
          input.ownerPhone
        ),

      ownerAccountStatus:
        cleanPlatformText(
          input.ownerFirebaseUID
        )
          ? PLATFORM_OWNER_ACCOUNT_STATUSES
              .active
          : PLATFORM_OWNER_ACCOUNT_STATUSES
              .pendingRegistration,

      ownerInvitationStatus:
        cleanPlatformText(
          input.ownerFirebaseUID
        )
          ? PLATFORM_OWNER_INVITATION_STATUSES
              .accepted
          : PLATFORM_OWNER_INVITATION_STATUSES
              .notInvited,

      ownerInvitationCode:
        "",

      ownerInvitationLink:
        "",

      ownerInvitationSentAt:
        null,

      ownerInvitationAcceptedAt:
        cleanPlatformText(
          input.ownerFirebaseUID
        )
          ? now
          : null,

      businessPhone:
        cleanPlatformText(
          input.businessPhone
        ),

      businessEmail:
        cleanPlatformEmail(
          input.businessEmail
        ),

      supportEmail:
        cleanPlatformEmail(
          input.supportEmail
        ),

      website:
        cleanPlatformText(
          input.website
        ),

      taxID:
        cleanPlatformText(
          input.taxID
        ),

      addressLine1:
        cleanPlatformText(
          input.addressLine1
        ),

      addressLine2:
        cleanPlatformText(
          input.addressLine2
        ),

      city:
        cleanPlatformText(
          input.city
        ),

      state:
        cleanPlatformText(
          input.state
        ),

      zipCode:
        cleanPlatformText(
          input.zipCode
        ),

      country:
        cleanPlatformText(
          input.country
        ) ||
        "USA",

      secondaryContactName:
        "",

      secondaryContactEmail:
        "",

      secondaryContactPhone:
        "",

      billingContactName:
        "",

      billingContactEmail:
        "",

      billingContactPhone:
        "",

      clientStatus:
        PLATFORM_CLIENT_STATUSES
          .onboarding,

      onboardingStatus:
        cleanPlatformText(
          input.ownerFirebaseUID
        )
          ? PLATFORM_ONBOARDING_STATUSES
              .ownerRegistered
          : PLATFORM_ONBOARDING_STATUSES
              .notStarted,

      archivedAt:
        null,

      pendingDeletionAt:
        null,

      deletionRequestedByUID:
        "",

      planName:
        cleanPlatformText(
          input.planName
        ) ||
        "Starter",

      subscriptionStatus:
        PLATFORM_SUBSCRIPTION_STATUSES
          .freeTrial,

      monthlyPrice:
        platformNonNegativeNumber(
          input.monthlyPrice
        ),

      isActive:
        true,

      trialLengthDays,

      trialStartDate:
        now,

      trialEndDate,

      subscriptionStartDate:
        null,

      subscriptionEndDate:
        null,

      nextBillingDate:
        null,

      lastPaymentDate:
        null,

      gracePeriodEndDate:
        null,

      suspensionReason:
        "",

      cancellationReason:
        "",

      billingProvider:
        input.billingProvider ??
        PLATFORM_BILLING_PROVIDERS.none,

      appleOriginalTransactionID:
        "",

      appleProductID:
        "",

      stripeCustomerID:
        "",

      stripeSubscriptionID:
        "",

      employeeLimit:
        platformNonNegativeInteger(
          input.employeeLimit,
          3
        ),

      customerLimit:
        platformNonNegativeInteger(
          input.customerLimit,
          100
        ),

      productLimit:
        platformNonNegativeInteger(
          input.productLimit,
          100
        ),

      storageLimitGB:
        platformNonNegativeNumber(
          input.storageLimitGB,
          1
        ),

      canCreateInvitations:
        true,

      canUseAutomaticLogo:
        true,

      enabledModules:
        normalizePlatformStringArray(
          input.enabledModules
        ),

      disabledModules:
        normalizePlatformStringArray(
          input.disabledModules
        ),

      businessInviteCode:
        cleanPlatformText(
          input.businessInviteCode
        ).toUpperCase(),

      accountManagerName:
        "",

      internalTags:
        [],

      riskLevel:
        "Normal",

      notes:
        "",

      lastLoginDate:
        null,

      lastSyncDate:
        null,

      lastOwnerPasswordResetRequestedAt:
        null,

      lastOwnerAccessDisabledAt:
        null,

      lastOwnerAccessEnabledAt:
        null,

      createdByPlatformUID:
        actorUID,

      updatedByPlatformUID:
        actorUID,

      createdAt:
        now,

      updatedAt:
        now,
    };

  const payload =
    createPlatformClientFirestorePayload(
      record
    );

  const reference =
    platformClientReference(
      businessID
    );

  await runTransaction(
    db,
    async (transaction) => {
      const existingSnapshot =
        await transaction.get(
          reference
        );

      if (
        existingSnapshot.exists()
      ) {
        throw new PlatformExecutiveServiceError(
          "platform-client-exists",
          `A Platform Client already exists for Business ID ${businessID}.`
        );
      }

      transaction.set(
        reference,
        payload
      );

      const auditReference =
        doc(
          platformAuditEventsCollection()
        );

      transaction.set(
        auditReference,
        createAuditPayload({
          type:
            "client-created",

          businessID,

          businessName,

          actor,

          title:
            "Platform Client Created",

          message:
            `${businessName} was registered in the Platform Executive Center.`,

          updatedValues: {
            businessID,
            ownerUID,
            planName:
              record.planName,
            subscriptionStatus:
              record.subscriptionStatus,
          },
        })
      );
    }
  );

  return normalizePlatformClientViewModel(
    businessID,
    payload as unknown as
      PlatformClientFirestoreData,
    now
  );
}

// ============================================================
// MARK: - Transaction Helpers
// ============================================================

async function runPlatformClientMutation(
  actor:
    PlatformExecutiveActor,
  businessID: string,

  mutation:
    (
      context:
        PlatformTransactionContext
    ) => {
      updates:
        Record<string, unknown>;

      audit:
        Omit<
          PlatformAuditInput,
          | "actor"
          | "businessID"
          | "businessName"
        >;

      message: string;
    }
): Promise<
  PlatformExecutiveMutationResult
> {
  requirePlatformAdministrator(
    actor
  );

  const normalizedBusinessID =
    requireBusinessID(
      businessID
    );

  const reference =
    platformClientReference(
      normalizedBusinessID
    );

  return runTransaction(
    db,
    async (transaction) => {
      const snapshot =
        await transaction.get(
          reference
        );

      if (!snapshot.exists()) {
        throw new PlatformExecutiveServiceError(
          "platform-client-not-found",
          `No Platform Client exists for Business ID ${normalizedBusinessID}.`
        );
      }

      const now =
        new Date();

      const currentRecord =
        normalizePlatformClientRecord(
          snapshot.id,
          snapshot.data() as
            PlatformClientFirestoreData,
          now
        );

      const result =
        mutation({
          reference,
          currentRecord,
          now,
        });

      const updates = {
        ...result.updates,

        updatedByPlatformUID:
          cleanPlatformText(
            actor.firebaseUID
          ),

        updatedAt:
          now,

        lastSyncDate:
          now,
      };

      transaction.update(
        reference,
        updates
      );

      const auditReference =
        doc(
          platformAuditEventsCollection()
        );

      transaction.set(
        auditReference,
        createAuditPayload({
          ...result.audit,

          actor,

          businessID:
            normalizedBusinessID,

          businessName:
            currentRecord.businessName ||
            "Unnamed Business",
        })
      );

      return {
        businessID:
          normalizedBusinessID,

        updatedAt:
          now,

        message:
          result.message,
      };
    }
  );
}

// ============================================================
// MARK: - Audit
// ============================================================

function createAuditPayload(
  input:
    PlatformAuditInput
): Record<string, unknown> {
  return {
    type:
      input.type,

    businessID:
      input.businessID,

    businessName:
      input.businessName,

    platformUID:
      cleanPlatformText(
        input.actor.firebaseUID
      ),

    platformAdministratorName:
      cleanPlatformText(
        input.actor.displayName
      ),

    platformAdministratorEmail:
      cleanPlatformEmail(
        input.actor.email
      ),

    title:
      input.title,

    message:
      input.message,

    previousValues:
      input.previousValues ??
      {},

    updatedValues:
      input.updatedValues ??
      {},

    createdAt:
      serverTimestamp(),
  };
}

// ============================================================
// MARK: - Activation
// ============================================================

export async function setPlatformClientActivation(
  actor:
    PlatformExecutiveActor,
  businessID: string,
  isActive: boolean
): Promise<
  PlatformExecutiveMutationResult
> {
  return runPlatformClientMutation(
    actor,
    businessID,

    ({ currentRecord }) => ({
      updates: {
        isActive,
      },

      audit: {
        type:
          isActive
            ? "business-activated"
            : "business-deactivated",

        title:
          isActive
            ? "Business Activated"
            : "Business Deactivated",

        message:
          `${currentRecord.businessName} was ${
            isActive
              ? "activated"
              : "deactivated"
          } by Platform Administration.`,

        previousValues: {
          isActive:
            currentRecord.isActive,
        },

        updatedValues: {
          isActive,
        },
      },

      message:
        `${currentRecord.businessName} was ${
          isActive
            ? "activated"
            : "deactivated"
        }.`,
    })
  );
}

// ============================================================
// MARK: - Trial Lifecycle
// ============================================================

export async function startPlatformClientFreeTrial(
  actor:
    PlatformExecutiveActor,
  businessID: string,
  input:
    PlatformClientFreeTrialInput
): Promise<
  PlatformExecutiveMutationResult
> {
  const days =
    platformPositiveInteger(
      input.days,
      7
    );

  return runPlatformClientMutation(
    actor,
    businessID,

    ({
      currentRecord,
      now,
    }) => {
      const trialEndDate =
        addPlatformDays(
          now,
          days
        );

      return {
        updates: {
          trialLengthDays:
            days,

          trialStartDate:
            now,

          trialEndDate,

          subscriptionStatus:
            PLATFORM_SUBSCRIPTION_STATUSES
              .freeTrial,

          clientStatusRawValue:
            PLATFORM_CLIENT_STATUSES
              .active,

          isActive:
            true,

          suspensionReason:
            "",

          cancellationReason:
            "",

          subscriptionEndDate:
            deleteField(),

          gracePeriodEndDate:
            deleteField(),
        },

        audit: {
          type:
            "trial-started",

          title:
            "Free Trial Started",

          message:
            `${currentRecord.businessName} received a ${days}-day free trial.`,

          previousValues: {
            subscriptionStatus:
              currentRecord.subscriptionStatus,

            trialEndDate:
              currentRecord.trialEndDate,
          },

          updatedValues: {
            subscriptionStatus:
              PLATFORM_SUBSCRIPTION_STATUSES
                .freeTrial,

            trialLengthDays:
              days,

            trialEndDate,
          },
        },

        message:
          `A ${days}-day free trial was started for ${currentRecord.businessName}.`,
      };
    }
  );
}

// ============================================================
// MARK: - Monthly Subscription
// ============================================================

export async function activatePlatformClientMonthlyPlan(
  actor:
    PlatformExecutiveActor,
  businessID: string,
  input:
    PlatformClientMonthlyPlanInput
): Promise<
  PlatformExecutiveMutationResult
> {
  const planName =
    requireText(
      input.planName,
      "Plan name"
    );

  const monthlyPrice =
    platformNonNegativeNumber(
      input.monthlyPrice
    );

  const billingProvider =
    input.billingProvider;

  return runPlatformClientMutation(
    actor,
    businessID,

    ({
      currentRecord,
      now,
    }) => {
      const nextBillingDate =
        addPlatformMonths(
          now,
          1
        );

      return {
        updates: {
          planName,

          monthlyPrice,

          billingProviderRawValue:
            billingProvider,

          subscriptionStatus:
            PLATFORM_SUBSCRIPTION_STATUSES
              .active,

          clientStatusRawValue:
            PLATFORM_CLIENT_STATUSES
              .active,

          isActive:
            true,

          subscriptionStartDate:
            now,

          subscriptionEndDate:
            deleteField(),

          nextBillingDate,

          gracePeriodEndDate:
            deleteField(),

          suspensionReason:
            "",

          cancellationReason:
            "",
        },

        audit: {
          type:
            "subscription-activated",

          title:
            "Subscription Activated",

          message:
            `${planName} was activated for ${currentRecord.businessName}.`,

          previousValues: {
            planName:
              currentRecord.planName,

            monthlyPrice:
              currentRecord.monthlyPrice,

            subscriptionStatus:
              currentRecord.subscriptionStatus,
          },

          updatedValues: {
            planName,

            monthlyPrice,

            billingProvider,

            subscriptionStatus:
              PLATFORM_SUBSCRIPTION_STATUSES
                .active,

            nextBillingDate,
          },
        },

        message:
          `${planName} was activated for ${currentRecord.businessName}.`,
      };
    }
  );
}

export async function markPlatformClientPastDue(
  actor:
    PlatformExecutiveActor,
  businessID: string
): Promise<
  PlatformExecutiveMutationResult
> {
  return runPlatformClientMutation(
    actor,
    businessID,

    ({ currentRecord }) => ({
      updates: {
        subscriptionStatus:
          PLATFORM_SUBSCRIPTION_STATUSES
            .pastDue,

        isActive:
          true,
      },

      audit: {
        type:
          "subscription-past-due",

        title:
          "Subscription Marked Past Due",

        message:
          `${currentRecord.businessName} was marked past due.`,

        previousValues: {
          subscriptionStatus:
            currentRecord.subscriptionStatus,
        },

        updatedValues: {
          subscriptionStatus:
            PLATFORM_SUBSCRIPTION_STATUSES
              .pastDue,
        },
      },

      message:
        `${currentRecord.businessName} was marked past due.`,
    })
  );
}

export async function startPlatformClientGracePeriod(
  actor:
    PlatformExecutiveActor,
  businessID: string,
  input:
    PlatformClientGracePeriodInput
): Promise<
  PlatformExecutiveMutationResult
> {
  const days =
    platformPositiveInteger(
      input.days,
      3
    );

  return runPlatformClientMutation(
    actor,
    businessID,

    ({
      currentRecord,
      now,
    }) => {
      const gracePeriodEndDate =
        addPlatformDays(
          now,
          days
        );

      return {
        updates: {
          subscriptionStatus:
            PLATFORM_SUBSCRIPTION_STATUSES
              .gracePeriod,

          gracePeriodEndDate,

          isActive:
            true,
        },

        audit: {
          type:
            "grace-period-started",

          title:
            "Grace Period Started",

          message:
            `${currentRecord.businessName} received a ${days}-day grace period.`,

          previousValues: {
            subscriptionStatus:
              currentRecord.subscriptionStatus,

            gracePeriodEndDate:
              currentRecord.gracePeriodEndDate,
          },

          updatedValues: {
            subscriptionStatus:
              PLATFORM_SUBSCRIPTION_STATUSES
                .gracePeriod,

            gracePeriodEndDate,
          },
        },

        message:
          `A ${days}-day grace period was started for ${currentRecord.businessName}.`,
      };
    }
  );
}

// ============================================================
// MARK: - Suspension and Reactivation
// ============================================================

export async function suspendPlatformClient(
  actor:
    PlatformExecutiveActor,
  businessID: string,
  input:
    PlatformClientReasonInput
): Promise<
  PlatformExecutiveMutationResult
> {
  const reason =
    cleanPlatformText(
      input.reason
    );

  return runPlatformClientMutation(
    actor,
    businessID,

    ({
      currentRecord,
      now,
    }) => ({
      updates: {
        subscriptionStatus:
          PLATFORM_SUBSCRIPTION_STATUSES
            .suspended,

        clientStatusRawValue:
          PLATFORM_CLIENT_STATUSES
            .suspended,

        suspensionReason:
          reason,

        isActive:
          false,

        lastOwnerAccessDisabledAt:
          now,
      },

      audit: {
        type:
          "business-suspended",

        title:
          "Business Suspended",

        message:
          `${currentRecord.businessName} was suspended${
            reason
              ? `: ${reason}`
              : "."
          }`,

        previousValues: {
          clientStatus:
            currentRecord.clientStatus,

          subscriptionStatus:
            currentRecord.subscriptionStatus,

          isActive:
            currentRecord.isActive,
        },

        updatedValues: {
          clientStatus:
            PLATFORM_CLIENT_STATUSES
              .suspended,

          subscriptionStatus:
            PLATFORM_SUBSCRIPTION_STATUSES
              .suspended,

          isActive:
            false,

          suspensionReason:
            reason,
        },
      },

      message:
        `${currentRecord.businessName} was suspended.`,
    })
  );
}

export async function reactivatePlatformClient(
  actor:
    PlatformExecutiveActor,
  businessID: string
): Promise<
  PlatformExecutiveMutationResult
> {
  return runPlatformClientMutation(
    actor,
    businessID,

    ({
      currentRecord,
      now,
    }) => ({
      updates: {
        subscriptionStatus:
          PLATFORM_SUBSCRIPTION_STATUSES
            .active,

        clientStatusRawValue:
          PLATFORM_CLIENT_STATUSES
            .active,

        isActive:
          true,

        suspensionReason:
          "",

        cancellationReason:
          "",

        lastOwnerAccessEnabledAt:
          now,

        archivedAt:
          deleteField(),

        pendingDeletionAt:
          deleteField(),

        deletionRequestedByUID:
          "",
      },

      audit: {
        type:
          "business-reactivated",

        title:
          "Business Reactivated",

        message:
          `${currentRecord.businessName} was reactivated.`,

        previousValues: {
          clientStatus:
            currentRecord.clientStatus,

          subscriptionStatus:
            currentRecord.subscriptionStatus,

          isActive:
            currentRecord.isActive,
        },

        updatedValues: {
          clientStatus:
            PLATFORM_CLIENT_STATUSES
              .active,

          subscriptionStatus:
            PLATFORM_SUBSCRIPTION_STATUSES
              .active,

          isActive:
            true,
        },
      },

      message:
        `${currentRecord.businessName} was reactivated.`,
    })
  );
}

// ============================================================
// MARK: - Subscription Cancellation and Payment
// ============================================================

export async function cancelPlatformClientSubscription(
  actor:
    PlatformExecutiveActor,
  businessID: string,
  input:
    PlatformClientReasonInput
): Promise<
  PlatformExecutiveMutationResult
> {
  const reason =
    cleanPlatformText(
      input.reason
    );

  return runPlatformClientMutation(
    actor,
    businessID,

    ({
      currentRecord,
      now,
    }) => ({
      updates: {
        subscriptionStatus:
          PLATFORM_SUBSCRIPTION_STATUSES
            .canceled,

        clientStatusRawValue:
          PLATFORM_CLIENT_STATUSES
            .canceled,

        cancellationReason:
          reason,

        subscriptionEndDate:
          now,

        isActive:
          false,

        nextBillingDate:
          deleteField(),
      },

      audit: {
        type:
          "subscription-canceled",

        title:
          "Subscription Canceled",

        message:
          `${currentRecord.businessName}'s subscription was canceled${
            reason
              ? `: ${reason}`
              : "."
          }`,

        previousValues: {
          subscriptionStatus:
            currentRecord.subscriptionStatus,

          clientStatus:
            currentRecord.clientStatus,

          isActive:
            currentRecord.isActive,
        },

        updatedValues: {
          subscriptionStatus:
            PLATFORM_SUBSCRIPTION_STATUSES
              .canceled,

          clientStatus:
            PLATFORM_CLIENT_STATUSES
              .canceled,

          cancellationReason:
            reason,

          subscriptionEndDate:
            now,

          isActive:
            false,
        },
      },

      message:
        `${currentRecord.businessName}'s subscription was canceled.`,
    })
  );
}

export async function recordPlatformClientPayment(
  actor:
    PlatformExecutiveActor,
  businessID: string,
  paymentDate:
    Date = new Date()
): Promise<
  PlatformExecutiveMutationResult
> {
  const normalizedPaymentDate =
    Number.isNaN(
      paymentDate.getTime()
    )
      ? new Date()
      : paymentDate;

  return runPlatformClientMutation(
    actor,
    businessID,

    ({ currentRecord }) => {
      const nextBillingDate =
        addPlatformMonths(
          normalizedPaymentDate,
          1
        );

      return {
        updates: {
          lastPaymentDate:
            normalizedPaymentDate,

          nextBillingDate,

          subscriptionStatus:
            PLATFORM_SUBSCRIPTION_STATUSES
              .active,

          clientStatusRawValue:
            PLATFORM_CLIENT_STATUSES
              .active,

          isActive:
            true,

          suspensionReason:
            "",

          cancellationReason:
            "",

          gracePeriodEndDate:
            deleteField(),
        },

        audit: {
          type:
            "payment-recorded",

          title:
            "Payment Recorded",

          message:
            `A payment was recorded for ${currentRecord.businessName}.`,

          previousValues: {
            lastPaymentDate:
              currentRecord.lastPaymentDate,

            nextBillingDate:
              currentRecord.nextBillingDate,

            subscriptionStatus:
              currentRecord.subscriptionStatus,
          },

          updatedValues: {
            lastPaymentDate:
              normalizedPaymentDate,

            nextBillingDate,

            subscriptionStatus:
              PLATFORM_SUBSCRIPTION_STATUSES
                .active,
          },
        },

        message:
          `Payment recorded for ${currentRecord.businessName}.`,
      };
    }
  );
}

// ============================================================
// MARK: - Archive and Deletion
// ============================================================

export async function archivePlatformClient(
  actor:
    PlatformExecutiveActor,
  businessID: string
): Promise<
  PlatformExecutiveMutationResult
> {
  return runPlatformClientMutation(
    actor,
    businessID,

    ({
      currentRecord,
      now,
    }) => ({
      updates: {
        clientStatusRawValue:
          PLATFORM_CLIENT_STATUSES
            .archived,

        archivedAt:
          now,

        isActive:
          false,
      },

      audit: {
        type:
          "business-archived",

        title:
          "Business Archived",

        message:
          `${currentRecord.businessName} was archived.`,

        previousValues: {
          clientStatus:
            currentRecord.clientStatus,

          archivedAt:
            currentRecord.archivedAt,

          isActive:
            currentRecord.isActive,
        },

        updatedValues: {
          clientStatus:
            PLATFORM_CLIENT_STATUSES
              .archived,

          archivedAt:
            now,

          isActive:
            false,
        },
      },

      message:
        `${currentRecord.businessName} was archived.`,
    })
  );
}

export async function restorePlatformClientFromArchive(
  actor:
    PlatformExecutiveActor,
  businessID: string
): Promise<
  PlatformExecutiveMutationResult
> {
  return runPlatformClientMutation(
    actor,
    businessID,

    ({ currentRecord }) => {
      const restoredStatus =
        currentRecord
          .subscriptionStatus ===
        PLATFORM_SUBSCRIPTION_STATUSES
          .active
          ? PLATFORM_CLIENT_STATUSES
              .active
          : PLATFORM_CLIENT_STATUSES
              .onboarding;

      return {
        updates: {
          archivedAt:
            deleteField(),

          pendingDeletionAt:
            deleteField(),

          deletionRequestedByUID:
            "",

          clientStatusRawValue:
            restoredStatus,

          isActive:
            true,
        },

        audit: {
          type:
            "business-restored",

          title:
            "Business Restored",

          message:
            `${currentRecord.businessName} was restored from the archive.`,

          previousValues: {
            clientStatus:
              currentRecord.clientStatus,

            archivedAt:
              currentRecord.archivedAt,
          },

          updatedValues: {
            clientStatus:
              restoredStatus,

            archivedAt:
              null,

            isActive:
              true,
          },
        },

        message:
          `${currentRecord.businessName} was restored.`,
      };
    }
  );
}

export async function requestPlatformClientDeletion(
  actor:
    PlatformExecutiveActor,
  businessID: string
): Promise<
  PlatformExecutiveMutationResult
> {
  return runPlatformClientMutation(
    actor,
    businessID,

    ({
      currentRecord,
      now,
    }) => ({
      updates: {
        clientStatusRawValue:
          PLATFORM_CLIENT_STATUSES
            .pendingDeletion,

        pendingDeletionAt:
          now,

        deletionRequestedByUID:
          cleanPlatformText(
            actor.firebaseUID
          ),

        isActive:
          false,
      },

      audit: {
        type:
          "deletion-requested",

        title:
          "Protected Deletion Requested",

        message:
          `${currentRecord.businessName} was entered into the protected deletion workflow.`,

        previousValues: {
          clientStatus:
            currentRecord.clientStatus,

          pendingDeletionAt:
            currentRecord.pendingDeletionAt,
        },

        updatedValues: {
          clientStatus:
            PLATFORM_CLIENT_STATUSES
              .pendingDeletion,

          pendingDeletionAt:
            now,

          deletionRequestedByUID:
            actor.firebaseUID,

          isActive:
            false,
        },
      },

      message:
        `Deletion was requested for ${currentRecord.businessName}.`,
    })
  );
}

export async function cancelPlatformClientDeletionRequest(
  actor:
    PlatformExecutiveActor,
  businessID: string
): Promise<
  PlatformExecutiveMutationResult
> {
  return runPlatformClientMutation(
    actor,
    businessID,

    ({ currentRecord }) => ({
      updates: {
        pendingDeletionAt:
          deleteField(),

        deletionRequestedByUID:
          "",

        clientStatusRawValue:
          PLATFORM_CLIENT_STATUSES
            .suspended,

        isActive:
          false,
      },

      audit: {
        type:
          "deletion-canceled",

        title:
          "Deletion Request Canceled",

        message:
          `The protected deletion request for ${currentRecord.businessName} was canceled.`,

        previousValues: {
          clientStatus:
            currentRecord.clientStatus,

          pendingDeletionAt:
            currentRecord.pendingDeletionAt,

          deletionRequestedByUID:
            currentRecord.deletionRequestedByUID,
        },

        updatedValues: {
          clientStatus:
            PLATFORM_CLIENT_STATUSES
              .suspended,

          pendingDeletionAt:
            null,

          deletionRequestedByUID:
            "",

          isActive:
            false,
        },
      },

      message:
        `Deletion request canceled for ${currentRecord.businessName}.`,
    })
  );
}

// ============================================================
// MARK: - Owner Access
// ============================================================

export async function disablePlatformOwnerAccess(
  actor:
    PlatformExecutiveActor,
  businessID: string,
  input:
    PlatformClientReasonInput
): Promise<
  PlatformExecutiveMutationResult
> {
  const reason =
    cleanPlatformText(
      input.reason
    );

  return runPlatformClientMutation(
    actor,
    businessID,

    ({
      currentRecord,
      now,
    }) => ({
      updates: {
        ownerAccountStatusRawValue:
          PLATFORM_OWNER_ACCOUNT_STATUSES
            .disabled,

        lastOwnerAccessDisabledAt:
          now,

        ...(reason
          ? {
              suspensionReason:
                reason,
            }
          : {}),
      },

      audit: {
        type:
          "owner-access-disabled",

        title:
          "Owner Access Disabled",

        message:
          `${currentRecord.businessName}'s owner access was disabled.`,

        previousValues: {
          ownerAccountStatus:
            currentRecord.ownerAccountStatus,
        },

        updatedValues: {
          ownerAccountStatus:
            PLATFORM_OWNER_ACCOUNT_STATUSES
              .disabled,

          reason,
        },
      },

      message:
        `Owner access was disabled for ${currentRecord.businessName}.`,
    })
  );
}

export async function enablePlatformOwnerAccess(
  actor:
    PlatformExecutiveActor,
  businessID: string
): Promise<
  PlatformExecutiveMutationResult
> {
  return runPlatformClientMutation(
    actor,
    businessID,

    ({
      currentRecord,
      now,
    }) => {
      const ownerAccountStatus =
        currentRecord
          .ownerFirebaseUID
          ? PLATFORM_OWNER_ACCOUNT_STATUSES
              .active
          : PLATFORM_OWNER_ACCOUNT_STATUSES
              .pendingRegistration;

      return {
        updates: {
          ownerAccountStatusRawValue:
            ownerAccountStatus,

          lastOwnerAccessEnabledAt:
            now,
        },

        audit: {
          type:
            "owner-access-enabled",

          title:
            "Owner Access Enabled",

          message:
            `${currentRecord.businessName}'s owner access was updated.`,

          previousValues: {
            ownerAccountStatus:
              currentRecord.ownerAccountStatus,
          },

          updatedValues: {
            ownerAccountStatus,
          },
        },

        message:
          currentRecord
            .ownerFirebaseUID
            ? `Owner access was enabled for ${currentRecord.businessName}.`
            : `${currentRecord.businessName} is awaiting owner registration.`,
      };
    }
  );
}

// ============================================================
// MARK: - Business Profile
// ============================================================

export async function updatePlatformClientBusinessProfile(
  actor:
    PlatformExecutiveActor,
  businessID: string,
  input:
    PlatformClientBusinessProfileInput
): Promise<
  PlatformExecutiveMutationResult
> {
  const businessName =
    requireText(
      input.businessName,
      "Business name"
    );

  return runPlatformClientMutation(
    actor,
    businessID,

    ({ currentRecord }) => {
      const updates = {
        businessName,

        industry:
          cleanPlatformText(
            input.industry
          ),

        businessCategory:
          cleanPlatformText(
            input.businessCategory
          ),

        businessModeRawValue:
          cleanPlatformText(
            input.businessModeRawValue
          ),

        businessPhone:
          cleanPlatformText(
            input.businessPhone
          ),

        businessEmail:
          cleanPlatformEmail(
            input.businessEmail
          ),

        supportEmail:
          cleanPlatformEmail(
            input.supportEmail
          ),

        website:
          cleanPlatformText(
            input.website
          ),

        taxID:
          cleanPlatformText(
            input.taxID
          ),

        localeIdentifier:
          cleanPlatformText(
            input.localeIdentifier
          ),

        timeZoneIdentifier:
          cleanPlatformText(
            input.timeZoneIdentifier
          ),
      };

      return {
        updates,

        audit: {
          type:
            "client-updated",

          title:
            "Business Profile Updated",

          message:
            `${businessName}'s business profile was updated.`,

          previousValues: {
            businessName:
              currentRecord.businessName,

            industry:
              currentRecord.industry,

            businessCategory:
              currentRecord.businessCategory,

            businessModeRawValue:
              currentRecord.businessModeRawValue,
          },

          updatedValues:
            updates,
        },

        message:
          `${businessName}'s profile was updated.`,
      };
    }
  );
}

export async function updatePlatformClientOwner(
  actor:
    PlatformExecutiveActor,
  businessID: string,
  input:
    PlatformClientOwnerInput
): Promise<
  PlatformExecutiveMutationResult
> {
  const ownerFullName =
    requireText(
      input.ownerFullName,
      "Owner name"
    );

  const ownerEmail =
    cleanPlatformEmail(
      input.ownerEmail
    );

  if (!ownerEmail) {
    throw new PlatformExecutiveServiceError(
      "owner-email-required",
      "A valid owner email is required."
    );
  }

  return runPlatformClientMutation(
    actor,
    businessID,

    ({ currentRecord }) => {
      const updates = {
        ownerFullName,

        ownerEmail,

        ownerPhone:
          cleanPlatformText(
            input.ownerPhone
          ),
      };

      return {
        updates,

        audit: {
          type:
            "client-updated",

          title:
            "Business Owner Updated",

          message:
            `${currentRecord.businessName}'s owner information was updated.`,

          previousValues: {
            ownerFullName:
              currentRecord.ownerFullName,

            ownerEmail:
              currentRecord.ownerEmail,

            ownerPhone:
              currentRecord.ownerPhone,
          },

          updatedValues:
            updates,
        },

        message:
          `Owner information was updated for ${currentRecord.businessName}.`,
      };
    }
  );
}

export async function updatePlatformClientAddress(
  actor:
    PlatformExecutiveActor,
  businessID: string,
  input:
    PlatformClientAddressInput
): Promise<
  PlatformExecutiveMutationResult
> {
  return runPlatformClientMutation(
    actor,
    businessID,

    ({ currentRecord }) => {
      const updates = {
        addressLine1:
          cleanPlatformText(
            input.addressLine1
          ),

        addressLine2:
          cleanPlatformText(
            input.addressLine2
          ),

        city:
          cleanPlatformText(
            input.city
          ),

        state:
          cleanPlatformText(
            input.state
          ),

        zipCode:
          cleanPlatformText(
            input.zipCode
          ),

        country:
          cleanPlatformText(
            input.country
          ) ||
          "USA",
      };

      return {
        updates,

        audit: {
          type:
            "client-updated",

          title:
            "Business Address Updated",

          message:
            `${currentRecord.businessName}'s address was updated.`,

          updatedValues:
            updates,
        },

        message:
          `Address updated for ${currentRecord.businessName}.`,
      };
    }
  );
}

// ============================================================
// MARK: - Contacts
// ============================================================

export async function updatePlatformClientSecondaryContact(
  actor:
    PlatformExecutiveActor,
  businessID: string,
  input:
    PlatformClientSecondaryContactInput
): Promise<
  PlatformExecutiveMutationResult
> {
  return runPlatformClientMutation(
    actor,
    businessID,

    ({ currentRecord }) => {
      const updates = {
        secondaryContactName:
          cleanPlatformText(
            input.secondaryContactName
          ),

        secondaryContactEmail:
          cleanPlatformEmail(
            input.secondaryContactEmail
          ),

        secondaryContactPhone:
          cleanPlatformText(
            input.secondaryContactPhone
          ),
      };

      return {
        updates,

        audit: {
          type:
            "client-updated",

          title:
            "Secondary Contact Updated",

          message:
            `${currentRecord.businessName}'s secondary contact was updated.`,

          updatedValues:
            updates,
        },

        message:
          `Secondary contact updated for ${currentRecord.businessName}.`,
      };
    }
  );
}

export async function updatePlatformClientBillingContact(
  actor:
    PlatformExecutiveActor,
  businessID: string,
  input:
    PlatformClientBillingContactInput
): Promise<
  PlatformExecutiveMutationResult
> {
  return runPlatformClientMutation(
    actor,
    businessID,

    ({ currentRecord }) => {
      const updates = {
        billingContactName:
          cleanPlatformText(
            input.billingContactName
          ),

        billingContactEmail:
          cleanPlatformEmail(
            input.billingContactEmail
          ),

        billingContactPhone:
          cleanPlatformText(
            input.billingContactPhone
          ),
      };

      return {
        updates,

        audit: {
          type:
            "client-updated",

          title:
            "Billing Contact Updated",

          message:
            `${currentRecord.businessName}'s billing contact was updated.`,

          updatedValues:
            updates,
        },

        message:
          `Billing contact updated for ${currentRecord.businessName}.`,
      };
    }
  );
}

// ============================================================
// MARK: - Billing Provider
// ============================================================

export async function updatePlatformClientBillingProvider(
  actor:
    PlatformExecutiveActor,
  businessID: string,
  input:
    PlatformClientBillingProviderInput
): Promise<
  PlatformExecutiveMutationResult
> {
  return runPlatformClientMutation(
    actor,
    businessID,

    ({ currentRecord }) => {
      const updates = {
        billingProviderRawValue:
          input.provider,

        appleOriginalTransactionID:
          cleanPlatformText(
            input.appleOriginalTransactionID
          ),

        appleProductID:
          cleanPlatformText(
            input.appleProductID
          ),

        stripeCustomerID:
          cleanPlatformText(
            input.stripeCustomerID
          ),

        stripeSubscriptionID:
          cleanPlatformText(
            input.stripeSubscriptionID
          ),
      };

      return {
        updates,

        audit: {
          type:
            "client-updated",

          title:
            "Billing Provider Updated",

          message:
            `${currentRecord.businessName}'s billing provider was updated.`,

          previousValues: {
            billingProvider:
              currentRecord.billingProvider,
          },

          updatedValues:
            updates,
        },

        message:
          `Billing provider updated for ${currentRecord.businessName}.`,
      };
    }
  );
}

// ============================================================
// MARK: - Plan Limits
// ============================================================

export async function updatePlatformClientLimits(
  actor:
    PlatformExecutiveActor,
  businessID: string,
  input:
    PlatformClientPlanLimitsInput
): Promise<
  PlatformExecutiveMutationResult
> {
  return runPlatformClientMutation(
    actor,
    businessID,

    ({ currentRecord }) => {
      const updates = {
        employeeLimit:
          platformNonNegativeInteger(
            input.employeeLimit
          ),

        customerLimit:
          platformNonNegativeInteger(
            input.customerLimit
          ),

        productLimit:
          platformNonNegativeInteger(
            input.productLimit
          ),

        storageLimitGB:
          platformNonNegativeNumber(
            input.storageLimitGB
          ),
      };

      return {
        updates,

        audit: {
          type:
            "limits-updated",

          title:
            "Plan Limits Updated",

          message:
            `${currentRecord.businessName}'s plan limits were updated.`,

          previousValues: {
            employeeLimit:
              currentRecord.employeeLimit,

            customerLimit:
              currentRecord.customerLimit,

            productLimit:
              currentRecord.productLimit,

            storageLimitGB:
              currentRecord.storageLimitGB,
          },

          updatedValues:
            updates,
        },

        message:
          `Plan limits updated for ${currentRecord.businessName}.`,
      };
    }
  );
}

// ============================================================
// MARK: - Modules and Features
// ============================================================

export async function updatePlatformClientFeatureAccess(
  actor:
    PlatformExecutiveActor,
  businessID: string,
  input:
    PlatformClientFeatureAccessInput
): Promise<
  PlatformExecutiveMutationResult
> {
  const enabledModules =
    normalizePlatformStringArray(
      input.enabledModules
    );

  const disabledModules =
    normalizePlatformStringArray(
      input.disabledModules
    ).filter(
      (moduleID) =>
        !enabledModules.includes(
          moduleID
        )
    );

  return runPlatformClientMutation(
    actor,
    businessID,

    ({ currentRecord }) => {
      const enabledModulesRawValue =
        JSON.stringify(
          enabledModules
        );

      const disabledModulesRawValue =
        JSON.stringify(
          disabledModules
        );

      const updates = {
        canCreateInvitations:
          input.canCreateInvitations,

        canUseAutomaticLogo:
          input.canUseAutomaticLogo,

        enabledModules,

        disabledModules,

        enabledModulesRawValue,

        disabledModulesRawValue,
      };

      return {
        updates,

        audit: {
          type:
            "modules-updated",

          title:
            "Modules and Features Updated",

          message:
            `${currentRecord.businessName}'s modules and feature access were updated.`,

          previousValues: {
            canCreateInvitations:
              currentRecord.canCreateInvitations,

            canUseAutomaticLogo:
              currentRecord.canUseAutomaticLogo,

            enabledModules:
              currentRecord.enabledModules,

            disabledModules:
              currentRecord.disabledModules,
          },

          updatedValues:
            updates,
        },

        message:
          `Modules updated for ${currentRecord.businessName}.`,
      };
    }
  );
}

// ============================================================
// MARK: - Internal Administration
// ============================================================

export async function updatePlatformClientInternalInfo(
  actor:
    PlatformExecutiveActor,
  businessID: string,
  input:
    PlatformClientInternalInfoInput
): Promise<
  PlatformExecutiveMutationResult
> {
  const internalTags =
    normalizePlatformTags(
      input.internalTags
    );

  const updates = {
    accountManagerName:
      cleanPlatformText(
        input.accountManagerName
      ),

    internalTags:
      internalTags.join(
        ", "
      ),

    riskLevel:
      cleanPlatformText(
        input.riskLevel
      ) ||
      "Normal",

    notes:
      cleanPlatformText(
        input.notes
      ),
  };

  return runPlatformClientMutation(
    actor,
    businessID,

    ({ currentRecord }) => ({
      updates,

      audit: {
        type:
          "internal-notes-updated",

        title:
          "Internal Administration Updated",

        message:
          `${currentRecord.businessName}'s internal administration information was updated.`,

        previousValues: {
          accountManagerName:
            currentRecord.accountManagerName,

          internalTags:
            currentRecord.internalTags,

          riskLevel:
            currentRecord.riskLevel,

          notes:
            currentRecord.notes,
        },

        updatedValues:
          updates,
      },

      message:
        `Internal administration updated for ${currentRecord.businessName}.`,
    })
  );
}

// ============================================================
// MARK: - Onboarding
// ============================================================

export async function updatePlatformClientOnboardingStatus(
  actor:
    PlatformExecutiveActor,
  businessID: string,
  onboardingStatus:
    PlatformOnboardingStatus
): Promise<
  PlatformExecutiveMutationResult
> {
  return runPlatformClientMutation(
    actor,
    businessID,

    ({ currentRecord }) => {
      const clientStatus =
        onboardingStatus ===
        PLATFORM_ONBOARDING_STATUSES
          .ready
          ? PLATFORM_CLIENT_STATUSES
              .active
          : PLATFORM_CLIENT_STATUSES
              .onboarding;

      return {
        updates: {
          onboardingStatusRawValue:
            onboardingStatus,

          clientStatusRawValue:
            clientStatus,

          ...(onboardingStatus ===
          PLATFORM_ONBOARDING_STATUSES
            .ready
            ? {
                isActive:
                  true,
              }
            : {}),
        },

        audit: {
          type:
            "onboarding-updated",

          title:
            "Onboarding Status Updated",

          message:
            `${currentRecord.businessName}'s onboarding status was changed to ${onboardingStatus}.`,

          previousValues: {
            onboardingStatus:
              currentRecord.onboardingStatus,

            clientStatus:
              currentRecord.clientStatus,
          },

          updatedValues: {
            onboardingStatus,

            clientStatus,
          },
        },

        message:
          `${currentRecord.businessName}'s onboarding status was updated.`,
      };
    }
  );
}

// ============================================================
// MARK: - Manual Audit Event
// ============================================================

export async function recordPlatformAuditEvent(
  actor:
    PlatformExecutiveActor,
  input:
    Omit<
      PlatformAuditInput,
      "actor"
    >
): Promise<void> {
  requirePlatformAdministrator(
    actor
  );

  const reference =
    doc(
      platformAuditEventsCollection()
    );

  await setDoc(
    reference,
    createAuditPayload({
      ...input,
      actor,
    })
  );
}

// ============================================================
// MARK: - Service Namespace
// ============================================================

export const PlatformExecutiveFirestoreService = {
  // Reads

  fetchPlatformClients,
  fetchPlatformClient,

  subscribeToPlatformClients,

  fetchPlatformOwnerInvitations,
  subscribeToPlatformOwnerInvitations,

  // Creation

  createPlatformClient,

  // Activation

  setPlatformClientActivation,

  // Trial and subscription

  startPlatformClientFreeTrial,
  activatePlatformClientMonthlyPlan,
  markPlatformClientPastDue,
  startPlatformClientGracePeriod,

  suspendPlatformClient,
  reactivatePlatformClient,

  cancelPlatformClientSubscription,
  recordPlatformClientPayment,

  // Lifecycle

  archivePlatformClient,
  restorePlatformClientFromArchive,

  requestPlatformClientDeletion,
  cancelPlatformClientDeletionRequest,

  // Owner access

  disablePlatformOwnerAccess,
  enablePlatformOwnerAccess,

  // Profile and contacts

  updatePlatformClientBusinessProfile,
  updatePlatformClientOwner,
  updatePlatformClientAddress,

  updatePlatformClientSecondaryContact,
  updatePlatformClientBillingContact,

  // Billing and limits

  updatePlatformClientBillingProvider,
  updatePlatformClientLimits,

  // Modules and internal administration

  updatePlatformClientFeatureAccess,
  updatePlatformClientInternalInfo,

  // Onboarding

  updatePlatformClientOnboardingStatus,

  // Audit

  recordPlatformAuditEvent,
} as const;

export default
  PlatformExecutiveFirestoreService;