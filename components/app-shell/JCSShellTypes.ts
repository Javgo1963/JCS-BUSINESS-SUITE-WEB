import type {
  ComponentType,
  CSSProperties,
  ReactNode,
} from "react";

/*
 * JCS Business Suite Web
 * JCSShellTypes.ts
 *
 * Shared contracts for the official authenticated
 * workspace shell.
 *
 * This file must not contain React state, Firebase
 * operations, navigation side effects, or UI markup.
 */

// =======================================================
// MARK: - Shell Appearance
// =======================================================

export type JCSShellAppearance =
  | "light"
  | "dark";

export interface JCSShellStyle
  extends CSSProperties {
  "--jcs-accent"?:
    string;

  "--jcs-visible-module-count"?:
    number;
}

// =======================================================
// MARK: - Icon
// =======================================================

export type JCSShellIcon =
  ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;

// =======================================================
// MARK: - Navigation
// =======================================================

export interface JCSShellNavigationItem {
  id:
    string;

  title:
    string;

  path:
    string;

  icon:
    JCSShellIcon;

  isActive?:
    boolean;

  isExecutive?:
    boolean;

  isVisible?:
    boolean;

  badge?:
    string | number | null;

  onSelect?:
    () => void;
}

export interface JCSShellModuleItem {
  id:
    string;

  title:
    string;

  subtitle?:
    string;

  iconName:
    string;

  path?:
    string;

  isActive?:
    boolean;

  onSelect:
    () => void;
}

// =======================================================
// MARK: - Active Identity
// =======================================================

export interface JCSShellIdentity {
  name:
    string;

  subtitle:
    string;

  tagline?:
    string;

  logoDownloadURL?:
    string;

  logoNode?:
    ReactNode;

  isLoading?:
    boolean;

  isPlatform:
    boolean;
}

// =======================================================
// MARK: - Current User
// =======================================================

export interface JCSShellUser {
  firebaseUID:
    string;

  firstName:
    string;

  displayName:
    string;

  email?:
    string;

  role:
    string;

  imageURL?:
    string;
}

// =======================================================
// MARK: - Live Status
// =======================================================

export interface JCSShellLiveStatus {
  isLoading:
    boolean;

  errorMessage?:
    string | null;

  refreshedAt?:
    Date | null;

  languageCode:
    string;

  onRefresh:
    () => void | Promise<void>;
}

// =======================================================
// MARK: - Command Palette
// =======================================================

export interface JCSShellCommandItem {
  id:
    string;

  title:
    string;

  subtitle?:
    string;

  iconName:
    string;

  onSelect:
    () => void;
}

export interface JCSShellCommandPalette {
  items:
    readonly JCSShellCommandItem[];

  title?:
    string;

  subtitle?:
    string;

  emptyTitle?:
    string;

  emptyMessage?:
    string;
}

// =======================================================
// MARK: - Shell Actions
// =======================================================

export interface JCSShellActions {
  onOpenDashboard:
    () => void;

  onOpenAccount:
    () => void;

  onOpenSettings:
    () => void;

 onToggleAppearance:
    () => void;

  onOpenExecutiveCenter?:
    () => void;

  onOpenNotifications?:
    () => void;

  onSignOut:
    () => void | Promise<void>;

  onUserAvatarUpdated?:
    () => void | Promise<void>;
}

// =======================================================
// MARK: - Official Shell Props
// =======================================================

export interface JCSOfficialShellProps {
  children:
    ReactNode;

  workspaceTitle:
    string;

  accentName:
    string;

  accentColorCSS:
    string;

  appearance:
    JCSShellAppearance;

  identity:
    JCSShellIdentity;

  user:
    JCSShellUser;

  navigationItems:
    readonly JCSShellNavigationItem[];

  moduleItems:
    readonly JCSShellModuleItem[];

  commandPalette:
    JCSShellCommandPalette;

  actions:
    JCSShellActions;

  liveStatus?:
    JCSShellLiveStatus;

  visibleModuleCount:
    number;

  isSigningOut?:
    boolean;

  settingsOverlay?:
    ReactNode;
}