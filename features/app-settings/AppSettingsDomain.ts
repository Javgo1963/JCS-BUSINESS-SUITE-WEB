/*
 * JCS Business Suite Web
 * AppSettingsDomain.ts
 *
 * Domain normalization and business rules for:
 *
 * - App Settings access permissions.
 * - Company information validation.
 * - Phone and email normalization.
 * - Tax percentage validation.
 * - Language and Accent Color validation.
 * - Form-state creation.
 * - Firestore document normalization.
 * - Branding preservation.
 *
 * React components and Firebase operations must not live here.
 */

import {
  DEFAULT_BUSINESS_LOGO_ASSET_PATH,
  DEFAULT_BUSINESS_LOGO_SUPPORTS_ACCENT_COLOR,
  DEFAULT_BUSINESS_LOGO_USES_ACCENT_COLOR,
} from "../business-branding/BusinessLogoConstants";

import {
  createBusinessBrandingSettings,
  normalizeBusinessLogoRenderingMode,
  normalizeBusinessLogoSource,
} from "../business-branding/BusinessLogoDomain";

import {
  APP_ACCENT_COLOR_VALUES,
  APP_LANGUAGE_VALUES,
  DEFAULT_APP_SETTINGS_FORM_VALUES,
  EMPTY_APP_SETTINGS_FORM_ERRORS,
  createDefaultAppSettingsRecord,
  createEmptyAppSettingsFormErrors,
  createFullBusinessAddress,
  normalizeAppAccentColorName,
  normalizeAppLanguageCode,
  normalizeTaxPercent,
} from "./AppSettingsTypes";

import type {
  AppAccentColorName,
  AppLanguageCode,
  AppSettingsAccessLevel,
  AppSettingsActor,
  AppSettingsBranding,
  AppSettingsCompanyInformation,
  AppSettingsFinancialConfiguration,
  AppSettingsFirestoreDocument,
  AppSettingsFormErrors,
  AppSettingsFormValues,
  AppSettingsPermissions,
  AppSettingsRecord,
  AppSettingsValidationResult,
  SaveAppSettingsInput,
} from "./AppSettingsTypes";

import type {
  BusinessBrandingSettings,
  BusinessLogoRenderingMode,
  BusinessLogoSource,
} from "../business-branding/BusinessLogoTypes";

import {
  normalizeJCSScreenBackgroundID,
} from "../../components/layout/JCSScreenBackground";

// MARK: - Constants

export const APP_SETTINGS_COMPANY_NAME_MAX_LENGTH =
  160;

export const APP_SETTINGS_ADDRESS_MAX_LENGTH =
  180;

export const APP_SETTINGS_PHONE_MAX_LENGTH =
  24;

export const APP_SETTINGS_EMAIL_MAX_LENGTH =
  254;

export const APP_SETTINGS_TAX_DECIMAL_PLACES =
  4;

export const APP_SETTINGS_ROLE_VALUES = {
  platformAdministrator:
    "platform-admin",

  businessOwner:
    "business-owner",

  businessAdministrator:
    "admin",

  manager:
    "manager",

  employee:
    "employee",

  customer:
    "customer",

  provider:
    "provider",
} as const;

// MARK: - Access Permissions

/**
 * Platform Administrators have complete platform authority.
 *
 * Business Owners automatically manage App Settings for their
 * own business.
 *
 * Business team members require both:
 *
 * - The App Settings module.
 * - Explicit permission to manage App Settings.
 *
 * Customers and other users receive no access by default.
 */
export function calculateAppSettingsPermissions(
  actor: AppSettingsActor,
  targetBusinessID: string,
): AppSettingsPermissions {
  const normalizedActor =
    normalizeAppSettingsActor(
      actor,
    );

  const cleanTargetBusinessID =
    targetBusinessID.trim();

  const isPlatformAdministrator =
    normalizedActor
      .isPlatformAdministrator;

  const belongsToTargetBusiness =
    Boolean(
      cleanTargetBusinessID &&
      normalizedActor.businessID &&
      normalizedActor.businessID ===
        cleanTargetBusinessID,
    );

  const isBusinessOwner =
    belongsToTargetBusiness &&
    normalizedActor
      .isBusinessOwner;

  const hasExplicitlyGrantedAccess =
    belongsToTargetBusiness &&
    normalizedActor
      .hasAppSettingsModule &&
    normalizedActor
      .canManageSettings;

  const accessLevel:
    AppSettingsAccessLevel =
    isPlatformAdministrator
      ? "platform"
      : isBusinessOwner
        ? "manage"
        : hasExplicitlyGrantedAccess
          ? "manage"
          : "none";

  const canManage =
    accessLevel === "platform" ||
    accessLevel === "manage";

  return {
    accessLevel,

    isPlatformAccess:
      accessLevel === "platform",

    isBusinessOwnerAccess:
      isBusinessOwner,

    isExplicitlyGrantedAccess:
      hasExplicitlyGrantedAccess,

    canViewSettings:
      accessLevel !== "none",

    canManageSettings:
      canManage,

    canEditCompanyInformation:
      canManage,

    canEditTaxConfiguration:
      canManage,

    canEditLanguage:
      canManage,

    canEditAccentColor:
      canManage,

    canGeneratePremiumLogo:
      canManage,

    canUploadLogo:
      canManage,

    canRestoreDefaultLogo:
      canManage,

    canChangeLogoRenderingPreference:
      canManage,

    canResetDemoBusiness:
      isPlatformAdministrator ||
      (
        canManage &&
        cleanTargetBusinessID ===
          "DEMO-BUSINESS-001"
      ),
  };
}
export function normalizeAppSettingsActor(
  actor: AppSettingsActor,
): AppSettingsActor {
  const role =
    normalizeRole(
      actor.role,
    );

  const isPlatformAdministrator =
    actor
      .isPlatformAdministrator ===
      true ||
    role ===
      APP_SETTINGS_ROLE_VALUES
        .platformAdministrator;

  const isBusinessOwner =
    actor.isBusinessOwner ===
      true ||
    role ===
      APP_SETTINGS_ROLE_VALUES
        .businessOwner;

  const isBusinessAdministrator =
    actor
      .isBusinessAdministrator ===
      true ||
    role ===
      APP_SETTINGS_ROLE_VALUES
        .businessAdministrator;

  return {
    firebaseUID:
      actor.firebaseUID.trim(),

    businessID:
      actor.businessID.trim(),

    ownerUID:
      actor.ownerUID.trim(),

    role,

    isPlatformAdministrator,

    isBusinessOwner,

    isBusinessAdministrator,

    /*
     * Platform Administrators and Business Owners always receive
     * the App Settings module for their applicable context.
     *
     * Other users depend on explicit module assignment.
     */
    hasAppSettingsModule:
      isPlatformAdministrator ||
      isBusinessOwner ||
      actor.hasAppSettingsModule ===
        true,

    /*
     * Platform Administrators and Business Owners always have
     * management authority.
     *
     * Business team members depend on explicit permission.
     */
    canManageSettings:
      isPlatformAdministrator ||
      isBusinessOwner ||
      actor.canManageSettings ===
        true,
  };
}

// MARK: - Form Validation

export function validateAppSettingsForm(
  values: AppSettingsFormValues,
): AppSettingsValidationResult {
  const normalizedValues =
    normalizeAppSettingsFormValues(
      values,
    );

  const errors =
    createEmptyAppSettingsFormErrors();

  if (
    !normalizedValues.companyName
  ) {
    errors.companyName =
      "Enter the company name.";
  }

  if (
    normalizedValues.companyName.length >
    APP_SETTINGS_COMPANY_NAME_MAX_LENGTH
  ) {
    errors.companyName =
      `The company name cannot exceed ${APP_SETTINGS_COMPANY_NAME_MAX_LENGTH} characters.`;
  }

  if (
    normalizedValues.addressLine1.length >
    APP_SETTINGS_ADDRESS_MAX_LENGTH
  ) {
    errors.addressLine1 =
      `Address Line 1 cannot exceed ${APP_SETTINGS_ADDRESS_MAX_LENGTH} characters.`;
  }

  if (
    normalizedValues.addressLine2.length >
    APP_SETTINGS_ADDRESS_MAX_LENGTH
  ) {
    errors.addressLine2 =
      `Address Line 2 cannot exceed ${APP_SETTINGS_ADDRESS_MAX_LENGTH} characters.`;
  }

  if (
    normalizedValues.phone &&
    !isValidBusinessPhone(
      normalizedValues.phone,
    )
  ) {
    errors.phone =
      "Enter a valid phone number.";
  }

  if (
    normalizedValues.email &&
    !isValidBusinessEmail(
      normalizedValues.email,
    )
  ) {
    errors.email =
      "Enter a valid email address.";
  }

  if (
    !APP_LANGUAGE_VALUES.includes(
      normalizedValues.languageCode,
    )
  ) {
    errors.languageCode =
      "Choose a valid language.";
  }

  if (
    !APP_ACCENT_COLOR_VALUES.includes(
      normalizedValues.accentColorName,
    )
  ) {
    errors.accentColorName =
      "Choose a valid Accent Color.";
  }

  const parsedTaxResult =
    parseTaxPercentText(
      normalizedValues.taxPercentText,
    );

  if (!parsedTaxResult.isValid) {
    errors.taxPercent =
      parsedTaxResult.errorMessage;
  }

  if (
    hasAppSettingsFormErrors(
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

    taxPercent:
      parsedTaxResult.value,
  };
}

// MARK: - Form Normalization

export function normalizeAppSettingsFormValues(
  values: AppSettingsFormValues,
): AppSettingsFormValues {
  return {
    companyName:
      normalizeCompanyNameInput(
        values.companyName,
      ),

    addressLine1:
      normalizeAddressInput(
        values.addressLine1,
      ),

    addressLine2:
      normalizeAddressInput(
        values.addressLine2,
      ),

    phone:
      normalizePhoneInput(
        values.phone,
      ),

    email:
      normalizeEmailInput(
        values.email,
      ),

    taxPercentText:
      normalizeTaxPercentText(
        values.taxPercentText,
      ),

    languageCode:
      normalizeAppLanguageCode(
        values.languageCode,
      ),

    accentColorName:
      normalizeAppAccentColorName(
        values.accentColorName,
      ),

    backgroundID:
      normalizeJCSScreenBackgroundID(
        values.backgroundID,
      ),
  };
}

export function createAppSettingsFormValues(
  settings: AppSettingsRecord | null,
): AppSettingsFormValues {
  if (!settings) {
    return {
      ...DEFAULT_APP_SETTINGS_FORM_VALUES,
    };
  }

  return normalizeAppSettingsFormValues({
    companyName:
      settings.companyName,

    addressLine1:
      settings.addressLine1,

    addressLine2:
      settings.addressLine2,

    phone:
      settings.phone,

    email:
      settings.email,

    taxPercentText:
      formatTaxPercentForForm(
        settings.taxPercent,
      ),

    languageCode:
      settings.languageCode,

    accentColorName:
      settings.accentColorName,

    backgroundID:
      normalizeJCSScreenBackgroundID(
        settings.backgroundID,
      ),
  });
}

// MARK: - Form Errors

export function hasAppSettingsFormErrors(
  errors: AppSettingsFormErrors,
): boolean {
  return Object.values(
    errors,
  ).some(
    (message) =>
      message.trim().length > 0,
  );
}

export function clearAppSettingsFieldError(
  errors: AppSettingsFormErrors,
  fieldName:
    keyof AppSettingsFormErrors,
): AppSettingsFormErrors {
  if (!errors[fieldName]) {
    return errors;
  }

  return {
    ...errors,
    [fieldName]:
      "",
  };
}

export function mergeAppSettingsFormErrors(
  currentErrors: AppSettingsFormErrors,
  newErrors: Partial<AppSettingsFormErrors>,
): AppSettingsFormErrors {
  return {
    ...currentErrors,
    ...newErrors,
  };
}

// MARK: - Company Information

export function createAppSettingsCompanyInformation(
  input: {
    companyName: string;
    addressLine1: string;
    addressLine2: string;
    phone: string;
    email: string;
  },
): AppSettingsCompanyInformation {
  const companyName =
    normalizePersistedCompanyName(
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

  return {
    companyName,

    addressLine1,
    addressLine2,

    phone,
    email,

    fullAddress:
      createFullBusinessAddress(
        addressLine1,
        addressLine2,
      ),
  };
}

// MARK: - Financial Configuration

export function createAppSettingsFinancialConfiguration(
  taxPercent: number,
): AppSettingsFinancialConfiguration {
  return {
    taxPercent:
      roundTaxPercent(
        normalizeTaxPercent(
          taxPercent,
        ),
      ),
  };
}

// MARK: - Save Input Normalization

export interface NormalizedSaveAppSettingsInput {
  businessID: string;
  ownerUID: string;

  createdByUID: string;
  updatedByUID: string;

  formValues: AppSettingsFormValues;
  taxPercent: number;

  branding: BusinessBrandingSettings | null;
}

export function normalizeSaveAppSettingsInput(
  input: SaveAppSettingsInput,
): NormalizedSaveAppSettingsInput {
  const businessID =
    input.businessID.trim();

  const ownerUID =
    input.ownerUID.trim();

  const createdByUID =
    input.createdByUID.trim();

  const updatedByUID =
    input.updatedByUID.trim();

  if (!businessID) {
    throw new AppSettingsDomainError(
      "missing-business-id",
      "The business ID is required before saving App Settings.",
    );
  }

  if (!ownerUID) {
    throw new AppSettingsDomainError(
      "missing-owner-uid",
      "The Business Owner identity is required before saving App Settings.",
    );
  }

  if (!updatedByUID) {
    throw new AppSettingsDomainError(
      "missing-updated-by-uid",
      "The signed-in user identity is required before saving App Settings.",
    );
  }

  const validation =
    validateAppSettingsForm(
      input.formValues,
    );

  if (!validation.isValid) {
    throw new AppSettingsValidationError(
      "The App Settings form contains invalid information.",
      validation.errors,
    );
  }

  return {
    businessID,
    ownerUID,

    createdByUID:
      createdByUID ||
      updatedByUID,

    updatedByUID,

    formValues:
      validation.normalizedValues,

    taxPercent:
      validation.taxPercent,

    branding:
      input.branding
        ? normalizeBusinessBrandingSettings(
            input.branding,
            businessID,
            validation
              .normalizedValues
              .companyName,
            validation
              .normalizedValues
              .accentColorName,
          )
        : null,
  };
}

// MARK: - App Settings Record Creation

export function createAppSettingsRecordFromSaveInput(
  input: {
    normalizedInput: NormalizedSaveAppSettingsInput;
    existingSettings?: AppSettingsRecord | null;
  },
): AppSettingsRecord {
  const {
    normalizedInput,
    existingSettings = null,
  } = input;

  const companyInformation =
    createAppSettingsCompanyInformation({
      companyName:
        normalizedInput
          .formValues
          .companyName,

      addressLine1:
        normalizedInput
          .formValues
          .addressLine1,

      addressLine2:
        normalizedInput
          .formValues
          .addressLine2,

      phone:
        normalizedInput
          .formValues
          .phone,

      email:
        normalizedInput
          .formValues
          .email,
    });

  const financialConfiguration =
    createAppSettingsFinancialConfiguration(
      normalizedInput.taxPercent,
    );

  const nowISO =
    new Date().toISOString();

  const baseRecord =
    existingSettings ??
    createDefaultAppSettingsRecord({
      businessID:
        normalizedInput.businessID,

      ownerUID:
        normalizedInput.ownerUID,

      createdByUID:
        normalizedInput.createdByUID,

      companyName:
        companyInformation.companyName,
    });

  const branding =
    normalizedInput.branding ??
    extractBrandingFromAppSettingsRecord(
      baseRecord,
    );

  return {
    ...baseRecord,

    id:
      normalizedInput.businessID,

    businessID:
      normalizedInput.businessID,

    ownerUID:
      normalizedInput.ownerUID,

    createdByUID:
      baseRecord.createdByUID ||
      normalizedInput.createdByUID,

    updatedByUID:
      normalizedInput.updatedByUID,

    ...companyInformation,

    ...financialConfiguration,

    languageCode:
      normalizedInput
        .formValues
        .languageCode,

    accentColorName:
      normalizedInput
        .formValues
        .accentColorName,

    backgroundID:
      normalizeJCSScreenBackgroundID(
        normalizedInput
          .formValues
          .backgroundID,
      ),

    activeLogoID:
      branding.activeLogoID,

    activeLogoSource:
      branding.activeLogoSource,

    logoStoragePath:
      branding.logoStoragePath,

    logoDownloadURL:
      branding.logoDownloadURL,

    logoRenderingMode:
      branding.logoRenderingMode,

    logoSupportsAccentColor:
      branding.logoSupportsAccentColor,

    useAccentColorForLogo:
      branding.useAccentColorForLogo,

    firebaseDocumentID:
      normalizedInput.businessID,

    needsCloudSync:
      false,

    lastCloudSyncISO:
      nowISO,

    createdAtISO:
      baseRecord.createdAtISO ||
      nowISO,

    updatedAtISO:
      nowISO,
  };
}

// MARK: - Firestore Serialization

export function serializeAppSettingsForFirestore(
  settings: AppSettingsRecord,
): AppSettingsFirestoreDocument {
  const normalizedRecord =
    normalizeAppSettingsRecord(
      settings,
    );

  return {
    id:
      normalizedRecord.id,

    businessID:
      normalizedRecord.businessID,

    ownerUID:
      normalizedRecord.ownerUID,

    createdByUID:
      normalizedRecord.createdByUID,

    updatedByUID:
      normalizedRecord.updatedByUID,

    companyName:
      normalizedRecord.companyName,

    addressLine1:
      normalizedRecord.addressLine1,

    addressLine2:
      normalizedRecord.addressLine2,

    phone:
      normalizedRecord.phone,

    email:
      normalizedRecord.email,

    taxPercent:
      normalizedRecord.taxPercent,

    languageCode:
      normalizedRecord.languageCode,

    accentColorName:
      normalizedRecord.accentColorName,

    backgroundID:
      normalizedRecord.backgroundID,

    activeLogoID:
      normalizedRecord.activeLogoID,

    activeLogoSource:
      normalizedRecord.activeLogoSource,

    logoStoragePath:
      normalizedRecord.logoStoragePath,

    logoDownloadURL:
      normalizedRecord.logoDownloadURL,

    logoRenderingMode:
      normalizedRecord.logoRenderingMode,

    logoSupportsAccentColor:
      normalizedRecord
        .logoSupportsAccentColor,

    useAccentColorForLogo:
      normalizedRecord
        .useAccentColorForLogo,

    backgroundStoragePath:
      normalizedRecord
        .backgroundStoragePath,

    backgroundDownloadURL:
      normalizedRecord
        .backgroundDownloadURL,

    firebaseDocumentID:
      normalizedRecord
        .firebaseDocumentID,

    needsCloudSync:
      normalizedRecord
        .needsCloudSync,

    lastCloudSyncISO:
      normalizedRecord
        .lastCloudSyncISO,

    createdAtISO:
      normalizedRecord
        .createdAtISO,

    updatedAtISO:
      normalizedRecord
        .updatedAtISO,
  };
}

// MARK: - Firestore Deserialization

export function deserializeAppSettingsRecord(
  businessID: string,
  data:
    | Record<string, unknown>
    | undefined,
): AppSettingsRecord {
  const cleanBusinessID =
    businessID.trim();

  if (!cleanBusinessID) {
    throw new AppSettingsDomainError(
      "missing-business-id",
      "The business ID is required before reading App Settings.",
    );
  }

  if (!data) {
    return createDefaultAppSettingsRecord({
      businessID:
        cleanBusinessID,

      ownerUID:
        "",

      createdByUID:
        "",
    });
  }

  const activeLogoSource =
    normalizeBusinessLogoSource(
      data.activeLogoSource,
    );

  const logoSupportsAccentColor =
    readBoolean(
      data.logoSupportsAccentColor,
      activeLogoSource === "default",
    );

  const requestedRenderingMode =
    normalizeBusinessLogoRenderingMode(
      data.logoRenderingMode,
    );

  const logoRenderingMode:
    BusinessLogoRenderingMode =
    logoSupportsAccentColor &&
    requestedRenderingMode ===
      "template"
      ? "template"
      : "original";

  const useAccentColorForLogo =
    logoSupportsAccentColor &&
    logoRenderingMode ===
      "template" &&
    readBoolean(
      data.useAccentColorForLogo,
      activeLogoSource === "default",
    );

  const companyInformation =
    createAppSettingsCompanyInformation({
      companyName:
        readString(
          data.companyName,
        ),

      addressLine1:
        readString(
          data.addressLine1,
        ),

      addressLine2:
        readString(
          data.addressLine2,
        ),

      phone:
        readString(
          data.phone,
        ),

      email:
        readString(
          data.email,
        ),
    });

  const taxPercent =
    normalizeTaxPercent(
      readNumber(
        data.taxPercent,
        0,
      ),
    );

  const nowISO =
    new Date().toISOString();

  return normalizeAppSettingsRecord({
    id:
      readString(
        data.id,
      ) ||
      cleanBusinessID,

    businessID:
      readString(
        data.businessID,
      ) ||
      cleanBusinessID,

    ownerUID:
      readString(
        data.ownerUID,
      ),

    createdByUID:
      readString(
        data.createdByUID,
      ),

    updatedByUID:
      readString(
        data.updatedByUID,
      ),

    ...companyInformation,

    taxPercent,

    languageCode:
      normalizeAppLanguageCode(
        data.languageCode,
      ),

    accentColorName:
      normalizeAppAccentColorName(
        data.accentColorName,
      ),

    backgroundID:
      normalizeJCSScreenBackgroundID(
        data.backgroundID,
      ),

    activeLogoID:
      readString(
        data.activeLogoID,
      ),

    activeLogoSource,

    logoStoragePath:
      readString(
        data.logoStoragePath,
      ),

    logoDownloadURL:
      readString(
        data.logoDownloadURL,
      ) ||
      (
        activeLogoSource ===
        "default"
          ? DEFAULT_BUSINESS_LOGO_ASSET_PATH
          : ""
      ),

    logoRenderingMode,

    logoSupportsAccentColor,

    useAccentColorForLogo,

    backgroundStoragePath:
      readString(
        data.backgroundStoragePath,
      ),

    backgroundDownloadURL:
      readString(
        data.backgroundDownloadURL,
      ),

    firebaseDocumentID:
      readString(
        data.firebaseDocumentID,
      ) ||
      cleanBusinessID,

    needsCloudSync:
      readBoolean(
        data.needsCloudSync,
        false,
      ),

    lastCloudSyncISO:
      readNullableISODate(
        data.lastCloudSyncISO,
      ),

    createdAtISO:
      readISODate(
        data.createdAtISO,
        nowISO,
      ),

    updatedAtISO:
      readISODate(
        data.updatedAtISO,
        nowISO,
      ),
  });
}

// MARK: - Record Normalization

export function normalizeAppSettingsRecord(
  settings: AppSettingsRecord,
): AppSettingsRecord {
  const companyInformation =
    createAppSettingsCompanyInformation({
      companyName:
        settings.companyName,

      addressLine1:
        settings.addressLine1,

      addressLine2:
        settings.addressLine2,

      phone:
        settings.phone,

      email:
        settings.email,
    });

  const businessID =
    settings.businessID.trim();

  const activeLogoSource =
    normalizeBusinessLogoSource(
      settings.activeLogoSource,
    );

  const logoSupportsAccentColor =
    settings.logoSupportsAccentColor ===
      true ||
    activeLogoSource === "default";

  const requestedRenderingMode =
    normalizeBusinessLogoRenderingMode(
      settings.logoRenderingMode,
    );

  const logoRenderingMode:
    BusinessLogoRenderingMode =
    logoSupportsAccentColor &&
    requestedRenderingMode ===
      "template"
      ? "template"
      : "original";

  return {
    ...settings,

    id:
      settings.id.trim() ||
      businessID,

    businessID,

    ownerUID:
      settings.ownerUID.trim(),

    createdByUID:
      settings.createdByUID.trim(),

    updatedByUID:
      settings.updatedByUID.trim(),

    ...companyInformation,

    taxPercent:
      roundTaxPercent(
        normalizeTaxPercent(
          settings.taxPercent,
        ),
      ),

    languageCode:
      normalizeAppLanguageCode(
        settings.languageCode,
      ),

    accentColorName:
      normalizeAppAccentColorName(
        settings.accentColorName,
      ),

    backgroundID:
      normalizeJCSScreenBackgroundID(
        settings.backgroundID,
      ),

    activeLogoID:
      settings.activeLogoID.trim(),

    activeLogoSource,

    logoStoragePath:
      settings.logoStoragePath.trim(),

    logoDownloadURL:
      settings.logoDownloadURL.trim() ||
      (
        activeLogoSource === "default"
          ? DEFAULT_BUSINESS_LOGO_ASSET_PATH
          : ""
      ),

    logoRenderingMode,

    logoSupportsAccentColor,

    useAccentColorForLogo:
      logoSupportsAccentColor &&
      logoRenderingMode ===
        "template" &&
      settings.useAccentColorForLogo ===
        true,

    backgroundStoragePath:
      settings.backgroundStoragePath.trim(),

    backgroundDownloadURL:
      settings.backgroundDownloadURL.trim(),

    firebaseDocumentID:
      settings.firebaseDocumentID.trim() ||
      businessID,

    needsCloudSync:
      settings.needsCloudSync === true,

    lastCloudSyncISO:
      normalizeNullableISODate(
        settings.lastCloudSyncISO,
      ),

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

// MARK: - Branding

export function normalizeBusinessBrandingSettings(
  branding: BusinessBrandingSettings,
  businessID: string,
  companyName: string,
  accentColorName: AppAccentColorName,
): BusinessBrandingSettings {
  const cleanBusinessID =
    businessID.trim();

  const activeLogoSource =
    normalizeBusinessLogoSource(
      branding.activeLogoSource,
    );

  const logoSupportsAccentColor =
    branding.logoSupportsAccentColor ===
      true ||
    activeLogoSource === "default";

  const logoRenderingMode:
    BusinessLogoRenderingMode =
    logoSupportsAccentColor &&
    branding.logoRenderingMode ===
      "template"
      ? "template"
      : "original";

  const useAccentColorForLogo =
    logoSupportsAccentColor &&
    logoRenderingMode ===
      "template" &&
    branding.useAccentColorForLogo ===
      true;

  return createBusinessBrandingSettings({
    businessID:
      cleanBusinessID,

    companyName,

    accentColorName,

    activeLogoID:
      branding.activeLogoID,

    activeLogoSource,

    logoStoragePath:
      branding.logoStoragePath,

    logoDownloadURL:
      branding.logoDownloadURL ||
      (
        activeLogoSource === "default"
          ? DEFAULT_BUSINESS_LOGO_ASSET_PATH
          : ""
      ),

    logoRenderingMode,

    logoSupportsAccentColor,

    useAccentColorForLogo,
  });
}

export function extractBrandingFromAppSettingsRecord(
  settings: AppSettingsRecord,
): BusinessBrandingSettings {
  return normalizeBusinessBrandingSettings(
    {
      businessID:
        settings.businessID,

      companyName:
        settings.companyName,

      accentColorName:
        settings.accentColorName,

      activeLogoID:
        settings.activeLogoID,

      activeLogoSource:
        settings.activeLogoSource,

      logoStoragePath:
        settings.logoStoragePath,

      logoDownloadURL:
        settings.logoDownloadURL,

      logoRenderingMode:
        settings.logoRenderingMode,

      logoSupportsAccentColor:
        settings.logoSupportsAccentColor,

      useAccentColorForLogo:
        settings.useAccentColorForLogo,

      updatedAtISO:
        settings.updatedAtISO,
    },
    settings.businessID,
    settings.companyName,
    settings.accentColorName,
  );
}

export function createDefaultAppSettingsBranding(
  businessID: string,
  companyName: string,
  accentColorName: AppAccentColorName = "blue",
): AppSettingsBranding {
  return {
    activeLogoID:
      "",

    activeLogoSource:
      "default",

    logoStoragePath:
      "",

    logoDownloadURL:
      DEFAULT_BUSINESS_LOGO_ASSET_PATH,

    logoRenderingMode:
      "template",

    logoSupportsAccentColor:
      DEFAULT_BUSINESS_LOGO_SUPPORTS_ACCENT_COLOR,

    useAccentColorForLogo:
      DEFAULT_BUSINESS_LOGO_USES_ACCENT_COLOR,
  };
}

// MARK: - Phone

export function normalizePhoneInput(
  value: string,
): string {
  const trimmedValue =
    value
      .trim()
      .slice(
        0,
        APP_SETTINGS_PHONE_MAX_LENGTH,
      );

  const hasLeadingPlus =
    trimmedValue.startsWith("+");

  const digits =
    trimmedValue.replace(
      /\D/g,
      "",
    );

  if (!digits) {
    return "";
  }

  /*
   * Formats common United States and Canadian numbers.
   * International values retain a safe +digits representation.
   */
  if (
    digits.length === 10 &&
    !hasLeadingPlus
  ) {
    return [
      "(",
      digits.slice(0, 3),
      ") ",
      digits.slice(3, 6),
      "-",
      digits.slice(6, 10),
    ].join("");
  }

  if (
    digits.length === 11 &&
    digits.startsWith("1")
  ) {
    return [
      "+1 ",
      "(",
      digits.slice(1, 4),
      ") ",
      digits.slice(4, 7),
      "-",
      digits.slice(7, 11),
    ].join("");
  }

  return hasLeadingPlus
    ? `+${digits}`
    : digits;
}

export function isValidBusinessPhone(
  value: string,
): boolean {
  const digits =
    value.replace(
      /\D/g,
      "",
    );

  return (
    digits.length >= 7 &&
    digits.length <= 15
  );
}

// MARK: - Email

export function normalizeEmailInput(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .slice(
      0,
      APP_SETTINGS_EMAIL_MAX_LENGTH,
    );
}

export function isValidBusinessEmail(
  value: string,
): boolean {
  const normalizedEmail =
    normalizeEmailInput(
      value,
    );

  if (!normalizedEmail) {
    return true;
  }

  /*
   * Practical business-email validation.
   *
   * Final deliverability must still be confirmed by sending
   * verification or transactional email.
   */
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(
    normalizedEmail,
  );
}

// MARK: - Tax

export type ParsedTaxPercentResult =
  | {
      isValid: true;
      value: number;
    }
  | {
      isValid: false;
      value: 0;
      errorMessage: string;
    };

export function parseTaxPercentText(
  value: string,
): ParsedTaxPercentResult {
  const normalizedText =
    normalizeTaxPercentText(
      value,
    );

  if (!normalizedText) {
    return {
      isValid:
        true,

      value:
        0,
    };
  }

  const numericValue =
    Number(
      normalizedText,
    );

  if (!Number.isFinite(numericValue)) {
    return {
      isValid:
        false,

      value:
        0,

      errorMessage:
        "Enter a valid tax percentage.",
    };
  }

  if (
    numericValue < 0 ||
    numericValue > 100
  ) {
    return {
      isValid:
        false,

      value:
        0,

      errorMessage:
        "Tax percentage must be between 0 and 100.",
    };
  }

  return {
    isValid:
      true,

    value:
      roundTaxPercent(
        numericValue,
      ),
  };
}

export function normalizeTaxPercentText(
  value: string,
): string {
  const normalizedValue =
    value
      .trim()
      .replace(/,/g, ".")
      .replace(/[^\d.]/g, "");

  const firstDecimalIndex =
    normalizedValue.indexOf(".");

  if (firstDecimalIndex < 0) {
    return normalizedValue.slice(
      0,
      3,
    );
  }

  const integerPart =
    normalizedValue
      .slice(
        0,
        firstDecimalIndex,
      )
      .slice(
        0,
        3,
      );

  const decimalPart =
    normalizedValue
      .slice(
        firstDecimalIndex + 1,
      )
      .replace(/\./g, "")
      .slice(
        0,
        APP_SETTINGS_TAX_DECIMAL_PLACES,
      );

  return decimalPart
    ? `${integerPart || "0"}.${decimalPart}`
    : `${integerPart || "0"}.`;
}

export function formatTaxPercentForForm(
  value: number,
): string {
  const normalizedValue =
    roundTaxPercent(
      normalizeTaxPercent(
        value,
      ),
    );

  return Number.isInteger(
    normalizedValue,
  )
    ? String(
        normalizedValue,
      )
    : String(
        normalizedValue,
      );
}

// MARK: - Field Normalization

export function normalizeCompanyNameInput(
  value: string,
): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .slice(
      0,
      APP_SETTINGS_COMPANY_NAME_MAX_LENGTH,
    );
}

export function normalizePersistedCompanyName(
  value: string,
): string {
  return (
    normalizeCompanyNameInput(
      value,
    ) ||
    "My Business"
  );
}

export function normalizeAddressInput(
  value: string,
): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .slice(
      0,
      APP_SETTINGS_ADDRESS_MAX_LENGTH,
    );
}

// MARK: - Dirty State

export function areAppSettingsFormValuesEqual(
  first: AppSettingsFormValues,
  second: AppSettingsFormValues,
): boolean {
  const normalizedFirst =
    normalizeAppSettingsFormValues(
      first,
    );

  const normalizedSecond =
    normalizeAppSettingsFormValues(
      second,
    );

  return (
    normalizedFirst.companyName ===
      normalizedSecond.companyName &&
    normalizedFirst.addressLine1 ===
      normalizedSecond.addressLine1 &&
    normalizedFirst.addressLine2 ===
      normalizedSecond.addressLine2 &&
    normalizedFirst.phone ===
      normalizedSecond.phone &&
    normalizedFirst.email ===
      normalizedSecond.email &&
    normalizeComparableTaxText(
      normalizedFirst.taxPercentText,
    ) ===
      normalizeComparableTaxText(
        normalizedSecond.taxPercentText,
      ) &&
    normalizedFirst.languageCode ===
      normalizedSecond.languageCode &&
    normalizedFirst.accentColorName ===
      normalizedSecond.accentColorName &&
    normalizedFirst.backgroundID ===
      normalizedSecond.backgroundID
  );
}

// MARK: - Private Helpers

function normalizeRole(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

function roundTaxPercent(
  value: number,
): number {
  const multiplier =
    10 **
    APP_SETTINGS_TAX_DECIMAL_PLACES;

  return (
    Math.round(
      value *
      multiplier,
    ) /
    multiplier
  );
}

function normalizeComparableTaxText(
  value: string,
): string {
  const result =
    parseTaxPercentText(
      value,
    );

  return result.isValid
    ? String(
        result.value,
      )
    : value.trim();
}

function normalizeISODate(
  value: string,
): string {
  return !Number.isNaN(
    Date.parse(value),
  )
    ? value
    : new Date().toISOString();
}

function normalizeNullableISODate(
  value: string | null,
): string | null {
  if (!value) {
    return null;
  }

  return !Number.isNaN(
    Date.parse(value),
  )
    ? value
    : null;
}

function readString(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function readNumber(
  value: unknown,
  fallback: number,
): number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  )
    ? value
    : fallback;
}

function readBoolean(
  value: unknown,
  fallback: boolean,
): boolean {
  return typeof value === "boolean"
    ? value
    : fallback;
}

function readISODate(
  value: unknown,
  fallback: string,
): string {
  return (
    typeof value === "string" &&
    !Number.isNaN(
      Date.parse(value),
    )
  )
    ? value
    : fallback;
}

function readNullableISODate(
  value: unknown,
): string | null {
  return (
    typeof value === "string" &&
    !Number.isNaN(
      Date.parse(value),
    )
  )
    ? value
    : null;
}

// MARK: - Errors

export class AppSettingsDomainError
  extends Error {
  readonly code: string;

  constructor(
    code: string,
    message: string,
  ) {
    super(message);

    this.name =
      "AppSettingsDomainError";

    this.code =
      code;
  }
}

export class AppSettingsValidationError
  extends AppSettingsDomainError {
  readonly formErrors:
    AppSettingsFormErrors;

  constructor(
    message: string,
    formErrors: AppSettingsFormErrors,
  ) {
    super(
      "validation-error",
      message,
    );

    this.name =
      "AppSettingsValidationError";

    this.formErrors = {
      ...EMPTY_APP_SETTINGS_FORM_ERRORS,
      ...formErrors,
    };
  }
}