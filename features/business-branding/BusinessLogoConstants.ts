/*
 * JCS Business Suite Web
 * BusinessLogoConstants.ts
 *
 * Central configuration for the professional business-logo system.
 *
 * Responsibilities:
 *
 * - Define supported logo files and limits.
 * - Define Firebase Storage paths.
 * - Define Sofia premium-generation presets.
 * - Define safe fallback values.
 * - Keep UI, Storage and generation services consistent.
 *
 * React components and Firebase operations must not live here.
 */

import type {
  BusinessLogoRenderingMode,
  BusinessLogoSource,
} from "./BusinessLogoTypes";

// MARK: - General Defaults

export const DEFAULT_BUSINESS_LOGO_SOURCE: BusinessLogoSource =
  "default";

export const DEFAULT_BUSINESS_LOGO_RENDERING_MODE: BusinessLogoRenderingMode =
  "original";

export const DEFAULT_BUSINESS_LOGO_ACCENT_COLOR = "blue";

export const DEFAULT_BUSINESS_LOGO_MIME_TYPE = "image/png";

export const DEFAULT_BUSINESS_LOGO_FILE_EXTENSION = "png";

export const DEFAULT_BUSINESS_NAME = "New Business";

export const DEFAULT_BUSINESS_INDUSTRY = "General Business";

export const DEFAULT_BUSINESS_LOGO_STYLE =
  "Premium professional commercial brand identity";

export const DEFAULT_BUSINESS_LOGO_LANGUAGE_CODE = "en";

// MARK: - Upload Limits

/**
 * Maximum accepted source-file size from the browser.
 *
 * Firebase Storage rules should enforce the same limit.
 */
export const BUSINESS_LOGO_MAX_FILE_SIZE_BYTES =
  8 * 1024 * 1024;

/**
 * Maximum source dimension accepted before browser normalization.
 */
export const BUSINESS_LOGO_MAX_SOURCE_DIMENSION = 8_192;

/**
 * Final image dimension used for permanent Storage uploads.
 *
 * This matches the premium 1024 × 1024 logo format used by Sofia.
 */
export const BUSINESS_LOGO_TARGET_WIDTH = 1_024;

export const BUSINESS_LOGO_TARGET_HEIGHT = 1_024;

/**
 * Browser preview size. This does not change the stored image.
 */
export const BUSINESS_LOGO_PREVIEW_WIDTH = 240;

export const BUSINESS_LOGO_PREVIEW_HEIGHT = 240;

// MARK: - Supported Image Formats

export const BUSINESS_LOGO_SUPPORTED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type BusinessLogoSupportedMimeType =
  (typeof BUSINESS_LOGO_SUPPORTED_MIME_TYPES)[number];

export const BUSINESS_LOGO_FILE_ACCEPT_VALUE =
  BUSINESS_LOGO_SUPPORTED_MIME_TYPES.join(",");

/**
 * PNG is the definitive persisted format because it supports transparency.
 */
export const BUSINESS_LOGO_OUTPUT_MIME_TYPE =
  "image/png";

export const BUSINESS_LOGO_OUTPUT_EXTENSION =
  "png";

// MARK: - Generation Limits

/**
 * Number of premium Sofia options generated during onboarding.
 */
export const BUSINESS_LOGO_OPTION_COUNT = 4;

/**
 * Maximum number of options kept in the client state.
 */
export const BUSINESS_LOGO_MAX_OPTION_COUNT = 4;

/**
 * Cloud Function timeout expectation.
 *
 * The browser cannot directly control the server timeout, but the service
 * uses this value to abort an excessively long request.
 */
export const BUSINESS_LOGO_GENERATION_TIMEOUT_MS =
  180_000;

/**
 * Limit for Base64 returned by the Cloud Function.
 *
 * Base64 is larger than the source binary, so this limit is intentionally
 * greater than the permanent upload limit.
 */
export const BUSINESS_LOGO_MAX_BASE64_LENGTH =
  16_000_000;

// MARK: - Firebase Storage

export const BUSINESS_LOGO_STORAGE_ROOT =
  "businesses";

export const BUSINESS_LOGO_BRANDING_FOLDER =
  "branding";

export const BUSINESS_LOGO_ACTIVE_FOLDER =
  "active";

export const BUSINESS_LOGO_UPLOADS_FOLDER =
  "uploads";

export const BUSINESS_LOGO_GENERATED_FOLDER =
  "generated";

export const BUSINESS_LOGO_TEMPORARY_FOLDER =
  "temporary";

export const BUSINESS_LOGO_ARCHIVE_FOLDER =
  "archive";

/**
 * Returns the root branding path for one business.
 *
 * Example:
 * businesses/BUSINESS-123/branding
 */
export function buildBusinessBrandingStoragePath(
  businessID: string,
): string {
  const safeBusinessID = sanitizeStorageSegment(
    businessID,
    "unassigned-business",
  );

  return [
    BUSINESS_LOGO_STORAGE_ROOT,
    safeBusinessID,
    BUSINESS_LOGO_BRANDING_FOLDER,
  ].join("/");
}

/**
 * Permanent uploaded-logo path.
 *
 * Example:
 * businesses/BUSINESS-123/branding/uploads/uploaded-logo-uuid.png
 */
export function buildUploadedBusinessLogoStoragePath(
  businessID: string,
  logoID: string,
): string {
  return buildBusinessLogoStoragePath({
    businessID,
    folder: BUSINESS_LOGO_UPLOADS_FOLDER,
    logoID,
    prefix: "uploaded-logo",
  });
}

/**
 * Permanent Sofia-generated-logo path.
 *
 * Example:
 * businesses/BUSINESS-123/branding/generated/sofia-logo-uuid.png
 */
export function buildGeneratedBusinessLogoStoragePath(
  businessID: string,
  logoID: string,
): string {
  return buildBusinessLogoStoragePath({
    businessID,
    folder: BUSINESS_LOGO_GENERATED_FOLDER,
    logoID,
    prefix: "sofia-logo",
  });
}

/**
 * Temporary option path when temporary Storage persistence is required.
 *
 * The first implementation may keep generated options in memory and upload
 * only the selected option. This path remains available for future use.
 */
export function buildTemporaryBusinessLogoStoragePath(
  businessID: string,
  logoID: string,
): string {
  return buildBusinessLogoStoragePath({
    businessID,
    folder: BUSINESS_LOGO_TEMPORARY_FOLDER,
    logoID,
    prefix: "temporary-logo",
  });
}

/**
 * Canonical active logo path.
 *
 * This is useful if the platform later chooses to maintain one stable
 * active file per business.
 */
export function buildActiveBusinessLogoStoragePath(
  businessID: string,
): string {
  return [
    buildBusinessBrandingStoragePath(businessID),
    BUSINESS_LOGO_ACTIVE_FOLDER,
    `company-logo.${BUSINESS_LOGO_OUTPUT_EXTENSION}`,
  ].join("/");
}

interface BuildBusinessLogoStoragePathInput {
  businessID: string;
  folder: string;
  logoID: string;
  prefix: string;
}

function buildBusinessLogoStoragePath(
  input: BuildBusinessLogoStoragePathInput,
): string {
  const safeFolder = sanitizeStorageSegment(
    input.folder,
    "logos",
  );

  const safeLogoID = sanitizeStorageSegment(
    input.logoID,
    createFallbackIdentifier(),
  );

  const safePrefix = sanitizeStorageSegment(
    input.prefix,
    "business-logo",
  );

  return [
    buildBusinessBrandingStoragePath(
      input.businessID,
    ),
    safeFolder,
    `${safePrefix}-${safeLogoID}.${BUSINESS_LOGO_OUTPUT_EXTENSION}`,
  ].join("/");
}

// MARK: - Firestore

export const BUSINESS_LOGO_FIRESTORE_COLLECTION =
  "businessLogos";

export const BUSINESS_SETTINGS_FIRESTORE_COLLECTION =
  "businessSettings";

/**
 * Optional nested business subcollection layout.
 *
 * businesses/{businessID}/branding/{documentID}
 */
export const BUSINESS_BRANDING_DOCUMENT_ID =
  "branding";

export const BUSINESS_ACTIVE_LOGO_DOCUMENT_ID =
  "activeLogo";

// MARK: - Default Asset

/**
 * Public asset used when the business does not yet have a custom logo.
 *
 * Place the asset at:
 * public/branding/jcs-business-suite-logo.svg
 */
export const DEFAULT_BUSINESS_LOGO_ASSET_PATH =
  "/branding/jcs-business-suite-logo.svg";

/**
 * The default JCS asset may be designed as a template and can follow the
 * Dashboard accent color.
 */
export const DEFAULT_BUSINESS_LOGO_SUPPORTS_ACCENT_COLOR =
  true;

export const DEFAULT_BUSINESS_LOGO_USES_ACCENT_COLOR =
  true;

// MARK: - Sofia Premium Presets

export interface BusinessLogoStylePreset {
  id: string;
  title: string;
  subtitle: string;
  stylePrompt: string;
  confidence: number;
  isSofiaRecommended: boolean;
}

/**
 * Central presets used by both onboarding and App Settings.
 *
 * Keeping one list prevents the DNA and legacy flows from producing
 * inconsistent option names, prompts or confidence scores.
 */
export const BUSINESS_LOGO_STYLE_PRESETS: readonly BusinessLogoStylePreset[] =
  [
    {
      id: "sofia-signature",
      title: "Sofia Signature",
      subtitle: "Creative Director recommended",
      stylePrompt: [
        "Premium commercial brand identity",
        "distinctive industry-specific symbol",
        "refined vector-like execution",
        "clean readable typography",
        "balanced composition",
        "transparent background",
        "no mockup",
      ].join(", "),
      confidence: 98,
      isSofiaRecommended: true,
    },
    {
      id: "luxury-elegant",
      title: "Luxury Elegant",
      subtitle: "Sophisticated premium identity",
      stylePrompt: [
        "Luxury elegant professional brand identity",
        "timeless visual system",
        "refined typography",
        "controlled premium detail",
        "clean scalable edges",
        "transparent background",
        "no mockup",
      ].join(", "),
      confidence: 95,
      isSofiaRecommended: false,
    },
    {
      id: "modern-premium",
      title: "Modern Premium",
      subtitle: "Clean, memorable and contemporary",
      stylePrompt: [
        "Modern premium commercial logo",
        "strong recognizable symbol",
        "clear visual hierarchy",
        "professional color palette",
        "vector-like scalable design",
        "transparent background",
        "no mockup",
      ].join(", "),
      confidence: 92,
      isSofiaRecommended: false,
    },
    {
      id: "classic-trusted",
      title: "Classic Trusted",
      subtitle: "Polished and established brand",
      stylePrompt: [
        "Classic polished commercial logo",
        "trusted established brand personality",
        "legible professional typography",
        "balanced traditional and modern details",
        "clean scalable design",
        "transparent background",
        "no mockup",
      ].join(", "),
      confidence: 89,
      isSofiaRecommended: false,
    },
  ] as const;

// MARK: - Sofia Progress Messages

export const BUSINESS_LOGO_GENERATION_MESSAGES = {
  preparing:
    "Sofía is preparing your premium brand identity...",
  analyzing:
    "Sofía is analyzing your business and industry...",
  strategy:
    "Sofía is creating your visual brand strategy...",
  designing:
    "Sofía is designing your premium logo options...",
  processing:
    "Sofía is preparing the final logo previews...",
  ready:
    "Your premium logo options are ready.",
} as const;

// MARK: - Validation Messages

export const BUSINESS_LOGO_ERROR_MESSAGES = {
  missingBusinessID:
    "The business ID is required before saving a logo.",

  missingBusinessName:
    "Enter the business name before generating a logo.",

  missingOwnerUID:
    "The Business Owner identity is required before saving a logo.",

  invalidFile:
    "Choose a valid PNG, JPEG or WebP image.",

  unsupportedFileType:
    "This image format is not supported. Choose PNG, JPEG or WebP.",

  fileTooLarge:
    "The selected image is larger than 8 MB.",

  invalidDimensions:
    "The selected image has invalid dimensions.",

  generationFailed:
    "Sofía could not generate the logo options.",

  uploadFailed:
    "The business logo could not be uploaded.",

  saveFailed:
    "The business logo could not be saved.",

  unauthorized:
    "You do not have permission to change this business logo.",

  network:
    "The logo request could not reach the server. Check the connection and try again.",
} as const;

// MARK: - Helpers

export function isSupportedBusinessLogoMimeType(
  mimeType: string,
): mimeType is BusinessLogoSupportedMimeType {
  const normalizedMimeType = mimeType
    .trim()
    .toLowerCase();

  return BUSINESS_LOGO_SUPPORTED_MIME_TYPES.includes(
    normalizedMimeType as BusinessLogoSupportedMimeType,
  );
}

export function isBusinessLogoFileSizeAllowed(
  sizeBytes: number,
): boolean {
  return (
    Number.isFinite(sizeBytes) &&
    sizeBytes > 0 &&
    sizeBytes <= BUSINESS_LOGO_MAX_FILE_SIZE_BYTES
  );
}

export function sanitizeStorageSegment(
  value: string,
  fallback: string,
): string {
  const normalizedValue = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 100);

  if (normalizedValue.length > 0) {
    return normalizedValue;
  }

  const normalizedFallback = fallback
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 100);

  return normalizedFallback || "item";
}

export function normalizeBusinessLogoLanguageCode(
  value: string,
): string {
  const normalizedValue = value
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

  return normalizedValue || DEFAULT_BUSINESS_LOGO_LANGUAGE_CODE;
}

export function normalizeBusinessLogoConfidence(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(
    Math.max(Math.round(value), 0),
    100,
  );
}

export function getBusinessLogoStylePreset(
  presetID: string,
): BusinessLogoStylePreset {
  const normalizedPresetID = presetID
    .trim()
    .toLowerCase();

  return (
    BUSINESS_LOGO_STYLE_PRESETS.find(
      (preset) => preset.id === normalizedPresetID,
    ) ?? BUSINESS_LOGO_STYLE_PRESETS[0]
  );
}

function createFallbackIdentifier(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return [
    Date.now().toString(36),
    Math.random().toString(36).slice(2),
  ].join("-");
}