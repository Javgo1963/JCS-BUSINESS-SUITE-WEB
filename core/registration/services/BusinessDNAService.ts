/**
 * ==============================================================
 * JCS BUSINESS SUITE WEB
 * BusinessDNAService.ts
 * --------------------------------------------------------------
 * Creates the initial Business DNA document for a newly
 * registered JCS Business Suite tenant.
 *
 * Firestore structure:
 *
 * businessDNA/{businessID}
 *
 * This service mirrors:
 *
 * - JCSBusinessDNA.swift
 * - JCSBusinessDNAEngine.swift
 *
 * Responsibilities:
 *
 * - Resolve the business knowledge profile.
 * - Build the complete initial Business DNA.
 * - Create Sofia's initial context and summaries.
 * - Build the first professional logo prompt.
 * - Persist the Business DNA in Firestore.
 * - Support registration rollback.
 *
 * This service does not:
 *
 * - Create authentication accounts.
 * - Create Business documents.
 * - Create AppUser documents.
 * - Create AppSettings documents.
 * - Create PlatformClient documents.
 * - Generate the actual logo image.
 * ==============================================================
 */

import {
  deleteDoc,
  doc,
  setDoc,
  Timestamp,
  type Firestore,
} from "firebase/firestore";

// MARK: - Collection

export const BUSINESS_DNA_COLLECTION_NAME =
  "businessDNA";

// MARK: - Defaults

export const DEFAULT_BUSINESS_DNA_BRAND_STYLE =
  "Premium";

export const DEFAULT_BUSINESS_DNA_ACCENT_COLOR =
  "blue";

export const DEFAULT_BUSINESS_DNA_LANGUAGE_CODE =
  "en";

export const DEFAULT_BUSINESS_DNA_LOCALE_IDENTIFIER =
  "en_US";

export const DEFAULT_BUSINESS_DNA_COUNTRY_CODE =
  "US";

export const DEFAULT_BUSINESS_DNA_CURRENCY_CODE =
  "USD";

export const DEFAULT_BUSINESS_DNA_TIME_ZONE =
  "America/New_York";

export const DEFAULT_BUSINESS_DNA_MEASUREMENT_SYSTEM =
  "us";

export const DEFAULT_BUSINESS_DNA_AI_PERSONALITY =
  "Professional, helpful, clear, premium and business-focused.";

export const DEFAULT_BUSINESS_DNA_COMPLETION_SCORE =
  0.86;

// MARK: - Common Forbidden Subjects

export const COMMON_FORBIDDEN_SUBJECTS: readonly string[] = [
  "random cars",
  "BMW",
  "unrelated vehicles",
  "pizza",
  "restaurant food",
  "medical objects when not healthcare",
  "construction equipment when not construction",
  "beauty salon objects when not beauty",
  "wrong industry imagery",
  "cartoon",
  "cheap icon",
];

// MARK: - Knowledge Profile

/**
 * Cross-platform equivalent of JCSBusinessKnowledgeProfile.
 *
 * A future JCSBusinessKnowledgeBase.ts implementation will return
 * this object.
 */
export interface JCSBusinessKnowledgeProfile {
  industryFamily: string;
  businessCategory: string;

  missionFocus: string;
  brandVoice: string;
  luxuryLevel: string;
  marketPosition: string;
  targetCustomer: string;

  visualDirection: string;
  logoStrategy: string;
  photographyStyle: string;
  typographyStyle: string;
  lightingStyle: string;
  compositionStyle: string;

  brandPersonality: readonly string[];
  colorMood: readonly string[];

  primarySubjects: readonly string[];
  secondarySubjects: readonly string[];
  environmentSubjects: readonly string[];
  forbiddenSubjects: readonly string[];

  marketingKeywords: readonly string[];
  seoKeywords: readonly string[];
  socialMediaKeywords: readonly string[];
  advertisingAngles: readonly string[];

  websiteStyle: string;
  businessCardStyle: string;
  invoiceStyle: string;
  uniformStyle: string;
  fleetStyle: string;
  officeStyle: string;
  packagingStyle: string;

  aiCreativeBrief: string;
}

/**
 * Abstraction used by BusinessDNAService to obtain the correct
 * knowledge profile.
 *
 * This prevents BusinessDNAService from depending directly on a
 * hard-coded knowledge-base implementation.
 */
export interface BusinessKnowledgeProfileProvider {
  profile(input: {
    industryFamily: string;
    businessCategory: string;
    businessName: string;
  }): JCSBusinessKnowledgeProfile;
}

// MARK: - Request

export interface CreateBusinessDNARequest {
  // Identity

  businessID: string;
  ownerUID: string;
  createdByUID: string;

  // Business

  businessName: string;
  legalBusinessName?: string;
  tagline?: string;
  businessDescription?: string;

  // Industry

  industryKey?: string;
  industryTitle: string;
  industryCategory: string;
  businessModeKey: string;

  // Branding

  brandStyle?: string;
  accentColorName?: string;
  logoFileName?: string;
  logoPrompt?: string;
  generatedByAI?: boolean;

  // Locale

  languageCode?: string;
  localeIdentifier?: string;
  countryCode?: string;
  currencyCode?: string;
  timeZoneIdentifier?: string;
  measurementSystem?: string;
}

// MARK: - Result

export interface BusinessDNACreationResult {
  businessDNAID: string;

  businessID: string;
  ownerUID: string;
  createdByUID: string;

  businessName: string;

  industryKey: string;
  industryTitle: string;
  industryCategory: string;
  businessModeKey: string;

  brandStyle: string;
  accentColorName: string;

  generatedByAI: boolean;
  dnaCompletionScore: number;

  documentPath: string;

  createdAt: string;
  updatedAt: string;
}

// MARK: - Firestore Document

export interface BusinessDNAFirestoreDocument {
  // Identity

  id: string;
  businessID: string;
  ownerUID: string;
  createdByUID: string;

  businessName: string;
  legalBusinessName: string;
  tagline: string;
  businessDescription: string;

  // Industry

  industryKey: string;
  industryTitle: string;
  industryCategory: string;
  businessModeKey: string;

  // Branding

  brandStyle: string;
  accentColorName: string;
  logoFileName: string;
  logoPrompt: string;
  generatedByAI: boolean;

  // AI

  aiPersonality: string;
  aiSystemPrompt: string;
  aiContextSummary: string;

  // Locale

  languageCode: string;
  localeIdentifier: string;
  countryCode: string;
  currencyCode: string;
  timeZoneIdentifier: string;
  measurementSystem: string;

  // Business Intelligence DNA

  mission: string;
  brandPromise: string;
  brandVoice: string;
  luxuryLevel: string;
  marketPosition: string;
  targetCustomer: string;

  visualDirection: string;
  logoStrategy: string;
  photographyStyle: string;
  typographyStyle: string;
  lightingStyle: string;
  compositionStyle: string;

  brandPersonalityText: string;
  colorMoodText: string;
  primarySubjectsText: string;
  secondarySubjectsText: string;
  environmentSubjectsText: string;
  forbiddenSubjectsText: string;

  marketingKeywordsText: string;
  seoKeywordsText: string;
  socialMediaKeywordsText: string;
  advertisingAnglesText: string;

  websiteStyle: string;
  businessCardStyle: string;
  invoiceStyle: string;
  uniformStyle: string;
  fleetStyle: string;
  officeStyle: string;
  packagingStyle: string;

  sofiaGreeting: string;
  sofiaSummary: string;
  aiCreativeBrief: string;
  dnaCompletionScore: number;

  // Metadata

  createdAt: Timestamp;
  updatedAt: Timestamp;

  source: "web";
  schemaVersion: number;
}

// MARK: - Error

export class BusinessDNAServiceError extends Error {
  readonly code: string;
  readonly originalError?: unknown;

  constructor(
    code: string,
    message: string,
    originalError?: unknown
  ) {
    super(message);

    this.name =
      "BusinessDNAServiceError";

    this.code = code;
    this.originalError = originalError;

    Object.setPrototypeOf(
      this,
      BusinessDNAServiceError.prototype
    );
  }
}

// MARK: - Service Options

export interface BusinessDNAServiceOptions {
  db: Firestore;

  knowledgeProfileProvider:
    BusinessKnowledgeProfileProvider;

  collectionName?: string;
}

// MARK: - Normalized Request

interface NormalizedCreateBusinessDNARequest {
  businessID: string;
  ownerUID: string;
  createdByUID: string;

  businessName: string;
  legalBusinessName: string;
  tagline: string;
  businessDescription: string;

  industryKey: string;
  industryTitle: string;
  industryCategory: string;
  businessModeKey: string;

  brandStyle: string;
  accentColorName: string;
  logoFileName: string;
  logoPrompt: string;
  generatedByAI: boolean;

  languageCode: string;
  localeIdentifier: string;
  countryCode: string;
  currencyCode: string;
  timeZoneIdentifier: string;
  measurementSystem: string;
}

// MARK: - Service

export class BusinessDNAService {
  private readonly db: Firestore;

  private readonly knowledgeProfileProvider:
    BusinessKnowledgeProfileProvider;

  private readonly collectionName: string;

  constructor(
    options: BusinessDNAServiceOptions
  ) {
    if (
      !options ||
      typeof options !== "object"
    ) {
      throw new BusinessDNAServiceError(
        "business-dna/invalid-options",
        "BusinessDNAService requires valid constructor options."
      );
    }

    if (!options.db) {
      throw new BusinessDNAServiceError(
        "business-dna/missing-firestore",
        "BusinessDNAService requires a Firestore instance."
      );
    }

    if (
      !options.knowledgeProfileProvider ||
      typeof options.knowledgeProfileProvider.profile !==
        "function"
    ) {
      throw new BusinessDNAServiceError(
        "business-dna/missing-knowledge-provider",
        "BusinessDNAService requires a business knowledge profile provider."
      );
    }

    this.db =
      options.db;

    this.knowledgeProfileProvider =
      options.knowledgeProfileProvider;

    this.collectionName =
      this.optionalText(
        options.collectionName
      ) ??
      BUSINESS_DNA_COLLECTION_NAME;
  }

  /**
   * Creates:
   *
   * businessDNA/{businessID}
   */
  async createBusinessDNA(
    request: CreateBusinessDNARequest
  ): Promise<BusinessDNACreationResult> {
    const normalizedRequest =
      this.normalizeAndValidateRequest(
        request
      );

    const profile =
      this.resolveKnowledgeProfile(
        normalizedRequest
      );

    const businessDNAID =
      this.createStableLocalID();

    const now =
      Timestamp.now();

    const resolvedTagline =
      normalizedRequest.tagline ||
      profile.marketPosition;

    const resolvedBusinessDescription =
      normalizedRequest.businessDescription ||
      profile.missionFocus;

    const resolvedIndustryKey =
      normalizedRequest.industryKey ||
      this.slug(
        normalizedRequest.industryTitle
      );

    const resolvedIndustryTitle =
      this.clean(profile.industryFamily) ||
      normalizedRequest.industryTitle;

    const resolvedIndustryCategory =
      this.clean(profile.businessCategory) ||
      normalizedRequest.industryCategory;

    const resolvedBusinessModeKey =
      normalizedRequest.businessModeKey ||
      resolvedIndustryCategory;

    const forbiddenSubjects =
      this.mergeStringArrays(
        profile.forbiddenSubjects,
        COMMON_FORBIDDEN_SUBJECTS
      );

    const aiContextSummary =
      this.makeContextSummary({
        businessName:
          normalizedRequest.businessName,

        profile,

        forbiddenSubjects,
      });

    const logoPromptContext =
      this.makeLogoPromptContext({
        businessName:
          normalizedRequest.businessName,

        industryTitle:
          resolvedIndustryTitle,

        industryCategory:
          resolvedIndustryCategory,

        businessModeKey:
          resolvedBusinessModeKey,

        businessDescription:
          resolvedBusinessDescription,

        brandStyle:
          normalizedRequest.brandStyle,

        profile,

        forbiddenSubjects,
      });

    const generatedLogoPrompt =
      this.makeInitialLogoPrompt({
        businessName:
          normalizedRequest.businessName,

        industryTitle:
          resolvedIndustryTitle,

        industryCategory:
          resolvedIndustryCategory,

        logoPromptContext,

        forbiddenSubjects,
      });

    /**
     * JCSBusinessDNAEngine.swift regenerates the initial logoPrompt
     * after applying the profile.
     *
     * For parity, the service-generated prompt becomes canonical.
     * A supplied logoPrompt may still be incorporated later through
     * a separate logo-generation workflow.
     */
    const finalLogoPrompt =
      generatedLogoPrompt;

    const sofiaGreeting =
      this.makeSofiaGreeting(
        normalizedRequest.businessName
      );

    const sofiaSummary =
      this.makeSofiaSummary({
        businessName:
          normalizedRequest.businessName,

        industryTitle:
          resolvedIndustryTitle,

        industryCategory:
          resolvedIndustryCategory,

        luxuryLevel:
          profile.luxuryLevel,

        marketPosition:
          profile.marketPosition,
      });

    const document:
      BusinessDNAFirestoreDocument = {
        // Identity

        id:
          businessDNAID,

        businessID:
          normalizedRequest.businessID,

        ownerUID:
          normalizedRequest.ownerUID,

        createdByUID:
          normalizedRequest.createdByUID,

        businessName:
          normalizedRequest.businessName,

        legalBusinessName:
          normalizedRequest.legalBusinessName,

        tagline:
          resolvedTagline,

        businessDescription:
          resolvedBusinessDescription,

        // Industry

        industryKey:
          resolvedIndustryKey,

        industryTitle:
          resolvedIndustryTitle,

        industryCategory:
          resolvedIndustryCategory,

        businessModeKey:
          resolvedBusinessModeKey,

        // Branding

        brandStyle:
          normalizedRequest.brandStyle,

        accentColorName:
          normalizedRequest.accentColorName,

        logoFileName:
          normalizedRequest.logoFileName,

        logoPrompt:
          finalLogoPrompt,

        generatedByAI:
          normalizedRequest.generatedByAI,

        // AI

        aiPersonality:
          this.clean(profile.brandVoice) ||
          DEFAULT_BUSINESS_DNA_AI_PERSONALITY,

        aiSystemPrompt:
          profile.aiCreativeBrief,

        aiContextSummary,

        // Locale

        languageCode:
          normalizedRequest.languageCode,

        localeIdentifier:
          normalizedRequest.localeIdentifier,

        countryCode:
          normalizedRequest.countryCode,

        currencyCode:
          normalizedRequest.currencyCode,

        timeZoneIdentifier:
          normalizedRequest.timeZoneIdentifier,

        measurementSystem:
          normalizedRequest.measurementSystem,

        // Business Intelligence DNA

        mission:
          profile.missionFocus,

        brandPromise:
          profile.missionFocus,

        brandVoice:
          profile.brandVoice,

        luxuryLevel:
          profile.luxuryLevel,

        marketPosition:
          profile.marketPosition,

        targetCustomer:
          profile.targetCustomer,

        visualDirection:
          profile.visualDirection,

        logoStrategy:
          profile.logoStrategy,

        photographyStyle:
          profile.photographyStyle,

        typographyStyle:
          profile.typographyStyle,

        lightingStyle:
          profile.lightingStyle,

        compositionStyle:
          profile.compositionStyle,

        brandPersonalityText:
          this.joinValues(
            profile.brandPersonality
          ),

        colorMoodText:
          this.joinValues(
            profile.colorMood
          ),

        primarySubjectsText:
          this.joinValues(
            profile.primarySubjects
          ),

        secondarySubjectsText:
          this.joinValues(
            profile.secondarySubjects
          ),

        environmentSubjectsText:
          this.joinValues(
            profile.environmentSubjects
          ),

        forbiddenSubjectsText:
          this.joinValues(
            forbiddenSubjects
          ),

        marketingKeywordsText:
          this.joinValues(
            profile.marketingKeywords
          ),

        seoKeywordsText:
          this.joinValues(
            profile.seoKeywords
          ),

        socialMediaKeywordsText:
          this.joinValues(
            profile.socialMediaKeywords
          ),

        advertisingAnglesText:
          this.joinValues(
            profile.advertisingAngles
          ),

        websiteStyle:
          profile.websiteStyle,

        businessCardStyle:
          profile.businessCardStyle,

        invoiceStyle:
          profile.invoiceStyle,

        uniformStyle:
          profile.uniformStyle,

        fleetStyle:
          profile.fleetStyle,

        officeStyle:
          profile.officeStyle,

        packagingStyle:
          profile.packagingStyle,

        sofiaGreeting,
        sofiaSummary,

        aiCreativeBrief:
          profile.aiCreativeBrief,

        dnaCompletionScore:
          DEFAULT_BUSINESS_DNA_COMPLETION_SCORE,

        // Metadata

        createdAt:
          now,

        updatedAt:
          now,

        source:
          "web",

        schemaVersion:
          1,
      };

    const reference =
      doc(
        this.db,
        this.collectionName,
        normalizedRequest.businessID
      );

    try {
      await setDoc(
        reference,
        document
      );

      const timestamp =
        now.toDate().toISOString();

      return {
        businessDNAID,

        businessID:
          document.businessID,

        ownerUID:
          document.ownerUID,

        createdByUID:
          document.createdByUID,

        businessName:
          document.businessName,

        industryKey:
          document.industryKey,

        industryTitle:
          document.industryTitle,

        industryCategory:
          document.industryCategory,

        businessModeKey:
          document.businessModeKey,

        brandStyle:
          document.brandStyle,

        accentColorName:
          document.accentColorName,

        generatedByAI:
          document.generatedByAI,

        dnaCompletionScore:
          document.dnaCompletionScore,

        documentPath:
          reference.path,

        createdAt:
          timestamp,

        updatedAt:
          timestamp,
      };
    } catch (error: unknown) {
      throw this.normalizeFirestoreError(
        error
      );
    }
  }

  /**
   * Removes the Business DNA document if a later registration
   * step fails.
   */
  async rollbackBusinessDNA(
    businessID: string
  ): Promise<void> {
    const normalizedBusinessID =
      this.requireText(
        businessID,
        "A business ID is required to rollback Business DNA."
      );

    try {
      const reference =
        doc(
          this.db,
          this.collectionName,
          normalizedBusinessID
        );

      await deleteDoc(reference);
    } catch (error: unknown) {
      console.error(
        "[BusinessDNAService] Unable to rollback Business DNA:",
        error
      );
    }
  }

  // MARK: - Profile Resolution

  private resolveKnowledgeProfile(
    request: NormalizedCreateBusinessDNARequest
  ): JCSBusinessKnowledgeProfile {
    try {
      const profile =
        this.knowledgeProfileProvider.profile({
          industryFamily:
            request.industryTitle,

          businessCategory:
            request.industryCategory ||
            request.businessModeKey,

          businessName:
            request.businessName,
        });

      return this.normalizeKnowledgeProfile(
        profile,
        request
      );
    } catch (error: unknown) {
      throw new BusinessDNAServiceError(
        "business-dna/profile-resolution-failed",
        "The business knowledge profile could not be resolved.",
        error
      );
    }
  }

  private normalizeKnowledgeProfile(
    profile: JCSBusinessKnowledgeProfile,
    request: NormalizedCreateBusinessDNARequest
  ): JCSBusinessKnowledgeProfile {
    if (
      !profile ||
      typeof profile !== "object"
    ) {
      throw new BusinessDNAServiceError(
        "business-dna/invalid-profile",
        "The business knowledge provider returned an invalid profile."
      );
    }

    return {
      industryFamily:
        this.clean(profile.industryFamily) ||
        request.industryTitle,

      businessCategory:
        this.clean(profile.businessCategory) ||
        request.industryCategory ||
        request.businessModeKey,

      missionFocus:
        this.clean(profile.missionFocus),

      brandVoice:
        this.clean(profile.brandVoice) ||
        DEFAULT_BUSINESS_DNA_AI_PERSONALITY,

      luxuryLevel:
        this.clean(profile.luxuryLevel) ||
        DEFAULT_BUSINESS_DNA_BRAND_STYLE,

      marketPosition:
        this.clean(profile.marketPosition),

      targetCustomer:
        this.clean(profile.targetCustomer),

      visualDirection:
        this.clean(profile.visualDirection),

      logoStrategy:
        this.clean(profile.logoStrategy),

      photographyStyle:
        this.clean(profile.photographyStyle),

      typographyStyle:
        this.clean(profile.typographyStyle),

      lightingStyle:
        this.clean(profile.lightingStyle),

      compositionStyle:
        this.clean(profile.compositionStyle),

      brandPersonality:
        this.normalizeStringArray(
          profile.brandPersonality
        ),

      colorMood:
        this.normalizeStringArray(
          profile.colorMood
        ),

      primarySubjects:
        this.normalizeStringArray(
          profile.primarySubjects
        ),

      secondarySubjects:
        this.normalizeStringArray(
          profile.secondarySubjects
        ),

      environmentSubjects:
        this.normalizeStringArray(
          profile.environmentSubjects
        ),

      forbiddenSubjects:
        this.normalizeStringArray(
          profile.forbiddenSubjects
        ),

      marketingKeywords:
        this.normalizeStringArray(
          profile.marketingKeywords
        ),

      seoKeywords:
        this.normalizeStringArray(
          profile.seoKeywords
        ),

      socialMediaKeywords:
        this.normalizeStringArray(
          profile.socialMediaKeywords
        ),

      advertisingAngles:
        this.normalizeStringArray(
          profile.advertisingAngles
        ),

      websiteStyle:
        this.clean(profile.websiteStyle),

      businessCardStyle:
        this.clean(profile.businessCardStyle),

      invoiceStyle:
        this.clean(profile.invoiceStyle),

      uniformStyle:
        this.clean(profile.uniformStyle),

      fleetStyle:
        this.clean(profile.fleetStyle),

      officeStyle:
        this.clean(profile.officeStyle),

      packagingStyle:
        this.clean(profile.packagingStyle),

      aiCreativeBrief:
        this.clean(profile.aiCreativeBrief),
    };
  }

  // MARK: - Builders

  private makeSofiaGreeting(
    businessName: string
  ): string {
    return [
      "Hello. I’m Sofia.",
      `I’m learning ${businessName} so I can help build a professional brand, workspace and business identity.`,
    ].join(" ");
  }

  private makeSofiaSummary(input: {
    businessName: string;
    industryTitle: string;
    industryCategory: string;
    luxuryLevel: string;
    marketPosition: string;
  }): string {
    return [
      `I identified ${input.businessName} as a`,
      `${input.industryCategory} business inside`,
      `${input.industryTitle}.`,
      `I created a ${input.luxuryLevel.toLowerCase()}`,
      `direction focused on ${input.marketPosition.toLowerCase()}.`,
    ].join(" ");
  }

  private makeContextSummary(input: {
    businessName: string;
    profile: JCSBusinessKnowledgeProfile;
    forbiddenSubjects: readonly string[];
  }): string {
    return [
      `${input.businessName} is a`,
      `${input.profile.businessCategory} business in`,
      `${input.profile.industryFamily}.`,
      `The brand should feel`,
      `${this.joinValues(input.profile.brandPersonality)}.`,
      `Target customer:`,
      `${input.profile.targetCustomer}.`,
      `Visual direction:`,
      `${input.profile.visualDirection}.`,
      `Avoid:`,
      `${this.joinValues(input.forbiddenSubjects)}.`,
    ].join(" ");
  }

  private makeLogoPromptContext(input: {
    businessName: string;
    industryTitle: string;
    industryCategory: string;
    businessModeKey: string;
    businessDescription: string;
    brandStyle: string;
    profile: JCSBusinessKnowledgeProfile;
    forbiddenSubjects: readonly string[];
  }): string {
    return `
BUSINESS DNA

Business Name:
${input.businessName}

Industry:
${input.industryTitle}

Category:
${input.industryCategory}

Business Mode:
${input.businessModeKey}

Business Description:
${input.businessDescription}

Brand Style:
${input.brandStyle}

Luxury Level:
${input.profile.luxuryLevel}

Mission:
${input.profile.missionFocus}

Brand Promise:
${input.profile.missionFocus}

Brand Personality:
${this.joinValues(input.profile.brandPersonality)}

Target Customer:
${input.profile.targetCustomer}

Visual Direction:
${input.profile.visualDirection}

Logo Strategy:
${input.profile.logoStrategy}

Photography:
${input.profile.photographyStyle}

Typography:
${input.profile.typographyStyle}

Lighting:
${input.profile.lightingStyle}

Primary Subjects:
${this.joinValues(input.profile.primarySubjects)}

Secondary Subjects:
${this.joinValues(input.profile.secondarySubjects)}

Environment:
${this.joinValues(input.profile.environmentSubjects)}

Forbidden Subjects:
${this.joinValues(input.forbiddenSubjects)}

Creative Brief:
${input.profile.aiCreativeBrief}
    `.trim();
  }

  private makeInitialLogoPrompt(input: {
    businessName: string;
    industryTitle: string;
    industryCategory: string;
    logoPromptContext: string;
    forbiddenSubjects: readonly string[];
  }): string {
    return `
Create a premium professional business logo for ${input.businessName}.

Use this Business DNA:
${input.logoPromptContext}

Important:
The logo must clearly match ${input.industryTitle} / ${input.industryCategory}.
Do not include unrelated subjects.
Avoid: ${this.joinValues(input.forbiddenSubjects)}.

Style:
Premium, realistic, commercial, polished, professional, memorable.
The business name must be integrated cleanly into the brand identity.
    `.trim();
  }

  // MARK: - Request Validation

  private normalizeAndValidateRequest(
    request: CreateBusinessDNARequest
  ): NormalizedCreateBusinessDNARequest {
    if (
      !request ||
      typeof request !== "object"
    ) {
      throw new BusinessDNAServiceError(
        "business-dna/invalid-request",
        "A valid Business DNA creation request is required."
      );
    }

    return {
      businessID:
        this.requireText(
          request.businessID,
          "The business ID is required to create Business DNA."
        ),

      ownerUID:
        this.requireText(
          request.ownerUID,
          "The owner UID is required to create Business DNA."
        ),

      createdByUID:
        this.requireText(
          request.createdByUID,
          "The creator UID is required to create Business DNA."
        ),

      businessName:
        this.requireText(
          request.businessName,
          "The business name is required to create Business DNA."
        ),

      legalBusinessName:
        this.optionalText(
          request.legalBusinessName
        ) ?? "",

      tagline:
        this.optionalText(
          request.tagline
        ) ?? "",

      businessDescription:
        this.optionalText(
          request.businessDescription
        ) ?? "",

      industryKey:
        this.optionalText(
          request.industryKey
        ) ?? "",

      industryTitle:
        this.requireText(
          request.industryTitle,
          "The industry title is required to create Business DNA."
        ),

      industryCategory:
        this.optionalText(
          request.industryCategory
        ) ?? "",

      businessModeKey:
        this.requireText(
          request.businessModeKey,
          "The business mode is required to create Business DNA."
        ),

      brandStyle:
        this.optionalText(
          request.brandStyle
        ) ??
        DEFAULT_BUSINESS_DNA_BRAND_STYLE,

      accentColorName:
        this.optionalText(
          request.accentColorName
        ) ??
        DEFAULT_BUSINESS_DNA_ACCENT_COLOR,

      logoFileName:
        this.optionalText(
          request.logoFileName
        ) ?? "",

      logoPrompt:
        this.optionalText(
          request.logoPrompt
        ) ?? "",

      generatedByAI:
        request.generatedByAI === true,

      languageCode:
        this.optionalText(
          request.languageCode
        ) ??
        this.readBrowserLanguageCode() ??
        DEFAULT_BUSINESS_DNA_LANGUAGE_CODE,

      localeIdentifier:
        this.optionalText(
          request.localeIdentifier
        ) ??
        this.readBrowserLocale() ??
        DEFAULT_BUSINESS_DNA_LOCALE_IDENTIFIER,

      countryCode:
        this.optionalText(
          request.countryCode
        ) ??
        DEFAULT_BUSINESS_DNA_COUNTRY_CODE,

      currencyCode:
        this.optionalText(
          request.currencyCode
        ) ??
        DEFAULT_BUSINESS_DNA_CURRENCY_CODE,

      timeZoneIdentifier:
        this.optionalText(
          request.timeZoneIdentifier
        ) ??
        this.readBrowserTimeZone() ??
        DEFAULT_BUSINESS_DNA_TIME_ZONE,

      measurementSystem:
        this.optionalText(
          request.measurementSystem
        ) ??
        DEFAULT_BUSINESS_DNA_MEASUREMENT_SYSTEM,
    };
  }

  // MARK: - Helpers

  private clean(
    value: unknown
  ): string {
    return typeof value === "string"
      ? value.trim()
      : "";
  }

  private requireText(
    value: unknown,
    message: string
  ): string {
    const normalized =
      this.clean(value);

    if (!normalized) {
      throw new BusinessDNAServiceError(
        "business-dna/missing-required-field",
        message
      );
    }

    return normalized;
  }

  private optionalText(
    value: unknown
  ): string | undefined {
    const normalized =
      this.clean(value);

    return normalized || undefined;
  }

  private slug(
    value: string
  ): string {
    const normalized =
      value
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    return normalized;
  }

  private joinValues(
    values: readonly string[]
  ): string {
    return this.normalizeStringArray(
      values
    ).join(", ");
  }

  private normalizeStringArray(
    values: readonly string[] | undefined
  ): string[] {
    if (!Array.isArray(values)) {
      return [];
    }

    return values
      .map((value) =>
        typeof value === "string"
          ? value.trim()
          : ""
      )
      .filter(
        (value) => value.length > 0
      );
  }

  private mergeStringArrays(
    ...groups: readonly (
      readonly string[]
    )[]
  ): string[] {
    const normalized =
      groups.flatMap((group) =>
        this.normalizeStringArray(group)
      );

    const seen =
      new Set<string>();

    const result: string[] = [];

    for (const value of normalized) {
      const key =
        value.toLowerCase();

      if (!seen.has(key)) {
        seen.add(key);
        result.push(value);
      }
    }

    return result;
  }

  private createStableLocalID(): string {
    if (
      typeof globalThis.crypto !== "undefined" &&
      typeof globalThis.crypto.randomUUID ===
        "function"
    ) {
      return globalThis.crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      (character) => {
        const randomValue =
          Math.floor(Math.random() * 16);

        const value =
          character === "x"
            ? randomValue
            : (randomValue & 0x3) | 0x8;

        return value.toString(16);
      }
    );
  }

  private readBrowserLanguageCode():
    | string
    | null {
    if (
      typeof navigator === "undefined"
    ) {
      return null;
    }

    const language =
      navigator.language?.trim();

    if (!language) {
      return null;
    }

    return language.split("-")[0] || null;
  }

  private readBrowserLocale():
    | string
    | null {
    if (
      typeof navigator === "undefined"
    ) {
      return null;
    }

    const language =
      navigator.language?.trim();

    if (!language) {
      return null;
    }

    return language.replace(
      "-",
      "_"
    );
  }

  private readBrowserTimeZone():
    | string
    | null {
    try {
      return (
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone
          ?.trim() || null
      );
    } catch {
      return null;
    }
  }

  // MARK: - Error Normalization

  private normalizeFirestoreError(
    error: unknown
  ): BusinessDNAServiceError {
    const code =
      this.readErrorCode(error);

    switch (code) {
      case "permission-denied":
      case "firestore/permission-denied":
        return new BusinessDNAServiceError(
          code,
          "Firestore security rules did not allow creation of Business DNA.",
          error
        );

      case "unauthenticated":
      case "firestore/unauthenticated":
        return new BusinessDNAServiceError(
          code,
          "The Business Owner must be authenticated before Business DNA can be created.",
          error
        );

      case "unavailable":
      case "firestore/unavailable":
        return new BusinessDNAServiceError(
          code,
          "Firestore is temporarily unavailable. Check the connection and try again.",
          error
        );

      case "deadline-exceeded":
      case "firestore/deadline-exceeded":
        return new BusinessDNAServiceError(
          code,
          "Firestore took too long to create Business DNA. Try again.",
          error
        );

      case "already-exists":
      case "firestore/already-exists":
        return new BusinessDNAServiceError(
          code,
          "Business DNA already exists for this business.",
          error
        );

      default:
        return new BusinessDNAServiceError(
          code ??
            "business-dna/firestore-write-failed",
          this.readErrorMessage(error) ??
            "Firestore could not create Business DNA.",
          error
        );
    }
  }

  private readErrorCode(
    error: unknown
  ): string | null {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof error.code === "string"
    ) {
      return error.code;
    }

    return null;
  }

  private readErrorMessage(
    error: unknown
  ): string | null {
    if (error instanceof Error) {
      return error.message;
    }

    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return error.message;
    }

    if (
      typeof error === "string" &&
      error.trim()
    ) {
      return error.trim();
    }

    return null;
  }
}

export default BusinessDNAService;