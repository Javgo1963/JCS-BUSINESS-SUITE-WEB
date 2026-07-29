/**
 * ==============================================================
 * JCS BUSINESS SUITE WEB
 * BusinessRegistrationStage.ts
 * --------------------------------------------------------------
 * Represents the major stages of the business registration flow.
 *
 * A stage is broader than a state.
 *
 * Example:
 * Stage: ConfiguringWorkspace
 * State: CreatingAppSettings
 * ==============================================================
 */

export enum BusinessRegistrationStage {
  Idle = "idle",

  CollectingInformation = "collectingInformation",

  ValidatingInformation = "validatingInformation",

  CreatingIdentity = "creatingIdentity",

  CreatingBusiness = "creatingBusiness",

  ConfiguringWorkspace = "configuringWorkspace",

  CreatingBranding = "creatingBranding",

  CompletingInvitation = "completingInvitation",

  Finalizing = "finalizing",

  Completed = "completed",

  Failed = "failed",

  Cancelled = "cancelled",
}