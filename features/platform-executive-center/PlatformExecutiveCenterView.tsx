"use client";

/*
 * JCS Business Suite
 * PlatformExecutiveCenterView.tsx
 *
 * Premium Platform Administration workspace.
 *
 * Responsibilities:
 *
 * - Display platform-level metrics.
 * - Display and search Business Owners.
 * - Display subscription, billing and onboarding status.
 * - Open administrative actions.
 * - Restrict access to Platform Administrators.
 *
 * Firestore reads and mutations do not belong in this file.
 */

  import {
  useCallback,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

import {
  Activity,
  Archive,
  ArrowLeft,
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CircleUserRound,
  Command,
  CreditCard,
  FileBarChart,
  Filter,
  Gauge,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MailPlus,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  useBusinessContext,
} from "@/core/business-context/JCSBusinessContext";

import {
  signOut,
} from "@/core/services/AuthService";

import {
  usePlatformExecutiveCenter,
} from "./usePlatformExecutiveCenter";

import type {
  PlatformClientFilter,
  PlatformClientViewModel,
  PlatformExecutiveAttentionItem,
} from "./PlatformExecutiveTypes";

import "./PlatformExecutiveCenterView.css";

// ============================================================
// MARK: - Local Types
// ============================================================

type ExecutiveSection =
  | "dashboard"
  | "clients"
  | "invitations"
  | "subscriptions"
  | "billing"
  | "analytics"
  | "reports"
  | "settings";

interface ExecutiveNavigationItem {
  id: ExecutiveSection;

  title: string;
  subtitle: string;

  icon: ComponentType<{
    size?: number;
    strokeWidth?: number;
  }>;

  badge?: number;
}

interface ExecutiveMetricCard {
  id: string;

  title: string;
  value: string;
  message: string;

  icon: ComponentType<{
    size?: number;
    strokeWidth?: number;
  }>;

  tone:
    | "blue"
    | "green"
    | "orange"
    | "purple";
}

interface ExecutiveMessage {
  tone:
    | "success"
    | "error"
    | "information";

  title: string;
  message: string;
}

// ============================================================
// MARK: - Helpers
// ============================================================

function cleanText(
  value:
    | string
    | null
    | undefined
): string {
  return value?.trim() ?? "";
}

function firstNameFromValue(
  value:
    | string
    | null
    | undefined
): string {
  const normalized =
    cleanText(value);

  if (!normalized) {
    return "Administrator";
  }

  return (
    normalized.split(/\s+/)[0] ??
    normalized
  );
}

function normalizedAccentName(
  value:
    | string
    | null
    | undefined
): string {
  return (
    cleanText(value)
      .toLowerCase()
      .replace(/\s+/g, "-") ||
    "copper"
  );
}

function currencyFormatter(
  currencyCode: string,
  localeIdentifier: string
): Intl.NumberFormat {
  return new Intl.NumberFormat(
    localeIdentifier,
    {
      style: "currency",
      currency:
        currencyCode,
      maximumFractionDigits:
        2,
    }
  );
}

function percentFormatter(
  localeIdentifier: string
): Intl.NumberFormat {
  return new Intl.NumberFormat(
    localeIdentifier,
    {
      style: "percent",
      maximumFractionDigits:
        0,
    }
  );
}

function dateTimeFormatter(
  localeIdentifier: string
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(
    localeIdentifier,
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function businessInitials(
  businessName: string
): string {
  const initials =
    businessName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (word) =>
          word.charAt(0)
      )
      .join("")
      .toUpperCase();

  return initials || "JC";
}

function clientStatusLabel(
  client:
    PlatformClientViewModel
): string {
  if (
    client.isPendingDeletion
  ) {
    return "Deletion Pending";
  }

  if (client.isArchived) {
    return "Archived";
  }

  if (client.isTrialExpired) {
    return "Trial Expired";
  }

  if (!client.isActive) {
    return "Inactive";
  }

  if (!client.canAccessApp) {
    return "Restricted";
  }

  if (
    !client.isOwnerRegistered
  ) {
    return "Owner Pending";
  }

  if (
    !client.isOnboardingComplete
  ) {
    return "Onboarding";
  }

  return "Active";
}

function clientStatusTone(
  client:
    PlatformClientViewModel
):
  | "success"
  | "warning"
  | "danger"
  | "neutral" {
  if (
    client.isPendingDeletion ||
    client.isTrialExpired
  ) {
    return "danger";
  }

  if (
    !client.isActive ||
    !client.canAccessApp ||
    !client.isOwnerRegistered ||
    !client.isOnboardingComplete
  ) {
    return "warning";
  }

  if (client.isArchived) {
    return "neutral";
  }

  return "success";
}

// ============================================================
// MARK: - Component
// ============================================================

export default function PlatformExecutiveCenterView() {
  const router =
    useRouter();

  const {
    firebaseUser,
    appUser,
    appSettings,
    isLoading:
      businessContextIsLoading,
  } = useBusinessContext();

  const isPlatformAdministrator =
    Boolean(
      appUser
        ?.isPlatformAdministrator
    );

  const administratorName =
    cleanText(
      appUser?.fullName
    ) ||
    cleanText(
      firebaseUser?.displayName
    ) ||
    "Platform Administrator";

  const administratorFirstName =
    firstNameFromValue(
      administratorName
    );

  const administratorEmail =
    cleanText(
      appUser?.email
    ) ||
    cleanText(
      firebaseUser?.email
    );

  const accentName =
    normalizedAccentName(
      appSettings
        ?.accentColorName
    );

  const localeIdentifier =
    cleanText(
      appSettings
        ?.localeIdentifier
    ) ||
    "en-US";

  const currencyCode =
    cleanText(
      appSettings
        ?.currencyCode
    ).toUpperCase() ||
    "USD";

  const {
    clients,
    filteredClients,
    invitations,
    attentionItems,
    metrics,

    searchText,
    setSearchText,

    clientFilter,
    setClientFilter,

    selectedClient,
    selectClient,
    closeSelectedClient,

    isLoading,
    isRefreshing,
    errorMessage,
    lastRefreshedAt,

    refresh,

    activateClient,
    deactivateClient,

    archiveClient,
    restoreClient,

    requestDeletion,
    cancelDeletion,

    enableOwnerAccess,
    disableOwnerAccess,
  } = usePlatformExecutiveCenter({
    enabled:
      isPlatformAdministrator,

    actor: {
      firebaseUID:
        firebaseUser?.uid ?? "",

      isPlatformAdministrator,

      displayName:
        administratorName,

      email:
        administratorEmail,
    },
  });

  // ==========================================================
  // MARK: - Presentation State
  // ==========================================================

  const [
    selectedSection,
    setSelectedSection,
  ] = useState<ExecutiveSection>(
    "dashboard"
  );

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  const [
    profileMenuOpen,
    setProfileMenuOpen,
  ] = useState(false);

  const [
    commandPaletteOpen,
    setCommandPaletteOpen,
  ] = useState(false);

  const [
    isSigningOut,
    setIsSigningOut,
  ] = useState(false);

  const [
    actionMessage,
    setActionMessage,
  ] = useState<
    ExecutiveMessage | null
  >(null);

  // ==========================================================
  // MARK: - Formatters
  // ==========================================================

  const moneyFormatter =
    useMemo(
      () =>
        currencyFormatter(
          currencyCode,
          localeIdentifier
        ),
      [
        currencyCode,
        localeIdentifier,
      ]
    );

  const percentageFormatter =
    useMemo(
      () =>
        percentFormatter(
          localeIdentifier
        ),
      [
        localeIdentifier,
      ]
    );

  const platformDateFormatter =
    useMemo(
      () =>
        dateTimeFormatter(
          localeIdentifier
        ),
      [
        localeIdentifier,
      ]
    );

  // ==========================================================
  // MARK: - Navigation
  // ==========================================================

  const navigationItems =
    useMemo<
      ExecutiveNavigationItem[]
    >(
      () => [
        {
          id:
            "dashboard",

          title:
            "Executive Dashboard",

          subtitle:
            "Platform overview",

          icon:
            LayoutDashboard,
        },

        {
          id:
            "clients",

          title:
            "Business Owners",

          subtitle:
            "Companies and owners",

          icon:
            Building2,

          badge:
            metrics
              .totalBusinesses,
        },

        {
          id:
            "invitations",

          title:
            "Invitations",

          subtitle:
            "Owner registration",

          icon:
            MailPlus,

          badge:
            metrics
              .pendingOwnerInvitations,
        },

        {
          id:
            "subscriptions",

          title:
            "Subscriptions",

          subtitle:
            "Plans and trials",

          icon:
            CreditCard,

          badge:
            metrics.activeTrials,
        },

        {
          id:
            "billing",

          title:
            "Billing",

          subtitle:
            "Revenue and payments",

          icon:
            CircleDollarSign,
        },

        {
          id:
            "analytics",

          title:
            "Analytics",

          subtitle:
            "Platform performance",

          icon:
            BarChart3,
        },

        {
          id:
            "reports",

          title:
            "Reports",

          subtitle:
            "Administrative exports",

          icon:
            FileBarChart,
        },

        {
          id:
            "settings",

          title:
            "Platform Settings",

          subtitle:
            "Executive controls",

          icon:
            Settings,
        },
      ],
      [
        metrics.activeTrials,
        metrics
          .pendingOwnerInvitations,
        metrics.totalBusinesses,
      ]
    );

  const selectedNavigationItem =
    useMemo(
      () =>
        navigationItems.find(
          (item) =>
            item.id ===
            selectedSection
        ) ??
        navigationItems[0],
      [
        navigationItems,
        selectedSection,
      ]
    );

  const openSection =
    useCallback(
      (
        section:
          ExecutiveSection
      ) => {
        setSelectedSection(
          section
        );

        setSidebarOpen(
          false
        );

        setProfileMenuOpen(
          false
        );

        setCommandPaletteOpen(
          false
        );

        closeSelectedClient();
      },
      [
        closeSelectedClient,
      ]
    );

  const handleBackToDashboard =
    useCallback(() => {
      router.push(
        "/dashboard"
      );
    }, [
      router,
    ]);

  const handleCreateBusiness =
    useCallback(() => {
      router.push(
        "/create-business"
      );
    }, [
      router,
    ]);

  // ==========================================================
  // MARK: - Actions
  // ==========================================================

  const showSuccess =
    useCallback(
      (
        title: string,
        message: string
      ) => {
        setActionMessage({
          tone:
            "success",

          title,
          message,
        });
      },
      []
    );

  const showError =
    useCallback(
      (
        title: string,
        message: string
      ) => {
        setActionMessage({
          tone:
            "error",

          title,
          message,
        });
      },
      []
    );

  const executeClientAction =
    useCallback(
      async (
        action:
          () => Promise<void>,
        successTitle: string,
        successMessage: string
      ) => {
        setActionMessage(
          null
        );

        try {
          await action();

          showSuccess(
            successTitle,
            successMessage
          );
        } catch (
          error: unknown
        ) {
          showError(
            "Unable to Complete Action",
            error instanceof Error
              ? error.message
              : "The platform action could not be completed."
          );
        }
      },
      [
        showError,
        showSuccess,
      ]
    );

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
          showError(
            "Unable to Sign Out",
            error instanceof Error
              ? error.message
              : "Please try again."
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
        showError,
      ]
    );

  // ==========================================================
  // MARK: - Metric Cards
  // ==========================================================

  const executiveMetrics =
    useMemo<
      ExecutiveMetricCard[]
    >(
      () => [
        {
          id:
            "businesses",

          title:
            "Business Owners",

          value:
            metrics
              .totalBusinesses
              .toLocaleString(
                localeIdentifier
              ),

          message:
            `${metrics.activeBusinesses.toLocaleString(
              localeIdentifier
            )} active businesses`,

          icon:
            Building2,

          tone:
            "blue",
        },

        {
          id:
            "revenue",

          title:
            "Monthly Revenue",

          value:
            moneyFormatter.format(
              metrics.monthlyRevenue
            ),

          message:
            `${metrics.payingBusinesses.toLocaleString(
              localeIdentifier
            )} paying businesses`,

          icon:
            CircleDollarSign,

          tone:
            "green",
        },

        {
          id:
            "trials",

          title:
            "Active Trials",

          value:
            metrics
              .activeTrials
              .toLocaleString(
                localeIdentifier
              ),

          message:
            `${metrics.expiredTrials.toLocaleString(
              localeIdentifier
            )} expired trials`,

          icon:
            CalendarClock,

          tone:
            "orange",
        },

        {
          id:
            "access",

          title:
            "Platform Access",

          value:
            percentageFormatter.format(
              metrics
                .accessPercentage
            ),

          message:
            `${metrics.accessEnabledCount.toLocaleString(
              localeIdentifier
            )} businesses enabled`,

          icon:
            LockKeyhole,

          tone:
            "purple",
        },
      ],
      [
        localeIdentifier,
        metrics,
        moneyFormatter,
        percentageFormatter,
      ]
    );

  // ==========================================================
  // MARK: - Guarded States
  // ==========================================================

  if (
    businessContextIsLoading
  ) {
    return (
      <ExecutiveLoadingState
        accentName={
          accentName
        }
      />
    );
  }

  if (
    !isPlatformAdministrator
  ) {
    return (
      <ExecutiveAccessDenied
        accentName={
          accentName
        }
        onBack={
          handleBackToDashboard
        }
        onSignOut={() => {
          void handleSignOut();
        }}
      />
    );
  }

  // ==========================================================
  // MARK: - View
  // ==========================================================

  return (
    <div
      className="jcs-executive-shell"
      data-accent={
        accentName
      }
    >
      {/* Mobile Backdrop */}

      {sidebarOpen && (
        <button
          type="button"
          className="jcs-executive-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* Sidebar */}

      <aside
        className={[
          "jcs-executive-sidebar",

          sidebarOpen
            ? "jcs-executive-sidebar--open"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="jcs-executive-sidebar__top">
          <button
            type="button"
            className="jcs-executive-sidebar__close"
            aria-label="Close navigation"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            <X
              size={20}
              strokeWidth={1.8}
            />
          </button>

          <button
            type="button"
            className="jcs-executive-brand"
            onClick={() =>
              openSection(
                "dashboard"
              )
            }
          >
            <span className="jcs-executive-brand__mark">
              <ShieldCheck
                size={22}
                strokeWidth={1.8}
              />
            </span>

            <span className="jcs-executive-brand__copy">
              <strong>
                JCS Platform
              </strong>

              <small>
                Executive Center
              </small>
            </span>
          </button>
        </div>

        <div className="jcs-executive-sidebar__administrator">
          <span className="jcs-executive-avatar">
            {administratorFirstName
              .charAt(0)
              .toUpperCase()}
          </span>

          <span>
            <strong>
              {administratorName}
            </strong>

            <small>
              Platform Administrator
            </small>
          </span>

          <span
            className="jcs-executive-sidebar__administrator-status"
            aria-label="Administrator connected"
          />
        </div>

        <nav
          className="jcs-executive-sidebar__navigation"
          aria-label="Platform Executive Center navigation"
        >
          <p className="jcs-executive-sidebar__label">
            Platform Administration
          </p>

          {navigationItems.map(
            (item) => {
              const Icon =
                item.icon;

              const isSelected =
                item.id ===
                selectedSection;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={[
                    "jcs-executive-sidebar__link",

                    isSelected
                      ? "jcs-executive-sidebar__link--active"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-current={
                    isSelected
                      ? "page"
                      : undefined
                  }
                  onClick={() =>
                    openSection(
                      item.id
                    )
                  }
                >
                  <span className="jcs-executive-sidebar__link-icon">
                    <Icon
                      size={19}
                      strokeWidth={1.8}
                    />
                  </span>

                  <span className="jcs-executive-sidebar__link-copy">
                    <strong>
                      {item.title}
                    </strong>

                    <small>
                      {item.subtitle}
                    </small>
                  </span>

                  {typeof item.badge ===
                    "number" &&
                    item.badge > 0 && (
                      <span className="jcs-executive-sidebar__badge">
                        {item.badge}
                      </span>
                    )}
                </button>
              );
            }
          )}
        </nav>

        <div className="jcs-executive-sidebar__footer">
          <div className="jcs-executive-platform-health">
            <span className="jcs-executive-platform-health__icon">
              <CheckCircle2
                size={17}
                strokeWidth={1.9}
              />
            </span>

            <span>
              <strong>
                Platform operational
              </strong>

              <small>
                Firestore monitoring active
              </small>
            </span>
          </div>

          <button
            type="button"
            className="jcs-executive-sidebar__dashboard-button"
            onClick={
              handleBackToDashboard
            }
          >
            <ArrowLeft
              size={18}
              strokeWidth={1.8}
            />

            Back to Dashboard
          </button>

          <button
            type="button"
            className="jcs-executive-sidebar__sign-out"
            disabled={
              isSigningOut
            }
            onClick={() => {
              void handleSignOut();
            }}
          >
            <LogOut
              size={18}
              strokeWidth={1.8}
            />

            {isSigningOut
              ? "Signing out…"
              : "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Main Workspace */}

      <main className="jcs-executive-main">
        {/* Toolbar */}

        <header className="jcs-executive-toolbar">
          <div className="jcs-executive-toolbar__leading">
            <button
              type="button"
              className="jcs-executive-icon-button jcs-executive-toolbar__menu"
              aria-label="Open navigation"
              onClick={() =>
                setSidebarOpen(true)
              }
            >
              <Menu
                size={21}
                strokeWidth={1.8}
              />
            </button>

            <div className="jcs-executive-toolbar__title">
              <span>
                Platform
              </span>

              <strong>
                {
                  selectedNavigationItem
                    ?.title
                }
              </strong>
            </div>
          </div>

          <div className="jcs-executive-toolbar__actions">
            <div
              className="jcs-executive-live-status"
              data-status={
                errorMessage
                  ? "error"
                  : isRefreshing
                    ? "syncing"
                    : "connected"
              }
            >
              <span className="jcs-executive-live-status__dot" />

              <span>
                <strong>
                  {errorMessage
                    ? "Connection issue"
                    : isRefreshing
                      ? "Synchronizing"
                      : "Live platform data"}
                </strong>

                <small>
                  {lastRefreshedAt
                    ? `Updated ${platformDateFormatter.format(
                        lastRefreshedAt
                      )}`
                    : "Waiting for Firestore"}
                </small>
              </span>

              <button
                type="button"
                aria-label="Refresh platform data"
                disabled={
                  isRefreshing
                }
                onClick={() => {
                  void refresh();
                }}
              >
                <RefreshCw
                  className={
                    isRefreshing
                      ? "jcs-executive-rotating"
                      : undefined
                  }
                  size={16}
                  strokeWidth={1.8}
                />
              </button>
            </div>

            <button
              type="button"
              className="jcs-executive-toolbar__search"
              onClick={() =>
                setCommandPaletteOpen(
                  true
                )
              }
            >
              <Search
                size={18}
                strokeWidth={1.8}
              />

              <span>
                Search businesses and actions
              </span>

              <kbd>
                ⌘ K
              </kbd>
            </button>

            <button
              type="button"
              className="jcs-executive-icon-button"
              aria-label="Notifications"
              onClick={() =>
                openSection(
                  "clients"
                )
              }
            >
              <Bell
                size={19}
                strokeWidth={1.8}
              />

              {attentionItems.length >
                0 && (
                <span className="jcs-executive-notification-dot" />
              )}
            </button>

            <div className="jcs-executive-profile-menu">
              <button
                type="button"
                className="jcs-executive-profile-button"
                aria-expanded={
                  profileMenuOpen
                }
                onClick={() =>
                  setProfileMenuOpen(
                    (current) =>
                      !current
                  )
                }
              >
                <span className="jcs-executive-avatar">
                  {administratorFirstName
                    .charAt(0)
                    .toUpperCase()}
                </span>

                <span className="jcs-executive-profile-button__copy">
                  <strong>
                    {administratorFirstName}
                  </strong>

                  <small>
                    Platform Admin
                  </small>
                </span>
              </button>

              {profileMenuOpen && (
                <div className="jcs-executive-profile-popover">
                  <div className="jcs-executive-profile-popover__identity">
                    <span className="jcs-executive-avatar">
                      {administratorFirstName
                        .charAt(0)
                        .toUpperCase()}
                    </span>

                    <span>
                      <strong>
                        {administratorName}
                      </strong>

                      <small>
                        {administratorEmail ||
                          "Platform Administrator"}
                      </small>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openSection(
                        "settings"
                      )
                    }
                  >
                    <Settings
                      size={17}
                      strokeWidth={1.8}
                    />

                    Platform Settings
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleBackToDashboard
                    }
                  >
                    <ArrowLeft
                      size={17}
                      strokeWidth={1.8}
                    />

                    Back to Dashboard
                  </button>

                  <button
                    type="button"
                    className="jcs-executive-profile-popover__danger"
                    disabled={
                      isSigningOut
                    }
                    onClick={() => {
                      void handleSignOut();
                    }}
                  >
                    <LogOut
                      size={17}
                      strokeWidth={1.8}
                    />

                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scroll Area */}

        <div className="jcs-executive-scroll">
          <div className="jcs-executive-content">
            {actionMessage && (
              <ExecutiveActionMessage
                message={
                  actionMessage
                }
                onClose={() =>
                  setActionMessage(
                    null
                  )
                }
              />
            )}

            {errorMessage && (
              <ExecutiveActionMessage
                message={{
                  tone:
                    "error",

                  title:
                    "Platform Data Error",

                  message:
                    errorMessage,
                }}
                onClose={() => {
                  // Error belongs to hook state.
                }}
              />
            )}

            {selectedSection ===
              "dashboard" && (
              <>
                <ExecutiveHero
                  administratorFirstName={
                    administratorFirstName
                  }
                  metrics={
                    metrics
                  }
                  attentionItems={
                    attentionItems
                  }
                  onCreateBusiness={
                    handleCreateBusiness
                  }
                  onOpenClients={() =>
                    openSection(
                      "clients"
                    )
                  }
                  onOpenInvitations={() =>
                    openSection(
                      "invitations"
                    )
                  }
                  onOpenReports={() =>
                    openSection(
                      "reports"
                    )
                  }
                />

                <ExecutiveMetricsGrid
                  metrics={
                    executiveMetrics
                  }
                />

                <ExecutiveSofiaBar
                  attentionItems={
                    attentionItems
                  }
                  onOpenAttention={() =>
                    openSection(
                      "clients"
                    )
                  }
                  onOpenAnalytics={() =>
                    openSection(
                      "analytics"
                    )
                  }
                />

                <div className="jcs-executive-dashboard-grid">
                  <ExecutiveBusinessOwnersPanel
                    title="Recent Business Owners"
                    subtitle="Platform clients requiring executive visibility."
                    clients={
                      clients.slice(
                        0,
                        8
                      )
                    }
                    isLoading={
                      isLoading
                    }
                    onViewAll={() =>
                      openSection(
                        "clients"
                      )
                    }
                    onSelectClient={
                      selectClient
                    }
                  />

                  <ExecutiveAttentionPanel
                    items={
                      attentionItems.slice(
                        0,
                        6
                      )
                    }
                    onSelectBusiness={(
                      businessID
                    ) => {
                      const client =
                        clients.find(
                          (candidate) =>
                            candidate.businessID ===
                            businessID
                        );

                      if (client) {
                        selectClient(
                          client
                        );
                      }
                    }}
                    onViewAll={() =>
                      openSection(
                        "clients"
                      )
                    }
                  />
                </div>
              </>
            )}

            {selectedSection ===
              "clients" && (
              <ExecutiveClientsSection
                clients={
                  filteredClients
                }
                totalClients={
                  clients.length
                }
                searchText={
                  searchText
                }
                filter={
                  clientFilter
                }
                isLoading={
                  isLoading
                }
                onSearchChange={
                  setSearchText
                }
                onFilterChange={
                  setClientFilter
                }
                onCreateBusiness={
                  handleCreateBusiness
                }
                onRefresh={() => {
                  void refresh();
                }}
                onSelectClient={
                  selectClient
                }
              />
            )}

            {selectedSection ===
              "invitations" && (
              <ExecutiveInvitationsSection
                invitations={
                  invitations
                }
                clients={
                  clients
                }
                onCreateBusiness={
                  handleCreateBusiness
                }
              />
            )}

            {selectedSection ===
              "subscriptions" && (
              <ExecutiveSubscriptionsSection
                clients={
                  clients
                }
                metrics={
                  metrics
                }
                moneyFormatter={
                  moneyFormatter
                }
                onSelectClient={
                  selectClient
                }
              />
            )}

            {selectedSection ===
              "billing" && (
              <ExecutiveBillingSection
                clients={
                  clients
                }
                metrics={
                  metrics
                }
                moneyFormatter={
                  moneyFormatter
                }
                onSelectClient={
                  selectClient
                }
              />
            )}

            {selectedSection ===
              "analytics" && (
              <ExecutiveAnalyticsSection
                metrics={
                  metrics
                }
                percentageFormatter={
                  percentageFormatter
                }
              />
            )}

            {selectedSection ===
              "reports" && (
              <ExecutiveReportsSection
                clients={
                  clients
                }
                attentionItems={
                  attentionItems
                }
              />
            )}

            {selectedSection ===
              "settings" && (
              <ExecutiveSettingsSection
                administratorName={
                  administratorName
                }
                administratorEmail={
                  administratorEmail
                }
                clientCount={
                  clients.length
                }
                attentionCount={
                  attentionItems.length
                }
                onRefresh={() => {
                  void refresh();
                }}
                onCreateBusiness={
                  handleCreateBusiness
                }
                onBackToDashboard={
                  handleBackToDashboard
                }
              />
            )}
          </div>
        </div>
      </main>

      {/* Client Detail */}

      {selectedClient && (
        <ExecutiveClientDetail
          client={
            selectedClient
          }
          moneyFormatter={
            moneyFormatter
          }
          onClose={
            closeSelectedClient
          }
          onActivate={() =>
            executeClientAction(
              () =>
                activateClient(
                  selectedClient.businessID
                ),

              "Business Activated",

              `${selectedClient.displayBusinessName} is active.`
            )
          }
          onDeactivate={() =>
            executeClientAction(
              () =>
                deactivateClient(
                  selectedClient.businessID
                ),

              "Business Deactivated",

              `${selectedClient.displayBusinessName} is inactive.`
            )
          }
          onArchive={() =>
            executeClientAction(
              () =>
                archiveClient(
                  selectedClient.businessID
                ),

              "Business Archived",

              `${selectedClient.displayBusinessName} was archived.`
            )
          }
          onRestore={() =>
            executeClientAction(
              () =>
                restoreClient(
                  selectedClient.businessID
                ),

              "Business Restored",

              `${selectedClient.displayBusinessName} was restored.`
            )
          }
          onRequestDeletion={() =>
            executeClientAction(
              () =>
                requestDeletion(
                  selectedClient.businessID
                ),

              "Deletion Requested",

              `${selectedClient.displayBusinessName} entered the protected deletion workflow.`
            )
          }
          onCancelDeletion={() =>
            executeClientAction(
              () =>
                cancelDeletion(
                  selectedClient.businessID
                ),

              "Deletion Canceled",

              `The deletion request for ${selectedClient.displayBusinessName} was canceled.`
            )
          }
          onEnableOwnerAccess={() =>
            executeClientAction(
              () =>
                enableOwnerAccess(
                  selectedClient.businessID
                ),

              "Owner Access Updated",

              `Owner access was updated for ${selectedClient.displayBusinessName}.`
            )
          }
          onDisableOwnerAccess={() =>
            executeClientAction(
              () =>
                disableOwnerAccess(
                  selectedClient.businessID,
                  "Disabled by Platform Administration"
                ),

              "Owner Access Disabled",

              `Owner access was disabled for ${selectedClient.displayBusinessName}.`
            )
          }
        />
      )}

      {/* Command Palette */}

      {commandPaletteOpen && (
        <ExecutiveCommandPalette
          clients={
            clients
          }
          navigationItems={
            navigationItems
          }
          onClose={() =>
            setCommandPaletteOpen(
              false
            )
          }
          onSelectSection={
            openSection
          }
          onSelectClient={(
            client
          ) => {
            setCommandPaletteOpen(
              false
            );

            selectClient(
              client
            );
          }}
          onCreateBusiness={
            handleCreateBusiness
          }
        />
      )}
    </div>
  );
}

// ============================================================
// MARK: - Loading and Access
// ============================================================

function ExecutiveLoadingState({
  accentName,
}: {
  accentName: string;
}) {
  return (
    <div
      className="jcs-executive-loading"
      data-accent={
        accentName
      }
    >
      <div className="jcs-executive-loading__icon">
        <ShieldCheck
          size={30}
          strokeWidth={1.7}
        />
      </div>

      <p>
        JCS Business Suite
      </p>

      <h1>
        Preparing Executive Center
      </h1>

      <span>
        Verifying Platform Administrator access…
      </span>
    </div>
  );
}

function ExecutiveAccessDenied({
  accentName,
  onBack,
  onSignOut,
}: {
  accentName: string;

  onBack: () => void;
  onSignOut: () => void;
}) {
  return (
    <div
      className="jcs-executive-access-denied"
      data-accent={
        accentName
      }
    >
      <div className="jcs-executive-access-denied__card">
        <div className="jcs-executive-access-denied__icon">
          <LockKeyhole
            size={32}
            strokeWidth={1.7}
          />
        </div>

        <p>
          Protected Platform Area
        </p>

        <h1>
          Platform Administrator access required
        </h1>

        <span>
          This workspace is reserved for the JCS Business
          Suite Platform Administrator.
        </span>

        <div>
          <button
            type="button"
            onClick={
              onBack
            }
          >
            Back to Dashboard
          </button>

          <button
            type="button"
            onClick={
              onSignOut
            }
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MARK: - Action Message
// ============================================================

function ExecutiveActionMessage({
  message,
  onClose,
}: {
  message:
    ExecutiveMessage;

  onClose: () => void;
}) {
  return (
    <div
      className="jcs-executive-action-message"
      data-tone={
        message.tone
      }
    >
      <span className="jcs-executive-action-message__icon">
        {message.tone ===
        "success" ? (
          <CheckCircle2
            size={19}
            strokeWidth={1.8}
          />
        ) : message.tone ===
          "error" ? (
          <Activity
            size={19}
            strokeWidth={1.8}
          />
        ) : (
          <Sparkles
            size={19}
            strokeWidth={1.8}
          />
        )}
      </span>

      <span>
        <strong>
          {message.title}
        </strong>

        <small>
          {message.message}
        </small>
      </span>

      <button
        type="button"
        aria-label="Dismiss message"
        onClick={
          onClose
        }
      >
        <X
          size={17}
          strokeWidth={1.8}
        />
      </button>
    </div>
  );
}

// ============================================================
// MARK: - Hero
// ============================================================

function ExecutiveHero({
  administratorFirstName,
  metrics,
  attentionItems,
  onCreateBusiness,
  onOpenClients,
  onOpenInvitations,
  onOpenReports,
}: {
  administratorFirstName:
    string;

  metrics:
    ReturnType<
      typeof usePlatformExecutiveCenter
    >["metrics"];

  attentionItems:
    PlatformExecutiveAttentionItem[];

  onCreateBusiness:
    () => void;

  onOpenClients:
    () => void;

  onOpenInvitations:
    () => void;

  onOpenReports:
    () => void;
}) {
  const urgentItem =
    attentionItems[0];

  return (
    <section className="jcs-executive-hero">
      <div className="jcs-executive-hero__ambient" />

      <div className="jcs-executive-hero__content">
        <p className="jcs-executive-eyebrow">
          JCS Business Suite
        </p>

        <h1>
          Platform Executive Center
        </h1>

        <p className="jcs-executive-hero__message">
          Welcome,{" "}
          {administratorFirstName}. Monitor Business Owners,
          subscriptions, onboarding, billing and platform
          access from one secure administrative workspace.
        </p>

        <div className="jcs-executive-hero__actions">
          <button
            type="button"
            className="jcs-executive-button jcs-executive-button--primary"
            onClick={
              onCreateBusiness
            }
          >
            <Plus
              size={18}
              strokeWidth={1.9}
            />

            New Business
          </button>

          <button
            type="button"
            className="jcs-executive-button jcs-executive-button--secondary"
            onClick={
              onOpenInvitations
            }
          >
            <MailPlus
              size={18}
              strokeWidth={1.8}
            />

            Invite Owner
          </button>

          <button
            type="button"
            className="jcs-executive-button jcs-executive-button--secondary"
            onClick={
              onOpenReports
            }
          >
            <FileBarChart
              size={18}
              strokeWidth={1.8}
            />

            Reports
          </button>
        </div>
      </div>

      <div className="jcs-executive-hero__insight">
        <div className="jcs-executive-hero__insight-header">
          <span>
            <Sparkles
              size={20}
              strokeWidth={1.7}
            />
          </span>

          <div>
            <p>
              Sofía Executive Insight
            </p>

            <strong>
              {urgentItem
                ? urgentItem.title
                : "Platform operating normally"}
            </strong>
          </div>
        </div>

        <p>
          {urgentItem
            ? `${urgentItem.businessName}: ${urgentItem.message}`
            : `${metrics.activeBusinesses} active businesses are currently connected without urgent administrative issues.`}
        </p>

        <button
          type="button"
          onClick={
            onOpenClients
          }
        >
          {urgentItem
            ? "Review Business"
            : "View Business Owners"}

          <ChevronRight
            size={17}
            strokeWidth={1.8}
          />
        </button>
      </div>
    </section>
  );
}

// ============================================================
// MARK: - Metrics
// ============================================================

function ExecutiveMetricsGrid({
  metrics,
}: {
  metrics:
    ExecutiveMetricCard[];
}) {
  return (
    <section
      className="jcs-executive-metrics"
      aria-label="Platform metrics"
    >
      {metrics.map(
        (metric) => {
          const Icon =
            metric.icon;

          return (
            <article
              key={metric.id}
              className="jcs-executive-metric"
              data-tone={
                metric.tone
              }
            >
              <div className="jcs-executive-metric__header">
                <span>
                  <Icon
                    size={21}
                    strokeWidth={1.8}
                  />
                </span>

                <small>
                  Live
                </small>
              </div>

              <strong>
                {metric.value}
              </strong>

              <h2>
                {metric.title}
              </h2>

              <p>
                {metric.message}
              </p>
            </article>
          );
        }
      )}
    </section>
  );
}

// ============================================================
// MARK: - Sofía Bar
// ============================================================

function ExecutiveSofiaBar({
  attentionItems,
  onOpenAttention,
  onOpenAnalytics,
}: {
  attentionItems:
    PlatformExecutiveAttentionItem[];

  onOpenAttention:
    () => void;

  onOpenAnalytics:
    () => void;
}) {
  const hasAttention =
    attentionItems.length > 0;

  return (
    <section className="jcs-executive-sofia-bar">
      <span className="jcs-executive-sofia-bar__icon">
        <Sparkles
          size={21}
          strokeWidth={1.7}
        />
      </span>

      <div>
        <p>
          Ask Sofía
        </p>

        <strong>
          {hasAttention
            ? `${attentionItems.length} platform items need review`
            : "No urgent administrative issues detected"}
        </strong>

        <small>
          Executive platform insights and administrative
          guidance.
        </small>
      </div>

      <button
        type="button"
        onClick={
          hasAttention
            ? onOpenAttention
            : onOpenAnalytics
        }
      >
        Open Insight

        <ChevronRight
          size={17}
          strokeWidth={1.8}
        />
      </button>
    </section>
  );
}

// ============================================================
// MARK: - Business Owners Panel
// ============================================================

function ExecutiveBusinessOwnersPanel({
  title,
  subtitle,
  clients,
  isLoading,
  onViewAll,
  onSelectClient,
}: {
  title: string;
  subtitle: string;

  clients:
    PlatformClientViewModel[];

  isLoading:
    boolean;

  onViewAll:
    () => void;

  onSelectClient:
    (
      client:
        PlatformClientViewModel
    ) => void;
}) {
  return (
    <section className="jcs-executive-panel">
      <div className="jcs-executive-panel__heading">
        <div>
          <p className="jcs-executive-eyebrow">
            Business Overview
          </p>

          <h2>
            {title}
          </h2>

          <span>
            {subtitle}
          </span>
        </div>

        <button
          type="button"
          onClick={
            onViewAll
          }
        >
          View All
        </button>
      </div>

      {isLoading ? (
        <ExecutiveInlineLoading />
      ) : clients.length ===
        0 ? (
        <ExecutiveEmptyState
          icon={
            Building2
          }
          title="No businesses available"
          message="Created businesses will appear in the Executive Center."
        />
      ) : (
        <div className="jcs-executive-business-list">
          {clients.map(
            (client) => (
              <ExecutiveBusinessRow
                key={
                  client.businessID
                }
                client={
                  client
                }
                onSelect={() =>
                  onSelectClient(
                    client
                  )
                }
              />
            )
          )}
        </div>
      )}
    </section>
  );
}

function ExecutiveBusinessRow({
  client,
  onSelect,
}: {
  client:
    PlatformClientViewModel;

  onSelect:
    () => void;
}) {
  const statusTone =
    clientStatusTone(
      client
    );

  return (
    <button
      type="button"
      className="jcs-executive-business-row"
      onClick={
        onSelect
      }
    >
      <span className="jcs-executive-business-row__logo">
        {businessInitials(
          client.displayBusinessName
        )}
      </span>

      <span className="jcs-executive-business-row__identity">
        <strong>
          {client.displayBusinessName}
        </strong>

        <small>
          {client.displayOwnerName}
        </small>
      </span>

      <span className="jcs-executive-business-row__plan">
        <small>
          Plan
        </small>

        <strong>
          {client.planName ||
            "No Plan"}
        </strong>
      </span>

      <span className="jcs-executive-business-row__status">
        <span
          data-tone={
            statusTone
          }
        >
          {clientStatusLabel(
            client
          )}
        </span>
      </span>

      <ChevronRight
        size={18}
        strokeWidth={1.8}
      />
    </button>
  );
}

// ============================================================
// MARK: - Attention Panel
// ============================================================

function ExecutiveAttentionPanel({
  items,
  onSelectBusiness,
  onViewAll,
}: {
  items:
    PlatformExecutiveAttentionItem[];

  onSelectBusiness:
    (
      businessID: string
    ) => void;

  onViewAll:
    () => void;
}) {
  return (
    <section className="jcs-executive-panel">
      <div className="jcs-executive-panel__heading">
        <div>
          <p className="jcs-executive-eyebrow">
            Platform Monitoring
          </p>

          <h2>
            Executive Attention
          </h2>

          <span>
            Businesses requiring platform follow-up.
          </span>
        </div>

        {items.length >
          0 && (
          <button
            type="button"
            onClick={
              onViewAll
            }
          >
            Review All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <ExecutiveEmptyState
          icon={
            CheckCircle2
          }
          title="No urgent platform issues"
          message="All current businesses satisfy the primary platform access conditions."
        />
      ) : (
        <div className="jcs-executive-attention-list">
          {items.map(
            (item) => (
              <button
                key={item.id}
                type="button"
                className="jcs-executive-attention-item"
                data-severity={
                  item.severity
                }
                onClick={() =>
                  onSelectBusiness(
                    item.businessID
                  )
                }
              >
                <span className="jcs-executive-attention-item__icon">
                  <Activity
                    size={18}
                    strokeWidth={1.8}
                  />
                </span>

                <span>
                  <strong>
                    {item.businessName}
                  </strong>

                  <small>
                    {item.title}
                  </small>

                  <p>
                    {item.message}
                  </p>
                </span>

                <ChevronRight
                  size={17}
                  strokeWidth={1.8}
                />
              </button>
            )
          )}
        </div>
      )}
    </section>
  );
}

// ============================================================
// MARK: - Clients Section
// ============================================================

function ExecutiveClientsSection({
  clients,
  totalClients,
  searchText,
  filter,
  isLoading,
  onSearchChange,
  onFilterChange,
  onCreateBusiness,
  onRefresh,
  onSelectClient,
}: {
  clients:
    PlatformClientViewModel[];

  totalClients:
    number;

  searchText:
    string;

  filter:
    PlatformClientFilter;

  isLoading:
    boolean;

  onSearchChange:
    (
      value: string
    ) => void;

  onFilterChange:
    (
      value:
        PlatformClientFilter
    ) => void;

  onCreateBusiness:
    () => void;

  onRefresh:
    () => void;

  onSelectClient:
    (
      client:
        PlatformClientViewModel
    ) => void;
}) {
  return (
    <section className="jcs-executive-section">
      <div className="jcs-executive-section__hero">
        <div>
          <p className="jcs-executive-eyebrow">
            Platform Clients
          </p>

          <h1>
            Business Owners
          </h1>

          <span>
            Manage businesses, owners, subscriptions, modules,
            limits and application access.
          </span>
        </div>

        <div>
          <button
            type="button"
            className="jcs-executive-button jcs-executive-button--secondary"
            onClick={
              onRefresh
            }
          >
            <RefreshCw
              size={17}
              strokeWidth={1.8}
            />

            Refresh
          </button>

          <button
            type="button"
            className="jcs-executive-button jcs-executive-button--primary"
            onClick={
              onCreateBusiness
            }
          >
            <Plus
              size={17}
              strokeWidth={1.9}
            />

            New Business
          </button>
        </div>
      </div>

      <div className="jcs-executive-client-toolbar">
        <label className="jcs-executive-client-search">
          <Search
            size={18}
            strokeWidth={1.8}
          />

          <input
            type="search"
            value={
              searchText
            }
            placeholder="Search business, owner, email or Business ID"
            onChange={(
              event
            ) =>
              onSearchChange(
                event.target.value
              )
            }
          />
        </label>

        <label className="jcs-executive-client-filter">
          <Filter
            size={17}
            strokeWidth={1.8}
          />

          <select
            value={
              filter
            }
            onChange={(
              event
            ) =>
              onFilterChange(
                event.target
                  .value as
                  PlatformClientFilter
              )
            }
          >
            <option value="all">
              All Businesses
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>

            <option value="onboarding">
              Onboarding
            </option>

            <option value="trial">
              Active Trials
            </option>

            <option value="trial-expired">
              Expired Trials
            </option>

            <option value="restricted">
              Restricted Access
            </option>

            <option value="owner-registration-pending">
              Owner Pending
            </option>

            <option value="archived">
              Archived
            </option>

            <option value="pending-deletion">
              Pending Deletion
            </option>

            <option value="needs-attention">
              Needs Attention
            </option>
          </select>
        </label>

        <span className="jcs-executive-client-toolbar__count">
          {clients.length} of{" "}
          {totalClients}
        </span>
      </div>

      <div className="jcs-executive-client-table">
        <div className="jcs-executive-client-table__header">
          <span>
            Business
          </span>

          <span>
            Owner
          </span>

          <span>
            Subscription
          </span>

          <span>
            Platform Status
          </span>

          <span>
            Business ID
          </span>

          <span />
        </div>

        {isLoading ? (
          <ExecutiveInlineLoading />
        ) : clients.length ===
          0 ? (
          <ExecutiveEmptyState
            icon={
              Search
            }
            title="No businesses found"
            message="No Platform Client matches the current search and filter."
          />
        ) : (
          clients.map(
            (client) => (
              <button
                key={
                  client.businessID
                }
                type="button"
                className="jcs-executive-client-table__row"
                onClick={() =>
                  onSelectClient(
                    client
                  )
                }
              >
                <span className="jcs-executive-client-table__business">
                  <span>
                    {businessInitials(
                      client.displayBusinessName
                    )}
                  </span>

                  <span>
                    <strong>
                      {client.displayBusinessName}
                    </strong>

                    <small>
                      {client.industry ||
                        client.businessCategory ||
                        "General Business"}
                    </small>
                  </span>
                </span>

                <span>
                  <strong>
                    {client.displayOwnerName}
                  </strong>

                  <small>
                    {client.ownerEmail ||
                      "No owner email"}
                  </small>
                </span>

                <span>
                  <strong>
                    {client.planName ||
                      "No Plan"}
                  </strong>

                  <small>
                    {
                      client
                        .displaySubscriptionStatus
                    }
                  </small>
                </span>

                <span>
                  <small
                    className="jcs-executive-status-badge"
                    data-tone={
                      clientStatusTone(
                        client
                      )
                    }
                  >
                    {clientStatusLabel(
                      client
                    )}
                  </small>
                </span>

                <span>
                  <code>
                    {client.businessID}
                  </code>
                </span>

                <span>
                  <ChevronRight
                    size={17}
                    strokeWidth={1.8}
                  />
                </span>
              </button>
            )
          )
        )}
      </div>
    </section>
  );
}

// ============================================================
// MARK: - Invitations
// ============================================================

function ExecutiveInvitationsSection({
  invitations,
  clients,
  onCreateBusiness,
}: {
  invitations:
    ReturnType<
      typeof usePlatformExecutiveCenter
    >["invitations"];

  clients:
    PlatformClientViewModel[];

  onCreateBusiness:
    () => void;
}) {
  const pendingClients =
    clients.filter(
      (client) =>
        !client
          .isOwnerRegistered
    );

  return (
    <ExecutiveStandardSection
      eyebrow="Owner Registration"
      title="Business Owner Invitations"
      message="Invite prospective Business Owners and review registration status."
      actionTitle="Create Business"
      actionIcon={
        Plus
      }
      onAction={
        onCreateBusiness
      }
    >
      {invitations.length ===
        0 &&
      pendingClients.length ===
        0 ? (
        <ExecutiveEmptyState
          icon={
            MailPlus
          }
          title="No pending invitations"
          message="Every current business has a registered owner or no invitations have been created."
        />
      ) : (
        <div className="jcs-executive-card-grid">
          {pendingClients.map(
            (client) => (
              <article
                key={
                  client.businessID
                }
                className="jcs-executive-information-card"
              >
                <span>
                  <MailPlus
                    size={20}
                    strokeWidth={1.8}
                  />
                </span>

                <p>
                  Owner Registration
                </p>

                <h2>
                  {client.displayBusinessName}
                </h2>

                <small>
                  {client.ownerEmail ||
                    "Owner email not registered"}
                </small>

                <div>
                  <strong>
                    {
                      client
                        .ownerInvitationDisplayStatus
                    }
                  </strong>

                  <code>
                    {client.businessID}
                  </code>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </ExecutiveStandardSection>
  );
}

// ============================================================
// MARK: - Subscriptions
// ============================================================

function ExecutiveSubscriptionsSection({
  clients,
  metrics,
  moneyFormatter,
  onSelectClient,
}: {
  clients:
    PlatformClientViewModel[];

  metrics:
    ReturnType<
      typeof usePlatformExecutiveCenter
    >["metrics"];

  moneyFormatter:
    Intl.NumberFormat;

  onSelectClient:
    (
      client:
        PlatformClientViewModel
    ) => void;
}) {
  const subscriptionClients =
    clients.filter(
      (client) =>
        client.planName ||
        client.trialDaysRemaining >
          0 ||
        client.isTrialExpired
    );

  return (
    <ExecutiveStandardSection
      eyebrow="Plans and Access"
      title="Subscriptions"
      message="Review plans, trials, application access and recurring account value."
    >
      <div className="jcs-executive-summary-grid">
        <ExecutiveSummaryCard
          icon={
            CheckCircle2
          }
          title="Active Subscriptions"
          value={
            metrics
              .activeSubscriptions
              .toLocaleString()
          }
          message="Businesses with active subscription access."
        />

        <ExecutiveSummaryCard
          icon={
            CalendarClock
          }
          title="Active Trials"
          value={
            metrics
              .activeTrials
              .toLocaleString()
          }
          message="Businesses currently inside a trial period."
        />

        <ExecutiveSummaryCard
          icon={
            Activity
          }
          title="Expired Trials"
          value={
            metrics
              .expiredTrials
              .toLocaleString()
          }
          message="Businesses requiring plan follow-up."
        />

        <ExecutiveSummaryCard
          icon={
            LockKeyhole
          }
          title="Restricted Access"
          value={
            metrics
              .restrictedAccess
              .toLocaleString()
          }
          message="Businesses unable to enter the application."
        />
      </div>

      <ExecutiveBusinessOwnersPanel
        title="Subscription Accounts"
        subtitle={`Configured monthly platform value: ${moneyFormatter.format(
          metrics.monthlyRevenue
        )}`}
        clients={
          subscriptionClients
        }
        isLoading={
          false
        }
        onViewAll={() => {
          // Current section already displays all subscription clients.
        }}
        onSelectClient={
          onSelectClient
        }
      />
    </ExecutiveStandardSection>
  );
}

// ============================================================
// MARK: - Billing
// ============================================================

function ExecutiveBillingSection({
  clients,
  metrics,
  moneyFormatter,
  onSelectClient,
}: {
  clients:
    PlatformClientViewModel[];

  metrics:
    ReturnType<
      typeof usePlatformExecutiveCenter
    >["metrics"];

  moneyFormatter:
    Intl.NumberFormat;

  onSelectClient:
    (
      client:
        PlatformClientViewModel
    ) => void;
}) {
  const billingClients =
    clients.filter(
      (client) =>
        client.monthlyPrice >
          0 ||
        Boolean(
          client.planName
        )
    );

  return (
    <ExecutiveStandardSection
      eyebrow="Revenue Administration"
      title="Platform Billing"
      message="Review configured recurring revenue and individual billing accounts."
    >
      <div className="jcs-executive-summary-grid">
        <ExecutiveSummaryCard
          icon={
            CircleDollarSign
          }
          title="Monthly Revenue"
          value={
            moneyFormatter.format(
              metrics.monthlyRevenue
            )
          }
          message="Combined configured monthly plan value."
        />

        <ExecutiveSummaryCard
          icon={
            CreditCard
          }
          title="Paying Businesses"
          value={
            metrics
              .payingBusinesses
              .toLocaleString()
          }
          message="Businesses with a monthly price above zero."
        />

        <ExecutiveSummaryCard
          icon={
            BarChart3
          }
          title="Average Revenue"
          value={
            moneyFormatter.format(
              metrics
                .averageMonthlyRevenue
            )
          }
          message="Average monthly value per paying business."
        />

        <ExecutiveSummaryCard
          icon={
            CheckCircle2
          }
          title="Billing Connection"
          value="Connected"
          message="Platform billing administration is available."
        />
      </div>

      <ExecutiveBusinessOwnersPanel
        title="Billing Accounts"
        subtitle="Open a business to review billing and subscription settings."
        clients={
          billingClients
        }
        isLoading={
          false
        }
        onViewAll={() => {
          // All billing accounts are already visible.
        }}
        onSelectClient={
          onSelectClient
        }
      />
    </ExecutiveStandardSection>
  );
}

// ============================================================
// MARK: - Analytics
// ============================================================

function ExecutiveAnalyticsSection({
  metrics,
  percentageFormatter,
}: {
  metrics:
    ReturnType<
      typeof usePlatformExecutiveCenter
    >["metrics"];

  percentageFormatter:
    Intl.NumberFormat;
}) {
  const total =
    Math.max(
      metrics.totalBusinesses,
      1
    );

  const analyticsRows = [
    {
      title:
        "Application Access",

      value:
        metrics.accessEnabledCount,

      percentage:
        metrics.accessEnabledCount /
        total,
    },

    {
      title:
        "Owner Registration",

      value:
        metrics.registeredOwners,

      percentage:
        metrics.registeredOwners /
        total,
    },

    {
      title:
        "Onboarding Completion",

      value:
        metrics.onboardingComplete,

      percentage:
        metrics.onboardingComplete /
        total,
    },

    {
      title:
        "Active Businesses",

      value:
        metrics.activeBusinesses,

      percentage:
        metrics.activeBusinesses /
        total,
    },
  ];

  return (
    <ExecutiveStandardSection
      eyebrow="Platform Performance"
      title="Analytics"
      message="Current account distribution and operational percentages."
    >
      <div className="jcs-executive-summary-grid">
        <ExecutiveSummaryCard
          icon={
            Building2
          }
          title="Total Businesses"
          value={
            metrics
              .totalBusinesses
              .toLocaleString()
          }
          message="All Platform Client records."
        />

        <ExecutiveSummaryCard
          icon={
            CheckCircle2
          }
          title="Active Businesses"
          value={
            metrics
              .activeBusinesses
              .toLocaleString()
          }
          message="Active and not archived."
        />

        <ExecutiveSummaryCard
          icon={
            Users
          }
          title="Registered Owners"
          value={
            metrics
              .registeredOwners
              .toLocaleString()
          }
          message="Business Owners with completed identity registration."
        />

        <ExecutiveSummaryCard
          icon={
            Activity
          }
          title="Needs Attention"
          value={
            metrics
              .businessesNeedingAttention
              .toLocaleString()
          }
          message="Businesses requiring executive review."
        />
      </div>

      <section className="jcs-executive-panel">
        <div className="jcs-executive-panel__heading">
          <div>
            <p className="jcs-executive-eyebrow">
              Business Distribution
            </p>

            <h2>
              Operational Percentages
            </h2>

            <span>
              Platform readiness across all Business Owners.
            </span>
          </div>
        </div>

        <div className="jcs-executive-progress-list">
          {analyticsRows.map(
            (row) => (
              <div
                key={
                  row.title
                }
                className="jcs-executive-progress-row"
              >
                <div>
                  <span>
                    <Gauge
                      size={18}
                      strokeWidth={1.8}
                    />
                  </span>

                  <div>
                    <strong>
                      {row.title}
                    </strong>

                    <small>
                      {row.value} of{" "}
                      {
                        metrics.totalBusinesses
                      }{" "}
                      businesses
                    </small>
                  </div>

                  <b>
                    {percentageFormatter.format(
                      row.percentage
                    )}
                  </b>
                </div>

                <div className="jcs-executive-progress-row__track">
                  <span
                    style={{
                      width:
                        `${Math.min(
                          Math.max(
                            row.percentage *
                              100,
                            0
                          ),
                          100
                        )}%`,
                    }}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </section>
    </ExecutiveStandardSection>
  );
}

// ============================================================
// MARK: - Reports
// ============================================================

function ExecutiveReportsSection({
  clients,
  attentionItems,
}: {
  clients:
    PlatformClientViewModel[];

  attentionItems:
    PlatformExecutiveAttentionItem[];
}) {
  const exportCSV =
    useCallback(
      (
        selectedClients:
          PlatformClientViewModel[]
      ) => {
        if (
          selectedClients.length ===
          0
        ) {
          return;
        }

        const rows = [
          [
            "Business ID",
            "Business Name",
            "Owner Name",
            "Owner Email",
            "Industry",
            "Category",
            "Plan",
            "Subscription Status",
            "Monthly Price",
            "Active",
            "Application Access",
          ],

          ...selectedClients.map(
            (client) => [
              client.businessID,
              client.displayBusinessName,
              client.displayOwnerName,
              client.ownerEmail,
              client.industry,
              client.businessCategory,
              client.planName,
              client
                .displaySubscriptionStatus,
              String(
                client.monthlyPrice
              ),
              String(
                client.isActive
              ),
              String(
                client.canAccessApp
              ),
            ]
          ),
        ];

        const csv =
          rows
            .map(
              (row) =>
                row
                  .map(
                    (value) =>
                      `"${String(
                        value
                      ).replace(
                        /"/g,
                        "\"\""
                      )}"`
                  )
                  .join(",")
            )
            .join("\n");

        const blob =
          new Blob(
            [csv],
            {
              type:
                "text/csv;charset=utf-8",
            }
          );

        const url =
          URL.createObjectURL(
            blob
          );

        const anchor =
          document.createElement(
            "a"
          );

        anchor.href =
          url;

        anchor.download =
          "jcs-platform-clients.csv";

        anchor.click();

        URL.revokeObjectURL(
          url
        );
      },
      []
    );

  const attentionBusinessIDs =
    new Set(
      attentionItems.map(
        (item) =>
          item.businessID
      )
    );

  const attentionClients =
    clients.filter(
      (client) =>
        attentionBusinessIDs.has(
          client.businessID
        )
    );

  const pendingOwners =
    clients.filter(
      (client) =>
        !client
          .isOwnerRegistered
    );

  const subscriptionClients =
    clients.filter(
      (client) =>
        client.planName ||
        client.trialDaysRemaining >
          0 ||
        client.isTrialExpired
    );

  return (
    <ExecutiveStandardSection
      eyebrow="Administrative Data"
      title="Executive Reports"
      message="Export current Platform Client information for administrative review."
    >
      <div className="jcs-executive-report-grid">
        <ExecutiveReportCard
          icon={
            Building2
          }
          title="Business Directory"
          message="Business identity, owner, location and subscription information."
          count={
            clients.length
          }
          onExport={() =>
            exportCSV(
              clients
            )
          }
        />

        <ExecutiveReportCard
          icon={
            CreditCard
          }
          title="Subscription Review"
          message="Active plans, trial accounts and restricted businesses."
          count={
            subscriptionClients.length
          }
          onExport={() =>
            exportCSV(
              subscriptionClients
            )
          }
        />

        <ExecutiveReportCard
          icon={
            MailPlus
          }
          title="Owner Registration"
          message="Businesses whose owner registration remains incomplete."
          count={
            pendingOwners.length
          }
          onExport={() =>
            exportCSV(
              pendingOwners
            )
          }
        />

        <ExecutiveReportCard
          icon={
            Activity
          }
          title="Executive Attention"
          message="Archived, inactive, expired or restricted accounts."
          count={
            attentionClients.length
          }
          onExport={() =>
            exportCSV(
              attentionClients
            )
          }
        />
      </div>
    </ExecutiveStandardSection>
  );
}

// ============================================================
// MARK: - Settings
// ============================================================

function ExecutiveSettingsSection({
  administratorName,
  administratorEmail,
  clientCount,
  attentionCount,
  onRefresh,
  onCreateBusiness,
  onBackToDashboard,
}: {
  administratorName:
    string;

  administratorEmail:
    string;

  clientCount:
    number;

  attentionCount:
    number;

  onRefresh:
    () => void;

  onCreateBusiness:
    () => void;

  onBackToDashboard:
    () => void;
}) {
  return (
    <ExecutiveStandardSection
      eyebrow="Executive Controls"
      title="Platform Settings"
      message="Review the current administrator and Platform Executive Center controls."
    >
      <section className="jcs-executive-administrator-card">
        <span className="jcs-executive-administrator-card__avatar">
          {firstNameFromValue(
            administratorName
          )
            .charAt(0)
            .toUpperCase()}
        </span>

        <div>
          <p>
            Platform Administrator
          </p>

          <h2>
            {administratorName}
          </h2>

          <span>
            {administratorEmail ||
              "No administrator email"}
          </span>
        </div>

        <ShieldCheck
          size={27}
          strokeWidth={1.7}
        />
      </section>

      <div className="jcs-executive-summary-grid">
        <ExecutiveSummaryCard
          icon={
            Building2
          }
          title="Businesses"
          value={
            clientCount.toLocaleString()
          }
          message="Current Platform Client records."
        />

        <ExecutiveSummaryCard
          icon={
            Activity
          }
          title="Attention Items"
          value={
            attentionCount.toLocaleString()
          }
          message="Businesses requiring administrative review."
        />

        <ExecutiveSummaryCard
          icon={
            CheckCircle2
          }
          title="Platform"
          value="Operational"
          message="Executive Center services are available."
        />

        <ExecutiveSummaryCard
          icon={
            ShieldCheck
          }
          title="Current Role"
          value="Platform Admin"
          message="Full Platform Administration access."
        />
      </div>

      <div className="jcs-executive-settings-actions">
        <ExecutiveSettingsAction
          icon={
            RefreshCw
          }
          title="Refresh Platform Data"
          message="Reload current Firestore records."
          onClick={
            onRefresh
          }
        />

        <ExecutiveSettingsAction
          icon={
            Plus
          }
          title="Create New Business"
          message="Begin the Business Owner creation workflow."
          onClick={
            onCreateBusiness
          }
        />

        <ExecutiveSettingsAction
          icon={
            LayoutDashboard
          }
          title="Return to Dashboard"
          message="Leave the Platform Executive Center."
          onClick={
            onBackToDashboard
          }
        />
      </div>
    </ExecutiveStandardSection>
  );
}

// ============================================================
// MARK: - Shared Section Components
// ============================================================

function ExecutiveStandardSection({
  eyebrow,
  title,
  message,
  actionTitle,
  actionIcon:
    ActionIcon,
  onAction,
  children,
}: {
  eyebrow:
    string;

  title:
    string;

  message:
    string;

  actionTitle?:
    string;

  actionIcon?:
    ComponentType<{
      size?: number;
      strokeWidth?: number;
    }>;

  onAction?:
    () => void;

  
  children:
    ReactNode;

}) {
  return (
    <section className="jcs-executive-section">
      <div className="jcs-executive-section__hero">
        <div>
          <p className="jcs-executive-eyebrow">
            {eyebrow}
          </p>

          <h1>
            {title}
          </h1>

          <span>
            {message}
          </span>
        </div>

        {actionTitle &&
          onAction && (
          <button
            type="button"
            className="jcs-executive-button jcs-executive-button--primary"
            onClick={
              onAction
            }
          >
            {ActionIcon && (
              <ActionIcon
                size={17}
                strokeWidth={1.8}
              />
            )}

            {actionTitle}
          </button>
        )}
      </div>

      {children}
    </section>
  );
}

function ExecutiveSummaryCard({
  icon:
    Icon,
  title,
  value,
  message,
}: {
  icon:
    ComponentType<{
      size?: number;
      strokeWidth?: number;
    }>;

  title:
    string;

  value:
    string;

  message:
    string;
}) {
  return (
    <article className="jcs-executive-summary-card">
      <span>
        <Icon
          size={21}
          strokeWidth={1.8}
        />
      </span>

      <strong>
        {value}
      </strong>

      <h2>
        {title}
      </h2>

      <p>
        {message}
      </p>
    </article>
  );
}

function ExecutiveReportCard({
  icon:
    Icon,
  title,
  message,
  count,
  onExport,
}: {
  icon:
    ComponentType<{
      size?: number;
      strokeWidth?: number;
    }>;

  title:
    string;

  message:
    string;

  count:
    number;

  onExport:
    () => void;
}) {
  return (
    <article className="jcs-executive-report-card">
      <div>
        <span>
          <Icon
            size={21}
            strokeWidth={1.8}
          />
        </span>

        <small>
          {count}
        </small>
      </div>

      <h2>
        {title}
      </h2>

      <p>
        {message}
      </p>

      <button
        type="button"
        disabled={
          count === 0
        }
        onClick={
          onExport
        }
      >
        Export Report

        <ChevronRight
          size={17}
          strokeWidth={1.8}
        />
      </button>
    </article>
  );
}

function ExecutiveSettingsAction({
  icon:
    Icon,
  title,
  message,
  onClick,
}: {
  icon:
    ComponentType<{
      size?: number;
      strokeWidth?: number;
    }>;

  title:
    string;

  message:
    string;

  onClick:
    () => void;
}) {
  return (
    <button
      type="button"
      className="jcs-executive-settings-action"
      onClick={
        onClick
      }
    >
      <span>
        <Icon
          size={20}
          strokeWidth={1.8}
        />
      </span>

      <span>
        <strong>
          {title}
        </strong>

        <small>
          {message}
        </small>
      </span>

      <ChevronRight
        size={18}
        strokeWidth={1.8}
      />
    </button>
  );
}

function ExecutiveEmptyState({
  icon:
    Icon,
  title,
  message,
}: {
  icon:
    ComponentType<{
      size?: number;
      strokeWidth?: number;
    }>;

  title:
    string;

  message:
    string;
}) {
  return (
    <div className="jcs-executive-empty-state">
      <span>
        <Icon
          size={25}
          strokeWidth={1.7}
        />
      </span>

      <strong>
        {title}
      </strong>

      <p>
        {message}
      </p>
    </div>
  );
}

function ExecutiveInlineLoading() {
  return (
    <div className="jcs-executive-inline-loading">
      <RefreshCw
        className="jcs-executive-rotating"
        size={20}
        strokeWidth={1.8}
      />

      Loading platform records…
    </div>
  );
}

// ============================================================
// MARK: - Client Detail
// ============================================================

function ExecutiveClientDetail({
  client,
  moneyFormatter,
  onClose,
  onActivate,
  onDeactivate,
  onArchive,
  onRestore,
  onRequestDeletion,
  onCancelDeletion,
  onEnableOwnerAccess,
  onDisableOwnerAccess,
}: {
  client:
    PlatformClientViewModel;

  moneyFormatter:
    Intl.NumberFormat;

  onClose:
    () => void;

  onActivate:
    () => void;

  onDeactivate:
    () => void;

  onArchive:
    () => void;

  onRestore:
    () => void;

  onRequestDeletion:
    () => void;

  onCancelDeletion:
    () => void;

  onEnableOwnerAccess:
    () => void;

  onDisableOwnerAccess:
    () => void;
}) {
  return (
    <div
      className="jcs-executive-detail-overlay"
      role="presentation"
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        className="jcs-executive-detail"
        role="dialog"
        aria-modal="true"
        aria-label={`${client.displayBusinessName} platform information`}
      >
        <header className="jcs-executive-detail__header">
          <div>
            <span className="jcs-executive-business-row__logo">
              {businessInitials(
                client.displayBusinessName
              )}
            </span>

            <div>
              <p>
                Platform Client
              </p>

              <h1>
                {client.displayBusinessName}
              </h1>

              <small>
                {client.displayOwnerName}
              </small>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close business information"
            onClick={
              onClose
            }
          >
            <X
              size={20}
              strokeWidth={1.8}
            />
          </button>
        </header>

        <div className="jcs-executive-detail__content">
          <div className="jcs-executive-detail__summary">
            <ExecutiveDetailSummary
              title="Status"
              value={
                clientStatusLabel(
                  client
                )
              }
              icon={
                CheckCircle2
              }
            />

            <ExecutiveDetailSummary
              title="Subscription"
              value={
                client.planName ||
                "No Plan"
              }
              icon={
                CreditCard
              }
            />

            <ExecutiveDetailSummary
              title="Monthly Price"
              value={
                moneyFormatter.format(
                  client.monthlyPrice
                )
              }
              icon={
                CircleDollarSign
              }
            />
          </div>

          <div className="jcs-executive-detail__information">
            <ExecutiveDetailRow
              label="Business ID"
              value={
                client.businessID
              }
            />

            <ExecutiveDetailRow
              label="Owner UID"
              value={
                client.ownerUID ||
                "Not available"
              }
            />

            <ExecutiveDetailRow
              label="Owner Firebase UID"
              value={
                client.ownerFirebaseUID ||
                "Registration pending"
              }
            />

            <ExecutiveDetailRow
              label="Owner Email"
              value={
                client.ownerEmail ||
                "Not registered"
              }
            />

            <ExecutiveDetailRow
              label="Industry"
              value={
                client.industry ||
                "Not configured"
              }
            />

            <ExecutiveDetailRow
              label="Business Category"
              value={
                client.businessCategory ||
                "Not configured"
              }
            />

            <ExecutiveDetailRow
              label="Subscription Status"
              value={
                client
                  .displaySubscriptionStatus
              }
            />

            <ExecutiveDetailRow
              label="Application Access"
              value={
                client.canAccessApp
                  ? "Enabled"
                  : "Restricted"
              }
            />

            <ExecutiveDetailRow
              label="Available Modules"
              value={
                client.enabledModules.length >
                0
                  ? client.enabledModules.join(
                      ", "
                    )
                  : "Default configuration"
              }
            />
          </div>

          <div className="jcs-executive-detail__actions">
            {client.isActive ? (
              <button
                type="button"
                onClick={
                  onDeactivate
                }
              >
                <LockKeyhole
                  size={17}
                  strokeWidth={1.8}
                />

                Deactivate
              </button>
            ) : (
              <button
                type="button"
                onClick={
                  onActivate
                }
              >
                <CheckCircle2
                  size={17}
                  strokeWidth={1.8}
                />

                Activate
              </button>
            )}

            {client.isArchived ? (
              <button
                type="button"
                onClick={
                  onRestore
                }
              >
                <RefreshCw
                  size={17}
                  strokeWidth={1.8}
                />

                Restore
              </button>
            ) : (
              <button
                type="button"
                onClick={
                  onArchive
                }
              >
                <Archive
                  size={17}
                  strokeWidth={1.8}
                />

                Archive
              </button>
            )}

            {client.isPendingDeletion ? (
              <button
                type="button"
                onClick={
                  onCancelDeletion
                }
              >
                Cancel Deletion
              </button>
            ) : (
              <button
                type="button"
                className="jcs-executive-detail__danger"
                onClick={
                  onRequestDeletion
                }
              >
                Request Deletion
              </button>
            )}

            {client.ownerAccountStatus ===
            "Disabled" ? (
              <button
                type="button"
                onClick={
                  onEnableOwnerAccess
                }
              >
                Enable Owner Access
              </button>
            ) : (
              <button
                type="button"
                onClick={
                  onDisableOwnerAccess
                }
              >
                Disable Owner Access
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ExecutiveDetailSummary({
  title,
  value,
  icon:
    Icon,
}: {
  title:
    string;

  value:
    string;

  icon:
    ComponentType<{
      size?: number;
      strokeWidth?: number;
    }>;
}) {
  return (
    <article>
      <span>
        <Icon
          size={18}
          strokeWidth={1.8}
        />
      </span>

      <small>
        {title}
      </small>

      <strong>
        {value}
      </strong>
    </article>
  );
}

function ExecutiveDetailRow({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div>
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

// ============================================================
// MARK: - Command Palette
// ============================================================

function ExecutiveCommandPalette({
  clients,
  navigationItems,
  onClose,
  onSelectSection,
  onSelectClient,
  onCreateBusiness,
}: {
  clients:
    PlatformClientViewModel[];

  navigationItems:
    ExecutiveNavigationItem[];

  onClose:
    () => void;

  onSelectSection:
    (
      section:
        ExecutiveSection
    ) => void;

  onSelectClient:
    (
      client:
        PlatformClientViewModel
    ) => void;

  onCreateBusiness:
    () => void;
}) {
  const [
    query,
    setQuery,
  ] = useState("");

  const normalizedQuery =
    query
      .trim()
      .toLowerCase();

  const matchingClients =
    useMemo(
      () => {
        if (!normalizedQuery) {
          return clients.slice(
            0,
            6
          );
        }

        return clients
          .filter(
            (client) =>
              [
                client.businessID,
                client.displayBusinessName,
                client.displayOwnerName,
                client.ownerEmail,
                client.businessEmail,
              ].some(
                (value) =>
                  value
                    .toLowerCase()
                    .includes(
                      normalizedQuery
                    )
              )
          )
          .slice(
            0,
            12
          );
      },
      [
        clients,
        normalizedQuery,
      ]
    );

  const matchingSections =
    useMemo(
      () => {
        if (!normalizedQuery) {
          return navigationItems;
        }

        return navigationItems.filter(
          (item) =>
            [
              item.title,
              item.subtitle,
            ].some(
              (value) =>
                value
                  .toLowerCase()
                  .includes(
                    normalizedQuery
                  )
            )
        );
      },
      [
        navigationItems,
        normalizedQuery,
      ]
    );

  return (
    <div
      className="jcs-executive-command-overlay"
      role="presentation"
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        className="jcs-executive-command"
        role="dialog"
        aria-modal="true"
        aria-label="Search Platform Executive Center"
      >
        <div className="jcs-executive-command__search">
          <Search
            size={20}
            strokeWidth={1.8}
          />

          <input
            autoFocus
            type="search"
            value={
              query
            }
            placeholder="Search businesses, owners and platform sections…"
            onChange={(
              event
            ) =>
              setQuery(
                event.target.value
              )
            }
          />

          <button
            type="button"
            aria-label="Close search"
            onClick={
              onClose
            }
          >
            <X
              size={18}
              strokeWidth={1.8}
            />
          </button>
        </div>

        <div className="jcs-executive-command__content">
          <div className="jcs-executive-command__section">
            <p>
              Quick Action
            </p>

            <button
              type="button"
              onClick={
                onCreateBusiness
              }
            >
              <span>
                <Plus
                  size={18}
                  strokeWidth={1.8}
                />
              </span>

              <span>
                <strong>
                  Create New Business
                </strong>

                <small>
                  Start the Business Owner workflow
                </small>
              </span>

              <ChevronRight
                size={17}
                strokeWidth={1.8}
              />
            </button>
          </div>

          {matchingSections.length >
            0 && (
            <div className="jcs-executive-command__section">
              <p>
                Platform Sections
              </p>

              {matchingSections.map(
                (item) => {
                  const Icon =
                    item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        onSelectSection(
                          item.id
                        )
                      }
                    >
                      <span>
                        <Icon
                          size={18}
                          strokeWidth={1.8}
                        />
                      </span>

                      <span>
                        <strong>
                          {item.title}
                        </strong>

                        <small>
                          {item.subtitle}
                        </small>
                      </span>

                      <ChevronRight
                        size={17}
                        strokeWidth={1.8}
                      />
                    </button>
                  );
                }
              )}
            </div>
          )}

          {matchingClients.length >
            0 && (
            <div className="jcs-executive-command__section">
              <p>
                Business Owners
              </p>

              {matchingClients.map(
                (client) => (
                  <button
                    key={
                      client.businessID
                    }
                    type="button"
                    onClick={() =>
                      onSelectClient(
                        client
                      )
                    }
                  >
                    <span>
                      {businessInitials(
                        client.displayBusinessName
                      )}
                    </span>

                    <span>
                      <strong>
                        {client.displayBusinessName}
                      </strong>

                      <small>
                        {client.displayOwnerName}
                        {" • "}
                        {client.businessID}
                      </small>
                    </span>

                    <ChevronRight
                      size={17}
                      strokeWidth={1.8}
                    />
                  </button>
                )
              )}
            </div>
          )}

          {matchingSections.length ===
            0 &&
            matchingClients.length ===
              0 && (
              <ExecutiveEmptyState
                icon={
                  Search
                }
                title="No results found"
                message="No platform section or Business Owner matches your search."
              />
            )}
        </div>
      </section>
    </div>
  );
}