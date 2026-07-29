/**
 * ==============================================================
 * JCS BUSINESS SUITE WEB
 * BusinessRegistrationConstants.ts
 * --------------------------------------------------------------
 * Central configuration for the Business Registration Engine.
 * ==============================================================
 */

export const BusinessRegistrationConstants = {
  ContractVersion: "1.0",

  DefaultLanguageCode: "en",

  DefaultCountryCode: "US",

  DefaultCurrencyCode: "USD",

  DefaultTimezone: "America/New_York",

  DefaultAccentColor: "blue",

  MinimumPasswordLength: 8,

  MinimumBusinessNameLength: 2,

  MinimumOwnerNameLength: 2,

  MaximumBusinessNameLength: 120,

  MaximumOwnerNameLength: 120,

  MaximumPhoneLength: 30,

  MaximumWebsiteLength: 300,

  Progress: {
    Idle: 0,
    Validating: 5,
    CreatingFirebaseAccount: 12,
    CreatingBusiness: 22,
    CreatingBusinessOwner: 30,
    CreatingAppUser: 38,
    CreatingBusinessDNA: 48,
    GeneratingLogo: 58,
    CreatingAppSettings: 68,
    RegisteringPlatformClient: 76,
    AssigningModules: 84,
    BootstrappingWorkspace: 91,
    CompletingInvitation: 96,
    Finalizing: 99,
    Completed: 100,
  },
} as const;

export type BusinessRegistrationContractVersion =
  typeof BusinessRegistrationConstants.ContractVersion;