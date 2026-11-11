"use client";

/*
 * JCS Business Suite Web
 * PlatformAppSettingsView.tsx
 *
 * Modern App Settings experience for Platform Administrator.
 *
 * Persistence authority:
 *
 * platformSettings/global
 *
 * IMPORTANT:
 *
 * This view never writes businessSettings/{businessID}.
 */

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import {
  APP_ACCENT_COLOR_VALUES,
  APP_LANGUAGE_OPTIONS,
} from "./AppSettingsTypes";

import {
  useOfficialJCSLogos,
} from "../official-jcs-branding/useOfficialJCSLogos";

import {
  applyOfficialJCSLogoToPlatform,
} from "../official-jcs-branding/OfficialJCSLogoFirestoreService";

import {
  usePlatformSettings,
} from "../platform-settings/usePlatformSettings";

import type {
  AppAccentColorName,
  AppLanguageCode,
} from "./AppSettingsTypes";

import type {
  PlatformSettingsActor,
  PlatformSettingsRecord,
} from "../platform-settings/PlatformSettingsTypes";

import "./AppSettingsView.css";

type PlatformAppSettingsSection =
  | "platform"
  | "branding"
  | "appearance";

export interface PlatformAppSettingsViewProps {
  actor:
    PlatformSettingsActor;

  currentUserUID:
    string;

  onAccentColorChange?:
    (
      accentColorName:
        AppAccentColorName,
    ) => void;

  onLanguageChange?:
    (
      languageCode:
        AppLanguageCode,
    ) => void;

  onSettingsSaved?:
    (
      settings:
        PlatformSettingsRecord,
    ) => void;

  onLogoChanged?:
    (
      settings:
        PlatformSettingsRecord,
    ) => void;

  onClose?:
    () => void;
}

export default function PlatformAppSettingsView({
  actor,
  currentUserUID,

  onAccentColorChange,
  onLanguageChange,

  onSettingsSaved,
  onLogoChanged,

  onClose,
}: PlatformAppSettingsViewProps) {
  const [
    selectedSection,
    setSelectedSection,
  ] =
    useState<PlatformAppSettingsSection>(
      "platform",
    );

  const [
    officialLogoMessage,
    setOfficialLogoMessage,
  ] =
    useState("");

  const [
    officialLogoError,
    setOfficialLogoError,
  ] =
    useState("");

  const [
    isApplyingOfficialLogo,
    setIsApplyingOfficialLogo,
  ] =
    useState(false);

  const platformSettings =
    usePlatformSettings({
      actor,

      currentUserUID,

      autoLoad:
        true,

      onAccentColorChange: (
        accentColorName,
      ) => {
        onAccentColorChange?.(
          accentColorName as
            AppAccentColorName,
        );
      },

      onLanguageChange: (
        languageCode,
      ) => {
        onLanguageChange?.(
          languageCode as
            AppLanguageCode,
        );
      },

      onSettingsSaved,

      onLogoChanged,
    });

  const officialLogos =
    useOfficialJCSLogos();

  const platformName =
    platformSettings
      .formValues
      .platformName
      .trim() ||
    "JCS Business Suite";

  const platformLogoURL =
    platformSettings
      .settings
      ?.logoDownloadURL
      ?.trim() ??
    "";

  const isBusy =
    platformSettings.isLoading ||
    platformSettings.isSaving ||
    platformSettings.isUploadingLogo ||
    platformSettings.isRestoringLogo ||
    isApplyingOfficialLogo;

  const navigationItems =
    useMemo(
      () => [
        {
          id:
            "platform" as const,
          icon:
            "◈",
          title:
            "Platform",
          subtitle:
            "Identity and contact",
        },
        {
          id:
            "branding" as const,
          icon:
            "✦",
          title:
            "Branding",
          subtitle:
            "Official JCS logos",
        },
        {
          id:
            "appearance" as const,
          icon:
            "◉",
          title:
            "Appearance",
          subtitle:
            "Color and language",
        },
      ],
      [],
    );

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ): Promise<void> => {
      event.preventDefault();

      await platformSettings
        .saveSettings();
    };

  const handleApplyOfficialLogo =
    async (): Promise<void> => {
      const selectedLogo =
        officialLogos.selectedLogo;

      if (
        !selectedLogo ||
        !selectedLogo.isAvailable
      ) {
        setOfficialLogoMessage("");

        setOfficialLogoError(
          "Select an available official JCS logo first.",
        );

        return;
      }

      if (
        !platformSettings
          .permissions
          .canManageSettings
      ) {
        setOfficialLogoMessage("");

        setOfficialLogoError(
          "Only a Platform Administrator can change the platform logo.",
        );

        return;
      }

      setIsApplyingOfficialLogo(
        true,
      );

      setOfficialLogoMessage("");
      setOfficialLogoError("");

      try {
        await applyOfficialJCSLogoToPlatform({
          logo:
            selectedLogo,
        });

        const existingSettings =
          platformSettings.settings;

        if (existingSettings) {
          const updatedSettings:
            PlatformSettingsRecord = {
              ...existingSettings,

              logoStoragePath:
                selectedLogo.storagePath,

              logoDownloadURL:
                selectedLogo.downloadURL,

              logoFileName:
                selectedLogo
                  .storagePath
                  .split("/")
                  .pop() ?? "",

              hasCustomLogo:
                false,

              updatedByUID:
                currentUserUID,

              updatedAtISO:
                new Date()
                  .toISOString(),
            };

          onLogoChanged?.(
            updatedSettings,
          );
        }

        await platformSettings
          .reload();

        setOfficialLogoMessage(
          "Official JCS platform logo applied successfully.",
        );
      } catch (
        error: unknown
      ) {
        console.error(
          "Official JCS platform logo apply failed:",
          error,
        );

        setOfficialLogoError(
          error instanceof Error &&
          error.message.trim()
            ? error.message
            : "The official JCS platform logo could not be applied.",
        );
      } finally {
        setIsApplyingOfficialLogo(
          false,
        );
      }
    };

  if (
    !platformSettings
      .permissions
      .canViewSettings &&
    !platformSettings.isLoading
  ) {
    return (
      <main className="app-settings-view">
        <section className="app-settings-panel">
          <span className="app-settings-eyebrow">
            JCS Business Suite
          </span>

          <h1>
            App Settings
          </h1>

          <p>
            Only an authorized Platform Administrator can manage global platform settings.
          </p>

          {onClose ? (
            <button
              type="button"
              className="app-settings-secondary-button"
              onClick={
                onClose
              }
            >
              Close
            </button>
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <main className="app-settings-view">
      <header className="app-settings-header">
        <div className="app-settings-header__identity">
          {platformLogoURL ? (
            <img
              src={
                platformLogoURL
              }
              alt={
                platformName
              }
              style={{
                width:
                  "112px",
                height:
                  "76px",
                objectFit:
                  "contain",
              }}
            />
          ) : (
            <div
              aria-hidden="true"
              style={{
                width:
                  "76px",
                height:
                  "76px",
                display:
                  "grid",
                placeItems:
                  "center",
                fontWeight:
                  800,
                fontSize:
                  "24px",
              }}
            >
              JCS
            </div>
          )}

          <div className="app-settings-header__copy">
            <span className="app-settings-eyebrow">
              JCS Business Suite
            </span>

            <h1>
              App Settings
            </h1>

            <p>
              Manage global platform identity, official branding, appearance and language.
            </p>
          </div>
        </div>

        <div className="app-settings-header__actions">
          {platformSettings
            .isDirty ? (
            <span className="app-settings-unsaved-badge">
              Unsaved changes
            </span>
          ) : null}

          <button
            type="button"
            className="app-settings-secondary-button"
            onClick={
              platformSettings
                .resetForm
            }
            disabled={
              !platformSettings
                .isDirty ||
              isBusy
            }
          >
            Reset
          </button>

          <button
            type="submit"
            form="platform-app-settings-form"
            className="app-settings-primary-button"
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
              .isSaving
              ? "Saving..."
              : "Save Settings"}
          </button>

          {onClose ? (
            <button
              type="button"
              className="app-settings-close-button"
              aria-label="Close App Settings"
              onClick={
                onClose
              }
            >
              ×
            </button>
          ) : null}
        </div>
      </header>

      <div className="app-settings-layout">
        <nav
          className="app-settings-navigation"
          aria-label="App Settings sections"
        >
          {navigationItems.map(
            (
              item,
            ) => {
              const isSelected =
                selectedSection ===
                item.id;

              return (
                <button
                  key={
                    item.id
                  }
                  type="button"
                  className={[
                    "app-settings-secondary-button",
                    isSelected
                      ? "app-settings-navigation-selected"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    setSelectedSection(
                      item.id,
                    );
                  }}
                  style={{
                    width:
                      "100%",
                    display:
                      "grid",
                    gridTemplateColumns:
                      "34px 1fr",
                    gap:
                      "10px",
                    textAlign:
                      "left",
                    alignItems:
                      "center",
                    marginBottom:
                      "10px",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      fontSize:
                        "20px",
                    }}
                  >
                    {item.icon}
                  </span>

                  <span>
                    <strong
                      style={{
                        display:
                          "block",
                      }}
                    >
                      {item.title}
                    </strong>

                    <small>
                      {item.subtitle}
                    </small>
                  </span>
                </button>
              );
            },
          )}
        </nav>

        <form
          id="platform-app-settings-form"
          className="app-settings-content"
          onSubmit={
            handleSubmit
          }
          noValidate
        >
          {platformSettings
            .errorMessage ? (
            <div className="app-settings-official-logo-library__error">
              {platformSettings
                .errorMessage}
            </div>
          ) : null}

          {platformSettings
            .successMessage ? (
            <div className="app-settings-official-logo-library__success">
              {platformSettings
                .successMessage}
            </div>
          ) : null}

          {platformSettings
            .isLoading ? (
            <section className="app-settings-panel">
              <strong>
                Preparing App Settings…
              </strong>
            </section>
          ) : null}

          {!platformSettings
            .isLoading &&
          selectedSection ===
            "platform" ? (
            <div className="app-settings-section-stack">
              <section className="app-settings-panel">
                <span className="app-settings-eyebrow">
                  Platform identity
                </span>

                <h2>
                  Platform Information
                </h2>

                <p>
                  These values belong to the global JCS platform and are not attached to an individual business.
                </p>

                <div className="app-settings-form-grid">
                  <label className="app-settings-text-field">
                    <span>
                      Platform name
                    </span>

                    <input
                      value={
                        platformSettings
                          .formValues
                          .platformName
                      }
                      disabled={
                        isBusy ||
                        !platformSettings
                          .permissions
                          .canEditPlatformInformation
                      }
                      onChange={(event) => {
                        platformSettings
                          .setFieldValue(
                            "platformName",
                            event.target.value,
                          );
                      }}
                    />
                  </label>

                  <label className="app-settings-text-field">
                    <span>
                      Tagline
                    </span>

                    <input
                      value={
                        platformSettings
                          .formValues
                          .tagline
                      }
                      disabled={
                        isBusy ||
                        !platformSettings
                          .permissions
                          .canEditPlatformInformation
                      }
                      onChange={(event) => {
                        platformSettings
                          .setFieldValue(
                            "tagline",
                            event.target.value,
                          );
                      }}
                    />
                  </label>

                  <label className="app-settings-text-field">
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
                        isBusy ||
                        !platformSettings
                          .permissions
                          .canEditPlatformInformation
                      }
                      onChange={(event) => {
                        platformSettings
                          .setFieldValue(
                            "supportEmail",
                            event.target.value,
                          );
                      }}
                    />
                  </label>

                  <label className="app-settings-text-field">
                    <span>
                      Website
                    </span>

                    <input
                      value={
                        platformSettings
                          .formValues
                          .websiteURL
                      }
                      disabled={
                        isBusy ||
                        !platformSettings
                          .permissions
                          .canEditPlatformInformation
                      }
                      onChange={(event) => {
                        platformSettings
                          .setFieldValue(
                            "websiteURL",
                            event.target.value,
                          );
                      }}
                    />
                  </label>
                </div>
              </section>
            </div>
          ) : null}

          {!platformSettings
            .isLoading &&
          selectedSection ===
            "branding" ? (
            <div className="app-settings-section-stack">
              <section className="app-settings-panel">
                <span className="app-settings-eyebrow">
                  JCS Business Suite
                </span>

                <h2>
                  Official JCS Logo Collection
                </h2>

                <p>
                  Choose the official logo used by Platform Admin and the global JCS experience.
                </p>

                <div className="app-settings-official-logo-library">
                  <div className="app-settings-official-logo-library__header">
                    <div>
                      <h3>
                        8 Official Logos
                      </h3>

                      <p>
                        The same official collection available to new JCS businesses.
                      </p>
                    </div>

                    <div className="app-settings-official-logo-library__header-actions">
                      <span className="app-settings-official-logo-library__badge">
                        Platform
                      </span>

                      <button
                        type="button"
                        className="app-settings-primary-button app-settings-official-logo-library__apply-button"
                        disabled={
                          isBusy ||
                          !officialLogos
                            .selectedLogo ||
                          !officialLogos
                            .selectedLogo
                            .isAvailable ||
                          !platformSettings
                            .permissions
                            .canManageSettings
                        }
                        onClick={() => {
                          void handleApplyOfficialLogo();
                        }}
                      >
                        {isApplyingOfficialLogo
                          ? "Applying..."
                          : "Apply Official Logo"}
                      </button>
                    </div>
                  </div>

                  {officialLogos
                    .errorMessage ? (
                    <div className="app-settings-official-logo-library__error">
                      {officialLogos
                        .errorMessage}
                    </div>
                  ) : null}

                  <div className="app-settings-official-logo-grid">
                    {officialLogos
                      .logos
                      .map(
                        (
                          logo,
                        ) => {
                          const isSelected =
                            officialLogos
                              .selectedLogoID ===
                            logo.id;

                          return (
                            <button
                              key={
                                logo.id
                              }
                              type="button"
                              className={[
                                "app-settings-official-logo-card",
                                isSelected
                                  ? "app-settings-official-logo-card--selected"
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              disabled={
                                officialLogos
                                  .isLoading ||
                                !logo
                                  .isAvailable
                              }
                              onClick={() => {
                                officialLogos
                                  .setSelectedLogoID(
                                    logo.id,
                                  );
                              }}
                              aria-pressed={
                                isSelected
                              }
                            >
                              <span className="app-settings-official-logo-card__preview">
                                {logo
                                  .downloadURL ? (
                                  <img
                                    src={
                                      logo.downloadURL
                                    }
                                    alt={
                                      logo.title
                                    }
                                    className="app-settings-official-logo-card__image"
                                  />
                                ) : (
                                  <span className="app-settings-official-logo-card__empty">
                                    <strong>
                                      Slot{" "}
                                      {logo.slot}
                                    </strong>

                                    <small>
                                      Logo unavailable
                                    </small>
                                  </span>
                                )}

                                {isSelected ? (
                                  <span className="app-settings-official-logo-card__check">
                                    ✓
                                  </span>
                                ) : null}
                              </span>

                              <span className="app-settings-official-logo-card__copy">
                                <strong>
                                  {logo.title}
                                </strong>

                                <span>
                                  Official JCS Business Suite
                                </span>
                              </span>
                            </button>
                          );
                        },
                      )}
                  </div>

                  {officialLogoMessage ? (
                    <div className="app-settings-official-logo-library__success">
                      {officialLogoMessage}
                    </div>
                  ) : null}

                  {officialLogoError ? (
                    <div className="app-settings-official-logo-library__error">
                      {officialLogoError}
                    </div>
                  ) : null}
                </div>
              </section>
            </div>
          ) : null}

          {!platformSettings
            .isLoading &&
          selectedSection ===
            "appearance" ? (
            <div className="app-settings-section-stack">
              <section className="app-settings-panel">
                <span className="app-settings-eyebrow">
                  Platform theme
                </span>

                <h2>
                  Appearance
                </h2>

                <p>
                  Configure the global Platform Admin Accent Color and application language.
                </p>

                <div className="app-settings-form-grid">
                  <label className="app-settings-select-field">
                    <span>
                      Accent Color
                    </span>

                    <select
                      value={
                        platformSettings
                          .formValues
                          .accentColorName
                      }
                      disabled={
                        isBusy ||
                        !platformSettings
                          .permissions
                          .canEditAppearance
                      }
                      onChange={(event) => {
                        const value =
                          event.target.value as
                            AppAccentColorName;

                        platformSettings
                          .setFieldValue(
                            "accentColorName",
                            value,
                          );

                        onAccentColorChange?.(
                          value,
                        );
                      }}
                    >
                      {APP_ACCENT_COLOR_VALUES.map(
                        (
                          accent,
                        ) => (
                          <option
                            key={
                              accent
                            }
                            value={
                              accent
                            }
                          >
                            {accent}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label className="app-settings-select-field">
                    <span>
                      Application Language
                    </span>

                    <select
                      value={
                        platformSettings
                          .formValues
                          .languageCode
                      }
                      disabled={
                        isBusy ||
                        !platformSettings
                          .permissions
                          .canEditAppearance
                      }
                      onChange={(event) => {
                        const value =
                          event.target.value as
                            AppLanguageCode;

                        platformSettings
                          .setFieldValue(
                            "languageCode",
                            value,
                          );

                        onLanguageChange?.(
                          value,
                        );
                      }}
                    >
                      {APP_LANGUAGE_OPTIONS.map(
                        (
                          option,
                        ) => (
                          <option
                            key={
                              option.code
                            }
                            value={
                              option.code
                            }
                          >
                            {option.nativeTitle}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                </div>
              </section>

              <section className="app-settings-panel">
                <span className="app-settings-eyebrow">
                  Coming next
                </span>

                <h2>
                  Official Background Collection
                </h2>

                <p>
                  The official JCS background library will be connected here after the background assets are installed.
                </p>
              </section>
            </div>
          ) : null}
        </form>
      </div>
    </main>
  );
}
