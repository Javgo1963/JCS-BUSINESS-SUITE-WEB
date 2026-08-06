"use client";

/*
 * JCS Business Suite Web
 * BusinessLogoPicker.tsx
 *
 * Professional browser logo picker for App Settings.
 *
 * Responsibilities:
 *
 * - Select a business logo from the user's device.
 * - Support click, keyboard and drag-and-drop selection.
 * - Validate PNG, JPEG and WebP files.
 * - Show a safe local preview before uploading.
 * - Display upload progress and operation state.
 * - Delegate persistence to useBusinessLogo.
 *
 * Firebase, Firestore and Storage implementation details
 * must not live in this component.
 */

import {
  ChangeEvent,
  CSSProperties,
  DragEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  BUSINESS_LOGO_FILE_ACCEPT_VALUE,
  BUSINESS_LOGO_MAX_FILE_SIZE_BYTES,
} from "./BusinessLogoConstants";

import {
  readBusinessLogoImageMetadata,
  validateBusinessLogoFile,
} from "./BusinessLogoDomain";

import CompanyLogoView from "./CompanyLogoView";

import type {
  BusinessBrandingSettings,
  BusinessLogoRecord,
} from "./BusinessLogoTypes";

import type {
  BusinessLogoUploadProgress,
} from "./BusinessLogoStorageService";

// MARK: - Props

export interface BusinessLogoPickerProps {
  branding?: BusinessBrandingSettings | null;
  logo?: BusinessLogoRecord | null;

  businessName: string;
  accentColor?: string;

  isLoading?: boolean;
  isUploading?: boolean;
  isSaving?: boolean;

  uploadProgress?: BusinessLogoUploadProgress | null;

  errorMessage?: string;
  successMessage?: string;

  disabled?: boolean;

  /**
   * Called after a valid file is selected.
   *
   * The parent normally passes:
   *
   * businessLogo.uploadLogo
   */
  onUploadLogo: (
    file: File,
  ) => Promise<
    | {
        success: true;
      }
    | {
        success: false;
        errorMessage: string;
      }
  >;

  /**
   * Optional action used to restore the default JCS logo.
   */
  onRestoreDefaultLogo?: () => Promise<
    | {
        success: true;
      }
    | {
        success: false;
        errorMessage: string;
      }
  >;

  onClearError?: () => void;

  showCurrentLogo?: boolean;
  showDropZone?: boolean;
  showRestoreDefaultButton?: boolean;

  className?: string;
}

// MARK: - Selected File State

interface SelectedBusinessLogoFile {
  file: File;
  previewURL: string;

  width: number;
  height: number;

  sizeBytes: number;
  mimeType: string;
}

// MARK: - Component

export default function BusinessLogoPicker({
  branding = null,
  logo = null,

  businessName,
  accentColor = "var(--jcs-accent-color, #2563eb)",

  isLoading = false,
  isUploading = false,
  isSaving = false,

  uploadProgress = null,

  errorMessage = "",
  successMessage = "",

  disabled = false,

  onUploadLogo,
  onRestoreDefaultLogo,
  onClearError,

  showCurrentLogo = true,
  showDropZone = true,
  showRestoreDefaultButton = true,

  className = "",
}: BusinessLogoPickerProps) {
  const inputID =
    useId();

  const fileInputReference =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [
    selectedFile,
    setSelectedFile,
  ] =
    useState<SelectedBusinessLogoFile | null>(
      null,
    );

  const [
    localErrorMessage,
    setLocalErrorMessage,
  ] =
    useState("");

  const [
    isDragging,
    setIsDragging,
  ] =
    useState(false);

  const [
    isPreparingFile,
    setIsPreparingFile,
  ] =
    useState(false);

  const [
    isConfirmingUpload,
    setIsConfirmingUpload,
  ] =
    useState(false);

  const [
    isRestoringDefault,
    setIsRestoringDefault,
  ] =
    useState(false);

  const isBusy =
    isLoading ||
    isUploading ||
    isSaving ||
    isPreparingFile ||
    isConfirmingUpload ||
    isRestoringDefault;

  const isInteractionDisabled =
    disabled ||
    isBusy;

  const effectiveErrorMessage =
    localErrorMessage ||
    errorMessage.trim();

  const progressPercent =
    normalizeProgressPercent(
      uploadProgress?.progressPercent,
    );

  // MARK: Preview Cleanup

  const clearSelectedFile =
    useCallback(() => {
      setSelectedFile(
        (currentFile) => {
          if (
            currentFile?.previewURL.startsWith(
              "blob:",
            )
          ) {
            URL.revokeObjectURL(
              currentFile.previewURL,
            );
          }

          return null;
        },
      );

      if (
        fileInputReference.current
      ) {
        fileInputReference.current.value =
          "";
      }
    }, []);

  useEffect(() => {
    return () => {
      if (
        selectedFile?.previewURL.startsWith(
          "blob:",
        )
      ) {
        URL.revokeObjectURL(
          selectedFile.previewURL,
        );
      }
    };
  }, [selectedFile]);

  // MARK: Error Cleanup

  const clearMessages =
    useCallback(() => {
      setLocalErrorMessage("");
      onClearError?.();
    }, [onClearError]);

  // MARK: File Selection

  const prepareSelectedFile =
    useCallback(
      async (
        file: File,
      ): Promise<void> => {
        clearMessages();

        const validation =
          validateBusinessLogoFile(
            file,
          );

        if (!validation.isValid) {
          setLocalErrorMessage(
            validation.errorMessage,
          );

          return;
        }

        setIsPreparingFile(true);

        try {
          const metadata =
            await readBusinessLogoImageMetadata(
              file,
            );

          const previewURL =
            URL.createObjectURL(
              file,
            );

          setSelectedFile(
            (currentFile) => {
              if (
                currentFile?.previewURL.startsWith(
                  "blob:",
                )
              ) {
                URL.revokeObjectURL(
                  currentFile.previewURL,
                );
              }

              return {
                file,
                previewURL,

                width:
                  metadata.width,

                height:
                  metadata.height,

                sizeBytes:
                  metadata.sizeBytes,

                mimeType:
                  metadata.mimeType,
              };
            },
          );
        } catch (error) {
          setLocalErrorMessage(
            getPickerErrorMessage(
              error,
              "The selected logo could not be prepared.",
            ),
          );
        } finally {
          setIsPreparingFile(false);
        }
      },
      [clearMessages],
    );

  const handleFileInputChange =
    useCallback(
      (
        event:
          ChangeEvent<HTMLInputElement>,
      ) => {
        const file =
          event.target.files?.[0];

        if (!file) {
          return;
        }

        void prepareSelectedFile(
          file,
        );
      },
      [prepareSelectedFile],
    );

  // MARK: Open Picker

  const openFilePicker =
    useCallback(() => {
      if (isInteractionDisabled) {
        return;
      }

      clearMessages();

      fileInputReference.current
        ?.click();
    }, [
      isInteractionDisabled,
      clearMessages,
    ]);

  const handleDropZoneKeyDown =
    useCallback(
      (
        event:
          KeyboardEvent<HTMLDivElement>,
      ) => {
        if (
          event.key !== "Enter" &&
          event.key !== " "
        ) {
          return;
        }

        event.preventDefault();

        openFilePicker();
      },
      [openFilePicker],
    );

  // MARK: Drag and Drop

  const handleDragEnter =
    useCallback(
      (
        event:
          DragEvent<HTMLDivElement>,
      ) => {
        event.preventDefault();
        event.stopPropagation();

        if (isInteractionDisabled) {
          return;
        }

        setIsDragging(true);
      },
      [isInteractionDisabled],
    );

  const handleDragOver =
    useCallback(
      (
        event:
          DragEvent<HTMLDivElement>,
      ) => {
        event.preventDefault();
        event.stopPropagation();

        if (
          event.dataTransfer
        ) {
          event.dataTransfer.dropEffect =
            isInteractionDisabled
              ? "none"
              : "copy";
        }
      },
      [isInteractionDisabled],
    );

  const handleDragLeave =
    useCallback(
      (
        event:
          DragEvent<HTMLDivElement>,
      ) => {
        event.preventDefault();
        event.stopPropagation();

        const currentTarget =
          event.currentTarget;

        const relatedTarget =
          event.relatedTarget;

        if (
          relatedTarget instanceof Node &&
          currentTarget.contains(
            relatedTarget,
          )
        ) {
          return;
        }

        setIsDragging(false);
      },
      [],
    );

  const handleDrop =
    useCallback(
      (
        event:
          DragEvent<HTMLDivElement>,
      ) => {
        event.preventDefault();
        event.stopPropagation();

        setIsDragging(false);

        if (isInteractionDisabled) {
          return;
        }

        const file =
          event.dataTransfer.files?.[0];

        if (!file) {
          setLocalErrorMessage(
            "Drop a PNG, JPEG or WebP image here.",
          );

          return;
        }

        void prepareSelectedFile(
          file,
        );
      },
      [
        isInteractionDisabled,
        prepareSelectedFile,
      ],
    );

  // MARK: Upload

  const confirmUpload =
    useCallback(async () => {
      if (
        !selectedFile ||
        isInteractionDisabled
      ) {
        return;
      }

      clearMessages();
      setIsConfirmingUpload(true);

      try {
        const result =
          await onUploadLogo(
            selectedFile.file,
          );

        if (!result.success) {
          setLocalErrorMessage(
            result.errorMessage,
          );

          return;
        }

        clearSelectedFile();
      } catch (error) {
        setLocalErrorMessage(
          getPickerErrorMessage(
            error,
            "The business logo could not be uploaded.",
          ),
        );
      } finally {
        setIsConfirmingUpload(false);
      }
    }, [
      selectedFile,
      isInteractionDisabled,
      clearMessages,
      onUploadLogo,
      clearSelectedFile,
    ]);

  // MARK: Restore Default

  const restoreDefaultLogo =
    useCallback(async () => {
      if (
        !onRestoreDefaultLogo ||
        isInteractionDisabled
      ) {
        return;
      }

      clearMessages();
      setIsRestoringDefault(true);

      try {
        const result =
          await onRestoreDefaultLogo();

        if (!result.success) {
          setLocalErrorMessage(
            result.errorMessage,
          );

          return;
        }

        clearSelectedFile();
      } catch (error) {
        setLocalErrorMessage(
          getPickerErrorMessage(
            error,
            "The default JCS logo could not be restored.",
          ),
        );
      } finally {
        setIsRestoringDefault(false);
      }
    }, [
      onRestoreDefaultLogo,
      isInteractionDisabled,
      clearMessages,
      clearSelectedFile,
    ]);

  // MARK: Derived Labels

  const selectedFileDescription =
    useMemo(() => {
      if (!selectedFile) {
        return "";
      }

      return [
        `${selectedFile.width} × ${selectedFile.height}px`,
        formatFileSize(
          selectedFile.sizeBytes,
        ),
        formatMimeType(
          selectedFile.mimeType,
        ),
      ].join(" • ");
    }, [selectedFile]);

  // MARK: Styles

  const sectionStyle: CSSProperties = {
    display:
      "grid",

    gap:
      18,

    width:
      "100%",
  };

  const cardStyle: CSSProperties = {
    display:
      "grid",

    gap:
      16,

    padding:
      18,

    borderRadius:
      24,

    border:
      "1px solid rgba(148, 163, 184, 0.18)",

    background:
      "color-mix(in srgb, var(--jcs-surface, #ffffff) 92%, transparent)",

    boxShadow:
      "0 16px 40px rgba(15, 23, 42, 0.07)",
  };

  const dropZoneStyle: CSSProperties = {
    display:
      "grid",

    placeItems:
      "center",

    minHeight:
      190,

    padding:
      22,

    borderRadius:
      22,

    border:
      isDragging
        ? `2px solid ${accentColor}`
        : "2px dashed rgba(100, 116, 139, 0.34)",

    background:
      isDragging
        ? `color-mix(in srgb, ${accentColor} 10%, transparent)`
        : "color-mix(in srgb, var(--jcs-surface, #ffffff) 88%, transparent)",

    textAlign:
      "center",

    cursor:
      isInteractionDisabled
        ? "not-allowed"
        : "pointer",

    opacity:
      isInteractionDisabled
        ? 0.66
        : 1,

    transition:
      [
        "border-color 160ms ease",
        "background 160ms ease",
        "transform 160ms ease",
      ].join(", "),

    transform:
      isDragging
        ? "scale(1.01)"
        : "scale(1)",
  };

  return (
    <section
      className={[
        "jcs-business-logo-picker",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={sectionStyle}
      aria-label="Business logo settings"
    >
      {showCurrentLogo ? (
        <div
          className="jcs-business-logo-picker__current-card"
          style={cardStyle}
        >
          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "space-between",

              gap:
                16,

              flexWrap:
                "wrap",
            }}
          >
            <div
              style={{
                display:
                  "grid",

                gap:
                  4,
              }}
            >
              <h3
                style={{
                  margin:
                    0,

                  fontSize:
                    17,

                  fontWeight:
                    800,

                  color:
                    "var(--jcs-text-primary, #0f172a)",
                }}
              >
                Current Business Logo
              </h3>

              <p
                style={{
                  margin:
                    0,

                  fontSize:
                    13,

                  lineHeight:
                    1.5,

                  color:
                    "var(--jcs-text-secondary, #64748b)",
                }}
              >
                Your active logo appears across the Dashboard and business experience.
              </p>
            </div>

            {showRestoreDefaultButton &&
            onRestoreDefaultLogo &&
            branding?.activeLogoSource !==
              "default" ? (
              <button
                type="button"
                onClick={() => {
                  void restoreDefaultLogo();
                }}
                disabled={
                  isInteractionDisabled
                }
                className="jcs-business-logo-picker__restore-button"
                style={{
                  minHeight:
                    40,

                  padding:
                    "9px 14px",

                  borderRadius:
                    14,

                  border:
                    "1px solid rgba(148, 163, 184, 0.28)",

                  background:
                    "var(--jcs-surface, #ffffff)",

                  color:
                    "var(--jcs-text-primary, #0f172a)",

                  font:
                    "inherit",

                  fontSize:
                    13,

                  fontWeight:
                    700,

                  cursor:
                    isInteractionDisabled
                      ? "not-allowed"
                      : "pointer",

                  opacity:
                    isInteractionDisabled
                      ? 0.6
                      : 1,
                }}
              >
                {isRestoringDefault
                  ? "Restoring..."
                  : "Use Default Logo"}
              </button>
            ) : null}
          </div>

          <div
            style={{
              display:
                "flex",

              justifyContent:
                "center",

              padding:
                "12px 0 4px",
            }}
          >
            <CompanyLogoView
              branding={
                branding
              }
              logo={
                logo
              }
              businessName={
                businessName
              }
              accentColor={
                accentColor
              }
              size="large"
              showBackground
              showBorder
              enableShadow
              isLoading={
                isLoading
              }
            />
          </div>
        </div>
      ) : null}

      {showDropZone ? (
        <div
          className="jcs-business-logo-picker__upload-card"
          style={cardStyle}
        >
          <div
            style={{
              display:
                "grid",

              gap:
                4,
            }}
          >
            <h3
              style={{
                margin:
                  0,

                fontSize:
                  17,

                fontWeight:
                  800,

                color:
                  "var(--jcs-text-primary, #0f172a)",
              }}
            >
              Upload Your Own Logo
            </h3>

            <p
              style={{
                margin:
                  0,

                fontSize:
                  13,

                lineHeight:
                  1.55,

                color:
                  "var(--jcs-text-secondary, #64748b)",
              }}
            >
              Choose a transparent PNG for the best result. JPEG and WebP are also supported.
            </p>
          </div>

          <input
            ref={
              fileInputReference
            }
            id={
              inputID
            }
            type="file"
            accept={
              BUSINESS_LOGO_FILE_ACCEPT_VALUE
            }
            disabled={
              isInteractionDisabled
            }
            onChange={
              handleFileInputChange
            }
            style={{
              position:
                "absolute",

              width:
                1,

              height:
                1,

              padding:
                0,

              margin:
                -1,

              overflow:
                "hidden",

              clip:
                "rect(0, 0, 0, 0)",

              whiteSpace:
                "nowrap",

              border:
                0,
            }}
          />

          <div
            className={[
              "jcs-business-logo-picker__drop-zone",
              isDragging
                ? "jcs-business-logo-picker__drop-zone--dragging"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            role="button"
            tabIndex={
              isInteractionDisabled
                ? -1
                : 0
            }
            aria-disabled={
              isInteractionDisabled
            }
            aria-controls={
              inputID
            }
            onClick={
              openFilePicker
            }
            onKeyDown={
              handleDropZoneKeyDown
            }
            onDragEnter={
              handleDragEnter
            }
            onDragOver={
              handleDragOver
            }
            onDragLeave={
              handleDragLeave
            }
            onDrop={
              handleDrop
            }
            style={
              dropZoneStyle
            }
          >
            <div
              style={{
                display:
                  "grid",

                justifyItems:
                  "center",

                gap:
                  10,

                maxWidth:
                  440,
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  display:
                    "grid",

                  placeItems:
                    "center",

                  width:
                    54,

                  height:
                    54,

                  borderRadius:
                    18,

                  background:
                    `color-mix(in srgb, ${accentColor} 14%, transparent)`,

                  color:
                    accentColor,

                  fontSize:
                    26,

                  fontWeight:
                    800,
                }}
              >
                +
              </div>

              <div
                style={{
                  display:
                    "grid",

                  gap:
                    4,
                }}
              >
                <strong
                  style={{
                    color:
                      "var(--jcs-text-primary, #0f172a)",

                    fontSize:
                      15,
                  }}
                >
                  {isPreparingFile
                    ? "Preparing image..."
                    : "Choose a logo or drop it here"}
                </strong>

                <span
                  style={{
                    color:
                      "var(--jcs-text-secondary, #64748b)",

                    fontSize:
                      13,

                    lineHeight:
                      1.5,
                  }}
                >
                  PNG, JPEG or WebP up to{" "}
                  {formatFileSize(
                    BUSINESS_LOGO_MAX_FILE_SIZE_BYTES,
                  )}
                </span>
              </div>
            </div>
          </div>

          {selectedFile ? (
            <div
              className="jcs-business-logo-picker__selected-file"
              style={{
                display:
                  "grid",

                gap:
                  14,

                padding:
                  16,

                borderRadius:
                  20,

                border:
                  "1px solid rgba(148, 163, 184, 0.20)",

                background:
                  "color-mix(in srgb, var(--jcs-surface, #ffffff) 94%, transparent)",
              }}
            >
              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "minmax(92px, 120px) minmax(0, 1fr)",

                  alignItems:
                    "center",

                  gap:
                    16,
                }}
              >
                <div
                  style={{
                    width:
                      "100%",

                    aspectRatio:
                      "1 / 1",

                    display:
                      "grid",

                    placeItems:
                      "center",

                    overflow:
                      "hidden",

                    borderRadius:
                      18,

                    border:
                      "1px solid rgba(148, 163, 184, 0.20)",

                    background:
                      "linear-gradient(145deg, #ffffff, #f8fafc)",
                  }}
                >
                  <img
                    src={
                      selectedFile.previewURL
                    }
                    alt="Selected business logo preview"
                    style={{
                      display:
                        "block",

                      width:
                        "100%",

                      height:
                        "100%",

                      objectFit:
                        "contain",

                      objectPosition:
                        "center",

                      padding:
                        8,

                      boxSizing:
                        "border-box",
                    }}
                  />
                </div>

                <div
                  style={{
                    minWidth:
                      0,

                    display:
                      "grid",

                    gap:
                      6,
                  }}
                >
                  <strong
                    title={
                      selectedFile.file.name
                    }
                    style={{
                      overflow:
                        "hidden",

                      textOverflow:
                        "ellipsis",

                      whiteSpace:
                        "nowrap",

                      color:
                        "var(--jcs-text-primary, #0f172a)",

                      fontSize:
                        14,
                    }}
                  >
                    {
                      selectedFile.file.name
                    }
                  </strong>

                  <span
                    style={{
                      color:
                        "var(--jcs-text-secondary, #64748b)",

                      fontSize:
                        12,

                      lineHeight:
                        1.5,
                    }}
                  >
                    {
                      selectedFileDescription
                    }
                  </span>

                  <span
                    style={{
                      color:
                        "var(--jcs-text-secondary, #64748b)",

                      fontSize:
                        12,

                      lineHeight:
                        1.5,
                    }}
                  >
                    The logo will be centered inside a transparent 1024 × 1024 PNG without cropping.
                  </span>
                </div>
              </div>

              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "flex-end",

                  gap:
                    10,

                  flexWrap:
                    "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={
                    clearSelectedFile
                  }
                  disabled={
                    isInteractionDisabled
                  }
                  style={
                    secondaryButtonStyle(
                      isInteractionDisabled,
                    )
                  }
                >
                  Remove
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void confirmUpload();
                  }}
                  disabled={
                    isInteractionDisabled
                  }
                  style={
                    primaryButtonStyle({
                      accentColor,
                      disabled:
                        isInteractionDisabled,
                    })
                  }
                >
                  {isUploading ||
                  isConfirmingUpload
                    ? "Uploading..."
                    : "Use This Logo"}
                </button>
              </div>
            </div>
          ) : null}

          {isUploading ||
          uploadProgress ? (
            <div
              className="jcs-business-logo-picker__progress"
              role="status"
              aria-live="polite"
              style={{
                display:
                  "grid",

                gap:
                  8,
              }}
            >
              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  gap:
                    12,

                  color:
                    "var(--jcs-text-secondary, #64748b)",

                  fontSize:
                    12,

                  fontWeight:
                    700,
                }}
              >
                <span>
                  Uploading business logo
                </span>

                <span>
                  {progressPercent}%
                </span>
              </div>

              <div
                style={{
                  height:
                    8,

                  overflow:
                    "hidden",

                  borderRadius:
                    999,

                  background:
                    "rgba(148, 163, 184, 0.18)",
                }}
              >
                <div
                  style={{
                    width:
                      `${progressPercent}%`,

                    height:
                      "100%",

                    borderRadius:
                      999,

                    background:
                      accentColor,

                    transition:
                      "width 180ms ease",
                  }}
                />
              </div>
            </div>
          ) : null}

          {effectiveErrorMessage ? (
            <div
              role="alert"
              className="jcs-business-logo-picker__error"
              style={{
                padding:
                  "12px 14px",

                borderRadius:
                  16,

                border:
                  "1px solid rgba(220, 38, 38, 0.22)",

                background:
                  "rgba(254, 226, 226, 0.72)",

                color:
                  "#991b1b",

                fontSize:
                  13,

                lineHeight:
                  1.5,
              }}
            >
              {
                effectiveErrorMessage
              }
            </div>
          ) : null}

          {!effectiveErrorMessage &&
          successMessage.trim() ? (
            <div
              role="status"
              className="jcs-business-logo-picker__success"
              style={{
                padding:
                  "12px 14px",

                borderRadius:
                  16,

                border:
                  "1px solid rgba(22, 163, 74, 0.20)",

                background:
                  "rgba(220, 252, 231, 0.72)",

                color:
                  "#166534",

                fontSize:
                  13,

                lineHeight:
                  1.5,
              }}
            >
              {
                successMessage.trim()
              }
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

// MARK: - Button Styles

function primaryButtonStyle(
  input: {
    accentColor: string;
    disabled: boolean;
  },
): CSSProperties {
  return {
    minHeight:
      42,

    padding:
      "10px 16px",

    border:
      0,

    borderRadius:
      14,

    background:
      input.accentColor,

    color:
      "#ffffff",

    font:
      "inherit",

    fontSize:
      13,

    fontWeight:
      800,

    cursor:
      input.disabled
        ? "not-allowed"
        : "pointer",

    opacity:
      input.disabled
        ? 0.62
        : 1,

    boxShadow:
      input.disabled
        ? "none"
        : `0 10px 24px color-mix(in srgb, ${input.accentColor} 24%, transparent)`,
  };
}

function secondaryButtonStyle(
  disabled: boolean,
): CSSProperties {
  return {
    minHeight:
      42,

    padding:
      "10px 16px",

    borderRadius:
      14,

    border:
      "1px solid rgba(148, 163, 184, 0.28)",

    background:
      "var(--jcs-surface, #ffffff)",

    color:
      "var(--jcs-text-primary, #0f172a)",

    font:
      "inherit",

    fontSize:
      13,

    fontWeight:
      750,

    cursor:
      disabled
        ? "not-allowed"
        : "pointer",

    opacity:
      disabled
        ? 0.62
        : 1,
  };
}

// MARK: - Helpers

function normalizeProgressPercent(
  value: number | undefined,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.min(
    Math.max(
      Math.round(value),
      0,
    ),
    100,
  );
}

function formatFileSize(
  sizeBytes: number,
): string {
  if (
    !Number.isFinite(sizeBytes) ||
    sizeBytes <= 0
  ) {
    return "0 bytes";
  }

  const megabytes =
    sizeBytes / (1024 * 1024);

  if (megabytes >= 1) {
    return `${Number(
      megabytes.toFixed(1),
    )} MB`;
  }

  const kilobytes =
    sizeBytes / 1024;

  return `${Math.max(
    1,
    Math.round(kilobytes),
  )} KB`;
}

function formatMimeType(
  mimeType: string,
): string {
  switch (
    mimeType.trim().toLowerCase()
  ) {
    case "image/png":
      return "PNG";

    case "image/jpeg":
      return "JPEG";

    case "image/webp":
      return "WebP";

    default:
      return "Image";
  }
}

function getPickerErrorMessage(
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