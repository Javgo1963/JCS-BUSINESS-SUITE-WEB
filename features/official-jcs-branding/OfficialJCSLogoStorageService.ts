/*
 * JCS Business Suite Web
 * OfficialJCSLogoStorageService.ts
 *
 * Read-only resolver for the 8 global official JCS Business Suite logos.
 *
 * Business Owners:
 * - may read the official logo files.
 * - may not upload, replace or delete them.
 *
 * PlatformAdmin write operations will be added separately.
 */

import {
  FirebaseStorage,
  getDownloadURL,
  getStorage,
  ref,
} from "firebase/storage";

import {
  OFFICIAL_JCS_LOGOS,
} from "./OfficialJCSLogoRegistry";

import type {
  OfficialJCSLogoDefinition,
  OfficialJCSLogoID,
} from "./OfficialJCSLogoTypes";

// =======================================================
// MARK: - Resolved Model
// =======================================================

export interface ResolvedOfficialJCSLogo
  extends OfficialJCSLogoDefinition {
  downloadURL:
    string;

  isAvailable:
    boolean;

  errorMessage?:
    string;
}

// =======================================================
// MARK: - Resolve Single Logo
// =======================================================

export async function resolveOfficialJCSLogo(
  logo:
    OfficialJCSLogoDefinition,
  storage?: FirebaseStorage,
): Promise<ResolvedOfficialJCSLogo> {
  try {
    const downloadURL =
      await getDownloadURL(
        ref(
          storage ?? getStorage(),
          logo.storagePath,
        ),
      );

    return {
      ...logo,

      downloadURL,

      isAvailable:
        Boolean(
          downloadURL.trim(),
        ),

      errorMessage:
        "",
    };
  } catch {
    /*
     * Empty official holders are valid while PlatformAdmin
     * is still mounting the official artwork.
     *
     * A missing file should therefore not crash App Settings.
     */
    return {
      ...logo,

      downloadURL:
        "",

      isAvailable:
        false,

      errorMessage:
        "",
    };
  }
}

// =======================================================
// MARK: - Resolve Complete Registry
// =======================================================

export async function resolveOfficialJCSLogoLibrary(
  storage?: FirebaseStorage,
): Promise<ResolvedOfficialJCSLogo[]> {
  return Promise.all(
    OFFICIAL_JCS_LOGOS.map(
      (logo) =>
        resolveOfficialJCSLogo(
          logo,
          storage,
        ),
    ),
  );
}

// =======================================================
// MARK: - Lookup
// =======================================================

export function resolvedOfficialJCSLogoForID(
  logos:
    readonly ResolvedOfficialJCSLogo[],
  logoID:
    OfficialJCSLogoID | string | null | undefined,
): ResolvedOfficialJCSLogo | null {
  if (!logoID) {
    return null;
  }

  return (
    logos.find(
      (logo) =>
        logo.id === logoID,
    ) ??
    null
  );
}
