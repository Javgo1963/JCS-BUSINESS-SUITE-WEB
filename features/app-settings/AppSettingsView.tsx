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
  doc,
  getDoc,
} from "firebase/firestore";

import {
  httpsCallable,
} from "firebase/functions";

import {
  db,
  firebaseFunctions,
} from "@/core/firebase/firebase";

import {
  APP_ACCENT_COLOR_VALUES,
  APP_LANGUAGE_OPTIONS,
} from "./AppSettingsTypes";

import {
  useAppSettings,
} from "./useAppSettings";

import {
  useBusinessLogo,
} from "../business-branding/useBusinessLogo";

import BusinessLogoPicker from "../business-branding/BusinessLogoPicker";
import CompanyLogoView from "../business-branding/CompanyLogoView";


import {
  useOfficialJCSLogos,
} from "../official-jcs-branding/useOfficialJCSLogos";

import {
  applyOfficialJCSLogoToBusiness,
} from "../official-jcs-branding/OfficialJCSLogoFirestoreService";

import {
  JCS_SCREEN_BACKGROUND_OPTIONS,
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

export interface AppSettingsViewProps {
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

// MARK: - Component

export default function AppSettingsView({
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

  // =====================================================
  // MARK: - Premium Billing State
  // H2-C6D-J-F-LOGO-R37B-R12-R4
  // =====================================================

  const [
    isStartingPremiumBilling,
    setIsStartingPremiumBilling,
  ] = useState(false);

  const [
    premiumBillingMessage,
    setPremiumBillingMessage,
  ] = useState("");

  const [
    premiumBillingError,
    setPremiumBillingError,
  ] = useState("");

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


  // =====================================================
  // MARK: - Shared Premium Billing
  // H2-C6D-J-F-LOGO-R37B-R12-R4
  // =====================================================

  const handleUpgradeToPremium =
    useCallback(async (): Promise<void> => {
      const cleanBillingText =
        (value: unknown): string =>
          typeof value === "string"
            ? value.trim()
            : "";

      const normalizedBusinessID =
        cleanBillingText(
          businessID
        );

      if (!normalizedBusinessID) {
        setPremiumBillingMessage("");
        setPremiumBillingError(
          "Premium billing cannot begin because the Business ID is missing."
        );
        return;
      }

      if (!appSettings.canManageSettings) {
        setPremiumBillingMessage("");
        setPremiumBillingError(
          "You do not have permission to manage this business subscription."
        );
        return;
      }

      setIsStartingPremiumBilling(true);
      setPremiumBillingMessage(
        "JCS is preparing secure Premium billing..."
      );
      setPremiumBillingError("");

      try {
        /*
         * PlatformClient is read only to select the correct
         * shared server billing path.
         *
         * Browser state is never Premium entitlement authority.
         */
        const platformClientReference =
          doc(
            db,
            "platformClients",
            normalizedBusinessID
          );

        const platformClientSnapshot =
          await getDoc(
            platformClientReference
          );

        if (!platformClientSnapshot.exists()) {
          throw new Error(
            "The canonical JCS subscription record could not be found."
          );
        }

        const platformClientData =
          platformClientSnapshot.data();

        const existingSubscriptionID =
          cleanBillingText(
            platformClientData
              .stripeSubscriptionID
          );

        // ==================================================
        // Existing Stripe subscription
        // SAME subscription → Starter/Base to Premium
        // ==================================================

        if (existingSubscriptionID) {
          setPremiumBillingMessage(
            "JCS is securely upgrading your existing subscription to Premium..."
          );

          const upgradeCallable =
            httpsCallable<
              {
                businessID: string;
              },
              {
                success?: boolean;
                businessID?: string;
                stripeSubscriptionID?: string;
                stripeStatus?: string;
                premiumEntitlementVerified?: boolean;
              }
            >(
              firebaseFunctions,
              "upgradeBaseSubscriptionToPremium"
            );

          const response =
            await upgradeCallable({
              businessID:
                normalizedBusinessID,
            });

          const returnedBusinessID =
            cleanBillingText(
              response.data
                ?.businessID
            );

          if (
            returnedBusinessID !==
            normalizedBusinessID
          ) {
            throw new Error(
              "Premium upgrade returned a Business ID mismatch."
            );
          }

          const returnedSubscriptionID =
            cleanBillingText(
              response.data
                ?.stripeSubscriptionID
            );

          if (
            returnedSubscriptionID !==
            existingSubscriptionID
          ) {
            throw new Error(
              "Premium upgrade returned a Stripe subscription mismatch."
            );
          }

          /*
           * Callable success is deliberately NOT entitlement proof.
           *
           * stripePremiumWebhook remains the authority that may set:
           *
           * planName = Premium
           * subscriptionStatus = Active
           * canUseAutomaticLogo = true
           */
          if (
            response.data
              ?.premiumEntitlementVerified !==
            false
          ) {
            throw new Error(
              "Premium upgrade returned an unexpected entitlement state."
            );
          }

          setPremiumBillingMessage(
            "Premium upgrade submitted. JCS is waiting for verified payment activation."
          );

          return;
        }

        // ==================================================
        // No Stripe subscription
        // JCS Embedded Premium Checkout
        // ==================================================

        setPremiumBillingMessage(
          "JCS is opening secure Premium billing..."
        );

        /*
         * Checkout creation now belongs to the dedicated
         * JCS Embedded Billing workspace.
         *
         * Browser navigation is context only.
         * Stripe webhook + canonical PlatformClient remain
         * Premium entitlement authority.
         */
        const billingURL =
          new URL(
            "/billing/checkout",
            window.location.origin
          );

        billingURL.searchParams.set(
          "businessID",
          normalizedBusinessID
        );

        billingURL.searchParams.set(
          "plan",
          "premium"
        );

        if (
          billingURL.origin !==
          window.location.origin
        ) {
          throw new Error(
            "Premium billing navigation must remain inside JCS Business Suite."
          );
        }

        setPremiumBillingMessage(
          "Secure JCS Premium billing is opening. Premium remains locked until Stripe confirms the subscription."
        );

        window.location.assign(
          billingURL.toString()
        );
      } catch (error: unknown) {
        console.error(
          "❌ JCS Web Premium billing failed:",
          error
        );

        setPremiumBillingMessage("");

        setPremiumBillingError(
          error instanceof Error &&
          error.message.trim()
            ? error.message
            : "JCS could not start Premium billing."
        );
      } finally {
        setIsStartingPremiumBilling(
          false
        );
      }
    }, [
      appSettings.canManageSettings,
      businessID,
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
                  onUpgradeToPremium={
                    handleUpgradeToPremium
                  }
                  isStartingPremiumBilling={
                    isStartingPremiumBilling
                  }
                  premiumBillingMessage={
                    premiumBillingMessage
                  }
                  premiumBillingError={
                    premiumBillingError
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

// MARK: - Navigation

interface AppSettingsNavigationProps {
  selectedSection:
    AppSettingsSection;

  onSelectSection: (
    section: AppSettingsSection,
  ) => void;
}

function AppSettingsNavigation({
  selectedSection,
  onSelectSection,
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
    {
      id: "financial",
      icon: "%",
      title: "Financial",
      subtitle: "Tax configuration",
    },
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

  onUpgradeToPremium:
    () => Promise<void>;

  isStartingPremiumBilling:
    boolean;

  premiumBillingMessage:
    string;

  premiumBillingError:
    string;
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

  onUpgradeToPremium,

  isStartingPremiumBilling,

  premiumBillingMessage,

  premiumBillingError,
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

      setIsApplyingOfficialLogo(true);
      setOfficialLogoMessage("");
      setOfficialLogoError("");

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

        await businessLogo
          .reloadActiveLogo();

        setOfficialLogoMessage(
          "Official JCS logo applied successfully.",
        );
      } catch (error: unknown) {
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
        setIsApplyingOfficialLogo(false);
      }
    };

  return (
    <div className="app-settings-section-stack">
      <AppSettingsPanel
        eyebrow="JCS Business Suite"
        title="Official JCS Logo Collection"
        description="Choose from the eight official JCS Business Suite logos. These logos are included and managed by JCS."
      >
        <div className="app-settings-official-logo-library">
          <div className="app-settings-official-logo-library__header">
            <div>
              <h3>
                8 Official Logos
              </h3>

              <p>
                Select the logo that best matches your
                business branding.
              </p>
            </div>

            <div className="app-settings-official-logo-library__header-actions">
              <span className="app-settings-official-logo-library__badge">
                Included
              </span>

              <button
                type="button"
                className="app-settings-primary-button app-settings-official-logo-library__apply-button"
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
            <div className="app-settings-official-logo-library__error">
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
                disabled={
                  !canManage ||
                  isStartingPremiumBilling
                }
                onClick={() => {
                  void onUpgradeToPremium();
                }}
              >
                {isStartingPremiumBilling
                  ? "Preparing Premium..."
                  : "Upgrade to Premium"}
              </button>

              {premiumBillingMessage ? (
                <div className="app-settings-official-logo-library__success">
                  {premiumBillingMessage}
                </div>
              ) : null}

              {premiumBillingError ? (
                <div className="app-settings-official-logo-library__error">
                  {premiumBillingError}
                </div>
              ) : null}
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

  accentColorName:
    AppAccentColorName;

  backgroundID:
    import("../../components/layout/JCSScreenBackground")
      .JCSScreenBackgroundID;

  languageCode:
    AppLanguageCode;

  errors:
    AppSettingsFormErrors;

  onAccentColorSelection: (
    name: AppAccentColorName,
  ) => void;

  onBackgroundSelection: (
    backgroundID:
      import("../../components/layout/JCSScreenBackground")
        .JCSScreenBackgroundID,
  ) => void;

  onLanguageChange: (
    event:
      ChangeEvent<HTMLSelectElement>,
  ) => void;

  branding:
    ReturnType<
      typeof useBusinessLogo
    >["activeBranding"];

  logo:
    ReturnType<
      typeof useBusinessLogo
    >["activeLogo"];

  businessName: string;
  accentColor: string;
}

function AppearanceSection({
  disabled,

  accentColorName,
  backgroundID,
  languageCode,

  errors,

  onAccentColorSelection,
  onBackgroundSelection,
  onLanguageChange,

  branding,
  logo,

  businessName,
  accentColor,
}: AppearanceSectionProps) {
  return (
    <div className="app-settings-section-stack">
      <AppSettingsPanel
        eyebrow="Dashboard theme"
        title="Accent Color"
        description="Choose the primary color used throughout your business Dashboard, controls and highlighted information."
      >
        <div
          className="app-settings-accent-grid"
          role="radiogroup"
          aria-label="Dashboard Accent Color"
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
        eyebrow="Dashboard background"
        title="Official Background Collection"
        description="Choose from the 32 official JCS backgrounds available for your business workspace."
      >
        <div className="app-settings-background-library">
          <div className="app-settings-background-library__header">
            <div>
              <h3>
                32 Official Backgrounds
              </h3>

              <p>
                Select a background and save App Settings to make it the preferred background for this business.
              </p>
            </div>

            <span className="app-settings-background-library__badge">
              Business
            </span>
          </div>

          <div
            className="app-settings-background-grid"
            role="radiogroup"
            aria-label="Business Official Background Collection"
          >
            {JCS_SCREEN_BACKGROUND_OPTIONS.map(
              (
                option,
              ) => {
                const isSelected =
                  backgroundID ===
                  option.id;

                return (
                  <button
                    key={
                      option.id
                    }
                    type="button"
                    role="radio"
                    aria-checked={
                      isSelected
                    }
                    className={[
                      "app-settings-background-option",
                      isSelected
                        ? "app-settings-background-option--selected"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    disabled={
                      disabled
                    }
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
                    >
                      <span
                        className="app-settings-background-option__preview-accent"
                        style={{
                          background:
                            option.previewAccentHex,
                        }}
                        aria-hidden="true"
                      />

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

                      <span>
                        {option.subtitle}
                      </span>
                    </span>
                  </button>
                );
              },
            )}
          </div>
        </div>
      </AppSettingsPanel>

      <AppSettingsPanel
        eyebrow="Localization"
        title="Application Language"
        description="Select the preferred language for this business experience."
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
    ACCENT_COLOR_DISPLAY_OPTIONS.find(
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
