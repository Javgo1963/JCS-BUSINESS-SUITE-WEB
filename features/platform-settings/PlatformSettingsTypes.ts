/*
 * JCS Business Suite Web
 * PlatformSettingsTypes.ts
 *
 * Shared types and constants for global platform settings.
 *
 * These settings belong to JCS Business Suite itself.
 *
 * They are not business tenant settings and therefore do not use:
 *
 * - businessID
 * - ownerUID
 * - businessSettings/{businessID}
 *
 * Global platform settings are stored at:
 *
 * platformSettings/global
 */

import type {
  AppAccentColorName,
  AppLanguageCode,
} from "../app-settings/AppSettingsTypes";

import type {
  JCSScreenBackgroundID,
} from "../../components/layout/JCSScreenBackground";

// =======================================================
// MARK: - Firestore
// =======================================================

export const PLATFORM_SETTINGS_COLLECTION =
  "platformSettings";

export const PLATFORM_SETTINGS_DOCUMENT_ID =
  "global";

// =======================================================
// MARK: - Storage
// =======================================================

export const PLATFORM_LOGO_STORAGE_DIRECTORY =
  "platform/global";

export const PLATFORM_LOGO_STORAGE_FILE_NAME =
  "logo.png";

export const PLATFORM_LOGO_STORAGE_PATH =
  `${PLATFORM_LOGO_STORAGE_DIRECTORY}/${PLATFORM_LOGO_STORAGE_FILE_NAME}`;

// =======================================================
// MARK: - Access
// =======================================================

export interface PlatformSettingsActor {
  firebaseUID: string;

  role: string;

  isPlatformAdministrator: boolean;

  canManagePlatformSettings: boolean;
}

export type PlatformSettingsAccessLevel =
  | "none"
  | "platform";

export interface PlatformSettingsPermissions {
  accessLevel:
    PlatformSettingsAccessLevel;

  isPlatformAdministrator:
    boolean;

  canViewSettings:
    boolean;

  canManageSettings:
    boolean;

  canEditPlatformInformation:
    boolean;

  canEditAppearance:
    boolean;

  canUploadLogo:
    boolean;

  canRestoreDefaultLogo:
    boolean;
}

// =======================================================
// MARK: - Platform Information
// =======================================================

export interface PlatformInformation {
  platformName: string;

  tagline: string;

  supportEmail: string;

  websiteURL: string;
}

// =======================================================
// MARK: - Platform Appearance
// =======================================================

export interface PlatformAppearance {
  accentColorName:
    AppAccentColorName;

  languageCode:
    AppLanguageCode;

  backgroundID:
    JCSScreenBackgroundID;

  logoStoragePath:
    string;

  logoDownloadURL:
    string;

  logoFileName:
    string;

  hasCustomLogo:
    boolean;
}

// =======================================================
// MARK: - Platform Settings Record
// =======================================================

export interface PlatformSettingsRecord
  extends
    PlatformInformation,
    PlatformAppearance {
  id: string;

  createdByUID: string;
  updatedByUID: string;

  createdAtISO: string;
  updatedAtISO: string;
}

// =======================================================
// MARK: - Firestore Document
// =======================================================

export interface PlatformSettingsFirestoreDocument {
  id: string;

  platformName: string;

  tagline: string;

  supportEmail: string;

  websiteURL: string;

  accentColorName:
    AppAccentColorName;

  languageCode:
    AppLanguageCode;

  backgroundID:
    JCSScreenBackgroundID;

  logoStoragePath: string;
  logoDownloadURL: string;
  logoFileName: string;

  hasCustomLogo: boolean;

  createdByUID: string;
  updatedByUID: string;

  createdAtISO: string;
  updatedAtISO: string;
}

// =======================================================
// MARK: - Form
// =======================================================

export interface PlatformSettingsFormValues {
  platformName: string;

  tagline: string;

  supportEmail: string;

  websiteURL: string;

  accentColorName:
    AppAccentColorName;

  languageCode:
    AppLanguageCode;

  backgroundID:
    JCSScreenBackgroundID;
}

export interface PlatformSettingsFormErrors {
  platformName: string;

  tagline: string;

  supportEmail: string;

  websiteURL: string;

  accentColorName: string;

  languageCode: string;

  backgroundID: string;
}

export interface PlatformSettingsValidationSuccess {
  isValid: true;

  normalizedValues:
    PlatformSettingsFormValues;
}

export interface PlatformSettingsValidationFailure {
  isValid: false;

  errors:
    PlatformSettingsFormErrors;
}

export type PlatformSettingsValidationResult =
  | PlatformSettingsValidationSuccess
  | PlatformSettingsValidationFailure;

// =======================================================
// MARK: - Save Input
// =======================================================

export interface SavePlatformSettingsInput {
  actor:
    PlatformSettingsActor;

  currentUserUID:
    string;

  formValues:
    PlatformSettingsFormValues;

  existingSettings?:
    PlatformSettingsRecord | null;
}

// =======================================================
// MARK: - Logo Upload
// =======================================================

export interface UploadPlatformLogoInput {
  actor:
    PlatformSettingsActor;

  currentUserUID:
    string;

  file:
    File;
}

export interface UploadPlatformLogoResult {
  logoStoragePath:
    string;

  logoDownloadURL:
    string;

  logoFileName:
    string;
}

// =======================================================
// MARK: - Service Results
// =======================================================

export interface PlatformSettingsSuccessResult {
  success: true;

  settings:
    PlatformSettingsRecord;
}

export interface PlatformSettingsFailureResult {
  success: false;

  errorMessage: string;
}

export type PlatformSettingsResult =
  | PlatformSettingsSuccessResult
  | PlatformSettingsFailureResult;

// =======================================================
// MARK: - Defaults
// =======================================================

export const DEFAULT_PLATFORM_SETTINGS_FORM_VALUES:
  PlatformSettingsFormValues = {
    platformName:
      "JCS Business Suite",

    tagline:
      "One Platform | Every Business | Endless Possibilities",

    supportEmail:
      "",

    websiteURL:
      "https://www.jcsbusinesssuite.com",

    accentColorName:
      "copper",

    languageCode:
      "en",

    backgroundID:
      "default",
  };

export const EMPTY_PLATFORM_SETTINGS_FORM_ERRORS:
  PlatformSettingsFormErrors = {
    platformName:
      "",

    tagline:
      "",

    supportEmail:
      "",

    websiteURL:
      "",

    accentColorName:
      "",

    languageCode:
      "",

    backgroundID:
      "",
  };

// =======================================================
// MARK: - Default Record
// =======================================================

export function createDefaultPlatformSettingsRecord(
  input?: {
    createdByUID?: string;
  },
): PlatformSettingsRecord {
  const nowISO =
    new Date().toISOString();

  const createdByUID =
    input?.createdByUID
      ?.trim() ??
    "";

  return {
    id:
      PLATFORM_SETTINGS_DOCUMENT_ID,

    ...DEFAULT_PLATFORM_SETTINGS_FORM_VALUES,

    logoStoragePath:
      "",

    logoDownloadURL:
      "",

    logoFileName:
      "",

    hasCustomLogo:
      false,

    createdByUID,

    updatedByUID:
      createdByUID,

    createdAtISO:
      nowISO,

    updatedAtISO:
      nowISO,
  };
}

// =======================================================
// MARK: - Empty Errors
// =======================================================

export function createEmptyPlatformSettingsFormErrors():
  PlatformSettingsFormErrors {
  return {
    ...EMPTY_PLATFORM_SETTINGS_FORM_ERRORS,
  };
}