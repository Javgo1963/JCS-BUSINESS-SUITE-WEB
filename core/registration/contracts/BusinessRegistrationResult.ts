/**
 * ==============================================================
 * JCS BUSINESS SUITE WEB
 * BusinessRegistrationResult.ts
 * --------------------------------------------------------------
 * Official result returned by the Business Registration Engine.
 * ==============================================================
 */

/**
 * Successful or failed result returned after attempting to
 * register a business.
 */
export interface BusinessRegistrationResult {
  success: boolean;

  firebaseUID: string;
  businessID: string;
  ownerUID: string;

  businessName: string;
  ownerFullName: string;

  platformClientID?: string;
  appSettingsID?: string;
  businessDNAID?: string;
  logoURL?: string;

  invitationCompleted: boolean;
  workspaceBootstrapped: boolean;

  message: string;

  warnings: string[];

  completedAt: string;
}

/**
 * Creates a safe failed registration result.
 */
export function makeFailedBusinessRegistrationResult(
  message: string,
  warnings: string[] = []
): BusinessRegistrationResult {
  return {
    success: false,

    firebaseUID: "",
    businessID: "",
    ownerUID: "",

    businessName: "",
    ownerFullName: "",

    platformClientID: undefined,
    appSettingsID: undefined,
    businessDNAID: undefined,
    logoURL: undefined,

    invitationCompleted: false,
    workspaceBootstrapped: false,

    message,
    warnings,

    completedAt: new Date().toISOString(),
  };
}