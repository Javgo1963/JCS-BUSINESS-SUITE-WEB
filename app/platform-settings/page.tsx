"use client";

/*
 * JCS Business Suite Web
 * app/platform-settings/page.tsx
 *
 * Route for global Platform Settings.
 *
 * Connects PlatformSettingsView with the shared
 * PlatformSettingsContext used by the official shell.
 */

import {
  useCallback,
} from "react";

import {
  useRouter,
} from "next/navigation";

import PlatformSettingsView from "@/features/platform-settings/PlatformSettingsView";

import {
  usePlatformSettingsContext,
} from "@/features/platform-settings/PlatformSettingsContext";

import type {
  PlatformSettingsRecord,
} from "@/features/platform-settings/PlatformSettingsTypes";

import {
  useBusinessContext,
} from "@/core/business-context/JCSBusinessContext";

// =======================================================
// MARK: - Page
// =======================================================

export default function PlatformSettingsPage() {
  const router =
    useRouter();

  const {
    firebaseUser,

    isLoading:
      businessContextIsLoading,
  } = useBusinessContext();

  const {
    actor,

    applyPlatformSettings,
    refreshPlatformSettings,

    isLoading:
      platformContextIsLoading,
  } = usePlatformSettingsContext();

  const currentUserUID =
    firebaseUser?.uid?.trim() ??
    "";

  // =====================================================
  // MARK: - Apply Saved Settings
  // =====================================================

  const handleSettingsSaved =
    useCallback(
      (
        savedSettings:
          PlatformSettingsRecord,
      ): void => {
        /*
         * Update the shared context immediately.
         *
         * This prevents the Dashboard from continuing
         * to use the previous logo or Accent Color.
         */
        applyPlatformSettings(
          savedSettings,
        );
      },
      [
        applyPlatformSettings,
      ],
    );

  // =====================================================
  // MARK: - Apply Uploaded Logo
  // =====================================================

  const handleLogoChanged =
    useCallback(
      (
        updatedSettings:
          PlatformSettingsRecord,
      ): void => {
        /*
         * Logo uploads update the same global settings
         * record, so the official shell must receive
         * the updated record immediately.
         */
        applyPlatformSettings(
          updatedSettings,
        );
      },
      [
        applyPlatformSettings,
      ],
    );

  // =====================================================
  // MARK: - Close
  // =====================================================

  const handleClose =
    useCallback(
      async (): Promise<void> => {
        /*
         * Verify the latest Firestore state before
         * returning to the Dashboard.
         */
        await refreshPlatformSettings();

        router.push(
          "/dashboard",
        );
      },
      [
        refreshPlatformSettings,
        router,
      ],
    );

  // =====================================================
  // MARK: - Loading
  // =====================================================

  if (
    businessContextIsLoading ||
    platformContextIsLoading
  ) {
    return (
      <main className="jcs-platform-settings-route-loading">
        <strong>
          Preparing Platform Settings…
        </strong>
      </main>
    );
  }

  // =====================================================
  // MARK: - View
  // =====================================================

  return (
    <main className="jcs-platform-settings-route">
      <PlatformSettingsView
        actor={
          actor
        }
        currentUserUID={
          currentUserUID
        }
        onSettingsSaved={
          handleSettingsSaved
        }
        onLogoChanged={
          handleLogoChanged
        }
        onClose={() => {
          void handleClose();
        }}
      />
    </main>
  );
}