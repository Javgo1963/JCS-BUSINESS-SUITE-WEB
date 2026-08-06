import type { Firestore } from "firebase/firestore";
import {
  serverTimestamp,
  type FieldValue,
} from "firebase/firestore";

import type {
  JCSBusinessProvisioningInput,
} from "@/core/business-core/registration/JCSBusinessRegistrationManager";

// MARK: - Business Creation Identity

/**
 * Shared immutable identity created once for the entire
 * business registration operation.
 */
export interface BusinessCreationIdentity {
  businessID: string;
  ownerUID: string;
  firebaseUID: string;

  platformClientID: string;
  appSettingsID: string;
  businessDNAID: string;
  workspaceID: string;
  membershipID: string;

  businessInviteCode: string;

  createdAtISO: string;
  identityVersion: number;
}

export interface BusinessCreationEngineOptions {
  firestore?: Firestore;

  defaultPlanName?: string;
  defaultTrialLengthDays?: number;

  dashboardRoute?: string;

  platformUID?: string;

  defaultCurrencyCode?: string;
  defaultAccentColorName?: string;
}

// MARK: - Factory Configuration

export interface BusinessCreationFactoryConfiguration {
  planName: string;
  trialLengthDays: number;

  platformUID: string;

  currencyCode: string;
  accentColorName: string;
}

// MARK: - Shared Factory Context

/**
 * Every creation factory receives the same operation context.
 *
 * This prevents factories from generating different timestamps,
 * identities, modules, permissions, or subscription information.
 */
export interface BusinessCreationFactoryContext {
  input: JCSBusinessProvisioningInput;

  identity: BusinessCreationIdentity;

  enabledModules: string[];
  disabledModules: string[];

  ownerPermissions: string[];

  configuration:
    BusinessCreationFactoryConfiguration;

  createdAtISO: string;
  updatedAtISO: string;

  trialStartedAtISO: string;
  trialEndsAtISO: string;
}

// MARK: - Common Audit Fields

export interface BusinessCreationAuditFields {
  createdByUID: string;
  updatedByUID: string;

  createdAtISO: string;
  updatedAtISO: string;

  createdAt: FieldValue;
  updatedAt: FieldValue;
}

// MARK: - Factory Error

export class BusinessCreationFactoryError extends Error {
  readonly factoryName: string;
  readonly fieldName?: string;
  readonly cause?: unknown;

  constructor(
    factoryName: string,
    message: string,
    options?: {
      fieldName?: string;
      cause?: unknown;
    }
  ) {
    super(message);

    this.name = "BusinessCreationFactoryError";
    this.factoryName = factoryName;
    this.fieldName = options?.fieldName;
    this.cause = options?.cause;

    Object.setPrototypeOf(
      this,
      BusinessCreationFactoryError.prototype
    );
  }
}

// MARK: - Text Helpers

export function cleanFactoryText(
  value: string | null | undefined
): string {
  return value?.trim() ?? "";
}

export function normalizeFactoryEmail(
  value: string
): string {
  return cleanFactoryText(value).toLowerCase();
}

export function normalizeFactorySearchText(
  value: string
): string {
  return cleanFactoryText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function uniqueFactoryStrings(
  values: readonly string[]
): string[] {
  return Array.from(
    new Set(
      values
        .map(cleanFactoryText)
        .filter(Boolean)
    )
  );
}

// MARK: - Validation Helpers

export function requireFactoryText(
  factoryName: string,
  fieldName: string,
  value: string | null | undefined
): string {
  const cleanedValue =
    cleanFactoryText(value);

  if (!cleanedValue) {
    throw new BusinessCreationFactoryError(
      factoryName,
      `${fieldName} is required.`,
      {
        fieldName,
      }
    );
  }

  return cleanedValue;
}

export function requireNonNegativeNumber(
  factoryName: string,
  fieldName: string,
  value: number
): number {
  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new BusinessCreationFactoryError(
      factoryName,
      `${fieldName} must be a non-negative number.`,
      {
        fieldName,
      }
    );
  }

  return value;
}

// MARK: - Audit Factory

export function createFactoryAuditFields(
  context: BusinessCreationFactoryContext
): BusinessCreationAuditFields {
  return {
    createdByUID:
      context.identity.firebaseUID,

    updatedByUID:
      context.identity.firebaseUID,

    createdAtISO:
      context.createdAtISO,

    updatedAtISO:
      context.updatedAtISO,

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),
  };
}

