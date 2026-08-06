/*
 * JCS Business Suite Web
 * BusinessLogoFirestoreService.ts
 *
 * Firestore persistence service for:
 *
 * - Business logo metadata.
 * - Active business branding configuration.
 * - Sofia-generated premium logos.
 * - Business Owner uploaded logos.
 * - Safe logo replacement.
 * - Previous-logo archival.
 * - Active-logo removal and default-logo restoration.
 *
 * Firebase Storage uploads, image processing and React state
 * must not live in this file.
 */

import {
  Firestore,
  QueryDocumentSnapshot,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";

import {
  BUSINESS_LOGO_FIRESTORE_COLLECTION,
  BUSINESS_SETTINGS_FIRESTORE_COLLECTION,
  DEFAULT_BUSINESS_LOGO_ASSET_PATH,
  DEFAULT_BUSINESS_LOGO_SUPPORTS_ACCENT_COLOR,
  DEFAULT_BUSINESS_LOGO_USES_ACCENT_COLOR,
} from "./BusinessLogoConstants";

import {
  createBusinessBrandingSettings,
  normalizeAccentColorName,
  normalizeBusinessLogoRenderingMode,
  normalizeBusinessLogoSource,
  normalizeBusinessName,
} from "./BusinessLogoDomain";

import type {
  BusinessBrandingSettings,
  BusinessLogoRecord,
  BusinessLogoRenderingMode,
  BusinessLogoSource,
  BusinessLogoStatus,
} from "./BusinessLogoTypes";

// MARK: - Firestore Stored Models

/**
 * Firestore representation of one business logo.
 *
 * ISO dates are retained for compatibility with the web domain,
 * while server timestamps provide trusted database ordering.
 */
export interface BusinessLogoFirestoreDocument
  extends BusinessLogoRecord {
  createdAt: ReturnType<
    typeof serverTimestamp
  >;

  updatedAt: ReturnType<
    typeof serverTimestamp
  >;

  activatedAt: ReturnType<
    typeof serverTimestamp
  > | null;

  archivedAt: ReturnType<
    typeof serverTimestamp
  > | null;
}

/**
 * Branding fields merged into:
 *
 * businessSettings/{businessID}
 *
 * Other App Settings fields are preserved because all writes use merge.
 */
export interface BusinessBrandingFirestoreDocument
  extends BusinessBrandingSettings {
  brandingUpdatedAt: ReturnType<
    typeof serverTimestamp
  >;

  activeLogoUpdatedAt: ReturnType<
    typeof serverTimestamp
  >;
}

// MARK: - Save Input

export interface SaveActiveBusinessLogoInput {
  logo: BusinessLogoRecord;

  /**
   * Current company name and Dashboard accent color.
   * These values keep branding settings synchronized.
   */
  companyName: string;
  accentColorName: string;

  /**
   * Optional Firestore injection for tests or applications
   * using multiple Firebase projects.
   */
  firestore?: Firestore;
}

// MARK: - Save Result

export interface SaveActiveBusinessLogoResult {
  logo: BusinessLogoRecord;
  branding: BusinessBrandingSettings;

  previousLogoID: string;
  previousLogoStoragePath: string;

  /**
   * Storage cleanup must happen only after this Firestore
   * transaction completes successfully.
   */
  shouldDeletePreviousStorageObject: boolean;
}

// MARK: - Read Models

export interface BusinessLogoWithDocumentID {
  documentID: string;
  logo: BusinessLogoRecord;
}

export interface ActiveBusinessBrandingResult {
  branding: BusinessBrandingSettings;
  logo: BusinessLogoRecord | null;
}

// MARK: - Save Active Logo

/**
 * Saves a new active business logo and synchronizes the business
 * branding configuration in one Firestore transaction.
 *
 * Transaction behavior:
 *
 * 1. Reads the current business settings.
 * 2. Reads the previous active logo when present.
 * 3. Archives the previous logo record.
 * 4. Saves the new logo as active.
 * 5. Updates businessSettings/{businessID} using merge.
 *
 * The previous Firebase Storage object is not deleted here.
 * Delete it only after this transaction returns successfully.
 */
export async function saveActiveBusinessLogo(
  input: SaveActiveBusinessLogoInput,
): Promise<SaveActiveBusinessLogoResult> {
  const normalized =
    normalizeSaveActiveLogoInput(input);

  const firestore =
    input.firestore ?? getFirestore();

  const logoReference =
    doc(
      firestore,
      BUSINESS_LOGO_FIRESTORE_COLLECTION,
      normalized.logo.id,
    );

  const businessSettingsReference =
    doc(
      firestore,
      BUSINESS_SETTINGS_FIRESTORE_COLLECTION,
      normalized.logo.businessID,
    );

  return runTransaction(
    firestore,
    async (transaction) => {
      /*
       * All reads occur before transaction writes.
       */
      const businessSettingsSnapshot =
        await transaction.get(
          businessSettingsReference,
        );

      const previousLogoID =
        readString(
          businessSettingsSnapshot.data()
            ?.activeLogoID,
        );

      let previousLogoStoragePath = "";

      let previousLogoReference:
        | ReturnType<typeof doc>
        | null = null;

      if (
        previousLogoID &&
        previousLogoID !== normalized.logo.id
      ) {
        previousLogoReference =
          doc(
            firestore,
            BUSINESS_LOGO_FIRESTORE_COLLECTION,
            previousLogoID,
          );

        const previousLogoSnapshot =
          await transaction.get(
            previousLogoReference,
          );

        previousLogoStoragePath =
          readString(
            previousLogoSnapshot.data()
              ?.storagePath,
          );
      }

      const nowISO =
        new Date().toISOString();

      const activeLogo: BusinessLogoRecord = {
        ...normalized.logo,

        status:
          "active",

        updatedAtISO:
          nowISO,
      };

      const branding =
        createBusinessBrandingSettings({
          businessID:
            activeLogo.businessID,

          companyName:
            normalized.companyName,

          accentColorName:
            normalized.accentColorName,

          activeLogoID:
            activeLogo.id,

          activeLogoSource:
            activeLogo.source,

          logoStoragePath:
            activeLogo.storagePath,

          logoDownloadURL:
            activeLogo.downloadURL,

          logoRenderingMode:
            activeLogo.renderingMode,

          logoSupportsAccentColor:
            activeLogo.supportsAccentColor,

          useAccentColorForLogo:
            activeLogo.useAccentColor,
        });

      /*
       * Archive the previous logo metadata.
       *
       * Its Storage object remains available until the caller
       * confirms this transaction succeeded and performs cleanup.
       */
      if (previousLogoReference) {
        transaction.set(
          previousLogoReference,
          {
            status:
              "archived",

            updatedAtISO:
              nowISO,

            updatedAt:
              serverTimestamp(),

            archivedAt:
              serverTimestamp(),
          },
          {
            merge:
              true,
          },
        );
      }

      transaction.set(
        logoReference,
        serializeActiveLogoForFirestore(
          activeLogo,
        ),
        {
          merge:
            true,
        },
      );

      transaction.set(
        businessSettingsReference,
        serializeBrandingForFirestore(
          branding,
        ),
        {
          merge:
            true,
        },
      );

      return {
        logo:
          activeLogo,

        branding,

        previousLogoID:
          previousLogoID === activeLogo.id
            ? ""
            : previousLogoID,

        previousLogoStoragePath:
          previousLogoStoragePath ===
          activeLogo.storagePath
            ? ""
            : previousLogoStoragePath,

        shouldDeletePreviousStorageObject:
          Boolean(
            previousLogoStoragePath &&
            previousLogoStoragePath !==
              activeLogo.storagePath,
          ),
      };
    },
  ).catch((error: unknown) => {
    throw mapBusinessLogoFirestoreError(
      error,
      "The business logo could not be saved.",
    );
  });
}

// MARK: - Read Active Branding

export async function fetchActiveBusinessBranding(
  businessID: string,
  firestore?: Firestore,
): Promise<ActiveBusinessBrandingResult> {
  const cleanBusinessID =
    requireBusinessID(businessID);

  const database =
    firestore ?? getFirestore();

  try {
    const settingsReference =
      doc(
        database,
        BUSINESS_SETTINGS_FIRESTORE_COLLECTION,
        cleanBusinessID,
      );

    const settingsSnapshot =
      await getDoc(
        settingsReference,
      );

    const branding =
      deserializeBusinessBrandingSettings(
        cleanBusinessID,
        settingsSnapshot.data(),
      );

    if (!branding.activeLogoID) {
      return {
        branding,
        logo:
          null,
      };
    }

    const logo =
      await fetchBusinessLogoByID(
        branding.activeLogoID,
        database,
      );

    return {
      branding,
      logo,
    };
  } catch (error) {
    throw mapBusinessLogoFirestoreError(
      error,
      "The active business branding could not be loaded.",
    );
  }
}

// MARK: - Read One Logo

export async function fetchBusinessLogoByID(
  logoID: string,
  firestore?: Firestore,
): Promise<BusinessLogoRecord | null> {
  const cleanLogoID =
    logoID.trim();

  if (!cleanLogoID) {
    return null;
  }

  try {
    const database =
      firestore ?? getFirestore();

    const snapshot =
      await getDoc(
        doc(
          database,
          BUSINESS_LOGO_FIRESTORE_COLLECTION,
          cleanLogoID,
        ),
      );

    if (!snapshot.exists()) {
      return null;
    }

    return deserializeBusinessLogoRecord(
      snapshot.id,
      snapshot.data(),
    );
  } catch (error) {
    throw mapBusinessLogoFirestoreError(
      error,
      "The business logo could not be loaded.",
    );
  }
}

// MARK: - List Business Logos

/**
 * Returns the most recently updated logo records for one business.
 *
 * This can later power the branding history inside App Settings.
 */
export async function fetchBusinessLogoHistory(
  input: {
    businessID: string;
    maximumResults?: number;
    firestore?: Firestore;
  },
): Promise<BusinessLogoWithDocumentID[]> {
  const cleanBusinessID =
    requireBusinessID(
      input.businessID,
    );

  const maximumResults =
    normalizeMaximumResults(
      input.maximumResults,
    );

  try {
    const database =
      input.firestore ??
      getFirestore();

    const logoQuery =
      query(
        collection(
          database,
          BUSINESS_LOGO_FIRESTORE_COLLECTION,
        ),

        where(
          "businessID",
          "==",
          cleanBusinessID,
        ),

        orderBy(
          "updatedAt",
          "desc",
        ),

        limit(
          maximumResults,
        ),
      );

    const snapshot =
      await getDocs(
        logoQuery,
      );

    return snapshot.docs
      .map(
        (
          documentSnapshot:
            QueryDocumentSnapshot,
        ) => {
          const logo =
            deserializeBusinessLogoRecord(
              documentSnapshot.id,
              documentSnapshot.data(),
            );

          return {
            documentID:
              documentSnapshot.id,

            logo,
          };
        },
      )
      .filter(
        (
          item,
        ): item is BusinessLogoWithDocumentID =>
          item.logo !== null,
      );
  } catch (error) {
    throw mapBusinessLogoFirestoreError(
      error,
      "The business logo history could not be loaded.",
    );
  }
}

// MARK: - Archive Logo

export async function archiveBusinessLogoRecord(
  input: {
    logoID: string;
    businessID: string;
    firestore?: Firestore;
  },
): Promise<void> {
  const cleanLogoID =
    input.logoID.trim();

  const cleanBusinessID =
    requireBusinessID(
      input.businessID,
    );

  if (!cleanLogoID) {
    return;
  }

  const database =
    input.firestore ??
    getFirestore();

  const logoReference =
    doc(
      database,
      BUSINESS_LOGO_FIRESTORE_COLLECTION,
      cleanLogoID,
    );

  try {
    await runTransaction(
      database,
      async (transaction) => {
        const snapshot =
          await transaction.get(
            logoReference,
          );

        if (!snapshot.exists()) {
          return;
        }

        const storedBusinessID =
          readString(
            snapshot.data().businessID,
          );

        if (
          storedBusinessID !==
          cleanBusinessID
        ) {
          throw new BusinessLogoFirestoreServiceError(
            "business-mismatch",
            "This logo does not belong to the selected business.",
          );
        }

        transaction.set(
          logoReference,
          {
            status:
              "archived",

            updatedAtISO:
              new Date().toISOString(),

            updatedAt:
              serverTimestamp(),

            archivedAt:
              serverTimestamp(),
          },
          {
            merge:
              true,
          },
        );
      },
    );
  } catch (error) {
    throw mapBusinessLogoFirestoreError(
      error,
      "The business logo could not be archived.",
    );
  }
}

// MARK: - Restore Default Logo

export interface RestoreDefaultBusinessLogoResult {
  branding: BusinessBrandingSettings;

  previousLogoID: string;
  previousLogoStoragePath: string;

  shouldDeletePreviousStorageObject: boolean;
}

/**
 * Removes the current custom-logo reference and restores the
 * JCS default template logo.
 *
 * The previous Storage object must be deleted afterward by the
 * calling orchestration service.
 */
export async function restoreDefaultBusinessLogo(
  input: {
    businessID: string;
    companyName: string;
    accentColorName: string;
    firestore?: Firestore;
  },
): Promise<RestoreDefaultBusinessLogoResult> {
  const cleanBusinessID =
    requireBusinessID(
      input.businessID,
    );

  const companyName =
    normalizeBusinessName(
      input.companyName,
    );

  const accentColorName =
    normalizeAccentColorName(
      input.accentColorName,
    );

  const database =
    input.firestore ??
    getFirestore();

  const settingsReference =
    doc(
      database,
      BUSINESS_SETTINGS_FIRESTORE_COLLECTION,
      cleanBusinessID,
    );

  try {
    return await runTransaction(
      database,
      async (transaction) => {
        const settingsSnapshot =
          await transaction.get(
            settingsReference,
          );

        const previousLogoID =
          readString(
            settingsSnapshot.data()
              ?.activeLogoID,
          );

        let previousLogoStoragePath = "";

        let previousLogoReference:
          | ReturnType<typeof doc>
          | null = null;

        if (previousLogoID) {
          previousLogoReference =
            doc(
              database,
              BUSINESS_LOGO_FIRESTORE_COLLECTION,
              previousLogoID,
            );

          const previousLogoSnapshot =
            await transaction.get(
              previousLogoReference,
            );

          previousLogoStoragePath =
            readString(
              previousLogoSnapshot.data()
                ?.storagePath,
            );
        }

        const nowISO =
          new Date().toISOString();

        const branding =
          createBusinessBrandingSettings({
            businessID:
              cleanBusinessID,

            companyName,

            accentColorName,

            activeLogoID:
              "",

            activeLogoSource:
              "default",

            logoStoragePath:
              "",

            logoDownloadURL:
              DEFAULT_BUSINESS_LOGO_ASSET_PATH,

            logoRenderingMode:
              "template",

            logoSupportsAccentColor:
              DEFAULT_BUSINESS_LOGO_SUPPORTS_ACCENT_COLOR,

            useAccentColorForLogo:
              DEFAULT_BUSINESS_LOGO_USES_ACCENT_COLOR,
          });

        if (previousLogoReference) {
          transaction.set(
            previousLogoReference,
            {
              status:
                "archived",

              updatedAtISO:
                nowISO,

              updatedAt:
                serverTimestamp(),

              archivedAt:
                serverTimestamp(),
            },
            {
              merge:
                true,
            },
          );
        }

        transaction.set(
          settingsReference,
          serializeBrandingForFirestore(
            branding,
          ),
          {
            merge:
              true,
          },
        );

        return {
          branding,

          previousLogoID,

          previousLogoStoragePath,

          shouldDeletePreviousStorageObject:
            Boolean(
              previousLogoStoragePath,
            ),
        };
      },
    );
  } catch (error) {
    throw mapBusinessLogoFirestoreError(
      error,
      "The default business logo could not be restored.",
    );
  }
}

// MARK: - Update Logo Rendering Preference

/**
 * Updates only the rendering preference of the active logo.
 *
 * Generated and uploaded logos normally remain in original mode.
 * Accent color is enabled only when the logo explicitly supports it.
 */
export async function updateActiveLogoRenderingPreference(
  input: {
    businessID: string;
    renderingMode: BusinessLogoRenderingMode;
    useAccentColorForLogo: boolean;
    firestore?: Firestore;
  },
): Promise<BusinessBrandingSettings> {
  const cleanBusinessID =
    requireBusinessID(
      input.businessID,
    );

  const database =
    input.firestore ??
    getFirestore();

  const settingsReference =
    doc(
      database,
      BUSINESS_SETTINGS_FIRESTORE_COLLECTION,
      cleanBusinessID,
    );

  try {
    return await runTransaction(
      database,
      async (transaction) => {
        const settingsSnapshot =
          await transaction.get(
            settingsReference,
          );

        const existingBranding =
          deserializeBusinessBrandingSettings(
            cleanBusinessID,
            settingsSnapshot.data(),
          );

        const requestedRenderingMode =
          normalizeBusinessLogoRenderingMode(
            input.renderingMode,
          );

        const renderingMode:
          BusinessLogoRenderingMode =
          existingBranding
            .logoSupportsAccentColor &&
          requestedRenderingMode === "template"
            ? "template"
            : "original";

        const useAccentColorForLogo =
          renderingMode === "template" &&
          existingBranding
            .logoSupportsAccentColor &&
          input.useAccentColorForLogo === true;

        const updatedBranding: BusinessBrandingSettings = {
          ...existingBranding,

          logoRenderingMode:
            renderingMode,

          useAccentColorForLogo,

          updatedAtISO:
            new Date().toISOString(),
        };

        transaction.set(
          settingsReference,
          {
            logoRenderingMode:
              updatedBranding
                .logoRenderingMode,

            useAccentColorForLogo:
              updatedBranding
                .useAccentColorForLogo,

            updatedAtISO:
              updatedBranding
                .updatedAtISO,

            brandingUpdatedAt:
              serverTimestamp(),
          },
          {
            merge:
              true,
          },
        );

        if (
          existingBranding.activeLogoID
        ) {
          const activeLogoReference =
            doc(
              database,
              BUSINESS_LOGO_FIRESTORE_COLLECTION,
              existingBranding
                .activeLogoID,
            );

          transaction.set(
            activeLogoReference,
            {
              renderingMode,

              useAccentColor:
                useAccentColorForLogo,

              updatedAtISO:
                updatedBranding
                  .updatedAtISO,

              updatedAt:
                serverTimestamp(),
            },
            {
              merge:
                true,
            },
          );
        }

        return updatedBranding;
      },
    );
  } catch (error) {
    throw mapBusinessLogoFirestoreError(
      error,
      "The logo display preference could not be updated.",
    );
  }
}

// MARK: - Serialization

function serializeActiveLogoForFirestore(
  logo: BusinessLogoRecord,
): Record<string, unknown> {
  return {
    id:
      logo.id,

    businessID:
      logo.businessID,

    ownerUID:
      logo.ownerUID,

    createdByUID:
      logo.createdByUID,

    businessName:
      logo.businessName,

    source:
      logo.source,

    status:
      "active",

    storagePath:
      logo.storagePath,

    downloadURL:
      logo.downloadURL,

    originalFileName:
      logo.originalFileName,

    storedFileName:
      logo.storedFileName,

    mimeType:
      logo.mimeType,

    width:
      logo.width,

    height:
      logo.height,

    sizeBytes:
      logo.sizeBytes,

    supportsAccentColor:
      logo.supportsAccentColor,

    renderingMode:
      logo.renderingMode,

    useAccentColor:
      logo.useAccentColor,

    creativeBrief:
      logo.creativeBrief,

    promptUsed:
      logo.promptUsed,

    createdAtISO:
      logo.createdAtISO,

    updatedAtISO:
      logo.updatedAtISO,

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),

    activatedAt:
      serverTimestamp(),

    archivedAt:
      null,
  };
}

function serializeBrandingForFirestore(
  branding: BusinessBrandingSettings,
): Record<string, unknown> {
  return {
    businessID:
      branding.businessID,

    companyName:
      branding.companyName,

    accentColorName:
      branding.accentColorName,

    activeLogoID:
      branding.activeLogoID,

    activeLogoSource:
      branding.activeLogoSource,

    logoStoragePath:
      branding.logoStoragePath,

    logoDownloadURL:
      branding.logoDownloadURL,

    logoRenderingMode:
      branding.logoRenderingMode,

    logoSupportsAccentColor:
      branding.logoSupportsAccentColor,

    useAccentColorForLogo:
      branding.useAccentColorForLogo,

    updatedAtISO:
      branding.updatedAtISO,

    brandingUpdatedAt:
      serverTimestamp(),

    activeLogoUpdatedAt:
      serverTimestamp(),
  };
}

// MARK: - Deserialization

function deserializeBusinessLogoRecord(
  documentID: string,
  data: Record<string, unknown> | undefined,
): BusinessLogoRecord | null {
  if (!data) {
    return null;
  }

  const businessID =
    readString(
      data.businessID,
    );

  if (!businessID) {
    return null;
  }

  const supportsAccentColor =
    data.supportsAccentColor === true;

  const renderingMode =
    supportsAccentColor
      ? normalizeBusinessLogoRenderingMode(
          data.renderingMode,
        )
      : "original";

  const useAccentColor =
    supportsAccentColor &&
    renderingMode === "template" &&
    data.useAccentColor === true;

  return {
    id:
      readString(data.id) ||
      documentID,

    businessID,

    ownerUID:
      readString(
        data.ownerUID,
      ),

    createdByUID:
      readString(
        data.createdByUID,
      ),

    businessName:
      normalizeBusinessName(
        readString(
          data.businessName,
        ),
      ),

    source:
      normalizeBusinessLogoSource(
        data.source,
      ),

    status:
      normalizeBusinessLogoStatus(
        data.status,
      ),

    storagePath:
      readString(
        data.storagePath,
      ),

    downloadURL:
      readString(
        data.downloadURL,
      ),

    originalFileName:
      readString(
        data.originalFileName,
      ),

    storedFileName:
      readString(
        data.storedFileName,
      ),

    mimeType:
      readString(
        data.mimeType,
      ) || "image/png",

    width:
      readNullablePositiveNumber(
        data.width,
      ),

    height:
      readNullablePositiveNumber(
        data.height,
      ),

    sizeBytes:
      readNullablePositiveNumber(
        data.sizeBytes,
      ),

    supportsAccentColor,

    renderingMode,

    useAccentColor,

    creativeBrief:
      readString(
        data.creativeBrief,
      ),

    promptUsed:
      readString(
        data.promptUsed,
      ),

    createdAtISO:
      readISODate(
        data.createdAtISO,
      ),

    updatedAtISO:
      readISODate(
        data.updatedAtISO,
      ),
  };
}

function deserializeBusinessBrandingSettings(
  businessID: string,
  data: Record<string, unknown> | undefined,
): BusinessBrandingSettings {
  const activeLogoSource =
    normalizeBusinessLogoSource(
      data?.activeLogoSource,
    );

  const logoSupportsAccentColor =
    data?.logoSupportsAccentColor === true ||
    activeLogoSource === "default";

  const logoRenderingMode =
    logoSupportsAccentColor
      ? normalizeBusinessLogoRenderingMode(
          data?.logoRenderingMode,
        )
      : "original";

  const useAccentColorForLogo =
    logoSupportsAccentColor &&
    logoRenderingMode === "template" &&
    data?.useAccentColorForLogo !== false;

  return createBusinessBrandingSettings({
    businessID,

    companyName:
      readString(
        data?.companyName,
      ),

    accentColorName:
      readString(
        data?.accentColorName,
      ),

    activeLogoID:
      readString(
        data?.activeLogoID,
      ),

    activeLogoSource,

    logoStoragePath:
      readString(
        data?.logoStoragePath,
      ),

    logoDownloadURL:
      readString(
        data?.logoDownloadURL,
      ) ||
      (
        activeLogoSource === "default"
          ? DEFAULT_BUSINESS_LOGO_ASSET_PATH
          : ""
      ),

    logoRenderingMode,

    logoSupportsAccentColor,

    useAccentColorForLogo,
  });
}

// MARK: - Save Normalization

interface NormalizedSaveActiveLogoInput {
  logo: BusinessLogoRecord;
  companyName: string;
  accentColorName: string;
}

function normalizeSaveActiveLogoInput(
  input: SaveActiveBusinessLogoInput,
): NormalizedSaveActiveLogoInput {
  const logoID =
    input.logo.id.trim();

  const businessID =
    input.logo.businessID.trim();

  const ownerUID =
    input.logo.ownerUID.trim();

  const storagePath =
    input.logo.storagePath.trim();

  const downloadURL =
    input.logo.downloadURL.trim();

  if (!logoID) {
    throw new BusinessLogoFirestoreServiceError(
      "missing-logo-id",
      "The logo ID is required.",
    );
  }

  if (!businessID) {
    throw new BusinessLogoFirestoreServiceError(
      "missing-business-id",
      "The business ID is required.",
    );
  }

  if (!ownerUID) {
    throw new BusinessLogoFirestoreServiceError(
      "missing-owner-uid",
      "The Business Owner identity is required.",
    );
  }

  if (!storagePath) {
    throw new BusinessLogoFirestoreServiceError(
      "missing-storage-path",
      "The uploaded logo Storage path is required.",
    );
  }

  if (!downloadURL) {
    throw new BusinessLogoFirestoreServiceError(
      "missing-download-url",
      "The uploaded logo download URL is required.",
    );
  }

  const supportsAccentColor =
    input.logo
      .supportsAccentColor === true;

  const renderingMode:
    BusinessLogoRenderingMode =
    supportsAccentColor &&
    input.logo.renderingMode === "template"
      ? "template"
      : "original";

  return {
    logo: {
      ...input.logo,

      id:
        logoID,

      businessID,

      ownerUID,

      createdByUID:
        input.logo
          .createdByUID
          .trim(),

      businessName:
        normalizeBusinessName(
          input.logo.businessName,
        ),

      storagePath,

      downloadURL,

      supportsAccentColor,

      renderingMode,

      useAccentColor:
        renderingMode === "template" &&
        input.logo.useAccentColor === true,

      status:
        "active",
    },

    companyName:
      normalizeBusinessName(
        input.companyName ||
        input.logo.businessName,
      ),

    accentColorName:
      normalizeAccentColorName(
        input.accentColorName,
      ),
  };
}

// MARK: - Helpers

function requireBusinessID(
  businessID: string,
): string {
  const cleanBusinessID =
    businessID.trim();

  if (!cleanBusinessID) {
    throw new BusinessLogoFirestoreServiceError(
      "missing-business-id",
      "The business ID is required.",
    );
  }

  return cleanBusinessID;
}

function readString(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function readNullablePositiveNumber(
  value: unknown,
): number | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return null;
  }

  return Math.round(value);
}

function readISODate(
  value: unknown,
): string {
  if (
    typeof value === "string" &&
    !Number.isNaN(
      Date.parse(value),
    )
  ) {
    return value;
  }

  return new Date().toISOString();
}

function normalizeBusinessLogoStatus(
  value: unknown,
): BusinessLogoStatus {
  switch (value) {
    case "temporary":
    case "active":
    case "archived":
      return value;

    default:
      return "archived";
  }
}

function normalizeMaximumResults(
  value?: number,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return 20;
  }

  return Math.min(
    Math.max(
      Math.round(value),
      1,
    ),
    100,
  );
}

// MARK: - Errors

export class BusinessLogoFirestoreServiceError
  extends Error {
  readonly code: string;

  constructor(
    code: string,
    message: string,
  ) {
    super(message);

    this.name =
      "BusinessLogoFirestoreServiceError";

    this.code =
      code;
  }
}

function mapBusinessLogoFirestoreError(
  error: unknown,
  fallbackMessage: string,
): BusinessLogoFirestoreServiceError {
  if (
    error instanceof
    BusinessLogoFirestoreServiceError
  ) {
    return error;
  }

  const firebaseError =
    error as {
      code?: string;
      message?: string;
    };

  switch (firebaseError.code) {
    case "permission-denied":
    case "firestore/permission-denied":
      return new BusinessLogoFirestoreServiceError(
        "permission-denied",
        "You do not have permission to change this business branding.",
      );

    case "unauthenticated":
    case "firestore/unauthenticated":
      return new BusinessLogoFirestoreServiceError(
        "unauthenticated",
        "Sign in again before changing the business branding.",
      );

    case "unavailable":
    case "firestore/unavailable":
      return new BusinessLogoFirestoreServiceError(
        "unavailable",
        "Firestore is temporarily unavailable. Check the connection and try again.",
      );

    case "deadline-exceeded":
    case "firestore/deadline-exceeded":
      return new BusinessLogoFirestoreServiceError(
        "deadline-exceeded",
        "Saving the business logo took too long. Try again.",
      );

    case "aborted":
    case "firestore/aborted":
      return new BusinessLogoFirestoreServiceError(
        "transaction-aborted",
        "The branding information changed while it was being saved. Try again.",
      );

    case "failed-precondition":
    case "firestore/failed-precondition":
      return new BusinessLogoFirestoreServiceError(
        "failed-precondition",
        "Firestore requires an index or additional configuration for this operation.",
      );

    default:
      return new BusinessLogoFirestoreServiceError(
        "firestore-error",
        firebaseError.message?.trim() ||
        fallbackMessage,
      );
  }
}