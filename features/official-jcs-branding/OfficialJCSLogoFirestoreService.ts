/*
 * JCS Business Suite Web
 * OfficialJCSLogoFirestoreService.ts
 *
 * Persists which GLOBAL official JCS logo a business selected.
 *
 * Important:
 *
 * - The official asset itself remains global.
 * - No BusinessLogoRecord is created.
 * - No file is copied into business Storage.
 * - No official logo is archived or deleted.
 * - Only the business selection is persisted.
 */

import {
  Firestore,
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import type {
  ResolvedOfficialJCSLogo,
} from "./OfficialJCSLogoStorageService";

// =======================================================
// MARK: - Input
// =======================================================

export interface ApplyOfficialJCSLogoInput {
  businessID:
    string;

  companyName:
    string;

  accentColorName:
    string;

  logo:
    ResolvedOfficialJCSLogo;

  firestore?:
    Firestore;
}

// =======================================================
// MARK: - Apply Official Logo
// =======================================================

export async function applyOfficialJCSLogoToBusiness(
  input:
    ApplyOfficialJCSLogoInput,
): Promise<void> {
  const businessID =
    input.businessID.trim();

  if (!businessID) {
    throw new Error(
      "The business ID is required before applying an official logo.",
    );
  }

  if (
    !input.logo.isAvailable ||
    !input.logo.downloadURL.trim()
  ) {
    throw new Error(
      "This official JCS logo is not available yet.",
    );
  }

  const firestore =
    input.firestore ??
    getFirestore();

  const reference =
    doc(
      firestore,
      "businessSettings",
      businessID,
    );

  const nowISO =
    new Date().toISOString();

  /*
   * Merge is essential:
   *
   * Accent Color, Background, language, tax configuration
   * and all other App Settings remain untouched.
   */
  await setDoc(
    reference,
    {
      activeLogoID:
        input.logo.id,

      activeLogoSource:
        "official-jcs",

      logoStoragePath:
        input.logo.storagePath,

      logoDownloadURL:
        input.logo.downloadURL,

      logoRenderingMode:
        "original",

      logoSupportsAccentColor:
        false,

      useAccentColorForLogo:
        false,

      brandingUpdatedAt:
        serverTimestamp(),

      activeLogoUpdatedAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),

      updatedAtISO:
        nowISO,
    },
    {
      merge:
        true,
    },
  );
}

// =======================================================
// MARK: - Apply Official Logo To Platform
// =======================================================

export interface ApplyOfficialJCSLogoToPlatformInput {
  logo:
    ResolvedOfficialJCSLogo;

  firestore?:
    Firestore;
}

export async function applyOfficialJCSLogoToPlatform(
  input:
    ApplyOfficialJCSLogoToPlatformInput,
): Promise<void> {
  if (
    !input.logo.isAvailable ||
    !input.logo.downloadURL.trim()
  ) {
    throw new Error(
      "This official JCS logo is not available yet.",
    );
  }

  const firestore =
    input.firestore ??
    getFirestore();

  const reference =
    doc(
      firestore,
      "platformSettings",
      "global",
    );

  const nowISO =
    new Date().toISOString();

  await setDoc(
    reference,
    {
      logoStoragePath:
        input.logo.storagePath,

      logoDownloadURL:
        input.logo.downloadURL,

      logoFileName:
        input.logo.storagePath
          .split("/")
          .pop() ?? "",

      hasCustomLogo:
        false,

      updatedAt:
        serverTimestamp(),

      updatedAtISO:
        nowISO,
    },
    {
      merge:
        true,
    },
  );
}
