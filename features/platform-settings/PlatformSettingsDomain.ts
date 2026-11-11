/*
 * JCS Business Suite Web
 * PlatformSettingsDomain.ts
 *
 * Domain normalization and business rules for:
 *
 * - Global Platform Settings permissions.
 * - Platform information validation.
 * - Accent Color and language normalization.
 * - Firestore serialization.
 * - Firestore deserialization.
 * - Platform logo metadata preservation.
 *
 * These settings belong to JCS Business Suite itself.
 *
 * They are stored at:
 *
 * platformSettings/global
 *
 * React components, Firebase reads, Firebase writes and
 * Firebase Storage operations must not live in this file.
 */

import {
  APP_ACCENT_COLOR_VALUES,
  APP_LANGUAGE_VALUES,
  normalizeAppAccentColorName,
  normalizeAppLanguageCode,
} from "../app-settings/AppSettingsTypes";

import {
  DEFAULT_PLATFORM_SETTINGS_FORM_VALUES,
  EMPTY_PLATFORM_SETTINGS_FORM_ERRORS,
  PLATFORM_SETTINGS_DOCUMENT_ID,
  createDefaultPlatformSettingsRecord,
  createEmptyPlatformSettingsFormErrors,
} from "./PlatformSettingsTypes";

import type {
  PlatformSettingsAccessLevel,
  PlatformSettingsActor,
  PlatformSettingsFirestoreDocument,
  PlatformSettingsFormErrors,
  PlatformSettingsFormValues,
  PlatformSettingsPermissions,
  PlatformSettingsRecord,
  PlatformSettingsValidationResult,
  SavePlatformSettingsInput,
} from "./PlatformSettingsTypes";

// =======================================================
// MARK: - Constants
// =======================================================

export const PLATFORM_NAME_MAX_LENGTH =
  160;

export const PLATFORM_TAGLINE_MAX_LENGTH =
  240;

export const PLATFORM_SUPPORT_EMAIL_MAX_LENGTH =
  254;

export const PLATFORM_WEBSITE_URL_MAX_LENGTH =
  500;

export const PLATFORM_SETTINGS_ROLE_VALUES = {
  platformAdministrator:
    "platform-admin",

  platformOwner:
    "platform-owner",

  platformTeam:
    "platform-team",
} as const;

// =======================================================
// MARK: - Access Permissions
// =======================================================

/**
 * Only Platform Administrators with explicit global settings
 * authority can manage Platform Settings.
 *
 * Platform Settings are not business-scoped and therefore
 * never depend on:
 *
 * - businessID
 * - ownerUID
 * - business membership
 */
export function calculatePlatformSettingsPermissions(
  actor: PlatformSettingsActor,
): PlatformSettingsPermissions {
  const normalizedActor =
    normalizePlatformSettingsActor(
      actor,
    );

  const isPlatformAdministrator =
    normalizedActor
      .isPlatformAdministrator;

  const canManageSettings =
    isPlatformAdministrator &&
    normalizedActor
      .canManagePlatformSettings;

  const accessLevel:
    PlatformSettingsAccessLevel =
    canManageSettings
      ? "platform"
      : "none";

  return {
    accessLevel,

    isPlatformAdministrator,

    canViewSettings:
      canManageSettings,

    canManageSettings,

    canEditPlatformInformation:
      canManageSettings,

    canEditAppearance:
      canManageSettings,

    canUploadLogo:
      canManageSettings,

    canRestoreDefaultLogo:
      canManageSettings,
  };
}

export function normalizePlatformSettingsActor(
  actor: PlatformSettingsActor,
): PlatformSettingsActor {
  const role =
    normalizeRole(
      actor.role,
    );

  const isPlatformAdministrator =
    actor
      .isPlatformAdministrator ===
      true ||
    role ===
      PLATFORM_SETTINGS_ROLE_VALUES
        .platformAdministrator ||
    role ===
      PLATFORM_SETTINGS_ROLE_VALUES
        .platformOwner;

  return {
    firebaseUID:
      actor.firebaseUID.trim(),

    role,

    isPlatformAdministrator,

    /*
     * Platform Administrators receive global settings authority
     * by default.
     *
     * This field remains explicit so that future Platform Team
     * roles can be granted or denied this permission separately.
     */
    canManagePlatformSettings:
      isPlatformAdministrator ||
      actor
        .canManagePlatformSettings ===
        true,
  };
}

// =======================================================
// MARK: - Form Validation
// =======================================================

export function validatePlatformSettingsForm(
  values: PlatformSettingsFormValues,
): PlatformSettingsValidationResult {
  const normalizedValues =
    normalizePlatformSettingsFormValues(
      values,
    );

  const errors =
    createEmptyPlatformSettingsFormErrors();

  if (!normalizedValues.platformName) {
    errors.platformName =
      "Enter the platform name.";
  }

  if (
    normalizedValues
      .platformName
      .length >
    PLATFORM_NAME_MAX_LENGTH
  ) {
    errors.platformName =
      `The platform name cannot exceed ${PLATFORM_NAME_MAX_LENGTH} characters.`;
  }

  if (
    normalizedValues
      .tagline
      .length >
    PLATFORM_TAGLINE_MAX_LENGTH
  ) {
    errors.tagline =
      `The tagline cannot exceed ${PLATFORM_TAGLINE_MAX_LENGTH} characters.`;
  }

  if (
    normalizedValues.supportEmail &&
    !isValidPlatformSupportEmail(
      normalizedValues.supportEmail,
    )
  ) {
    errors.supportEmail =
      "Enter a valid support email address.";
  }

  if (
    normalizedValues.websiteURL &&
    !isValidPlatformWebsiteURL(
      normalizedValues.websiteURL,
    )
  ) {
    errors.websiteURL =
      "Enter a valid website URL.";
  }

  if (
    !APP_ACCENT_COLOR_VALUES.includes(
      normalizedValues
        .accentColorName,
    )
  ) {
    errors.accentColorName =
      "Choose a valid Accent Color.";
  }

  if (
    !APP_LANGUAGE_VALUES.includes(
      normalizedValues
        .languageCode,
    )
  ) {
    errors.languageCode =
      "Choose a valid language.";
  }

  if (
    hasPlatformSettingsFormErrors(
      errors,
    )
  ) {
    return {
      isValid:
        false,

      errors,
    };
  }

  return {
    isValid:
      true,

    normalizedValues,
  };
}

// =======================================================
// MARK: - Form Normalization
// =======================================================

export function normalizePlatformSettingsFormValues(
  values: PlatformSettingsFormValues,
): PlatformSettingsFormValues {
  return {
    platformName:
      normalizePlatformNameInput(
        values.platformName,
      ),

    tagline:
      normalizePlatformTaglineInput(
        values.tagline,
      ),

    supportEmail:
      normalizePlatformSupportEmail(
        values.supportEmail,
      ),

    websiteURL:
      normalizePlatformWebsiteURL(
        values.websiteURL,
      ),

    accentColorName:
      normalizeAppAccentColorName(
        values.accentColorName,
      ),

    languageCode:
      normalizeAppLanguageCode(
        values.languageCode,
      ),
  };
}

export function createPlatformSettingsFormValues(
  settings:
    PlatformSettingsRecord | null,
): PlatformSettingsFormValues {
  if (!settings) {
    return {
      ...DEFAULT_PLATFORM_SETTINGS_FORM_VALUES,
    };
  }

  return normalizePlatformSettingsFormValues({
    platformName:
      settings.platformName,

    tagline:
      settings.tagline,

    supportEmail:
      settings.supportEmail,

    websiteURL:
      settings.websiteURL,

    accentColorName:
      settings.accentColorName,

    languageCode:
      settings.languageCode,
  });
}

// =======================================================
// MARK: - Form Errors
// =======================================================

export function hasPlatformSettingsFormErrors(
  errors: PlatformSettingsFormErrors,
): boolean {
  return Object.values(
    errors,
  ).some(
    (message) =>
      message.trim().length > 0,
  );
}

export function clearPlatformSettingsFieldError(
  errors: PlatformSettingsFormErrors,
  fieldName:
    keyof PlatformSettingsFormErrors,
): PlatformSettingsFormErrors {
  if (!errors[fieldName]) {
    return errors;
  }

  return {
    ...errors,

    [fieldName]:
      "",
  };
}

export function mergePlatformSettingsFormErrors(
  currentErrors:
    PlatformSettingsFormErrors,

  newErrors:
    Partial<PlatformSettingsFormErrors>,
): PlatformSettingsFormErrors {
  return {
    ...currentErrors,
    ...newErrors,
  };
}

// =======================================================
// MARK: - Save Input Normalization
// =======================================================

export interface NormalizedSavePlatformSettingsInput {
  actor:
    PlatformSettingsActor;

  currentUserUID:
    string;

  formValues:
    PlatformSettingsFormValues;

  existingSettings:
    PlatformSettingsRecord | null;
}

export function normalizeSavePlatformSettingsInput(
  input: SavePlatformSettingsInput,
): NormalizedSavePlatformSettingsInput {
  const actor =
    normalizePlatformSettingsActor(
      input.actor,
    );

  const permissions =
    calculatePlatformSettingsPermissions(
      actor,
    );

  if (
    !permissions
      .canManageSettings
  ) {
    throw new PlatformSettingsDomainError(
      "permission-denied",
      "Only a Platform Administrator can manage global Platform Settings.",
    );
  }

  const currentUserUID =
    input.currentUserUID.trim() ||
    actor.firebaseUID;

  if (!currentUserUID) {
    throw new PlatformSettingsDomainError(
      "missing-user-id",
      "The signed-in Platform Administrator identity is required.",
    );
  }

  const validation =
    validatePlatformSettingsForm(
      input.formValues,
    );

  if (!validation.isValid) {
    throw new PlatformSettingsValidationError(
      "The Platform Settings form contains invalid information.",
      validation.errors,
    );
  }

  return {
    actor,

    currentUserUID,

    formValues:
      validation.normalizedValues,

    existingSettings:
      input.existingSettings ??
      null,
  };
}

// =======================================================
// MARK: - Record Creation
// =======================================================

export function createPlatformSettingsRecordFromSaveInput(
  input: {
    normalizedInput:
      NormalizedSavePlatformSettingsInput;
  },
): PlatformSettingsRecord {
  const {
    normalizedInput,
  } = input;

  const nowISO =
    new Date().toISOString();

  const baseRecord =
    normalizedInput
      .existingSettings ??
    createDefaultPlatformSettingsRecord({
      createdByUID:
        normalizedInput
          .currentUserUID,
    });

  return normalizePlatformSettingsRecord({
    ...baseRecord,

    id:
      PLATFORM_SETTINGS_DOCUMENT_ID,

    platformName:
      normalizedInput
        .formValues
        .platformName,

    tagline:
      normalizedInput
        .formValues
        .tagline,

    supportEmail:
      normalizedInput
        .formValues
        .supportEmail,

    websiteURL:
      normalizedInput
        .formValues
        .websiteURL,

    accentColorName:
      normalizedInput
        .formValues
        .accentColorName,

    languageCode:
      normalizedInput
        .formValues
        .languageCode,

    createdByUID:
      baseRecord.createdByUID ||
      normalizedInput
        .currentUserUID,

    updatedByUID:
      normalizedInput
        .currentUserUID,

    createdAtISO:
      baseRecord.createdAtISO ||
      nowISO,

    updatedAtISO:
      nowISO,
  });
}

// =======================================================
// MARK: - Logo Metadata
// =======================================================

export function applyPlatformLogoMetadata(
  settings: PlatformSettingsRecord,
  input: {
    logoStoragePath: string;
    logoDownloadURL: string;
    logoFileName: string;
    updatedByUID: string;
  },
): PlatformSettingsRecord {
  const logoStoragePath =
    input.logoStoragePath.trim();

  const logoDownloadURL =
    input.logoDownloadURL.trim();

  const logoFileName =
    input.logoFileName.trim();

  if (
    !logoStoragePath ||
    !logoDownloadURL
  ) {
    throw new PlatformSettingsDomainError(
      "invalid-logo-metadata",
      "The uploaded platform logo metadata is incomplete.",
    );
  }

  return normalizePlatformSettingsRecord({
    ...settings,

    logoStoragePath,

    logoDownloadURL,

    logoFileName,

    hasCustomLogo:
      true,

    updatedByUID:
      input.updatedByUID.trim() ||
      settings.updatedByUID,

    updatedAtISO:
      new Date().toISOString(),
  });
}

export function restoreDefaultPlatformLogo(
  settings: PlatformSettingsRecord,
  updatedByUID: string,
): PlatformSettingsRecord {
  return normalizePlatformSettingsRecord({
    ...settings,

    logoStoragePath:
      "",

    logoDownloadURL:
      "",

    logoFileName:
      "",

    hasCustomLogo:
      false,

    updatedByUID:
      updatedByUID.trim() ||
      settings.updatedByUID,

    updatedAtISO:
      new Date().toISOString(),
  });
}

// =======================================================
// MARK: - Firestore Serialization
// =======================================================

export function serializePlatformSettingsForFirestore(
  settings: PlatformSettingsRecord,
): PlatformSettingsFirestoreDocument {
  const normalizedRecord =
    normalizePlatformSettingsRecord(
      settings,
    );

  return {
    id:
      PLATFORM_SETTINGS_DOCUMENT_ID,

    platformName:
      normalizedRecord.platformName,

    tagline:
      normalizedRecord.tagline,

    supportEmail:
      normalizedRecord.supportEmail,

    websiteURL:
      normalizedRecord.websiteURL,

    accentColorName:
      normalizedRecord
        .accentColorName,

    languageCode:
      normalizedRecord
        .languageCode,

    logoStoragePath:
      normalizedRecord
        .logoStoragePath,

    logoDownloadURL:
      normalizedRecord
        .logoDownloadURL,

    logoFileName:
      normalizedRecord
        .logoFileName,

    hasCustomLogo:
      normalizedRecord
        .hasCustomLogo,

    createdByUID:
      normalizedRecord
        .createdByUID,

    updatedByUID:
      normalizedRecord
        .updatedByUID,

    createdAtISO:
      normalizedRecord
        .createdAtISO,

    updatedAtISO:
      normalizedRecord
        .updatedAtISO,
  };
}

// =======================================================
// MARK: - Firestore Deserialization
// =======================================================

export function deserializePlatformSettingsRecord(
  data:
    | Record<string, unknown>
    | undefined,
): PlatformSettingsRecord {
  if (!data) {
    return createDefaultPlatformSettingsRecord();
  }

  const defaultRecord =
    createDefaultPlatformSettingsRecord();

  return normalizePlatformSettingsRecord({
    id:
      readString(
        data.id,
      ) ||
      PLATFORM_SETTINGS_DOCUMENT_ID,

    platformName:
      readString(
        data.platformName,
      ) ||
      defaultRecord.platformName,

    tagline:
      readString(
        data.tagline,
      ) ||
      defaultRecord.tagline,

    supportEmail:
      readString(
        data.supportEmail,
      ),

    websiteURL:
      readString(
        data.websiteURL,
      ) ||
      defaultRecord.websiteURL,

    accentColorName:
      normalizeAppAccentColorName(
        data.accentColorName,
      ),

    languageCode:
      normalizeAppLanguageCode(
        data.languageCode,
      ),

    logoStoragePath:
      readString(
        data.logoStoragePath,
      ),

    logoDownloadURL:
      readString(
        data.logoDownloadURL,
      ),

    logoFileName:
      readString(
        data.logoFileName,
      ),

    hasCustomLogo:
      readBoolean(
        data.hasCustomLogo,
        Boolean(
          readString(
            data.logoDownloadURL,
          ),
        ),
      ),

    createdByUID:
      readString(
        data.createdByUID,
      ),

    updatedByUID:
      readString(
        data.updatedByUID,
      ),

    createdAtISO:
      readISODate(
        data.createdAtISO,
        defaultRecord.createdAtISO,
      ),

    updatedAtISO:
      readISODate(
        data.updatedAtISO,
        defaultRecord.updatedAtISO,
      ),
  });
}

// =======================================================
// MARK: - Record Normalization
// =======================================================

export function normalizePlatformSettingsRecord(
  settings: PlatformSettingsRecord,
): PlatformSettingsRecord {
  const logoStoragePath =
    settings.logoStoragePath.trim();

  const logoDownloadURL =
    settings.logoDownloadURL.trim();

  /*
   * A platform logo may come from either:
   *
   * - the official JCS logo collection, or
   * - a custom Platform Administrator upload.
   *
   * hasCustomLogo identifies only the second case.
   * Valid official logo metadata must still be preserved.
   */
  const hasPlatformLogo =
    Boolean(
      logoDownloadURL,
    );

  const hasCustomLogo =
    settings.hasCustomLogo ===
      true &&
    hasPlatformLogo;

  return {
    ...settings,

    id:
      PLATFORM_SETTINGS_DOCUMENT_ID,

    platformName:
      normalizePersistedPlatformName(
        settings.platformName,
      ),

    tagline:
      normalizePlatformTaglineInput(
        settings.tagline,
      ),

    supportEmail:
      normalizePlatformSupportEmail(
        settings.supportEmail,
      ),

    websiteURL:
      normalizePlatformWebsiteURL(
        settings.websiteURL,
      ),

    accentColorName:
      normalizeAppAccentColorName(
        settings.accentColorName,
      ),

    languageCode:
      normalizeAppLanguageCode(
        settings.languageCode,
      ),

    logoStoragePath:
      hasPlatformLogo
        ? logoStoragePath
        : "",

    logoDownloadURL:
      hasPlatformLogo
        ? logoDownloadURL
        : "",

    logoFileName:
      hasPlatformLogo
        ? settings
            .logoFileName
            .trim()
        : "",

    hasCustomLogo,

    createdByUID:
      settings
        .createdByUID
        .trim(),

    updatedByUID:
      settings
        .updatedByUID
        .trim(),

    createdAtISO:
      normalizeISODate(
        settings.createdAtISO,
      ),

    updatedAtISO:
      normalizeISODate(
        settings.updatedAtISO,
      ),
  };
}

// =======================================================
// MARK: - Dirty State
// =======================================================

export function arePlatformSettingsFormValuesEqual(
  first: PlatformSettingsFormValues,
  second: PlatformSettingsFormValues,
): boolean {
  const normalizedFirst =
    normalizePlatformSettingsFormValues(
      first,
    );

  const normalizedSecond =
    normalizePlatformSettingsFormValues(
      second,
    );

  return (
    normalizedFirst.platformName ===
      normalizedSecond.platformName &&
    normalizedFirst.tagline ===
      normalizedSecond.tagline &&
    normalizedFirst.supportEmail ===
      normalizedSecond.supportEmail &&
    normalizedFirst.websiteURL ===
      normalizedSecond.websiteURL &&
    normalizedFirst.accentColorName ===
      normalizedSecond.accentColorName &&
    normalizedFirst.languageCode ===
      normalizedSecond.languageCode
  );
}

// =======================================================
// MARK: - Platform Name
// =======================================================

export function normalizePlatformNameInput(
  value: string,
): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .slice(
      0,
      PLATFORM_NAME_MAX_LENGTH,
    );
}

export function normalizePersistedPlatformName(
  value: string,
): string {
  return (
    normalizePlatformNameInput(
      value,
    ) ||
    "JCS Business Suite"
  );
}

// =======================================================
// MARK: - Tagline
// =======================================================

export function normalizePlatformTaglineInput(
  value: string,
): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .slice(
      0,
      PLATFORM_TAGLINE_MAX_LENGTH,
    );
}

// =======================================================
// MARK: - Support Email
// =======================================================

export function normalizePlatformSupportEmail(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .slice(
      0,
      PLATFORM_SUPPORT_EMAIL_MAX_LENGTH,
    );
}

export function isValidPlatformSupportEmail(
  value: string,
): boolean {
  const normalizedEmail =
    normalizePlatformSupportEmail(
      value,
    );

  if (!normalizedEmail) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(
    normalizedEmail,
  );
}

// =======================================================
// MARK: - Website URL
// =======================================================

export function normalizePlatformWebsiteURL(
  value: string,
): string {
  const trimmedValue =
    value
      .trim()
      .slice(
        0,
        PLATFORM_WEBSITE_URL_MAX_LENGTH,
      );

  if (!trimmedValue) {
    return "";
  }

  if (
    /^https?:\/\//iu.test(
      trimmedValue,
    )
  ) {
    return trimmedValue;
  }

  return `https://${trimmedValue}`;
}

export function isValidPlatformWebsiteURL(
  value: string,
): boolean {
  const normalizedURL =
    normalizePlatformWebsiteURL(
      value,
    );

  if (!normalizedURL) {
    return true;
  }

  try {
    const parsedURL =
      new URL(
        normalizedURL,
      );

    return (
      (
        parsedURL.protocol ===
          "https:" ||
        parsedURL.protocol ===
          "http:"
      ) &&
      Boolean(
        parsedURL.hostname,
      )
    );
  } catch {
    return false;
  }
}

// =======================================================
// MARK: - Private Helpers
// =======================================================

function normalizeRole(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[\s_]+/g,
      "-",
    );
}

function normalizeISODate(
  value: string,
): string {
  return !Number.isNaN(
    Date.parse(
      value,
    ),
  )
    ? value
    : new Date().toISOString();
}

function readString(
  value: unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function readBoolean(
  value: unknown,
  fallback: boolean,
): boolean {
  return typeof value ===
    "boolean"
    ? value
    : fallback;
}

function readISODate(
  value: unknown,
  fallback: string,
): string {
  return (
    typeof value ===
      "string" &&
    !Number.isNaN(
      Date.parse(
        value,
      ),
    )
  )
    ? value
    : fallback;
}

// =======================================================
// MARK: - Errors
// =======================================================

export class PlatformSettingsDomainError
  extends Error {
  readonly code:
    string;

  constructor(
    code: string,
    message: string,
  ) {
    super(
      message,
    );

    this.name =
      "PlatformSettingsDomainError";

    this.code =
      code;
  }
}

export class PlatformSettingsValidationError
  extends PlatformSettingsDomainError {
  readonly formErrors:
    PlatformSettingsFormErrors;

  constructor(
    message: string,
    formErrors:
      PlatformSettingsFormErrors,
  ) {
    super(
      "validation-error",
      message,
    );

    this.name =
      "PlatformSettingsValidationError";

    this.formErrors = {
      ...EMPTY_PLATFORM_SETTINGS_FORM_ERRORS,
      ...formErrors,
    };
  }
}