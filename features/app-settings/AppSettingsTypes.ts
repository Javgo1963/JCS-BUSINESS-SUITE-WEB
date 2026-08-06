/*
 * JCS Business Suite Web
 * AppSettingsTypes.ts
 *
 * Shared contracts for:
 *
 * - Business App Settings
 * - Company information
 * - Localization
 * - Tax configuration
 * - Dashboard appearance
 * - Business branding
 * - Logo integration
 * - Firestore persistence
 * - Role-based access
 *
 * React components, hooks and Firebase operations
 * must not live in this file.
 */

import type {
  BusinessBrandingSettings,
  BusinessLogoRenderingMode,
  BusinessLogoSource,
} from "../business-branding/BusinessLogoTypes";

// MARK: - Languages

export const APP_LANGUAGE_VALUES = [
  "system",
  "en",
  "es",
] as const;

export type AppLanguageCode =
  (typeof APP_LANGUAGE_VALUES)[number];

export interface AppLanguageOption {
  code: AppLanguageCode;
  title: string;
  nativeTitle: string;
}

export const APP_LANGUAGE_OPTIONS: readonly AppLanguageOption[] = [
  {
    code: "system",
    title: "System Default",
    nativeTitle: "System Default",
  },
  {
    code: "en",
    title: "English",
    nativeTitle: "English",
  },
  {
    code: "es",
    title: "Spanish",
    nativeTitle: "Español",
  },
] as const;

// MARK: - Accent Colors

export const APP_ACCENT_COLOR_VALUES = [
  "blue",
  "sky",
  "aqua",
  "teal",
  "mint",
  "green",
  "lime",
  "olive",

  "yellow",
  "gold",
  "sand",
  "orange",
  "peach",
  "coral",
  "red",
  "rose",
  "pink",

  "purple",
  "violet",
  "indigo",
  "lavender",
  "plum",

  "slate",
  "gray",
  "charcoal",
  "black",
  "white",

  "silver",
  "chrome",
  "platinum",
  "steel",
  "titanium",

  "bronze",
  "copper",
  "roseGold",
  "champagne",
  "brass",

  "emerald",
  "sapphire",
  "ruby",
  "amethyst",
  "onyx",

  "midnight",
  "ocean",
  "forest",
  "sunset",
  "fire",
  "ice",

  "liquidGlass",
] as const;

export type AppAccentColorName =
  (typeof APP_ACCENT_COLOR_VALUES)[number];

export interface AppAccentColorOption {
  name: AppAccentColorName;
  title: string;

  /**
   * CSS-ready color or gradient used by previews.
   *
   * The main application theme can later centralize these
   * values inside BrandTheme or CSS variables.
   */
  preview: string;

  /**
   * Whether the option is best presented with dark text.
   */
  prefersDarkForeground: boolean;
}

// MARK: - Settings Access

export const APP_SETTINGS_ACCESS_LEVEL_VALUES = [
  "none",
  "read",
  "manage",
  "platform",
] as const;

export type AppSettingsAccessLevel =
  (typeof APP_SETTINGS_ACCESS_LEVEL_VALUES)[number];

 export const APP_SETTINGS_MODULE_KEY =
  "app-settings";

export const APP_SETTINGS_PERMISSION_VALUES = {
  view:
    "view-app-settings",

  manage:
    "manage-app-settings",

  editCompanyInformation:
    "edit-company-information",

  editAppearance:
    "edit-app-appearance",

  editFinancialConfiguration:
    "edit-financial-configuration",

  manageBranding:
    "manage-business-branding",
} as const;

export type AppSettingsPermission =
  (typeof APP_SETTINGS_PERMISSION_VALUES)[
    keyof typeof APP_SETTINGS_PERMISSION_VALUES
  ]; 

export interface AppSettingsActor {
  /*
   * Firebase Authentication identity.
   */
  firebaseUID: string;

  /*
   * Business-scoped identity.
   *
   * These values may be empty for a Platform Administrator
   * operating in the global platform context.
   */
  businessID: string;
  ownerUID: string;

  role: string;

  /*
   * Global platform authority.
   *
   * Platform Administrators do not require a personal
   * businessID or ownerUID.
   */
  isPlatformAdministrator: boolean;

  /*
   * Business-scoped ownership.
   */
  isBusinessOwner: boolean;
  isBusinessAdministrator: boolean;

  /*
   * Explicit module assignment.
   *
   * Business Owners and Platform Administrators receive access
   * independently of this value.
   *
   * Business team members require this module assignment.
   */
  hasAppSettingsModule: boolean;

  /*
   * Explicit permission granted by the Business Owner.
   *
   * This permission does not grant access by itself unless the
   * user also has the App Settings module.
   */
  canManageSettings: boolean;
}

export interface AppSettingsPermissions {
  accessLevel: AppSettingsAccessLevel;

  /*
   * Access source information.
   */
  isPlatformAccess: boolean;
  isBusinessOwnerAccess: boolean;
  isExplicitlyGrantedAccess: boolean;

  /*
   * General visibility and management.
   */
  canViewSettings: boolean;
  canManageSettings: boolean;

  /*
   * Business configuration.
   */
  canEditCompanyInformation: boolean;
  canEditTaxConfiguration: boolean;
  canEditLanguage: boolean;
  canEditAccentColor: boolean;

  /*
   * Branding.
   */
  canGeneratePremiumLogo: boolean;
  canUploadLogo: boolean;
  canRestoreDefaultLogo: boolean;
  canChangeLogoRenderingPreference: boolean;

  /*
   * Platform-controlled maintenance operation.
   */
  canResetDemoBusiness: boolean;
}

// MARK: - Company Information

export interface AppSettingsCompanyInformation {
  companyName: string;

  addressLine1: string;
  addressLine2: string;

  phone: string;
  email: string;

  fullAddress: string;
}

// MARK: - Financial Configuration

export interface AppSettingsFinancialConfiguration {
  taxPercent: number;
}

// MARK: - Localization

export interface AppSettingsLocalization {
  languageCode: AppLanguageCode;
}

// MARK: - Appearance

export interface AppSettingsAppearance {
  accentColorName: AppAccentColorName;
}

// MARK: - Branding

/**
 * App Settings branding model.
 *
 * It mirrors the business-branding domain while keeping
 * AppSettingsView independent from Storage implementation.
 */
export interface AppSettingsBranding {
  activeLogoID: string;
  activeLogoSource: BusinessLogoSource;

  logoStoragePath: string;
  logoDownloadURL: string;

  logoRenderingMode: BusinessLogoRenderingMode;
  logoSupportsAccentColor: boolean;
  useAccentColorForLogo: boolean;
}

// MARK: - Cloud Synchronization

export interface AppSettingsCloudSynchronization {
  firebaseDocumentID: string;

  needsCloudSync: boolean;
  lastCloudSyncISO: string | null;
}

// MARK: - Audit

export interface AppSettingsAuditInformation {
  createdAtISO: string;
  updatedAtISO: string;

  createdByUID: string;
  updatedByUID: string;
}

// MARK: - Persisted App Settings

/**
 * Complete business-scoped App Settings record.
 *
 * One record exists per business:
 *
 * businessSettings/{businessID}
 */
export interface AppSettingsRecord
  extends AppSettingsCompanyInformation,
    AppSettingsFinancialConfiguration,
    AppSettingsLocalization,
    AppSettingsAppearance,
    AppSettingsBranding,
    AppSettingsCloudSynchronization,
    AppSettingsAuditInformation {
  id: string;

  businessID: string;
  ownerUID: string;

  backgroundStoragePath: string;
  backgroundDownloadURL: string;
}

// MARK: - Firestore Document

/**
 * Firestore-compatible shape.
 *
 * Server timestamps may be stored alongside the ISO values by
 * AppSettingsFirestoreService.
 */
export interface AppSettingsFirestoreDocument {
  id: string;

  businessID: string;
  ownerUID: string;

  createdByUID: string;
  updatedByUID: string;

  companyName: string;

  addressLine1: string;
  addressLine2: string;

  phone: string;
  email: string;

  taxPercent: number;

  languageCode: AppLanguageCode;
  accentColorName: AppAccentColorName;

  activeLogoID: string;
  activeLogoSource: BusinessLogoSource;

  logoStoragePath: string;
  logoDownloadURL: string;

  logoRenderingMode: BusinessLogoRenderingMode;
  logoSupportsAccentColor: boolean;
  useAccentColorForLogo: boolean;

  backgroundStoragePath: string;
  backgroundDownloadURL: string;

  firebaseDocumentID: string;

  needsCloudSync: boolean;
  lastCloudSyncISO: string | null;

  createdAtISO: string;
  updatedAtISO: string;

  /**
   * Firestore Timestamp or FieldValue values are added by
   * the persistence service.
   */
  createdAt?: unknown;
  updatedAt?: unknown;
  lastCloudSyncAt?: unknown;
}

// MARK: - Form Values

/**
 * Editable values used by AppSettingsView.
 *
 * Branding persistence remains coordinated by useBusinessLogo.
 */
export interface AppSettingsFormValues {
  companyName: string;

  addressLine1: string;
  addressLine2: string;

  phone: string;
  email: string;

  taxPercentText: string;

  languageCode: AppLanguageCode;
  accentColorName: AppAccentColorName;
}

// MARK: - Form Errors

export interface AppSettingsFormErrors {
  companyName: string;

  addressLine1: string;
  addressLine2: string;

  phone: string;
  email: string;

  taxPercent: string;

  languageCode: string;
  accentColorName: string;

  general: string;
}

// MARK: - Validation

export type AppSettingsValidationResult =
  | {
      isValid: true;
      normalizedValues: AppSettingsFormValues;
      taxPercent: number;
    }
  | {
      isValid: false;
      errors: AppSettingsFormErrors;
    };

// MARK: - Save Input

export interface SaveAppSettingsInput {
  businessID: string;
  ownerUID: string;

  createdByUID: string;
  updatedByUID: string;

  formValues: AppSettingsFormValues;

  /**
   * Branding can be supplied by useBusinessLogo so saving
   * company information never removes the active logo fields.
   */
  branding?: BusinessBrandingSettings | null;
}

// MARK: - Update Company Information Input

export interface UpdateAppSettingsCompanyInformationInput {
  businessID: string;
  updatedByUID: string;

  companyName: string;

  addressLine1: string;
  addressLine2: string;

  phone: string;
  email: string;
}

// MARK: - Update Financial Input

export interface UpdateAppSettingsTaxInput {
  businessID: string;
  updatedByUID: string;

  taxPercent: number;
}

// MARK: - Update Localization Input

export interface UpdateAppSettingsLanguageInput {
  businessID: string;
  updatedByUID: string;

  languageCode: AppLanguageCode;
}

// MARK: - Update Appearance Input

export interface UpdateAppSettingsAppearanceInput {
  businessID: string;
  updatedByUID: string;

  accentColorName: AppAccentColorName;
}

// MARK: - Hook UI State

export interface AppSettingsUIState {
  isLoading: boolean;
  isSaving: boolean;
  isResettingDemo: boolean;

  hasLoaded: boolean;
  isDirty: boolean;

  errorMessage: string;
  successMessage: string;

  formValues: AppSettingsFormValues;
  formErrors: AppSettingsFormErrors;
}

// MARK: - Hook Operation Result

export type AppSettingsOperationResult =
  | {
      success: true;
      settings: AppSettingsRecord;
    }
  | {
      success: false;
      errorMessage: string;
      errors?: AppSettingsFormErrors;
    };

// MARK: - Demo Business

export interface ResetDemoBusinessInput {
  businessID: string;
  requestedByUID: string;
}

export type ResetDemoBusinessResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      errorMessage: string;
    };

// MARK: - Defaults

export const DEFAULT_APP_SETTINGS_FORM_VALUES: AppSettingsFormValues = {
  companyName: "My Business",

  addressLine1: "",
  addressLine2: "",

  phone: "",
  email: "",

  taxPercentText: "0",

  languageCode: "system",
  accentColorName: "blue",
};

export const EMPTY_APP_SETTINGS_FORM_ERRORS: AppSettingsFormErrors = {
  companyName: "",

  addressLine1: "",
  addressLine2: "",

  phone: "",
  email: "",

  taxPercent: "",

  languageCode: "",
  accentColorName: "",

  general: "",
};

export const EMPTY_APP_SETTINGS_UI_STATE: AppSettingsUIState = {
  isLoading: false,
  isSaving: false,
  isResettingDemo: false,

  hasLoaded: false,
  isDirty: false,

  errorMessage: "",
  successMessage: "",

  formValues: {
    ...DEFAULT_APP_SETTINGS_FORM_VALUES,
  },

  formErrors: {
    ...EMPTY_APP_SETTINGS_FORM_ERRORS,
  },
};

// MARK: - Type Guards

export function isAppLanguageCode(
  value: unknown,
): value is AppLanguageCode {
  return (
    typeof value === "string" &&
    APP_LANGUAGE_VALUES.includes(
      value as AppLanguageCode,
    )
  );
}

export function isAppAccentColorName(
  value: unknown,
): value is AppAccentColorName {
  return (
    typeof value === "string" &&
    APP_ACCENT_COLOR_VALUES.includes(
      value as AppAccentColorName,
    )
  );
}

export function isAppSettingsAccessLevel(
  value: unknown,
): value is AppSettingsAccessLevel {
  return (
    typeof value === "string" &&
    APP_SETTINGS_ACCESS_LEVEL_VALUES.includes(
      value as AppSettingsAccessLevel,
    )
  );
}

// MARK: - Safe Factories

export function createEmptyAppSettingsFormValues(
  overrides: Partial<AppSettingsFormValues> = {},
): AppSettingsFormValues {
  return {
    ...DEFAULT_APP_SETTINGS_FORM_VALUES,
    ...overrides,
  };
}

export function createEmptyAppSettingsFormErrors(): AppSettingsFormErrors {
  return {
    ...EMPTY_APP_SETTINGS_FORM_ERRORS,
  };
}

export function createDefaultAppSettingsRecord(
  input: {
    businessID: string;
    ownerUID: string;
    createdByUID: string;

    companyName?: string;
  },
): AppSettingsRecord {
  const nowISO =
    new Date().toISOString();

  const businessID =
    input.businessID.trim();

  const ownerUID =
    input.ownerUID.trim();

  const createdByUID =
    input.createdByUID.trim();

  const companyName =
    normalizeSimpleText(
      input.companyName,
      "My Business",
      160,
    );

  return {
    id:
      businessID,

    businessID,
    ownerUID,

    createdByUID,
    updatedByUID:
      createdByUID,

    companyName,

    addressLine1: "",
    addressLine2: "",

    phone: "",
    email: "",

    fullAddress: "",

    taxPercent:
      0,

    languageCode:
      "system",

    accentColorName:
      "blue",

    activeLogoID:
      "",

    activeLogoSource:
      "default",

    logoStoragePath:
      "",

    logoDownloadURL:
      "/branding/jcs-business-suite-logo.svg",

    logoRenderingMode:
      "template",

    logoSupportsAccentColor:
      true,

    useAccentColorForLogo:
      true,

    backgroundStoragePath:
      "",

    backgroundDownloadURL:
      "",

    firebaseDocumentID:
      businessID,

    needsCloudSync:
      false,

    lastCloudSyncISO:
      null,

    createdAtISO:
      nowISO,

    updatedAtISO:
      nowISO,
  };
}

// MARK: - Shared Normalization

export function normalizeAppLanguageCode(
  value: unknown,
): AppLanguageCode {
  if (
    isAppLanguageCode(value)
  ) {
    return value;
  }

  return "system";
}

export function normalizeAppAccentColorName(
  value: unknown,
): AppAccentColorName {
  if (
    isAppAccentColorName(value)
  ) {
    return value;
  }

  return "blue";
}

export function normalizeAppSettingsAccessLevel(
  value: unknown,
): AppSettingsAccessLevel {
  if (
    isAppSettingsAccessLevel(value)
  ) {
    return value;
  }

  return "none";
}

export function normalizeTaxPercent(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(
    Math.max(value, 0),
    100,
  );
}

export function createFullBusinessAddress(
  addressLine1: string,
  addressLine2: string,
): string {
  return [
    addressLine1.trim(),
    addressLine2.trim(),
  ]
    .filter(Boolean)
    .join(", ");
}

function normalizeSimpleText(
  value: string | undefined,
  fallback: string,
  maximumLength: number,
): string {
  const normalizedValue =
    value
      ?.trim()
      .replace(/\s+/g, " ")
      .slice(
        0,
        maximumLength,
      ) ?? "";

  return normalizedValue ||
    fallback;
}