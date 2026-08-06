"use client";

/*
 * JCS Business Suite Web
 * PlatformSettingsView.tsx
 *
 * Global platform configuration interface for PlatformAdmin.
 *
 * Responsibilities:
 *
 * - Edit the official JCS Business Suite identity.
 * - Change the global platform Accent Color.
 * - Configure platform language and public information.
 * - Upload the official platform logo.
 * - Restore the default platform logo.
 *
 * This view does not use:
 *
 * - businessID
 * - ownerUID
 * - businessSettings/{businessID}
 *
 * Global settings are stored at:
 *
 * platformSettings/global
 */

import {
  Check,
  ChevronLeft,
  ExternalLink,
  ImagePlus,
  LoaderCircle,
  Palette,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import {
  useCallback,
  useMemo,
  useRef,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
} from "react";

import {
  usePlatformSettings,
} from "./usePlatformSettings";

import type {
  AppAccentColorName,
  AppLanguageCode,
} from "../app-settings/AppSettingsTypes";

import type {
  PlatformSettingsActor,
  PlatformSettingsRecord,
} from "./PlatformSettingsTypes";

import "./PlatformSettingsView.css";

// =======================================================
// MARK: - Types
// =======================================================

export interface PlatformSettingsViewProps {
  actor:
    PlatformSettingsActor;

  currentUserUID:
    string;

  onClose?:
    () => void;

  onAccentColorChange?:
    (
      accentColorName:
        AppAccentColorName
    ) => void;

  onLanguageChange?:
    (
      languageCode:
        AppLanguageCode
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

interface AccentColorOption {
  name:
    AppAccentColorName;

  title:
    string;

  cssValue:
    string;
}

// =======================================================
// MARK: - Accent Colors
// =======================================================

const PLATFORM_ACCENT_COLOR_OPTIONS:
  readonly AccentColorOption[] = [
    {
      name:
        "blue",

      title:
        "Blue",

      cssValue:
        "#2563eb",
    },

    {
      name:
        "sky",

      title:
        "Sky",

      cssValue:
        "#0ea5e9",
    },

    {
      name:
        "aqua",

      title:
        "Aqua",

      cssValue:
        "#06b6d4",
    },

    {
      name:
        "teal",

      title:
        "Teal",

      cssValue:
        "#0f766e",
    },

    {
      name:
        "green",

      title:
        "Green",

      cssValue:
        "#16a34a",
    },

    {
      name:
        "emerald",

      title:
        "Emerald",

      cssValue:
        "linear-gradient(135deg, #34d399, #047857, #064e3b)",
    },

    {
      name:
        "gold",

      title:
        "Gold",

      cssValue:
        "linear-gradient(135deg, #f8df82, #c99721, #7b5510)",
    },

    {
      name:
        "copper",

      title:
        "Copper",

      cssValue:
        "linear-gradient(135deg, #e7a06c, #b45f35, #6e2f1a)",
    },

    {
      name:
        "bronze",

      title:
        "Bronze",

      cssValue:
        "linear-gradient(135deg, #d69b62, #8a4f22, #4c2912)",
    },

    {
      name:
        "roseGold",

      title:
        "Rose Gold",

      cssValue:
        "linear-gradient(135deg, #f4c6b9, #c78372, #865244)",
    },

    {
      name:
        "silver",

      title:
        "Silver",

      cssValue:
        "linear-gradient(135deg, #ffffff, #bfc5cc, #737b85)",
    },

    {
      name:
        "platinum",

      title:
        "Platinum",

      cssValue:
        "linear-gradient(135deg, #f5f5f4, #c8c7c1, #868581)",
    },

    {
      name:
        "sapphire",

      title:
        "Sapphire",

      cssValue:
        "linear-gradient(135deg, #60a5fa, #1d4ed8, #172554)",
    },

    {
      name:
        "ocean",

      title:
        "Ocean",

      cssValue:
        "linear-gradient(135deg, #22d3ee, #0284c7, #164e63)",
    },

    {
      name:
        "purple",

      title:
        "Purple",

      cssValue:
        "#9333ea",
    },

    {
      name:
        "amethyst",

      title:
        "Amethyst",

      cssValue:
        "linear-gradient(135deg, #d8b4fe, #9333ea, #581c87)",
    },

    {
      name:
        "pink",

      title:
        "Pink",

      cssValue:
        "#ec4899",
    },

    {
      name:
        "ruby",

      title:
        "Ruby",

      cssValue:
        "linear-gradient(135deg, #fb7185, #be123c, #4c0519)",
    },

    {
      name:
        "midnight",

      title:
        "Midnight",

      cssValue:
        "linear-gradient(135deg, #334155, #172554, #020617)",
    },

    {
      name:
        "onyx",

      title:
        "Onyx",

      cssValue:
        "linear-gradient(135deg, #52525b, #18181b, #000000)",
    },
  ];

// =======================================================
// MARK: - Helpers
// =======================================================

function resolvePlatformAccentCSS(
  accentColorName:
    AppAccentColorName,
): string {
  return (
    PLATFORM_ACCENT_COLOR_OPTIONS.find(
      (
        option
      ) =>
        option.name ===
        accentColorName,
    )
      ?.cssValue ??
    "#b87333"
  );
}

function platformLanguageTitle(
  languageCode:
    AppLanguageCode,
): string {
  switch (languageCode) {
    case "es":
      return "Español";

    case "en":
    default:
      return "English";
  }
}

// =======================================================
// MARK: - Component
// =======================================================

export default function PlatformSettingsView({
  actor,
  currentUserUID,
  onClose,
  onAccentColorChange,
  onLanguageChange,
  onSettingsSaved,
  onLogoChanged,
}: PlatformSettingsViewProps) {
  const fileInputReference =
    useRef<HTMLInputElement | null>(
      null,
    );

    const handleAccentColorChange =
  useCallback(
    (
      accentColorName: string,
    ): void => {
      onAccentColorChange?.(
        accentColorName as
          AppAccentColorName,
      );
    },
    [
      onAccentColorChange,
    ],
  );

const handleLanguageChange =
  useCallback(
    (
      languageCode: string,
    ): void => {
      onLanguageChange?.(
        languageCode as
          AppLanguageCode,
      );
    },
    [
      onLanguageChange,
    ],
  );

  const platformSettings =
  usePlatformSettings({
    actor,

    currentUserUID,

    autoLoad:
      true,

    onAccentColorChange:
      handleAccentColorChange,

    onLanguageChange:
      handleLanguageChange,

    onSettingsSaved,

    onLogoChanged,
  });

  const accentColorCSS =
    useMemo(
      () =>
        resolvePlatformAccentCSS(
          platformSettings
            .formValues
            .accentColorName,
        ),
      [
        platformSettings
          .formValues
          .accentColorName,
      ],
    );

  const shellStyle =
    useMemo(
      () =>
        ({
          "--jcs-platform-accent":
            accentColorCSS,
        }) as CSSProperties,
      [
        accentColorCSS,
      ],
    );

  const isBusy =
    platformSettings.isLoading ||
    platformSettings.isSaving ||
    platformSettings
      .isUploadingLogo ||
    platformSettings
      .isRestoringLogo;

  // =====================================================
  // MARK: - Save
  // =====================================================

  const handleSubmit =
    useCallback(
      async (
        event:
          FormEvent<HTMLFormElement>,
      ): Promise<void> => {
        event.preventDefault();

        const result =
          await platformSettings
            .saveSettings();

        if (!result.success) {
          return;
        }

        onSettingsSaved?.(
          result.settings,
        );
      },
      [
        onSettingsSaved,
        platformSettings,
      ],
    );

  // =====================================================
  // MARK: - Logo Selection
  // =====================================================

  const handleLogoSelection =
    useCallback(
      (
        event:
          ChangeEvent<HTMLInputElement>,
      ): void => {
        const selectedFile =
          event.target.files?.[0] ??
          null;

        platformSettings
          .setSelectedLogoFile(
            selectedFile,
          );

        /*
         * Clear the input value so the same file can be
         * selected again after cancellation or validation.
         */
        event.target.value =
          "";
      },
      [
        platformSettings,
      ],
    );

  const openLogoPicker =
    useCallback((): void => {
      fileInputReference
        .current
        ?.click();
    }, []);

  // =====================================================
  // MARK: - Upload Logo
  // =====================================================

  const handleUploadLogo =
    useCallback(
      async (): Promise<void> => {
        const result =
          await platformSettings
            .uploadLogo();

        if (!result.success) {
          return;
        }

        onLogoChanged?.(
          result.settings,
        );
      },
      [
        onLogoChanged,
        platformSettings,
      ],
    );

  // =====================================================
  // MARK: - Restore Logo
  // =====================================================

  const handleRestoreDefaultLogo =
    useCallback(
      async (): Promise<void> => {
        const shouldRestore =
          window.confirm(
            "Restore the default JCS Business Suite platform logo?",
          );

        if (!shouldRestore) {
          return;
        }

        const result =
          await platformSettings
            .restoreDefaultLogo();

        if (!result.success) {
          return;
        }

        onLogoChanged?.(
          result.settings,
        );
      },
      [
        onLogoChanged,
        platformSettings,
      ],
    );

  // =====================================================
  // MARK: - Permission State
  // =====================================================

  if (
    !platformSettings
      .permissions
      .canViewSettings &&
    !platformSettings.isLoading
  ) {
    return (
      <div
        className="jcs-platform-settings-access-denied"
        style={
          shellStyle
        }
      >
        <div className="jcs-platform-settings-access-denied__icon">
          <ShieldCheck
            size={34}
            strokeWidth={1.6}
          />
        </div>

        <p className="jcs-platform-settings-eyebrow">
          Platform Administration
        </p>

        <h1>
          Platform Settings are restricted
        </h1>

        <p>
          Only an authorized Platform Administrator can manage
          the official JCS Business Suite identity and appearance.
        </p>

        {onClose ? (
          <button
            type="button"
            className="jcs-platform-settings-button jcs-platform-settings-button--secondary"
            onClick={
              onClose
            }
          >
            <ChevronLeft
              size={18}
              strokeWidth={1.8}
            />

            Return
          </button>
        ) : null}
      </div>
    );
  }

  // =====================================================
  // MARK: - View
  // =====================================================

  return (
    <div
      className="jcs-platform-settings"
      style={
        shellStyle
      }
    >
      {/* =================================================
          MARK: - Header
      ================================================= */}

      <header className="jcs-platform-settings__header">
        <div className="jcs-platform-settings__header-leading">
          {onClose ? (
            <button
              type="button"
              className="jcs-platform-settings__close-button"
              aria-label="Close Platform Settings"
              onClick={
                onClose
              }
            >
              <ChevronLeft
                size={21}
                strokeWidth={1.8}
              />
            </button>
          ) : null}

          <div className="jcs-platform-settings__header-icon">
  {platformSettings.settings
    ?.logoDownloadURL ? (
    <img
      src={
        platformSettings
          .settings
          .logoDownloadURL
      }
      alt="JCS Business Suite"
      className="jcs-platform-settings__header-logo"
    />
  ) : (
    <Sparkles
      size={24}
      strokeWidth={1.6}
    />
  )}
</div>

          <div>
            <p className="jcs-platform-settings-eyebrow">
              Platform Administration
            </p>

            <h1>
              Platform Settings
            </h1>

            <p>
              Manage the official identity and global appearance
              of JCS Business Suite.
            </p>
          </div>
        </div>

        <div className="jcs-platform-settings__header-actions">
          <button
            type="button"
            className="jcs-platform-settings-button jcs-platform-settings-button--secondary"
            disabled={
              isBusy
            }
            onClick={() => {
              void platformSettings
                .reload();
            }}
          >
            <RefreshCw
              size={17}
              strokeWidth={1.8}
              className={
                platformSettings
                  .isLoading
                  ? "jcs-platform-settings-spin"
                  : undefined
              }
            />

            Reload
          </button>

          {onClose ? (
            <button
              type="button"
              className="jcs-platform-settings__icon-button"
              aria-label="Close Platform Settings"
              onClick={
                onClose
              }
            >
              <X
                size={20}
                strokeWidth={1.8}
              />
            </button>
          ) : null}
        </div>
      </header>

      {/* =================================================
          MARK: - Status Messages
      ================================================= */}

      {platformSettings.errorMessage ? (
        <div
          className="jcs-platform-settings-message jcs-platform-settings-message--error"
          role="alert"
        >
          <X
            size={18}
            strokeWidth={1.9}
          />

          <span>
            {
              platformSettings
                .errorMessage
            }
          </span>
        </div>
      ) : null}

      {platformSettings.successMessage ? (
        <div
          className="jcs-platform-settings-message jcs-platform-settings-message--success"
          role="status"
        >
          <Check
            size={18}
            strokeWidth={2}
          />

          <span>
            {
              platformSettings
                .successMessage
            }
          </span>
        </div>
      ) : null}

      {/* =================================================
          MARK: - Loading
      ================================================= */}

      {platformSettings.isLoading ? (
        <div className="jcs-platform-settings-loading">
          <LoaderCircle
            size={30}
            strokeWidth={1.7}
            className="jcs-platform-settings-spin"
          />

          <strong>
            Loading Platform Settings
          </strong>

          <span>
            Connecting to the global JCS platform configuration…
          </span>
        </div>
      ) : (
        <form
          className="jcs-platform-settings__form"
          onSubmit={
            handleSubmit
          }
        >
          {/* ===============================================
              MARK: - Platform Identity
          =============================================== */}

          <section className="jcs-platform-settings-card">
            <div className="jcs-platform-settings-card__heading">
              <div className="jcs-platform-settings-card__heading-icon">
                <ShieldCheck
                  size={21}
                  strokeWidth={1.7}
                />
              </div>

              <div>
                <p className="jcs-platform-settings-eyebrow">
                  Global Identity
                </p>

                <h2>
                  Platform Information
                </h2>

                <p>
                  These values identify JCS Business Suite across
                  the Platform Dashboard and Executive Center.
                </p>
              </div>
            </div>

            <div className="jcs-platform-settings-fields">
              <label className="jcs-platform-settings-field">
                <span>
                  Platform name
                </span>

                <input
                  type="text"
                  value={
                    platformSettings
                      .formValues
                      .platformName
                  }
                  disabled={
                    !platformSettings
                      .permissions
                      .canEditPlatformInformation ||
                    isBusy
                  }
                  maxLength={160}
                  placeholder="JCS Business Suite"
                  onChange={(
                    event
                  ) =>
                    platformSettings
                      .setFieldValue(
                        "platformName",
                        event.target.value,
                      )
                  }
                />

                {platformSettings
                  .formErrors
                  .platformName ? (
                  <small className="jcs-platform-settings-field__error">
                    {
                      platformSettings
                        .formErrors
                        .platformName
                    }
                  </small>
                ) : null}
              </label>

              <label className="jcs-platform-settings-field">
                <span>
                  Platform tagline
                </span>

                <input
                  type="text"
                  value={
                    platformSettings
                      .formValues
                      .tagline
                  }
                  disabled={
                    !platformSettings
                      .permissions
                      .canEditPlatformInformation ||
                    isBusy
                  }
                  maxLength={240}
                  placeholder="One Platform | Every Business | Endless Possibilities"
                  onChange={(
                    event
                  ) =>
                    platformSettings
                      .setFieldValue(
                        "tagline",
                        event.target.value,
                      )
                  }
                />

                {platformSettings
                  .formErrors
                  .tagline ? (
                  <small className="jcs-platform-settings-field__error">
                    {
                      platformSettings
                        .formErrors
                        .tagline
                    }
                  </small>
                ) : null}
              </label>

              <label className="jcs-platform-settings-field">
                <span>
                  Support email
                </span>

                <input
                  type="email"
                  value={
                    platformSettings
                      .formValues
                      .supportEmail
                  }
                  disabled={
                    !platformSettings
                      .permissions
                      .canEditPlatformInformation ||
                    isBusy
                  }
                  maxLength={254}
                  placeholder="support@jcsbusinesssuite.com"
                  onChange={(
                    event
                  ) =>
                    platformSettings
                      .setFieldValue(
                        "supportEmail",
                        event.target.value,
                      )
                  }
                />

                {platformSettings
                  .formErrors
                  .supportEmail ? (
                  <small className="jcs-platform-settings-field__error">
                    {
                      platformSettings
                        .formErrors
                        .supportEmail
                    }
                  </small>
                ) : null}
              </label>

              <label className="jcs-platform-settings-field">
                <span>
                  Website
                </span>

                <div className="jcs-platform-settings-field__with-icon">
                  <input
                    type="url"
                    value={
                      platformSettings
                        .formValues
                        .websiteURL
                    }
                    disabled={
                      !platformSettings
                        .permissions
                        .canEditPlatformInformation ||
                      isBusy
                    }
                    maxLength={500}
                    placeholder="https://www.jcsbusinesssuite.com"
                    onChange={(
                      event
                    ) =>
                      platformSettings
                        .setFieldValue(
                          "websiteURL",
                          event.target.value,
                        )
                    }
                  />

                  <ExternalLink
                    size={17}
                    strokeWidth={1.7}
                  />
                </div>

                {platformSettings
                  .formErrors
                  .websiteURL ? (
                  <small className="jcs-platform-settings-field__error">
                    {
                      platformSettings
                        .formErrors
                        .websiteURL
                    }
                  </small>
                ) : null}
              </label>
            </div>
          </section>

          {/* ===============================================
              MARK: - Official Platform Logo
          =============================================== */}

          <section className="jcs-platform-settings-card">
            <div className="jcs-platform-settings-card__heading">
              <div className="jcs-platform-settings-card__heading-icon">
                <ImagePlus
                  size={21}
                  strokeWidth={1.7}
                />
              </div>

              <div>
                <p className="jcs-platform-settings-eyebrow">
                  Official Branding
                </p>

                <h2>
                  Platform Logo
                </h2>

                <p>
                  Upload the official logo used by the Platform
                  Dashboard and Executive Center.
                </p>
              </div>
            </div>

            <div className="jcs-platform-logo-editor">
              <div className="jcs-platform-logo-preview">
                {platformSettings
                  .logoPreviewURL ? (
                  <img
                    src={
                      platformSettings
                        .logoPreviewURL
                    }
                    alt="JCS Business Suite platform logo"
                  />
                ) : (
                  <div className="jcs-platform-logo-preview__default">
                    <span>
                      J
                    </span>

                    <strong>
                      JCS Business Suite
                    </strong>
                  </div>
                )}
              </div>

              <div className="jcs-platform-logo-editor__controls">
                <strong>
                  Official JCS Business Suite Logo
                </strong>

                <span>
                  PNG, JPEG, WebP or SVG. Maximum file size:
                  8 MB.
                </span>

                {platformSettings
                  .selectedLogoFile ? (
                  <div className="jcs-platform-logo-file">
                    <Check
                      size={16}
                      strokeWidth={2}
                    />

                    <span>
                      {
                        platformSettings
                          .selectedLogoFile
                          .name
                      }
                    </span>
                  </div>
                ) : null}

                <input
                  ref={
                    fileInputReference
                  }
                  className="jcs-platform-settings-visually-hidden"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  disabled={
                    !platformSettings
                      .permissions
                      .canUploadLogo ||
                    isBusy
                  }
                  onChange={
                    handleLogoSelection
                  }
                />

                <div className="jcs-platform-logo-editor__actions">
                  <button
                    type="button"
                    className="jcs-platform-settings-button jcs-platform-settings-button--secondary"
                    disabled={
                      !platformSettings
                        .permissions
                        .canUploadLogo ||
                      isBusy
                    }
                    onClick={
                      openLogoPicker
                    }
                  >
                    <ImagePlus
                      size={17}
                      strokeWidth={1.8}
                    />

                    Choose Logo
                  </button>

                  <button
                    type="button"
                    className="jcs-platform-settings-button jcs-platform-settings-button--primary"
                    disabled={
                      !platformSettings
                        .selectedLogoFile ||
                      !platformSettings
                        .permissions
                        .canUploadLogo ||
                      isBusy
                    }
                    onClick={() => {
                      void handleUploadLogo();
                    }}
                  >
                    {platformSettings
                      .isUploadingLogo ? (
                      <LoaderCircle
                        size={17}
                        strokeWidth={1.8}
                        className="jcs-platform-settings-spin"
                      />
                    ) : (
                      <Upload
                        size={17}
                        strokeWidth={1.8}
                      />
                    )}

                    Upload Logo
                  </button>

                  <button
                    type="button"
                    className="jcs-platform-settings-button jcs-platform-settings-button--danger-secondary"
                    disabled={
                      !platformSettings
                        .hasCustomLogo ||
                      !platformSettings
                        .permissions
                        .canRestoreDefaultLogo ||
                      isBusy
                    }
                    onClick={() => {
                      void handleRestoreDefaultLogo();
                    }}
                  >
                    {platformSettings
                      .isRestoringLogo ? (
                      <LoaderCircle
                        size={17}
                        strokeWidth={1.8}
                        className="jcs-platform-settings-spin"
                      />
                    ) : (
                      <RotateCcw
                        size={17}
                        strokeWidth={1.8}
                      />
                    )}

                    Restore Default
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ===============================================
              MARK: - Appearance
          =============================================== */}

          <section className="jcs-platform-settings-card">
            <div className="jcs-platform-settings-card__heading">
              <div className="jcs-platform-settings-card__heading-icon">
                <Palette
                  size={21}
                  strokeWidth={1.7}
                />
              </div>

              <div>
                <p className="jcs-platform-settings-eyebrow">
                  Platform Appearance
                </p>

                <h2>
                  Accent Color
                </h2>

                <p>
                  This color controls the Platform Dashboard,
                  Executive Center and global administration
                  interface.
                </p>
              </div>
            </div>

            <div
              className="jcs-platform-accent-grid"
              role="radiogroup"
              aria-label="Platform Accent Color"
            >
              {PLATFORM_ACCENT_COLOR_OPTIONS.map(
                (
                  option
                ) => {
                  const isSelected =
                    platformSettings
                      .formValues
                      .accentColorName ===
                    option.name;

                  return (
                    <button
                      key={
                        option.name
                      }
                      type="button"
                      role="radio"
                      aria-checked={
                        isSelected
                      }
                      className={[
                        "jcs-platform-accent-option",

                        isSelected
                          ? "jcs-platform-accent-option--selected"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      disabled={
                        !platformSettings
                          .permissions
                          .canEditAppearance ||
                        isBusy
                      }
                      onClick={() =>
                        platformSettings
                          .setFieldValue(
                            "accentColorName",
                            option.name,
                          )
                      }
                    >
                      <span
                        className="jcs-platform-accent-option__swatch"
                        style={{
                          background:
                            option.cssValue,
                        }}
                        aria-hidden="true"
                      />

                      <span>
                        {
                          option.title
                        }
                      </span>

                      {isSelected ? (
                        <Check
                          size={16}
                          strokeWidth={2.1}
                        />
                      ) : null}
                    </button>
                  );
                },
              )}
            </div>

            {platformSettings
              .formErrors
              .accentColorName ? (
              <small className="jcs-platform-settings-field__error">
                {
                  platformSettings
                    .formErrors
                    .accentColorName
                }
              </small>
            ) : null}

            <div className="jcs-platform-accent-preview">
              <div>
                <span
                  className="jcs-platform-accent-preview__mark"
                  aria-hidden="true"
                >
                  J
                </span>

                <div>
                  <strong>
                    {
                      platformSettings
                        .formValues
                        .platformName
                    }
                  </strong>

                  <span>
                    {
                      platformSettings
                        .formValues
                        .tagline
                    }
                  </span>
                </div>
              </div>

              <button
                type="button"
              >
                Platform Action
              </button>
            </div>
          </section>

          {/* ===============================================
              MARK: - Language
          =============================================== */}

          <section className="jcs-platform-settings-card">
            <div className="jcs-platform-settings-card__heading">
              <div className="jcs-platform-settings-card__heading-icon">
                <Sparkles
                  size={21}
                  strokeWidth={1.7}
                />
              </div>

              <div>
                <p className="jcs-platform-settings-eyebrow">
                  Localization
                </p>

                <h2>
                  Platform Language
                </h2>

                <p>
                  Choose the default language for global platform
                  administration.
                </p>
              </div>
            </div>

            <label className="jcs-platform-settings-field jcs-platform-settings-field--compact">
              <span>
                Default platform language
              </span>

              <select
                value={
                  platformSettings
                    .formValues
                    .languageCode
                }
                disabled={
                  !platformSettings
                    .permissions
                    .canEditAppearance ||
                  isBusy
                }
                onChange={(
                  event
                ) =>
                  platformSettings
                    .setFieldValue(
                      "languageCode",
                      event.target
                        .value as
                        AppLanguageCode,
                    )
                }
              >
                <option value="en">
                  English
                </option>

                <option value="es">
                  Español
                </option>
              </select>

              <small>
                Current selection:{" "}
                {platformLanguageTitle(
                  platformSettings
                    .formValues
                    .languageCode,
                )}
              </small>

              {platformSettings
                .formErrors
                .languageCode ? (
                <small className="jcs-platform-settings-field__error">
                  {
                    platformSettings
                      .formErrors
                      .languageCode
                  }
                </small>
              ) : null}
            </label>
          </section>

          {/* ===============================================
              MARK: - Footer Actions
          =============================================== */}

          <footer className="jcs-platform-settings__footer">
            <div>
              <span
                className={[
                  "jcs-platform-settings__dirty-indicator",

                  platformSettings
                    .isDirty
                    ? "jcs-platform-settings__dirty-indicator--active"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-hidden="true"
              />

              <span>
                {platformSettings.isDirty
                  ? "You have unsaved platform changes."
                  : "Platform Settings are up to date."}
              </span>
            </div>

            <div className="jcs-platform-settings__footer-actions">
              <button
                type="button"
                className="jcs-platform-settings-button jcs-platform-settings-button--secondary"
                disabled={
                  !platformSettings
                    .isDirty ||
                  isBusy
                }
                onClick={
                  platformSettings
                    .resetForm
                }
              >
                <RotateCcw
                  size={17}
                  strokeWidth={1.8}
                />

                Reset Changes
              </button>

              <button
                type="submit"
                className="jcs-platform-settings-button jcs-platform-settings-button--primary"
                disabled={
                  !platformSettings
                    .permissions
                    .canManageSettings ||
                  !platformSettings
                    .isDirty ||
                  isBusy
                }
              >
                {platformSettings
                  .isSaving ? (
                  <LoaderCircle
                    size={18}
                    strokeWidth={1.8}
                    className="jcs-platform-settings-spin"
                  />
                ) : (
                  <Save
                    size={18}
                    strokeWidth={1.8}
                  />
                )}

                {platformSettings
                  .isSaving
                  ? "Saving…"
                  : "Save Platform Settings"}
              </button>
            </div>
          </footer>
        </form>
      )}
    </div>
  );
}