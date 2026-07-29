/**
 * ==============================================================
 * JCS BUSINESS SUITE WEB
 * BusinessRegistrationRequest.ts
 * --------------------------------------------------------------
 * Official input contract for the Business Registration Engine.
 *
 * This file contains data definitions only.
 * It does not communicate with Firebase, Firestore, React,
 * Next.js, Cloud Functions, or external services.
 * ==============================================================
 */

/**
 * Controls which optional registration operations should run.
 */
export interface BusinessRegistrationOptions {
  /**
   * Generates the initial business logo using AI.
   */
  generateAILogo: boolean;

  /**
   * Builds the initial Business DNA profile.
   */
  createBusinessDNA: boolean;

  /**
   * Creates the default workspace and starter records.
   */
  bootstrapWorkspace: boolean;

  /**
   * Starts the default free trial when applicable.
   */
  startFreeTrial: boolean;

  /**
   * Creates and assigns the business's default modules.
   */
  createDefaultModules: boolean;

  /**
   * Creates the Business Owner AppUser record.
   */
  createOwnerAccount: boolean;

  /**
   * Creates the initial AppSettings record.
   */
  createAppSettings: boolean;

  /**
   * Registers the business in the Platform Executive Center.
   */
  registerPlatformClient: boolean;
}

/**
 * Default behavior for a standard business registration.
 */
export const DefaultBusinessRegistrationOptions: BusinessRegistrationOptions = {
  generateAILogo: true,
  createBusinessDNA: true,
  bootstrapWorkspace: true,
  startFreeTrial: true,
  createDefaultModules: true,
  createOwnerAccount: true,
  createAppSettings: true,
  registerPlatformClient: true,
};

/**
 * Official request accepted by JCSBusinessRegistrationManager.
 */
export interface BusinessRegistrationRequest {
  // ============================================================
  // Contract
  // ============================================================

  /**
   * Version of the registration contract.
   *
   * Current value:
   * "1.0"
   */
  apiVersion: string;

  // ============================================================
  // Business Owner
  // ============================================================

  fullName: string;

  email: string;

  password: string;

  phone: string;

  // ============================================================
  // Business
  // ============================================================

  businessName: string;

  website?: string;

  industry: string;

  businessMode: string;

  // ============================================================
  // Localization
  // ============================================================

  languageCode: string;

  countryCode: string;

  timezone: string;

  currencyCode: string;

  accentColor: string;

  // ============================================================
  // Platform Invitation
  // ============================================================

  invitationCode?: string;

  // ============================================================
  // Registration Behavior
  // ============================================================

  options: BusinessRegistrationOptions;
}