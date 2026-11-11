/*
 * JCS Business Suite Web
 * OfficialJCSLogoRegistry.ts
 *
 * Permanent registry for the 8 global JCS Business Suite
 * official logo holders.
 *
 * PlatformAdmin controls the files.
 * Business Owners only select among the available slots.
 */

import type {
  OfficialJCSLogoDefinition,
  OfficialJCSLogoID,
  OfficialJCSLogoSlot,
} from "./OfficialJCSLogoTypes";

// =======================================================
// MARK: - Global Storage
// =======================================================

export const OFFICIAL_JCS_LOGO_STORAGE_ROOT =
  "platform/global";

export const OFFICIAL_JCS_LOGO_COUNT =
  8 as const;

export const DEFAULT_OFFICIAL_JCS_LOGO_ID:
  OfficialJCSLogoID =
    "official-jcs-logo-2";

// =======================================================
// MARK: - Path Builder
// =======================================================

export function buildOfficialJCSLogoStoragePath(
  slot: OfficialJCSLogoSlot,
): string {
  return `${OFFICIAL_JCS_LOGO_STORAGE_ROOT}/official-jcs-logo-${slot}.png`;
}

// =======================================================
// MARK: - Permanent Registry
// =======================================================

export const OFFICIAL_JCS_LOGOS:
  readonly OfficialJCSLogoDefinition[] =
[
  {
    id: "official-jcs-logo-1",
    slot: 1,
    title: "Official Logo 1",
    storagePath:
      buildOfficialJCSLogoStoragePath(1),
    isAvailable: true,
  },
  {
    id: "official-jcs-logo-2",
    slot: 2,
    title: "Official Logo 2",
    storagePath:
      buildOfficialJCSLogoStoragePath(2),
    isAvailable: true,
  },
  {
    id: "official-jcs-logo-3",
    slot: 3,
    title: "Official Logo 3",
    storagePath:
      buildOfficialJCSLogoStoragePath(3),
    isAvailable: true,
  },
  {
    id: "official-jcs-logo-4",
    slot: 4,
    title: "Official Logo 4",
    storagePath:
      buildOfficialJCSLogoStoragePath(4),
    isAvailable: true,
  },
  {
    id: "official-jcs-logo-5",
    slot: 5,
    title: "Official Logo 5",
    storagePath:
      buildOfficialJCSLogoStoragePath(5),
    isAvailable: true,
  },
  {
    id: "official-jcs-logo-6",
    slot: 6,
    title: "Official Logo 6",
    storagePath:
      buildOfficialJCSLogoStoragePath(6),
    isAvailable: true,
  },
  {
    id: "official-jcs-logo-7",
    slot: 7,
    title: "Official Logo 7",
    storagePath:
      buildOfficialJCSLogoStoragePath(7),
    isAvailable: true,
  },
  {
    id: "official-jcs-logo-8",
    slot: 8,
    title: "Official Logo 8",
    storagePath:
      buildOfficialJCSLogoStoragePath(8),
    isAvailable: true,
  },
] as const;

// =======================================================
// MARK: - Lookup
// =======================================================

export function officialJCSLogoForID(
  logoID:
    OfficialJCSLogoID | string | null | undefined,
): OfficialJCSLogoDefinition | null {
  if (!logoID) {
    return null;
  }

  return (
    OFFICIAL_JCS_LOGOS.find(
      (logo) =>
        logo.id === logoID,
    ) ??
    null
  );
}

export function officialJCSLogoForSlot(
  slot:
    OfficialJCSLogoSlot,
): OfficialJCSLogoDefinition {
  const logo =
    OFFICIAL_JCS_LOGOS.find(
      (candidate) =>
        candidate.slot === slot,
    );

  if (!logo) {
    throw new Error(
      `Official JCS logo slot ${slot} is not registered.`,
    );
  }

  return logo;
}
