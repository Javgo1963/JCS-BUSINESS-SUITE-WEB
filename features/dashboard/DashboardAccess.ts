import type {
    JCSAppUser,
    JCSBusinessMembership,
} from "@/core/business-context/JCSBusinessContext";

export interface DashboardAccess {

    isPlatformAdmin: boolean;

    isBusinessOwner: boolean;

    isBusinessAdmin: boolean;

    isAdmin: boolean;

    isManager: boolean;

    isEmployee: boolean;

    enabledModules: Set<string>;

    permissions: Set<string>;
}

export function createDashboardAccess(

    appUser: JCSAppUser | null,

    membership: JCSBusinessMembership | null

): DashboardAccess {

    const role =
        (
            membership?.role ??
            appUser?.role ??
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

        enabledModules:
            new Set(
                appUser?.enabledModules ?? []
            ),

        permissions:
            new Set(
                membership?.permissions ??
                appUser?.permissions ??
                []
            ),
    };
}