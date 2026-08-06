/*
 * JCS Business Suite Web
 * PlatformSettingsFirestoreService.ts
 *
 * Firebase persistence service for global Platform Settings.
 *
 * Responsibilities:
 *
 * - Read platformSettings/global.
 * - Save platformSettings/global.
 * - Upload the official JCS Business Suite logo.
 * - Remove the custom platform logo.
 * - Preserve Platform Settings access rules.
 *
 * This service does not use:
 *
 * - businessID
 * - ownerUID
 * - business memberships
 *
 * Platform Settings belong to the global platform identity.
 */

import {
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import {
  db,
  storage,
} from "@/core/firebase/firebase";

import {
  applyPlatformLogoMetadata,
  calculatePlatformSettingsPermissions,
  createPlatformSettingsRecordFromSaveInput,
  deserializePlatformSettingsRecord,
  normalizePlatformSettingsActor,
  normalizeSavePlatformSettingsInput,
  restoreDefaultPlatformLogo,
  serializePlatformSettingsForFirestore,
  PlatformSettingsDomainError,
} from "./PlatformSettingsDomain";

import {
  PLATFORM_LOGO_STORAGE_DIRECTORY,
  PLATFORM_SETTINGS_COLLECTION,
  PLATFORM_SETTINGS_DOCUMENT_ID,
  createDefaultPlatformSettingsRecord,
} from "./PlatformSettingsTypes";

import type {
  PlatformSettingsActor,
  PlatformSettingsRecord,
  SavePlatformSettingsInput,
  UploadPlatformLogoInput,
  UploadPlatformLogoResult,
} from "./PlatformSettingsTypes";

// =======================================================
// MARK: - Constants
// =======================================================

export const PLATFORM_LOGO_MAX_FILE_SIZE_BYTES =
  8 * 1024 * 1024;

export const PLATFORM_LOGO_ALLOWED_MIME_TYPES =
  [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
  ] as const;

// =======================================================
// MARK: - References
// =======================================================

function platformSettingsDocumentReference() {
  return doc(
    db,
    PLATFORM_SETTINGS_COLLECTION,
    PLATFORM_SETTINGS_DOCUMENT_ID,
  );
}

function platformLogoStoragePath(
  file: File,
): string {
  const extension =
    resolvePlatformLogoFileExtension(
      file,
    );

  return [
    PLATFORM_LOGO_STORAGE_DIRECTORY,
    `logo.${extension}`,
  ].join("/");
}

// =======================================================
// MARK: - Read Platform Settings
// =======================================================

export async function fetchPlatformSettings(
  actor: PlatformSettingsActor,
): Promise<PlatformSettingsRecord> {
  const normalizedActor =
    normalizePlatformSettingsActor(
      actor,
    );

  const permissions =
    calculatePlatformSettingsPermissions(
      normalizedActor,
    );

  if (!permissions.canViewSettings) {
    throw new PlatformSettingsFirestoreError(
      "permission-denied",
      "Only a Platform Administrator can read global Platform Settings.",
    );
  }

  try {
    const snapshot =
      await getDoc(
        platformSettingsDocumentReference(),
      );

    if (!snapshot.exists()) {
      return createDefaultPlatformSettingsRecord({
        createdByUID:
          normalizedActor.firebaseUID,
      });
    }

    return deserializePlatformSettingsRecord(
      snapshot.data(),
    );
  } catch (error: unknown) {
    throw normalizePlatformSettingsFirebaseError(
      error,
      "The global Platform Settings could not be loaded.",
    );
  }
}

// =======================================================
// MARK: - Save Platform Settings
// =======================================================

export async function savePlatformSettings(
  input: SavePlatformSettingsInput,
): Promise<PlatformSettingsRecord> {
  try {
    const normalizedInput =
      normalizeSavePlatformSettingsInput(
        input,
      );

    const settings =
      createPlatformSettingsRecordFromSaveInput({
        normalizedInput,
      });

    const firestoreDocument =
      serializePlatformSettingsForFirestore(
        settings,
      );

    await setDoc(
      platformSettingsDocumentReference(),
      {
        ...firestoreDocument,

        /*
         * ISO values remain available to the web application,
         * while Firestore timestamps support future queries,
         * auditing and platform administration.
         */
        createdAt:
          normalizedInput
            .existingSettings
            ? deleteField()
            : serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      },
      {
        merge:
          true,
      },
    );

    return settings;
  } catch (error: unknown) {
    if (
      error instanceof
      PlatformSettingsDomainError
    ) {
      throw error;
    }

    throw normalizePlatformSettingsFirebaseError(
      error,
      "The global Platform Settings could not be saved.",
    );
  }
}

// =======================================================
// MARK: - Upload Platform Logo
// =======================================================

export async function uploadPlatformLogo(
  input: UploadPlatformLogoInput,
): Promise<UploadPlatformLogoResult> {
  const actor =
    normalizePlatformSettingsActor(
      input.actor,
    );

  const permissions =
    calculatePlatformSettingsPermissions(
      actor,
    );

  if (!permissions.canUploadLogo) {
    throw new PlatformSettingsFirestoreError(
      "permission-denied",
      "Only a Platform Administrator can upload the official platform logo.",
    );
  }

  const currentUserUID =
    input.currentUserUID.trim() ||
    actor.firebaseUID;

  if (!currentUserUID) {
    throw new PlatformSettingsFirestoreError(
      "missing-user-id",
      "The signed-in Platform Administrator identity is required.",
    );
  }

  validatePlatformLogoFile(
    input.file,
  );

  const storagePath =
    platformLogoStoragePath(
      input.file,
    );

  const logoReference =
    ref(
      storage,
      storagePath,
    );

  try {
    await uploadBytes(
      logoReference,
      input.file,
      {
        contentType:
          input.file.type,

        customMetadata: {
          platformSettingsDocumentID:
            PLATFORM_SETTINGS_DOCUMENT_ID,

          uploadedByUID:
            currentUserUID,

          originalFileName:
            input.file.name,
        },
      },
    );

    const logoDownloadURL =
      await getDownloadURL(
        logoReference,
      );

    return {
      logoStoragePath:
        storagePath,

      logoDownloadURL,

      logoFileName:
        input.file.name.trim() ||
        `logo.${resolvePlatformLogoFileExtension(
          input.file,
        )}`,
    };
  } catch (error: unknown) {
    throw normalizePlatformSettingsFirebaseError(
      error,
      "The official platform logo could not be uploaded.",
    );
  }
}

// =======================================================
// MARK: - Upload and Save Logo
// =======================================================

export async function uploadAndSavePlatformLogo(
  input: {
    actor:
      PlatformSettingsActor;

    currentUserUID:
      string;

    file:
      File;

    existingSettings:
      PlatformSettingsRecord | null;
  },
): Promise<PlatformSettingsRecord> {
  const actor =
    normalizePlatformSettingsActor(
      input.actor,
    );

  const permissions =
    calculatePlatformSettingsPermissions(
      actor,
    );

  if (!permissions.canUploadLogo) {
    throw new PlatformSettingsFirestoreError(
      "permission-denied",
      "Only a Platform Administrator can upload the official platform logo.",
    );
  }

  const currentUserUID =
    input.currentUserUID.trim() ||
    actor.firebaseUID;

  if (!currentUserUID) {
    throw new PlatformSettingsFirestoreError(
      "missing-user-id",
      "The signed-in Platform Administrator identity is required.",
    );
  }

  const existingSettings =
    input.existingSettings ??
    createDefaultPlatformSettingsRecord({
      createdByUID:
        currentUserUID,
    });

  const uploadedLogo =
    await uploadPlatformLogo({
      actor,

      currentUserUID,

      file:
        input.file,
    });

  const updatedSettings =
    applyPlatformLogoMetadata(
      existingSettings,
      {
        ...uploadedLogo,

        updatedByUID:
          currentUserUID,
      },
    );

  try {
    await setDoc(
      platformSettingsDocumentReference(),
      {
        ...serializePlatformSettingsForFirestore(
          updatedSettings,
        ),

        updatedAt:
          serverTimestamp(),
      },
      {
        merge:
          true,
      },
    );

    return updatedSettings;
  } catch (error: unknown) {
    /*
     * Firestore failed after Storage succeeded.
     *
     * Attempt to remove the uploaded file so the platform does
     * not retain an orphaned logo.
     */
    try {
      await deleteObject(
        ref(
          storage,
          uploadedLogo
            .logoStoragePath,
        ),
      );
    } catch {
      // Preserve the original Firestore error.
    }

    throw normalizePlatformSettingsFirebaseError(
      error,
      "The uploaded platform logo could not be connected to Platform Settings.",
    );
  }
}

// =======================================================
// MARK: - Restore Default Logo
// =======================================================

export async function restoreDefaultPlatformLogoAndSave(
  input: {
    actor:
      PlatformSettingsActor;

    currentUserUID:
      string;

    existingSettings:
      PlatformSettingsRecord;
  },
): Promise<PlatformSettingsRecord> {
  const actor =
    normalizePlatformSettingsActor(
      input.actor,
    );

  const permissions =
    calculatePlatformSettingsPermissions(
      actor,
    );

  if (
    !permissions
      .canRestoreDefaultLogo
  ) {
    throw new PlatformSettingsFirestoreError(
      "permission-denied",
      "Only a Platform Administrator can restore the default platform logo.",
    );
  }

  const currentUserUID =
    input.currentUserUID.trim() ||
    actor.firebaseUID;

  if (!currentUserUID) {
    throw new PlatformSettingsFirestoreError(
      "missing-user-id",
      "The signed-in Platform Administrator identity is required.",
    );
  }

  const existingStoragePath =
    input
      .existingSettings
      .logoStoragePath
      .trim();

  const restoredSettings =
    restoreDefaultPlatformLogo(
      input.existingSettings,
      currentUserUID,
    );

  try {
    await setDoc(
      platformSettingsDocumentReference(),
      {
        ...serializePlatformSettingsForFirestore(
          restoredSettings,
        ),

        logoStoragePath:
          "",

        logoDownloadURL:
          "",

        logoFileName:
          "",

        hasCustomLogo:
          false,

        updatedAt:
          serverTimestamp(),
      },
      {
        merge:
          true,
      },
    );

    /*
     * Delete Storage only after Firestore has successfully
     * restored the default state.
     */
    if (existingStoragePath) {
      try {
        await deleteObject(
          ref(
            storage,
            existingStoragePath,
          ),
        );
      } catch (error: unknown) {
        /*
         * A missing file must not undo the restored Firestore
         * state. Other Storage failures are logged for review.
         */
        if (
          !isStorageObjectNotFoundError(
            error,
          )
        ) {
          console.warn(
            "Unable to remove previous platform logo:",
            error,
          );
        }
      }
    }

    return restoredSettings;
  } catch (error: unknown) {
    throw normalizePlatformSettingsFirebaseError(
      error,
      "The default platform logo could not be restored.",
    );
  }
}

// =======================================================
// MARK: - Logo Validation
// =======================================================

export function validatePlatformLogoFile(
  file: File,
): void {
  if (!file) {
    throw new PlatformSettingsFirestoreError(
      "missing-file",
      "Choose a platform logo file.",
    );
  }

  if (
    file.size <= 0
  ) {
    throw new PlatformSettingsFirestoreError(
      "empty-file",
      "The selected platform logo file is empty.",
    );
  }

  if (
    file.size >
    PLATFORM_LOGO_MAX_FILE_SIZE_BYTES
  ) {
    throw new PlatformSettingsFirestoreError(
      "file-too-large",
      "The platform logo cannot exceed 8 MB.",
    );
  }

  const normalizedMimeType =
    file.type
      .trim()
      .toLowerCase();

  if (
    !PLATFORM_LOGO_ALLOWED_MIME_TYPES.includes(
      normalizedMimeType as
        (
          typeof PLATFORM_LOGO_ALLOWED_MIME_TYPES
        )[number],
    )
  ) {
    throw new PlatformSettingsFirestoreError(
      "unsupported-file-type",
      "Use a PNG, JPEG, WebP or SVG platform logo.",
    );
  }
}

// =======================================================
// MARK: - File Extension
// =======================================================

function resolvePlatformLogoFileExtension(
  file: File,
): string {
  const mimeType =
    file.type
      .trim()
      .toLowerCase();

  switch (mimeType) {
    case "image/jpeg":
      return "jpg";

    case "image/webp":
      return "webp";

    case "image/svg+xml":
      return "svg";

    case "image/png":
    default:
      return "png";
  }
}

// =======================================================
// MARK: - Firebase Errors
// =======================================================

function normalizePlatformSettingsFirebaseError(
  error: unknown,
  fallbackMessage: string,
): PlatformSettingsFirestoreError {
  if (
    error instanceof
    PlatformSettingsFirestoreError
  ) {
    return error;
  }

  if (
    error instanceof
    PlatformSettingsDomainError
  ) {
    return new PlatformSettingsFirestoreError(
      error.code,
      error.message,
    );
  }

  const firebaseCode =
    readFirebaseErrorCode(
      error,
    );

  if (
    firebaseCode.includes(
      "permission-denied",
    ) ||
    firebaseCode.includes(
      "unauthorized",
    )
  ) {
    return new PlatformSettingsFirestoreError(
      "permission-denied",
      "Firebase denied access to global Platform Settings.",
    );
  }

  if (
    firebaseCode.includes(
      "unauthenticated",
    )
  ) {
    return new PlatformSettingsFirestoreError(
      "unauthenticated",
      "Sign in as a Platform Administrator before managing Platform Settings.",
    );
  }

  if (
    firebaseCode.includes(
      "storage/object-not-found",
    )
  ) {
    return new PlatformSettingsFirestoreError(
      "logo-not-found",
      "The platform logo file could not be found in Firebase Storage.",
    );
  }

  if (
    firebaseCode.includes(
      "storage/quota-exceeded",
    )
  ) {
    return new PlatformSettingsFirestoreError(
      "storage-quota-exceeded",
      "Firebase Storage quota has been exceeded.",
    );
  }

  const message =
    error instanceof Error &&
    error.message.trim()
      ? error.message
      : fallbackMessage;

  return new PlatformSettingsFirestoreError(
    firebaseCode ||
    "firebase-error",
    message,
  );
}

function readFirebaseErrorCode(
  error: unknown,
): string {
  if (
    !error ||
    typeof error !==
      "object"
  ) {
    return "";
  }

  const record =
    error as Record<
      string,
      unknown
    >;

  return typeof record.code ===
    "string"
    ? record.code
        .trim()
        .toLowerCase()
    : "";
}

function isStorageObjectNotFoundError(
  error: unknown,
): boolean {
  return readFirebaseErrorCode(
    error,
  ).includes(
    "storage/object-not-found",
  );
}

// =======================================================
// MARK: - Errors
// =======================================================

export class PlatformSettingsFirestoreError
  extends Error {
  readonly code:
    string;

  constructor(
    code: string,
    message: string,
  ) {
    super(
      message,
    );

    this.name =
      "PlatformSettingsFirestoreError";

    this.code =
      code;
  }
}