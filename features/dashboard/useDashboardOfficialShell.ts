import {
  CalendarDays,
  CircleUserRound,
  Command,
  Settings,
  Sparkles,
} from "lucide-react";

import {
  useMemo,
  type ReactNode,
} from "react";

import type {
  JCSOfficialShellProps,
  JCSShellAppearance,
  JCSShellIdentity,
  JCSShellLiveStatus,
  JCSShellUser,
} from "@/components/app-shell/JCSShellTypes";

import type {
  DashboardAccess,
} from "./DashboardAccess";

import type {
  DashboardModuleDefinition,
} from "./DashboardModuleRegistry";

import type {
  DashboardRoute,
} from "./DashboardTypes";

/*
 * JCS Business Suite Web
 * useDashboardOfficialShell.ts
 *
 * Adapter between the Dashboard domain and the reusable
 * JCS Official Workspace Shell.
 *
 * Responsibilities:
 *
 * - Build official Sidebar navigation.
 * - Build module navigation.
 * - Build Command Palette items.
 * - Connect Dashboard actions to the Shell.
 * - Preserve Platform Admin and Business access behavior.
 *
 * This hook must not render the Dashboard Hero, metrics,
 * cards, business sections or intelligence panels.
 */

// =======================================================
// MARK: - Types
// =======================================================

export interface DashboardOfficialShellActions {
  onOpenDashboard:
    () => void;

  onOpenRoute:
    (
      route:
        DashboardRoute
    ) => void;

  onOpenModule:
    (
      module:
        DashboardModuleDefinition
    ) => void;

  onOpenSettings:
    () => void;

  onToggleAppearance:
    () => void;

  onOpenPlatformSettings:
    () => void;

  onOpenExecutiveCenter:
    () => void;

  onOpenNotifications?:
    () => void;

  onSignOut:
    () => void | Promise<void>;

  onUserAvatarUpdated:
    () => void | Promise<void>;
}

export interface UseDashboardOfficialShellInput {
  workspaceTitle:
    string;

  pathname:
    string;

  accentName:
    string;

  accentColorCSS:
    string;

  appearance:
    JCSShellAppearance;

  access:
    DashboardAccess;

  identity:
    JCSShellIdentity;

  user:
    JCSShellUser;

  sidebarModules:
    readonly DashboardModuleDefinition[];

  commandModules:
    readonly DashboardModuleDefinition[];

  visibleModuleCount:
    number;

  liveStatus?:
    JCSShellLiveStatus;

  isSigningOut:
    boolean;

  settingsOverlay?:
    ReactNode;

  actions:
    DashboardOfficialShellActions;
}

export type DashboardOfficialShellConfiguration =
  Omit<
    JCSOfficialShellProps,
    "children"
  >;

// =======================================================
// MARK: - Path Helpers
// =======================================================

function normalizePath(
  pathname:
    string
): string {
  const normalized =
    pathname
      .trim()
      .toLowerCase();

  if (!normalized) {
    return "/";
  }

  if (
    normalized.length >
      1 &&
    normalized.endsWith("/")
  ) {
    return normalized.slice(
      0,
      -1
    );
  }

  return normalized;
}

function pathIsActive(
  pathname:
    string,
  expectedPath:
    string
): boolean {
  const current =
    normalizePath(
      pathname
    );

  const expected =
    normalizePath(
      expectedPath
    );

  return (
    current === expected ||
    current.startsWith(
      `${expected}/`
    )
  );
}

// =======================================================
// MARK: - Official Shell Adapter
// =======================================================

export function useDashboardOfficialShell({
  workspaceTitle,

  pathname,

  accentName,
  accentColorCSS,
  appearance,

  access,
  identity,
  user,

  sidebarModules,
  commandModules,

  visibleModuleCount,

  liveStatus,

  isSigningOut,

  settingsOverlay,

  actions,
}: UseDashboardOfficialShellInput): DashboardOfficialShellConfiguration {
  // =====================================================
  // MARK: - Primary Navigation
  // =====================================================

  const navigationItems =
    useMemo(
      () => [
        {
          id:
            "dashboard",

          title:
            "Dashboard",

          path:
            "/dashboard",

          icon:
            Command,

          isActive:
            pathIsActive(
              pathname,
              "/dashboard"
            ),

          onSelect:
            actions
              .onOpenDashboard,
        },

        {
          id:
            "customers",

          title:
            "Customers",

          path:
            "/customers",

          icon:
            CircleUserRound,

          isActive:
            pathIsActive(
              pathname,
              "/customers"
            ),

          onSelect: () =>
            actions.onOpenRoute(
              "Customers" as DashboardRoute
            ),
        },

        {
          id:
            "appointments",

          title:
            "Appointments",

          path:
            "/appointments",

          icon:
            CalendarDays,

          isActive:
            pathIsActive(
              pathname,
              "/appointments"
            ),

          onSelect: () =>
            actions.onOpenRoute(
              "Calendar" as DashboardRoute
            ),
        },

        {
          id:
            "app-settings",

          title:
            "App Settings",

          path:
            "/settings",

          icon:
            Settings,

          isActive:
            pathIsActive(
              pathname,
              "/settings"
            ),

          onSelect:
            actions
              .onOpenSettings,
        },

        ...(access
          .isPlatformAdmin
          ? [
              {
                id:
                  "platform-settings",

                title:
                  "Platform Settings",

                path:
                  "/platform-settings",

                icon:
                  Sparkles,

                isActive:
                  pathIsActive(
                    pathname,
                    "/platform-settings"
                  ),

                onSelect:
                  actions
                    .onOpenPlatformSettings,
              },

              {
                id:
                  "executive-center",

                title:
                  "Executive Center",

                path:
                  "/platform-executive-center",

                icon:
                  Sparkles,

                isActive:
                  pathIsActive(
                    pathname,
                    "/platform-executive-center"
                  ) ||
                  pathIsActive(
                    pathname,
                    "/platform/executive-center"
                  ),

                isExecutive:
                  true,

                onSelect:
                  actions
                    .onOpenExecutiveCenter,
              },
            ]
          : []),
      ],
      [
        access
          .isPlatformAdmin,

        actions,
        pathname,
      ]
    );

  // =====================================================
  // MARK: - Module Navigation
  // =====================================================

  const moduleItems =
    useMemo(
      () =>
        sidebarModules.map(
          (module) => ({
            id:
              module.id,

            title:
              module.title,

            subtitle:
              module.subtitle,

            iconName:
              module.icon,

            path:
              module.route
                ? String(
                    module.route
                  )
                : undefined,

            isActive:
              false,

            onSelect: () =>
              actions.onOpenModule(
                module
              ),
          })
        ),
      [
        actions,
        sidebarModules,
      ]
    );

  // =====================================================
  // MARK: - Command Palette
  // =====================================================

  const commandItems =
    useMemo(
      () =>
        commandModules.map(
          (module) => ({
            id:
              module.id,

            title:
              module.title,

            subtitle:
              module.subtitle,

            iconName:
              module.icon,

            onSelect: () =>
              actions.onOpenModule(
                module
              ),
          })
        ),
      [
        actions,
        commandModules,
      ]
    );

  // =====================================================
  // MARK: - Shell Configuration
  // =====================================================

  return useMemo(
    () => ({
      workspaceTitle,

      accentName,
      accentColorCSS,
      appearance,

      identity,
      user,

      navigationItems,
      moduleItems,

      commandPalette: {
        items:
          commandItems,

        title:
          "Suggested modules",

        subtitle:
          "Command Center",

        emptyTitle:
          "No matching modules",

        emptyMessage:
          "Try another module or action name.",
      },

      actions: {
        onOpenDashboard:
          actions
            .onOpenDashboard,

        onOpenAccount: () =>
          actions.onOpenRoute(
            "Account" as DashboardRoute
          ),

        onOpenSettings:
          actions
            .onOpenSettings,

        onToggleAppearance:
          actions
            .onToggleAppearance,

        onOpenExecutiveCenter:
          access
            .isPlatformAdmin
            ? actions
                .onOpenExecutiveCenter
            : undefined,

        onOpenNotifications:
          actions
            .onOpenNotifications,

        onSignOut:
          actions
            .onSignOut,

        onUserAvatarUpdated:
          actions
            .onUserAvatarUpdated,
      },

      liveStatus,

      visibleModuleCount,

      isSigningOut,

      settingsOverlay,
    }),
    [
      access
        .isPlatformAdmin,

      accentColorCSS,
      accentName,
      actions,
      appearance,
      commandItems,
      identity,
      isSigningOut,
      liveStatus,
      moduleItems,
      navigationItems,
      settingsOverlay,
      user,
      visibleModuleCount,
      workspaceTitle,
    ]
  );
}

export default useDashboardOfficialShell;