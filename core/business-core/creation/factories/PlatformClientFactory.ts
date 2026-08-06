import type {
  FieldValue,
} from "firebase/firestore";

import {
  cleanFactoryText,
  createFactoryAuditFields,
  normalizeFactoryEmail,
  normalizeFactorySearchText,
  requireFactoryText,
  requireNonNegativeNumber,
  uniqueFactoryStrings,
  type BusinessCreationFactoryContext,
} from "./BusinessCreationFactoryContext";

// MARK: - Platform Client Status

export type PlatformClientStatus =
  | "pending"
  | "active"
  | "suspended"
  | "closed";

export type PlatformClientOnboardingStatus =
  | "pending"
  | "provisioning"
  | "ready"
  | "failed";

export type PlatformClientSubscriptionStatus =
  | "trial"
  | "active"
  | "pastDue"
  | "cancelled";

export type PlatformOwnerInvitationStatus =
  | "notInvited"
  | "pending"
  | "accepted"
  | "expired"
  | "cancelled";

// MARK: - Platform Client Document

export interface JCSPlatformClientDocument {
  id: string;
  platformClientID: string;

  businessID: string;

  businessName: string;
  normalizedBusinessName: string;

  ownerUID: string;
  ownerFirebaseUID: string;

  ownerFullName: string;
  ownerEmail: string;
  ownerPhone: string;

  businessPhone: string;
  website: string;

  industryCategoryKey: string;
  industryCategoryTitle: string;

  businessModeKey: string;
  businessModeName: string;

  businessInviteCode: string;
  platformInvitationCode: string;

  ownerAccountStatus: "active";

  ownerInvitationStatus:
    PlatformOwnerInvitationStatus;

  clientStatus:
    PlatformClientStatus;

  onboardingStatus:
    PlatformClientOnboardingStatus;

  subscriptionStatus:
    PlatformClientSubscriptionStatus;

  planName: string;

  trialLengthDays: number;
  trialStartedAtISO: string;
  trialEndsAtISO: string;

  enabledModules: string[];
  disabledModules: string[];

  localeIdentifier: string;
  timeZoneIdentifier: string;

  platformUID: string;

  registrationSource:
    | "publicSignup"
    | "platformInvitation";

  platformVisibility: true;

  platformClientVersion: number;

  createdByUID: string;
  updatedByUID: string;

  createdAtISO: string;
  updatedAtISO: string;

  createdAt: FieldValue;
  updatedAt: FieldValue;
}

// MARK: - Platform Client Factory Overrides

export interface PlatformClientFactoryOverrides {
  clientStatus?: PlatformClientStatus;

  onboardingStatus?:
    PlatformClientOnboardingStatus;

  subscriptionStatus?:
    PlatformClientSubscriptionStatus;

  ownerInvitationStatus?:
    PlatformOwnerInvitationStatus;

  platformVisibility?: boolean;
}

// MARK: - Platform Client Factory

export class PlatformClientFactory {
  static create(
    context: BusinessCreationFactoryContext,
    overrides:
      PlatformClientFactoryOverrides = {}
  ): JCSPlatformClientDocument {
    const factoryName =
      "PlatformClientFactory";

    const {
      input,
      identity,
      configuration,
    } = context;

    const businessID =
      requireFactoryText(
        factoryName,
        "businessID",
        identity.businessID
      );

    const platformClientID =
      requireFactoryText(
        factoryName,
        "platformClientID",
        identity.platformClientID
      );

    const ownerUID =
      requireFactoryText(
        factoryName,
        "ownerUID",
        identity.ownerUID
      );

    const firebaseUID =
      requireFactoryText(
        factoryName,
        "firebaseUID",
        identity.firebaseUID
      );

    const businessName =
      requireFactoryText(
        factoryName,
        "businessName",
        input.businessName
      );

    const ownerFullName =
      requireFactoryText(
        factoryName,
        "ownerFullName",
        input.ownerFullName
      );

    const ownerEmail =
      requireFactoryText(
        factoryName,
        "ownerEmail",
        input.ownerEmail
      );

    const industryCategoryKey =
      requireFactoryText(
        factoryName,
        "industryCategoryKey",
        input.industryCategoryKey
      );

    const industryCategoryTitle =
      requireFactoryText(
        factoryName,
        "industryCategoryTitle",
        input.industryCategoryTitle
      );

    const businessModeKey =
      requireFactoryText(
        factoryName,
        "businessModeKey",
        input.businessModeKey
      );

    const businessModeName =
      requireFactoryText(
        factoryName,
        "businessModeName",
        input.businessModeName
      );

    const planName =
      requireFactoryText(
        factoryName,
        "planName",
        configuration.planName
      );

    const platformUID =
      requireFactoryText(
        factoryName,
        "platformUID",
        configuration.platformUID
      );

    const trialLengthDays =
      requireNonNegativeNumber(
        factoryName,
        "trialLengthDays",
        configuration.trialLengthDays
      );

    const platformInvitationCode =
      cleanFactoryText(
        input.platformInvitationCode
      );

    const hasPlatformInvitation =
      Boolean(platformInvitationCode);

    const ownerInvitationStatus =
      overrides.ownerInvitationStatus ??
      (
        hasPlatformInvitation
          ? "accepted"
          : "notInvited"
      );

    const registrationSource =
      hasPlatformInvitation
        ? "platformInvitation"
        : "publicSignup";

    const auditFields =
      createFactoryAuditFields(context);

    return {
      id: platformClientID,
      platformClientID,

      businessID,

      businessName,

      normalizedBusinessName:
        normalizeFactorySearchText(
          businessName
        ),

      ownerUID,

      ownerFirebaseUID:
        firebaseUID,

      ownerFullName,

      ownerEmail:
        normalizeFactoryEmail(
          ownerEmail
        ),

      ownerPhone:
        cleanFactoryText(
          input.ownerPhone
        ),

      businessPhone:
        cleanFactoryText(
          input.businessPhone
        ),

      website:
        cleanFactoryText(
          input.website
        ),

      industryCategoryKey,
      industryCategoryTitle,

      businessModeKey,
      businessModeName,

      businessInviteCode:
        requireFactoryText(
          factoryName,
          "businessInviteCode",
          identity.businessInviteCode
        ),

      platformInvitationCode,

      ownerAccountStatus:
        "active",

      ownerInvitationStatus,

      clientStatus:
        overrides.clientStatus ??
        "active",

      onboardingStatus:
        overrides.onboardingStatus ??
        "ready",

      subscriptionStatus:
        overrides.subscriptionStatus ??
        "trial",

      planName,

      trialLengthDays,

      trialStartedAtISO:
        context.trialStartedAtISO,

      trialEndsAtISO:
        context.trialEndsAtISO,

      enabledModules:
        uniqueFactoryStrings(
          context.enabledModules
        ),

      disabledModules:
        uniqueFactoryStrings(
          context.disabledModules
        ),

      localeIdentifier:
        requireFactoryText(
          factoryName,
          "localeIdentifier",
          input.localeIdentifier
        ),

      timeZoneIdentifier:
        requireFactoryText(
          factoryName,
          "timeZoneIdentifier",
          input.timeZoneIdentifier
        ),

      platformUID,

      registrationSource,

      platformVisibility:
        true,

      platformClientVersion: 1,

      ...auditFields,
    };
  }
}

// MARK: - Convenience Factory

export function createPlatformClientDocument(
  context: BusinessCreationFactoryContext,
  overrides:
    PlatformClientFactoryOverrides = {}
): JCSPlatformClientDocument {
  return PlatformClientFactory.create(
    context,
    overrides
  );
}