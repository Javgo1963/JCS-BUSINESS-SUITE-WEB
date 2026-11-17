import {
    assertWebCanonicalRuntimeLegacyGate,
    type JCSAppUser,
    type JCSBusinessMembership,
} from "@/core/business-context/JCSBusinessContext";

export interface DashboardAccess {

    isPlatformAdmin: boolean;

    isBusinessOwner: boolean;

    isBusinessAdmin: boolean;

    isAdmin: boolean;

    isManager: boolean;

    isEmployee: boolean;

    isCustomer: boolean;

    isProvider: boolean;

    enabledModules: Set<string>;

    disabledModules: Set<string>;

    permissions: Set<string>;
}

export function createDashboardAccess(

    appUser: JCSAppUser | null,

    membership: JCSBusinessMembership | null

): DashboardAccess {

    assertWebCanonicalRuntimeLegacyGate();


    const role =
        (
            appUser?.roleRawValue ??
            appUser?.role ??
            membership?.role ??
            ""
        ).toLowerCase();

    return {

        isPlatformAdmin:
            appUser?.isPlatformAdministrator === true,

        isBusinessOwner:
            appUser?.isBusinessOwner === true,

        isBusinessAdmin:
            role === "businessadmin",

        isAdmin:
            role === "admin",

        isManager:
            role === "manager",

        isEmployee:
            role === "employee",

        isCustomer:
            role === "customer",

        isProvider:
            role === "provider",

        enabledModules:
            new Set(
                appUser?.enabledModules ??
                membership?.enabledModules ??
                []
            ),

        disabledModules:
            new Set(
                appUser?.disabledModules ?? []
            ),

        /*
         * AppUser is the canonical per-user access authority.
         *
         * businessMemberships remains a compatibility fallback
         * only when an AppUser profile is unavailable.
         *
         * An empty or stale membership permissions array must
         * never shadow current AppUser permissions.
         */
        permissions:
            new Set(
                appUser
                    ? appUser.permissions ?? []
                    : membership?.permissions ?? []
            ),
    };
}