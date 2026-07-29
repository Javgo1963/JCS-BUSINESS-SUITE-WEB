/**
 * ==============================================================
 * JCS BUSINESS SUITE WEB
 * JCSFirebaseBusinessRegistrationExecutor.ts
 * --------------------------------------------------------------
 * Production Registration Executor
 *
 * Coordinates the complete Business Owner registration pipeline.
 *
 * Registration flow:
 *
 * 1. Firebase Authentication
 * 2. Business
 * 3. Business Owner
 * 4. AppSettings
 * 5. PlatformClient
 * 6. BusinessDNA
 *
 * If a Firestore stage fails, the Executor attempts to roll back
 * every successfully created Firestore resource in reverse order.
 * ==============================================================
 */

// MARK: - Registration Services

import AuthenticationService, {
    type BusinessOwnerAuthenticationResult,
} from "../services/AuthenticationService";

import BusinessService, {
    type BusinessCreationResult,
} from "../services/BusinessService";

import BusinessOwnerService, {
    type BusinessOwnerCreationResult,
} from "../services/BusinessOwnerService";

import AppSettingsService, {
    type AppSettingsCreationResult,
} from "../services/AppSettingsService";

import PlatformClientService, {
    type PlatformClientCreationResult,
} from "../services/PlatformClientService";

import BusinessDNAService, {
    type BusinessDNACreationResult,
} from "../services/BusinessDNAService";

// MARK: - Registration Stage

/**
 * Represents the current execution stage of the complete
 * Business Owner registration workflow.
 */
export enum RegistrationExecutionStage {
    idle = "idle",

    authentication = "authentication",
    business = "business",
    businessOwner = "businessOwner",
    appSettings = "appSettings",
    platformClient = "platformClient",
    businessDNA = "businessDNA",

    rollingBack = "rollingBack",
    completed = "completed",
    failed = "failed",
}

// MARK: - Stage Observer

/**
 * Optional callback used by the UI to observe registration
 * progress.
 */
export type RegistrationStageObserver = (
    stage: RegistrationExecutionStage
) => void;

// MARK: - Registration Request

/**
 * Complete input accepted by the registration Executor.
 *
 * Individual services remain responsible for their own
 * specialized validation and default values.
 */
export interface ExecuteBusinessRegistrationRequest {
    // Authentication

    email: string;
    password: string;
    fullName: string;
    username?: string;

    // Owner Contact

    phone?: string;

    // Business

    businessName: string;
    legalBusinessName?: string;

    businessCategory?: string;
    industryTitle?: string;
    industryKey?: string;
    industryCategory?: string;
    businessModeKey?: string;

    businessDescription?: string;
    tagline?: string;

    invitationID?: string;
    platformClientID?: string;

    // Branding

    accentColorName?: string;
    brandStyle?: string;

    logoFileName?: string;
    backgroundFileName?: string;
    logoPrompt?: string;

    useAccentColorForLogo?: boolean;
    generatedByAI?: boolean;

    // Business Contact

    businessPhone?: string;
    businessEmail?: string;
    supportEmail?: string;

    website?: string;
    taxID?: string;

    // Address

    addressLine1?: string;
    addressLine2?: string;

    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;

    // Localization

    languageCode?: string;
    localeIdentifier?: string;

    countryCode?: string;
    currencyCode?: string;

    timeZoneIdentifier?: string;
    measurementSystem?: string;

    // AppSettings

    taxPercent?: number;

    // Subscription

    planName?: string;
    monthlyPrice?: number;
    trialLengthDays?: number;

    billingProvider?:
        | "Manual"
        | "Apple"
        | "Stripe"
        | "None";

    // Plan Limits

    employeeLimit?: number;
    customerLimit?: number;
    productLimit?: number;
    storageLimitGB?: number;

    // Platform Features

    canCreateInvitations?: boolean;
    canUseAutomaticLogo?: boolean;

    enabledModules?: Iterable<string>;
    disabledModules?: Iterable<string>;

    businessInviteCode?: string;

    // Owner Invitation

    ownerInvitationCode?: string;
    ownerInvitationLink?: string;
    ownerInvitationSentAt?: Date;

    // Internal Platform Administration

    accountManagerName?: string;
    internalTags?: string;
    riskLevel?: string;
    notes?: string;

    createdByPlatformUID?: string;
    updatedByPlatformUID?: string;
}

// MARK: - Registration Result

/**
 * Complete result returned after all six stages finish
 * successfully.
 */
export interface ExecuteBusinessRegistrationResult {
    authentication:
        BusinessOwnerAuthenticationResult;

    business:
        BusinessCreationResult;

    businessOwner:
        BusinessOwnerCreationResult;

    appSettings:
        AppSettingsCreationResult;

    platformClient:
        PlatformClientCreationResult;

    businessDNA:
        BusinessDNACreationResult;

    firebaseUID: string;
    ownerUID: string;
    businessID: string;

    completedAt: string;
}

// MARK: - Execution Context

/**
 * Stores successfully created resources while registration is
 * running.
 *
 * The rollback engine uses this context to determine which
 * resources must be removed.
 */
interface RegistrationExecutionContext {
    authentication:
        BusinessOwnerAuthenticationResult | null;

    business:
        BusinessCreationResult | null;

    businessOwner:
        BusinessOwnerCreationResult | null;

    appSettings:
        AppSettingsCreationResult | null;

    platformClient:
        PlatformClientCreationResult | null;

    businessDNA:
        BusinessDNACreationResult | null;
}

/**
 * Creates a clean registration context.
 */
function createEmptyRegistrationContext():
    RegistrationExecutionContext {
    return {
        authentication: null,
        business: null,
        businessOwner: null,
        appSettings: null,
        platformClient: null,
        businessDNA: null,
    };
}

// MARK: - Executor Error

/**
 * Stable error exposed by the complete registration Executor.
 */
export class BusinessRegistrationExecutionError extends Error {
    readonly code: string;

    readonly failedStage:
        RegistrationExecutionStage;

    readonly originalError?: unknown;

    readonly rollbackAttempted: boolean;

    constructor(options: {
        code: string;
        message: string;

        failedStage:
            RegistrationExecutionStage;

        originalError?: unknown;
        rollbackAttempted?: boolean;
    }) {
        super(options.message);

        this.name =
            "BusinessRegistrationExecutionError";

        this.code =
            options.code;

        this.failedStage =
            options.failedStage;

        this.originalError =
            options.originalError;

        this.rollbackAttempted =
            options.rollbackAttempted === true;

        Object.setPrototypeOf(
            this,
            BusinessRegistrationExecutionError.prototype
        );
    }
}

// MARK: - Executor Dependencies

export interface JCSFirebaseBusinessRegistrationExecutorOptions {
    authenticationService:
        AuthenticationService;

    businessService:
        BusinessService;

    businessOwnerService:
        BusinessOwnerService;

    appSettingsService:
        AppSettingsService;

    platformClientService:
        PlatformClientService;

    businessDNAService:
        BusinessDNAService;

    /**
     * Optional observer used by the UI to display progress.
     */
    onStageChange?:
        RegistrationStageObserver;
}

// MARK: - Executor

export default class
JCSFirebaseBusinessRegistrationExecutor {
    // MARK: Services

    private readonly authenticationService:
        AuthenticationService;

    private readonly businessService:
        BusinessService;

    private readonly businessOwnerService:
        BusinessOwnerService;

    private readonly appSettingsService:
        AppSettingsService;

    private readonly platformClientService:
        PlatformClientService;

    private readonly businessDNAService:
        BusinessDNAService;

    // MARK: Observer

    private readonly onStageChange?:
        RegistrationStageObserver;

    // MARK: Runtime State

    private context:
        RegistrationExecutionContext =
        createEmptyRegistrationContext();

    private currentStage:
        RegistrationExecutionStage =
        RegistrationExecutionStage.idle;

    /**
     * Prevents two registration processes from using the same
     * Executor instance simultaneously.
     */
    private isExecuting = false;

    // MARK: Constructor

    constructor(
        options:
            JCSFirebaseBusinessRegistrationExecutorOptions
    ) {
        if (
            !options ||
            typeof options !== "object"
        ) {
            throw new BusinessRegistrationExecutionError({
                code:
                    "registration/invalid-options",

                message:
                    "The registration Executor requires valid service dependencies.",

                failedStage:
                    RegistrationExecutionStage.idle,
            });
        }

        this.authenticationService =
            this.requireDependency(
                options.authenticationService,
                "AuthenticationService"
            );

        this.businessService =
            this.requireDependency(
                options.businessService,
                "BusinessService"
            );

        this.businessOwnerService =
            this.requireDependency(
                options.businessOwnerService,
                "BusinessOwnerService"
            );

        this.appSettingsService =
            this.requireDependency(
                options.appSettingsService,
                "AppSettingsService"
            );

        this.platformClientService =
            this.requireDependency(
                options.platformClientService,
                "PlatformClientService"
            );

        this.businessDNAService =
            this.requireDependency(
                options.businessDNAService,
                "BusinessDNAService"
            );

        this.onStageChange =
            options.onStageChange;
    }

    // MARK: Public State

    /**
     * Returns the current registration stage.
     */
    get stage():
        RegistrationExecutionStage {
        return this.currentStage;
    }

    /**
     * Indicates whether registration is currently running.
     */
    get registrationIsExecuting():
        boolean {
        return this.isExecuting;
    }

    /**
     * Returns true only after every registration stage has
     * completed successfully.
     */
    get registrationCompleted():
        boolean {
        return (
            this.currentStage ===
            RegistrationExecutionStage.completed
        );
    }

    /**
     * Executes the complete Business Owner registration workflow.
     */
    async executeRegistration(
        request:
            ExecuteBusinessRegistrationRequest
    ): Promise<ExecuteBusinessRegistrationResult> {
        if (this.isExecuting) {
            throw new BusinessRegistrationExecutionError({
                code:
                    "registration/already-executing",

                message:
                    "A business registration is already running through this Executor.",

                failedStage:
                    this.currentStage,
            });
        }

        this.validateExecutionRequest(
            request
        );

        this.resetContext();

        let failedStage:
            RegistrationExecutionStage =
            RegistrationExecutionStage.idle;

        try {
            // ==================================================
            // 1. FIREBASE AUTHENTICATION
            // ==================================================

            this.updateStage(
                RegistrationExecutionStage.authentication
            );

            const authentication =
                await this.authenticationService
                    .createBusinessOwnerAccount({
                        email:
                            request.email
                                .trim()
                                .toLowerCase(),

                        password:
                            request.password,

                        fullName:
                            request.fullName.trim(),
                    });

            this.context.authentication =
                authentication;

            const firebaseUID =
                authentication.firebaseUID;

            /**
             * During initial registration, ownerUID and
             * firebaseUID intentionally share the same identity.
             */
            const ownerUID =
                authentication.firebaseUID;

            // ==================================================
            // 2. OPERATIONAL BUSINESS
            // ==================================================

            this.updateStage(
                RegistrationExecutionStage.business
            );

            const business =
                await this.businessService
                    .createBusiness({
                        businessName:
                            request.businessName.trim(),

                        firebaseUID,
                        ownerUID,

                        businessCategory:
                            request.businessCategory,

                        invitationID:
                            request.invitationID,

                        platformClientID:
                            request.platformClientID,
                    });

            this.context.business =
                business;

            const businessID =
                business.businessID;

            // ==================================================
            // 3. BUSINESS OWNER APPUSER
            // ==================================================

            this.updateStage(
                RegistrationExecutionStage.businessOwner
            );

            const businessOwner =
                await this.businessOwnerService
                    .createBusinessOwner({
                        firebaseUID,
                        ownerUID,
                        businessID,

                        businessName:
                            business.businessName,

                        fullName:
                            authentication.fullName,

                        email:
                            authentication.email,

                        username:
                            request.username,

                        phone:
                            request.phone,

                        addressLine1:
                            request.addressLine1,

                        addressLine2:
                            request.addressLine2,

                        role:
                            "admin",

                        /**
                         * A normal Business Owner must never
                         * become PlatformAdmin automatically.
                         */
                        isPlatformAdministrator:
                            false,
                    });

            this.context.businessOwner =
                businessOwner;
                            // ==================================================
            // 4. APP SETTINGS
            // ==================================================

            this.updateStage(
                RegistrationExecutionStage.appSettings
            );

            const appSettings =
                await this.appSettingsService
                    .createAppSettings({
                        businessID,
                        ownerUID,

                        createdByUID:
                            firebaseUID,

                        companyName:
                            business.businessName,

                        addressLine1:
                            request.addressLine1,

                        addressLine2:
                            request.addressLine2,

                        phone:
                            request.businessPhone ??
                            request.phone,

                        email:
                            request.businessEmail ??
                            authentication.email,

                        languageCode:
                            request.languageCode,

                        taxPercent:
                            request.taxPercent,

                        logoFileName:
                            request.logoFileName,

                        backgroundFileName:
                            request.backgroundFileName,

                        accentColorName:
                            request.accentColorName,

                        useAccentColorForLogo:
                            request.useAccentColorForLogo,
                    });

            this.context.appSettings =
                appSettings;

            // ==================================================
            // 5. PLATFORM CLIENT
            // ==================================================

            this.updateStage(
                RegistrationExecutionStage.platformClient
            );

            const platformClient =
                await this.platformClientService
                    .createPlatformClient({
                        // Identity

                        businessID,
                        ownerUID,

                        ownerFirebaseUID:
                            firebaseUID,

                        // Business

                        businessName:
                            business.businessName,

                        industry:
                            request.industryTitle,

                        businessCategory:
                            request.businessCategory,

                        businessModeRawValue:
                            request.businessModeKey,

                        localeIdentifier:
                            request.localeIdentifier,

                        timeZoneIdentifier:
                            request.timeZoneIdentifier,

                        // Owner

                        ownerFullName:
                            authentication.fullName,

                        ownerEmail:
                            authentication.email,

                        ownerPhone:
                            request.phone,

                        // Invitation

                        ownerInvitationCode:
                            request.ownerInvitationCode,

                        ownerInvitationLink:
                            request.ownerInvitationLink,

                        ownerInvitationSentAt:
                            request.ownerInvitationSentAt,

                        // Business Contact

                        businessPhone:
                            request.businessPhone ??
                            request.phone,

                        businessEmail:
                            request.businessEmail ??
                            authentication.email,

                        supportEmail:
                            request.supportEmail,

                        website:
                            request.website,

                        taxID:
                            request.taxID,

                        // Address

                        addressLine1:
                            request.addressLine1,

                        addressLine2:
                            request.addressLine2,

                        city:
                            request.city,

                        state:
                            request.state,

                        zipCode:
                            request.zipCode,

                        country:
                            request.country,

                        // Subscription

                        planName:
                            request.planName,

                        monthlyPrice:
                            request.monthlyPrice,

                        trialLengthDays:
                            request.trialLengthDays,

                        billingProvider:
                            request.billingProvider,

                        // Limits

                        employeeLimit:
                            request.employeeLimit,

                        customerLimit:
                            request.customerLimit,

                        productLimit:
                            request.productLimit,

                        storageLimitGB:
                            request.storageLimitGB,

                        // Features

                        canCreateInvitations:
                            request.canCreateInvitations,

                        canUseAutomaticLogo:
                            request.canUseAutomaticLogo,

                        enabledModules:
                            request.enabledModules,

                        disabledModules:
                            request.disabledModules,

                        businessInviteCode:
                            request.businessInviteCode,

                        // Platform Administration

                        accountManagerName:
                            request.accountManagerName,

                        internalTags:
                            request.internalTags,

                        riskLevel:
                            request.riskLevel,

                        notes:
                            request.notes,

                        /**
                         * Self-registration does not imply that a
                         * PlatformAdmin created the business.
                         */
                        createdByPlatformUID:
                            request.createdByPlatformUID,

                        updatedByPlatformUID:
                            request.updatedByPlatformUID ??
                            request.createdByPlatformUID,
                    });

            this.context.platformClient =
                platformClient;

            // ==================================================
            // 6. BUSINESS DNA
            // ==================================================

            this.updateStage(
                RegistrationExecutionStage.businessDNA
            );

            const resolvedIndustryTitle =
                request.industryTitle?.trim() ||
                request.businessCategory?.trim() ||
                "General Business";

            const resolvedIndustryCategory =
                request.industryCategory?.trim() ||
                request.businessCategory?.trim() ||
                resolvedIndustryTitle;

            const resolvedBusinessModeKey =
                request.businessModeKey?.trim() ||
                resolvedIndustryCategory;

            const businessDNA =
                await this.businessDNAService
                    .createBusinessDNA({
                        // Identity

                        businessID,
                        ownerUID,

                        createdByUID:
                            firebaseUID,

                        // Business

                        businessName:
                            business.businessName,

                        legalBusinessName:
                            request.legalBusinessName,

                        tagline:
                            request.tagline,

                        businessDescription:
                            request.businessDescription,

                        // Industry

                        industryKey:
                            request.industryKey,

                        industryTitle:
                            resolvedIndustryTitle,

                        industryCategory:
                            resolvedIndustryCategory,

                        businessModeKey:
                            resolvedBusinessModeKey,

                        // Branding

                        brandStyle:
                            request.brandStyle,

                        accentColorName:
                            appSettings.accentColorName,

                        logoFileName:
                            request.logoFileName,

                        logoPrompt:
                            request.logoPrompt,

                        generatedByAI:
                            request.generatedByAI,

                        // Localization

                        languageCode:
                            appSettings.languageCode,

                        localeIdentifier:
                            request.localeIdentifier,

                        countryCode:
                            request.countryCode,

                        currencyCode:
                            request.currencyCode,

                        timeZoneIdentifier:
                            request.timeZoneIdentifier,

                        measurementSystem:
                            request.measurementSystem,
                    });

            this.context.businessDNA =
                businessDNA;

            // ==================================================
            // REGISTRATION COMPLETED
            // ==================================================

            this.updateStage(
                RegistrationExecutionStage.completed
            );

            return {
                authentication,
                business,
                businessOwner,
                appSettings,
                platformClient,
                businessDNA,

                firebaseUID,
                ownerUID,
                businessID,

                completedAt:
                    new Date().toISOString(),
            };
        } catch (error: unknown) {
            /**
             * Save the actual failed stage before rollback changes
             * the current stage to `rollingBack`.
             */
            failedStage =
                this.currentStage;

            /**
             * Roll back every Firestore resource that was created
             * successfully before the failure.
             *
             * Authentication is not deleted here because deleting
             * Firebase Authentication accounts securely normally
             * requires Firebase Admin SDK on a trusted backend.
             */
            await this.rollbackRegistration();

            this.updateStage(
                RegistrationExecutionStage.failed
            );

            throw this.normalizeExecutionError(
                error,
                failedStage,
                true
            );
        }
    }

    // MARK: - Rollback

    /**
     * Reverses every successfully completed Firestore operation.
     *
     * Rollback order:
     *
     * 1. Business DNA
     * 2. PlatformClient
     * 3. AppSettings
     * 4. Business Owner AppUser
     * 5. Business
     *
     * Authentication is handled separately because deleting an
     * arbitrary Firebase Authentication account normally requires
     * a secure backend using Firebase Admin SDK.
     */
    private async rollbackRegistration():
        Promise<void> {
        this.updateStage(
            RegistrationExecutionStage.rollingBack
        );

        const businessID =
            this.context.business?.businessID ??
            this.context.businessOwner?.businessID ??
            this.context.appSettings?.businessID ??
            this.context.platformClient?.businessID ??
            this.context.businessDNA?.businessID;

        const rollbackOperations:
            Array<{
                name: string;
                execute: () => Promise<void>;
            }> = [];

        if (
            businessID &&
            this.context.businessDNA
        ) {
            rollbackOperations.push({
                name:
                    "Business DNA",

                execute: () =>
                    this.businessDNAService
                        .rollbackBusinessDNA(
                            businessID
                        ),
            });
        }

        if (
            businessID &&
            this.context.platformClient
        ) {
            rollbackOperations.push({
                name:
                    "PlatformClient",

                execute: () =>
                    this.platformClientService
                        .rollbackPlatformClient(
                            businessID
                        ),
            });
        }

        if (
            businessID &&
            this.context.appSettings
        ) {
            rollbackOperations.push({
                name:
                    "AppSettings",

                execute: () =>
                    this.appSettingsService
                        .rollbackAppSettings(
                            businessID
                        ),
            });
        }

        if (
            this.context.businessOwner?.appUserID
        ) {
            const appUserID =
                this.context.businessOwner.appUserID;

            rollbackOperations.push({
                name:
                    "Business Owner AppUser",

                execute: () =>
                    this.businessOwnerService
                        .rollbackBusinessOwner(
                            appUserID
                        ),
            });
        }

        if (
            businessID &&
            this.context.business
        ) {
            rollbackOperations.push({
                name:
                    "Business",

                execute: () =>
                    this.businessService
                        .rollbackBusiness(
                            businessID
                        ),
            });
        }

        for (
            const operation
            of rollbackOperations
        ) {
            try {
                await operation.execute();
            } catch (rollbackError: unknown) {
                /**
                 * One failed rollback must not prevent the
                 * remaining resources from being removed.
                 */
                console.error(
                    `[JCSFirebaseBusinessRegistrationExecutor] ${operation.name} rollback failed:`,
                    rollbackError
                );
            }
        }
    }
        // MARK: - Context

    private resetContext(): void {
        this.context =
            createEmptyRegistrationContext();

        this.currentStage =
            RegistrationExecutionStage.idle;

        this.isExecuting =
            true;

        this.notifyStageChange();
    }

    private updateStage(
        stage: RegistrationExecutionStage
    ): void {
        this.currentStage =
            stage;

        if (
            stage ===
                RegistrationExecutionStage.completed ||
            stage ===
                RegistrationExecutionStage.failed
        ) {
            this.isExecuting =
                false;
        }

        this.notifyStageChange();
    }

    private notifyStageChange(): void {
        try {
            this.onStageChange?.(
                this.currentStage
            );
        } catch (error: unknown) {
            /**
             * A UI observer must never interrupt registration.
             */
            console.error(
                "[JCSFirebaseBusinessRegistrationExecutor] Stage observer failed:",
                error
            );
        }
    }

    // MARK: - Dependency Validation

    private requireDependency<T>(
        dependency: T,
        dependencyName: string
    ): T {
        if (!dependency) {
            throw new BusinessRegistrationExecutionError({
                code:
                    "registration/missing-dependency",

                message:
                    `${dependencyName} is required by the registration Executor.`,

                failedStage:
                    RegistrationExecutionStage.idle,
            });
        }

        return dependency;
    }

    // MARK: - Request Validation

    private validateExecutionRequest(
        request:
            ExecuteBusinessRegistrationRequest
    ): void {
        if (
            !request ||
            typeof request !== "object"
        ) {
            throw new BusinessRegistrationExecutionError({
                code:
                    "registration/invalid-request",

                message:
                    "A valid business registration request is required.",

                failedStage:
                    RegistrationExecutionStage.idle,
            });
        }

        this.requireText(
            request.email,
            "The Business Owner email address is required."
        );

        this.requireText(
            request.password,
            "The Business Owner password is required."
        );

        this.requireText(
            request.fullName,
            "The Business Owner full name is required."
        );

        this.requireText(
            request.businessName,
            "The business name is required."
        );

        if (
            request.email &&
            !this.isValidEmail(
                request.email
                    .trim()
                    .toLowerCase()
            )
        ) {
            throw new BusinessRegistrationExecutionError({
                code:
                    "registration/invalid-email",

                message:
                    "Enter a valid Business Owner email address.",

                failedStage:
                    RegistrationExecutionStage.idle,
            });
        }
    }

    private requireText(
        value: unknown,
        message: string
    ): string {
        if (
            typeof value !== "string" ||
            !value.trim()
        ) {
            throw new BusinessRegistrationExecutionError({
                code:
                    "registration/missing-required-field",

                message,

                failedStage:
                    this.currentStage,
            });
        }

        return value.trim();
    }

    private isValidEmail(
        email: string
    ): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
        );
    }

    // MARK: - Error Normalization

    private normalizeExecutionError(
        error: unknown,
        failedStage: RegistrationExecutionStage,
        rollbackAttempted: boolean
    ): BusinessRegistrationExecutionError {

        if (
            error instanceof
            BusinessRegistrationExecutionError
        ) {
            return error;
        }

        return new BusinessRegistrationExecutionError({
            code:
                this.readErrorCode(error) ??
                "registration/execution-failed",

            message:
                this.readErrorMessage(error) ??
                "JCS Business Suite could not complete the business registration.",

            failedStage,

            originalError:
                error,

            rollbackAttempted,
        });
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

    /**
     * Determines the last successfully completed stage.
     */
    private resolveLastCompletedStage():
        RegistrationExecutionStage {

        if (this.context.businessDNA) {
            return RegistrationExecutionStage.businessDNA;
        }

        if (this.context.platformClient) {
            return RegistrationExecutionStage.platformClient;
        }

        if (this.context.appSettings) {
            return RegistrationExecutionStage.appSettings;
        }

        if (this.context.businessOwner) {
            return RegistrationExecutionStage.businessOwner;
        }

        if (this.context.business) {
            return RegistrationExecutionStage.business;
        }

        if (this.context.authentication) {
            return RegistrationExecutionStage.authentication;
        }

        return RegistrationExecutionStage.idle;
    }
}
