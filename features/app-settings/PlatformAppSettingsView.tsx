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
  useCallback,
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

interface AccentColorDisplayOption {
  name: AppAccentColorName;
  title: string;
  preview: string;
  foreground: string;
}

const ACCENT_COLOR_DISPLAY_OPTIONS: readonly AccentColorDisplayOption[] =
  [
    {
      name: "blue",
      title: "Blue",
      preview: "#2563eb",
      foreground: "#ffffff",
    },
    {
      name: "sky",
      title: "Sky",
      preview: "#0ea5e9",
      foreground: "#ffffff",
    },
    {
      name: "aqua",
      title: "Aqua",
      preview: "#06b6d4",
      foreground: "#082f49",
    },
    {
      name: "teal",
      title: "Teal",
      preview: "#0f766e",
      foreground: "#ffffff",
    },
    {
      name: "mint",
      title: "Mint",
      preview: "#34d399",
      foreground: "#052e16",
    },
    {
      name: "green",
      title: "Green",
      preview: "#16a34a",
      foreground: "#ffffff",
    },
    {
      name: "lime",
      title: "Lime",
      preview: "#84cc16",
      foreground: "#1a2e05",
    },
    {
      name: "olive",
      title: "Olive",
      preview: "#657e21",
      foreground: "#ffffff",
    },
    {
      name: "yellow",
      title: "Yellow",
      preview: "#facc15",
      foreground: "#422006",
    },
    {
      name: "gold",
      title: "Gold",
      preview:
        "linear-gradient(135deg, #f8df82, #c99721, #7b5510)",
      foreground: "#241500",
    },
    {
      name: "sand",
      title: "Sand",
      preview: "#d6b98c",
      foreground: "#3f2d18",
    },
    {
      name: "orange",
      title: "Orange",
      preview: "#f97316",
      foreground: "#ffffff",
    },
    {
      name: "peach",
      title: "Peach",
      preview: "#fbad82",
      foreground: "#4a1d0d",
    },
    {
      name: "coral",
      title: "Coral",
      preview: "#fb7185",
      foreground: "#4c0519",
    },
    {
      name: "red",
      title: "Red",
      preview: "#dc2626",
      foreground: "#ffffff",
    },
    {
      name: "rose",
      title: "Rose",
      preview: "#e11d48",
      foreground: "#ffffff",
    },
    {
      name: "pink",
      title: "Pink",
      preview: "#ec4899",
      foreground: "#ffffff",
    },
    {
      name: "purple",
      title: "Purple",
      preview: "#9333ea",
      foreground: "#ffffff",
    },
    {
      name: "violet",
      title: "Violet",
      preview: "#7c3aed",
      foreground: "#ffffff",
    },
    {
      name: "indigo",
      title: "Indigo",
      preview: "#4f46e5",
      foreground: "#ffffff",
    },
    {
      name: "lavender",
      title: "Lavender",
      preview: "#c4b5fd",
      foreground: "#2e1065",
    },
    {
      name: "plum",
      title: "Plum",
      preview: "#7e225f",
      foreground: "#ffffff",
    },
    {
      name: "slate",
      title: "Slate",
      preview: "#475569",
      foreground: "#ffffff",
    },
    {
      name: "gray",
      title: "Gray",
      preview: "#6b7280",
      foreground: "#ffffff",
    },
    {
      name: "charcoal",
      title: "Charcoal",
      preview: "#27272a",
      foreground: "#ffffff",
    },
    {
      name: "black",
      title: "Black",
      preview: "#09090b",
      foreground: "#ffffff",
    },
    {
      name: "white",
      title: "White",
      preview: "#ffffff",
      foreground: "#111827",
    },
    {
      name: "silver",
      title: "Silver",
      preview:
        "linear-gradient(135deg, #ffffff, #bfc5cc, #737b85)",
      foreground: "#111827",
    },
    {
      name: "chrome",
      title: "Chrome",
      preview:
        "linear-gradient(135deg, #f8fafc, #89929d, #ffffff, #4b5563)",
      foreground: "#111827",
    },
    {
      name: "platinum",
      title: "Platinum",
      preview:
        "linear-gradient(135deg, #f5f5f4, #c8c7c1, #868581)",
      foreground: "#292524",
    },
    {
      name: "steel",
      title: "Steel",
      preview:
        "linear-gradient(135deg, #dbe4ea, #708090, #334155)",
      foreground: "#ffffff",
    },
    {
      name: "titanium",
      title: "Titanium",
      preview:
        "linear-gradient(135deg, #d6d3d1, #78716c, #292524)",
      foreground: "#ffffff",
    },
    {
      name: "bronze",
      title: "Bronze",
      preview:
        "linear-gradient(135deg, #d69b62, #8a4f22, #4c2912)",
      foreground: "#ffffff",
    },
    {
      name: "copper",
      title: "Copper",
      preview:
        "linear-gradient(135deg, #e7a06c, #b45f35, #6e2f1a)",
      foreground: "#ffffff",
    },
    {
      name: "roseGold",
      title: "Rose Gold",
      preview:
        "linear-gradient(135deg, #f4c6b9, #c78372, #865244)",
      foreground: "#3f1e18",
    },
    {
      name: "champagne",
      title: "Champagne",
      preview:
        "linear-gradient(135deg, #fff0c7, #d6bd84, #9c7d3c)",
      foreground: "#3f2c0b",
    },
    {
      name: "brass",
      title: "Brass",
      preview:
        "linear-gradient(135deg, #d8c078, #a58528, #66500d)",
      foreground: "#2d2204",
    },
    {
      name: "emerald",
      title: "Emerald",
      preview:
        "linear-gradient(135deg, #34d399, #047857, #064e3b)",
      foreground: "#ffffff",
    },
    {
      name: "sapphire",
      title: "Sapphire",
      preview:
        "linear-gradient(135deg, #60a5fa, #1d4ed8, #172554)",
      foreground: "#ffffff",
    },
    {
      name: "ruby",
      title: "Ruby",
      preview:
        "linear-gradient(135deg, #fb7185, #be123c, #4c0519)",
      foreground: "#ffffff",
    },
    {
      name: "amethyst",
      title: "Amethyst",
      preview:
        "linear-gradient(135deg, #d8b4fe, #9333ea, #581c87)",
      foreground: "#ffffff",
    },
    {
      name: "onyx",
      title: "Onyx",
      preview:
        "linear-gradient(135deg, #52525b, #18181b, #000000)",
      foreground: "#ffffff",
    },
    {
      name: "midnight",
      title: "Midnight",
      preview:
        "linear-gradient(135deg, #334155, #172554, #020617)",
      foreground: "#ffffff",
    },
    {
      name: "ocean",
      title: "Ocean",
      preview:
        "linear-gradient(135deg, #22d3ee, #0284c7, #164e63)",
      foreground: "#ffffff",
    },
    {
      name: "forest",
      title: "Forest",
      preview:
        "linear-gradient(135deg, #4ade80, #166534, #052e16)",
      foreground: "#ffffff",
    },
    {
      name: "sunset",
      title: "Sunset",
      preview:
        "linear-gradient(135deg, #facc15, #f97316, #db2777)",
      foreground: "#ffffff",
    },
    {
      name: "fire",
      title: "Fire",
      preview:
        "linear-gradient(135deg, #facc15, #ef4444, #7f1d1d)",
      foreground: "#ffffff",
    },
    {
      name: "ice",
      title: "Ice",
      preview:
        "linear-gradient(135deg, #ecfeff, #67e8f9, #38bdf8)",
      foreground: "#082f49",
    },
    {
      name: "liquidGlass",
      title: "Liquid Glass",
      preview:
        "linear-gradient(135deg, rgba(255,255,255,.95), rgba(125,211,252,.72), rgba(196,181,253,.78))",
      foreground: "#1e293b",
    },
  ] as const;

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

  const handlePlatformAccentColorChange =
    useCallback(
      (
        accentColorName:
          string,
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

  const handlePlatformLanguageChange =
    useCallback(
      (
        languageCode:
          string,
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
        handlePlatformAccentColorChange,

      onLanguageChange:
        handlePlatformLanguageChange,

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
                    "app-settings-navigation__item",
                    isSelected
                      ? "app-settings-navigation__item--selected"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-current={
                    isSelected
                      ? "page"
                      : undefined
                  }
                  onClick={() => {
                    setSelectedSection(
                      item.id,
                    );
                  }}
                >
                  <span
                    className="app-settings-navigation__icon"
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>

                  <span className="app-settings-navigation__copy">
                    <strong>
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
                <header className="app-settings-panel__header">
                  <div>
                    <span className="app-settings-eyebrow">
                      Platform identity
                    </span>

                    <h2>
                      Platform Information
                    </h2>

                    <p>
                      These values belong to the global JCS platform and are not attached to an individual business.
                    </p>
                  </div>
                </header>

                <div className="app-settings-panel__body">
                  <div className="app-settings-field-grid">
                    <div className="app-settings-field">
                      <label htmlFor="platform-name">
                        Platform name
                      </label>

                      <input
                        id="platform-name"
                        autoComplete="organization"
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
                    </div>

                    <div className="app-settings-field">
                      <label htmlFor="platform-tagline">
                        Tagline
                      </label>

                      <input
                        id="platform-tagline"
                        autoComplete="off"
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
                    </div>

                    <div className="app-settings-field">
                      <label htmlFor="platform-support-email">
                        Support email
                      </label>

                      <input
                        id="platform-support-email"
                        type="email"
                        autoComplete="email"
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
                    </div>

                    <div className="app-settings-field">
                      <label htmlFor="platform-website">
                        Website
                      </label>

                      <input
                        id="platform-website"
                        type="url"
                        autoComplete="url"
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
                    </div>
                  </div>
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
                <header className="app-settings-panel__header">
                  <div>
                    <span className="app-settings-eyebrow">
                      JCS Business Suite
                    </span>

                    <h2>
                      Official JCS Logo Collection
                    </h2>

                    <p>
                      Choose the official logo used by Platform Admin and the global JCS experience.
                    </p>
                  </div>
                </header>

                <div className="app-settings-panel__body">
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
                <header className="app-settings-panel__header">
                  <div>
                    <span className="app-settings-eyebrow">
                      Platform theme
                    </span>

                    <h2>
                      Appearance
                    </h2>

                    <p>
                      Configure the global Platform Admin Accent Color and application language.
                    </p>
                  </div>
                </header>

                <div className="app-settings-panel__body">
                  <div className="app-settings-field-grid">
                    <div>
                      <label>
                        Accent Color
                      </label>

                      <div
                        className="app-settings-accent-grid"
                        role="radiogroup"
                        aria-label="Platform Admin Accent Color"
                      >
                        {ACCENT_COLOR_DISPLAY_OPTIONS
                          .filter(
                            (option) =>
                              APP_ACCENT_COLOR_VALUES.includes(
                                option.name,
                              ),
                          )
                          .map(
                            (option) => {
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
                                    "app-settings-accent-option",
                                    isSelected
                                      ? "app-settings-accent-option--selected"
                                      : "",
                                  ]
                                    .filter(Boolean)
                                    .join(" ")}
                                  disabled={
                                    isBusy ||
                                    !platformSettings
                                      .permissions
                                      .canEditAppearance
                                  }
                                  onClick={() => {
                                    platformSettings
                                      .setFieldValue(
                                        "accentColorName",
                                        option.name,
                                      );
                                  }}
                                >
                                  <span
                                    className="app-settings-accent-option__swatch"
                                    style={{
                                      background:
                                        option.preview,

                                      color:
                                        option.foreground,
                                    }}
                                  >
                                    {isSelected
                                      ? "✓"
                                      : ""}
                                  </span>

                                  <span>
                                    {option.title}
                                  </span>
                                </button>
                              );
                            },
                          )}
                      </div>
                    </div>

                    <div className="app-settings-select-field">
                      <label htmlFor="platform-language">
                        Application Language
                      </label>

                      <select
                        id="platform-language"
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
                    </div>
                  </div>
                </div>
              </section>

              <section className="app-settings-panel">
                <header className="app-settings-panel__header">
                  <div>
                    <span className="app-settings-eyebrow">
                      Coming next
                    </span>

                    <h2>
                      Official Background Collection
                    </h2>

                    <p>
                      The official JCS background library will be connected here after the background assets are installed.
                    </p>
                  </div>
                </header>

                <div className="app-settings-panel__body">
                  <p
                    style={{
                      margin:
                        0,
                      color:
                        "var(--app-settings-text-secondary)",
                      fontSize:
                        "13px",
                      lineHeight:
                        1.6,
                    }}
                  >
                    Platform background controls will appear here when the official JCS background assets are installed.
                  </p>
                </div>
              </section>
            </div>
          ) : null}

        </form>
      </div>
    </main>
  );
}
