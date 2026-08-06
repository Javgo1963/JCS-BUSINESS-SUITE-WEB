/*
 * JCS Business Suite Web
 * AppSettingsFirestoreService.ts
 *
 * Firestore persistence service for:
 *
 * - Business-scoped App Settings.
 * - Company information.
 * - Tax configuration.
 * - Language and Dashboard Accent Color.
 * - Safe preservation of active business-logo branding.
 * - Initial settings creation.
 * - Real-time settings subscriptions.
 * - Partial settings updates.
 *
 * Firebase Storage, React state and visual components
 * must not live in this file.
 */

import {
  Firestore,
  Unsubscribe,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  BUSINESS_SETTINGS_FIRESTORE_COLLECTION,
} from "../business-branding/BusinessLogoConstants";

import {
  AppSettingsValidationError,
  createAppSettingsRecordFromSaveInput,
  deserializeAppSettingsRecord,
  extractBrandingFromAppSettingsRecord,
  normalizeAddressInput,
  normalizeAppSettingsRecord,
  normalizeCompanyNameInput,
  normalizeEmailInput,
  normalizePhoneInput,
  normalizeSaveAppSettingsInput,
  normalizeTaxPercentText,
  parseTaxPercentText,
  serializeAppSettingsForFirestore,
} from "./AppSettingsDomain";

import {
  createDefaultAppSettingsRecord,
  normalizeAppAccentColorName,
  normalizeAppLanguageCode,
} from "./AppSettingsTypes";

import type {
  AppAccentColorName,
  AppLanguageCode,
  AppSettingsFormErrors,
  AppSettingsRecord,
  SaveAppSettingsInput,
  UpdateAppSettingsAppearanceInput,
  UpdateAppSettingsCompanyInformationInput,
  UpdateAppSettingsLanguageInput,
  UpdateAppSettingsTaxInput,
} from "./AppSettingsTypes";

import type {
  BusinessBrandingSettings,
} from "../business-branding/BusinessLogoTypes";

// MARK: - Service Models

export interface EnsureAppSettingsInput {
  businessID: string;
  ownerUID: string;
  createdByUID: string;

  companyName?: string;

  firestore?: Firestore;
}

export interface FetchAppSettingsInput {
  businessID: string;
  firestore?: Firestore;
}

export interface SubscribeToAppSettingsInput {
  businessID: string;

  onData: (
    settings: AppSettingsRecord,
  ) => void;

  onError?: (
    error: AppSettingsFirestoreServiceError,
  ) => void;

  firestore?: Firestore;
}

export interface SaveAppSettingsResult {
  settings: AppSettingsRecord;

  wasCreated: boolean;

  /**
   * Indicates whether existing branding fields were preserved
   * from Firestore because the caller did not supply branding.
   */
  preservedExistingBranding: boolean;
}

// MARK: - Document Reference

function appSettingsDocumentReference(
  firestore: Firestore,
  businessID: string,
) {
  return doc(
    firestore,
    BUSINESS_SETTINGS_FIRESTORE_COLLECTION,
    businessID,
  );
}

// MARK: - Ensure Settings Exist

/**
 * Creates the default App Settings record only when the business
 * does not already have one.
 *
 * Existing settings are returned without being overwritten.
 */
export async function ensureAppSettingsExists(
  input: EnsureAppSettingsInput,
): Promise<AppSettingsRecord> {
  const businessID =
    requireBusinessID(
      input.businessID,
    );

  const ownerUID =
    input.ownerUID.trim();

  const createdByUID =
    input.createdByUID.trim();

  if (!ownerUID) {
    throw new AppSettingsFirestoreServiceError(
      "missing-owner-uid",
      "The Business Owner identity is required before creating App Settings.",
    );
  }

  if (!createdByUID) {
    throw new AppSettingsFirestoreServiceError(
      "missing-created-by-uid",
      "The signed-in user identity is required before creating App Settings.",
    );
  }

  const firestore =
    input.firestore ??
    getFirestore();

  const settingsReference =
    appSettingsDocumentReference(
      firestore,
      businessID,
    );

  try {
    return await runTransaction(
      firestore,
      async (transaction) => {
        const snapshot =
          await transaction.get(
            settingsReference,
          );

        if (snapshot.exists()) {
          return deserializeAppSettingsRecord(
            businessID,
            snapshot.data(),
          );
        }

        const defaultSettings =
          createDefaultAppSettingsRecord({
            businessID,
            ownerUID,
            createdByUID,

            companyName:
              normalizeCompanyNameInput(
                input.companyName ?? "",
              ) || "My Business",
          });

        const serialized =
          serializeAppSettingsForFirestore(
            defaultSettings,
          );

        transaction.set(
          settingsReference,
          {
            ...serialized,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),

            lastCloudSyncAt:
              serverTimestamp(),

            brandingUpdatedAt:
              serverTimestamp(),

            activeLogoUpdatedAt:
              serverTimestamp(),
          },
        );

        return defaultSettings;
      },
    );
  } catch (error) {
    throw mapAppSettingsFirestoreError(
      error,
      "App Settings could not be created.",
    );
  }
}

// MARK: - Fetch Settings

export async function fetchAppSettings(
  input: FetchAppSettingsInput,
): Promise<AppSettingsRecord | null> {
  const businessID =
    requireBusinessID(
      input.businessID,
    );

  const firestore =
    input.firestore ??
    getFirestore();

  try {
    const snapshot =
      await getDoc(
        appSettingsDocumentReference(
          firestore,
          businessID,
        ),
      );

    if (!snapshot.exists()) {
      return null;
    }

    return deserializeAppSettingsRecord(
      businessID,
      snapshot.data(),
    );
  } catch (error) {
    throw mapAppSettingsFirestoreError(
      error,
      "App Settings could not be loaded.",
    );
  }
}

/**
 * Loads an existing record or creates the default record when
 * the business has not yet saved App Settings.
 */
export async function fetchOrCreateAppSettings(
  input: EnsureAppSettingsInput,
): Promise<AppSettingsRecord> {
  const existingSettings =
    await fetchAppSettings({
      businessID:
        input.businessID,

      firestore:
        input.firestore,
    });

  if (existingSettings) {
    return existingSettings;
  }

  return ensureAppSettingsExists(
    input,
  );
}

// MARK: - Real-Time Subscription

/**
 * Subscribes to one business App Settings document.
 *
 * Firestore sends the initial document snapshot and subsequent
 * snapshots whenever the document changes. :contentReference[oaicite:1]{index=1}
 */
export function subscribeToAppSettings(
  input: SubscribeToAppSettingsInput,
): Unsubscribe {
  let businessID: string;

  try {
    businessID =
      requireBusinessID(
        input.businessID,
      );
  } catch (error) {
    const mappedError =
      mapAppSettingsFirestoreError(
        error,
        "The App Settings subscription could not start.",
      );

    input.onError?.(
      mappedError,
    );

    return () => {};
  }

  const firestore =
    input.firestore ??
    getFirestore();

  const settingsReference =
    appSettingsDocumentReference(
      firestore,
      businessID,
    );

  return onSnapshot(
    settingsReference,

    (snapshot) => {
      if (!snapshot.exists()) {
        input.onData(
          createDefaultAppSettingsRecord({
            businessID,
            ownerUID: "",
            createdByUID: "",
          }),
        );

        return;
      }

      try {
        input.onData(
          deserializeAppSettingsRecord(
            businessID,
            snapshot.data(),
          ),
        );
      } catch (error) {
        input.onError?.(
          mapAppSettingsFirestoreError(
            error,
            "App Settings data could not be read.",
          ),
        );
      }
    },

    (error) => {
      input.onError?.(
        mapAppSettingsFirestoreError(
          error,
          "The App Settings subscription failed.",
        ),
      );
    },
  );
}

// MARK: - Save Complete Settings

/**
 * Saves all editable App Settings in one transaction.
 *
 * Branding behavior:
 *
 * - When branding is supplied, that active branding is saved.
 * - When branding is omitted, the transaction reads and preserves
 *   the active logo fields already stored in Firestore.
 * - Other unrelated businessSettings fields are retained through
 *   a merge write.
 */
export async function saveAppSettings(
  input: SaveAppSettingsInput & {
    firestore?: Firestore;
  },
): Promise<SaveAppSettingsResult> {
  let normalizedInput:
    ReturnType<
      typeof normalizeSaveAppSettingsInput
    >;

  try {
    normalizedInput =
      normalizeSaveAppSettingsInput(
        input,
      );
  } catch (error) {
    if (
      error instanceof
      AppSettingsValidationError
    ) {
      throw error;
    }

    throw mapAppSettingsFirestoreError(
      error,
      "App Settings contains invalid information.",
    );
  }

  const firestore =
    input.firestore ??
    getFirestore();

  const settingsReference =
    appSettingsDocumentReference(
      firestore,
      normalizedInput.businessID,
    );

  try {
    return await runTransaction(
      firestore,
      async (transaction) => {
        const snapshot =
          await transaction.get(
            settingsReference,
          );

        const wasCreated =
          !snapshot.exists();

        const existingSettings =
          snapshot.exists()
            ? deserializeAppSettingsRecord(
                normalizedInput.businessID,
                snapshot.data(),
              )
            : null;

        const existingBranding =
          existingSettings
            ? extractBrandingFromAppSettingsRecord(
                existingSettings,
              )
            : null;

        const effectiveBranding:
          BusinessBrandingSettings | null =
          normalizedInput.branding ??
          existingBranding;

        const settings =
          createAppSettingsRecordFromSaveInput({
            normalizedInput: {
              ...normalizedInput,
              branding:
                effectiveBranding,
            },

            existingSettings,
          });

        const serialized =
          serializeAppSettingsForFirestore(
            settings,
          );

        transaction.set(
          settingsReference,
          {
            ...serialized,

            /*
             * Preserve the original server creation timestamp.
             * It is added only when the document is new.
             */
            ...(wasCreated
              ? {
                  createdAt:
                    serverTimestamp(),
                }
              : {}),

            updatedAt:
              serverTimestamp(),

            lastCloudSyncAt:
              serverTimestamp(),
          },
          {
            merge:
              true,
          },
        );

        return {
          settings,

          wasCreated,

          preservedExistingBranding:
            !normalizedInput.branding &&
            Boolean(existingBranding),
        };
      },
    );
  } catch (error) {
    if (
      error instanceof
      AppSettingsValidationError
    ) {
      throw error;
    }

    throw mapAppSettingsFirestoreError(
      error,
      "App Settings could not be saved.",
    );
  }
}

// MARK: - Company Information Update

export async function updateAppSettingsCompanyInformation(
  input: UpdateAppSettingsCompanyInformationInput & {
    firestore?: Firestore;
  },
): Promise<void> {
  const businessID =
    requireBusinessID(
      input.businessID,
    );

  const updatedByUID =
    requireUpdatedByUID(
      input.updatedByUID,
    );

  const companyName =
    normalizeCompanyNameInput(
      input.companyName,
    );

  const addressLine1 =
    normalizeAddressInput(
      input.addressLine1,
    );

  const addressLine2 =
    normalizeAddressInput(
      input.addressLine2,
    );

  const phone =
    normalizePhoneInput(
      input.phone,
    );

  const email =
    normalizeEmailInput(
      input.email,
    );

  if (!companyName) {
    throw new AppSettingsFirestoreServiceError(
      "missing-company-name",
      "Enter the company name.",
    );
  }

  await mergeAppSettingsFields({
    businessID,

    fields: {
      companyName,
      addressLine1,
      addressLine2,
      phone,
      email,
      updatedByUID,
    },

    firestore:
      input.firestore,

    fallbackMessage:
      "Company information could not be saved.",
  });
}

// MARK: - Tax Update

export async function updateAppSettingsTax(
  input: UpdateAppSettingsTaxInput & {
    firestore?: Firestore;
  },
): Promise<void> {
  const businessID =
    requireBusinessID(
      input.businessID,
    );

  const updatedByUID =
    requireUpdatedByUID(
      input.updatedByUID,
    );

  const parsedTax =
    parseTaxPercentText(
      normalizeTaxPercentText(
        String(input.taxPercent),
      ),
    );

  if (!parsedTax.isValid) {
    throw new AppSettingsFirestoreServiceError(
      "invalid-tax-percent",
      parsedTax.errorMessage,
    );
  }

  await mergeAppSettingsFields({
    businessID,

    fields: {
      taxPercent:
        parsedTax.value,

      updatedByUID,
    },

    firestore:
      input.firestore,

    fallbackMessage:
      "The tax percentage could not be saved.",
  });
}

// MARK: - Language Update

export async function updateAppSettingsLanguage(
  input: UpdateAppSettingsLanguageInput & {
    firestore?: Firestore;
  },
): Promise<void> {
  const businessID =
    requireBusinessID(
      input.businessID,
    );

  const updatedByUID =
    requireUpdatedByUID(
      input.updatedByUID,
    );

  const languageCode:
    AppLanguageCode =
    normalizeAppLanguageCode(
      input.languageCode,
    );

  await mergeAppSettingsFields({
    businessID,

    fields: {
      languageCode,
      updatedByUID,
    },

    firestore:
      input.firestore,

    fallbackMessage:
      "The application language could not be saved.",
  });
}

// MARK: - Appearance Update

export async function updateAppSettingsAppearance(
  input: UpdateAppSettingsAppearanceInput & {
    firestore?: Firestore;
  },
): Promise<void> {
  const businessID =
    requireBusinessID(
      input.businessID,
    );

  const updatedByUID =
    requireUpdatedByUID(
      input.updatedByUID,
    );

  const accentColorName:
    AppAccentColorName =
    normalizeAppAccentColorName(
      input.accentColorName,
    );

  await mergeAppSettingsFields({
    businessID,

    fields: {
      accentColorName,
      updatedByUID,
    },

    firestore:
      input.firestore,

    fallbackMessage:
      "The Dashboard Accent Color could not be saved.",
  });
}

// MARK: - Branding Synchronization

/**
 * Synchronizes branding fields into the shared App Settings document.
 *
 * BusinessLogoFirestoreService already performs this operation when
 * activating a logo. This helper is available for migrations or other
 * workflows that receive a complete branding object.
 */
export async function synchronizeAppSettingsBranding(
  input: {
    businessID: string;
    updatedByUID: string;
    branding: BusinessBrandingSettings;
    firestore?: Firestore;
  },
): Promise<void> {
  const businessID =
    requireBusinessID(
      input.businessID,
    );

  const updatedByUID =
    requireUpdatedByUID(
      input.updatedByUID,
    );

  if (
    input.branding.businessID.trim() &&
    input.branding.businessID.trim() !==
      businessID
  ) {
    throw new AppSettingsFirestoreServiceError(
      "business-mismatch",
      "The branding information belongs to another business.",
    );
  }

  await mergeAppSettingsFields({
    businessID,

    fields: {
      activeLogoID:
        input.branding
          .activeLogoID
          .trim(),

      activeLogoSource:
        input.branding
          .activeLogoSource,

      logoStoragePath:
        input.branding
          .logoStoragePath
          .trim(),

      logoDownloadURL:
        input.branding
          .logoDownloadURL
          .trim(),

      logoRenderingMode:
        input.branding
          .logoRenderingMode,

      logoSupportsAccentColor:
        input.branding
          .logoSupportsAccentColor,

      useAccentColorForLogo:
        input.branding
          .useAccentColorForLogo,

      brandingUpdatedAt:
        serverTimestamp(),

      activeLogoUpdatedAt:
        serverTimestamp(),

      updatedByUID,
    },

    firestore:
      input.firestore,

    fallbackMessage:
      "The business branding could not be synchronized.",
  });
}

// MARK: - Internal Merge Write

interface MergeAppSettingsFieldsInput {
  businessID: string;

  fields: Record<
    string,
    unknown
  >;

  firestore?: Firestore;

  fallbackMessage: string;
}

async function mergeAppSettingsFields(
  input: MergeAppSettingsFieldsInput,
): Promise<void> {
  const firestore =
    input.firestore ??
    getFirestore();

  const settingsReference =
    appSettingsDocumentReference(
      firestore,
      input.businessID,
    );

  try {
    await setDoc(
      settingsReference,
      {
        ...input.fields,

        businessID:
          input.businessID,

        firebaseDocumentID:
          input.businessID,

        needsCloudSync:
          false,

        lastCloudSyncISO:
          new Date().toISOString(),

        updatedAtISO:
          new Date().toISOString(),

        updatedAt:
          serverTimestamp(),

        lastCloudSyncAt:
          serverTimestamp(),
      },
      {
        merge:
          true,
      },
    );
  } catch (error) {
    throw mapAppSettingsFirestoreError(
      error,
      input.fallbackMessage,
    );
  }
}

// MARK: - Safe Record Refresh

/**
 * Re-reads the complete App Settings record after a partial write.
 */
export async function refreshAppSettingsAfterUpdate(
  businessID: string,
  firestore?: Firestore,
): Promise<AppSettingsRecord> {
  const settings =
    await fetchAppSettings({
      businessID,
      firestore,
    });

  if (!settings) {
    throw new AppSettingsFirestoreServiceError(
      "settings-not-found",
      "App Settings does not exist for this business.",
    );
  }

  return normalizeAppSettingsRecord(
    settings,
  );
}

// MARK: - Helpers

function requireBusinessID(
  value: string,
): string {
  const businessID =
    value.trim();

  if (!businessID) {
    throw new AppSettingsFirestoreServiceError(
      "missing-business-id",
      "The business ID is required.",
    );
  }

  return businessID;
}

function requireUpdatedByUID(
  value: string,
): string {
  const updatedByUID =
    value.trim();

  if (!updatedByUID) {
    throw new AppSettingsFirestoreServiceError(
      "missing-updated-by-uid",
      "The signed-in user identity is required.",
    );
  }

  return updatedByUID;
}

// MARK: - Errors

export class AppSettingsFirestoreServiceError
  extends Error {
  readonly code: string;

  readonly formErrors?:
    AppSettingsFormErrors;

  constructor(
    code: string,
    message: string,
    formErrors?: AppSettingsFormErrors,
  ) {
    super(message);

    this.name =
      "AppSettingsFirestoreServiceError";

    this.code =
      code;

    this.formErrors =
      formErrors;
  }
}

export function mapAppSettingsFirestoreError(
  error: unknown,
  fallbackMessage: string,
): AppSettingsFirestoreServiceError {
  if (
    error instanceof
    AppSettingsFirestoreServiceError
  ) {
    return error;
  }

  if (
    error instanceof
    AppSettingsValidationError
  ) {
    return new AppSettingsFirestoreServiceError(
      "validation-error",
      error.message,
      error.formErrors,
    );
  }

  const firebaseError =
    error as {
      code?: unknown;
      message?: unknown;
    };

  const code =
    typeof firebaseError.code ===
      "string"
      ? firebaseError.code
      : "";

  switch (code) {
    case "permission-denied":
    case "firestore/permission-denied":
      return new AppSettingsFirestoreServiceError(
        "permission-denied",
        "You do not have permission to manage App Settings for this business.",
      );

    case "unauthenticated":
    case "firestore/unauthenticated":
      return new AppSettingsFirestoreServiceError(
        "unauthenticated",
        "Sign in again before changing App Settings.",
      );

    case "not-found":
    case "firestore/not-found":
      return new AppSettingsFirestoreServiceError(
        "not-found",
        "App Settings could not be found for this business.",
      );

    case "unavailable":
    case "firestore/unavailable":
      return new AppSettingsFirestoreServiceError(
        "unavailable",
        "Firestore is temporarily unavailable. Check the connection and try again.",
      );

    case "deadline-exceeded":
    case "firestore/deadline-exceeded":
      return new AppSettingsFirestoreServiceError(
        "deadline-exceeded",
        "Saving App Settings took too long. Try again.",
      );

    case "aborted":
    case "firestore/aborted":
      return new AppSettingsFirestoreServiceError(
        "transaction-aborted",
        "App Settings changed while they were being saved. Try again.",
      );

    case "failed-precondition":
    case "firestore/failed-precondition":
      return new AppSettingsFirestoreServiceError(
        "failed-precondition",
        "Firestore is missing a required configuration for this operation.",
      );

    case "resource-exhausted":
    case "firestore/resource-exhausted":
      return new AppSettingsFirestoreServiceError(
        "resource-exhausted",
        "Firestore has reached a temporary usage limit. Try again later.",
      );

    default: {
      const message =
        typeof firebaseError.message ===
          "string" &&
        firebaseError.message.trim()
          ? firebaseError.message.trim()
          : fallbackMessage;

      return new AppSettingsFirestoreServiceError(
        "firestore-error",
        message,
      );
    }
  }
}