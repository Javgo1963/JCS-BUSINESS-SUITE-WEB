import {
    AppSettingsFactory,
    type JCSAppSettingsDocument,
} from "@/core/business-core/creation/factories/AppSettingsFactory";

import {
    PlatformClientFactory,
    type JCSPlatformClientDocument,
} from "@/core/business-core/creation/factories/PlatformClientFactory";

import {
    BusinessDNAFactory,
    type JCSBusinessDNADocument,
} from "@/core/business-core/creation/factories/BusinessDNAFactory";

import type {
    BusinessCreationFactoryContext,
    BusinessCreationIdentity,
} from "@/core/business-core/creation/factories/BusinessCreationFactoryContext";

import {
    doc,
    serverTimestamp,
    writeBatch,
    type DocumentReference,
    type FieldValue,
    type Firestore,
} from "firebase/firestore";

import {
    updateProfile,
    type User,
} from "firebase/auth";

import {
    firestoreDatabase,
} from "@/core/firebase/firebase";

import {
    DEFAULT_OFFICIAL_JCS_LOGO_ID,
    officialJCSLogoForID,
} from "@/features/official-jcs-branding/OfficialJCSLogoRegistry";

import {
    resolveOfficialJCSLogo,
} from "@/features/official-jcs-branding/OfficialJCSLogoStorageService";

import {
    JCSBusinessRegistrationManager,
    JCSBusinessRegistrationError,
    type BusinessRegistrationProgressCallback,
    type JCSBusinessProvisioningEngine,
    type JCSBusinessProvisioningInput,
    type JCSBusinessRegistrationResult,
} from "@/core/business-core/registration/JCSBusinessRegistrationManager";

// MARK: - Firestore Collection Names

/**
 * Centralized Firestore collection names used during
 * initial business provisioning.
 *
 * These names can later be moved into:
 *
 * src/core/business-core/repositories/
 * FirestoreCollectionNames.ts
 */
export const JCS_FIRESTORE_COLLECTIONS = {
    businesses: "businesses",
    users: "users",
    appSettings: "businessSettings",
    platformClients: "platformClients",
    businessDNA: "businessDNA",
    businessWorkspaces: "businessWorkspaces",
    businessMemberships: "businessMemberships",
} as const;

// MARK: - Business Creation Engine Options

/**
 * Configuration accepted by BusinessCreationEngine.
 *
 * All properties are optional because the engine supplies
 * safe production defaults.
 */
export interface BusinessCreationEngineOptions {
    firestore?: Firestore;

    defaultPlanName?: string;
    defaultTrialLengthDays?: number;

    dashboardRoute?: string;
    platformUID?: string;

    defaultCurrencyCode?: string;
    defaultAccentColorName?: string;
}

// MARK: - Resolved Engine Options

/**
 * Internal configuration passed to the document preparation layer.
 *
 * At this point every property has already been normalized and
 * contains a usable value.
 */
interface ResolvedBusinessCreationOptions {
    defaultPlanName: string;
    defaultTrialLengthDays: number;

    dashboardRoute: string;
    platformUID: string;

    defaultCurrencyCode: string;
    defaultAccentColorName: string;
}

// MARK: - Business Document

/**
 * Principal tenant document.
 *
 * Firestore path:
 *
 * businesses/{businessID}
 */
export interface JCSBusinessDocument {
    id: string;
    businessID: string;

    businessName: string;
    normalizedBusinessName: string;

    businessPhone: string;
    website: string;

    ownerUID: string;
    ownerFirebaseUID: string;

    industryCategoryKey: string;
    industryCategoryTitle: string;

    businessModeKey: string;
    businessModeName: string;

    businessInviteCode: string;

    recommendedModules: string[];
    enabledModules: string[];
    disabledModules: string[];

    localeIdentifier: string;
    timeZoneIdentifier: string;

    status: "active";
    onboardingStatus: "ready";

    planName: string;
    trialLengthDays: number;

    createdByUID: string;
    updatedByUID: string;

    createdAtISO: string;
    updatedAtISO: string;

    identityVersion: number;

    createdAt: FieldValue;
    updatedAt: FieldValue;
}

// MARK: - Business Owner Document

/**
 * Principal application-user document for the Business Owner.
 *
 * Firestore path:
 *
 * users/{firebaseUID}
 */
export interface JCSBusinessOwnerDocument {
    id: string;

    userID: string;
    ownerUID: string;
    firebaseUID: string;
    businessID: string;

    fullName: string;
    normalizedFullName: string;

    email: string;
    normalizedEmail: string;
    phone: string;

    role: "businessOwner";
    roleRawValue: "businessOwner";

    isBusinessOwner: true;
    isPlatformAdministrator: false;

    isActive: true;
    accountStatus: "active";

    enabledModules: string[];
    disabledModules: string[];

    permissions: string[];

    localeIdentifier: string;
    timeZoneIdentifier: string;

    createdByUID: string;
    updatedByUID: string;

    createdAtISO: string;
    updatedAtISO: string;

    createdAt: FieldValue;
    updatedAt: FieldValue;
}

// MARK: - Workspace Document

/**
 * Describes the initial workspace assigned to the new tenant.
 *
 * Firestore path:
 *
 * businessWorkspaces/{businessID}
 */
export interface JCSBusinessWorkspaceDocument {
    id: string;
    workspaceID: string;

    businessID: string;
    ownerUID: string;
    firebaseUID: string;

    businessModeKey: string;

    enabledModules: string[];
    disabledModules: string[];

    onboardingCompleted: boolean;
    workspaceReady: boolean;

    workspaceVersion: number;

    createdByUID: string;
    updatedByUID: string;

    createdAtISO: string;
    updatedAtISO: string;

    createdAt: FieldValue;
    updatedAt: FieldValue;
}

// MARK: - Membership Document

/**
 * Connects the authenticated owner to the newly created business.
 *
 * Firestore path:
 *
 * businessMemberships/{membershipID}
 */
export interface JCSBusinessMembershipDocument {
    id: string;
    membershipID: string;

    businessID: string;

    userUID: string;
    firebaseUID: string;

    role: "businessOwner";

    permissions: string[];
    enabledModules: string[];

    isActive: true;
    status: "active";

    joinedAtISO: string;

    createdByUID: string;
    updatedByUID: string;

    createdAtISO: string;
    updatedAtISO: string;

    createdAt: FieldValue;
    updatedAt: FieldValue;
}

// MARK: - Prepared Firestore Documents

/**
 * Complete set of references and documents that will be written
 * atomically using a single Firestore WriteBatch.
 */
interface PreparedBusinessDocuments {
    businessReference: DocumentReference;
    businessDocument: JCSBusinessDocument;

    ownerReference: DocumentReference;
    ownerDocument: JCSBusinessOwnerDocument;

    appSettingsReference: DocumentReference;
    appSettingsDocument: JCSAppSettingsDocument;

    platformClientReference: DocumentReference;
    platformClientDocument: JCSPlatformClientDocument;

    businessDNAReference: DocumentReference;
    businessDNADocument: JCSBusinessDNADocument;

    workspaceReference: DocumentReference;
    workspaceDocument: JCSBusinessWorkspaceDocument;

    membershipReference: DocumentReference;
    membershipDocument: JCSBusinessMembershipDocument;
}

// MARK: - Default Modules

const UNIVERSAL_BUSINESS_MODULES = [
    "dashboard",
    "customers",
    "account",
    "app-settings",
    "notifications",
] as const;

// MARK: - Owner Permissions

const BUSINESS_OWNER_PERMISSIONS = [
    "business.read",
    "business.update",

    "settings.read",
    "settings.update",

    "users.read",
    "users.create",
    "users.update",
    "users.delete",

    "roles.read",
    "roles.create",
    "roles.update",
    "roles.assign",

    "permissions.read",
    "permissions.assign",

    "modules.read",
    "modules.enable",
    "modules.disable",

    "customers.read",
    "customers.create",
    "customers.update",
    "customers.delete",

    "employees.read",
    "employees.create",
    "employees.update",
    "employees.delete",

    "products.read",
    "products.create",
    "products.update",
    "products.delete",

    "services.read",
    "services.create",
    "services.update",
    "services.delete",

    "orders.read",
    "orders.create",
    "orders.update",
    "orders.cancel",

    "inventory.read",
    "inventory.create",
    "inventory.update",

    "reports.read",

    "invitations.read",
    "invitations.create",
    "invitations.update",
    "invitations.cancel",
] as const;

// MARK: - Text Helpers

function cleanText(
    value: string | null | undefined
): string {
    return value?.trim() ?? "";
}

function normalizedSearchText(
    value: string
): string {
    return cleanText(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function normalizeCodePart(
    value: string
): string {
    return cleanText(value)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
}

function uniqueStrings(
    values: readonly string[]
): string[] {
    return Array.from(
        new Set(
            values
                .map((value) => cleanText(value))
                .filter(Boolean)
        )
    );
}

// MARK: - Random Identity Helpers

function randomUUID(): string {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return [
        Date.now().toString(36),
        Math.random().toString(36).slice(2),
        Math.random().toString(36).slice(2),
    ].join("-");
}

function compactID(
    prefix: string
): string {
    const compactUUID = randomUUID()
        .replace(/-/g, "")
        .toLowerCase();

    return `${prefix}_${compactUUID}`;
}

function randomAlphaNumeric(
    length: number
): string {
    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let result = "";

    for (
        let index = 0;
        index < length;
        index += 1
    ) {
        const randomIndex = Math.floor(
            Math.random() * characters.length
        );

        result += characters[randomIndex];
    }

    return result;
}

function createBusinessInviteCode(
    businessName: string
): string {
    const businessPrefix = normalizeCodePart(
        businessName
    )
        .slice(0, 3)
        .padEnd(3, "X");

    return `JCS-${businessPrefix}-${randomAlphaNumeric(
        6
    )}`;
}

// MARK: - Date Helpers

function addDays(
    date: Date,
    numberOfDays: number
): Date {
    const result = new Date(date);

    result.setUTCDate(
        result.getUTCDate() + numberOfDays
    );

    return result;
}

// MARK: - Cancellation

function throwIfAborted(
    signal?: AbortSignal
): void {
    if (!signal?.aborted) {
        return;
    }

    throw new JCSBusinessRegistrationError(
        "cancelled",
        "Business registration was cancelled."
    );
}

// MARK: - Progress

function emitProgress(
    callback:
        | BusinessRegistrationProgressCallback
        | undefined,
    stage:
        | "creatingBusiness"
        | "creatingBusinessOwner"
        | "creatingAppSettings"
        | "creatingPlatformClient"
        | "creatingBusinessDNA"
        | "provisioningWorkspace"
        | "completingInvitation",
    percentage: number,
    message: string
): void {
    callback?.({
        stage,
        percentage,
        message,
    });
}

// MARK: - Identity Factory

function createBusinessIdentity(
    input: JCSBusinessProvisioningInput
): BusinessCreationIdentity {
    const createdAtISO =
        new Date().toISOString();

    return Object.freeze({
        businessID:
            compactID("business"),

        ownerUID:
            compactID("owner"),

        firebaseUID:
            input.firebaseUID,

        platformClientID:
            compactID("platformClient"),

        appSettingsID:
            compactID("appSettings"),

        businessDNAID:
            compactID("businessDNA"),

        workspaceID:
            compactID("workspace"),

        membershipID:
            compactID("membership"),

        businessInviteCode:
            createBusinessInviteCode(
                input.businessName
            ),

        createdAtISO,

        identityVersion: 1,
    });
}

// MARK: - Default Modules Resolver

function resolveEnabledModules(
    recommendedModules: readonly string[]
): string[] {
    return uniqueStrings([
        ...UNIVERSAL_BUSINESS_MODULES,
        ...recommendedModules,
    ]);
}

// MARK: - Document Factory

async function prepareBusinessDocuments(
    database: Firestore,
    input: JCSBusinessProvisioningInput,
    identity: BusinessCreationIdentity,
    options: ResolvedBusinessCreationOptions
): Promise<PreparedBusinessDocuments> {
    const createdAtISO =
        identity.createdAtISO;

    const updatedAtISO =
        createdAtISO;

    /*
     * JCS_WEB_BUSINESS_SIGNUP_INACTIVE_BILLING_H2_C6D_J_F_R37A_1
     *
     * Business creation does NOT begin a subscription trial.
     *
     * These dates are structural sentinels only.
     * Stripe/webhook supplies real verified trial dates later.
     */
    const trialStartedAtISO =
        new Date(0).toISOString();

    const trialStartedAt =
        new Date(trialStartedAtISO);

    const trialEndsAtISO =
        addDays(
            trialStartedAt,
            0
        ).toISOString();

    const enabledModules =
        resolveEnabledModules(
            input.recommendedModules
        );

    const disabledModules: string[] = [];

    const permissions =
        uniqueStrings(
            BUSINESS_OWNER_PERMISSIONS
        );

    // MARK: Factory Context

    const factoryContext: BusinessCreationFactoryContext = {
        input,
        identity,

        enabledModules,
        disabledModules,

        ownerPermissions:
            permissions,

        configuration: {
            planName:
                options.defaultPlanName,

            trialLengthDays:
                options.defaultTrialLengthDays,

            platformUID:
                options.platformUID,

            currencyCode:
                options.defaultCurrencyCode,

            accentColorName:
                options.defaultAccentColorName,
        },

        createdAtISO,
        updatedAtISO,

        trialStartedAtISO,
        trialEndsAtISO,
    };

    // MARK: Firestore References

    const businessReference = doc(
        database,
        JCS_FIRESTORE_COLLECTIONS.businesses,
        identity.businessID
    );

    const ownerReference = doc(
        database,
        JCS_FIRESTORE_COLLECTIONS.users,
        identity.firebaseUID
    );

    const appSettingsReference = doc(
        database,
        JCS_FIRESTORE_COLLECTIONS.appSettings,
        identity.businessID
    );

    const platformClientReference = doc(
        database,
        JCS_FIRESTORE_COLLECTIONS.platformClients,
        identity.businessID
    );

    const businessDNAReference = doc(
        database,
        JCS_FIRESTORE_COLLECTIONS.businessDNA,
        identity.businessID
    );

    const workspaceReference = doc(
        database,
        JCS_FIRESTORE_COLLECTIONS.businessWorkspaces,
        identity.businessID
    );

    const membershipReference = doc(
        database,
        JCS_FIRESTORE_COLLECTIONS.businessMemberships,
        identity.membershipID
    );

    // MARK: Business Document

    const businessDocument:
        JCSBusinessDocument = {
        id:
            identity.businessID,

        businessID:
            identity.businessID,

        businessName:
            input.businessName,

        normalizedBusinessName:
            normalizedSearchText(
                input.businessName
            ),

        businessPhone:
            input.businessPhone,

        website:
            input.website,

        ownerUID:
            identity.ownerUID,

        ownerFirebaseUID:
            identity.firebaseUID,

        industryCategoryKey:
            input.industryCategoryKey,

        industryCategoryTitle:
            input.industryCategoryTitle,

        businessModeKey:
            input.businessModeKey,

        businessModeName:
            input.businessModeName,

        businessInviteCode:
            identity.businessInviteCode,

        recommendedModules:
            uniqueStrings(
                input.recommendedModules
            ),

        enabledModules,
        disabledModules,

        localeIdentifier:
            input.localeIdentifier,

        timeZoneIdentifier:
            input.timeZoneIdentifier,

        status: "active",
        onboardingStatus: "ready",

        planName:
            options.defaultPlanName,

        trialLengthDays:
            options.defaultTrialLengthDays,

        createdByUID:
            identity.firebaseUID,

        updatedByUID:
            identity.firebaseUID,

        createdAtISO,
        updatedAtISO,

        identityVersion:
            identity.identityVersion,

        createdAt:
            serverTimestamp(),

        updatedAt:
            serverTimestamp(),
    };

    // MARK: Business Owner Document

    const ownerDocument:
        JCSBusinessOwnerDocument = {
        id:
            identity.firebaseUID,

        userID:
            identity.firebaseUID,

        ownerUID:
            identity.ownerUID,

        firebaseUID:
            identity.firebaseUID,

        businessID:
            identity.businessID,

        fullName:
            input.ownerFullName,

        normalizedFullName:
            normalizedSearchText(
                input.ownerFullName
            ),

        email:
            input.ownerEmail,

        normalizedEmail:
            cleanText(
                input.ownerEmail
            ).toLowerCase(),

        phone:
            input.ownerPhone,

        role: "businessOwner",
        roleRawValue: "businessOwner",

        isBusinessOwner: true,
        isPlatformAdministrator: false,

        isActive: true,
        accountStatus: "active",

        enabledModules,
        disabledModules,

        permissions,

        localeIdentifier:
            input.localeIdentifier,

        timeZoneIdentifier:
            input.timeZoneIdentifier,

        createdByUID:
            identity.firebaseUID,

        updatedByUID:
            identity.firebaseUID,

        createdAtISO,
        updatedAtISO,

        createdAt:
            serverTimestamp(),

        updatedAt:
            serverTimestamp(),
    };

    // MARK: New Business Official Branding
    //
    // H2-C6D-J-F-LOGO-R37A-3
    //
    // Official JCS Logo 2 is the initial logo for every NEW
    // business, independent of Starter/Premium selection.
    //
    // This does NOT grant Premium or Sofía entitlement.
    // Stripe/webhook remains subscription authority.

    const defaultOfficialLogoDefinition =
        officialJCSLogoForID(
            DEFAULT_OFFICIAL_JCS_LOGO_ID
        );

    if (!defaultOfficialLogoDefinition) {
        throw new JCSBusinessRegistrationError(
            "business-creation-failed",
            "The default Official JCS Logo 2 is not registered."
        );
    }

    const defaultOfficialLogo =
        await resolveOfficialJCSLogo(
            defaultOfficialLogoDefinition
        );

    if (
        !defaultOfficialLogo.isAvailable ||
        !cleanText(
            defaultOfficialLogo.downloadURL
        )
    ) {
        throw new JCSBusinessRegistrationError(
            "business-creation-failed",
            "Official JCS Logo 2 could not be resolved from Firebase Storage."
        );
    }

    const defaultOfficialLogoFileName =
        cleanText(
            defaultOfficialLogo
                .storagePath
                .split("/")
                .pop()
        );

    // MARK: AppSettings Factory
    //
    // Keep legacy fields for compatibility, then enrich the
    // NEW business document with the modern branding contract.

    const legacyAppSettingsDocument =
        AppSettingsFactory.create(
            factoryContext,
            {
                logoFileName:
                    defaultOfficialLogoFileName,

                useAccentColorForLogo:
                    false,
            }
        );

    const appSettingsDocument:
        JCSAppSettingsDocument & {
            activeLogoID: string;
            activeLogoSource: "official-jcs";
            logoStoragePath: string;
            logoDownloadURL: string;
            logoRenderingMode: "original";
            logoSupportsAccentColor: false;
            brandingUpdatedAt: FieldValue;
            activeLogoUpdatedAt: FieldValue;
        } = {
            ...legacyAppSettingsDocument,

            activeLogoID:
                defaultOfficialLogo.id,

            activeLogoSource:
                "official-jcs",

            logoStoragePath:
                defaultOfficialLogo.storagePath,

            logoDownloadURL:
                defaultOfficialLogo.downloadURL,

            logoRenderingMode:
                "original",

            logoSupportsAccentColor:
                false,

            useAccentColorForLogo:
                false,

            brandingUpdatedAt:
                serverTimestamp(),

            activeLogoUpdatedAt:
                serverTimestamp(),
        };

    // MARK: PlatformClient Factory

    const platformClientDocument:
        JCSPlatformClientDocument =
        PlatformClientFactory.create(
            factoryContext
        );

    // MARK: Business DNA Factory

    const businessDNADocument:
        JCSBusinessDNADocument =
        BusinessDNAFactory.create(
            factoryContext
        );

    // MARK: Workspace Document

    const workspaceDocument:
        JCSBusinessWorkspaceDocument = {
        id:
            identity.workspaceID,

        workspaceID:
            identity.workspaceID,

        businessID:
            identity.businessID,

        ownerUID:
            identity.ownerUID,

        firebaseUID:
            identity.firebaseUID,

        businessModeKey:
            input.businessModeKey,

        enabledModules,
        disabledModules,

        onboardingCompleted: true,
        workspaceReady: true,

        workspaceVersion: 1,

        createdByUID:
            identity.firebaseUID,

        updatedByUID:
            identity.firebaseUID,

        createdAtISO,
        updatedAtISO,

        createdAt:
            serverTimestamp(),

        updatedAt:
            serverTimestamp(),
    };

    // MARK: Membership Document

    const membershipDocument:
        JCSBusinessMembershipDocument = {
        id:
            identity.membershipID,

        membershipID:
            identity.membershipID,

        businessID:
            identity.businessID,

        userUID:
            identity.ownerUID,

        firebaseUID:
            identity.firebaseUID,

        role:
            "businessOwner",

        permissions,
        enabledModules,

        isActive: true,
        status: "active",

        joinedAtISO:
            createdAtISO,

        createdByUID:
            identity.firebaseUID,

        updatedByUID:
            identity.firebaseUID,

        createdAtISO,
        updatedAtISO,

        createdAt:
            serverTimestamp(),

        updatedAt:
            serverTimestamp(),
    };

    return {
        businessReference,
        businessDocument,

        ownerReference,
        ownerDocument,

        appSettingsReference,
        appSettingsDocument,

        platformClientReference,
        platformClientDocument,

        businessDNAReference,
        businessDNADocument,

        workspaceReference,
        workspaceDocument,

        membershipReference,
        membershipDocument,
    };
}

// MARK: - Business Creation Engine

export class BusinessCreationEngine
    implements JCSBusinessProvisioningEngine
{
    private readonly database: Firestore;

    private readonly defaultPlanName: string;
    private readonly defaultTrialLengthDays: number;

    private readonly dashboardRoute: string;
    private readonly platformUID: string;

    private readonly defaultCurrencyCode: string;
    private readonly defaultAccentColorName: string;

    constructor(
        options: BusinessCreationEngineOptions = {}
    ) {
        this.database =
            options.firestore ??
            firestoreDatabase;

        this.defaultPlanName =
            cleanText(
                options.defaultPlanName
            ) || "Starter";

        this.defaultTrialLengthDays =
            Math.max(
                0,
                Math.round(
                    options.defaultTrialLengthDays ??
                    0
                )
            );

        this.dashboardRoute =
            cleanText(
                options.dashboardRoute
            ) || "/dashboard";

        this.platformUID =
            cleanText(
                options.platformUID
            ) || "jcs-platform";

        this.defaultCurrencyCode =
            cleanText(
                options.defaultCurrencyCode
            ) || "USD";

        this.defaultAccentColorName =
            cleanText(
                options.defaultAccentColorName
            ) || "copper";
    }

    // MARK: Create Business

    async createBusiness(
        input: JCSBusinessProvisioningInput,
        onProgress?: BusinessRegistrationProgressCallback
    ): Promise<JCSBusinessRegistrationResult> {
        throwIfAborted(
            input.signal
        );

        this.validateInput(input);

        // MARK: Generate Identity

        emitProgress(
            onProgress,
            "creatingBusiness",
            30,
            "Creating your business identity..."
        );

        const identity =
            createBusinessIdentity(input);

        throwIfAborted(
            input.signal
        );

        // MARK: Prepare Owner

        emitProgress(
            onProgress,
            "creatingBusinessOwner",
            40,
            "Preparing the business owner profile..."
        );

        await this.updateFirebaseOwnerProfile(
            input.firebaseUser,
            input.ownerFullName
        );

        throwIfAborted(
            input.signal
        );

        // MARK: Prepare AppSettings

        emitProgress(
            onProgress,
            "creatingAppSettings",
            50,
            "Preparing App Settings..."
        );

        // MARK: Prepare PlatformClient

        emitProgress(
            onProgress,
            "creatingPlatformClient",
            60,
            "Registering the business with the JCS platform..."
        );

        // MARK: Prepare Business DNA

        emitProgress(
            onProgress,
            "creatingBusinessDNA",
            70,
            "Initializing your business DNA..."
        );

        const preparedDocuments =
            await prepareBusinessDocuments(
                this.database,
                input,
                identity,
                {
                    defaultPlanName:
                        this.defaultPlanName,

                    defaultTrialLengthDays:
                        this.defaultTrialLengthDays,

                    dashboardRoute:
                        this.dashboardRoute,

                    platformUID:
                        this.platformUID,

                    defaultCurrencyCode:
                        this.defaultCurrencyCode,

                    defaultAccentColorName:
                        this.defaultAccentColorName,
                }
            );

        throwIfAborted(
            input.signal
        );

        // MARK: Provision Workspace

        emitProgress(
            onProgress,
            "provisioningWorkspace",
            82,
            "Provisioning your business workspace..."
        );

        const batch =
            writeBatch(this.database);

        batch.set(
            preparedDocuments.businessReference,
            preparedDocuments.businessDocument
        );

        batch.set(
            preparedDocuments.ownerReference,
            preparedDocuments.ownerDocument
        );

        batch.set(
            preparedDocuments.appSettingsReference,
            preparedDocuments.appSettingsDocument
        );

        batch.set(
            preparedDocuments.platformClientReference,
            preparedDocuments.platformClientDocument
        );

        batch.set(
            preparedDocuments.businessDNAReference,
            preparedDocuments.businessDNADocument
        );

        batch.set(
            preparedDocuments.workspaceReference,
            preparedDocuments.workspaceDocument
        );

        batch.set(
            preparedDocuments.membershipReference,
            preparedDocuments.membershipDocument
        );

        throwIfAborted(
            input.signal
        );

        try {
            await batch.commit();
        } catch (error: unknown) {
            throw new JCSBusinessRegistrationError(
                "business-creation-failed",
                "Firestore could not create the business workspace. Verify the Firestore security rules and try again.",
                error
            );
        }

        if (input.platformInvitationCode) {
            emitProgress(
                onProgress,
                "completingInvitation",
                90,
                "Completing your platform invitation..."
            );
        }

        return {
            businessID:
                identity.businessID,

            ownerUID:
                identity.ownerUID,

            firebaseUID:
                identity.firebaseUID,

            businessName:
                input.businessName,

            industryCategoryKey:
                input.industryCategoryKey,

            industryCategoryTitle:
                input.industryCategoryTitle,

            businessModeKey:
                input.businessModeKey,

            businessModeName:
                input.businessModeName,

            businessInviteCode:
                identity.businessInviteCode,

            platformInvitationCode:
                input.platformInvitationCode,

            planName:
                this.defaultPlanName,

            trialLengthDays:
                this.defaultTrialLengthDays,

            generatedLogoFileName:
                undefined,

            logoStatus:
                "ready",

            nextRoute:
                this.dashboardRoute,
        };
    }
     // MARK: Validate Input

 private validateInput(
  input: JCSBusinessProvisioningInput
 ): void {
  if (!cleanText(input.firebaseUID)) {
   throw new JCSBusinessRegistrationError(
    "invalid-request",
    "Firebase UID is required to create the business."
   );
  }

  if (!input.firebaseUser) {
   throw new JCSBusinessRegistrationError(
    "invalid-request",
    "An authenticated Firebase user is required."
   );
  }

  if (
   input.firebaseUser.uid !==
   input.firebaseUID
  ) {
   throw new JCSBusinessRegistrationError(
    "invalid-request",
    "The authenticated Firebase user does not match the registration request."
   );
  }

  if (!cleanText(input.businessName)) {
   throw new JCSBusinessRegistrationError(
    "invalid-request",
    "Business name is required."
   );
  }

  if (!cleanText(input.ownerFullName)) {
   throw new JCSBusinessRegistrationError(
    "invalid-request",
    "Business owner name is required."
   );
  }

  if (!cleanText(input.ownerEmail)) {
   throw new JCSBusinessRegistrationError(
    "invalid-request",
    "Business owner email is required."
   );
  }

  if (
   !cleanText(
    input.industryCategoryKey
   )
  ) {
   throw new JCSBusinessRegistrationError(
    "invalid-request",
    "Industry category is required."
   );
  }

  if (
   !cleanText(
    input.industryCategoryTitle
   )
  ) {
   throw new JCSBusinessRegistrationError(
    "invalid-request",
    "Industry category title is required."
   );
  }

  if (
   !cleanText(
    input.businessModeKey
   )
  ) {
   throw new JCSBusinessRegistrationError(
    "invalid-request",
    "Business mode is required."
   );
  }

  if (
   !cleanText(
    input.businessModeName
   )
  ) {
   throw new JCSBusinessRegistrationError(
    "invalid-request",
    "Business mode name is required."
   );
  }

  if (
   !cleanText(
    input.localeIdentifier
   )
  ) {
   throw new JCSBusinessRegistrationError(
    "invalid-request",
    "Locale identifier is required."
   );
  }

  if (
   !cleanText(
    input.timeZoneIdentifier
   )
  ) {
   throw new JCSBusinessRegistrationError(
    "invalid-request",
    "Time zone identifier is required."
   );
  }

  if (
   !Array.isArray(
    input.recommendedModules
   )
  ) {
   throw new JCSBusinessRegistrationError(
    "invalid-request",
    "Recommended modules must be provided as an array."
   );
  }
 }

 // MARK: Update Firebase Owner Profile

 private async updateFirebaseOwnerProfile(
  firebaseUser: User,
  ownerFullName: string
 ): Promise<void> {
  const displayName =
   cleanText(ownerFullName);

  if (!displayName) {
   return;
  }

  if (
   firebaseUser.displayName ===
   displayName
  ) {
   return;
  }

  try {
   await updateProfile(
    firebaseUser,
    {
     displayName,
    }
   );
  } catch (error: unknown) {
   throw new JCSBusinessRegistrationError(
    "authentication-failed",
    "The owner authentication profile could not be completed.",
    error
   );
  }
 }
}

// MARK: - Shared Business Creation Engine

/**
 * Shared production instance.
 *
 * This instance is used by JCSBusinessRegistrationManager
 * to provision a newly authenticated Business Owner.
 */
export const businessCreationEngine =
 new BusinessCreationEngine({
  defaultPlanName:
   "Starter",

  defaultTrialLengthDays:
   0,

  dashboardRoute:
   "/dashboard",

  platformUID:
   "jcs-platform",

  defaultCurrencyCode:
   "USD",

  defaultAccentColorName:
   "copper",
 });

// MARK: - Registration Manager Connection

/**
 * Connects the registration layer with the business
 * provisioning layer.
 *
 * BusinessSignUpView
 *      ↓
 * JCSBusinessRegistrationManager
 *      ↓
 * BusinessCreationEngine
 *      ↓
 * Firestore WriteBatch
 */
JCSBusinessRegistrationManager.configure({
 provisioningEngine:
  businessCreationEngine,
});

export default businessCreationEngine;
