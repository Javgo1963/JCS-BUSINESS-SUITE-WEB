"use client";

import {
  Bell,
  ChevronRight,
  CircleUserRound,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import DashboardIcon from
  "@/features/dashboard/DashboardIcon";

import DashboardLiveStatus from
  "@/features/dashboard/DashboardLiveStatus";

import JCSUserAvatarPicker from
  "@/components/app-shell/JCSUserAvatarPicker";

import type {
  JCSOfficialShellProps,
  JCSShellStyle,
} from "./JCSShellTypes";

import "@/features/dashboard/DashboardView.css";

// =======================================================
// MARK: - Official Shell
// =======================================================

export default function JCSOfficialShell({
  children,

  workspaceTitle,

  accentName,
  accentColorCSS,
  appearance,

  identity,
  user,

  navigationItems,
  moduleItems,

  commandPalette,
  actions,
  liveStatus,

  visibleModuleCount,

  isSigningOut = false,

  settingsOverlay,
}: JCSOfficialShellProps) {
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
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    profileMenuOpen,
    setProfileMenuOpen,
  ] = useState(false);

  // =====================================================
  // MARK: - Command Search
  // =====================================================

  const visibleCommandItems =
    useMemo(() => {
      const normalizedQuery =
        searchQuery
          .trim()
          .toLowerCase();

      if (!normalizedQuery) {
        return commandPalette.items;
      }

      return commandPalette.items.filter(
        (item) => {
          const searchableText = [
            item.title,
            item.subtitle ?? "",
          ]
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            normalizedQuery
          );
        }
      );
    }, [
      commandPalette.items,
      searchQuery,
    ]);

  // =====================================================
  // MARK: - Keyboard Shortcuts
  // =====================================================

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ): void {
      const opensCommandPalette =
        (event.metaKey ||
          event.ctrlKey) &&
        event.key.toLowerCase() ===
          "k";

      if (opensCommandPalette) {
        event.preventDefault();

        setSearchOpen(true);

        return;
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setProfileMenuOpen(false);
        setSidebarOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery("");
    }
  }, [
    searchOpen,
  ]);

  // =====================================================
  // MARK: - Navigation Helpers
  // =====================================================

  function closeTransientUI(): void {
    setSidebarOpen(false);
    setProfileMenuOpen(false);
    setSearchOpen(false);
  }

  function openDashboard(): void {
    closeTransientUI();
    actions.onOpenDashboard();
  }

  function openNavigationItem(
    onSelect:
      (() => void) |
      undefined
  ): void {
    closeTransientUI();
    onSelect?.();
  }

  function openModule(
    onSelect: () => void
  ): void {
    closeTransientUI();
    onSelect();
  }

  function openSettings(): void {
    closeTransientUI();
    actions.onOpenSettings();
  }

  function openAccount(): void {
    closeTransientUI();
    actions.onOpenAccount();
  }

  function openExecutiveCenter(): void {
    closeTransientUI();
    actions
      .onOpenExecutiveCenter
      ?.();
  }

  function openNotifications(): void {
    closeTransientUI();
    actions
      .onOpenNotifications
      ?.();
  }

  async function handleSignOut(): Promise<void> {
    closeTransientUI();

    await actions.onSignOut();
  }

  // =====================================================
  // MARK: - Shell View
  // =====================================================

  return (
    <div
      className="jcs-dashboard-shell"
      data-accent={
        accentName
      }
      data-theme={
        appearance
      }
      data-platform-access={
        identity.isPlatform
          ? "true"
          : "false"
      }
      style={
  {
    "--jcs-visible-module-count":
      visibleModuleCount,

    "--jcs-accent":
      accentColorCSS,
  } as JCSShellStyle
}
    >
      {/* ================================================
          MARK: - Mobile Sidebar Backdrop
      ================================================ */}

      {sidebarOpen && (
        <button
          type="button"
          className="jcs-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* ================================================
          MARK: - Official Sidebar
      ================================================ */}

      <aside
        className={[
          "jcs-sidebar",

          sidebarOpen
            ? "jcs-sidebar--open"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label="JCS Business Suite navigation"
      >
        <div className="jcs-sidebar__top">
          <button
            type="button"
            className="jcs-sidebar__close"
            aria-label="Close navigation"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            <X
              size={21}
              strokeWidth={1.8}
            />
          </button>

          <button
            type="button"
            className="jcs-brand"
            aria-label="Open Dashboard"
            onClick={
              openDashboard
            }
          >
            <div
              className="jcs-brand__mark"
              aria-hidden="true"
            >
              <span>
                J
              </span>
            </div>

            <div className="jcs-brand__text">
              <strong>
                JCS
              </strong>

              <span>
                Business Suite
              </span>
            </div>
          </button>
        </div>

        {/* Active Platform / Business Identity */}

        <section
          className="jcs-sidebar__business"
          aria-label="Current workspace"
        >
          <div className="jcs-sidebar__business-logo">
            {identity.logoNode ? (
              identity.logoNode
            ) : identity.logoDownloadURL ? (
              <img
                src={
                  identity
                    .logoDownloadURL
                }
                alt={
                  identity.name
                }
                className="jcs-sidebar__platform-logo-image"
              />
            ) : (
              <span
                aria-hidden="true"
              >
                {identity.name
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}
          </div>

          <div className="jcs-sidebar__business-copy">
            <strong>
              {identity.name}
            </strong>

            <span>
              {identity.subtitle}
            </span>
          </div>

          <span
            className="jcs-sidebar__business-status"
            title="Workspace active"
            aria-label="Workspace active"
          />
        </section>

        {/* Primary Navigation */}

        <nav
          className="jcs-sidebar__navigation"
          aria-label="Primary navigation"
        >
          <p className="jcs-sidebar__label">
            Workspace
          </p>

          {navigationItems
            .filter(
              (item) =>
                item.isVisible !== false
            )
            .map((item) => {
              const Icon =
                item.icon;

              return (
                <button
                  key={
                    item.id
                  }
                  type="button"
                  className={[
                    "jcs-sidebar__link",

                    item.isActive
                      ? "jcs-sidebar__link--active"
                      : "",

                    item.isExecutive
                      ? "jcs-sidebar__link--executive"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-current={
                    item.isActive
                      ? "page"
                      : undefined
                  }
                  onClick={() =>
                    openNavigationItem(
                      item.onSelect
                    )
                  }
                >
                  <span className="jcs-sidebar__link-icon">
                    <Icon
                      size={19}
                      strokeWidth={1.8}
                    />
                  </span>

                  <span className="jcs-sidebar__link-title">
                    {item.title}
                  </span>

                  {item.badge !==
                    undefined &&
                    item.badge !==
                      null && (
                      <span className="jcs-sidebar__link-badge">
                        {item.badge}
                      </span>
                    )}

                  {item.isExecutive && (
                    <ChevronRight
                      className="jcs-sidebar__link-arrow"
                      size={15}
                      strokeWidth={1.8}
                    />
                  )}
                </button>
              );
            })}

          {moduleItems.length >
            0 && (
            <>
              <div className="jcs-sidebar__section-divider" />

              <p className="jcs-sidebar__label jcs-sidebar__label--modules">
                Modules
              </p>

              {moduleItems.map(
                (module) => (
                  <button
                    key={
                      module.id
                    }
                    type="button"
                    className={[
                      "jcs-sidebar__link",

                      module.isActive
                        ? "jcs-sidebar__link--active"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      openModule(
                        module.onSelect
                      )
                    }
                  >
                    <span className="jcs-sidebar__link-icon">
                      <DashboardIcon
                        name={
                          module.iconName
                        }
                        size={18}
                        strokeWidth={
                          1.8
                        }
                      />
                    </span>

                    <span className="jcs-sidebar__link-title">
                      {module.title}
                    </span>

                    <ChevronRight
                      className="jcs-sidebar__link-arrow"
                      size={15}
                      strokeWidth={1.8}
                    />
                  </button>
                )
              )}
            </>
          )}
        </nav>

        {/* Sidebar Footer */}

        <div className="jcs-sidebar__footer">
          <JCSUserAvatarPicker
            firebaseUID={
              user.firebaseUID
            }
            displayName={
              user.displayName
            }
            imageURL={
              user.imageURL
            }
            size="small"
            onUpdated={
              actions
                .onUserAvatarUpdated
            }
          />

          <button
            type="button"
            className="jcs-sidebar__sign-out"
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

            <span>
              {isSigningOut
                ? "Signing out…"
                : "Sign Out"}
            </span>
          </button>
        </div>
      </aside>

      {/* ================================================
          MARK: - Main Workspace
      ================================================ */}

      <main className="jcs-dashboard-main">
        {/* Official Toolbar */}

        <header className="jcs-toolbar">
          <div className="jcs-toolbar__leading">
            <button
              type="button"
              className="jcs-icon-button jcs-toolbar__menu"
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

            <div className="jcs-toolbar__title">
              <span>
                Workspace
              </span>

              <strong>
                {workspaceTitle}
              </strong>
            </div>
          </div>

          <div className="jcs-toolbar__actions">
            {liveStatus && (
              <DashboardLiveStatus
                compact
                isLoading={
                  liveStatus
                    .isLoading
                }
                errorMessage={
                  liveStatus
                    .errorMessage
                }
                refreshedAt={
                  liveStatus
                    .refreshedAt
                }
                languageCode={
                  liveStatus
                    .languageCode
                }
                onRefresh={
                  liveStatus
                    .onRefresh
                }
              />
            )}

            <button
              type="button"
              className="jcs-toolbar__search"
              aria-label="Search modules and actions"
              onClick={() =>
                setSearchOpen(true)
              }
            >
              <Search
                size={18}
                strokeWidth={1.8}
              />

              <span>
                Search modules and actions
              </span>

              <kbd>
                ⌘ K
              </kbd>
            </button>

            <button
              type="button"
              className="jcs-icon-button"
              aria-label={
                appearance ===
                "dark"
                  ? "Use light appearance"
                  : "Use dark appearance"
              }
              title={
                appearance ===
                "dark"
                  ? "Light appearance"
                  : "Dark appearance"
              }
              onClick={
                actions
                  .onToggleAppearance
              }
            >
              {appearance ===
              "dark" ? (
                <Sun
                  size={19}
                  strokeWidth={1.8}
                />
              ) : (
                <Moon
                  size={19}
                  strokeWidth={1.8}
                />
              )}
            </button>

            <button
              type="button"
              className="jcs-icon-button jcs-notification-button"
              aria-label="Notifications"
              title="Notifications"
              onClick={
                openNotifications
              }
            >
              <Bell
                size={19}
                strokeWidth={1.8}
              />

              <span
                className="jcs-notification-button__dot"
                aria-hidden="true"
              />
            </button>

            {/* Profile Menu */}

            <div className="jcs-profile-menu">
              <button
                type="button"
                className="jcs-profile-button"
                aria-expanded={
                  profileMenuOpen
                }
                aria-haspopup="menu"
                onClick={() =>
                  setProfileMenuOpen(
                    (current) =>
                      !current
                  )
                }
              >
                <JCSUserAvatarPicker
                  firebaseUID={
                    user.firebaseUID
                  }
                  displayName={
                    user.displayName
                  }
                  imageURL={
                    user.imageURL
                  }
                  size="medium"
                  onUpdated={
                    actions
                      .onUserAvatarUpdated
                  }
                />

                <span className="jcs-profile-button__copy">
                  <strong>
                    {user.firstName}
                  </strong>

                  <small>
                    {user.role}
                  </small>
                </span>
              </button>

              {profileMenuOpen && (
                <div
                  className="jcs-profile-popover"
                  role="menu"
                  aria-label="User menu"
                >
                  <div className="jcs-profile-popover__identity">
                    <JCSUserAvatarPicker
                      firebaseUID={
                        user.firebaseUID
                      }
                      displayName={
                        user.displayName
                      }
                      imageURL={
                        user.imageURL
                      }
                      size="medium"
                      onUpdated={
                        actions
                          .onUserAvatarUpdated
                      }
                    />

                    <div className="jcs-profile-popover__identity-copy">
                      <strong>
                        {user.displayName}
                      </strong>

                      <span>
                        {user.email ??
                          user.role}
                      </span>
                    </div>
                  </div>

                  <div className="jcs-profile-popover__divider" />

                  {identity.isPlatform &&
                    actions
                      .onOpenExecutiveCenter && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={
                          openExecutiveCenter
                        }
                      >
                        <Sparkles
                          size={17}
                          strokeWidth={
                            1.8
                          }
                        />

                        <span>
                          Executive Center
                        </span>
                      </button>
                    )}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={
                      openAccount
                    }
                  >
                    <CircleUserRound
                      size={17}
                      strokeWidth={1.8}
                    />

                    <span>
                      Account
                    </span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={
                      openSettings
                    }
                  >
                    <Settings
                      size={17}
                      strokeWidth={1.8}
                    />

                    <span>
                      {identity.isPlatform
                        ? "Platform Settings"
                        : "App Settings"}
                    </span>
                  </button>

                  <div className="jcs-profile-popover__divider" />

                  <button
                    type="button"
                    role="menuitem"
                    className="jcs-profile-popover__danger"
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

                    <span>
                      {isSigningOut
                        ? "Signing out…"
                        : "Sign Out"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Screen Content */}

        <div className="jcs-dashboard-scroll">
          <div className="jcs-dashboard-content">
            {children}
          </div>
        </div>
      </main>

      {/* Optional Settings Overlay */}

      {settingsOverlay}

      {/* ================================================
          MARK: - Command Palette
      ================================================ */}

      {searchOpen && (
        <div
          className="jcs-command-overlay"
          role="presentation"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSearchOpen(false);
            }
          }}
        >
          <div
            className="jcs-command-palette"
            role="dialog"
            aria-modal="true"
            aria-label="Search JCS Business Suite"
          >
            <div className="jcs-command-palette__search">
              <Search
                size={20}
                strokeWidth={1.8}
              />

              <input
                autoFocus
                type="search"
                value={
                  searchQuery
                }
                placeholder="Search modules and actions…"
                aria-label="Search modules and actions"
                onChange={(
                  event
                ) =>
                  setSearchQuery(
                    event
                      .target
                      .value
                  )
                }
              />

              <button
                type="button"
                aria-label="Close search"
                onClick={() =>
                  setSearchOpen(false)
                }
              >
                <X
                  size={18}
                  strokeWidth={1.8}
                />
              </button>
            </div>

            <div className="jcs-command-palette__header">
              <div>
                <p className="jcs-eyebrow">
                  {commandPalette
                    .subtitle ??
                    "Command Center"}
                </p>

                <h2>
                  {commandPalette
                    .title ??
                    "Suggested modules"}
                </h2>
              </div>

              <span>
                {
                  visibleCommandItems
                    .length
                }
                {" "}
                available
              </span>
            </div>

            <div className="jcs-command-palette__content">
              {visibleCommandItems
                .length > 0 ? (
                visibleCommandItems.map(
                  (item) => (
                    <button
                      key={
                        item.id
                      }
                      type="button"
                      onClick={() => {
                        setSearchOpen(
                          false
                        );

                        item.onSelect();
                      }}
                    >
                      <span>
                        <span className="jcs-command-palette__module-icon">
                          <DashboardIcon
                            name={
                              item.iconName
                            }
                            size={19}
                            strokeWidth={
                              1.8
                            }
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
                      </span>

                      <ChevronRight
                        size={17}
                        strokeWidth={1.8}
                      />
                    </button>
                  )
                )
              ) : (
                <div className="jcs-command-palette__empty">
                  <Search
                    size={24}
                    strokeWidth={1.6}
                  />

                  <strong>
                    {commandPalette
                      .emptyTitle ??
                      "No matching modules"}
                  </strong>

                  <span>
                    {commandPalette
                      .emptyMessage ??
                      "Try another module or action name."}
                  </span>
                </div>
              )}
            </div>

            <div className="jcs-command-palette__footer">
              <span>
                Use the sidebar or search
                to open any available
                module.
              </span>

              <kbd>
                ESC
              </kbd>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}