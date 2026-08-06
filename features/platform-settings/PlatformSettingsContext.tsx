"use client";

/*
 * JCS Business Suite Web
 * PlatformSettingsContext.tsx
 *
 * Global runtime context for the official JCS Business Suite
 * platform identity.
 *
 * Responsibilities:
 *
 * - Load platformSettings/global once for PlatformAdmin.
 * - Expose the official platform name and tagline.
 * - Expose the official platform logo.
 * - Expose the global Platform Accent Color.
 * - Support immediate Accent Color updates in the interface.
 * - Refresh the global settings after saving or uploading a logo.
 *
 * This context does not use:
 *
 * - businessID
 * - ownerUID
 * - businessSettings/{businessID}
 *
 * It must be rendered inside JCSBusinessContextProvider.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  useBusinessContext,
} from "@/core/business-context/JCSBusinessContext";

import {
  fetchPlatformSettings,
} from "./PlatformSettingsFirestoreService";

import {
  normalizePlatformSettingsActor,
} from "./PlatformSettingsDomain";

import {
  createDefaultPlatformSettingsRecord,
} from "./PlatformSettingsTypes";

import type {
  AppAccentColorName,
  AppLanguageCode,
} from "../app-settings/AppSettingsTypes";

import type {
  PlatformSettingsActor,
  PlatformSettingsRecord,
} from "./PlatformSettingsTypes";

// =======================================================
// MARK: - Context Value
// =======================================================

export interface PlatformSettingsContextValue {
  settings:
    PlatformSettingsRecord;

  actor:
    PlatformSettingsActor;

  platformName:
    string;

  platformTagline:
    string;

  platformLogoDownloadURL:
    string;

  platformAccentColorName:
    AppAccentColorName;

  platformLanguageCode:
    AppLanguageCode;

  hasCustomPlatformLogo:
    boolean;

  isPlatformAdministrator:
    boolean;

  isLoading:
    boolean;

  errorMessage:
    string;

  setPlatformAccentColor:
    (
      accentColorName:
        AppAccentColorName
    ) => void;

  applyPlatformSettings:
    (
      settings:
        PlatformSettingsRecord
    ) => void;

  refreshPlatformSettings:
    () => Promise<void>;
}

const PlatformSettingsContext =
  createContext<
    PlatformSettingsContextValue | null
  >(
    null,
  );

// =======================================================
// MARK: - Helpers
// =======================================================

function cleanText(
  value:
    | string
    | null
    | undefined,
): string {
  return value?.trim() ?? "";
}

// =======================================================
// MARK: - Provider
// =======================================================

export function PlatformSettingsContextProvider({
  children,
}: {
  children:
    ReactNode;
}) {
  const {
    firebaseUser,
    appUser,
    isPlatformAdministrator,
    isLoading:
      businessContextIsLoading,
  } =
    useBusinessContext();

  const currentUserUID =
    cleanText(
      firebaseUser?.uid,
    );

  const actor =
    useMemo<PlatformSettingsActor>(
      () =>
        normalizePlatformSettingsActor({
          firebaseUID:
            currentUserUID,

          role:
            appUser?.roleRawValue ??
            appUser?.role ??
            "",

          isPlatformAdministrator,

          canManagePlatformSettings:
            isPlatformAdministrator,
        }),
      [
        appUser?.role,
        appUser?.roleRawValue,
        currentUserUID,
        isPlatformAdministrator,
      ],
    );

  const [
    settings,
    setSettings,
  ] =
    useState<PlatformSettingsRecord>(
      () =>
        createDefaultPlatformSettingsRecord(),
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(
      true,
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const mountedReference =
    useRef(
      true,
    );

  const activeLoadID =
    useRef(
      0,
    );

  // =====================================================
  // MARK: - Mounted State
  // =====================================================

  useEffect(() => {
    mountedReference.current =
      true;

    return () => {
      mountedReference.current =
        false;
    };
  }, []);

  // =====================================================
  // MARK: - Apply Settings
  // =====================================================

  const applyPlatformSettings =
    useCallback(
      (
        nextSettings:
          PlatformSettingsRecord,
      ): void => {
        setSettings(
          nextSettings,
        );

        setErrorMessage(
          "",
        );
      },
      [],
    );

  // =====================================================
  // MARK: - Accent Color Preview
  // =====================================================

  const setPlatformAccentColor =
    useCallback(
      (
        accentColorName:
          AppAccentColorName,
      ): void => {
        setSettings(
          (
            currentSettings
          ) => {
            if (
              currentSettings
                .accentColorName ===
              accentColorName
            ) {
              return currentSettings;
            }

            return {
              ...currentSettings,

              accentColorName,
            };
          },
        );
      },
      [],
    );

  // =====================================================
  // MARK: - Load Platform Settings
  // =====================================================

  const refreshPlatformSettings =
    useCallback(
      async (): Promise<void> => {
        const loadID =
          activeLoadID.current +
          1;

        activeLoadID.current =
          loadID;

        /*
         * Business users do not need the global Platform
         * Settings document for their tenant workspace.
         */
        if (
          !actor
            .isPlatformAdministrator
        ) {
          if (
            mountedReference.current
          ) {
            setSettings(
              createDefaultPlatformSettingsRecord(),
            );

            setErrorMessage(
              "",
            );

            setIsLoading(
              false,
            );
          }

          return;
        }

        if (
          !actor.firebaseUID
        ) {
          if (
            mountedReference.current
          ) {
            setErrorMessage(
              "The Platform Administrator identity is not available.",
            );

            setIsLoading(
              false,
            );
          }

          return;
        }

        setIsLoading(
          true,
        );

        setErrorMessage(
          "",
        );

        try {
          const loadedSettings =
            await fetchPlatformSettings(
              actor,
            );

          if (
            !mountedReference.current ||
            activeLoadID.current !==
              loadID
          ) {
            return;
          }

          setSettings(
            loadedSettings,
          );
        } catch (
          error: unknown
        ) {
          if (
            !mountedReference.current ||
            activeLoadID.current !==
              loadID
          ) {
            return;
          }

          console.error(
            "Unable to load global Platform Settings:",
            error,
          );

          setErrorMessage(
            error instanceof Error &&
            error.message.trim()
              ? error.message
              : "The global Platform Settings could not be loaded.",
          );
        } finally {
          if (
            mountedReference.current &&
            activeLoadID.current ===
              loadID
          ) {
            setIsLoading(
              false,
            );
          }
        }
      },
      [
        actor,
      ],
    );

  // =====================================================
  // MARK: - Automatic Load
  // =====================================================

  useEffect(() => {
    if (
      businessContextIsLoading
    ) {
      return;
    }

    void refreshPlatformSettings();
  }, [
    businessContextIsLoading,
    refreshPlatformSettings,
  ]);

  // =====================================================
  // MARK: - Context Value
  // =====================================================

  const value =
    useMemo<PlatformSettingsContextValue>(
      () => ({
        settings,

        actor,

        platformName:
          cleanText(
            settings.platformName,
          ) ||
          "JCS Business Suite",

        platformTagline:
          cleanText(
            settings.tagline,
          ) ||
          "One Platform | Every Business | Endless Possibilities",

        platformLogoDownloadURL:
          cleanText(
            settings.logoDownloadURL,
          ),

        platformAccentColorName:
          settings.accentColorName,

        platformLanguageCode:
          settings.languageCode,

        hasCustomPlatformLogo:
          settings.hasCustomLogo ===
          true &&
          Boolean(
            cleanText(
              settings.logoDownloadURL,
            ),
          ),

        isPlatformAdministrator:
          actor.isPlatformAdministrator,

        isLoading,

        errorMessage,

        setPlatformAccentColor,

        applyPlatformSettings,

        refreshPlatformSettings,
      }),
      [
        actor,
        applyPlatformSettings,
        errorMessage,
        isLoading,
        refreshPlatformSettings,
        setPlatformAccentColor,
        settings,
      ],
    );

  return (
    <PlatformSettingsContext.Provider
      value={
        value
      }
    >
      {children}
    </PlatformSettingsContext.Provider>
  );
}

// =======================================================
// MARK: - Hook
// =======================================================

export function usePlatformSettingsContext():
  PlatformSettingsContextValue {
  const context =
    useContext(
      PlatformSettingsContext,
    );

  if (!context) {
    throw new Error(
      "usePlatformSettingsContext must be used inside PlatformSettingsContextProvider.",
    );
  }

  return context;
}