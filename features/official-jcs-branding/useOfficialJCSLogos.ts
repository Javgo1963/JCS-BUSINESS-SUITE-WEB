"use client";

/*
 * JCS Business Suite Web
 * useOfficialJCSLogos.ts
 *
 * Client state for the 8 official JCS Business Suite logo slots.
 *
 * This hook is intentionally independent from useBusinessLogo.
 * Sofia and customer-uploaded logos belong to the business-custom
 * branding system, not the official JCS platform logo library.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DEFAULT_OFFICIAL_JCS_LOGO_ID,
} from "./OfficialJCSLogoRegistry";

import {
  resolveOfficialJCSLogoLibrary,
  resolvedOfficialJCSLogoForID,
} from "./OfficialJCSLogoStorageService";

import type {
  ResolvedOfficialJCSLogo,
} from "./OfficialJCSLogoStorageService";

import type {
  OfficialJCSLogoID,
} from "./OfficialJCSLogoTypes";

// =======================================================
// MARK: - Hook Result
// =======================================================

export interface UseOfficialJCSLogosResult {
  logos:
    readonly ResolvedOfficialJCSLogo[];

  isLoading:
    boolean;

  errorMessage:
    string;

  selectedLogoID:
    OfficialJCSLogoID;

  selectedLogo:
    ResolvedOfficialJCSLogo | null;

  setSelectedLogoID:
    (
      logoID:
        OfficialJCSLogoID,
    ) => void;

  reload:
    () => Promise<void>;
}

// =======================================================
// MARK: - Hook
// =======================================================

export function useOfficialJCSLogos(
  initialLogoID:
    OfficialJCSLogoID =
      DEFAULT_OFFICIAL_JCS_LOGO_ID,
): UseOfficialJCSLogosResult {
  const [
    logos,
    setLogos,
  ] =
    useState<
      ResolvedOfficialJCSLogo[]
    >([]);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    selectedLogoID,
    setSelectedLogoID,
  ] =
    useState<OfficialJCSLogoID>(
      initialLogoID,
    );

  const reload =
    useCallback(
      async () => {
        setIsLoading(true);
        setErrorMessage("");

        try {
          const resolved =
            await resolveOfficialJCSLogoLibrary();

          setLogos(
            resolved,
          );
        } catch (
          error: unknown
        ) {
          console.error(
            "Official JCS logo library load failed:",
            error,
          );

          setErrorMessage(
            "The official JCS logo library could not be loaded.",
          );
        } finally {
          setIsLoading(false);
        }
      },
      [],
    );

  useEffect(
    () => {
      void reload();
    },
    [
      reload,
    ],
  );

  const selectedLogo =
    useMemo(
      () =>
        resolvedOfficialJCSLogoForID(
          logos,
          selectedLogoID,
        ),
      [
        logos,
        selectedLogoID,
      ],
    );

  return {
    logos,

    isLoading,
    errorMessage,

    selectedLogoID,
    selectedLogo,

    setSelectedLogoID,

    reload,
  };
}

export default useOfficialJCSLogos;
