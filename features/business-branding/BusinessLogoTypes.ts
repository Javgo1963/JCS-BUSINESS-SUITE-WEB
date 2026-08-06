/*
 * JCS Business Suite Web
 * BusinessLogoTypes.ts
 *
 * Shared contracts for:
 *
 * - Sofia premium AI logo generation
 * - Business logo options
 * - Uploaded business logos
 * - Firebase Storage persistence
 * - Firestore branding configuration
 * - Accent-color-compatible template logos
 *
 * This file must not contain React components,
 * Firebase calls, or UI-specific behavior.
 */

export const BUSINESS_LOGO_SOURCE_VALUES = [
  "default",
  "ai-generated",
  "uploaded",
] as const;

export type BusinessLogoSource =
  (typeof BUSINESS_LOGO_SOURCE_VALUES)[number];

export const BUSINESS_LOGO_STATUS_VALUES = [
  "temporary",
  "active",
  "archived",
] as const;

export type BusinessLogoStatus =
  (typeof BUSINESS_LOGO_STATUS_VALUES)[number];

export const BUSINESS_LOGO_RENDERING_VALUES = [
  "original",
  "template",
] as const;

export type BusinessLogoRenderingMode =
  (typeof BUSINESS_LOGO_RENDERING_VALUES)[number];

/**
 * A temporary logo option produced by Sofia.
 *
 * These options may exist only during onboarding until
 * the Business Owner chooses one.
 */
export interface BusinessLogoOption {
  id: string;

  businessID: string;
  businessName: string;

  title: string;
  subtitle: string;

  source: "ai-generated";
  status: "temporary";

  confidence: number;
  isSofiaRecommended: boolean;

  creativeBrief: string;
  promptUsed: string;

  mimeType: string;
  imageBase64: string;

  /**
   * Optional temporary Firebase Storage location.
   * The first implementation can keep options in memory
   * and upload only the selected logo.
   */
  temporaryStoragePath?: string;
  temporaryDownloadURL?: string;

  createdAtISO: string;
}

/**
 * Persisted metadata for the active business logo.
 *
 * The image itself lives in Firebase Storage.
 * Firestore stores this metadata and the Storage reference.
 */
export interface BusinessLogoRecord {
  id: string;

  businessID: string;
  ownerUID: string;
  createdByUID: string;

  businessName: string;

  source: BusinessLogoSource;
  status: BusinessLogoStatus;

  storagePath: string;
  downloadURL: string;

  originalFileName: string;
  storedFileName: string;
  mimeType: string;

  width: number | null;
  height: number | null;
  sizeBytes: number | null;

  /**
   * True only for monochrome/template assets specifically
   * designed to accept the Dashboard Accent Color.
   */
  supportsAccentColor: boolean;

  renderingMode: BusinessLogoRenderingMode;
  useAccentColor: boolean;

  creativeBrief: string;
  promptUsed: string;

  createdAtISO: string;
  updatedAtISO: string;
}

/**
 * Branding fields stored with the business App Settings.
 *
 * This intentionally mirrors the useful behavior from
 * AppSettings.swift without copying local iOS file storage.
 */
export interface BusinessBrandingSettings {
  businessID: string;

  companyName: string;
  accentColorName: string;

  activeLogoID: string;
  activeLogoSource: BusinessLogoSource;

  logoStoragePath: string;
  logoDownloadURL: string;

  logoRenderingMode: BusinessLogoRenderingMode;
  logoSupportsAccentColor: boolean;
  useAccentColorForLogo: boolean;

  updatedAtISO: string;
}

/**
 * Input sent to Sofia for premium logo generation.
 */
export interface BusinessLogoGenerationInput {
  businessID: string;
  businessName: string;

  industry: string;
  businessCategory: string;

  style: string;
  tagline: string;
  languageCode: string;

  logoPrompt: string;

  businessDNA?: BusinessLogoDNAContext;
}

/**
 * Structured Business DNA sent to the backend.
 *
 * Arrays remain arrays instead of comma-separated strings.
 * This creates a safer and clearer API contract.
 */
export interface BusinessLogoDNAContext {
  legalBusinessName?: string;
  businessDescription?: string;

  industryFamily?: string;
  industryCategory?: string;
  businessModeKey?: string;

  brandStyle?: string;
  luxuryLevel?: string;
  marketPosition?: string;
  targetCustomer?: string;

  mission?: string;
  brandPromise?: string;
  brandVoice?: string;

  brandPersonality?: string[];
  colorMood?: string[];

  visualDirection?: string;
  logoStrategy?: string;

  photographyStyle?: string;
  typographyStyle?: string;
  lightingStyle?: string;
  compositionStyle?: string;

  primarySubjects?: string[];
  secondarySubjects?: string[];
  environmentSubjects?: string[];
  forbiddenSubjects?: string[];

  marketingKeywords?: string[];
  seoKeywords?: string[];
  socialMediaKeywords?: string[];
  advertisingAngles?: string[];

  websiteStyle?: string;
  businessCardStyle?: string;
  invoiceStyle?: string;
  uniformStyle?: string;
  fleetStyle?: string;
  officeStyle?: string;
  packagingStyle?: string;

  aiCreativeBrief?: string;
  aiContextSummary?: string;

  dnaCompletionScore?: number;
}

/**
 * Response contract expected from the Firebase Cloud Function.
 */
export interface BusinessLogoGenerationResponse {
  success: boolean;

  imageBase64?: string;
  mimeType?: string;
  fileName?: string;

  promptUsed?: string;
  creativeBrief?: string;

  error?: string;
  message?: string;
}

/**
 * Result returned by the web generation service.
 */
export type BusinessLogoGenerationResult =
  | {
      success: true;
      option: BusinessLogoOption;
    }
  | {
      success: false;
      errorMessage: string;
    };

/**
 * Upload input produced by the browser file picker.
 */
export interface UploadedBusinessLogoInput {
  businessID: string;
  ownerUID: string;
  createdByUID: string;

  businessName: string;
  file: File;

  supportsAccentColor?: boolean;
}

/**
 * Input used when the Business Owner selects one Sofia option.
 */
export interface SelectGeneratedLogoInput {
  businessID: string;
  ownerUID: string;
  createdByUID: string;

  businessName: string;
  option: BusinessLogoOption;
}

/**
 * UI state used by logo picker and generation screens.
 */
export interface BusinessLogoUIState {
  isLoading: boolean;
  isGenerating: boolean;
  isUploading: boolean;
  isSaving: boolean;

  currentStepMessage: string;
  errorMessage: string;

  options: BusinessLogoOption[];
  selectedOptionID: string;
}

/**
 * Safe empty state for hooks and reducers.
 */
export const EMPTY_BUSINESS_LOGO_UI_STATE: BusinessLogoUIState = {
  isLoading: false,
  isGenerating: false,
  isUploading: false,
  isSaving: false,

  currentStepMessage: "",
  errorMessage: "",

  options: [],
  selectedOptionID: "",
};

export function isBusinessLogoSource(
  value: unknown,
): value is BusinessLogoSource {
  return (
    typeof value === "string" &&
    BUSINESS_LOGO_SOURCE_VALUES.includes(
      value as BusinessLogoSource,
    )
  );
}

export function isBusinessLogoRenderingMode(
  value: unknown,
): value is BusinessLogoRenderingMode {
  return (
    typeof value === "string" &&
    BUSINESS_LOGO_RENDERING_VALUES.includes(
      value as BusinessLogoRenderingMode,
    )
  );
}

export function clampLogoConfidence(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(Math.round(value), 0), 100);
}

export function createBusinessLogoID(): string {
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