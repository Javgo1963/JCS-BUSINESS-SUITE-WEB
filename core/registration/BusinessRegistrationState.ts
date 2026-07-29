/**
 * ==============================================================
 * JCS BUSINESS SUITE
 * --------------------------------------------------------------
 * BusinessRegistrationState.ts
 * --------------------------------------------------------------
 * Represents the current execution state of the Business
 * Registration Engine.
 *
 * Every registration process transitions through these states.
 *
 * This enum is platform independent.
 *
 * ==============================================================
 */

export enum BusinessRegistrationState {

    /**
     * Waiting to start.
     */
    Idle = "idle",

    /**
     * Validating user input.
     */
    Validating = "validating",

    /**
     * Creating Firebase Authentication account.
     */
    CreatingFirebaseAccount = "creatingFirebaseAccount",

    /**
     * Creating Business record.
     */
    CreatingBusiness = "creatingBusiness",

    /**
     * Creating Business Owner.
     */
    CreatingBusinessOwner = "creatingBusinessOwner",

    /**
     * Creating AppUser.
     */
    CreatingAppUser = "creatingAppUser",

    /**
     * Creating App Settings.
     */
    CreatingAppSettings = "creatingAppSettings",

    /**
     * Registering Platform Client.
     */
    RegisteringPlatformClient = "registeringPlatformClient",

    /**
     * Creating Business DNA.
     */
    CreatingBusinessDNA = "creatingBusinessDNA",

    /**
     * Generating AI Logo.
     */
    GeneratingLogo = "generatingLogo",

    /**
     * Assigning default modules.
     */
    AssigningModules = "assigningModules",

    /**
     * Bootstrapping workspace.
     */
    BootstrappingWorkspace = "bootstrappingWorkspace",

    /**
     * Completing invitation workflow.
     */
    CompletingInvitation = "completingInvitation",

    /**
     * Final validation.
     */
    Finalizing = "finalizing",

    /**
     * Registration completed.
     */
    Completed = "completed",

    /**
     * Registration failed.
     */
    Failed = "failed",

    /**
     * Registration cancelled.
     */
    Cancelled = "cancelled"
}