"use client";

/*
 * JCS Business Suite Web
 * CompanyLogoView.tsx
 *
 * Reusable visual renderer for the active business logo.
 *
 * Responsibilities:
 *
 * - Display Sofia-generated premium logos.
 * - Display Business Owner uploaded logos.
 * - Display the default JCS template logo.
 * - Preserve original logo colors.
 * - Apply Accent Color only to compatible template logos.
 * - Handle loading and broken-image fallbacks.
 * - Support compact, standard, large and custom dimensions.
 *
 * Firebase reads, uploads and Firestore writes must not live here.
 */

import {
  CSSProperties,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DEFAULT_BUSINESS_LOGO_ASSET_PATH,
  DEFAULT_BUSINESS_LOGO_SUPPORTS_ACCENT_COLOR,
  DEFAULT_BUSINESS_LOGO_USES_ACCENT_COLOR,
} from "./BusinessLogoConstants";

import type {
  BusinessBrandingSettings,
  BusinessLogoRecord,
} from "./BusinessLogoTypes";

// MARK: - Sizes

export const COMPANY_LOGO_SIZE_VALUES = [
  "compact",
  "standard",
  "large",
  "custom",
] as const;

export type CompanyLogoSize =
  (typeof COMPANY_LOGO_SIZE_VALUES)[number];

// MARK: - Fit

export const COMPANY_LOGO_FIT_VALUES = [
  "contain",
  "cover",
] as const;

export type CompanyLogoFit =
  (typeof COMPANY_LOGO_FIT_VALUES)[number];

// MARK: - Props

export interface CompanyLogoViewProps {
  branding?: BusinessBrandingSettings | null;
  logo?: BusinessLogoRecord | null;

  businessName?: string;
  accentColor?: string;

  size?: CompanyLogoSize;

  width?: number | string;
  height?: number | string;

  cornerRadius?: number;
  fit?: CompanyLogoFit;

  showBusinessName?: boolean;
  businessNamePlacement?: "right" | "bottom";

  showBackground?: boolean;
  showBorder?: boolean;
  enableShadow?: boolean;

  isLoading?: boolean;

  priority?: boolean;

  className?: string;
  imageClassName?: string;

  /**
   * Optional fallback rendered when the image cannot load.
   * When omitted, a professional initials fallback is shown.
   */
  fallback?: ReactNode;

  /**
   * Optional click behavior for App Settings or branding controls.
   */
  onClick?: () => void;

  /**
   * Called when the active image cannot be loaded.
   */
  onImageError?: (
    imageURL: string,
  ) => void;
}

// MARK: - Derived Display Model

interface CompanyLogoDisplayModel {
  imageURL: string;

  businessName: string;
  initials: string;

  isDefaultLogo: boolean;
  isTemplateLogo: boolean;
  useAccentColor: boolean;

  accessibleLabel: string;
}

// MARK: - Component

export default function CompanyLogoView({
  branding = null,
  logo = null,

  businessName = "",
  accentColor = "#2563eb",

  size = "standard",

  width,
  height,

  cornerRadius,
  fit = "contain",

  showBusinessName = false,
  businessNamePlacement = "right",

  showBackground = false,
  showBorder = false,
  enableShadow = true,

  isLoading = false,

  priority = false,

  className = "",
  imageClassName = "",

  fallback,

  onClick,
  onImageError,
}: CompanyLogoViewProps) {
  const [
    hasImageError,
    setHasImageError,
  ] = useState(false);

  const displayModel =
    useMemo(
      () =>
        createCompanyLogoDisplayModel({
          branding,
          logo,
          businessName,
        }),
      [
        branding,
        logo,
        businessName,
      ],
    );

  const dimensions =
    useMemo(
      () =>
        resolveCompanyLogoDimensions({
          size,
          width,
          height,
        }),
      [
        size,
        width,
        height,
      ],
    );

  const resolvedCornerRadius =
    normalizeCornerRadius(
      cornerRadius ??
      getDefaultCornerRadius(size),
    );

  /*
   * A new URL should receive a fresh loading attempt.
   */
  useEffect(() => {
    setHasImageError(false);
  }, [displayModel.imageURL]);

  const shouldShowImage =
    Boolean(displayModel.imageURL) &&
    !hasImageError;

  const shouldRenderAsTemplate =
    shouldShowImage &&
    displayModel.isTemplateLogo &&
    displayModel.useAccentColor;

  const outerStyle: CSSProperties = {
    display:
      showBusinessName &&
      businessNamePlacement === "right"
        ? "inline-flex"
        : "inline-flex",

    flexDirection:
      showBusinessName &&
      businessNamePlacement === "bottom"
        ? "column"
        : "row",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      showBusinessName
        ? businessNamePlacement === "bottom"
          ? 10
          : 14
        : 0,

    maxWidth:
      "100%",

    cursor:
      onClick
        ? "pointer"
        : "default",

    userSelect:
      "none",
  };

  const logoFrameStyle: CSSProperties = {
    width:
      dimensions.width,

    height:
      dimensions.height,

    minWidth:
      dimensions.width,

    position:
      "relative",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    overflow:
      "hidden",

    borderRadius:
      resolvedCornerRadius,

    background:
      showBackground
        ? createLogoFrameBackground(
            accentColor,
          )
        : "transparent",

    border:
      showBorder
        ? "1px solid rgba(148, 163, 184, 0.24)"
        : "1px solid transparent",

    boxShadow:
      enableShadow
        ? createLogoShadow(
            accentColor,
          )
        : "none",

    isolation:
      "isolate",
  };

  const imageStyle: CSSProperties = {
    display:
      "block",

    width:
      "100%",

    height:
      "100%",

    objectFit:
      fit,

    objectPosition:
      "center",

    padding:
      showBackground
        ? getLogoInternalPadding(size)
        : 0,

    boxSizing:
      "border-box",
  };

  const templateMaskStyle: CSSProperties = {
    width:
      "100%",

    height:
      "100%",

    padding:
      showBackground
        ? getLogoInternalPadding(size)
        : 0,

    boxSizing:
      "border-box",

    background:
      normalizeAccentColor(
        accentColor,
      ),

    WebkitMaskImage:
      `url("${escapeCSSURL(
        displayModel.imageURL,
      )}")`,

    maskImage:
      `url("${escapeCSSURL(
        displayModel.imageURL,
      )}")`,

    WebkitMaskRepeat:
      "no-repeat",

    maskRepeat:
      "no-repeat",

    WebkitMaskPosition:
      "center",

    maskPosition:
      "center",

    WebkitMaskSize:
      fit,

    maskSize:
      fit,
  };

  const businessNameStyle: CSSProperties = {
    maxWidth:
      businessNamePlacement === "right"
        ? 280
        : dimensions.width,

    color:
      "var(--jcs-text-primary, currentColor)",

    fontSize:
      size === "compact"
        ? 14
        : size === "large"
          ? 20
          : 16,

    fontWeight:
      700,

    lineHeight:
      1.2,

    letterSpacing:
      "-0.01em",

    textAlign:
      businessNamePlacement === "bottom"
        ? "center"
        : "left",

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",

    display:
      "-webkit-box",

    WebkitBoxOrient:
      "vertical",

    WebkitLineClamp:
      2,
  };

  const content = (
    <div
      className={[
        "jcs-company-logo",
        `jcs-company-logo--${size}`,
        onClick
          ? "jcs-company-logo--interactive"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={outerStyle}
      aria-label={
        displayModel.accessibleLabel
      }
      title={
        displayModel.businessName
      }
    >
      <div
        className="jcs-company-logo__frame"
        style={logoFrameStyle}
      >
        {isLoading ? (
          <CompanyLogoLoadingState
            accentColor={
              accentColor
            }
          />
        ) : shouldRenderAsTemplate ? (
          <span
            className={[
              "jcs-company-logo__template",
              imageClassName,
            ]
              .filter(Boolean)
              .join(" ")}
            style={
              templateMaskStyle
            }
            role="img"
            aria-label={
              displayModel.accessibleLabel
            }
          />
        ) : shouldShowImage ? (
          <img
            className={[
              "jcs-company-logo__image",
              imageClassName,
            ]
              .filter(Boolean)
              .join(" ")}
            src={
              displayModel.imageURL
            }
            alt={
              displayModel.accessibleLabel
            }
            style={
              imageStyle
            }
            loading={
              priority
                ? "eager"
                : "lazy"
            }
            fetchPriority={
              priority
                ? "high"
                : "auto"
            }
            decoding="async"
            draggable={false}
            onError={() => {
              setHasImageError(true);

              onImageError?.(
                displayModel.imageURL,
              );
            }}
          />
        ) : fallback ? (
          fallback
        ) : (
          <CompanyLogoInitialsFallback
            initials={
              displayModel.initials
            }
            accentColor={
              accentColor
            }
            size={
              size
            }
          />
        )}
      </div>

      {showBusinessName ? (
        <span
          className="jcs-company-logo__business-name"
          style={
            businessNameStyle
          }
        >
          {
            displayModel.businessName
          }
        </span>
      ) : null}
    </div>
  );

  if (!onClick) {
    return content;
  }

  return (
    <button
      type="button"
      className="jcs-company-logo-button"
      onClick={
        onClick
      }
      aria-label={`Open branding settings for ${displayModel.businessName}`}
      style={{
        display:
          "inline-flex",

        maxWidth:
          "100%",

        padding:
          0,

        margin:
          0,

        border:
          0,

        background:
          "transparent",

        color:
          "inherit",

        font:
          "inherit",

        textAlign:
          "inherit",
      }}
    >
      {content}
    </button>
  );
}

// MARK: - Loading State

interface CompanyLogoLoadingStateProps {
  accentColor: string;
}

function CompanyLogoLoadingState({
  accentColor,
}: CompanyLogoLoadingStateProps) {
  return (
    <div
      className="jcs-company-logo__loading"
      aria-label="Loading business logo"
      role="status"
      style={{
        width:
          "72%",

        height:
          "72%",

        borderRadius:
          20,

        background:
          createLoadingBackground(
            accentColor,
          ),

        animation:
          "jcs-company-logo-pulse 1.4s ease-in-out infinite",
      }}
    />
  );
}

// MARK: - Initials Fallback

interface CompanyLogoInitialsFallbackProps {
  initials: string;
  accentColor: string;
  size: CompanyLogoSize;
}

function CompanyLogoInitialsFallback({
  initials,
  accentColor,
  size,
}: CompanyLogoInitialsFallbackProps) {
  const fontSize =
    size === "compact"
      ? 22
      : size === "large"
        ? 56
        : size === "custom"
          ? 38
          : 36;

  return (
    <div
      className="jcs-company-logo__initials"
      aria-hidden="true"
      style={{
        position:
          "absolute",

        inset:
          0,

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        overflow:
          "hidden",

        background:
          createInitialsBackground(
            accentColor,
          ),

        color:
          "#ffffff",

        fontSize,

        fontWeight:
          800,

        lineHeight:
          1,

        letterSpacing:
          "-0.04em",

        textShadow:
          "0 2px 8px rgba(15, 23, 42, 0.22)",
      }}
    >
      <span
        style={{
          position:
            "relative",

          zIndex:
            2,

          maxWidth:
            "80%",

          overflow:
            "hidden",

          textOverflow:
            "ellipsis",

          whiteSpace:
            "nowrap",
        }}
      >
        {initials}
      </span>

      <span
        style={{
          position:
            "absolute",

          width:
            "82%",

          height:
            "82%",

          border:
            "1px solid rgba(255, 255, 255, 0.22)",

          borderRadius:
            "50%",

          transform:
            "rotate(-18deg)",

          pointerEvents:
            "none",
        }}
      />

      <span
        style={{
          position:
            "absolute",

          width:
            "112%",

          height:
            "52%",

          border:
            "1px solid rgba(255, 255, 255, 0.16)",

          borderRadius:
            "50%",

          transform:
            "rotate(24deg)",

          pointerEvents:
            "none",
        }}
      />
    </div>
  );
}

// MARK: - Display Model

function createCompanyLogoDisplayModel(
  input: {
    branding:
      | BusinessBrandingSettings
      | null;

    logo:
      | BusinessLogoRecord
      | null;

    businessName: string;
  },
): CompanyLogoDisplayModel {
  const brandingBusinessName =
    input.branding
      ?.companyName
      .trim() ?? "";

  const logoBusinessName =
    input.logo
      ?.businessName
      .trim() ?? "";

  const businessName =
    normalizeCompanyName(
      input.businessName ||
      brandingBusinessName ||
      logoBusinessName,
    );

  const activeLogoSource =
    input.branding
      ?.activeLogoSource ??
    input.logo
      ?.source ??
    "default";

  const isDefaultLogo =
    activeLogoSource ===
    "default";

  const imageURL =
    input.branding
      ?.logoDownloadURL
      .trim() ||
    input.logo
      ?.downloadURL
      .trim() ||
    DEFAULT_BUSINESS_LOGO_ASSET_PATH;

  const supportsAccentColor =
    isDefaultLogo
      ? DEFAULT_BUSINESS_LOGO_SUPPORTS_ACCENT_COLOR
      : (
          input.branding
            ?.logoSupportsAccentColor ??
          input.logo
            ?.supportsAccentColor ??
          false
        );

  const renderingMode =
    isDefaultLogo
      ? "template"
      : (
          input.branding
            ?.logoRenderingMode ??
          input.logo
            ?.renderingMode ??
          "original"
        );

  const useAccentColor =
    supportsAccentColor &&
    renderingMode ===
      "template" &&
    (
      isDefaultLogo
        ? (
            input.branding
              ?.useAccentColorForLogo ??
            DEFAULT_BUSINESS_LOGO_USES_ACCENT_COLOR
          )
        : (
            input.branding
              ?.useAccentColorForLogo ??
            input.logo
              ?.useAccentColor ??
            false
          )
    );

  return {
    imageURL,

    businessName,

    initials:
      createCompanyInitials(
        businessName,
      ),

    isDefaultLogo,

    isTemplateLogo:
      supportsAccentColor &&
      renderingMode ===
        "template",

    useAccentColor,

    accessibleLabel:
      `${businessName} business logo`,
  };
}

// MARK: - Dimensions

interface ResolveCompanyLogoDimensionsInput {
  size: CompanyLogoSize;
  width?: number | string;
  height?: number | string;
}

function resolveCompanyLogoDimensions({
  size,
  width,
  height,
}: ResolveCompanyLogoDimensionsInput): {
  width: number | string;
  height: number | string;
} {
  if (size === "custom") {
    return {
      width:
        normalizeCSSDimension(
          width,
          240,
        ),

      height:
        normalizeCSSDimension(
          height,
          140,
        ),
    };
  }

  switch (size) {
    case "compact":
      return {
        width:
          normalizeCSSDimension(
            width,
            56,
          ),

        height:
          normalizeCSSDimension(
            height,
            56,
          ),
      };

    case "large":
      return {
        width:
          normalizeCSSDimension(
            width,
            360,
          ),

        height:
          normalizeCSSDimension(
            height,
            220,
          ),
      };

    case "standard":
    default:
      return {
        width:
          normalizeCSSDimension(
            width,
            220,
          ),

        height:
          normalizeCSSDimension(
            height,
            132,
          ),
      };
  }
}

function normalizeCSSDimension(
  value: number | string | undefined,
  fallback: number,
): number | string {
  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value) &&
      value > 0
      ? value
      : fallback;
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return value.trim();
  }

  return fallback;
}

function getDefaultCornerRadius(
  size: CompanyLogoSize,
): number {
  switch (size) {
    case "compact":
      return 16;

    case "large":
      return 28;

    case "custom":
      return 24;

    case "standard":
    default:
      return 22;
  }
}

function getLogoInternalPadding(
  size: CompanyLogoSize,
): number {
  switch (size) {
    case "compact":
      return 6;

    case "large":
      return 18;

    case "custom":
      return 12;

    case "standard":
    default:
      return 12;
  }
}

// MARK: - Text

function normalizeCompanyName(
  value: string,
): string {
  const normalizedValue =
    value
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 160);

  return normalizedValue ||
    "JCS Business";
}

function createCompanyInitials(
  businessName: string,
): string {
  const ignoredWords =
    new Set([
      "and",
      "of",
      "the",
      "for",
      "de",
      "del",
      "la",
      "las",
      "el",
      "los",
      "y",
    ]);

  const words =
    businessName
      .trim()
      .split(/\s+/)
      .map(
        (word) =>
          word.replace(
            /[^A-Za-zÀ-ÖØ-öø-ÿ0-9]/g,
            "",
          ),
      )
      .filter(Boolean);

  const meaningfulWords =
    words.filter(
      (word) =>
        !ignoredWords.has(
          word.toLowerCase(),
        ),
    );

  const sourceWords =
    meaningfulWords.length > 0
      ? meaningfulWords
      : words;

  if (
    sourceWords.length === 0
  ) {
    return "JCS";
  }

  if (
    sourceWords.length === 1
  ) {
    return sourceWords[0]
      .slice(0, 3)
      .toUpperCase();
  }

  return sourceWords
    .slice(0, 3)
    .map(
      (word) =>
        word.charAt(0),
    )
    .join("")
    .toUpperCase();
}

// MARK: - Visual Helpers

function normalizeAccentColor(
  accentColor: string,
): string {
  const normalized =
    accentColor.trim();

  if (!normalized) {
    return "#2563eb";
  }

  /*
   * Accepts CSS variables, hex, rgb, hsl and named colors.
   * Invalid values are safely ignored by the browser.
   */
  return normalized;
}

function createLogoFrameBackground(
  accentColor: string,
): string {
  const accent =
    normalizeAccentColor(
      accentColor,
    );

  return [
    "linear-gradient(",
    "145deg,",
    "rgba(255,255,255,0.94),",
    `color-mix(in srgb, ${accent} 8%, transparent),`,
    "rgba(248,250,252,0.92)",
    ")",
  ].join(" ");
}

function createInitialsBackground(
  accentColor: string,
): string {
  const accent =
    normalizeAccentColor(
      accentColor,
    );

  return [
    "linear-gradient(",
    "135deg,",
    `color-mix(in srgb, ${accent} 86%, #ffffff),`,
    accent,
    `color-mix(in srgb, ${accent} 72%, #020617)`,
    ")",
  ].join(" ");
}

function createLoadingBackground(
  accentColor: string,
): string {
  const accent =
    normalizeAccentColor(
      accentColor,
    );

  return [
    "linear-gradient(",
    "110deg,",
    "rgba(226,232,240,0.66) 8%,",
    `color-mix(in srgb, ${accent} 14%, rgba(255,255,255,0.82)) 38%,`,
    "rgba(226,232,240,0.66) 68%",
    ")",
  ].join(" ");
}

function createLogoShadow(
  accentColor: string,
): string {
  const accent =
    normalizeAccentColor(
      accentColor,
    );

  return [
    "0 12px 30px",
    `color-mix(in srgb, ${accent} 16%, transparent),`,
    "0 4px 12px rgba(15, 23, 42, 0.08)",
  ].join(", ");
}

function normalizeCornerRadius(
  value: number,
): number {
  if (
    !Number.isFinite(value)
  ) {
    return 22;
  }

  return Math.min(
    Math.max(
      value,
      0,
    ),
    999,
  );
}

function escapeCSSURL(
  value: string,
): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r|\n/g, "");
}