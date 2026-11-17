"use client";

/*
 * JCS Business Suite Web
 * AppSettingsView.tsx
 *
 * Main App Settings experience for:
 *
 * - Platform Administrators.
 * - Business Owners.
 * - Business Administrators.
 *
 * Responsibilities:
 *
 * - Display and edit company information.
 * - Configure tax percentage.
 * - Configure language and Dashboard Accent Color.
 * - Display the active business logo.
 * - Generate premium logos with Sofía.
 * - Upload an existing business logo.
 * - Restore the default JCS logo.
 * - Preserve tenant isolation through businessID.
 * - Respect App Settings permissions.
 *
 * Firestore, Firebase Storage and image-generation implementation
 * details must not live in this component.
 */

import {
  ChangeEvent,
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
  APP_ACCENT_COLOR_DISPLAY_OPTIONS,
} from "./AppAccentColors";

import {
  useAppSettings,
} from "./useAppSettings";

import {
  usePlatformSettings,
} from "../platform-settings/usePlatformSettings";

import type {
  PlatformSettingsActor,
} from "../platform-settings/PlatformSettingsTypes";

import {
  useBusinessLogo,
} from "../business-branding/useBusinessLogo";

import {
  useOfficialJCSLogos,
} from "../official-jcs-branding/useOfficialJCSLogos";

import {
  applyOfficialJCSLogoToBusiness,
  applyOfficialJCSLogoToPlatform,
} from "../official-jcs-branding/OfficialJCSLogoFirestoreService";

import BusinessLogoPicker from "../business-branding/BusinessLogoPicker";
import CompanyLogoView from "../business-branding/CompanyLogoView";

import {
  JCS_SCREEN_BACKGROUND_OPTIONS,
} from "../../components/layout/JCSScreenBackground";

import type {
  JCSScreenBackgroundID,
} from "../../components/layout/JCSScreenBackground";

import "./AppSettingsView.css";

import type {
  AppAccentColorName,
  AppLanguageCode,
  AppSettingsActor,
  AppSettingsFormErrors,
} from "./AppSettingsTypes";

import type {
  BusinessLogoDNAContext,
  BusinessLogoOption,
} from "../business-branding/BusinessLogoTypes";

import {
  useAuth,
} from "@/core/hooks/useAuth";

import {
  ownedBusinessesFromAccessibleBusinesses,
} from "@/core/business-context/JCSAccessibleBusinessService";

// MARK: - Sections

const APP_SETTINGS_SECTION_VALUES = [
  "company",
  "branding",
  "appearance",
  "financial",
] as const;

type AppSettingsSection =
  (typeof APP_SETTINGS_SECTION_VALUES)[number];

// MARK: - Props

export type AppSettingsScope =
  | "platform"
  | "business";

export interface AppSettingsViewProps {
  scope?:
    AppSettingsScope;

  businessID: string;
  ownerUID: string;
  currentUserUID: string;

  actor: AppSettingsActor;

  initialCompanyName?: string;
  initialAccentColorName?: AppAccentColorName;

  industry?: string;
  businessCategory?: string;
  tagline?: string;

  businessDNA?: BusinessLogoDNAContext;

  /**
   * Controls whether Sofía premium-generation tools are available
   * for the current business subscription.
   *
   * Platform Administrators may still be granted access by the
   * parent when managing a client business.
   */
  hasPremiumBrandingAccess?: boolean;

  /**
   * Optional callback used by the main App Shell to apply the
   * selected Accent Color immediately.
   */
  onAccentColorChange?: (
    accentColorName: AppAccentColorName,
  ) => void;

  /**
   * Optional callback used by the localization system.
   */
  onLanguageChange?: (
    languageCode: AppLanguageCode,
  ) => void;

  onClose?: () => void;
}

// MARK: - Accent Options

// Shared official registry:
// APP_ACCENT_COLOR_DISPLAY_OPTIONS

// MARK: - Component

function BusinessAppSettingsView({
  businessID,
  ownerUID,
  currentUserUID,

  actor,

  initialCompanyName = "",
  initialAccentColorName = "blue",

  industry = "General Business",
  businessCategory = "",
  tagline = "",

  businessDNA,

  hasPremiumBrandingAccess = false,

  onAccentColorChange,
  onLanguageChange,
  onClose,
}: AppSettingsViewProps) {
  const [
    selectedSection,
    setSelectedSection,
  ] =
    useState<AppSettingsSection>(
      "company",
    );

  const {
    accessibleBusinesses,
    activeBusinessID,
    selectBusiness,
  } = useAuth();


  const ownedBusinesses =
    useMemo(
      () =>
        ownedBusinessesFromAccessibleBusinesses(
          accessibleBusinesses
        ),
      [
        accessibleBusinesses,
      ]
    );


  const handleBusinessSwitch =
    useCallback(
      (
        nextBusinessID: string
      ): void => {

        if (
          nextBusinessID ===
          activeBusinessID
        ) {
          return;
        }

        const selected =
          selectBusiness(
            nextBusinessID
          );

        if (!selected) {
          return;
        }

        /*
         * Close Settings after switching.
         *
         * Dashboard + JCSBusinessContext will reload the
         * newly selected tenant and reopen Settings with
         * that business's own data if requested.
         */
        onClose?.();
      },
      [
        activeBusinessID,
        onClose,
        selectBusiness,
      ]
    );

  /*
   * App Settings loads first without receiving branding directly.
   *
   * saveAppSettings() reads and preserves the current branding
   * fields transactionally when branding is omitted.
   *
   * This avoids a circular dependency between useAppSettings and
   * useBusinessLogo while still protecting the active logo.
   */
  const appSettings =
    useAppSettings({
      businessID,
      ownerUID,
      currentUserUID,

      actor,

      initialCompanyName,

      branding:
        null,

      autoLoad:
        true,

      subscribeToChanges:
        true,

      preserveUnsavedChanges:
        true,
    });

  const effectiveBusinessName =
    appSettings.formValues.companyName ||
    initialCompanyName ||
    "My Business";

  const effectiveAccentColorName =
    appSettings.formValues.accentColorName ||
    initialAccentColorName;

  const effectiveAccentColor =
    useMemo(
      () =>
        getAccentColorCSSValue(
          effectiveAccentColorName,
        ),
      [effectiveAccentColorName],
    );

  const businessLogo =
    useBusinessLogo({
      businessID,
      ownerUID,

      createdByUID:
        currentUserUID,

      businessName:
        effectiveBusinessName,

      accentColorName:
        effectiveAccentColorName,

      industry,

      businessCategory:
        businessCategory ||
        industry,

      style:
        "Premium professional commercial brand identity",

      tagline,

      languageCode:
        appSettings.formValues
          .languageCode === "system"
          ? "en"
          : appSettings.formValues
              .languageCode,

      businessDNA,

      autoLoad:
        true,
    });

  const canGeneratePremiumLogo =
    appSettings.permissions
      .canGeneratePremiumLogo &&
    (
      hasPremiumBrandingAccess ||
      actor.isPlatformAdministrator
    );

  const isBusy =
    appSettings.isLoading ||
    appSettings.isSaving ||
    businessLogo.isLoading ||
    businessLogo.isUploading ||
    businessLogo.isSaving;

  const handleSubmit =
    useCallback(
      async (
        event:
          FormEvent<HTMLFormElement>,
      ) => {
        event.preventDefault();

        const result =
          await appSettings.saveSettings();

        if (!result.success) {
          return;
        }

        onAccentColorChange?.(
          result.settings
            .accentColorName,
        );

        onLanguageChange?.(
          result.settings
            .languageCode,
        );
      },
      [
        appSettings,
        onAccentColorChange,
        onLanguageChange,
      ],
    );

  const handleAccentColorSelection =
    useCallback(
      (
        accentColorName:
          AppAccentColorName,
      ) => {
        appSettings.setFieldValue(
          "accentColorName",
          accentColorName,
        );

        /*
         * Provides a live Dashboard preview before saving.
         */
        onAccentColorChange?.(
          accentColorName,
        );
      },
      [
        appSettings,
        onAccentColorChange,
      ],
    );

  const handleLanguageChange =
    useCallback(
      (
        event:
          ChangeEvent<HTMLSelectElement>,
      ) => {
        const languageCode =
          event.target
            .value as AppLanguageCode;

        appSettings.setFieldValue(
          "languageCode",
          languageCode,
        );
      },
      [appSettings],
    );

  const handleGeneratePremiumLogos =
    useCallback(async () => {
      if (!canGeneratePremiumLogo) {
        return;
      }

      await businessLogo
        .generatePremiumLogoOptions(4);
    }, [
      businessLogo,
      canGeneratePremiumLogo,
    ]);

  if (
    !appSettings.canViewSettings
  ) {
    return (
      <AppSettingsAccessDenied
        onClose={
          onClose
        }
      />
    );
  }

  return (
    <main
      className="app-settings-view"
      style={{
        "--app-settings-accent":
          effectiveAccentColor,
      } as React.CSSProperties}
    >
      <header className="app-settings-header">
        <div className="app-settings-header__identity">
          <CompanyLogoView
            branding={
              businessLogo.activeBranding
            }
            logo={
              businessLogo.activeLogo
            }
            businessName={
              effectiveBusinessName
            }
            accentColor={
              effectiveAccentColor
            }
            size="compact"
            enableShadow={
              false
            }
            isLoading={
              businessLogo.isLoading
            }
          />

          <div className="app-settings-header__copy">
            <span className="app-settings-eyebrow">
              JCS Business Suite
            </span>

            <h1>
              App Settings
            </h1>

            <p>
              Manage your company information,
              branding, appearance and financial
              configuration.
            </p>
          </div>
        </div>

        <div className="app-settings-header__actions">
          {appSettings.isDirty ? (
            <span className="app-settings-unsaved-badge">
              Unsaved changes
            </span>
          ) : null}

          <button
            type="button"
            className="app-settings-secondary-button"
            onClick={
              appSettings.resetForm
            }
            disabled={
              !appSettings.isDirty ||
              isBusy
            }
          >
            Reset
          </button>

          <button
            type="submit"
            form="app-settings-form"
            className="app-settings-primary-button"
            disabled={
              !appSettings.canManageSettings ||
              !appSettings.isDirty ||
              isBusy
            }
          >
            {appSettings.isSaving
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
        <AppSettingsNavigation
          selectedSection={
            selectedSection
          }
          onSelectSection={
            setSelectedSection
          }
        />

        <form
          id="app-settings-form"
          className="app-settings-content"
          onSubmit={
            handleSubmit
          }
          noValidate
        >
          <AppSettingsStatusMessages
            errorMessage={
              appSettings.errorMessage ||
              businessLogo.errorMessage
            }
            successMessage={
              appSettings.successMessage
            }
            onDismissError={() => {
              appSettings.clearError();
              businessLogo.clearError();
            }}
            onDismissSuccess={
              appSettings.clearSuccess
            }
          />

          <AppSettingsPanel
            eyebrow="Business Management"
            title="My Businesses"
            description="Manage the businesses owned by this account, switch the active workspace, or create another independent business."
          >
            <div
              style={{
                display: "grid",
                gap: 12,
              }}
            >
              {ownedBusinesses.length > 0 ? (
                ownedBusinesses.map(
                  (ownedBusiness) => {

                    const isCurrent =
                      ownedBusiness.businessID ===
                        activeBusinessID ||
                      ownedBusiness.businessID ===
                        businessID;

                    return (
                      <div
                        key={
                          ownedBusiness.businessID
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 16,
                          padding: 16,
                          borderRadius: 16,
                          border:
                            isCurrent
                              ? "1px solid var(--app-settings-accent)"
                              : "1px solid rgba(148,163,184,0.20)",
                          background:
                            isCurrent
                              ? "color-mix(in srgb, var(--app-settings-accent) 10%, transparent)"
                              : "rgba(148,163,184,0.08)",
                        }}
                      >
                        <div
                          style={{
                            minWidth: 0,
                            display: "grid",
                            gap: 4,
                          }}
                        >
                          <strong>
                            {
                              isCurrent
                                ? effectiveBusinessName
                                : ownedBusiness.businessName
                            }
                          </strong>

                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              color:
                                isCurrent
                                  ? "var(--app-settings-accent)"
                                  : "inherit",
                              opacity:
                                isCurrent
                                  ? 1
                                  : 0.72,
                            }}
                          >
                            {
                              isCurrent
                                ? "Current Workspace"
                                : "Business Owner"
                            }
                          </span>

                          <code
                            style={{
                              fontSize: 12,
                              overflowWrap:
                                "anywhere",
                              opacity: 0.72,
                            }}
                          >
                            {
                              ownedBusiness.businessID
                            }
                          </code>
                        </div>

                        {isCurrent ? (
                          <span
                            aria-label="Current workspace"
                            title="Current workspace"
                            style={{
                              fontSize: 22,
                              color:
                                "var(--app-settings-accent)",
                            }}
                          >
                            ✓
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="app-settings-secondary-button"
                            onClick={() => {
                              handleBusinessSwitch(
                                ownedBusiness.businessID
                              );
                            }}
                            style={{
                              flexShrink: 0,
                            }}
                          >
                            Switch to Business
                          </button>
                        )}
                      </div>
                    );
                  }
                )
              ) : (
                <div
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    border:
                      "1px solid rgba(148,163,184,0.20)",
                    background:
                      "rgba(148,163,184,0.08)",
                  }}
                >
                  <strong>
                    {effectiveBusinessName}
                  </strong>

                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      opacity: 0.72,
                    }}
                  >
                    Current business
                  </div>

                  <code
                    style={{
                      display: "block",
                      marginTop: 4,
                      fontSize: 12,
                      overflowWrap:
                        "anywhere",
                      opacity: 0.72,
                    }}
                  >
                    {businessID}
                  </code>
                </div>
              )}

              <a
                href="/add-business"
                className="app-settings-primary-button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  minHeight: 52,
                  textDecoration: "none",
                }}
              >
                <span>
                  Add Business
                </span>

                <span
                  aria-hidden="true"
                >
                  →
                </span>
              </a>

              <small
                style={{
                  lineHeight: 1.5,
                  opacity: 0.72,
                }}
              >
                Each business keeps its own Business ID,
                settings, data and billing. Switching
                workspaces does not merge tenant data.
                Opening Add Business does not change the
                active workspace.
              </small>
            </div>
          </AppSettingsPanel>

          {appSettings.isLoading &&
          !appSettings.hasLoaded ? (
            <AppSettingsLoadingState />
          ) : null}

          {!appSettings.isLoading ||
          appSettings.hasLoaded ? (
            <>
              {selectedSection ===
              "company" ? (
                <CompanyInformationSection
                  disabled={
                    !appSettings
                      .permissions
                      .canEditCompanyInformation ||
                    isBusy
                  }
                  values={
                    appSettings.formValues
                  }
                  errors={
                    appSettings.formErrors
                  }
                  onChange={
                    appSettings.setFieldValue
                  }
                />
              ) : null}

              {selectedSection ===
              "branding" ? (
                <BrandingSection
              businessID={
                businessID
              }
                  businessName={
                    effectiveBusinessName
                  }
                  accentColor={
                    effectiveAccentColor
                  }
                  canManage={
                    appSettings.canManageSettings
                  }
                  canGeneratePremiumLogo={
                    canGeneratePremiumLogo
                  }
                  hasPremiumBrandingAccess={
                    hasPremiumBrandingAccess ||
                    actor.isPlatformAdministrator
                  }
                  businessLogo={
                    businessLogo
                  }
                  onGeneratePremiumLogos={
                    handleGeneratePremiumLogos
                  }
                />
              ) : null}

              {selectedSection ===
              "appearance" ? (
                <AppearanceSection
                  disabled={
                    !appSettings
                      .permissions
                      .canEditAccentColor ||
                    isBusy
                  }
                  accentColorName={
                    effectiveAccentColorName
                  }
                  backgroundID={
                    appSettings.formValues
                      .backgroundID
                  }
                  languageCode={
                    appSettings.formValues
                      .languageCode
                  }
                  errors={
                    appSettings.formErrors
                  }
                  onAccentColorSelection={
                    handleAccentColorSelection
                  }
                  onBackgroundSelection={(
                    backgroundID,
                  ) => {
                    appSettings.setFieldValue(
                      "backgroundID",
                      backgroundID,
                    );
                  }}
                  onLanguageChange={
                    handleLanguageChange
                  }
                  branding={
                    businessLogo.activeBranding
                  }
                  logo={
                    businessLogo.activeLogo
                  }
                  businessName={
                    effectiveBusinessName
                  }
                  accentColor={
                    effectiveAccentColor
                  }
                />
              ) : null}

              {selectedSection ===
              "financial" ? (
                <FinancialSection
                  disabled={
                    !appSettings
                      .permissions
                      .canEditTaxConfiguration ||
                    isBusy
                  }
                  taxPercentText={
                    appSettings.formValues
                      .taxPercentText
                  }
                  errorMessage={
                    appSettings.formErrors
                      .taxPercent
                  }
                  onChange={(
                    value,
                  ) => {
                    appSettings.setFieldValue(
                      "taxPercentText",
                      value,
                    );
                  }}
                />
              ) : null}
            </>
          ) : null}

          <div className="app-settings-mobile-save-bar">
            <button
              type="button"
              className="app-settings-secondary-button"
              onClick={
                appSettings.resetForm
              }
              disabled={
                !appSettings.isDirty ||
                isBusy
              }
            >
              Reset
            </button>

            <button
              type="submit"
              className="app-settings-primary-button"
              disabled={
                !appSettings.canManageSettings ||
                !appSettings.isDirty ||
                isBusy
              }
            >
              {appSettings.isSaving
                ? "Saving..."
                : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

// =======================================================
// MARK: - Platform App Settings
// =======================================================

function PlatformAppSettingsView({
  currentUserUID,
  actor,
  onAccentColorChange,
  onLanguageChange,
  onClose,
}: AppSettingsViewProps) {
  const [
    selectedSection,
    setSelectedSection,
  ] =
    useState<AppSettingsSection>(
      "appearance",
    );

  const platformActor =
    useMemo<PlatformSettingsActor>(
      () => ({
        firebaseUID:
          currentUserUID,

        role:
          "platform-admin",

        isPlatformAdministrator:
          actor.isPlatformAdministrator,

        canManagePlatformSettings:
          actor.isPlatformAdministrator,
      }),
      [
        actor.isPlatformAdministrator,
        currentUserUID,
      ],
    );

  const platformSettings =
    usePlatformSettings({
      actor:
        platformActor,

      currentUserUID,

      autoLoad:
        true,

      onAccentColorChange:
        onAccentColorChange
          ? (accentColorName: string) => {
              onAccentColorChange(
                accentColorName as AppAccentColorName,
              );
            }
          : undefined,

      onLanguageChange:
        onLanguageChange
          ? (languageCode: string) => {
              onLanguageChange(
                languageCode as AppLanguageCode,
              );
            }
          : undefined,
    });

  const effectivePlatformName =
    platformSettings.formValues
      .platformName ||
    "JCS Business Suite";

  const effectiveAccentColorName =
    platformSettings.formValues
      .accentColorName;

  const effectiveAccentColor =
    useMemo(
      () =>
        getAccentColorCSSValue(
          effectiveAccentColorName,
        ),
      [
        effectiveAccentColorName,
      ],
    );

  const isBusy =
    platformSettings.isLoading ||
    platformSettings.isSaving ||
    platformSettings.isUploadingLogo ||
    platformSettings.isRestoringLogo;

  const officialLogos =
    useOfficialJCSLogos();

  const [
    isApplyingOfficialLogo,
    setIsApplyingOfficialLogo,
  ] = useState(false);

  const [
    officialLogoMessage,
    setOfficialLogoMessage,
  ] = useState("");

  const [
    officialLogoError,
    setOfficialLogoError,
  ] = useState("");

  const handleApplyOfficialLogo =
    useCallback(
      async () => {
        const selectedLogo =
          officialLogos.selectedLogo;

        if (
          !selectedLogo ||
          !selectedLogo.isAvailable
        ) {
          setOfficialLogoError(
            "Select an available official JCS logo first.",
          );

          return;
        }

        if (
          !platformSettings.permissions
            .canManageSettings
        ) {
          setOfficialLogoError(
            "You do not have permission to change the platform logo.",
          );

          return;
        }

        setIsApplyingOfficialLogo(
          true,
        );

        setOfficialLogoMessage(
          "",
        );

        setOfficialLogoError(
          "",
        );

        try {
          await applyOfficialJCSLogoToPlatform({
            logo:
              selectedLogo,
          });

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
      },
      [
        officialLogos.selectedLogo,
        platformSettings,
      ],
    );

  const handleSubmit =
    useCallback(
      async (
        event:
          FormEvent<HTMLFormElement>,
      ) => {
        event.preventDefault();

        await platformSettings
          .saveSettings();
      },
      [
        platformSettings,
      ],
    );

  const handleAccentColorSelection =
    useCallback(
      (
        accentColorName:
          AppAccentColorName,
      ) => {
        platformSettings.setFieldValue(
          "accentColorName",
          accentColorName,
        );

        onAccentColorChange?.(
          accentColorName,
        );
      },
      [
        onAccentColorChange,
        platformSettings,
      ],
    );

  const handleLanguageChange =
    useCallback(
      (
        event:
          ChangeEvent<HTMLSelectElement>,
      ) => {
        const languageCode =
          event.target
            .value as AppLanguageCode;

        platformSettings.setFieldValue(
          "languageCode",
          languageCode,
        );

        onLanguageChange?.(
          languageCode,
        );
      },
      [
        onLanguageChange,
        platformSettings,
      ],
    );

  if (
    !platformSettings.permissions
      .canViewSettings
  ) {
    return (
      <AppSettingsAccessDenied
        onClose={
          onClose
        }
      />
    );
  }

  return (
    <main
      className="app-settings-view"
      style={{
        "--app-settings-accent":
          effectiveAccentColor,
      } as React.CSSProperties}
    >
      <header className="app-settings-header">
        <div className="app-settings-header__identity">
          <div className="app-settings-header__copy">
            <span className="app-settings-eyebrow">
              JCS Business Suite
            </span>

            <h1>
              App Settings
            </h1>

            <p>
              Manage global platform information,
              branding and appearance.
            </p>
          </div>
        </div>

        <div className="app-settings-header__actions">
          {platformSettings.isDirty ? (
            <span className="app-settings-unsaved-badge">
              Unsaved changes
            </span>
          ) : null}

          <button
            type="button"
            className="app-settings-secondary-button"
            onClick={
              platformSettings.resetForm
            }
            disabled={
              !platformSettings.isDirty ||
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
              !platformSettings.permissions
                .canManageSettings ||
              !platformSettings.isDirty ||
              isBusy
            }
          >
            {platformSettings.isSaving
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
        <AppSettingsNavigation
          selectedSection={
            selectedSection
          }
          onSelectSection={
            setSelectedSection
          }
          showFinancial={
            false
          }
        />

        <form
          id="platform-app-settings-form"
          className="app-settings-content"
          onSubmit={
            handleSubmit
          }
          noValidate
        >
          <AppSettingsStatusMessages
            errorMessage={
              platformSettings.errorMessage
            }
            successMessage={
              platformSettings.successMessage
            }
            onDismissError={
              platformSettings.clearMessages
            }
            onDismissSuccess={
              platformSettings.clearMessages
            }
          />

          {platformSettings.isLoading ? (
            <AppSettingsLoadingState />
          ) : null}

          {!platformSettings.isLoading ? (
            <>
              {selectedSection ===
              "appearance" ? (
                <AppearanceSection
                  scope="platform"
                  disabled={
                    !platformSettings
                      .permissions
                      .canEditAppearance ||
                    isBusy
                  }
                  accentColorName={
                    platformSettings.formValues
                      .accentColorName
                  }
                  backgroundID={
                    platformSettings.formValues
                      .screenBackgroundID
                  }
                  languageCode={
                    platformSettings.formValues
                      .languageCode
                  }
                  errors={{
                    accentColorName:
                      platformSettings
                        .formErrors
                        .accentColorName,

                    languageCode:
                      platformSettings
                        .formErrors
                        .languageCode,
                  }}
                  onAccentColorSelection={
                    handleAccentColorSelection
                  }
                  onBackgroundSelection={(
                    backgroundID,
                  ) => {
                    platformSettings.setFieldValue(
                      "screenBackgroundID",
                      backgroundID,
                    );
                  }}
                  onLanguageChange={
                    handleLanguageChange
                  }
                  previewLogoURL={
                    platformSettings.settings
                      ?.logoDownloadURL ??
                    ""
                  }
                  businessName={
                    effectivePlatformName
                  }
                  accentColor={
                    effectiveAccentColor
                  }
                />
              ) : selectedSection ===
                "branding" ? (
                <div className="app-settings-section-stack">
                  <AppSettingsPanel
                    eyebrow="JCS Business Suite"
                    title="Official JCS Logo Collection"
                    description="Choose the official JCS Business Suite logo used by the Platform Administrator experience."
                  >
                    <div className="app-settings-official-logo-library">
                      <div className="app-settings-official-logo-library__header">
                        <div>
                          <h3>
                            8 Official Logos
                          </h3>

                          <p>
                            Select the platform logo that best matches the current Dashboard background and Accent Color.
                          </p>
                        </div>

                        <div className="app-settings-official-logo-library__header-actions">
                          <span className="app-settings-official-logo-library__badge">
                            Platform
                          </span>

                          <button
                            type="button"
                            className="app-settings-button app-settings-button--primary app-settings-official-logo-library__apply-button"
                            disabled={
                              !platformSettings
                                .permissions
                                .canManageSettings ||
                              isApplyingOfficialLogo ||
                              !officialLogos
                                .selectedLogo ||
                              !officialLogos
                                .selectedLogo
                                .isAvailable
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

                      {officialLogos.errorMessage ? (
                        <div className="app-settings-official-logo-library__message">
                          {officialLogos.errorMessage}
                        </div>
                      ) : null}

                      <div className="app-settings-official-logo-grid">
                        {officialLogos.logos.map(
                          (logo) => {
                            const isSelected =
                              officialLogos
                                .selectedLogoID ===
                              logo.id;

                            return (
                              <button
                                key={logo.id}
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
                                  officialLogos.isLoading ||
                                  !logo.isAvailable
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
                                  {logo.downloadURL ? (
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
                                        Slot {logo.slot}
                                      </strong>

                                      <small>
                                        Logo not mounted yet
                                      </small>
                                    </span>
                                  )}

                                  {isSelected ? (
                                    <span
                                      className="app-settings-official-logo-card__check"
                                      aria-hidden="true"
                                    >
                                      ✓
                                    </span>
                                  ) : null}
                                </span>

                                <span className="app-settings-official-logo-card__copy">
                                  <strong>
                                    {logo.title}
                                  </strong>

                                  <span>
                                    Official JCS Logo
                                  </span>
                                </span>
                              </button>
                            );
                          },
                        )}
                      </div>

                      <div className="app-settings-official-logo-library__actions">
                        {officialLogoMessage ? (
                          <span className="app-settings-official-logo-library__success">
                            {officialLogoMessage}
                          </span>
                        ) : null}

                        {officialLogoError ? (
                          <span className="app-settings-official-logo-library__error">
                            {officialLogoError}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </AppSettingsPanel>
                </div>
              ) : (
                <AppSettingsPanel
                  eyebrow="Platform Administrator"
                  title="Platform Information"
                  description="Global platform information will use this same App Settings experience."
                >
                  <p>
                    This section is now part of the unified
                    App Settings experience.
                  </p>
                </AppSettingsPanel>
              )}
            </>
          ) : null}

          <div className="app-settings-mobile-save-bar">
            <button
              type="button"
              className="app-settings-secondary-button"
              onClick={
                platformSettings.resetForm
              }
              disabled={
                !platformSettings.isDirty ||
                isBusy
              }
            >
              Reset
            </button>

            <button
              type="submit"
              className="app-settings-primary-button"
              disabled={
                !platformSettings.permissions
                  .canManageSettings ||
                !platformSettings.isDirty ||
                isBusy
              }
            >
              {platformSettings.isSaving
                ? "Saving..."
                : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

// =======================================================
// MARK: - App Settings Scope Router
// =======================================================

export default function AppSettingsView(
  props: AppSettingsViewProps,
) {
  const scope =
    props.scope ??
    "business";

  /*
   * Business remains the current proven implementation.
   *
   * The platform branch will be connected next to
   * usePlatformSettings() and platformSettings/global.
   */
  if (scope === "platform") {
    return (
      <PlatformAppSettingsView
        {...props}
      />
    );
  }

  return (
    <BusinessAppSettingsView
      {...props}
    />
  );
}

// MARK: - Navigation

interface AppSettingsNavigationProps {
  selectedSection:
    AppSettingsSection;

  onSelectSection: (
    section: AppSettingsSection,
  ) => void;

  showFinancial?:
    boolean;
}

function AppSettingsNavigation({
  selectedSection,
  onSelectSection,
  showFinancial = true,
}: AppSettingsNavigationProps) {
  const items: Array<{
    id: AppSettingsSection;
    icon: string;
    title: string;
    subtitle: string;
  }> = [
    {
      id: "company",
      icon: "🏢",
      title: "Company",
      subtitle: "Business information",
    },
    {
      id: "branding",
      icon: "✦",
      title: "Branding",
      subtitle: "Logo and Sofía",
    },
    {
      id: "appearance",
      icon: "◉",
      title: "Appearance",
      subtitle: "Color and language",
    },
    ...(showFinancial
      ? [
          {
            id: "financial" as AppSettingsSection,
            icon: "%",
            title: "Financial",
            subtitle: "Tax configuration",
          },
        ]
      : []),
  ];

  return (
    <nav
      className="app-settings-navigation"
      aria-label="App Settings sections"
    >
      {items.map(
        (item) => {
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
                onSelectSection(
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
  );
}

// MARK: - Company Section

interface CompanyInformationSectionProps {
  disabled: boolean;

  values: {
    companyName: string;
    addressLine1: string;
    addressLine2: string;
    phone: string;
    email: string;
  };

  errors:
    AppSettingsFormErrors;

  onChange: <
    Field extends
      | "companyName"
      | "addressLine1"
      | "addressLine2"
      | "phone"
      | "email",
  >(
    field: Field,
    value: string,
  ) => void;
}

function CompanyInformationSection({
  disabled,
  values,
  errors,
  onChange,
}: CompanyInformationSectionProps) {
  return (
    <AppSettingsPanel
      eyebrow="Business identity"
      title="Company Information"
      description="This information appears throughout your Dashboard, invoices, receipts, orders and customer communications."
    >
      <div className="app-settings-field-grid">
        <AppSettingsTextField
          id="company-name"
          label="Company Name"
          value={
            values.companyName
          }
          errorMessage={
            errors.companyName
          }
          disabled={
            disabled
          }
          required
          autoComplete="organization"
          placeholder="Enter company name"
          onChange={(
            value,
          ) => {
            onChange(
              "companyName",
              value,
            );
          }}
        />

        <AppSettingsTextField
          id="company-email"
          label="Business Email"
          type="email"
          value={
            values.email
          }
          errorMessage={
            errors.email
          }
          disabled={
            disabled
          }
          autoComplete="email"
          placeholder="company@example.com"
          onChange={(
            value,
          ) => {
            onChange(
              "email",
              value,
            );
          }}
        />

        <AppSettingsTextField
          id="company-phone"
          label="Business Phone"
          type="tel"
          value={
            values.phone
          }
          errorMessage={
            errors.phone
          }
          disabled={
            disabled
          }
          autoComplete="tel"
          placeholder="(419) 555-1234"
          onChange={(
            value,
          ) => {
            onChange(
              "phone",
              value,
            );
          }}
        />

        <div aria-hidden="true" />

        <AppSettingsTextField
          id="address-line-1"
          label="Address Line 1"
          value={
            values.addressLine1
          }
          errorMessage={
            errors.addressLine1
          }
          disabled={
            disabled
          }
          autoComplete="address-line1"
          placeholder="Street address"
          onChange={(
            value,
          ) => {
            onChange(
              "addressLine1",
              value,
            );
          }}
        />

        <AppSettingsTextField
          id="address-line-2"
          label="Address Line 2"
          value={
            values.addressLine2
          }
          errorMessage={
            errors.addressLine2
          }
          disabled={
            disabled
          }
          autoComplete="address-line2"
          placeholder="Suite, unit or additional information"
          onChange={(
            value,
          ) => {
            onChange(
              "addressLine2",
              value,
            );
          }}
        />
      </div>
    </AppSettingsPanel>
  );
}

// MARK: - Branding Section

interface BrandingSectionProps {
  businessID: string;

  businessName: string;
  accentColor: string;

  canManage: boolean;
  canGeneratePremiumLogo: boolean;
  hasPremiumBrandingAccess: boolean;

  businessLogo:
    ReturnType<
      typeof useBusinessLogo
    >;

  onGeneratePremiumLogos:
    () => Promise<void>;
}

function BrandingSection({
  businessID,

  businessName,
  accentColor,

  canManage,
  canGeneratePremiumLogo,
  hasPremiumBrandingAccess,

  businessLogo,

  onGeneratePremiumLogos,
}: BrandingSectionProps) {
  const officialLogos =
    useOfficialJCSLogos();

  const [
    isApplyingOfficialLogo,
    setIsApplyingOfficialLogo,
  ] = useState(false);

  const [
    officialLogoMessage,
    setOfficialLogoMessage,
  ] = useState("");

  const [
    officialLogoError,
    setOfficialLogoError,
  ] = useState("");

  const handleApplyOfficialLogo =
    async () => {
      const selectedLogo =
        officialLogos.selectedLogo;

      if (
        !selectedLogo ||
        !selectedLogo.isAvailable
      ) {
        setOfficialLogoError(
          "Select an available official JCS logo first.",
        );

        return;
      }

      if (!canManage) {
        setOfficialLogoError(
          "You do not have permission to change this business logo.",
        );

        return;
      }

      setIsApplyingOfficialLogo(
        true,
      );

      setOfficialLogoMessage(
        "",
      );

      setOfficialLogoError(
        "",
      );

      try {
        await applyOfficialJCSLogoToBusiness({
          businessID,

          companyName:
            businessName,

          accentColorName:
            accentColor,

          logo:
            selectedLogo,
        });

        /*
         * Reload the canonical business branding so the
         * Dashboard and CompanyLogoView receive the new
         * global official logo immediately.
         */
        await businessLogo
          .reloadActiveLogo();

        setOfficialLogoMessage(
          "Official JCS logo applied successfully.",
        );
      } catch (
        error: unknown
      ) {
        console.error(
          "Official JCS logo apply failed:",
          error,
        );

        setOfficialLogoError(
          error instanceof Error &&
          error.message.trim()
            ? error.message
            : "The official JCS logo could not be applied.",
        );
      } finally {
        setIsApplyingOfficialLogo(
          false,
        );
      }
    };

  return (
    <div className="app-settings-section-stack">
      <AppSettingsPanel
        eyebrow="JCS Business Suite"
        title="Official JCS Logo Collection"
        description="Choose from the eight official JCS Business Suite logo styles. These platform logos are always available and are managed by JCS."
      >
        <div className="app-settings-official-logo-library">
          <div className="app-settings-official-logo-library__header">
            <div>
              <h3>
                8 Official Logos
              </h3>

              <p>
                Select the logo that best matches your
                Dashboard background and Accent Color.
              </p>
            </div>

            <div className="app-settings-official-logo-library__header-actions">
              <span className="app-settings-official-logo-library__badge">
                Included
              </span>

              <button
                type="button"
                className="app-settings-button app-settings-button--primary app-settings-official-logo-library__apply-button"
                disabled={
                  !canManage ||
                  isApplyingOfficialLogo ||
                  !officialLogos.selectedLogo ||
                  !officialLogos.selectedLogo.isAvailable
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

          {officialLogos.errorMessage ? (
            <div className="app-settings-official-logo-library__message">
              {officialLogos.errorMessage}
            </div>
          ) : null}

          <div className="app-settings-official-logo-grid">
            {officialLogos.logos.map(
              (logo) => {
                const isSelected =
                  officialLogos.selectedLogoID ===
                  logo.id;

                return (
                  <button
                    key={logo.id}
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
                      officialLogos.isLoading ||
                      !logo.isAvailable
                    }
                    onClick={() => {
                      officialLogos.setSelectedLogoID(
                        logo.id,
                      );
                    }}
                    aria-pressed={
                      isSelected
                    }
                  >
                    <span className="app-settings-official-logo-card__preview">
                      {logo.downloadURL ? (
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
                            Slot {logo.slot}
                          </strong>

                          <small>
                            Logo not mounted yet
                          </small>
                        </span>
                      )}

                      {isSelected ? (
                        <span
                          className="app-settings-official-logo-card__check"
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                      ) : null}
                    </span>

                    <span className="app-settings-official-logo-card__copy">
                      <strong>
                        {logo.title}
                      </strong>

                      <span>
                        Official JCS Logo
                      </span>
                    </span>
                  </button>
                );
              },
            )}
          </div>

          <div className="app-settings-official-logo-library__actions">
            {officialLogoMessage ? (
              <span className="app-settings-official-logo-library__success">
                {officialLogoMessage}
              </span>
            ) : null}

            {officialLogoError ? (
              <span className="app-settings-official-logo-library__error">
                {officialLogoError}
              </span>
            ) : null}
          </div>
        </div>
      </AppSettingsPanel>

      <AppSettingsPanel
        eyebrow="Premium branding"
        title="Create Your Logo with Sofía"
        description="Sofía analyzes your business and creates four original professional logo directions for your company."
        headerAccessory={
          <span className="app-settings-premium-badge">
            Premium
          </span>
        }
      >
        <div className="app-settings-sofia-layout">
          <div className="app-settings-sofia-copy">
            <div
              className="app-settings-sofia-avatar"
              aria-hidden="true"
            >
              S
            </div>

            <div>
              <h3>
                Professional AI Brand Design
              </h3>

              <p>
                Your package includes four
                distinctive concepts, transparent
                PNG output and a recommendation
                selected by Sofía.
              </p>
            </div>
          </div>

          {!hasPremiumBrandingAccess ? (
            <div className="app-settings-premium-locked">
              <strong>
                Premium Branding Package
              </strong>

              <p>
                Upgrade this business to unlock
                professional automatic logo
                generation.
              </p>

              <button
                type="button"
                className="app-settings-primary-button"
                disabled
              >
                Premium Required
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="app-settings-primary-button"
              disabled={
                !canGeneratePremiumLogo ||
                businessLogo.isGenerating ||
                businessLogo.isSaving
              }
              onClick={() => {
                void onGeneratePremiumLogos();
              }}
            >
              {businessLogo.isGenerating
                ? "Sofía Is Designing..."
                : "Create 4 Premium Logos"}
            </button>
          )}
        </div>

        {businessLogo.isGenerating ? (
          <SofiaGenerationProgress
            message={
              businessLogo.currentStepMessage
            }
            completedOptions={
              businessLogo
                .generationProgress
                ?.completedOptions ?? 0
            }
            totalOptions={
              businessLogo
                .generationProgress
                ?.totalOptions ?? 4
            }
            onCancel={
              businessLogo.cancelGeneration
            }
          />
        ) : null}

        {businessLogo.options.length >
        0 ? (
          <PremiumLogoOptions
            options={
              businessLogo.options
            }
            selectedOptionID={
              businessLogo.selectedOptionID
            }
            isSaving={
              businessLogo.isSaving
            }
            onSelect={
              businessLogo.selectOption
            }
            onSave={() =>
              businessLogo
                .saveSelectedGeneratedLogo()
            }
            onClear={
              businessLogo.clearGeneratedOptions
            }
          />
        ) : null}
      </AppSettingsPanel>

      <AppSettingsPanel
        eyebrow="Your artwork"
        title="Upload Your Own Logo"
        description="Use an existing PNG, JPEG or WebP logo. Your original business colors will be preserved."
      >
        <BusinessLogoPicker
          branding={
            businessLogo.activeBranding
          }
          logo={
            businessLogo.activeLogo
          }
          businessName={
            businessName
          }
          accentColor={
            accentColor
          }
          isLoading={
            businessLogo.isLoading
          }
          isUploading={
            businessLogo.isUploading
          }
          isSaving={
            businessLogo.isSaving
          }
          uploadProgress={
            businessLogo.uploadProgress
          }
          errorMessage={
            businessLogo.errorMessage
          }
          disabled={
            !canManage
          }
          onClearError={
            businessLogo.clearError
          }
          onUploadLogo={
            businessLogo.uploadLogo
          }
          onRestoreDefaultLogo={
            businessLogo.restoreDefaultLogo
          }
          showCurrentLogo
          showDropZone
          showRestoreDefaultButton
        />
      </AppSettingsPanel>
    </div>
  );
}

// MARK: - Premium Options

interface PremiumLogoOptionsProps {
  options:
    BusinessLogoOption[];

  selectedOptionID:
    string;

  isSaving:
    boolean;

  onSelect: (
    optionID: string,
  ) => void;

  onSave:
    () => Promise<{
      success: boolean;
      errorMessage?: string;
    }>;

  onClear:
    () => void;
}

function PremiumLogoOptions({
  options,
  selectedOptionID,
  isSaving,
  onSelect,
  onSave,
  onClear,
}: PremiumLogoOptionsProps) {
  return (
    <section className="app-settings-logo-options">
      <div className="app-settings-logo-options__header">
        <div>
          <span className="app-settings-eyebrow">
            Your concepts
          </span>

          <h3>
            Choose Your Preferred Logo
          </h3>

          <p>
            Only the selected logo will be
            saved to the business.
          </p>
        </div>

        <button
          type="button"
          className="app-settings-secondary-button"
          disabled={
            isSaving
          }
          onClick={
            onClear
          }
        >
          Discard Options
        </button>
      </div>

      <div className="app-settings-logo-options__grid">
        {options.map(
          (option) => {
            const isSelected =
              option.id ===
              selectedOptionID;

            return (
              <button
                key={
                  option.id
                }
                type="button"
                className={[
                  "app-settings-logo-option",
                  isSelected
                    ? "app-settings-logo-option--selected"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                disabled={
                  isSaving
                }
                aria-pressed={
                  isSelected
                }
                onClick={() => {
                  onSelect(
                    option.id,
                  );
                }}
              >
                <div className="app-settings-logo-option__image-frame">
                  <img
                    src={
                      createGeneratedLogoImageSource(
                        option,
                      )
                    }
                    alt={`${option.title} logo concept`}
                    className="app-settings-logo-option__image"
                  />

                  {option.isSofiaRecommended ? (
                    <span className="app-settings-recommended-badge">
                      Sofía Recommended
                    </span>
                  ) : null}

                  {isSelected ? (
                    <span className="app-settings-selected-logo-check">
                      ✓
                    </span>
                  ) : null}
                </div>

                <div className="app-settings-logo-option__copy">
                  <strong>
                    {option.title}
                  </strong>

                  <span>
                    {option.subtitle}
                  </span>

                  <small>
                    {Math.round(
                      option.confidence,
                    )}
                    % confidence
                  </small>
                </div>
              </button>
            );
          },
        )}
      </div>

      <div className="app-settings-logo-options__actions">
        <button
          type="button"
          className="app-settings-primary-button"
          disabled={
            !selectedOptionID ||
            isSaving
          }
          onClick={() => {
            void onSave();
          }}
        >
          {isSaving
            ? "Saving Logo..."
            : "Use Selected Logo"}
        </button>
      </div>
    </section>
  );
}

// MARK: - Generation Progress

interface SofiaGenerationProgressProps {
  message: string;
  completedOptions: number;
  totalOptions: number;
  onCancel: () => void;
}

function SofiaGenerationProgress({
  message,
  completedOptions,
  totalOptions,
  onCancel,
}: SofiaGenerationProgressProps) {
  const normalizedTotal =
    Math.max(
      1,
      totalOptions,
    );

  const progress =
    Math.min(
      100,
      Math.max(
        4,
        Math.round(
          (
            completedOptions /
            normalizedTotal
          ) *
            100,
        ),
      ),
    );

  return (
    <div
      className="app-settings-generation-progress"
      role="status"
      aria-live="polite"
    >
      <div className="app-settings-generation-progress__header">
        <div>
          <strong>
            Sofía is creating your brand
          </strong>

          <span>
            {message ||
              "Preparing your premium logo concepts..."}
          </span>
        </div>

        <button
          type="button"
          className="app-settings-secondary-button"
          onClick={
            onCancel
          }
        >
          Cancel
        </button>
      </div>

      <div className="app-settings-progress-track">
        <span
          style={{
            width:
              `${progress}%`,
          }}
        />
      </div>

      <small>
        {completedOptions} of{" "}
        {normalizedTotal} concepts completed
      </small>
    </div>
  );
}

// MARK: - Appearance Section

interface AppearanceSectionProps {
  disabled: boolean;

  scope?:
    AppSettingsScope;

  accentColorName:
    AppAccentColorName;

  backgroundID:
    JCSScreenBackgroundID;

  languageCode:
    AppLanguageCode;

  errors: {
    accentColorName: string;
    languageCode: string;
  };

  onAccentColorSelection: (
    name: AppAccentColorName,
  ) => void;

  onBackgroundSelection: (
    backgroundID: JCSScreenBackgroundID,
  ) => void;

  onLanguageChange: (
    event:
      ChangeEvent<HTMLSelectElement>,
  ) => void;

  branding?:
    ReturnType<
      typeof useBusinessLogo
    >["activeBranding"];

  logo?:
    ReturnType<
      typeof useBusinessLogo
    >["activeLogo"];

  previewLogoURL?:
    string;

  businessName: string;
  accentColor: string;
}

function AppearanceSection({
  disabled,

  scope = "business",

  accentColorName,
  backgroundID,
  languageCode,

  errors,

  onAccentColorSelection,
  onBackgroundSelection,
  onLanguageChange,

  branding,
  logo,

  previewLogoURL = "",

  businessName,
  accentColor,
}: AppearanceSectionProps) {
  const isPlatformScope =
    scope === "platform";

  const normalizedPreviewLogoURL =
    previewLogoURL.trim();
  return (
    <div className="app-settings-section-stack">
      <AppSettingsPanel
        eyebrow="Dashboard theme"
        title="Accent Color"
        description={
          isPlatformScope
            ? "Choose the primary color used throughout the JCS Business Suite platform Dashboard, controls and highlighted information."
            : "Choose the primary color used throughout your business Dashboard, controls and highlighted information."
        }
      >
        <div
          className="app-settings-accent-grid"
          role="radiogroup"
          aria-label="Dashboard Accent Color"
        >
          {APP_ACCENT_COLOR_DISPLAY_OPTIONS
            .filter(
              (option) =>
                APP_ACCENT_COLOR_VALUES.includes(
                  option.name,
                ),
            )
            .map(
              (option) => {
                const isSelected =
                  accentColorName ===
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
                      disabled
                    }
                    onClick={() => {
                      onAccentColorSelection(
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

        {errors.accentColorName ? (
          <FieldError
            message={
              errors.accentColorName
            }
          />
        ) : null}

        <div className="app-settings-theme-preview">
          {normalizedPreviewLogoURL ? (
            <div
              style={{
                width: 164,
                height: 92,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderRadius: 18,
                border:
                  "1px solid rgba(148, 163, 184, 0.24)",
                background:
                  "rgba(255, 255, 255, 0.72)",
                boxShadow:
                  "0 18px 42px rgba(15, 23, 42, 0.12)",
              }}
            >
              <img
                src={
                  normalizedPreviewLogoURL
                }
                alt={`${businessName} logo`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  padding: 10,
                }}
              />
            </div>
          ) : (
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
              size="standard"
              showBackground
              showBorder
              enableShadow
            />
          )}

          <div className="app-settings-theme-preview__content">
            <span className="app-settings-eyebrow">
              Live preview
            </span>

            <h3>
              {businessName}
            </h3>

            <p>
              This preview updates immediately
              while you choose a new Accent
              Color.
            </p>

            <button
              type="button"
              disabled
              className="app-settings-primary-button"
            >
              Dashboard Action
            </button>
          </div>
        </div>
      </AppSettingsPanel>

      <AppSettingsPanel
        eyebrow="Premium appearance"
        title="Premium Backgrounds"
        description={
          isPlatformScope
            ? "Choose a sophisticated background for the global JCS Business Suite workspace."
            : "Choose a sophisticated background for your business workspace. Your selection is saved specifically to this business."
        }
      >
        <div
          className="app-settings-background-grid"
          role="radiogroup"
          aria-label={
            isPlatformScope
              ? "Platform Dashboard Background"
              : "Business Dashboard Background"
          }
        >
          {JCS_SCREEN_BACKGROUND_OPTIONS.map(
            (option) => {
              const isSelected =
                backgroundID === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={disabled}
                  className={[
                    "app-settings-background-option",
                    isSelected
                      ? "app-settings-background-option--selected"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    onBackgroundSelection(
                      option.id,
                    );
                  }}
                >
                  <span
                    className="app-settings-background-option__preview"
                    style={{
                      background:
                        option.background,
                    }}
                    aria-hidden="true"
                  >
                    {isSelected ? (
                      <span className="app-settings-background-option__check">
                        ✓
                      </span>
                    ) : null}
                  </span>

                  <span className="app-settings-background-option__copy">
                    <strong>
                      {option.title}
                    </strong>

                    <small>
                      {option.subtitle}
                    </small>
                  </span>
                </button>
              );
            },
          )}
        </div>

        <div className="app-settings-background-note">
          <strong>
            {isPlatformScope
              ? "Platform-wide appearance"
              : "Business-specific appearance"}
          </strong>

          <span>
            {isPlatformScope
              ? "This background is saved globally for the Platform Administrator experience."
              : "This background will follow this Business ID and can be changed at any time from App Settings."}
          </span>
        </div>
      </AppSettingsPanel>

      <AppSettingsPanel
        eyebrow="Localization"
        title="Application Language"
        description={
          isPlatformScope
            ? "Select the preferred language for the global platform experience."
            : "Select the preferred language for this business experience."
        }
      >
        <div className="app-settings-select-field">
          <label htmlFor="app-language">
            Language
          </label>

          <select
            id="app-language"
            value={
              languageCode
            }
            disabled={
              disabled
            }
            onChange={
              onLanguageChange
            }
            aria-invalid={
              Boolean(
                errors.languageCode,
              )
            }
          >
            {APP_LANGUAGE_OPTIONS.map(
              (option) => (
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

          {errors.languageCode ? (
            <FieldError
              message={
                errors.languageCode
              }
            />
          ) : null}
        </div>
      </AppSettingsPanel>
    </div>
  );
}

// MARK: - Financial Section

interface FinancialSectionProps {
  disabled: boolean;
  taxPercentText: string;
  errorMessage: string;

  onChange: (
    value: string,
  ) => void;
}

function FinancialSection({
  disabled,
  taxPercentText,
  errorMessage,
  onChange,
}: FinancialSectionProps) {
  return (
    <AppSettingsPanel
      eyebrow="Sales configuration"
      title="Tax Percentage"
      description="This rate is used by applicable POS, order, invoice and reporting calculations."
    >
      <div className="app-settings-tax-layout">
        <div className="app-settings-tax-input-wrapper">
          <label htmlFor="tax-percent">
            Default Tax Rate
          </label>

          <div className="app-settings-tax-input">
            <input
              id="tax-percent"
              type="text"
              inputMode="decimal"
              value={
                taxPercentText
              }
              disabled={
                disabled
              }
              placeholder="0"
              aria-invalid={
                Boolean(
                  errorMessage,
                )
              }
              onChange={(
                event,
              ) => {
                onChange(
                  event.target.value,
                );
              }}
            />

            <span aria-hidden="true">
              %
            </span>
          </div>

          {errorMessage ? (
            <FieldError
              message={
                errorMessage
              }
            />
          ) : (
            <small>
              Enter a value between 0 and 100.
              Decimal rates such as 7.25 are
              supported.
            </small>
          )}
        </div>

        <div className="app-settings-tax-example">
          <span>
            Example
          </span>

          <strong>
            $100.00
          </strong>

          <div>
            <span>
              Tax
            </span>

            <b>
              $
              {calculateTaxExample(
                taxPercentText,
              )}
            </b>
          </div>
        </div>
      </div>
    </AppSettingsPanel>
  );
}

// MARK: - Shared Panel

interface AppSettingsPanelProps {
  eyebrow: string;
  title: string;
  description: string;

  headerAccessory?:
    React.ReactNode;

  children:
    React.ReactNode;
}

function AppSettingsPanel({
  eyebrow,
  title,
  description,
  headerAccessory,
  children,
}: AppSettingsPanelProps) {
  return (
    <section className="app-settings-panel">
      <header className="app-settings-panel__header">
        <div>
          <span className="app-settings-eyebrow">
            {eyebrow}
          </span>

          <h2>
            {title}
          </h2>

          <p>
            {description}
          </p>
        </div>

        {headerAccessory ? (
          <div className="app-settings-panel__accessory">
            {headerAccessory}
          </div>
        ) : null}
      </header>

      <div className="app-settings-panel__body">
        {children}
      </div>
    </section>
  );
}

// MARK: - Text Field

interface AppSettingsTextFieldProps {
  id: string;
  label: string;

  value: string;

  type?: "text" | "email" | "tel";

  placeholder?: string;
  autoComplete?: string;

  required?: boolean;
  disabled?: boolean;

  errorMessage?: string;

  onChange: (
    value: string,
  ) => void;
}

function AppSettingsTextField({
  id,
  label,

  value,

  type = "text",

  placeholder = "",
  autoComplete,

  required = false,
  disabled = false,

  errorMessage = "",

  onChange,
}: AppSettingsTextFieldProps) {
  return (
    <div className="app-settings-field">
      <label htmlFor={id}>
        {label}

        {required ? (
          <span aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={
          Boolean(
            errorMessage,
          )
        }
        aria-describedby={
          errorMessage
            ? `${id}-error`
            : undefined
        }
        onChange={(
          event,
        ) => {
          onChange(
            event.target.value,
          );
        }}
      />

      {errorMessage ? (
        <FieldError
          id={`${id}-error`}
          message={
            errorMessage
          }
        />
      ) : null}
    </div>
  );
}

// MARK: - Messages

interface AppSettingsStatusMessagesProps {
  errorMessage: string;
  successMessage: string;

  onDismissError: () => void;
  onDismissSuccess: () => void;
}

function AppSettingsStatusMessages({
  errorMessage,
  successMessage,

  onDismissError,
  onDismissSuccess,
}: AppSettingsStatusMessagesProps) {
  if (
    !errorMessage &&
    !successMessage
  ) {
    return null;
  }

  return (
    <div className="app-settings-status-stack">
      {errorMessage ? (
        <div
          className="app-settings-status-message app-settings-status-message--error"
          role="alert"
        >
          <span>
            {errorMessage}
          </span>

          <button
            type="button"
            aria-label="Dismiss error"
            onClick={
              onDismissError
            }
          >
            ×
          </button>
        </div>
      ) : null}

      {successMessage ? (
        <div
          className="app-settings-status-message app-settings-status-message--success"
          role="status"
        >
          <span>
            {successMessage}
          </span>

          <button
            type="button"
            aria-label="Dismiss success message"
            onClick={
              onDismissSuccess
            }
          >
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
}

// MARK: - Loading

function AppSettingsLoadingState() {
  return (
    <div
      className="app-settings-loading"
      role="status"
      aria-label="Loading App Settings"
    >
      <span />
      <span />
      <span />

      <p>
        Loading App Settings...
      </p>
    </div>
  );
}

// MARK: - Access Denied

function AppSettingsAccessDenied({
  onClose,
}: {
  onClose?: () => void;
}) {
  return (
    <main className="app-settings-access-denied">
      <div>
        <span aria-hidden="true">
          🔒
        </span>

        <h1>
          App Settings Access
        </h1>

        <p>
          You do not have permission to view
          App Settings for this business.
        </p>

        {onClose ? (
          <button
            type="button"
            className="app-settings-primary-button"
            onClick={
              onClose
            }
          >
            Close
          </button>
        ) : null}
      </div>
    </main>
  );
}

// MARK: - Field Error

function FieldError({
  id,
  message,
}: {
  id?: string;
  message: string;
}) {
  return (
    <small
      id={id}
      className="app-settings-field-error"
      role="alert"
    >
      {message}
    </small>
  );
}

// MARK: - Helpers

function getAccentColorCSSValue(
  accentColorName:
    AppAccentColorName,
): string {
  return (
    APP_ACCENT_COLOR_DISPLAY_OPTIONS.find(
      (option) =>
        option.name ===
        accentColorName,
    )?.preview ??
    "#2563eb"
  );
}

function createGeneratedLogoImageSource(
  option: BusinessLogoOption,
): string {
  const imageData =
    option.imageBase64.trim();

  if (
    imageData.startsWith(
      "data:",
    ) ||
    imageData.startsWith(
      "blob:",
    ) ||
    imageData.startsWith(
      "https://",
    ) ||
    imageData.startsWith(
      "http://",
    )
  ) {
    return imageData;
  }

  const mimeType =
    option.mimeType.trim() ||
    "image/png";

  return `data:${mimeType};base64,${imageData}`;
}

function calculateTaxExample(
  taxPercentText: string,
): string {
  const numericValue =
    Number(
      taxPercentText,
    );

  if (
    !Number.isFinite(
      numericValue,
    ) ||
    numericValue < 0
  ) {
    return "0.00";
  }

  return (
    Math.min(
      numericValue,
      100,
    )
  ).toFixed(2);
}