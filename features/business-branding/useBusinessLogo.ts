"use client";

/*
 * JCS Business Suite Web
 * useBusinessLogo.ts
 *
 * React controller for the professional business-logo system.
 *
 * Responsibilities:
 *
 * - Load the active logo and branding settings.
 * - Generate premium Sofia logo options.
 * - Track the selected generated option.
 * - Save the selected Sofia logo.
 * - Upload a Business Owner selected logo.
 * - Track upload and generation progress.
 * - Restore the default JCS logo.
 * - Update accent-color rendering preferences.
 * - Cancel active generation requests.
 *
 * Firebase implementation details and visual components
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
  generateBusinessLogoOptions,
} from "./BusinessLogoGenerationService";

import {
  findBusinessLogoOption,
  loadActiveBusinessLogo,
  restoreBusinessDefaultLogo,
  saveBusinessLogoRenderingPreference,
  saveGeneratedBusinessLogo,
  saveUploadedBusinessLogo,
  selectSofiaRecommendedLogoOption,
} from "./BusinessLogoService";

import {
  EMPTY_BUSINESS_LOGO_UI_STATE,
} from "./BusinessLogoTypes";

import type {
  BusinessLogoGenerationProgress,
} from "./BusinessLogoGenerationService";

import type {
  BusinessLogoUploadProgress,
} from "./BusinessLogoStorageService";

import type {
  ActiveBusinessBrandingResult,
} from "./BusinessLogoFirestoreService";

import type {
  BusinessBrandingSettings,
  BusinessLogoDNAContext,
  BusinessLogoOption,
  BusinessLogoRecord,
  BusinessLogoRenderingMode,
  BusinessLogoUIState,
} from "./BusinessLogoTypes";

// MARK: - Hook Input

export interface UseBusinessLogoInput {
  businessID: string;

  ownerUID: string;
  createdByUID: string;

  businessName: string;
  accentColorName: string;

  industry?: string;
  businessCategory?: string;

  style?: string;
  tagline?: string;
  languageCode?: string;

  logoPrompt?: string;
  businessDNA?: BusinessLogoDNAContext;

  /**
   * Loads the current branding automatically when the hook
   * receives a valid business ID.
   */
  autoLoad?: boolean;
}

// MARK: - Operation Result

export type BusinessLogoHookOperationResult =
  | {
      success: true;
    }
  | {
      success: false;
      errorMessage: string;
    };

// MARK: - Hook Result

export interface UseBusinessLogoResult {
  // Identity

  businessID: string;

  // Current persistent branding

  activeBranding: BusinessBrandingSettings | null;
  activeLogo: BusinessLogoRecord | null;

  activeLogoURL: string;
  hasCustomLogo: boolean;

  // Temporary Sofia options

  options: BusinessLogoOption[];
  selectedOptionID: string;
  selectedOption: BusinessLogoOption | null;
  recommendedOption: BusinessLogoOption | null;

  // General state

  isLoading: boolean;
  isGenerating: boolean;
  isUploading: boolean;
  isSaving: boolean;

  currentStepMessage: string;
  errorMessage: string;

  // Progress

  generationProgress: BusinessLogoGenerationProgress | null;
  uploadProgress: BusinessLogoUploadProgress | null;

  // Persistent branding actions

  reloadActiveLogo: () => Promise<BusinessLogoHookOperationResult>;

  uploadLogo: (
    file: File,
  ) => Promise<BusinessLogoHookOperationResult>;

  restoreDefaultLogo: () => Promise<BusinessLogoHookOperationResult>;

  updateRenderingPreference: (
    renderingMode: BusinessLogoRenderingMode,
    useAccentColorForLogo: boolean,
  ) => Promise<BusinessLogoHookOperationResult>;

  // Sofia premium-generation actions

  generatePremiumLogoOptions: (
    optionCount?: number,
  ) => Promise<BusinessLogoHookOperationResult>;

  selectOption: (
    optionID: string,
  ) => void;

  selectRecommendedOption: () => void;

  saveSelectedGeneratedLogo:
    () => Promise<BusinessLogoHookOperationResult>;

  cancelGeneration: () => void;
  clearGeneratedOptions: () => void;

  // Error and local-state actions

  clearError: () => void;
}

// MARK: - Hook

export function useBusinessLogo(
  input: UseBusinessLogoInput,
): UseBusinessLogoResult {
  const {
    businessID,
    ownerUID,
    createdByUID,
    businessName,
    accentColorName,

    industry = "General Business",
    businessCategory = "",
    style = "Premium professional commercial brand identity",
    tagline = "",
    languageCode = "en",

    logoPrompt = "",
    businessDNA,

    autoLoad = true,
  } = input;

  const cleanBusinessID =
    businessID.trim();

  const cleanOwnerUID =
    ownerUID.trim();

  const cleanCreatedByUID =
    createdByUID.trim();

  const cleanBusinessName =
    businessName
      .trim()
      .replace(/\s+/g, " ");

  const cleanAccentColorName =
    accentColorName.trim() || "blue";

  // MARK: Persistent Data

  const [
    activeBrandingResult,
    setActiveBrandingResult,
  ] = useState<ActiveBusinessBrandingResult | null>(
    null,
  );

  // MARK: UI State

  const [
    uiState,
    setUIState,
  ] = useState<BusinessLogoUIState>(
    EMPTY_BUSINESS_LOGO_UI_STATE,
  );

  const [
    generationProgress,
    setGenerationProgress,
  ] =
    useState<BusinessLogoGenerationProgress | null>(
      null,
    );

  const [
    uploadProgress,
    setUploadProgress,
  ] =
    useState<BusinessLogoUploadProgress | null>(
      null,
    );

  // MARK: Lifecycle and Cancellation

  const isMountedReference =
    useRef(true);

  const generationAbortControllerReference =
    useRef<AbortController | null>(
      null,
    );

  const loadRequestSequenceReference =
    useRef(0);

  useEffect(() => {
    isMountedReference.current = true;

    return () => {
      isMountedReference.current = false;

      generationAbortControllerReference.current
        ?.abort();

      generationAbortControllerReference.current =
        null;
    };
  }, []);

  // MARK: Safe State Helpers

  const safelySetUIState =
    useCallback(
      (
        updater:
          | BusinessLogoUIState
          | ((
              currentState: BusinessLogoUIState,
            ) => BusinessLogoUIState),
      ) => {
        if (!isMountedReference.current) {
          return;
        }

        setUIState(updater);
      },
      [],
    );

  const safelySetGenerationProgress =
    useCallback(
      (
        value:
          | BusinessLogoGenerationProgress
          | null,
      ) => {
        if (!isMountedReference.current) {
          return;
        }

        setGenerationProgress(value);
      },
      [],
    );

  const safelySetUploadProgress =
    useCallback(
      (
        value:
          | BusinessLogoUploadProgress
          | null,
      ) => {
        if (!isMountedReference.current) {
          return;
        }

        setUploadProgress(value);
      },
      [],
    );

  const setError =
    useCallback(
      (
        error: unknown,
        fallbackMessage: string,
      ): string => {
        const errorMessage =
          getBusinessLogoHookErrorMessage(
            error,
            fallbackMessage,
          );

        safelySetUIState(
          (currentState) => ({
            ...currentState,

            isLoading: false,
            isGenerating: false,
            isUploading: false,
            isSaving: false,

            currentStepMessage: "",
            errorMessage,
          }),
        );

        return errorMessage;
      },
      [safelySetUIState],
    );

  const clearError =
    useCallback(() => {
      safelySetUIState(
        (currentState) => ({
          ...currentState,
          errorMessage: "",
        }),
      );
    }, [safelySetUIState]);

  // MARK: Load Active Branding

  const reloadActiveLogo =
    useCallback(
      async (): Promise<BusinessLogoHookOperationResult> => {
        if (!cleanBusinessID) {
          safelySetUIState(
            (currentState) => ({
              ...currentState,

              isLoading: false,

              errorMessage:
                "The business ID is required before loading the logo.",
            }),
          );

          return {
            success: false,
            errorMessage:
              "The business ID is required before loading the logo.",
          };
        }

        const requestSequence =
          loadRequestSequenceReference.current + 1;

        loadRequestSequenceReference.current =
          requestSequence;

        safelySetUIState(
          (currentState) => ({
            ...currentState,

            isLoading: true,
            errorMessage: "",

            currentStepMessage:
              "Loading business branding...",
          }),
        );

        try {
          const result =
            await loadActiveBusinessLogo(
              cleanBusinessID,
            );

          const isLatestRequest =
            loadRequestSequenceReference.current ===
            requestSequence;

          if (
            !isMountedReference.current ||
            !isLatestRequest
          ) {
            return {
              success: true,
            };
          }

          setActiveBrandingResult(
            result,
          );

          safelySetUIState(
            (currentState) => ({
              ...currentState,

              isLoading: false,
              currentStepMessage: "",
              errorMessage: "",
            }),
          );

          return {
            success: true,
          };
        } catch (error) {
          const errorMessage =
            setError(
              error,
              "The active business logo could not be loaded.",
            );

          return {
            success: false,
            errorMessage,
          };
        }
      },
      [
        cleanBusinessID,
        safelySetUIState,
        setError,
      ],
    );

  useEffect(() => {
    if (
      !autoLoad ||
      !cleanBusinessID
    ) {
      return;
    }

    void reloadActiveLogo();
  }, [
    autoLoad,
    cleanBusinessID,
    reloadActiveLogo,
  ]);

  // MARK: Generate Premium Options

  const generatePremiumLogoOptions =
    useCallback(
      async (
        optionCount?: number,
      ): Promise<BusinessLogoHookOperationResult> => {
        if (!cleanBusinessID) {
          const errorMessage =
            "The business ID is required before generating a logo.";

          safelySetUIState(
            (currentState) => ({
              ...currentState,
              errorMessage,
            }),
          );

          return {
            success: false,
            errorMessage,
          };
        }

        if (!cleanBusinessName) {
          const errorMessage =
            "Enter the real business name before generating a premium logo.";

          safelySetUIState(
            (currentState) => ({
              ...currentState,
              errorMessage,
            }),
          );

          return {
            success: false,
            errorMessage,
          };
        }

        generationAbortControllerReference.current
          ?.abort();

        const abortController =
          new AbortController();

        generationAbortControllerReference.current =
          abortController;

        safelySetGenerationProgress(
          null,
        );

        safelySetUIState(
          (currentState) => ({
            ...currentState,

            isGenerating: true,
            isSaving: false,

            currentStepMessage:
              "Sofía is preparing your premium brand identity...",

            errorMessage: "",

            options: [],
            selectedOptionID: "",
          }),
        );

        try {
          const result =
            await generateBusinessLogoOptions({
              businessID:
                cleanBusinessID,

              businessName:
                cleanBusinessName,

              industry:
                industry.trim() ||
                "General Business",

              businessCategory:
                businessCategory.trim() ||
                industry.trim() ||
                "General Business",

              style:
                style.trim(),

              tagline:
                tagline.trim(),

              languageCode:
                languageCode.trim() ||
                "en",

              logoPrompt:
                logoPrompt.trim(),

              businessDNA,

              optionCount,

              signal:
                abortController.signal,

              onProgress:
                (progress) => {
                  safelySetGenerationProgress(
                    progress,
                  );

                  safelySetUIState(
                    (currentState) => ({
                      ...currentState,

                      currentStepMessage:
                        progress.message,
                    }),
                  );
                },
            });

          if (
            abortController.signal.aborted
          ) {
            return {
              success: false,
              errorMessage:
                "Logo generation was canceled.",
            };
          }

          if (!result.success) {
            const errorMessage =
              result.errorMessage;

            safelySetUIState(
              (currentState) => ({
                ...currentState,

                isGenerating: false,
                currentStepMessage: "",
                errorMessage,

                options: [],
                selectedOptionID: "",
              }),
            );

            return {
              success: false,
              errorMessage,
            };
          }

          const recommendedOption =
            selectSofiaRecommendedLogoOption(
              result.options,
            );

          safelySetUIState(
            (currentState) => ({
              ...currentState,

              isGenerating: false,

              currentStepMessage:
                result.failedOptionCount > 0
                  ? `${result.options.length} premium logo options are ready.`
                  : "Your premium logo options are ready.",

              errorMessage: "",

              options:
                result.options,

              selectedOptionID:
                recommendedOption?.id ?? "",
            }),
          );

          return {
            success: true,
          };
        } catch (error) {
          if (
            abortController.signal.aborted
          ) {
            safelySetUIState(
              (currentState) => ({
                ...currentState,

                isGenerating: false,
                currentStepMessage: "",
              }),
            );

            return {
              success: false,
              errorMessage:
                "Logo generation was canceled.",
            };
          }

          const errorMessage =
            setError(
              error,
              "Sofía could not generate the premium logo options.",
            );

          return {
            success: false,
            errorMessage,
          };
        } finally {
          if (
            generationAbortControllerReference.current ===
            abortController
          ) {
            generationAbortControllerReference.current =
              null;
          }
        }
      },
      [
        cleanBusinessID,
        cleanBusinessName,
        industry,
        businessCategory,
        style,
        tagline,
        languageCode,
        logoPrompt,
        businessDNA,
        safelySetGenerationProgress,
        safelySetUIState,
        setError,
      ],
    );

  // MARK: Select Generated Option

  const selectOption =
    useCallback(
      (
        optionID: string,
      ) => {
        const option =
          findBusinessLogoOption(
            uiState.options,
            optionID,
          );

        safelySetUIState(
          (currentState) => ({
            ...currentState,

            selectedOptionID:
              option?.id ?? "",

            errorMessage:
              option
                ? ""
                : "The selected logo option is no longer available.",
          }),
        );
      },
      [
        uiState.options,
        safelySetUIState,
      ],
    );

  const selectRecommendedOption =
    useCallback(() => {
      const recommended =
        selectSofiaRecommendedLogoOption(
          uiState.options,
        );

      safelySetUIState(
        (currentState) => ({
          ...currentState,

          selectedOptionID:
            recommended?.id ?? "",
        }),
      );
    }, [
      uiState.options,
      safelySetUIState,
    ]);

  // MARK: Save Selected Generated Logo

  const saveSelectedGeneratedLogo =
    useCallback(
      async (): Promise<BusinessLogoHookOperationResult> => {
        const selectedOption =
          findBusinessLogoOption(
            uiState.options,
            uiState.selectedOptionID,
          );

        if (!selectedOption) {
          const errorMessage =
            "Choose one of Sofía’s premium logo options before continuing.";

          safelySetUIState(
            (currentState) => ({
              ...currentState,
              errorMessage,
            }),
          );

          return {
            success: false,
            errorMessage,
          };
        }

        if (!cleanOwnerUID) {
          const errorMessage =
            "The Business Owner identity is required before saving the logo.";

          safelySetUIState(
            (currentState) => ({
              ...currentState,
              errorMessage,
            }),
          );

          return {
            success: false,
            errorMessage,
          };
        }

        safelySetUploadProgress(
          null,
        );

        safelySetUIState(
          (currentState) => ({
            ...currentState,

            isSaving: true,
            isUploading: true,

            currentStepMessage:
              "Saving your selected premium logo...",

            errorMessage: "",
          }),
        );

        try {
          const result =
            await saveGeneratedBusinessLogo({
              businessID:
                cleanBusinessID,

              ownerUID:
                cleanOwnerUID,

              createdByUID:
                cleanCreatedByUID ||
                cleanOwnerUID,

              businessName:
                cleanBusinessName,

              accentColorName:
                cleanAccentColorName,

              option:
                selectedOption,

              onProgress:
                (progress) => {
                  safelySetUploadProgress(
                    progress,
                  );

                  safelySetUIState(
                    (currentState) => ({
                      ...currentState,

                      currentStepMessage:
                        progress.state ===
                        "success"
                          ? "Finalizing your premium logo..."
                          : `Uploading premium logo: ${progress.progressPercent}%`,
                    }),
                  );
                },
            });

          setActiveBrandingResult({
            branding:
              result.branding,

            logo:
              result.logo,
          });

          safelySetUIState(
            (currentState) => ({
              ...currentState,

              isSaving: false,
              isUploading: false,

              currentStepMessage:
                "Your premium business logo is active.",

              errorMessage: "",

              options: [],
              selectedOptionID: "",
            }),
          );

          return {
            success: true,
          };
        } catch (error) {
          const errorMessage =
            setError(
              error,
              "The selected premium logo could not be saved.",
            );

          return {
            success: false,
            errorMessage,
          };
        }
      },
      [
        uiState.options,
        uiState.selectedOptionID,
        cleanBusinessID,
        cleanOwnerUID,
        cleanCreatedByUID,
        cleanBusinessName,
        cleanAccentColorName,
        safelySetUploadProgress,
        safelySetUIState,
        setError,
      ],
    );

  // MARK: Upload Owner-Selected Logo

  const uploadLogo =
    useCallback(
      async (
        file: File,
      ): Promise<BusinessLogoHookOperationResult> => {
        if (!cleanBusinessID) {
          const errorMessage =
            "The business ID is required before uploading a logo.";

          safelySetUIState(
            (currentState) => ({
              ...currentState,
              errorMessage,
            }),
          );

          return {
            success: false,
            errorMessage,
          };
        }

        if (!cleanOwnerUID) {
          const errorMessage =
            "The Business Owner identity is required before uploading a logo.";

          safelySetUIState(
            (currentState) => ({
              ...currentState,
              errorMessage,
            }),
          );

          return {
            success: false,
            errorMessage,
          };
        }

        safelySetUploadProgress(
          null,
        );

        safelySetUIState(
          (currentState) => ({
            ...currentState,

            isUploading: true,
            isSaving: true,

            currentStepMessage:
              "Preparing your business logo...",

            errorMessage: "",
          }),
        );

        try {
          const result =
            await saveUploadedBusinessLogo({
              businessID:
                cleanBusinessID,

              ownerUID:
                cleanOwnerUID,

              createdByUID:
                cleanCreatedByUID ||
                cleanOwnerUID,

              businessName:
                cleanBusinessName,

              accentColorName:
                cleanAccentColorName,

              file,

              supportsAccentColor:
                false,

              onProgress:
                (progress) => {
                  safelySetUploadProgress(
                    progress,
                  );

                  safelySetUIState(
                    (currentState) => ({
                      ...currentState,

                      currentStepMessage:
                        progress.state ===
                        "success"
                          ? "Finalizing your business logo..."
                          : `Uploading business logo: ${progress.progressPercent}%`,
                    }),
                  );
                },
            });

          setActiveBrandingResult({
            branding:
              result.branding,

            logo:
              result.logo,
          });

          safelySetUIState(
            (currentState) => ({
              ...currentState,

              isUploading: false,
              isSaving: false,

              currentStepMessage:
                "Your business logo is active.",

              errorMessage: "",

              options: [],
              selectedOptionID: "",
            }),
          );

          return {
            success: true,
          };
        } catch (error) {
          const errorMessage =
            setError(
              error,
              "The selected business logo could not be uploaded.",
            );

          return {
            success: false,
            errorMessage,
          };
        }
      },
      [
        cleanBusinessID,
        cleanOwnerUID,
        cleanCreatedByUID,
        cleanBusinessName,
        cleanAccentColorName,
        safelySetUploadProgress,
        safelySetUIState,
        setError,
      ],
    );

  // MARK: Restore Default Logo

  const restoreDefaultLogo =
    useCallback(
      async (): Promise<BusinessLogoHookOperationResult> => {
        if (!cleanBusinessID) {
          const errorMessage =
            "The business ID is required before restoring the default logo.";

          safelySetUIState(
            (currentState) => ({
              ...currentState,
              errorMessage,
            }),
          );

          return {
            success: false,
            errorMessage,
          };
        }

        safelySetUIState(
          (currentState) => ({
            ...currentState,

            isSaving: true,

            currentStepMessage:
              "Restoring the default JCS logo...",

            errorMessage: "",
          }),
        );

        try {
          const result =
            await restoreBusinessDefaultLogo({
              businessID:
                cleanBusinessID,

              companyName:
                cleanBusinessName,

              accentColorName:
                cleanAccentColorName,
            });

          setActiveBrandingResult({
            branding:
              result.branding,

            logo:
              null,
          });

          safelySetUIState(
            (currentState) => ({
              ...currentState,

              isSaving: false,

              currentStepMessage:
                "The default JCS logo is active.",

              errorMessage: "",

              options: [],
              selectedOptionID: "",
            }),
          );

          return {
            success: true,
          };
        } catch (error) {
          const errorMessage =
            setError(
              error,
              "The default JCS logo could not be restored.",
            );

          return {
            success: false,
            errorMessage,
          };
        }
      },
      [
        cleanBusinessID,
        cleanBusinessName,
        cleanAccentColorName,
        safelySetUIState,
        setError,
      ],
    );

  // MARK: Rendering Preference

  const updateRenderingPreference =
    useCallback(
      async (
        renderingMode:
          BusinessLogoRenderingMode,

        useAccentColorForLogo:
          boolean,
      ): Promise<BusinessLogoHookOperationResult> => {
        if (!cleanBusinessID) {
          const errorMessage =
            "The business ID is required before updating the logo preference.";

          safelySetUIState(
            (currentState) => ({
              ...currentState,
              errorMessage,
            }),
          );

          return {
            success: false,
            errorMessage,
          };
        }

        safelySetUIState(
          (currentState) => ({
            ...currentState,

            isSaving: true,

            currentStepMessage:
              "Updating logo appearance...",

            errorMessage: "",
          }),
        );

        try {
          const branding =
            await saveBusinessLogoRenderingPreference({
              businessID:
                cleanBusinessID,

              renderingMode,

              useAccentColorForLogo,
            });

          setActiveBrandingResult(
            (currentResult) => ({
              branding,

              logo:
                currentResult?.logo
                  ? {
                      ...currentResult.logo,

                      renderingMode:
                        branding.logoRenderingMode,

                      useAccentColor:
                        branding.useAccentColorForLogo,
                    }
                  : null,
            }),
          );

          safelySetUIState(
            (currentState) => ({
              ...currentState,

              isSaving: false,
              currentStepMessage: "",
              errorMessage: "",
            }),
          );

          return {
            success: true,
          };
        } catch (error) {
          const errorMessage =
            setError(
              error,
              "The logo appearance preference could not be updated.",
            );

          return {
            success: false,
            errorMessage,
          };
        }
      },
      [
        cleanBusinessID,
        safelySetUIState,
        setError,
      ],
    );

  // MARK: Cancellation and Cleanup

  const cancelGeneration =
    useCallback(() => {
      generationAbortControllerReference.current
        ?.abort();

      generationAbortControllerReference.current =
        null;

      safelySetUIState(
        (currentState) => ({
          ...currentState,

          isGenerating: false,
          currentStepMessage: "",
        }),
      );
    }, [safelySetUIState]);

  const clearGeneratedOptions =
    useCallback(() => {
      safelySetGenerationProgress(
        null,
      );

      safelySetUIState(
        (currentState) => ({
          ...currentState,

          options: [],
          selectedOptionID: "",

          currentStepMessage: "",
          errorMessage: "",
        }),
      );
    }, [
      safelySetGenerationProgress,
      safelySetUIState,
    ]);

  // MARK: Derived State

  const activeBranding =
    activeBrandingResult?.branding ??
    null;

  const activeLogo =
    activeBrandingResult?.logo ??
    null;

  const selectedOption =
    useMemo(
      () =>
        findBusinessLogoOption(
          uiState.options,
          uiState.selectedOptionID,
        ),
      [
        uiState.options,
        uiState.selectedOptionID,
      ],
    );

  const recommendedOption =
    useMemo(
      () =>
        selectSofiaRecommendedLogoOption(
          uiState.options,
        ),
      [uiState.options],
    );

  const activeLogoURL =
    activeBranding
      ?.logoDownloadURL
      .trim() ?? "";

  const hasCustomLogo =
    Boolean(
      activeBranding &&
      activeBranding.activeLogoSource !==
        "default" &&
      activeBranding.activeLogoID.trim(),
    );

  return {
    businessID:
      cleanBusinessID,

    activeBranding,
    activeLogo,

    activeLogoURL,
    hasCustomLogo,

    options:
      uiState.options,

    selectedOptionID:
      uiState.selectedOptionID,

    selectedOption,
    recommendedOption,

    isLoading:
      uiState.isLoading,

    isGenerating:
      uiState.isGenerating,

    isUploading:
      uiState.isUploading,

    isSaving:
      uiState.isSaving,

    currentStepMessage:
      uiState.currentStepMessage,

    errorMessage:
      uiState.errorMessage,

    generationProgress,
    uploadProgress,

    reloadActiveLogo,
    uploadLogo,
    restoreDefaultLogo,
    updateRenderingPreference,

    generatePremiumLogoOptions,
    selectOption,
    selectRecommendedOption,
    saveSelectedGeneratedLogo,

    cancelGeneration,
    clearGeneratedOptions,
    clearError,
  };
}

// MARK: - Error Helpers

function getBusinessLogoHookErrorMessage(
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