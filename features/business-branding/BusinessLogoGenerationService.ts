/*
 * JCS Business Suite Web
 * BusinessLogoGenerationService.ts
 *
 * Premium Sofia logo-generation service.
 *
 * Responsibilities:
 *
 * - Generate professional business-logo options.
 * - Send Business DNA to the Firebase Cloud Function.
 * - Produce visually distinct premium directions.
 * - Validate server responses.
 * - Normalize generated image data.
 * - Keep unselected options out of Firebase Storage.
 *
 * Firebase Storage, Firestore and React state must not live here.
 */

import {
  BUSINESS_LOGO_GENERATION_MESSAGES,
  BUSINESS_LOGO_GENERATION_TIMEOUT_MS,
  BUSINESS_LOGO_MAX_OPTION_COUNT,
  BUSINESS_LOGO_OPTION_COUNT,
  BUSINESS_LOGO_OUTPUT_MIME_TYPE,
  BUSINESS_LOGO_STYLE_PRESETS,
  DEFAULT_BUSINESS_INDUSTRY,
  DEFAULT_BUSINESS_LOGO_LANGUAGE_CODE,
  DEFAULT_BUSINESS_LOGO_STYLE,
  DEFAULT_BUSINESS_NAME,
  normalizeBusinessLogoConfidence,
  normalizeBusinessLogoLanguageCode,
} from "./BusinessLogoConstants";

import {
  createBusinessLogoOption,
  decodeGeneratedBusinessLogo,
  normalizeBusinessName,
  validateBusinessLogoGenerationResponse,
} from "./BusinessLogoDomain";

import type {
  BusinessLogoDNAContext,
  BusinessLogoGenerationInput,
  BusinessLogoGenerationResponse,
  BusinessLogoOption,
} from "./BusinessLogoTypes";

import type {
  BusinessLogoStylePreset,
} from "./BusinessLogoConstants";

// MARK: - Configuration

const DEFAULT_LOGO_GENERATION_ENDPOINT =
  "https://us-central1-jcs-business-suite.cloudfunctions.net/generateBusinessLogo";

/**
 * NEXT_PUBLIC is intentional because the request is performed
 * from the browser during onboarding and App Settings.
 */
export const BUSINESS_LOGO_GENERATION_ENDPOINT =
  process.env.NEXT_PUBLIC_JCS_LOGO_GENERATION_URL?.trim() ||
  DEFAULT_LOGO_GENERATION_ENDPOINT;

// MARK: - Progress

export type BusinessLogoGenerationStep =
  | "preparing"
  | "analyzing"
  | "strategy"
  | "designing"
  | "processing"
  | "ready";

export interface BusinessLogoGenerationProgress {
  step: BusinessLogoGenerationStep;
  message: string;

  completedOptions: number;
  totalOptions: number;

  currentPresetID: string;
  currentPresetTitle: string;
}

// MARK: - Generate Options Input

export interface GenerateBusinessLogoOptionsInput
  extends BusinessLogoGenerationInput {
  /**
   * Defaults to the four professional Sofia presets.
   */
  optionCount?: number;

  /**
   * Called as Sofia advances through the premium generation flow.
   */
  onProgress?: (
    progress: BusinessLogoGenerationProgress,
  ) => void;

  /**
   * Optional AbortSignal supplied by a React hook or component.
   */
  signal?: AbortSignal;
}

// MARK: - Generate Options Result

export type GenerateBusinessLogoOptionsResult =
  | {
      success: true;
      options: BusinessLogoOption[];
      failedOptionCount: number;
    }
  | {
      success: false;
      options: [];
      errorMessage: string;
    };

// MARK: - Single Option Input

export interface GenerateSingleBusinessLogoInput
  extends BusinessLogoGenerationInput {
  preset: BusinessLogoStylePreset;
  presetIndex: number;
  signal?: AbortSignal;
}

// MARK: - Request Payload

interface SofiaBusinessLogoRequestPayload {
  businessName: string;
  industry: string;
  businessCategory: string;

  style: string;
  tagline: string;
  languageCode: string;

  logoPrompt: string;

  businessDNA: BusinessLogoDNAContext & {
    businessID: string;
    optionPresetID: string;
    optionPresetTitle: string;
    optionSequence: number;
  };
}

// MARK: - Public Generation

/**
 * Generates several distinct premium logo options.
 *
 * The options remain in browser memory. They are not uploaded
 * to Firebase Storage until the Business Owner selects one.
 */
export async function generateBusinessLogoOptions(
  input: GenerateBusinessLogoOptionsInput,
): Promise<GenerateBusinessLogoOptionsResult> {
  const normalizedInput =
    normalizeGenerationInput(input);

  const requestedOptionCount =
    normalizeOptionCount(
      input.optionCount,
    );

  const selectedPresets =
    BUSINESS_LOGO_STYLE_PRESETS.slice(
      0,
      requestedOptionCount,
    );

  reportProgress(input.onProgress, {
    step: "preparing",
    message:
      BUSINESS_LOGO_GENERATION_MESSAGES.preparing,

    completedOptions: 0,
    totalOptions: selectedPresets.length,

    currentPresetID: "",
    currentPresetTitle: "",
  });

  reportProgress(input.onProgress, {
    step: "analyzing",
    message:
      BUSINESS_LOGO_GENERATION_MESSAGES.analyzing,

    completedOptions: 0,
    totalOptions: selectedPresets.length,

    currentPresetID: "",
    currentPresetTitle: "",
  });

  const options: BusinessLogoOption[] = [];

  let lastErrorMessage = "";

  for (
    let index = 0;
    index < selectedPresets.length;
    index += 1
  ) {
    assertRequestNotAborted(
      input.signal,
    );

    const preset =
      selectedPresets[index];

    reportProgress(input.onProgress, {
      step:
        index === 0
          ? "strategy"
          : "designing",

      message:
        index === 0
          ? BUSINESS_LOGO_GENERATION_MESSAGES.strategy
          : `Sofía is designing ${preset.title}...`,

      completedOptions:
        options.length,

      totalOptions:
        selectedPresets.length,

      currentPresetID:
        preset.id,

      currentPresetTitle:
        preset.title,
    });

    try {
      const option =
        await generateSingleBusinessLogo({
          ...normalizedInput,

          preset,
          presetIndex: index,

          signal:
            input.signal,
        });

      options.push(option);

      reportProgress(input.onProgress, {
        step: "processing",

        message:
          `Sofía completed ${preset.title}.`,

        completedOptions:
          options.length,

        totalOptions:
          selectedPresets.length,

        currentPresetID:
          preset.id,

        currentPresetTitle:
          preset.title,
      });
    } catch (error) {
      if (
        isAbortError(error) ||
        input.signal?.aborted
      ) {
        throw createLogoGenerationError(
          "generation-canceled",
          "Logo generation was canceled.",
        );
      }

      lastErrorMessage =
        getErrorMessage(
          error,
          `Sofía could not create ${preset.title}.`,
        );

      console.error(
        "Business logo option generation failed:",
        {
          presetID:
            preset.id,

          presetTitle:
            preset.title,

          error,
        },
      );
    }
  }

  if (options.length === 0) {
    return {
      success: false,
      options: [],
      errorMessage:
        lastErrorMessage ||
        "Sofía could not generate any logo options.",
    };
  }

  reportProgress(input.onProgress, {
    step: "ready",
    message:
      BUSINESS_LOGO_GENERATION_MESSAGES.ready,

    completedOptions:
      options.length,

    totalOptions:
      selectedPresets.length,

    currentPresetID: "",
    currentPresetTitle: "",
  });

  return {
    success: true,

    options:
      options.slice(
        0,
        BUSINESS_LOGO_MAX_OPTION_COUNT,
      ),

    failedOptionCount:
      selectedPresets.length -
      options.length,
  };
}

/**
 * Generates one premium logo option using one specific
 * Sofia Creative Director preset.
 */
export async function generateSingleBusinessLogo(
  input: GenerateSingleBusinessLogoInput,
): Promise<BusinessLogoOption> {
  assertRequestNotAborted(
    input.signal,
  );

  const normalizedInput =
    normalizeGenerationInput(input);

  const payload =
    createSofiaLogoRequestPayload({
      input:
        normalizedInput,

      preset:
        input.preset,

      presetIndex:
        input.presetIndex,
    });

  const response =
    await performSofiaLogoRequest({
      payload,

      signal:
        input.signal,
    });

  const validation =
    validateBusinessLogoGenerationResponse(
      response,
    );

  if (!validation.isValid) {
    throw createLogoGenerationError(
      "invalid-generation-response",
      validation.errorMessage,
    );
  }

  /*
   * Decoding also verifies that the Base64 is a real image and
   * normalizes it to a transparent PNG suitable for Storage.
   */
  const decodedLogo =
    await decodeGeneratedBusinessLogo(
      response,
      normalizedInput.businessName,
    );

  const imageDataURL =
    decodedLogo.imageDataURL;

  return createBusinessLogoOption({
    businessID:
      normalizedInput.businessID,

    businessName:
      normalizedInput.businessName,

    title:
      input.preset.title,

    subtitle:
      input.preset.subtitle,

    confidence:
      normalizeBusinessLogoConfidence(
        input.preset.confidence,
      ),

    isSofiaRecommended:
      input.preset.isSofiaRecommended,

    creativeBrief:
      response.creativeBrief?.trim() ?? "",

    promptUsed:
      response.promptUsed?.trim() ||
      payload.logoPrompt,

    mimeType:
      BUSINESS_LOGO_OUTPUT_MIME_TYPE,

    imageBase64:
      imageDataURL,
  });
}

// MARK: - Request Payload

function createSofiaLogoRequestPayload(
  input: {
    input: BusinessLogoGenerationInput;
    preset: BusinessLogoStylePreset;
    presetIndex: number;
  },
): SofiaBusinessLogoRequestPayload {
  const sourceDNA =
    normalizeBusinessDNA(
      input.input.businessDNA,
    );

  const professionalPrompt =
    buildPremiumSofiaLogoPrompt({
      generationInput:
        input.input,

      preset:
        input.preset,

      businessDNA:
        sourceDNA,
    });

  return {
    businessName:
      input.input.businessName,

    industry:
      input.input.industry,

    businessCategory:
      input.input.businessCategory,

    style:
      input.preset.stylePrompt,

    tagline:
      input.input.tagline,

    languageCode:
      input.input.languageCode,

    logoPrompt:
      professionalPrompt,

    businessDNA: {
      ...sourceDNA,

      businessID:
        input.input.businessID,

      optionPresetID:
        input.preset.id,

      optionPresetTitle:
        input.preset.title,

      optionSequence:
        input.presetIndex + 1,
    },
  };
}

// MARK: - Premium Prompt

/**
 * Gives the backend a precise art-direction brief.
 *
 * The backend remains responsible for assembling its final secure
 * system prompt and calling the configured image-generation model.
 */
function buildPremiumSofiaLogoPrompt(
  input: {
    generationInput:
      BusinessLogoGenerationInput;

    preset:
      BusinessLogoStylePreset;

    businessDNA:
      BusinessLogoDNAContext;
  },
): string {
  const businessName =
    input.generationInput.businessName;

  const industry =
    input.generationInput.industry;

  const businessCategory =
    input.generationInput.businessCategory;

  const tagline =
    input.generationInput.tagline;

  const languageCode =
    input.generationInput.languageCode;

  const visualDirection =
    cleanPromptLine(
      input.businessDNA.visualDirection,
    );

  const logoStrategy =
    cleanPromptLine(
      input.businessDNA.logoStrategy,
    );

  const typographyStyle =
    cleanPromptLine(
      input.businessDNA.typographyStyle,
    );

  const colorMood =
    normalizeStringArray(
      input.businessDNA.colorMood,
    );

  const primarySubjects =
    normalizeStringArray(
      input.businessDNA.primarySubjects,
    );

  const secondarySubjects =
    normalizeStringArray(
      input.businessDNA.secondarySubjects,
    );

  const forbiddenSubjects =
    normalizeStringArray(
      input.businessDNA.forbiddenSubjects,
    );

  const customerDirection =
    cleanPromptLine(
      input.businessDNA.targetCustomer,
    );

  const sourceCustomPrompt =
    cleanPromptLine(
      input.generationInput.logoPrompt,
    );

  return [
    "You are Sofía, the premium Creative Director for JCS Business Suite.",
    "",
    "Create a complete, original, agency-quality commercial logo.",
    "The result must feel valuable enough to represent a premium branding package.",
    "",
    "BUSINESS",
    `Exact business name: ${businessName}`,
    `Industry: ${industry}`,
    `Business category: ${businessCategory}`,
    `Language: ${languageCode}`,
    tagline
      ? `Tagline, only when it improves the composition: ${tagline}`
      : "Do not invent a tagline.",
    "",
    "SELECTED CREATIVE DIRECTION",
    `Option: ${input.preset.title}`,
    `Style: ${input.preset.stylePrompt}`,
    visualDirection
      ? `Visual direction: ${visualDirection}`
      : "",
    logoStrategy
      ? `Logo strategy: ${logoStrategy}`
      : "",
    typographyStyle
      ? `Typography direction: ${typographyStyle}`
      : "",
    customerDirection
      ? `Target customer: ${customerDirection}`
      : "",
    colorMood.length > 0
      ? `Color mood: ${colorMood.join(", ")}`
      : "",
    "",
    "PREMIUM LOGO REQUIREMENTS",
    "Create a distinctive industry-relevant symbol and integrate it professionally with the exact business name.",
    "Use clean, sharp, refined, vector-like edges and a balanced commercial composition.",
    "Use premium typography that remains readable at small and large sizes.",
    "Choose a sophisticated brand color palette specifically for this business.",
    "The logo colors are independent from the JCS dashboard Accent Color.",
    "Create a transparent background with no white box, colored square, canvas, frame or mockup.",
    "Center the complete logo and preserve generous safe margins on every side.",
    "Make the identity suitable for a website, dashboard, invoice, receipt, business card, storefront, uniform, packaging and commercial vehicle.",
    "The symbol should remain recognizable if later used separately as a compact brand mark.",
    "",
    "SUBJECT DIRECTION",
    primarySubjects.length > 0
      ? `Primary visual subjects: ${primarySubjects.join(", ")}`
      : `Use visual symbolism clearly connected to ${industry} and ${businessCategory}.`,
    secondarySubjects.length > 0
      ? `Optional secondary details: ${secondarySubjects.join(", ")}`
      : "",
    "",
    "DO NOT CREATE",
    "Do not create a generic initials badge unless initials are genuinely part of a sophisticated identity.",
    "Do not return only an icon or only a symbol.",
    "Do not use unrelated objects or generic stock-logo templates.",
    "Do not add extra words, fake slogans, labels, watermarks, signatures or color-palette strips.",
    "Do not misspell, duplicate, distort or replace the business name.",
    "Do not use a photograph, product photo, app screenshot, stationery presentation, wall sign mockup or business-card mockup.",
    "Do not put the logo inside a permanent rounded-square app-icon background.",
    "Do not crop any letters, symbols, borders or lower portions of the design.",
    forbiddenSubjects.length > 0
      ? `Explicitly forbidden subjects: ${forbiddenSubjects.join(", ")}`
      : "",
    "",
    sourceCustomPrompt
      ? "ADDITIONAL BUSINESS DIRECTION"
      : "",
    sourceCustomPrompt,
    "",
    "FINAL QUALITY STANDARD",
    "Deliver one polished, complete, transparent PNG logo composition.",
    "It must look like the final work of a professional premium branding agency, not a draft, placeholder or generic template.",
  ]
    .filter(Boolean)
    .join("\n");
}

// MARK: - Network

interface PerformSofiaLogoRequestInput {
  payload: SofiaBusinessLogoRequestPayload;
  signal?: AbortSignal;
}

async function performSofiaLogoRequest(
  input: PerformSofiaLogoRequestInput,
): Promise<BusinessLogoGenerationResponse> {
  const timeoutController =
    new AbortController();

  const timeoutID =
    globalThis.setTimeout(
      () => {
        timeoutController.abort();
      },
      BUSINESS_LOGO_GENERATION_TIMEOUT_MS,
    );

  const combinedSignal =
    combineAbortSignals(
      input.signal,
      timeoutController.signal,
    );

  try {
    const response =
      await fetch(
        BUSINESS_LOGO_GENERATION_ENDPOINT,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body:
            JSON.stringify(
              input.payload,
            ),

          signal:
            combinedSignal,
        },
      );

    const responseText =
      await response.text();

    const decoded =
      parseLogoGenerationResponse(
        responseText,
      );

    if (!response.ok) {
      throw createLogoGenerationError(
        `http-${response.status}`,

        decoded.error?.trim() ||
        decoded.message?.trim() ||
        `Logo generation failed with server code ${response.status}.`,
      );
    }

    return decoded;
  } catch (error) {
    if (
      timeoutController.signal.aborted &&
      !input.signal?.aborted
    ) {
      throw createLogoGenerationError(
        "generation-timeout",
        "Sofía took too long to generate this logo. Please try again.",
      );
    }

    if (
      isAbortError(error) ||
      input.signal?.aborted
    ) {
      throw createLogoGenerationError(
        "generation-canceled",
        "Logo generation was canceled.",
      );
    }

    throw createLogoGenerationError(
      "network-error",
      getErrorMessage(
        error,
        "Sofía could not reach the logo-generation service.",
      ),
    );
  } finally {
    globalThis.clearTimeout(
      timeoutID,
    );
  }
}

// MARK: - Response Parsing

function parseLogoGenerationResponse(
  responseText: string,
): BusinessLogoGenerationResponse {
  const cleanResponseText =
    responseText.trim();

  if (!cleanResponseText) {
    throw createLogoGenerationError(
      "empty-response",
      "The logo-generation service returned an empty response.",
    );
  }

  let decoded: unknown;

  try {
    decoded =
      JSON.parse(
        cleanResponseText,
      );
  } catch {
    throw createLogoGenerationError(
      "invalid-json",
      "The logo-generation service returned an invalid response.",
    );
  }

  if (
    !decoded ||
    typeof decoded !== "object"
  ) {
    throw createLogoGenerationError(
      "invalid-response",
      "The logo-generation service returned an invalid response.",
    );
  }

  const record =
    decoded as Record<string, unknown>;

  return {
    success:
      record.success === true,

    imageBase64:
      readOptionalString(
        record.imageBase64,
      ),

    mimeType:
      readOptionalString(
        record.mimeType,
      ),

    fileName:
      readOptionalString(
        record.fileName,
      ),

    promptUsed:
      readOptionalString(
        record.promptUsed,
      ),

    creativeBrief:
      readOptionalString(
        record.creativeBrief,
      ),

    error:
      readOptionalString(
        record.error,
      ),

    message:
      readOptionalString(
        record.message,
      ),
  };
}

// MARK: - Input Normalization

function normalizeGenerationInput(
  input: BusinessLogoGenerationInput,
): BusinessLogoGenerationInput {
  const businessID =
    input.businessID.trim();

  if (!businessID) {
    throw createLogoGenerationError(
      "missing-business-id",
      "The business ID is required before generating a logo.",
    );
  }

  const businessName =
    normalizeBusinessName(
      input.businessName,
    );

  if (
    !businessName ||
    businessName === DEFAULT_BUSINESS_NAME
  ) {
    throw createLogoGenerationError(
      "missing-business-name",
      "Enter the real business name before generating a premium logo.",
    );
  }

  return {
    businessID,

    businessName,

    industry:
      cleanLimitedText(
        input.industry,
        DEFAULT_BUSINESS_INDUSTRY,
        160,
      ),

    businessCategory:
      cleanLimitedText(
        input.businessCategory,
        input.industry ||
        DEFAULT_BUSINESS_INDUSTRY,
        160,
      ),

    style:
      cleanLimitedText(
        input.style,
        DEFAULT_BUSINESS_LOGO_STYLE,
        300,
      ),

    tagline:
      cleanLimitedText(
        input.tagline,
        "",
        180,
      ),

    languageCode:
      normalizeBusinessLogoLanguageCode(
        input.languageCode ||
        DEFAULT_BUSINESS_LOGO_LANGUAGE_CODE,
      ),

    logoPrompt:
      cleanLimitedMultilineText(
        input.logoPrompt,
        "",
        6_000,
      ),

    businessDNA:
      normalizeBusinessDNA(
        input.businessDNA,
      ),
  };
}

function normalizeBusinessDNA(
  value?: BusinessLogoDNAContext,
): BusinessLogoDNAContext {
  if (!value) {
    return {};
  }

  return {
    legalBusinessName:
      cleanPromptLine(
        value.legalBusinessName,
      ),

    businessDescription:
      cleanLimitedMultilineText(
        value.businessDescription,
        "",
        2_000,
      ),

    industryFamily:
      cleanPromptLine(
        value.industryFamily,
      ),

    industryCategory:
      cleanPromptLine(
        value.industryCategory,
      ),

    businessModeKey:
      cleanPromptLine(
        value.businessModeKey,
      ),

    brandStyle:
      cleanPromptLine(
        value.brandStyle,
      ),

    luxuryLevel:
      cleanPromptLine(
        value.luxuryLevel,
      ),

    marketPosition:
      cleanPromptLine(
        value.marketPosition,
      ),

    targetCustomer:
      cleanPromptLine(
        value.targetCustomer,
      ),

    mission:
      cleanLimitedMultilineText(
        value.mission,
        "",
        1_000,
      ),

    brandPromise:
      cleanLimitedMultilineText(
        value.brandPromise,
        "",
        1_000,
      ),

    brandVoice:
      cleanPromptLine(
        value.brandVoice,
      ),

    brandPersonality:
      normalizeStringArray(
        value.brandPersonality,
      ),

    colorMood:
      normalizeStringArray(
        value.colorMood,
      ),

    visualDirection:
      cleanLimitedMultilineText(
        value.visualDirection,
        "",
        1_500,
      ),

    logoStrategy:
      cleanLimitedMultilineText(
        value.logoStrategy,
        "",
        1_500,
      ),

    photographyStyle:
      cleanPromptLine(
        value.photographyStyle,
      ),

    typographyStyle:
      cleanPromptLine(
        value.typographyStyle,
      ),

    lightingStyle:
      cleanPromptLine(
        value.lightingStyle,
      ),

    compositionStyle:
      cleanPromptLine(
        value.compositionStyle,
      ),

    primarySubjects:
      normalizeStringArray(
        value.primarySubjects,
      ),

    secondarySubjects:
      normalizeStringArray(
        value.secondarySubjects,
      ),

    environmentSubjects:
      normalizeStringArray(
        value.environmentSubjects,
      ),

    forbiddenSubjects:
      normalizeStringArray(
        value.forbiddenSubjects,
      ),

    marketingKeywords:
      normalizeStringArray(
        value.marketingKeywords,
      ),

    seoKeywords:
      normalizeStringArray(
        value.seoKeywords,
      ),

    socialMediaKeywords:
      normalizeStringArray(
        value.socialMediaKeywords,
      ),

    advertisingAngles:
      normalizeStringArray(
        value.advertisingAngles,
      ),

    websiteStyle:
      cleanPromptLine(
        value.websiteStyle,
      ),

    businessCardStyle:
      cleanPromptLine(
        value.businessCardStyle,
      ),

    invoiceStyle:
      cleanPromptLine(
        value.invoiceStyle,
      ),

    uniformStyle:
      cleanPromptLine(
        value.uniformStyle,
      ),

    fleetStyle:
      cleanPromptLine(
        value.fleetStyle,
      ),

    officeStyle:
      cleanPromptLine(
        value.officeStyle,
      ),

    packagingStyle:
      cleanPromptLine(
        value.packagingStyle,
      ),

    aiCreativeBrief:
      cleanLimitedMultilineText(
        value.aiCreativeBrief,
        "",
        3_000,
      ),

    aiContextSummary:
      cleanLimitedMultilineText(
        value.aiContextSummary,
        "",
        3_000,
      ),

    dnaCompletionScore:
      normalizeCompletionScore(
        value.dnaCompletionScore,
      ),
  };
}

// MARK: - Option Count

function normalizeOptionCount(
  value?: number,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return Math.min(
      BUSINESS_LOGO_OPTION_COUNT,
      BUSINESS_LOGO_MAX_OPTION_COUNT,
    );
  }

  return Math.min(
    Math.max(
      Math.round(value),
      1,
    ),

    BUSINESS_LOGO_MAX_OPTION_COUNT,
  );
}

// MARK: - Progress

function reportProgress(
  callback:
    | ((
        progress:
          BusinessLogoGenerationProgress,
      ) => void)
    | undefined,

  progress:
    BusinessLogoGenerationProgress,
): void {
  try {
    callback?.(progress);
  } catch (error) {
    console.warn(
      "Business logo progress callback failed:",
      error,
    );
  }
}

// MARK: - Abort Handling

function combineAbortSignals(
  firstSignal?: AbortSignal,
  secondSignal?: AbortSignal,
): AbortSignal {
  const availableSignals =
    [
      firstSignal,
      secondSignal,
    ].filter(
      (
        signal,
      ): signal is AbortSignal =>
        Boolean(signal),
    );

  if (availableSignals.length === 0) {
    return new AbortController()
      .signal;
  }

  if (availableSignals.length === 1) {
    return availableSignals[0];
  }

  const controller =
    new AbortController();

  const abort = () => {
    controller.abort();
  };

  for (
    const signal of availableSignals
  ) {
    if (signal.aborted) {
      controller.abort();
      break;
    }

    signal.addEventListener(
      "abort",
      abort,
      {
        once: true,
      },
    );
  }

  return controller.signal;
}

function assertRequestNotAborted(
  signal?: AbortSignal,
): void {
  if (signal?.aborted) {
    throw createLogoGenerationError(
      "generation-canceled",
      "Logo generation was canceled.",
    );
  }
}

function isAbortError(
  error: unknown,
): boolean {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

// MARK: - Text Helpers

function cleanLimitedText(
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

function cleanLimitedMultilineText(
  value: string | undefined,
  fallback: string,
  maximumLength: number,
): string {
  const normalizedValue =
    value
      ?.trim()
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .slice(
        0,
        maximumLength,
      ) ?? "";

  return normalizedValue ||
    fallback;
}

function cleanPromptLine(
  value: string | undefined,
): string {
  return (
    value
      ?.trim()
      .replace(/\s+/g, " ")
      .slice(0, 500) ?? ""
  );
}

function normalizeStringArray(
  value?: string[],
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map(
          (item) =>
            cleanPromptLine(item),
        )
        .filter(Boolean),
    ),
  ).slice(0, 30);
}

function normalizeCompletionScore(
  value?: number,
): number | undefined {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return undefined;
  }

  return Math.min(
    Math.max(
      Math.round(value),
      0,
    ),
    100,
  );
}

function readOptionalString(
  value: unknown,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalizedValue =
    value.trim();

  return normalizedValue ||
    undefined;
}

// MARK: - Errors

export class BusinessLogoGenerationServiceError
  extends Error {
  readonly code: string;

  constructor(
    code: string,
    message: string,
  ) {
    super(message);

    this.name =
      "BusinessLogoGenerationServiceError";

    this.code =
      code;
  }
}

function createLogoGenerationError(
  code: string,
  message: string,
): BusinessLogoGenerationServiceError {
  return new BusinessLogoGenerationServiceError(
    code,
    message,
  );
}

function getErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallbackMessage;
}