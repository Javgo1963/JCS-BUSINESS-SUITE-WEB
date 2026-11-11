"use client";

import DashboardLiveStatus from "./DashboardLiveStatus";
import {
  useDashboardOfficialShell,
} from "./useDashboardOfficialShell";
import JCSRealtimeClock from "@/components/app-shell/JCSRealtimeClock";
import JCSWeatherCard from "@/components/app-shell/JCSWeatherCard";
import JCSUserAvatarPicker from "@/components/app-shell/JCSUserAvatarPicker";
import AppSettingsView from "@/features/app-settings/AppSettingsView";
import type {
  AppAccentColorName,
  AppSettingsActor,
} from "@/features/app-settings/AppSettingsTypes";
import JCSOfficialShell from
  "@/components/app-shell/JCSOfficialShell";

import CompanyLogoView from "@/features/business-branding/CompanyLogoView";

import {
  useBusinessLogo,
} from "@/features/business-branding/useBusinessLogo";
import {
  useDashboardSnapshot,
} from "./useDashboardSnapshot";

import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  Command,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  X,
} from "lucide-react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import DashboardIcon from "./DashboardIcon";

import {
  BusinessConfigurationEngine,
  type BusinessConfiguration,
} from "@/core/business-mode/BusinessConfigurationEngine";

import {
  useBusinessContext,
} from "@/core/business-context/JCSBusinessContext";

import {
  usePlatformSettingsContext,
} from "@/features/platform-settings/PlatformSettingsContext";

import {
  createDashboardAccess,
  type DashboardAccess,
} from "./DashboardAccess";

import {
  DashboardSection,
  type DashboardRoute,
} from "./DashboardTypes";

import {
  getDashboardHeroShortcuts,
  getDashboardModulesForSection,
  type DashboardModuleDefinition,
} from "./DashboardModuleRegistry";

import {
  signOut,
} from "@/core/services/AuthService";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  db,
} from "@/core/firebase/firebase";

import {
  normalizePlatformClientRecord,
} from "@/features/platform-executive-center/PlatformClientDomain";

import {
  PLATFORM_SUBSCRIPTION_STATUSES,
  type PlatformClientFirestoreData,
} from "@/features/platform-executive-center/PlatformExecutiveTypes";

import "./DashboardView.css";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type CSSProperties,
} from "react";

// =======================================================
// MARK: - Constants
// =======================================================

const SECTION_ORDER:
  readonly DashboardSection[] = [
    DashboardSection.Store,
    DashboardSection.Business,
    DashboardSection.Operations,
    DashboardSection.Management,
  ];

const SECTION_SUBTITLES: Readonly<
  Partial<
    Record<
      DashboardSection,
      string
    >
  >
> = {
  [DashboardSection.Store]:
    "Customer-facing shopping, ordering and account experiences.",

  [DashboardSection.Business]:
    "Sales, checkout, analytics and financial performance.",

  [DashboardSection.Operations]:
    "Daily workflows, inventory, orders and fulfillment.",

  [DashboardSection.Management]:
    "People, settings, administration and business control.",
};

// =======================================================
// MARK: - Local Types
// =======================================================

type DashboardMetricTone =
  | "revenue"
  | "orders"
  | "customers"
  | "inventory";

interface DashboardMetric {
  id: string;

  label: string;
  value: string;
  detail: string;

  trend?: string;

  icon: string;
  tone: DashboardMetricTone;

  route?: DashboardRoute;
}

interface DashboardActivity {
  id: string;

  title: string;
  detail: string;
  timestamp: string;

  route?: DashboardRoute;
}

interface SidebarLink {
  id: string;
  title: string;

  icon: ComponentType<{
    size?: number;
    strokeWidth?: number;
  }>;

  route?: DashboardRoute;
}

// =======================================================
// MARK: - Text Helpers
// =======================================================

function cleanText(
  value:
    | string
    | null
    | undefined
): string {
  return value?.trim() ?? "";
}

function readStringProperty(
  value: unknown,
  propertyName: string
): string {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return "";
  }

  const record =
    value as Record<string, unknown>;

  const propertyValue =
    record[propertyName];

  return typeof propertyValue ===
    "string"
    ? propertyValue.trim()
    : "";
}

function readBooleanProperty(
  value: unknown,
  propertyName: string
): boolean {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const record =
    value as Record<string, unknown>;

  return record[propertyName] ===
    true;
}

function resolveAccentColorCSS(
  accentName: string
): string {
  const accentMap:
    Record<string, string> = {
      blue: "#2563eb",
      sky: "#0ea5e9",
      aqua: "#06b6d4",
      teal: "#0f766e",
      mint: "#34d399",
      green: "#16a34a",
      lime: "#84cc16",
      olive: "#657e21",
      yellow: "#facc15",
      gold:
        "linear-gradient(135deg, #f8df82, #c99721, #7b5510)",
      sand: "#d6b98c",
      orange: "#f97316",
      peach: "#fbad82",
      coral: "#fb7185",
      red: "#dc2626",
      rose: "#e11d48",
      pink: "#ec4899",
      purple: "#9333ea",
      violet: "#7c3aed",
      indigo: "#4f46e5",
      lavender: "#c4b5fd",
      plum: "#7e225f",
      slate: "#475569",
      gray: "#6b7280",
      charcoal: "#27272a",
      black: "#09090b",
      white: "#ffffff",
      silver:
        "linear-gradient(135deg, #ffffff, #bfc5cc, #737b85)",
      chrome:
        "linear-gradient(135deg, #f8fafc, #89929d, #ffffff, #4b5563)",
      platinum:
        "linear-gradient(135deg, #f5f5f4, #c8c7c1, #868581)",
      steel:
        "linear-gradient(135deg, #dbe4ea, #708090, #334155)",
      titanium:
        "linear-gradient(135deg, #d6d3d1, #78716c, #292524)",
      bronze:
        "linear-gradient(135deg, #d69b62, #8a4f22, #4c2912)",
      copper:
        "linear-gradient(135deg, #e7a06c, #b45f35, #6e2f1a)",
      "rose-gold":
        "linear-gradient(135deg, #f4c6b9, #c78372, #865244)",
      rosegold:
        "linear-gradient(135deg, #f4c6b9, #c78372, #865244)",
      champagne:
        "linear-gradient(135deg, #fff0c7, #d6bd84, #9c7d3c)",
      brass:
        "linear-gradient(135deg, #d8c078, #a58528, #66500d)",
      emerald:
        "linear-gradient(135deg, #34d399, #047857, #064e3b)",
      sapphire:
        "linear-gradient(135deg, #60a5fa, #1d4ed8, #172554)",
      ruby:
        "linear-gradient(135deg, #fb7185, #be123c, #4c0519)",
      amethyst:
        "linear-gradient(135deg, #d8b4fe, #9333ea, #581c87)",
      onyx:
        "linear-gradient(135deg, #52525b, #18181b, #000000)",
      midnight:
        "linear-gradient(135deg, #334155, #172554, #020617)",
      ocean:
        "linear-gradient(135deg, #22d3ee, #0284c7, #164e63)",
      forest:
        "linear-gradient(135deg, #4ade80, #166534, #052e16)",
      sunset:
        "linear-gradient(135deg, #facc15, #f97316, #db2777)",
      fire:
        "linear-gradient(135deg, #facc15, #ef4444, #7f1d1d)",
      ice:
        "linear-gradient(135deg, #ecfeff, #67e8f9, #38bdf8)",
      "liquid-glass":
        "linear-gradient(135deg, rgba(255,255,255,.95), rgba(125,211,252,.72), rgba(196,181,253,.78))",
      liquidglass:
        "linear-gradient(135deg, rgba(255,255,255,.95), rgba(125,211,252,.72), rgba(196,181,253,.78))",
    };

  return (
    accentMap[accentName] ??
    "#b87333"
  );
}

function greetingForCurrentHour(): string {
  const hour =
    new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function normalizeAccentName(
  value?: string | null
): string {
  return (
    cleanText(value)
      .toLowerCase()
      .replace(/\s+/g, "-") ||
    "copper"
  );
}

function businessDisplayName(
  businessName?: string | null
): string {
  return (
    cleanText(businessName) ||
    "JCS Business Suite"
  );
}

function firstDisplayName(
  fullName?: string | null,
  fallback?: string | null
): string {
  const normalized =
    cleanText(fullName) ||
    cleanText(fallback) ||
    "Business Owner";

  return (
    normalized.split(/\s+/)[0] ||
    normalized
  );
}

function businessModeDisplayName(
  configuration:
    BusinessConfiguration
): string {
  return (
    cleanText(
      configuration.businessModeName
    ) ||
    cleanText(
      configuration
        .industryCategoryTitle
    ) ||
    "General Business"
  );
}

function normalizedLanguageCode(
  value?: string | null
): string {
  const normalized =
    cleanText(value)
      .toLowerCase()
      .replace("_", "-");

  if (
    normalized.startsWith("es")
  ) {
    return "es";
  }

  return "en";
}

function localeForLanguage(
  languageCode: string,
  localeIdentifier?: string | null
): string {
  const configuredLocale =
    cleanText(localeIdentifier);

  if (configuredLocale) {
    return configuredLocale;
  }

  return languageCode === "es"
    ? "es-US"
    : "en-US";
}

// =======================================================
// MARK: - Route Helpers
// =======================================================

function workspaceTitleFromPath(
  pathname: string
): string {
  const normalizedPath =
    pathname
      .trim()
      .toLowerCase();

  const workspaceTitles:
    Record<string, string> = {
      "/dashboard":
        "Dashboard",

      "/customer":
        "Customer Home",

      "/restaurant":
        "Restaurant Store",

      "/catalog":
        "Catalog",

      "/favorites":
        "Favorites",

      "/account":
        "Account",

      "/pos":
        "Point of Sale",

      "/cash-register":
        "Cash Register",

      "/insights":
        "Business Insights",

      "/accounting":
        "Accounting",

      "/sales":
        "Sales",

      "/products":
        "Products",

      "/inventory":
        "Inventory",

      "/orders":
        "Orders",

      "/returns":
        "Returns",

      "/services":
        "Services",

      "/transportation":
        "Transportation",

      "/compliance":
        "Compliance",

      "/facilities":
        "Facilities",

      "/receiving":
        "Receiving",

      "/receiving/history":
        "Receiving History",

      "/shipping":
        "Shipping",

      "/shipments":
        "Shipments",

      "/appointments":
        "Appointments",

      "/backorders":
        "Backorders",

      "/events":
        "Events",

      "/customers":
        "Customers",

      "/employees":
        "Employees",

      "/platform/clients":
        "Platform Clients",

      "/platform-executive-center":
        "Executive Center",

      "/invitations":
        "Invitations",

      "/payroll":
        "Payroll",

      "/providers":
        "Providers",

      "/users":
        "Users",

      "/settings":
        "App Settings",
    };

  if (
    workspaceTitles[
      normalizedPath
    ]
  ) {
    return workspaceTitles[
      normalizedPath
    ];
  }

  const matchingEntry =
    Object.entries(
      workspaceTitles
    )
      .sort(
        (
          [firstPath],
          [secondPath]
        ) =>
          secondPath.length -
          firstPath.length
      )
      .find(
        ([path]) =>
          normalizedPath.startsWith(
            `${path}/`
          )
      );

  return (
    matchingEntry?.[1] ??
    "Dashboard"
  );
}

function routeToPath(
  route: DashboardRoute
): string {
  const routeKey =
    String(route);

  const explicitRoutes:
    Record<string, string> = {
      CustomerHome:
        "/customer",

      RestaurantStore:
        "/restaurant",

      Catalog:
        "/catalog",

      Favorites:
        "/favorites",

      Account:
        "/account",

      POS:
        "/pos",

      CashRegister:
        "/cash-register",

      Insights:
        "/insights",

      Accounting:
        "/accounting",

      Sales:
        "/sales",

      Products:
        "/products",

      Inventory:
        "/inventory",

      Orders:
        "/orders",

      Returns:
        "/returns",

      Services:
        "/services",

      Transportation:
        "/transportation",

      Compliance:
        "/compliance",

      Buildings:
        "/facilities",

      Receiving:
        "/receiving",

      ReceivingHistory:
        "/receiving/history",

      Shipping:
        "/shipping",

      Shipments:
        "/shipments",

      Calendar:
        "/appointments",

      Backorders:
        "/backorders",

      Events:
        "/events",

      Customers:
        "/customers",

      Employees:
        "/employees",

      PlatformClients:
  "/platform/clients",

PlatformExecutiveCenter:
  "/platform/executive-center",

BusinessInvitations:
  "/invitations",

      Payroll:
        "/payroll",

      Providers:
        "/providers",

      Users:
        "/users",

      AppSettings:
        "/settings",
    };

  const explicitPath =
    explicitRoutes[routeKey];

  if (explicitPath) {
    return explicitPath;
  }

  return `/${routeKey
    .replace(
      /([a-z])([A-Z])/g,
      "$1-$2"
    )
    .replace(/_/g, "-")
    .toLowerCase()}`;
}

// =======================================================
// MARK: - Component
// =======================================================

export default function DashboardView() {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const {
  firebaseUser,
  appUser,
  business,
  appSettings,
  membership,
  businessID,

  activeAccentColorName,
  setActiveAccentColor,

  isLoading,
  refresh,
} = useBusinessContext();

const {
  platformName,
  platformTagline,
  platformLogoDownloadURL,
  platformAccentColorName,
  platformLanguageCode,
  platformBackgroundID,

  hasCustomPlatformLogo,

  isLoading:
    platformSettingsIsLoading,

  refreshPlatformSettings,
} = usePlatformSettingsContext();

  const workspaceTitle =
    useMemo(
      () =>
        workspaceTitleFromPath(
          pathname
        ),
      [
        pathname,
      ]
    );

  // =====================================================
  // MARK: - Presentation State
  // =====================================================

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);

  const [
    profileMenuOpen,
    setProfileMenuOpen,
  ] = useState(false);

  const [
    isDarkMode,
    setIsDarkMode,
  ] = useState(false);

  const [
    isSigningOut,
    setIsSigningOut,
  ] = useState(false);

  const [
  appSettingsOpen,
  setAppSettingsOpen,
] = useState(false);

  // =====================================================
  // MARK: - Access
  // =====================================================

  const access:
    DashboardAccess = useMemo(
      () =>
        createDashboardAccess(
          appUser,
          membership
        ),
      [
        appUser,
        membership,
      ]
    );

  // =====================================================
  // MARK: - Business Configuration
  // =====================================================

  const configuration =
    useMemo<BusinessConfiguration>(
      () =>
        BusinessConfigurationEngine
          .configuration({
            businessModeKey:
              business
                ?.businessModeKey,

            businessModeName:
              business
                ?.businessModeName,

            industryCategoryKey:
              business
                ?.industryCategoryKey,

            industryCategoryTitle:
              business
                ?.industryCategoryTitle,

            recommendedModules:
              business
                ?.recommendedModules,

            enabledModules:
              business
                ?.enabledModules ??
              appUser
                ?.enabledModules,

            disabledModules:
              business
                ?.disabledModules,
          }),
      [
        appUser?.enabledModules,
        business?.businessModeKey,
        business?.businessModeName,
        business?.disabledModules,
        business?.enabledModules,
        business?.industryCategoryKey,
        business?.industryCategoryTitle,
        business?.recommendedModules,
      ]
    );

  // =====================================================
// MARK: - Active Shell Identity
// =====================================================

const activeIdentityName =
  access.isPlatformAdmin
    ? (
        cleanText(
          platformName
        ) ||
        "JCS Business Suite"
      )
    : businessDisplayName(
        appSettings?.companyName ??
        business?.businessName
      );

const activeIdentityTagline =
  access.isPlatformAdmin
    ? (
        cleanText(
          platformTagline
        ) ||
        "One Platform | Every Business | Endless Possibilities"
      )
    : (
        readStringProperty(
          business,
          "tagline"
        ) ||
        "One Platform | Every Business | Endless Possibilities"
      );

const accentName =
  normalizeAccentName(
    access.isPlatformAdmin
      ? platformAccentColorName
      : activeAccentColorName
  );

const activeBackgroundID =
  access.isPlatformAdmin
    ? platformBackgroundID
    : (
        appSettings
          ?.backgroundID ??
        "default"
      );

const activeBackgroundDownloadURL =
  access.isPlatformAdmin
    ? ""
    : (
        appSettings
          ?.backgroundDownloadURL ??
        ""
      );

const companyName =
  activeIdentityName;

const activeLogoDownloadURL =
  access.isPlatformAdmin
    ? cleanText(
        platformLogoDownloadURL
      )
    : "";

  const firstName =
    firstDisplayName(
      appUser?.fullName,
      firebaseUser?.displayName
    );

  const businessModeName =
    businessModeDisplayName(
      configuration
    );

  const normalizedUserRole =
  cleanText(
    appUser?.roleRawValue ??
    appUser?.role
  )
    .toLowerCase()
    .replace(
      /[\s_-]+/g,
      ""
    );

const userRole =
  access.isPlatformAdmin
    ? "Platform Administrator"
    : access.isBusinessOwner
      ? "Business Owner"
      : access.isBusinessAdmin
        ? "Business Administrator"
        : access.isAdmin
          ? "Administrator"
          : access.isManager
            ? "Manager"
            : access.isEmployee
              ? "Employee"
              : normalizedUserRole ===
                  "customer"
                ? "Customer"
                : normalizedUserRole ===
                    "provider"
                  ? "Provider"
                  : normalizedUserRole ===
                      "admin"
                    ? "Administrator"
                    : normalizedUserRole ===
                        "manager"
                      ? "Manager"
                      : normalizedUserRole ===
                          "employee"
                        ? "Employee"
                        : "Team Member";
   const currentUserUID =
  cleanText(
    firebaseUser?.uid
  );

const currentOwnerUID =
  readStringProperty(
    business,
    "ownerUID"
  ) ||
  readStringProperty(
    appUser,
    "ownerUID"
  ) ||
  (
    access.isBusinessOwner
      ? currentUserUID
      : ""
  ) ||
  currentUserUID;

const appSettingsActor =
  useMemo<AppSettingsActor>(
    () => ({
      firebaseUID:
        currentUserUID,

      businessID,

      ownerUID:
        currentOwnerUID,

      role:
        access.isPlatformAdmin
          ? "platform-admin"
          : access.isBusinessOwner
            ? "business-owner"
            : access.isBusinessAdmin
              ? "admin"
              : access.isManager
                ? "manager"
                : access.isEmployee
                  ? "employee"
                  : "customer",

      isPlatformAdministrator:
        access.isPlatformAdmin,

      isBusinessOwner:
        access.isBusinessOwner,

      isBusinessAdministrator:
        access.isBusinessAdmin,

      hasAppSettingsModule:
        access.isPlatformAdmin ||
        access.isBusinessOwner ||
        appUser?.enabledModules
          ?.includes(
            "app-settings"
          ) === true ||
        membership
          ?.enabledModules
          ?.includes(
            "app-settings"
          ) === true,

      canManageSettings:
        access.isPlatformAdmin ||
        access.isBusinessOwner ||
        appUser?.canManageSettings ===
          true ||
        appUser?.permissions
          ?.includes(
            "manage-app-settings"
          ) === true ||
        membership
          ?.permissions
          ?.includes(
            "manage-app-settings"
          ) === true,
    }),
    [
      access.isBusinessAdmin,
      access.isBusinessOwner,
      access.isEmployee,
      access.isManager,
      access.isPlatformAdmin,

      appUser?.canManageSettings,
      appUser?.enabledModules,
      appUser?.permissions,

      businessID,
      currentOwnerUID,
      currentUserUID,

      membership?.enabledModules,
      membership?.permissions,
    ],
  );

// =====================================================
// MARK: - Canonical Premium Branding Entitlement
// H2-C6D-J-F-LOGO-R37B-R3
// =====================================================

const [
  hasVerifiedPremiumBrandingAccess,
  setHasVerifiedPremiumBrandingAccess,
] = useState(false);

useEffect(() => {
  let isCurrent = true;

  const verifyPremiumBrandingAccess =
    async (): Promise<void> => {

      /*
       * PlatformAdmin is a global platform identity.
       *
       * It does not depend on a business subscription and
       * therefore keeps the existing platform bypass.
       */
      if (access.isPlatformAdmin) {
        if (isCurrent) {
          setHasVerifiedPremiumBrandingAccess(
            true
          );
        }

        return;
      }

      const normalizedBusinessID =
        cleanText(
          businessID
        );

      /*
       * Fail closed.
       *
       * A business tenant without a canonical Business ID
       * cannot receive Premium branding entitlement.
       */
      if (!normalizedBusinessID) {
        if (isCurrent) {
          setHasVerifiedPremiumBrandingAccess(
            false
          );
        }

        return;
      }

      try {
        const reference =
          doc(
            db,
            "platformClients",
            normalizedBusinessID
          );

        const snapshot =
          await getDoc(
            reference
          );

        if (!snapshot.exists()) {
          if (isCurrent) {
            setHasVerifiedPremiumBrandingAccess(
              false
            );
          }

          return;
        }

        const rawPlatformClient =
          snapshot.data() as
            PlatformClientFirestoreData;

        const platformClient =
          normalizePlatformClientRecord(
            snapshot.id,
            rawPlatformClient
          );

        /*
         * Premium branding must be explicitly verified by
         * canonical Stripe/webhook-backed PlatformClient state.
         *
         * We intentionally verify the RAW
         * canUseAutomaticLogo field as literal true so an old
         * document cannot inherit a permissive normalization
         * fallback.
         */
        const isVerifiedPremium =
          cleanText(
            platformClient.planName
          ).toLowerCase() ===
            "premium" &&
          platformClient.subscriptionStatus ===
            PLATFORM_SUBSCRIPTION_STATUSES
              .active &&
          rawPlatformClient
            .canUseAutomaticLogo === true;

        if (isCurrent) {
          setHasVerifiedPremiumBrandingAccess(
            isVerifiedPremium
          );
        }
      } catch (error: unknown) {
        console.error(
          "❌ JCS Web Premium branding verification failed:",
          error
        );

        if (isCurrent) {
          setHasVerifiedPremiumBrandingAccess(
            false
          );
        }
      }
    };

  void verifyPremiumBrandingAccess();

  return () => {
    isCurrent = false;
  };
}, [
  access.isPlatformAdmin,
  businessID,
]);

const hasPremiumBrandingAccess =
  access.isPlatformAdmin ||
  hasVerifiedPremiumBrandingAccess;

  const languageCode =
  normalizedLanguageCode(
    access.isPlatformAdmin
      ? platformLanguageCode
      : appSettings?.languageCode
  );

  const localeIdentifier =
    localeForLanguage(
      languageCode,
      appSettings
        ?.localeIdentifier
    );

  const currencyCode =
    cleanText(
      appSettings?.currencyCode
    ).toUpperCase() ||
    "USD";

   const accentColorCSS =
  resolveAccentColorCSS(
    accentName
  );

const businessLogo =
  useBusinessLogo({
    businessID,

    ownerUID:
      currentOwnerUID,

    createdByUID:
      currentUserUID,

    businessName:
      companyName,

    accentColorName:
      accentName,

    industry:
      businessModeName,

    businessCategory:
      cleanText(
        business
          ?.industryCategoryTitle
      ) ||
      businessModeName,

    style:
      "Premium professional commercial brand identity",

    tagline:
      readStringProperty(
        business,
        "tagline"
      ),

    languageCode,

    businessDNA:
      undefined,

    autoLoad:
      Boolean(
        businessID
      ),
  });

  const activeIdentityIsLoading =
  access.isPlatformAdmin
    ? platformSettingsIsLoading
    : businessLogo.isLoading;

  // =====================================================
  // MARK: - Dashboard Modules
  // =====================================================

  const visibilityContext =
    useMemo(
      () => ({
        access,
        configuration,
      }),
      [
        access,
        configuration,
      ]
    );

  const heroShortcuts =
    useMemo(
      () =>
        getDashboardHeroShortcuts(
          visibilityContext
        ).slice(0, 3),
      [
        visibilityContext,
      ]
    );

  const sections =
    useMemo(
      () =>
        SECTION_ORDER
          .map((section) => ({
            section,

            modules:
              getDashboardModulesForSection(
                section,
                visibilityContext
              ),
          }))
          .filter(
            (sectionEntry) =>
              sectionEntry
                .modules
                .length > 0
          ),
      [
        visibilityContext,
      ]
    );

  const sidebarModules =
  useMemo<
    DashboardModuleDefinition[]
  >(
    () => {
      const uniqueModules =
        new Map<
          string,
          DashboardModuleDefinition
        >();

      sections.forEach(
        (sectionEntry) => {
          sectionEntry.modules.forEach(
            (module) => {
              uniqueModules.set(
                module.id,
                module
              );
            }
          );
        }
      );

      return Array.from(
        uniqueModules.values()
      );
    },
    [
      sections,
    ]
  );

const visibleModuleCount =
  sidebarModules.length;

  // =====================================================
  // MARK: - Dashboard Snapshot
  // =====================================================

  const {
    snapshot,
    recentActivity,

    isLoading:
      snapshotIsLoading,

    errorMessage:
      snapshotError,

    refreshedAt,

    refresh:
      refreshSnapshot,
  } = useDashboardSnapshot({
    businessID,

    enabled:
      Boolean(businessID),
  });

  // =====================================================
  // MARK: - Formatters
  // =====================================================

  const numberFormatter =
    useMemo(
      () =>
        new Intl.NumberFormat(
          localeIdentifier
        ),
      [
        localeIdentifier,
      ]
    );

  const currencyFormatter =
    useMemo(
      () =>
        new Intl.NumberFormat(
          localeIdentifier,
          {
            style: "currency",
            currency:
              currencyCode,

            maximumFractionDigits:
              2,
          }
        ),
      [
        currencyCode,
        localeIdentifier,
      ]
    );

  // =====================================================
  // MARK: - Executive Metrics
  // =====================================================

  const metrics =
    useMemo<
      DashboardMetric[]
    >(
      () => [
        {
          id:
            "revenue",

          label:
            "Revenue today",

          value:
            currencyFormatter
              .format(
                snapshot
                  .revenueToday
              ),

          detail:
            snapshotIsLoading
              ? "Updating completed sales…"
              : "Completed sales recorded today",

          trend:
            snapshotIsLoading
              ? "Syncing"
              : "Live",

          icon:
            "chart.line.uptrend.xyaxis",

          tone:
            "revenue",

          route:
            "Sales" as DashboardRoute,
        },

        {
          id:
            "orders",

          label:
            "Open orders",

          value:
            numberFormatter
              .format(
                snapshot
                  .openOrders
              ),

          detail:
            snapshot.openOrders ===
            1
              ? "1 order requires attention"
              : `${numberFormatter.format(
                  snapshot
                    .openOrders
                )} orders require attention`,

          trend:
            "Current",

          icon:
            "cart.fill",

          tone:
            "orders",

          route:
            "Orders" as DashboardRoute,
        },

        {
          id:
            "customers",

          label:
            "Customers",

          value:
            numberFormatter
              .format(
                snapshot
                  .customers
              ),

          detail:
            "Business customer records",

          trend:
            "Total",

          icon:
            "person.2.fill",

          tone:
            "customers",

          route:
            "Customers" as DashboardRoute,
        },

        {
          id:
            "inventory",

          label:
            "Active products",

          value:
            numberFormatter
              .format(
                snapshot
                  .activeProducts
              ),

          detail:
            snapshot
              .lowStockProducts >
            0
              ? `${numberFormatter.format(
                  snapshot
                    .lowStockProducts
                )} low-stock items`
              : "Inventory operating normally",

          trend:
            snapshot
              .lowStockProducts >
            0
              ? "Attention"
              : "Healthy",

          icon:
            "shippingbox.fill",

          tone:
            "inventory",

          route:
            "Inventory" as DashboardRoute,
        },
      ],
      [
        currencyFormatter,
        numberFormatter,
        snapshot,
        snapshotIsLoading,
      ]
    );

  // =====================================================
  // MARK: - Recent Activity
  // =====================================================

  const activities =
    useMemo<
      DashboardActivity[]
    >(
      () => {
        if (
          recentActivity.length >
          0
        ) {
          return recentActivity.map(
            (activity) => ({
              id:
                activity.id,

              title:
                activity.title,

              detail:
                activity.detail,

              timestamp:
                activity.timestamp
                  .toLocaleTimeString(
                    localeIdentifier,
                    {
                      hour:
                        "numeric",

                      minute:
                        "2-digit",
                    }
                  ),

              route:
                activity.route ===
                "/orders"
                  ? (
                      "Orders" as DashboardRoute
                    )
                  : activity.route ===
                      "/customers"
                    ? (
                        "Customers" as DashboardRoute
                      )
                    : activity.route ===
                        "/inventory"
                      ? (
                          "Inventory" as DashboardRoute
                        )
                      : undefined,
            })
          );
        }

        return [
          {
            id:
              "activity-business",

            title:
              "Business workspace ready",

            detail:
              `${companyName} is connected to JCS Business Suite.`,

            timestamp:
              "Now",
          },
        ];
      },
      [
        companyName,
        localeIdentifier,
        recentActivity,
      ]
    );

  // =====================================================
  // MARK: - Sidebar
  // =====================================================

  const sidebarLinks =
  useMemo<
    SidebarLink[]
  >(
    () => [
      {
        id:
          "dashboard",

        title:
          "Dashboard",

        icon:
          Command,
      },

      {
        id:
          "customers",

        title:
          "Customers",

        icon:
          CircleUserRound,

        route:
          "Customers" as DashboardRoute,
      },

      {
        id:
          "appointments",

        title:
          "Appointments",

        icon:
          CalendarDays,

        route:
          "Calendar" as DashboardRoute,
      },

      {
        id:
          "settings",

        title:
          "App Settings",

        icon:
          Settings,

        route:
          "AppSettings" as DashboardRoute,
      },
    ],
    [
      access.isPlatformAdmin,
    ]
  );

  // =====================================================
  // MARK: - Navigation
  // =====================================================

  const openRoute =
  useCallback(
    (
      route?:
        DashboardRoute
    ) => {
      if (!route) {
        return;
      }

      setSidebarOpen(false);
      setProfileMenuOpen(false);

      const routeName =
        String(route);

      if (
        routeName ===
        "AppSettings"
      ) {
        if (
          access.isPlatformAdmin
        ) {
          router.push(
            "/platform-settings"
          );

          return;
        }

        setAppSettingsOpen(
          true
        );

        return;
      }

      router.push(
        routeToPath(route)
      );
    },
    [
      access.isPlatformAdmin,
      router,
    ]
  );

const openModule =
  useCallback(
    (
      module:
        DashboardModuleDefinition
    ) => {
      const moduleID =
        cleanText(
          module.id
        ).toLowerCase();

      const moduleTitle =
        cleanText(
          module.title
        ).toLowerCase();

      const moduleRoute =
        String(
          module.route ?? ""
        ).toLowerCase();

      const opensAppSettings =
        moduleID.includes(
          "settings"
        ) ||
        moduleTitle ===
          "app settings" ||
        moduleRoute ===
          "appsettings" ||
        moduleRoute ===
          "/settings";

      if (
  opensAppSettings
) {
  setSidebarOpen(false);
  setProfileMenuOpen(false);

  if (
    access.isPlatformAdmin
  ) {
    router.push(
      "/platform-settings"
    );

    return;
  }

  setAppSettingsOpen(
    true
  );

  return;
}

      openRoute(
        module.route
      );
    },
    [
  access.isPlatformAdmin,
  openRoute,
  router,
]
  );

  const openDashboard =
  useCallback(() => {
    setSidebarOpen(false);
    setProfileMenuOpen(false);
    setAppSettingsOpen(false);

    router.push(
      "/dashboard"
    );
  }, [
    router,
  ]);
  
  // =====================================================
  // MARK: - Appearance
  // =====================================================

  const toggleAppearance =
    useCallback(() => {
      setIsDarkMode(
        (current) =>
          !current
      );
    }, []);

  // =====================================================
  // MARK: - Sign Out
  // =====================================================

  const handleSignOut =
    useCallback(
      async (): Promise<void> => {
        if (isSigningOut) {
          return;
        }

        try {
          setIsSigningOut(
            true
          );

          await signOut();

          router.replace(
            "/login"
          );
        } catch (
          error: unknown
        ) {
          console.error(
            "Unable to sign out:",
            error
          );
        } finally {
          setIsSigningOut(
            false
          );
        }
      },
      [
        isSigningOut,
        router,
      ]
    );

  // =====================================================
  // MARK: - Executive Summary
  // =====================================================

  const executiveSummary =
    snapshot.lowStockProducts > 0
      ? `${numberFormatter.format(
          snapshot.lowStockProducts
        )} products need inventory attention.`
      : snapshot.openOrders > 0
        ? `${numberFormatter.format(
            snapshot.openOrders
          )} open orders are ready for review.`
        : "Your workspace is configured and operating normally.";

// =====================================================
// MARK: - Official Shell Configuration
// =====================================================

const officialShellConfiguration =
  useDashboardOfficialShell({
    workspaceTitle,

    pathname,

    accentName,
    accentColorCSS,

    appearance:
      isDarkMode
        ? "dark"
        : "light",

    backgroundID:
      activeBackgroundID,

    backgroundDownloadURL:
      activeBackgroundDownloadURL,

    access,

    identity: {
      name:
        activeIdentityName,

      subtitle:
        access.isPlatformAdmin
          ? "Platform Administration"
          : businessModeName,

      tagline:
        activeIdentityTagline,

      logoDownloadURL:
        access.isPlatformAdmin
          ? activeLogoDownloadURL
          : undefined,

      logoNode:
        !access.isPlatformAdmin ? (
          <CompanyLogoView
            branding={
              businessLogo.activeBranding
            }
            logo={
              businessLogo.activeLogo
            }
            businessName={
              activeIdentityName
            }
            accentColor={
              accentColorCSS
            }
            size="custom"
            width={72}
            height={72}
            cornerRadius={0}
            showBackground={false}
            showBorder={false}
            enableShadow={false}
            isLoading={
              activeIdentityIsLoading
            }
            priority
          />
        ) : undefined,

      isLoading:
        activeIdentityIsLoading,

      isPlatform:
        access.isPlatformAdmin,
    },

    user: {
      firebaseUID:
        firebaseUser?.uid ?? "",

      firstName,

      displayName:
        appUser?.fullName ??
        firebaseUser?.displayName ??
        firstName,

      email:
        firebaseUser?.email ??
        undefined,

      role:
        userRole,

      imageURL:
        appUser?.profileImageURL,
    },

    sidebarModules,

    commandModules:
      heroShortcuts,

    visibleModuleCount,

    liveStatus: {
      isLoading:
        snapshotIsLoading,

      errorMessage:
        snapshotError,

      refreshedAt,

      languageCode,

      onRefresh:
        refreshSnapshot,
    },

    isSigningOut,

    settingsOverlay:
      undefined,

    actions: {
      onOpenDashboard:
        openDashboard,

      onOpenRoute:
        openRoute,

      onOpenModule:
        openModule,

      onOpenSettings: () => {
        if (
          access.isPlatformAdmin
        ) {
          router.push(
            "/platform-settings"
          );

          return;
        }

        setAppSettingsOpen(
          true
        );
      },

      onToggleAppearance:
        toggleAppearance,

      onOpenPlatformSettings: () => {
        router.push(
          "/platform-settings"
        );
      },

      onOpenExecutiveCenter: () => {
        router.push(
          "/platform-executive-center"
        );
      },

      onOpenNotifications: () => {
        console.info(
          "Notifications Center will open here."
        );
      },

      onSignOut:
        handleSignOut,

      onUserAvatarUpdated:
        refresh,
    },
  });

   // =====================================================
// MARK: - Loading State
// =====================================================

if (
  isLoading &&
  !access.isPlatformAdmin
) {
  return (
    <div
      className="jcs-dashboard-loading"
      data-accent={accentName}
    >
      <div className="jcs-dashboard-loading__ambient" />

      <div className="jcs-dashboard-loading__orb">
        <Sparkles
          size={29}
          strokeWidth={1.7}
        />
      </div>

      <p className="jcs-eyebrow">
        JCS Business Suite
      </p>

      <h1>
        Preparing your workspace
      </h1>

      <span>
        Connecting your business,
        permissions and live data…
      </span>
    </div>
  );
}

// =====================================================
// MARK: - Empty Business State
// =====================================================

if (
  !businessID &&
  !access.isPlatformAdmin
) {
  const canCreateBusiness =
    access.isBusinessOwner;

  return (
    <div
      className="jcs-dashboard-empty"
      data-accent={accentName}
    >
      <div className="jcs-dashboard-empty__ambient" />

      <div className="jcs-dashboard-empty__card">
        <div className="jcs-dashboard-empty__icon">
          <Building2
            size={31}
            strokeWidth={1.7}
          />
        </div>

        <p className="jcs-eyebrow">
          JCS Business Suite
        </p>

        <h1>
          {canCreateBusiness
            ? "Your business workspace is not connected yet."
            : "Your business access is not connected yet."}
        </h1>

        <p>
          {canCreateBusiness
            ? "Complete the business creation process or refresh your account to reconnect your business context."
            : "Your account exists, but it is not currently connected to a business workspace. Contact the Business Owner or refresh your account."}
        </p>

        <div className="jcs-dashboard-empty__actions">
          {canCreateBusiness ? (
            <button
              type="button"
              className="jcs-button jcs-button--primary"
              onClick={() =>
                router.push(
                  "/create-business"
                )
              }
            >
              Create Business

              <ChevronRight
                size={17}
                strokeWidth={1.8}
              />
            </button>
          ) : null}

          <button
            type="button"
            className={[
              "jcs-button",
              canCreateBusiness
                ? "jcs-button--secondary"
                : "jcs-button--primary",
            ].join(" ")}
            onClick={() => {
              void refresh();
            }}
          >
            Refresh Account
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
  // MARK: - Dashboard View
// =====================================================


  return (
  <>
    <JCSOfficialShell
      {...officialShellConfiguration}
    >

     {/* =================================================
                MARK: - Premium Hero
    ================================================= */}

            <section className="jcs-dashboard-hero">
  <div
    className="jcs-dashboard-hero__glow"
    aria-hidden="true"
  />

  <div
    className="jcs-dashboard-hero__orbit jcs-dashboard-hero__orbit--one"
    aria-hidden="true"
  />

  <div
    className="jcs-dashboard-hero__orbit jcs-dashboard-hero__orbit--two"
    aria-hidden="true"
  />

  {/* =================================================
      MARK: - Main Brand Presentation
  ================================================= */}

  <div className="jcs-dashboard-hero__main">
    <div className="jcs-dashboard-hero__brand-center">
      <div className="jcs-dashboard-hero__logo-stage">
        {access.isPlatformAdmin &&
        activeLogoDownloadURL ? (
          <img
            src={
              activeLogoDownloadURL
            }
            alt={
              activeIdentityName
            }
            className="jcs-dashboard-hero__platform-logo-image"
          />
        ) : (
          <CompanyLogoView
            branding={
              businessLogo.activeBranding
            }
            logo={
              businessLogo.activeLogo
            }
            businessName={
              activeIdentityName
            }
            accentColor={
              accentColorCSS
            }
            size="custom"
            width={680}
            height={310}
            cornerRadius={0}
            showBackground={false}
            showBorder={false}
            enableShadow={false}
            isLoading={
              activeIdentityIsLoading
            }
            priority
          />
        )}
      </div>

      <p className="jcs-dashboard-hero__brand-slogan">
        ONE PLATFORM
        <span aria-hidden="true">
          |
        </span>
        EVERY BUSINESS
        <span aria-hidden="true">
          |
        </span>
        ENDLESS POSSIBILITIES
      </p>
    </div>

    <div className="jcs-dashboard-hero__message">
      <div className="jcs-dashboard-hero__message-icon">
        <Sparkles
          size={19}
          strokeWidth={1.7}
        />
      </div>

      <div>
        <span className="jcs-dashboard-hero__message-label">
          Executive overview
        </span>

        <strong>
          {executiveSummary}
        </strong>

        <span>
          Live information is synchronized
          with the current workspace.
        </span>
      </div>
    </div>
  </div>

  {/* =================================================
      MARK: - Command Center Column
  ================================================= */}

  <aside className="jcs-dashboard-hero__aside">
  <div className="jcs-dashboard-hero__command-heading">
    <p className="jcs-eyebrow">
      {greetingForCurrentHour()}
      {", "}
      {firstName}
      {" "}
      <span aria-hidden="true">
        👋
      </span>
    </p>

    <strong>
      Command Center
    </strong>

    <span>
      for your business
    </span>
  </div>

  <JCSRealtimeClock
    locale={
      localeIdentifier
    }
    timeZone={
      access.isPlatformAdmin
        ? undefined
        : appSettings
            ?.timeZoneIdentifier
    }
    showSeconds
  />

  <JCSWeatherCard
    languageCode={
      languageCode
    }
    autoLoad
    compact
  />

  <div className="jcs-dashboard-hero__active-status">
    <span className="jcs-status-badge">
      <span
        className="jcs-status-badge__dot"
        aria-hidden="true"
      />

      Active
    </span>
  </div>
</aside>

</section>

            {/* =================================================
                MARK: - Executive Metrics
            ================================================= */}

            <section
              className="jcs-metrics-grid"
              aria-label="Business snapshot"
            >
              {metrics.map((metric) => (
                <button
                  key={metric.id}
                  type="button"
                  className="jcs-metric-card"
                  data-tone={metric.tone}
                  onClick={() =>
                    openRoute(metric.route)
                  }
                >
                  <div className="jcs-metric-card__top">
                    <div className="jcs-metric-card__icon">
                      <DashboardIcon
                        name={metric.icon}
                        size={20}
                        strokeWidth={1.8}
                      />
                    </div>

                    {metric.trend && (
                      <span className="jcs-metric-card__trend">
                        {metric.trend}
                      </span>
                    )}
                  </div>

                  <div className="jcs-metric-card__body">
                    <span className="jcs-metric-card__label">
                      {metric.label}
                    </span>

                    <strong>
                      {metric.value}
                    </strong>

                    <p>
                      {metric.detail}
                    </p>
                  </div>

                  <div className="jcs-metric-card__footer">
                    <span>
                      View details
                    </span>

                    <ChevronRight
                      size={16}
                      strokeWidth={1.8}
                    />
                  </div>

                  <span
                    className="jcs-metric-card__ambient"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </section>

            {/* =================================================
                MARK: - Quick Access
            ================================================= */}

{heroShortcuts.length > 0 && (
  <section className="jcs-dashboard-panel jcs-dashboard-panel--quick-access">
    <div className="jcs-module-section__heading jcs-quick-access__heading">
      <div>
        <span
          className="jcs-module-section__accent"
          aria-hidden="true"
        />

        <div>
          <p className="jcs-eyebrow">
            Business workspace
          </p>

          <h2>
            Quick Access
          </h2>

          <p>
            Open the tools most
            relevant to your business
            and role.
          </p>
        </div>
      </div>
    </div>

    <div className="jcs-quick-actions">
      {heroShortcuts.map(
        (module) => (
          <button
            key={module.id}
            type="button"
            className="jcs-quick-action"
            onClick={() =>
              openModule(module)
            }
          >
            <div className="jcs-quick-action__icon">
              <DashboardIcon
                name={module.icon}
                size={22}
                strokeWidth={1.8}
              />
            </div>

            <div className="jcs-quick-action__copy">
              <strong>
                {module.title}
              </strong>

              <span>
                {module.subtitle}
              </span>
            </div>

            <div className="jcs-quick-action__open">
              <ChevronRight
                size={18}
                strokeWidth={1.8}
              />
            </div>
          </button>
        )
      )}

      <button
  type="button"
  className="jcs-quick-action jcs-quick-action--sales-performance"
  onClick={() =>
    openRoute(
      "Sales" as DashboardRoute
    )
  }
>
  <div className="jcs-quick-action__icon">
    <BarChart3
      size={22}
      strokeWidth={1.8}
    />
  </div>

  <div className="jcs-quick-action__copy">
    <strong>
      Sales Performance
    </strong>

    <span>
      Review revenue, trends and business sales results.
    </span>
  </div>

  <div className="jcs-quick-action__open">
    <ChevronRight
      size={18}
      strokeWidth={1.8}
    />
  </div>
 </button>
</div>
</section>
)}


            {/* =================================================
                MARK: - Main Dashboard Columns
            ================================================= */}

            <div className="jcs-dashboard-columns">
                      {/* =================================================
                  MARK: - Business Module Sections
              ================================================= */}

              <div className="jcs-dashboard-sections">
                {sections.map(
                  ({
                    section,
                    modules,
                  }) => (
                    <section
                      key={section}
                      className="jcs-module-section"
                    >
                      <div className="jcs-module-section__heading">
                        <div>
                          <span
                            className="jcs-module-section__accent"
                            aria-hidden="true"
                          />

                          <div>
                            <p className="jcs-eyebrow">
                              Business workspace
                            </p>

                            <h2>
                              {section}
                            </h2>

                            <p>
                              {
                                SECTION_SUBTITLES[
                                  section
                                ]
                              }
                            </p>
                          </div>
                        </div>

                        <span className="jcs-module-section__count">
                          {modules.length}
                          {" "}
                          {modules.length === 1
                            ? "module"
                            : "modules"}
                        </span>
                      </div>

                      <div className="jcs-module-grid">
                       {modules.map(
                         (module) => (
                            <button
                              key={
                                module.id
                              }
                              type="button"
                              className="jcs-module-card"
                              onClick={() =>
                                openModule(
                                  module
                                )
                              }
                            >
                              <div className="jcs-module-card__icon">
                                <DashboardIcon
                                  name={
                                    module.icon
                                  }
                                  size={21}
                                  strokeWidth={
                                    1.8
                                  }
                                />
                              </div>

                              <div className="jcs-module-card__copy">
                                <strong>
                                  {
                                    module.title
                                  }
                                </strong>

                                <span>
                                  {
                                    module.subtitle
                                  }
                                </span>
                              </div>

                              <span className="jcs-module-card__open">
                                <ChevronRight
                                  size={18}
                                  strokeWidth={
                                    1.8
                                  }
                                />
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    </section>
                  )
                )}
              </div>

              {/* =================================================
                  MARK: - Intelligence Column
              ================================================= */}

              <aside className="jcs-dashboard-insights">
                {/* Sofía */}

                <section className="jcs-sofia-card">
                  <div
                    className="jcs-sofia-card__ambient"
                    aria-hidden="true"
                  />

                  <div className="jcs-sofia-card__header">
                    <div className="jcs-sofia-card__icon">
                      <Sparkles
                        size={22}
                        strokeWidth={1.65}
                      />
                    </div>

                    <div>
                      <p className="jcs-eyebrow">
                        JCS Intelligence
                      </p>

                      <h2>
                        Sofía
                      </h2>
                    </div>

                    <span className="jcs-sofia-card__status">
                      Online
                    </span>
                  </div>

                  <div className="jcs-sofia-card__conversation">
                    <p className="jcs-sofia-card__greeting">
                      {greetingForCurrentHour()}
                      {", "}
                      {firstName}.
                    </p>

                    <p className="jcs-sofia-card__body">
                      {executiveSummary}
                      {" "}
                      As your business activity
                      grows, I will surface
                      opportunities, warnings and
                      recommended actions here.
                    </p>
                  </div>

                  <div className="jcs-sofia-card__insight-list">
                    <div>
                      <span
                        className="jcs-sofia-card__insight-dot"
                        aria-hidden="true"
                      />

                      <div>
                        <strong>
                          Workspace connected
                        </strong>

                        <span>
                          Business data and
                          permissions are ready.
                        </span>
                      </div>
                    </div>

                    <div>
                      <span
                        className="jcs-sofia-card__insight-dot"
                        aria-hidden="true"
                      />

                      <div>
                        <strong>
                          Live snapshot active
                        </strong>

                        <span>
                          Metrics are synchronized
                          with Firestore.
                        </span>
                      </div>
                    </div>

                    <div>
                      <span
                        className="jcs-sofia-card__insight-dot"
                        aria-hidden="true"
                      />

                      <div>
                        <strong>
                          Intelligent monitoring
                        </strong>

                        <span>
                          Recommendations will
                          improve as data grows.
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="jcs-sofia-card__action"
                  >
                    <span>
                      Ask Sofía
                    </span>

                    <ChevronRight
                      size={17}
                      strokeWidth={1.8}
                    />
                  </button>
                </section>

              {/* Business Health */}

<section className="jcs-activity-card jcs-business-health-card">
  <div className="jcs-activity-card__heading">
    <div>
      <p className="jcs-eyebrow">
        Workspace
      </p>

      <h2>
        Business Health
      </h2>

      <p>
        Platform readiness, permissions
        and module availability.
      </p>
    </div>

    <strong className="jcs-business-health-card__score">
      98%
    </strong>
  </div>

  <div
    className="jcs-business-health-card__track"
    role="progressbar"
    aria-label="Business health"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={98}
  >
    <div
      className="jcs-business-health-card__progress"
      style={{
        width:
          "98%",
      }}
    />
  </div>

  <div className="jcs-business-health-card__details">
    <div>
      <span
        className="jcs-business-health-card__dot"
        aria-hidden="true"
      />

      <span>
        Workspace connected
      </span>
    </div>

    <div>
      <span
        className="jcs-business-health-card__dot"
        aria-hidden="true"
      />

      <span>
        Permissions configured
      </span>
    </div>

    <div>
      <span
        className="jcs-business-health-card__dot"
        aria-hidden="true"
      />

      <span>
        Modules ready
      </span>
    </div>
  </div>
</section>  

                {/* Recent Activity */}

                <section className="jcs-activity-card">
                  <div className="jcs-activity-card__heading">
                    <div>
                      <p className="jcs-eyebrow">
                        Workspace
                      </p>

                      <h2>
                        Recent activity
                      </h2>

                      <p>
                        Latest events from your
                        business workspace.
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-label="View all recent activity"
                    >
                      View all
                    </button>
                  </div>

                  <div className="jcs-activity-list">
                    {activities.map(
                      (
                        activity,
                        activityIndex
                      ) => (
                        <button
                          key={
                            activity.id
                          }
                          type="button"
                          className="jcs-activity-item"
                          onClick={() =>
                            openRoute(
                              activity.route
                            )
                          }
                        >
                          <span className="jcs-activity-item__timeline">
                            <span className="jcs-activity-item__dot" />

                            {activityIndex <
                              activities.length -
                                1 && (
                              <span className="jcs-activity-item__line" />
                            )}
                          </span>

                          <span className="jcs-activity-item__copy">
                            <strong>
                              {
                                activity.title
                              }
                            </strong>

                            <small>
                              {
                                activity.detail
                              }
                            </small>
                          </span>

                          <time>
                            {
                              activity.timestamp
                            }
                          </time>
                        </button>
                      )
                    )}
                  </div>
                </section>

                {/* Business Access */}

<section className="jcs-activity-card jcs-business-access-card">
  <div className="jcs-activity-card__heading">
    <div>
      <p className="jcs-eyebrow">
        Workspace
      </p>

      <h2>
        Business Access
      </h2>

      <p>
        Current business context, role,
        modules and appearance.
      </p>
    </div>

    <span className="jcs-business-access-card__icon">
      <ShieldCheck
        size={20}
        strokeWidth={1.7}
      />
    </span>
  </div>

  <dl className="jcs-business-access-card__list">
    <div>
      <dt>
        Business mode
      </dt>

      <dd>
        {businessModeName}
      </dd>
    </div>

    <div>
      <dt>
        Current role
      </dt>

      <dd>
        {userRole}
      </dd>
    </div>

    <div>
      <dt>
        Available modules
      </dt>

      <dd>
        {visibleModuleCount}
      </dd>
    </div>

    <div>
      <dt>
        Accent color
      </dt>

      <dd className="jcs-business-access-card__accent-value">
        <span
          className="jcs-business-access-card__accent-dot"
          aria-hidden="true"
        />

        {accentName}
      </dd>
    </div>
  </dl>

  <button
  type="button"
  className="jcs-business-access-card__action"
  onClick={() => {
    if (
      access.isPlatformAdmin
    ) {
      router.push(
        "/platform-settings",
      );

      return;
    }

    setAppSettingsOpen(
      true,
    );
  }}
>
  {access.isPlatformAdmin
    ? "Manage platform appearance"
    : "Manage business access"}

  <ChevronRight
    size={17}
    strokeWidth={1.8}
  />
</button>
</section>
              </aside>
            </div>

            {/* =================================================
                MARK: - Dashboard Footer
            ================================================= */}

            <footer className="jcs-dashboard-footer">
              <div>
                <strong>
                  JCS Business Suite
                </strong>

                <span>
                  One platform. Every
                  business. Endless
                  possibilities.
                </span>
              </div>

              <div className="jcs-dashboard-footer__context">
                <span>
                  Business ID
                </span>

                <strong>
                  {businessID ||
                    "Platform"}
                </strong>
              </div>
            </footer>

      </JCSOfficialShell>

      {/* =====================================================
          MARK: - App Settings
      ===================================================== */}

      {appSettingsOpen &&
      !access.isPlatformAdmin ? (
        <div
          className="jcs-app-settings-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="App Settings"
        >
          <div
            className="jcs-app-settings-overlay__backdrop"
            aria-hidden="true"
            onClick={() =>
              setAppSettingsOpen(
                false
              )
            }
          />

          <div className="jcs-app-settings-overlay__content">
            <AppSettingsView
              businessID={
                businessID
              }
              ownerUID={
                currentOwnerUID
              }
              currentUserUID={
                currentUserUID
              }
              actor={
                appSettingsActor
              }
              initialCompanyName={
                companyName
              }
              initialAccentColorName={
                (
                  activeAccentColorName ||
                  "blue"
                ) as AppAccentColorName
              }
              industry={
                businessModeName
              }
              businessCategory={
                cleanText(
                  business
                    ?.industryCategoryTitle
                ) ||
                businessModeName
              }
              tagline={
                readStringProperty(
                  business,
                  "tagline"
                )
              }
              businessDNA={
                undefined
              }
              hasPremiumBrandingAccess={
                hasPremiumBrandingAccess
              }
              onAccentColorChange={(
                accentColorName
              ) => {
                setActiveAccentColor(
                  accentColorName
                );
              }}
              onLanguageChange={() => {
                // Language changes are persisted
                // without rebuilding the Dashboard.
              }}
              onClose={() => {
                setAppSettingsOpen(
                  false
                );

                void refresh();

                void businessLogo
                  .reloadActiveLogo();
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}