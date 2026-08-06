/*
 * JCS Business Suite Web
 * BusinessLogoService.ts
 *
 * Central orchestration service for:
 *
 * - Business Owner uploaded logos.
 * - Sofia premium generated logos.
 * - Active-logo replacement.
 * - Firebase Storage persistence.
 * - Firestore branding persistence.
 * - Safe rollback when an operation fails.
 * - Default-logo restoration.
 * - Active-logo rendering preferences.
 *
 * React components and visual UI state must not live here.
 */

import {
  createBusinessLogoRecord,
  decodeGeneratedBusinessLogo,
  normalizeUploadedBusinessLogo,
  revokeBusinessLogoPreviewURL,
  validateUploadedBusinessLogoInput,
} from "./BusinessLogoDomain";

import {
  fetchActiveBusinessBranding,
  restoreDefaultBusinessLogo,
  saveActiveBusinessLogo,
  updateActiveLogoRenderingPreference,
} from "./BusinessLogoFirestoreService";

import {
  deleteBusinessLogoFromStorage,
  deleteReplacedBusinessLogo,
  uploadOwnerSelectedBusinessLogo,
  uploadSofiaGeneratedBusinessLogo,
} from "./BusinessLogoStorageService";

import type {
  ActiveBusinessBrandingResult,
  RestoreDefaultBusinessLogoResult,
  SaveActiveBusinessLogoResult,
} from "./BusinessLogoFirestoreService";

import type {
  BusinessLogoUploadProgress,
  UploadedBusinessLogoStorageResult,
} from "./BusinessLogoStorageService";

import type {
  BusinessBrandingSettings,
  BusinessLogoOption,
  BusinessLogoRecord,
  BusinessLogoRenderingMode,
  SelectGeneratedLogoInput,
  UploadedBusinessLogoInput,
} from "./BusinessLogoTypes";

// MARK: - Upload Owner Logo Input

export interface SaveUploadedBusinessLogoInput
  extends UploadedBusinessLogoInput {
  accentColorName: string;

  onProgress?: (
    progress: BusinessLogoUploadProgress,
  ) => void;
}

// MARK: - Save Generated Logo Input

export interface SaveGeneratedBusinessLogoInput
  extends SelectGeneratedLogoInput {
  accentColorName: string;

  onProgress?: (
    progress: BusinessLogoUploadProgress,
  ) => void;
}

// MARK: - Common Save Result

export interface SaveBusinessLogoResult {
  logo: BusinessLogoRecord;
  branding: BusinessBrandingSettings;

  previousLogoID: string;
  previousLogoStoragePath: string;

  previousStorageCleanupSucceeded: boolean;
}

// MARK: - Default Restore Input

export interface RestoreBusinessDefaultLogoInput {
  businessID: string;
  companyName: string;
  accentColorName: string;
}

// MARK: - Default Restore Result

export interface RestoreBusinessDefaultLogoServiceResult {
  branding: BusinessBrandingSettings;

  previousLogoID: string;
  previousLogoStoragePath: string;

  previousStorageCleanupSucceeded: boolean;
}

// MARK: - Uploaded Logo

/**
 * Validates, normalizes and saves a logo selected by the
 * Business Owner from the browser file picker.
 *
 * Uploaded logos preserve their original colors.
 */
export async function saveUploadedBusinessLogo(
  input: SaveUploadedBusinessLogoInput,
): Promise<SaveBusinessLogoResult> {
  const validation =
    validateUploadedBusinessLogoInput(input);

  if (!validation.isValid) {
    throw new BusinessLogoServiceError(
      "invalid-upload",
      validation.errorMessage,
    );
  }

  const normalizedLogo =
    await normalizeUploadedBusinessLogo(
      input.file,
    );

  let uploadedStorageResult:
    | UploadedBusinessLogoStorageResult
    | null = null;

  try {
    uploadedStorageResult =
      await uploadOwnerSelectedBusinessLogo({
        businessID:
          input.businessID,

        ownerUID:
          input.ownerUID,

        createdByUID:
          input.createdByUID,

        businessName:
          input.businessName,

        file:
          normalizedLogo.file,

        /*
         * A normal uploaded business logo must retain its
         * original commercial colors.
         */
        supportsAccentColor:
          input.supportsAccentColor === true,

        onProgress:
          input.onProgress,
      });

    const logoRecord =
      createBusinessLogoRecord({
        id:
          uploadedStorageResult.logoID,

        businessID:
          uploadedStorageResult.businessID,

        ownerUID:
          uploadedStorageResult.ownerUID,

        createdByUID:
          uploadedStorageResult.createdByUID,

        businessName:
          input.businessName,

        source:
          "uploaded",

        storagePath:
          uploadedStorageResult.storagePath,

        downloadURL:
          uploadedStorageResult.downloadURL,

        originalFileName:
          normalizedLogo.originalFileName,

        storedFileName:
          uploadedStorageResult.storedFileName,

        mimeType:
          uploadedStorageResult.mimeType,

        width:
          normalizedLogo.width,

        height:
          normalizedLogo.height,

        sizeBytes:
          uploadedStorageResult.sizeBytes,

        supportsAccentColor:
          uploadedStorageResult
            .supportsAccentColor,

        renderingMode:
          uploadedStorageResult
            .supportsAccentColor
            ? "template"
            : "original",

        useAccentColor:
          false,

        creativeBrief:
          "",

        promptUsed:
          "",
      });

    const saveResult =
      await saveActiveBusinessLogo({
        logo:
          logoRecord,

        companyName:
          input.businessName,

        accentColorName:
          input.accentColorName,
      });

    const cleanupSucceeded =
      await safelyDeletePreviousLogo(
        saveResult,
      );

    return createSaveBusinessLogoResult(
      saveResult,
      cleanupSucceeded,
    );
  } catch (error) {
    /*
     * If Storage succeeded but Firestore failed, remove the
     * newly uploaded object so no orphan file remains.
     */
    if (uploadedStorageResult) {
      await safelyRollbackUploadedLogo(
        uploadedStorageResult.storagePath,
      );
    }

    throw mapBusinessLogoServiceError(
      error,
      "The uploaded business logo could not be saved.",
    );
  } finally {
    revokeBusinessLogoPreviewURL(
      normalizedLogo.previewURL,
    );
  }
}

// MARK: - Sofia Generated Logo

/**
 * Saves the Sofia option selected by the Business Owner.
 *
 * The unselected options remain only in browser memory and are
 * never uploaded to Firebase Storage.
 */
export async function saveGeneratedBusinessLogo(
  input: SaveGeneratedBusinessLogoInput,
): Promise<SaveBusinessLogoResult> {
  validateGeneratedLogoSelectionInput(
    input,
  );

  const generatedLogo =
    await decodeGeneratedBusinessLogo(
      {
        success:
          true,

        imageBase64:
          input.option.imageBase64,

        mimeType:
          input.option.mimeType,

        fileName:
          `${input.option.title}.png`,

        promptUsed:
          input.option.promptUsed,

        creativeBrief:
          input.option.creativeBrief,
      },
      input.businessName,
    );

  let uploadedStorageResult:
    | UploadedBusinessLogoStorageResult
    | null = null;

  try {
    uploadedStorageResult =
      await uploadSofiaGeneratedBusinessLogo({
        logoID:
          input.option.id,

        businessID:
          input.businessID,

        ownerUID:
          input.ownerUID,

        createdByUID:
          input.createdByUID,

        businessName:
          input.businessName,

        file:
          generatedLogo.file,

        /*
         * A Sofia premium logo normally keeps the professional
         * palette selected during generation.
         */
        supportsAccentColor:
          false,

        creativeBrief:
          input.option.creativeBrief,

        promptUsed:
          input.option.promptUsed,

        onProgress:
          input.onProgress,
      });

    const logoRecord =
      createBusinessLogoRecord({
        id:
          uploadedStorageResult.logoID,

        businessID:
          uploadedStorageResult.businessID,

        ownerUID:
          uploadedStorageResult.ownerUID,

        createdByUID:
          uploadedStorageResult.createdByUID,

        businessName:
          input.businessName,

        source:
          "ai-generated",

        storagePath:
          uploadedStorageResult.storagePath,

        downloadURL:
          uploadedStorageResult.downloadURL,

        originalFileName:
          generatedLogo.file.name,

        storedFileName:
          uploadedStorageResult.storedFileName,

        mimeType:
          uploadedStorageResult.mimeType,

        width:
          generatedLogo.width,

        height:
          generatedLogo.height,

        sizeBytes:
          uploadedStorageResult.sizeBytes,

        supportsAccentColor:
          false,

        renderingMode:
          "original",

        useAccentColor:
          false,

        creativeBrief:
          input.option.creativeBrief,

        promptUsed:
          input.option.promptUsed,
      });

    const saveResult =
      await saveActiveBusinessLogo({
        logo:
          logoRecord,

        companyName:
          input.businessName,

        accentColorName:
          input.accentColorName,
      });

    const cleanupSucceeded =
      await safelyDeletePreviousLogo(
        saveResult,
      );

    return createSaveBusinessLogoResult(
      saveResult,
      cleanupSucceeded,
    );
  } catch (error) {
    if (uploadedStorageResult) {
      await safelyRollbackUploadedLogo(
        uploadedStorageResult.storagePath,
      );
    }

    throw mapBusinessLogoServiceError(
      error,
      "The Sofia business logo could not be saved.",
    );
  }
}

// MARK: - Active Branding

/**
 * Loads the active branding configuration and its active-logo
 * metadata for one business.
 */
export async function loadActiveBusinessLogo(
  businessID: string,
): Promise<ActiveBusinessBrandingResult> {
  const cleanBusinessID =
    businessID.trim();

  if (!cleanBusinessID) {
    throw new BusinessLogoServiceError(
      "missing-business-id",
      "The business ID is required before loading the logo.",
    );
  }

  try {
    return await fetchActiveBusinessBranding(
      cleanBusinessID,
    );
  } catch (error) {
    throw mapBusinessLogoServiceError(
      error,
      "The active business logo could not be loaded.",
    );
  }
}

// MARK: - Restore Default

/**
 * Restores the JCS default logo and safely removes the previous
 * custom logo only after Firestore has updated successfully.
 */
export async function restoreBusinessDefaultLogo(
  input: RestoreBusinessDefaultLogoInput,
): Promise<RestoreBusinessDefaultLogoServiceResult> {
  const businessID =
    input.businessID.trim();

  if (!businessID) {
    throw new BusinessLogoServiceError(
      "missing-business-id",
      "The business ID is required before restoring the default logo.",
    );
  }

  let firestoreResult:
    RestoreDefaultBusinessLogoResult;

  try {
    firestoreResult =
      await restoreDefaultBusinessLogo({
        businessID,

        companyName:
          input.companyName,

        accentColorName:
          input.accentColorName,
      });
  } catch (error) {
    throw mapBusinessLogoServiceError(
      error,
      "The default business logo could not be restored.",
    );
  }

  let cleanupSucceeded =
    true;

  if (
    firestoreResult
      .shouldDeletePreviousStorageObject &&
    firestoreResult
      .previousLogoStoragePath
  ) {
    try {
      await deleteBusinessLogoFromStorage(
        firestoreResult
          .previousLogoStoragePath,
      );
    } catch (error) {
      cleanupSucceeded =
        false;

      console.warn(
        "The previous business logo record was archived, but its Storage object could not be removed:",
        error,
      );
    }
  }

  return {
    branding:
      firestoreResult.branding,

    previousLogoID:
      firestoreResult.previousLogoID,

    previousLogoStoragePath:
      firestoreResult
        .previousLogoStoragePath,

    previousStorageCleanupSucceeded:
      cleanupSucceeded,
  };
}

// MARK: - Rendering Preference

/**
 * Updates whether the active logo uses its original colors or
 * follows the Dashboard accent color.
 *
 * This preference is only honored for assets explicitly marked
 * as accent-color compatible.
 */
export async function saveBusinessLogoRenderingPreference(
  input: {
    businessID: string;
    renderingMode: BusinessLogoRenderingMode;
    useAccentColorForLogo: boolean;
  },
): Promise<BusinessBrandingSettings> {
  const businessID =
    input.businessID.trim();

  if (!businessID) {
    throw new BusinessLogoServiceError(
      "missing-business-id",
      "The business ID is required before updating the logo preference.",
    );
  }

  try {
    return await updateActiveLogoRenderingPreference({
      businessID,

      renderingMode:
        input.renderingMode,

      useAccentColorForLogo:
        input.useAccentColorForLogo,
    });
  } catch (error) {
    throw mapBusinessLogoServiceError(
      error,
      "The logo display preference could not be saved.",
    );
  }
}

// MARK: - Generated Option Validation

function validateGeneratedLogoSelectionInput(
  input: SaveGeneratedBusinessLogoInput,
): void {
  const businessID =
    input.businessID.trim();

  const ownerUID =
    input.ownerUID.trim();

  const optionBusinessID =
    input.option.businessID.trim();

  if (!businessID) {
    throw new BusinessLogoServiceError(
      "missing-business-id",
      "The business ID is required before saving the generated logo.",
    );
  }

  if (!ownerUID) {
    throw new BusinessLogoServiceError(
      "missing-owner-uid",
      "The Business Owner identity is required before saving the generated logo.",
    );
  }

  if (!input.option.id.trim()) {
    throw new BusinessLogoServiceError(
      "missing-option-id",
      "The selected Sofia logo option is invalid.",
    );
  }

  if (!input.option.imageBase64.trim()) {
    throw new BusinessLogoServiceError(
      "missing-image-data",
      "The selected Sofia logo option has no image data.",
    );
  }

  if (
    optionBusinessID &&
    optionBusinessID !== businessID
  ) {
    throw new BusinessLogoServiceError(
      "business-mismatch",
      "The selected logo option belongs to another business.",
    );
  }

  if (
    input.option.source !==
    "ai-generated"
  ) {
    throw new BusinessLogoServiceError(
      "invalid-logo-source",
      "The selected option is not a Sofia-generated logo.",
    );
  }

  if (
    input.option.status !==
    "temporary"
  ) {
    throw new BusinessLogoServiceError(
      "invalid-logo-status",
      "The selected Sofia logo option is no longer available.",
    );
  }
}

// MARK: - Previous Logo Cleanup

async function safelyDeletePreviousLogo(
  result: SaveActiveBusinessLogoResult,
): Promise<boolean> {
  if (
    !result
      .shouldDeletePreviousStorageObject
  ) {
    return true;
  }

  try {
    await deleteReplacedBusinessLogo({
      previousStoragePath:
        result.previousLogoStoragePath,

      newStoragePath:
        result.logo.storagePath,
    });

    return true;
  } catch (error) {
    /*
     * The new logo is already active. A failed cleanup must not
     * make the entire save appear unsuccessful to the customer.
     */
    console.warn(
      "The new business logo was saved, but the previous Storage object could not be deleted:",
      error,
    );

    return false;
  }
}

// MARK: - Rollback

async function safelyRollbackUploadedLogo(
  storagePath: string,
): Promise<void> {
  const cleanStoragePath =
    storagePath.trim();

  if (!cleanStoragePath) {
    return;
  }

  try {
    await deleteBusinessLogoFromStorage(
      cleanStoragePath,
    );
  } catch (rollbackError) {
    console.error(
      "Business logo rollback failed. An orphan Storage object may remain:",
      {
        storagePath:
          cleanStoragePath,

        rollbackError,
      },
    );
  }
}

// MARK: - Result Mapping

function createSaveBusinessLogoResult(
  result: SaveActiveBusinessLogoResult,
  cleanupSucceeded: boolean,
): SaveBusinessLogoResult {
  return {
    logo:
      result.logo,

    branding:
      result.branding,

    previousLogoID:
      result.previousLogoID,

    previousLogoStoragePath:
      result.previousLogoStoragePath,

    previousStorageCleanupSucceeded:
      cleanupSucceeded,
  };
}

// MARK: - Option Helpers

/**
 * Returns the option recommended by Sofía. When the server did
 * not mark one, the highest-confidence option is returned.
 */
export function selectSofiaRecommendedLogoOption(
  options: BusinessLogoOption[],
): BusinessLogoOption | null {
  const availableOptions =
    options.filter(
      (option) =>
        option.source ===
          "ai-generated" &&
        option.status ===
          "temporary" &&
        Boolean(
          option.imageBase64.trim(),
        ),
    );

  if (
    availableOptions.length === 0
  ) {
    return null;
  }

  const recommended =
    availableOptions.find(
      (option) =>
        option.isSofiaRecommended,
    );

  if (recommended) {
    return recommended;
  }

  return [...availableOptions].sort(
    (first, second) =>
      second.confidence -
      first.confidence,
  )[0] ?? null;
}

/**
 * Finds a generated option safely by ID.
 */
export function findBusinessLogoOption(
  options: BusinessLogoOption[],
  optionID: string,
): BusinessLogoOption | null {
  const cleanOptionID =
    optionID.trim();

  if (!cleanOptionID) {
    return null;
  }

  return (
    options.find(
      (option) =>
        option.id ===
        cleanOptionID,
    ) ?? null
  );
}

// MARK: - Errors

export class BusinessLogoServiceError
  extends Error {
  readonly code: string;

  constructor(
    code: string,
    message: string,
  ) {
    super(message);

    this.name =
      "BusinessLogoServiceError";

    this.code =
      code;
  }
}

function mapBusinessLogoServiceError(
  error: unknown,
  fallbackMessage: string,
): BusinessLogoServiceError {
  if (
    error instanceof
    BusinessLogoServiceError
  ) {
    return error;
  }

  const serviceError =
    error as {
      code?: unknown;
      message?: unknown;
    };

  const code =
    typeof serviceError.code ===
    "string"
      ? serviceError.code
      : "business-logo-error";

  const message =
    typeof serviceError.message ===
      "string" &&
    serviceError.message.trim()
      ? serviceError.message.trim()
      : fallbackMessage;

  return new BusinessLogoServiceError(
    code,
    message,
  );
}