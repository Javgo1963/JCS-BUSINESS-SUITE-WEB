"use client";

/*
 * JCS Business Suite Web
 * useAppSettings.ts
 *
 * React state and action controller for:
 *
 * - Business App Settings loading.
 * - Initial settings creation.
 * - Real-time Firestore synchronization.
 * - Company information editing.
 * - Tax configuration.
 * - Language and Dashboard Accent Color.
 * - App Settings permissions.
 * - Active branding preservation.
 * - Form validation and dirty-state tracking.
 * - Save, reload and reset behavior.
 *
 * React visual components and direct Firebase operations
 * must not live in this file.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AppSettingsValidationError,
  areAppSettingsFormValuesEqual,
  calculateAppSettingsPermissions,
  clearAppSettingsFieldError,
  createAppSettingsFormValues,
  normalizeAppSettingsFormValues,
  validateAppSettingsForm,
} from "./AppSettingsDomain";

import {
  ensureAppSettingsExists,
  fetchAppSettings,
  saveAppSettings,
  subscribeToAppSettings,
} from "./AppSettingsFirestoreService";

import {
  EMPTY_APP_SETTINGS_UI_STATE,
  createEmptyAppSettingsFormErrors,
} from "./AppSettingsTypes";

import type {
  AppSettingsActor,
  AppSettingsFormErrors,
  AppSettingsFormValues,
  AppSettingsOperationResult,
  AppSettingsPermissions,
  AppSettingsRecord,
  AppSettingsUIState,
} from "./AppSettingsTypes";

import type {
  BusinessBrandingSettings,
} from "../business-branding/BusinessLogoTypes";

// MARK: - Hook Input

export interface UseAppSettingsInput {
  businessID: string;
  ownerUID: string;

  currentUserUID: string;

  actor: AppSettingsActor;

  /**
   * Optional company name available from onboarding or
   * the current business context before App Settings exists.
   */
  initialCompanyName?: string;

  /**
   * Current active branding supplied by useBusinessLogo.
   *
   * Passing this value ensures a newly selected or uploaded logo
   * remains synchronized when the rest of App Settings is saved.
   */
  branding?: BusinessBrandingSettings | null;

  /**
   * Automatically loads or creates App Settings.
   */
  autoLoad?: boolean;

  /**
   * Enables real-time Firestore synchronization after loading.
   */
  subscribeToChanges?: boolean;

  /**
   * When true, incoming Firestore updates may replace a clean form.
   * Unsaved local edits are protected from remote replacement.
   */
  preserveUnsavedChanges?: boolean;
}

// MARK: - Field Names

export type AppSettingsEditableField =
  keyof AppSettingsFormValues;

// MARK: - Hook Action Result

export type AppSettingsHookActionResult =
  AppSettingsOperationResult;

// MARK: - Hook Return

export interface UseAppSettingsResult {
  // Identity

  businessID: string;
  ownerUID: string;
  currentUserUID: string;

  // Permissions

  permissions: AppSettingsPermissions;

  canViewSettings: boolean;
  canManageSettings: boolean;

  // Persisted and editable state

  settings: AppSettingsRecord | null;
  formValues: AppSettingsFormValues;
  formErrors: AppSettingsFormErrors;

  // Status

  isLoading: boolean;
  isSaving: boolean;
  isResettingDemo: boolean;

  hasLoaded: boolean;
  isDirty: boolean;

  errorMessage: string;
  successMessage: string;

  // Field actions

  setFieldValue: <Field extends AppSettingsEditableField>(
    field: Field,
    value: AppSettingsFormValues[Field],
  ) => void;

  setFormValues: (
    values: AppSettingsFormValues,
  ) => void;

  resetForm: () => void;

  // Persistence actions

  loadSettings:
    () => Promise<AppSettingsHookActionResult>;

  reloadSettings:
    () => Promise<AppSettingsHookActionResult>;

  saveSettings:
    () => Promise<AppSettingsHookActionResult>;

  // Validation

  validateForm: () => boolean;

  // Message actions

  clearError: () => void;
  clearSuccess: () => void;
  clearMessages: () => void;
}

// MARK: - Hook

export function useAppSettings(
  input: UseAppSettingsInput,
): UseAppSettingsResult {
  const {
    businessID,
    ownerUID,
    currentUserUID,
    actor,

    initialCompanyName = "",
    branding = null,

    autoLoad = true,
    subscribeToChanges = true,
    preserveUnsavedChanges = true,
  } = input;

  const cleanBusinessID =
    businessID.trim();

  const cleanOwnerUID =
    ownerUID.trim();

  const cleanCurrentUserUID =
    currentUserUID.trim();

  const [
    settings,
    setSettings,
  ] =
    useState<AppSettingsRecord | null>(
      null,
    );

  const [
    uiState,
    setUIState,
  ] =
    useState<AppSettingsUIState>({
      ...EMPTY_APP_SETTINGS_UI_STATE,

      formValues: {
        ...EMPTY_APP_SETTINGS_UI_STATE.formValues,

        companyName:
          initialCompanyName
            .trim()
            .replace(/\s+/g, " ") ||
          EMPTY_APP_SETTINGS_UI_STATE
            .formValues
            .companyName,
      },

      formErrors:
        createEmptyAppSettingsFormErrors(),
    });

  // MARK: - References

  const isMountedReference =
    useRef(true);

  const loadSequenceReference =
    useRef(0);

  const initialFormValuesReference =
    useRef<AppSettingsFormValues>(
      uiState.formValues,
    );

  const subscriptionBusinessIDReference =
    useRef("");

  // MARK: - Lifecycle

  useEffect(() => {
    isMountedReference.current = true;

    return () => {
      isMountedReference.current = false;
    };
  }, []);

  // MARK: - Permissions

  const permissions =
    useMemo(
      () =>
        calculateAppSettingsPermissions(
          actor,
          cleanBusinessID,
        ),
      [
        actor,
        cleanBusinessID,
      ],
    );

  const canManageSettings =
    permissions.accessLevel ===
      "manage" ||
    permissions.accessLevel ===
      "platform";

  // MARK: - Safe State Helpers

  const safelySetUIState =
    useCallback(
      (
        updater:
          | AppSettingsUIState
          | ((
              currentState:
                AppSettingsUIState,
            ) => AppSettingsUIState),
      ) => {
        if (!isMountedReference.current) {
          return;
        }

        setUIState(updater);
      },
      [],
    );

  const safelySetSettings =
    useCallback(
      (
        value:
          | AppSettingsRecord
          | null,
      ) => {
        if (!isMountedReference.current) {
          return;
        }

        setSettings(value);
      },
      [],
    );

  // MARK: - Message Helpers

  const clearError =
    useCallback(() => {
      safelySetUIState(
        (currentState) => ({
          ...currentState,
          errorMessage: "",
        }),
      );
    }, [safelySetUIState]);

  const clearSuccess =
    useCallback(() => {
      safelySetUIState(
        (currentState) => ({
          ...currentState,
          successMessage: "",
        }),
      );
    }, [safelySetUIState]);

  const clearMessages =
    useCallback(() => {
      safelySetUIState(
        (currentState) => ({
          ...currentState,
          errorMessage: "",
          successMessage: "",
        }),
      );
    }, [safelySetUIState]);

  const setOperationError =
    useCallback(
      (
        error: unknown,
        fallbackMessage: string,
      ): string => {
        const errorMessage =
          getAppSettingsErrorMessage(
            error,
            fallbackMessage,
          );

        const formErrors =
          getAppSettingsFormErrors(
            error,
          );

        safelySetUIState(
          (currentState) => ({
            ...currentState,

            isLoading: false,
            isSaving: false,
            isResettingDemo: false,

            errorMessage,
            successMessage: "",

            formErrors:
              formErrors ?? {
                ...currentState.formErrors,

                general:
                  errorMessage,
              },
          }),
        );

        return errorMessage;
      },
      [safelySetUIState],
    );

  // MARK: - Apply Persisted Settings

  const applyLoadedSettings =
    useCallback(
      (
        nextSettings:
          AppSettingsRecord,

        options?: {
          preserveDirtyForm?: boolean;
          successMessage?: string;
        },
      ) => {
        safelySetSettings(
          nextSettings,
        );

        const nextFormValues =
          createAppSettingsFormValues(
            nextSettings,
          );

        safelySetUIState(
          (currentState) => {
            const shouldPreserveForm =
              options
                ?.preserveDirtyForm === true &&
              currentState.isDirty;

            if (!shouldPreserveForm) {
              initialFormValuesReference.current =
                nextFormValues;
            }

            return {
              ...currentState,

              isLoading: false,
              isSaving: false,

              hasLoaded: true,

              isDirty:
                shouldPreserveForm
                  ? currentState.isDirty
                  : false,

              formValues:
                shouldPreserveForm
                  ? currentState.formValues
                  : nextFormValues,

              formErrors:
                shouldPreserveForm
                  ? currentState.formErrors
                  : createEmptyAppSettingsFormErrors(),

              errorMessage: "",

              successMessage:
                options
                  ?.successMessage ??
                currentState.successMessage,
            };
          },
        );
      },
      [
        safelySetSettings,
        safelySetUIState,
      ],
    );

  // MARK: - Load or Create

  const loadSettings =
    useCallback(
      async (): Promise<AppSettingsHookActionResult> => {
        if (!permissions.canViewSettings) {
          const errorMessage =
            "You do not have permission to view App Settings for this business.";

          safelySetUIState(
            (currentState) => ({
              ...currentState,

              isLoading: false,
              hasLoaded: true,

              errorMessage,
              successMessage: "",
            }),
          );

          return {
            success: false,
            errorMessage,
          };
        }

        if (!cleanBusinessID) {
          const errorMessage =
            "The business ID is required before loading App Settings.";

          safelySetUIState(
            (currentState) => ({
              ...currentState,

              isLoading: false,
              hasLoaded: true,

              errorMessage,
              successMessage: "",
            }),
          );

          return {
            success: false,
            errorMessage,
          };
        }

        const requestSequence =
          loadSequenceReference.current + 1;

        loadSequenceReference.current =
          requestSequence;

        safelySetUIState(
          (currentState) => ({
            ...currentState,

            isLoading: true,

            errorMessage: "",
            successMessage: "",
          }),
        );

        try {
          let loadedSettings =
            await fetchAppSettings({
              businessID:
                cleanBusinessID,
            });

          if (
            !loadedSettings &&
            canManageSettings
          ) {
            if (!cleanOwnerUID) {
              throw new Error(
                "The Business Owner identity is required before creating App Settings.",
              );
            }

            if (!cleanCurrentUserUID) {
              throw new Error(
                "The signed-in user identity is required before creating App Settings.",
              );
            }

            loadedSettings =
              await ensureAppSettingsExists({
                businessID:
                  cleanBusinessID,

                ownerUID:
                  cleanOwnerUID,

                createdByUID:
                  cleanCurrentUserUID,

                companyName:
                  initialCompanyName,
              });
          }

          if (!loadedSettings) {
            throw new Error(
              "App Settings has not been created for this business.",
            );
          }

          const isLatestRequest =
            loadSequenceReference.current ===
            requestSequence;

          if (
            !isMountedReference.current ||
            !isLatestRequest
          ) {
            return {
              success: true,
              settings:
                loadedSettings,
            };
          }

          applyLoadedSettings(
            loadedSettings,
          );

          return {
            success: true,
            settings:
              loadedSettings,
          };
        } catch (error) {
          const errorMessage =
            setOperationError(
              error,
              "App Settings could not be loaded.",
            );

          return {
            success: false,
            errorMessage,
          };
        }
      },
      [
        permissions.canViewSettings,
        cleanBusinessID,
        cleanOwnerUID,
        cleanCurrentUserUID,
        canManageSettings,
        initialCompanyName,
        safelySetUIState,
        applyLoadedSettings,
        setOperationError,
      ],
    );

  const reloadSettings =
    useCallback(
      async (): Promise<AppSettingsHookActionResult> => {
        loadSequenceReference.current +=
          1;

        return loadSettings();
      },
      [loadSettings],
    );

  // MARK: - Automatic Initial Load

  useEffect(() => {
    if (
      !autoLoad ||
      !cleanBusinessID ||
      !permissions.canViewSettings
    ) {
      return;
    }

    void loadSettings();
  }, [
    autoLoad,
    cleanBusinessID,
    permissions.canViewSettings,
    loadSettings,
  ]);

  // MARK: - Real-Time Subscription

  useEffect(() => {
    if (
      !subscribeToChanges ||
      !cleanBusinessID ||
      !permissions.canViewSettings ||
      !uiState.hasLoaded
    ) {
      return;
    }

    subscriptionBusinessIDReference.current =
      cleanBusinessID;

    const unsubscribe =
      subscribeToAppSettings({
        businessID:
          cleanBusinessID,

        onData:
          (
            nextSettings,
          ) => {
            if (
              subscriptionBusinessIDReference.current !==
              cleanBusinessID
            ) {
              return;
            }

            applyLoadedSettings(
              nextSettings,
              {
                preserveDirtyForm:
                  preserveUnsavedChanges,
              },
            );
          },

        onError:
          (
            error,
          ) => {
            setOperationError(
              error,
              "The App Settings live update failed.",
            );
          },
      });

    return () => {
      subscriptionBusinessIDReference.current =
        "";

      unsubscribe();
    };
  }, [
    subscribeToChanges,
    cleanBusinessID,
    permissions.canViewSettings,
    uiState.hasLoaded,
    preserveUnsavedChanges,
    applyLoadedSettings,
    setOperationError,
  ]);

  // MARK: - Field Editing

  const setFieldValue =
    useCallback(
      <
        Field extends
          AppSettingsEditableField,
      >(
        field: Field,
        value:
          AppSettingsFormValues[Field],
      ) => {
        if (!canManageSettings) {
          return;
        }

        safelySetUIState(
          (currentState) => {
            const nextFormValues:
              AppSettingsFormValues = {
              ...currentState.formValues,

              [field]:
                value,
            };

            const normalizedNextValues =
              normalizeAppSettingsFormValues(
                nextFormValues,
              );

            return {
              ...currentState,

              formValues:
                nextFormValues,

              formErrors:
                clearAppSettingsFieldError(
                  currentState.formErrors,
                  mapFieldToErrorField(
                    field,
                  ),
                ),

              isDirty:
                !areAppSettingsFormValuesEqual(
                  normalizedNextValues,
                  initialFormValuesReference.current,
                ),

              errorMessage: "",
              successMessage: "",
            };
          },
        );
      },
      [
        canManageSettings,
        safelySetUIState,
      ],
    );

  const setFormValues =
    useCallback(
      (
        values:
          AppSettingsFormValues,
      ) => {
        if (!canManageSettings) {
          return;
        }

        const normalizedValues =
          normalizeAppSettingsFormValues(
            values,
          );

        safelySetUIState(
          (currentState) => ({
            ...currentState,

            formValues:
              values,

            formErrors:
              createEmptyAppSettingsFormErrors(),

            isDirty:
              !areAppSettingsFormValuesEqual(
                normalizedValues,
                initialFormValuesReference.current,
              ),

            errorMessage: "",
            successMessage: "",
          }),
        );
      },
      [
        canManageSettings,
        safelySetUIState,
      ],
    );

  // MARK: - Reset Form

  const resetForm =
    useCallback(() => {
      const resetValues =
        settings
          ? createAppSettingsFormValues(
              settings,
            )
          : initialFormValuesReference.current;

      initialFormValuesReference.current =
        resetValues;

      safelySetUIState(
        (currentState) => ({
          ...currentState,

          formValues:
            resetValues,

          formErrors:
            createEmptyAppSettingsFormErrors(),

          isDirty:
            false,

          errorMessage:
            "",

          successMessage:
            "",
        }),
      );
    }, [
      settings,
      safelySetUIState,
    ]);

  // MARK: - Validation

  const validateForm =
    useCallback((): boolean => {
      const validation =
        validateAppSettingsForm(
          uiState.formValues,
        );

      if (validation.isValid) {
        safelySetUIState(
          (currentState) => ({
            ...currentState,

            formValues:
              validation.normalizedValues,

            formErrors:
              createEmptyAppSettingsFormErrors(),

            errorMessage:
              "",
          }),
        );

        return true;
      }

      safelySetUIState(
        (currentState) => ({
          ...currentState,

          formErrors:
            validation.errors,

          errorMessage:
            validation.errors.general ||
            "Review the highlighted App Settings fields.",
        }),
      );

      return false;
    }, [
      uiState.formValues,
      safelySetUIState,
    ]);

  // MARK: - Save Settings

  const saveSettings =
    useCallback(
      async (): Promise<AppSettingsHookActionResult> => {
        if (!canManageSettings) {
          const errorMessage =
            "You do not have permission to change App Settings for this business.";

          safelySetUIState(
            (currentState) => ({
              ...currentState,

              errorMessage,
              successMessage: "",
            }),
          );

          return {
            success: false,
            errorMessage,
          };
        }

        if (!cleanBusinessID) {
          const errorMessage =
            "The business ID is required before saving App Settings.";

          safelySetUIState(
            (currentState) => ({
              ...currentState,

              errorMessage,
              successMessage: "",
            }),
          );

          return {
            success: false,
            errorMessage,
          };
        }

        if (!cleanOwnerUID) {
          const errorMessage =
            "The Business Owner identity is required before saving App Settings.";

          safelySetUIState(
            (currentState) => ({
              ...currentState,

              errorMessage,
              successMessage: "",
            }),
          );

          return {
            success: false,
            errorMessage,
          };
        }

        if (!cleanCurrentUserUID) {
          const errorMessage =
            "The signed-in user identity is required before saving App Settings.";

          safelySetUIState(
            (currentState) => ({
              ...currentState,

              errorMessage,
              successMessage: "",
            }),
          );

          return {
            success: false,
            errorMessage,
          };
        }

        const validation =
          validateAppSettingsForm(
            uiState.formValues,
          );

        if (!validation.isValid) {
          safelySetUIState(
            (currentState) => ({
              ...currentState,

              formErrors:
                validation.errors,

              errorMessage:
                "Review the highlighted App Settings fields.",

              successMessage:
                "",
            }),
          );

          return {
            success: false,

            errorMessage:
              "Review the highlighted App Settings fields.",

            errors:
              validation.errors,
          };
        }

        safelySetUIState(
          (currentState) => ({
            ...currentState,

            isSaving:
              true,

            formValues:
              validation.normalizedValues,

            formErrors:
              createEmptyAppSettingsFormErrors(),

            errorMessage:
              "",

            successMessage:
              "",
          }),
        );

        try {
          const result =
            await saveAppSettings({
              businessID:
                cleanBusinessID,

              ownerUID:
                cleanOwnerUID,

              createdByUID:
                settings
                  ?.createdByUID ||
                cleanCurrentUserUID,

              updatedByUID:
                cleanCurrentUserUID,

              formValues:
                validation
                  .normalizedValues,

              branding,
            });

          applyLoadedSettings(
            result.settings,
            {
              successMessage:
                "App Settings saved successfully.",
            },
          );

          return {
            success: true,
            settings:
              result.settings,
          };
        } catch (error) {
          if (
            error instanceof
            AppSettingsValidationError
          ) {
            safelySetUIState(
              (currentState) => ({
                ...currentState,

                isSaving:
                  false,

                formErrors:
                  error.formErrors,

                errorMessage:
                  error.message,

                successMessage:
                  "",
              }),
            );

            return {
              success: false,

              errorMessage:
                error.message,

              errors:
                error.formErrors,
            };
          }

          const errorMessage =
            setOperationError(
              error,
              "App Settings could not be saved.",
            );

          return {
            success: false,
            errorMessage,
          };
        }
      },
      [
        canManageSettings,
        cleanBusinessID,
        cleanOwnerUID,
        cleanCurrentUserUID,
        uiState.formValues,
        settings,
        branding,
        safelySetUIState,
        applyLoadedSettings,
        setOperationError,
      ],
    );

 // MARK: - Branding Synchronization

/*
 * Synchronize the currently active business branding without
 * creating a settings update loop.
 *
 * The functional state update compares the existing branding
 * values before creating a new AppSettingsRecord object.
 */
useEffect(() => {
  if (
    !branding ||
    branding.businessID.trim() !==
      cleanBusinessID
  ) {
    return;
  }

  if (
    !isMountedReference.current
  ) {
    return;
  }

  setSettings(
    (currentSettings) => {
      if (!currentSettings) {
        return currentSettings;
      }

      const nextAccentColorName =
        isSupportedAccentColorName(
          branding.accentColorName,
        )
          ? branding.accentColorName
          : currentSettings
              .accentColorName;

      const nextCompanyName =
        branding.companyName ||
        currentSettings.companyName;

      const hasBrandingChanged =
        nextCompanyName !==
          currentSettings
            .companyName ||
        nextAccentColorName !==
          currentSettings
            .accentColorName ||
        branding.activeLogoID !==
          currentSettings
            .activeLogoID ||
        branding.activeLogoSource !==
          currentSettings
            .activeLogoSource ||
        branding.logoStoragePath !==
          currentSettings
            .logoStoragePath ||
        branding.logoDownloadURL !==
          currentSettings
            .logoDownloadURL ||
        branding.logoRenderingMode !==
          currentSettings
            .logoRenderingMode ||
        branding.logoSupportsAccentColor !==
          currentSettings
            .logoSupportsAccentColor ||
        branding.useAccentColorForLogo !==
          currentSettings
            .useAccentColorForLogo ||
        branding.updatedAtISO !==
          currentSettings
            .updatedAtISO;

      if (!hasBrandingChanged) {
        return currentSettings;
      }

      return {
        ...currentSettings,

        companyName:
          nextCompanyName,

        accentColorName:
          nextAccentColorName,

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
      };
    },
  );
}, [
  branding,
  cleanBusinessID,
]);



  return {
    businessID:
      cleanBusinessID,

    ownerUID:
      cleanOwnerUID,

    currentUserUID:
      cleanCurrentUserUID,

    permissions,

    canViewSettings:
      permissions.canViewSettings,

    canManageSettings,

    settings,

    formValues:
      uiState.formValues,

    formErrors:
      uiState.formErrors,

    isLoading:
      uiState.isLoading,

    isSaving:
      uiState.isSaving,

    isResettingDemo:
      uiState.isResettingDemo,

    hasLoaded:
      uiState.hasLoaded,

    isDirty:
      uiState.isDirty,

    errorMessage:
      uiState.errorMessage,

    successMessage:
      uiState.successMessage,

    setFieldValue,
    setFormValues,
    resetForm,

    loadSettings,
    reloadSettings,
    saveSettings,

    validateForm,

    clearError,
    clearSuccess,
    clearMessages,
  };
}

// MARK: - Helpers

function mapFieldToErrorField(
  field: AppSettingsEditableField,
): keyof AppSettingsFormErrors {
  switch (field) {
    case "companyName":
      return "companyName";

    case "addressLine1":
      return "addressLine1";

    case "addressLine2":
      return "addressLine2";

    case "phone":
      return "phone";

    case "email":
      return "email";

    case "taxPercentText":
      return "taxPercent";

    case "languageCode":
      return "languageCode";

    case "accentColorName":
      return "accentColorName";

    default:
      return "general";
  }
}

function getAppSettingsErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message.trim();
  }

  if (
    typeof error === "string" &&
    error.trim()
  ) {
    return error.trim();
  }

  return fallbackMessage;
}

function getAppSettingsFormErrors(
  error: unknown,
): AppSettingsFormErrors | null {
  if (
    error instanceof
    AppSettingsValidationError
  ) {
    return {
      ...error.formErrors,
    };
  }

  const possibleError =
    error as {
      formErrors?: unknown;
    };

  if (
    possibleError.formErrors &&
    typeof possibleError.formErrors ===
      "object"
  ) {
    return {
      ...createEmptyAppSettingsFormErrors(),
      ...(
        possibleError.formErrors as
          Partial<AppSettingsFormErrors>
      ),
    };
  }

  return null;
}

function isSupportedAccentColorName(
  value: string,
): value is AppSettingsRecord["accentColorName"] {
  return Boolean(
    value.trim(),
  );
}