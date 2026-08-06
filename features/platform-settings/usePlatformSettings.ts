"use client";

/*
 * JCS Business Suite Web
 * usePlatformSettings.ts
 *
 * React state and action controller for global Platform Settings.
 *
 * Responsibilities:
 *
 * - Load platformSettings/global.
 * - Maintain Platform Settings form state.
 * - Validate and save global settings.
 * - Upload the official platform logo.
 * - Restore the default platform logo.
 * - Expose immediate Accent Color preview.
 *
 * React components should use this hook instead of communicating
 * directly with Firestore or Firebase Storage.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  arePlatformSettingsFormValuesEqual,
  calculatePlatformSettingsPermissions,
  clearPlatformSettingsFieldError,
  createPlatformSettingsFormValues,
  normalizePlatformSettingsActor,
  normalizePlatformSettingsFormValues,
  PlatformSettingsDomainError,
  PlatformSettingsValidationError,
  validatePlatformSettingsForm,
} from "./PlatformSettingsDomain";

import {
  fetchPlatformSettings,
  restoreDefaultPlatformLogoAndSave,
  savePlatformSettings,
  uploadAndSavePlatformLogo,
  validatePlatformLogoFile,
  PlatformSettingsFirestoreError,
} from "./PlatformSettingsFirestoreService";

import {
  createDefaultPlatformSettingsRecord,
  createEmptyPlatformSettingsFormErrors,
} from "./PlatformSettingsTypes";

import type {
  PlatformSettingsActor,
  PlatformSettingsFormErrors,
  PlatformSettingsFormValues,
  PlatformSettingsPermissions,
  PlatformSettingsRecord,
} from "./PlatformSettingsTypes";

// =======================================================
// MARK: - Types
// =======================================================

export interface UsePlatformSettingsInput {
  actor:
    PlatformSettingsActor;

  currentUserUID:
    string;

  autoLoad?:
    boolean;

  onAccentColorChange?:
    (
      accentColorName: string
    ) => void;

  onLanguageChange?:
    (
      languageCode: string
    ) => void;

  onSettingsSaved?:
    (
      settings:
        PlatformSettingsRecord
    ) => void;

  onLogoChanged?:
    (
      settings:
        PlatformSettingsRecord
    ) => void;
}

export interface PlatformSettingsActionSuccess {
  success: true;

  settings:
    PlatformSettingsRecord;
}

export interface PlatformSettingsActionFailure {
  success: false;

  errorMessage:
    string;
}

export type PlatformSettingsActionResult =
  | PlatformSettingsActionSuccess
  | PlatformSettingsActionFailure;

export interface PlatformLogoUploadSuccess {
  success: true;

  settings:
    PlatformSettingsRecord;
}

export interface PlatformLogoUploadFailure {
  success: false;

  errorMessage:
    string;
}

export type PlatformLogoUploadResult =
  | PlatformLogoUploadSuccess
  | PlatformLogoUploadFailure;

export interface UsePlatformSettingsResult {
  actor:
    PlatformSettingsActor;

  permissions:
    PlatformSettingsPermissions;

  settings:
    PlatformSettingsRecord | null;

  formValues:
    PlatformSettingsFormValues;

  formErrors:
    PlatformSettingsFormErrors;

  selectedLogoFile:
    File | null;

  logoPreviewURL:
    string;

  isLoading:
    boolean;

  isSaving:
    boolean;

  isUploadingLogo:
    boolean;

  isRestoringLogo:
    boolean;

  isDirty:
    boolean;

  hasCustomLogo:
    boolean;

  errorMessage:
    string;

  successMessage:
    string;

  setFieldValue:
    <K extends keyof PlatformSettingsFormValues>(
      fieldName: K,
      value: PlatformSettingsFormValues[K],
    ) => void;

  setSelectedLogoFile:
    (
      file: File | null
    ) => void;

  clearMessages:
    () => void;

  resetForm:
    () => void;

  reload:
    () => Promise<void>;

  saveSettings:
    () => Promise<PlatformSettingsActionResult>;

  uploadLogo:
    (
      file?: File | null
    ) => Promise<PlatformLogoUploadResult>;

  restoreDefaultLogo:
    () => Promise<PlatformSettingsActionResult>;
}

// =======================================================
// MARK: - Hook
// =======================================================

export function usePlatformSettings({
  actor,
  currentUserUID,
  autoLoad = true,
  onAccentColorChange,
  onLanguageChange,
  onSettingsSaved,
  onLogoChanged,
}: UsePlatformSettingsInput): UsePlatformSettingsResult {
  const normalizedActor =
    useMemo(
      () =>
        normalizePlatformSettingsActor(
          actor,
        ),
      [
        actor,
      ],
    );

  const permissions =
    useMemo(
      () =>
        calculatePlatformSettingsPermissions(
          normalizedActor,
        ),
      [
        normalizedActor,
      ],
    );

  const [
    settings,
    setSettings,
  ] =
    useState<PlatformSettingsRecord | null>(
      null,
    );

  const [
    formValues,
    setFormValues,
  ] =
    useState<PlatformSettingsFormValues>(
      () =>
        createPlatformSettingsFormValues(
          null,
        ),
    );

  const [
    formErrors,
    setFormErrors,
  ] =
    useState<PlatformSettingsFormErrors>(
      () =>
        createEmptyPlatformSettingsFormErrors(),
    );

  const [
    selectedLogoFile,
    setSelectedLogoFileState,
  ] =
    useState<File | null>(
      null,
    );

  const [
    logoPreviewURL,
    setLogoPreviewURL,
  ] =
    useState("");

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(
      autoLoad,
    );

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  const [
    isUploadingLogo,
    setIsUploadingLogo,
  ] =
    useState(false);

  const [
    isRestoringLogo,
    setIsRestoringLogo,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");

  const activeLoadID =
    useRef(0);

  const mountedReference =
    useRef(true);

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
  // MARK: - Logo Preview Cleanup
  // =====================================================

  useEffect(() => {
    return () => {
      if (
        logoPreviewURL.startsWith(
          "blob:",
        )
      ) {
        URL.revokeObjectURL(
          logoPreviewURL,
        );
      }
    };
  }, [
    logoPreviewURL,
  ]);

  // =====================================================
  // MARK: - Messages
  // =====================================================

  const clearMessages =
    useCallback((): void => {
      setErrorMessage("");
      setSuccessMessage("");
    }, []);

  // =====================================================
  // MARK: - Apply Loaded Settings
  // =====================================================

  const applySettings =
    useCallback(
      (
        nextSettings:
          PlatformSettingsRecord,
      ): void => {
        setSettings(
          nextSettings,
        );

        setFormValues(
          createPlatformSettingsFormValues(
            nextSettings,
          ),
        );

        setFormErrors(
          createEmptyPlatformSettingsFormErrors(),
        );

        setSelectedLogoFileState(
          null,
        );

        setLogoPreviewURL(
          nextSettings.logoDownloadURL,
        );

        onAccentColorChange?.(
          nextSettings.accentColorName,
        );

        onLanguageChange?.(
          nextSettings.languageCode,
        );
      },
      [
        onAccentColorChange,
        onLanguageChange,
      ],
    );

  // =====================================================
  // MARK: - Load
  // =====================================================

  const reload =
    useCallback(
      async (): Promise<void> => {
        const loadID =
          activeLoadID.current +
          1;

        activeLoadID.current =
          loadID;

        setIsLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
          if (
            !permissions
              .canViewSettings
          ) {
            throw new PlatformSettingsDomainError(
              "permission-denied",
              "Only a Platform Administrator can open global Platform Settings.",
            );
          }

          const loadedSettings =
            await fetchPlatformSettings(
              normalizedActor,
            );

          if (
            !mountedReference.current ||
            activeLoadID.current !==
              loadID
          ) {
            return;
          }

          applySettings(
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

          const message =
            platformSettingsErrorMessage(
              error,
              "The global Platform Settings could not be loaded.",
            );

          setErrorMessage(
            message,
          );

          const fallbackSettings =
            createDefaultPlatformSettingsRecord({
              createdByUID:
                currentUserUID ||
                normalizedActor.firebaseUID,
            });

          setSettings(
            fallbackSettings,
          );

          setFormValues(
            createPlatformSettingsFormValues(
              fallbackSettings,
            ),
          );
        } finally {
          if (
            mountedReference.current &&
            activeLoadID.current ===
              loadID
          ) {
            setIsLoading(false);
          }
        }
      },
      [
        applySettings,
        currentUserUID,
        normalizedActor,
        permissions.canViewSettings,
      ],
    );

  // =====================================================
  // MARK: - Automatic Load
  // =====================================================

  useEffect(() => {
  if (!autoLoad) {
    setIsLoading(false);

    return;
  }

  void reload();
}, [
  autoLoad,
  reload,
]);

  // =====================================================
  // MARK: - Field Changes
  // =====================================================

  const setFieldValue =
    useCallback(
      <
        K extends
          keyof PlatformSettingsFormValues,
      >(
        fieldName: K,
        value:
          PlatformSettingsFormValues[K],
      ): void => {
        setFormValues(
          (
            currentValues
          ) => {
            const nextValues = {
              ...currentValues,

              [fieldName]:
                value,
            };

            if (
              fieldName ===
              "accentColorName"
            ) {
              onAccentColorChange?.(
                String(
                  value,
                ),
              );
            }

            if (
              fieldName ===
              "languageCode"
            ) {
              onLanguageChange?.(
                String(
                  value,
                ),
              );
            }

            return nextValues;
          },
        );

        setFormErrors(
          (
            currentErrors
          ) =>
            clearPlatformSettingsFieldError(
              currentErrors,
              fieldName,
            ),
        );

        setErrorMessage("");
        setSuccessMessage("");
      },
      [
        onAccentColorChange,
        onLanguageChange,
      ],
    );

  // =====================================================
  // MARK: - Logo Selection
  // =====================================================

  const setSelectedLogoFile =
    useCallback(
      (
        file:
          File | null,
      ): void => {
        if (
          logoPreviewURL.startsWith(
            "blob:",
          )
        ) {
          URL.revokeObjectURL(
            logoPreviewURL,
          );
        }

        if (!file) {
          setSelectedLogoFileState(
            null,
          );

          setLogoPreviewURL(
            settings
              ?.logoDownloadURL ??
              "",
          );

          return;
        }

        try {
          validatePlatformLogoFile(
            file,
          );

          const previewURL =
            URL.createObjectURL(
              file,
            );

          setSelectedLogoFileState(
            file,
          );

          setLogoPreviewURL(
            previewURL,
          );

          setErrorMessage("");
          setSuccessMessage("");
        } catch (
          error: unknown
        ) {
          setSelectedLogoFileState(
            null,
          );

          setLogoPreviewURL(
            settings
              ?.logoDownloadURL ??
              "",
          );

          setErrorMessage(
            platformSettingsErrorMessage(
              error,
              "The selected platform logo is not valid.",
            ),
          );
        }
      },
      [
        logoPreviewURL,
        settings?.logoDownloadURL,
      ],
    );

  // =====================================================
  // MARK: - Dirty State
  // =====================================================

  const isDirty =
    useMemo(
      () => {
        const comparisonSettings =
          settings ??
          createDefaultPlatformSettingsRecord({
            createdByUID:
              currentUserUID ||
              normalizedActor.firebaseUID,
          });

        const originalValues =
          createPlatformSettingsFormValues(
            comparisonSettings,
          );

        return (
          !arePlatformSettingsFormValuesEqual(
            formValues,
            originalValues,
          ) ||
          selectedLogoFile !==
            null
        );
      },
      [
        currentUserUID,
        formValues,
        normalizedActor.firebaseUID,
        selectedLogoFile,
        settings,
      ],
    );

  // =====================================================
  // MARK: - Reset Form
  // =====================================================

  const resetForm =
    useCallback((): void => {
      const resetSettings =
        settings ??
        createDefaultPlatformSettingsRecord({
          createdByUID:
            currentUserUID ||
            normalizedActor.firebaseUID,
        });

      setFormValues(
        createPlatformSettingsFormValues(
          resetSettings,
        ),
      );

      setFormErrors(
        createEmptyPlatformSettingsFormErrors(),
      );

      setSelectedLogoFileState(
        null,
      );

      if (
        logoPreviewURL.startsWith(
          "blob:",
        )
      ) {
        URL.revokeObjectURL(
          logoPreviewURL,
        );
      }

      setLogoPreviewURL(
        resetSettings.logoDownloadURL,
      );

      setErrorMessage("");
      setSuccessMessage("");

      onAccentColorChange?.(
        resetSettings.accentColorName,
      );

      onLanguageChange?.(
        resetSettings.languageCode,
      );
    }, [
      currentUserUID,
      logoPreviewURL,
      normalizedActor.firebaseUID,
      onAccentColorChange,
      onLanguageChange,
      settings,
    ]);

  // =====================================================
  // MARK: - Save Settings
  // =====================================================

  const saveSettingsAction =
    useCallback(
      async (): Promise<PlatformSettingsActionResult> => {
        if (isSaving) {
          return {
            success:
              false,

            errorMessage:
              "Platform Settings are already being saved.",
          };
        }

        clearMessages();

        const normalizedValues =
          normalizePlatformSettingsFormValues(
            formValues,
          );

        const validation =
          validatePlatformSettingsForm(
            normalizedValues,
          );

        if (!validation.isValid) {
          setFormErrors(
            validation.errors,
          );

          const message =
            "Review the highlighted Platform Settings fields.";

          setErrorMessage(
            message,
          );

          return {
            success:
              false,

            errorMessage:
              message,
          };
        }

        if (
          !permissions
            .canManageSettings
        ) {
          const message =
            "Only a Platform Administrator can save global Platform Settings.";

          setErrorMessage(
            message,
          );

          return {
            success:
              false,

            errorMessage:
              message,
          };
        }

        setIsSaving(true);

        try {
          let savedSettings =
            await savePlatformSettings({
              actor:
                normalizedActor,

              currentUserUID:
                currentUserUID ||
                normalizedActor.firebaseUID,

              formValues:
                validation.normalizedValues,

              existingSettings:
                settings,
            });

          if (selectedLogoFile) {
            savedSettings =
              await uploadAndSavePlatformLogo({
                actor:
                  normalizedActor,

                currentUserUID:
                  currentUserUID ||
                  normalizedActor.firebaseUID,

                file:
                  selectedLogoFile,

                existingSettings:
                  savedSettings,
              });
          }

          if (
            !mountedReference.current
          ) {
            return {
              success:
                true,

              settings:
                savedSettings,
            };
          }

          applySettings(
            savedSettings,
          );

          setSuccessMessage(
            selectedLogoFile
              ? "Platform Settings and the official logo were saved."
              : "Platform Settings were saved.",
          );

          onSettingsSaved?.(
            savedSettings,
          );

          if (selectedLogoFile) {
            onLogoChanged?.(
              savedSettings,
            );
          }

          return {
            success:
              true,

            settings:
              savedSettings,
          };
        } catch (
          error: unknown
        ) {
          const message =
            platformSettingsErrorMessage(
              error,
              "The global Platform Settings could not be saved.",
            );

          if (
            error instanceof
            PlatformSettingsValidationError
          ) {
            setFormErrors(
              error.formErrors,
            );
          }

          if (
            mountedReference.current
          ) {
            setErrorMessage(
              message,
            );
          }

          return {
            success:
              false,

            errorMessage:
              message,
          };
        } finally {
          if (
            mountedReference.current
          ) {
            setIsSaving(false);
          }
        }
      },
      [
        applySettings,
        clearMessages,
        currentUserUID,
        formValues,
        isSaving,
        normalizedActor,
        onLogoChanged,
        onSettingsSaved,
        permissions.canManageSettings,
        selectedLogoFile,
        settings,
      ],
    );

  // =====================================================
  // MARK: - Upload Logo
  // =====================================================

  const uploadLogo =
    useCallback(
      async (
        file?:
          File | null,
      ): Promise<PlatformLogoUploadResult> => {
        if (
          isUploadingLogo
        ) {
          return {
            success:
              false,

            errorMessage:
              "The platform logo is already being uploaded.",
          };
        }

        const logoFile =
          file ??
          selectedLogoFile;

        if (!logoFile) {
          const message =
            "Choose a platform logo before uploading.";

          setErrorMessage(
            message,
          );

          return {
            success:
              false,

            errorMessage:
              message,
          };
        }

        if (
          !permissions
            .canUploadLogo
        ) {
          const message =
            "Only a Platform Administrator can upload the official platform logo.";

          setErrorMessage(
            message,
          );

          return {
            success:
              false,

            errorMessage:
              message,
          };
        }

        setIsUploadingLogo(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
          validatePlatformLogoFile(
            logoFile,
          );

          const existingSettings =
            settings ??
            createDefaultPlatformSettingsRecord({
              createdByUID:
                currentUserUID ||
                normalizedActor.firebaseUID,
            });

          const updatedSettings =
            await uploadAndSavePlatformLogo({
              actor:
                normalizedActor,

              currentUserUID:
                currentUserUID ||
                normalizedActor.firebaseUID,

              file:
                logoFile,

              existingSettings,
            });

          if (
            mountedReference.current
          ) {
            applySettings(
              updatedSettings,
            );

            setSuccessMessage(
              "The official JCS Business Suite logo was uploaded.",
            );

            onLogoChanged?.(
              updatedSettings,
            );
          }

          return {
            success:
              true,

            settings:
              updatedSettings,
          };
        } catch (
          error: unknown
        ) {
          const message =
            platformSettingsErrorMessage(
              error,
              "The official platform logo could not be uploaded.",
            );

          if (
            mountedReference.current
          ) {
            setErrorMessage(
              message,
            );
          }

          return {
            success:
              false,

            errorMessage:
              message,
          };
        } finally {
          if (
            mountedReference.current
          ) {
            setIsUploadingLogo(false);
          }
        }
      },
      [
        applySettings,
        currentUserUID,
        isUploadingLogo,
        normalizedActor,
        onLogoChanged,
        permissions.canUploadLogo,
        selectedLogoFile,
        settings,
      ],
    );

  // =====================================================
  // MARK: - Restore Default Logo
  // =====================================================

  const restoreDefaultLogo =
    useCallback(
      async (): Promise<PlatformSettingsActionResult> => {
        if (
          isRestoringLogo
        ) {
          return {
            success:
              false,

            errorMessage:
              "The default platform logo is already being restored.",
          };
        }

        if (
          !permissions
            .canRestoreDefaultLogo
        ) {
          const message =
            "Only a Platform Administrator can restore the default platform logo.";

          setErrorMessage(
            message,
          );

          return {
            success:
              false,

            errorMessage:
              message,
          };
        }

        const existingSettings =
          settings ??
          createDefaultPlatformSettingsRecord({
            createdByUID:
              currentUserUID ||
              normalizedActor.firebaseUID,
          });

        setIsRestoringLogo(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
          const restoredSettings =
            await restoreDefaultPlatformLogoAndSave({
              actor:
                normalizedActor,

              currentUserUID:
                currentUserUID ||
                normalizedActor.firebaseUID,

              existingSettings,
            });

          if (
            mountedReference.current
          ) {
            applySettings(
              restoredSettings,
            );

            setSuccessMessage(
              "The default platform logo was restored.",
            );

            onLogoChanged?.(
              restoredSettings,
            );
          }

          return {
            success:
              true,

            settings:
              restoredSettings,
          };
        } catch (
          error: unknown
        ) {
          const message =
            platformSettingsErrorMessage(
              error,
              "The default platform logo could not be restored.",
            );

          if (
            mountedReference.current
          ) {
            setErrorMessage(
              message,
            );
          }

          return {
            success:
              false,

            errorMessage:
              message,
          };
        } finally {
          if (
            mountedReference.current
          ) {
            setIsRestoringLogo(false);
          }
        }
      },
      [
        applySettings,
        currentUserUID,
        isRestoringLogo,
        normalizedActor,
        onLogoChanged,
        permissions.canRestoreDefaultLogo,
        settings,
      ],
    );

  // =====================================================
  // MARK: - Result
  // =====================================================

  return {
    actor:
      normalizedActor,

    permissions,

    settings,

    formValues,

    formErrors,

    selectedLogoFile,

    logoPreviewURL,

    isLoading,

    isSaving,

    isUploadingLogo,

    isRestoringLogo,

    isDirty,

    hasCustomLogo:
      settings
        ?.hasCustomLogo ===
      true,

    errorMessage,

    successMessage,

    setFieldValue,

    setSelectedLogoFile,

    clearMessages,

    resetForm,

    reload,

    saveSettings:
      saveSettingsAction,

    uploadLogo,

    restoreDefaultLogo,
  };
}

// =======================================================
// MARK: - Error Messages
// =======================================================

function platformSettingsErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (
    error instanceof
      PlatformSettingsValidationError ||
    error instanceof
      PlatformSettingsFirestoreError ||
    error instanceof
      PlatformSettingsDomainError
  ) {
    return error.message;
  }

  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallbackMessage;
}