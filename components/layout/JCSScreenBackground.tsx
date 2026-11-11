"use client";

/*
 * JCS Business Suite Web
 * JCSScreenBackground.tsx
 *
 * Official screen-background authority shared by:
 *
 * - Platform Admin App Settings
 * - Business Owner App Settings
 * - Dashboard / Official Shell
 *
 * IDs, titles and base gradients mirror the build-approved
 * Apple JCSScreenBackgroundRegistry and
 * JCSScreenBackgroundPreview authorities.
 *
 * This module contains no Firebase persistence.
 */

import type {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
} from "react";

// =======================================================
// MARK: - IDs
// =======================================================

export const JCS_SCREEN_BACKGROUND_IDS = [
  "default",
  "executiveGlass",
  "midnightLuxe",
  "oceanExecutive",
  "sapphireMist",
  "emeraldGlass",
  "copperStudio",
  "champagnePearl",
  "platinumFrost",
  "titaniumDark",
  "softIvory",
  "whiteStudio",
  "softWhite",
  "lightPurple",
  "lavenderMist",
  "pearlWhite",
  "softBlue",
  "mintMist",
  "roseMist",
  "champagneLight",
  "liquidGlass",
  "darkBlue",
  "lightBlue",
  "pastel",
  "lila",
  "celeste",
  "softYellow",
  "peach",
  "lavender",
  "mauve",
  "coral",
  "custom"
] as const;

export type JCSScreenBackgroundID =
  (typeof JCS_SCREEN_BACKGROUND_IDS)[number];

export const JCS_DEFAULT_SCREEN_BACKGROUND_ID:
  JCSScreenBackgroundID =
  "default";

// =======================================================
// MARK: - Option
// =======================================================

export interface JCSScreenBackgroundOption {
  id: JCSScreenBackgroundID;

  title: string;
  subtitle: string;

  prefersLightContent: boolean;

  previewAccentHex: string;

  background: string;
}

// =======================================================
// MARK: - Registry
// =======================================================

export const JCS_SCREEN_BACKGROUND_OPTIONS:
  readonly JCSScreenBackgroundOption[] = [
  {
    id: "default",
    title: "JCS Default",
    subtitle: "Clean professional workspace",
    prefersLightContent: false,
    previewAccentHex: "#2563eb",
    background: "linear-gradient(135deg, #F8FAFC, #F1F5F9, #E2E8F0)",
  },
  {
    id: "executiveGlass",
    title: "Executive Glass",
    subtitle: "Premium glass and soft depth",
    prefersLightContent: false,
    previewAccentHex: "#64748b",
    background: "radial-gradient(circle at 38% 8%, rgba(255, 255, 255, 0.48) 0%, rgba(255, 255, 255, 0.24) 26%, rgba(255, 255, 255, 0) 58%), linear-gradient(135deg, #EEF4FA, #DBE7F3, #CBD8E5)",
  },
  {
    id: "midnightLuxe",
    title: "Midnight Luxe",
    subtitle: "Dark executive premium",
    prefersLightContent: true,
    previewAccentHex: "#60a5fa",
    background: "radial-gradient(circle at 68% 8%, rgba(59, 130, 246, 0.22) 0%, rgba(59, 130, 246, 0.11) 28%, rgba(59, 130, 246, 0) 60%), linear-gradient(135deg, #020617, #0F172A, #111827)",
  },
  {
    id: "oceanExecutive",
    title: "Ocean Executive",
    subtitle: "Deep ocean business finish",
    prefersLightContent: true,
    previewAccentHex: "#22d3ee",
    background: "radial-gradient(circle at 68% 8%, rgba(34, 211, 238, 0.20) 0%, rgba(34, 211, 238, 0.10) 28%, rgba(34, 211, 238, 0) 60%), linear-gradient(135deg, #083344, #0E7490, #164E63)",
  },
  {
    id: "sapphireMist",
    title: "Sapphire Mist",
    subtitle: "Refined blue crystalline depth",
    prefersLightContent: false,
    previewAccentHex: "#1d4ed8",
    background: "linear-gradient(135deg, #DBEAFE, #BFDBFE, #93C5FD)",
  },
  {
    id: "emeraldGlass",
    title: "Emerald Glass",
    subtitle: "Modern green executive glass",
    prefersLightContent: false,
    previewAccentHex: "#059669",
    background: "radial-gradient(circle at 68% 8%, rgba(52, 211, 153, 0.20) 0%, rgba(52, 211, 153, 0.10) 28%, rgba(52, 211, 153, 0) 60%), linear-gradient(135deg, #ECFDF5, #D1FAE5, #A7F3D0)",
  },
  {
    id: "copperStudio",
    title: "Copper Studio",
    subtitle: "Warm metallic executive style",
    prefersLightContent: false,
    previewAccentHex: "#b45f35",
    background: "linear-gradient(135deg, #FDF2E9, #F4D6C3, #D9A27D)",
  },
  {
    id: "champagnePearl",
    title: "Champagne Pearl",
    subtitle: "Soft luxury and warm elegance",
    prefersLightContent: false,
    previewAccentHex: "#b28a3c",
    background: "linear-gradient(135deg, #FFFAF0, #F8EDCF, #EAD7AD)",
  },
  {
    id: "platinumFrost",
    title: "Platinum Frost",
    subtitle: "Cool metallic professional",
    prefersLightContent: false,
    previewAccentHex: "#64748b",
    background: "linear-gradient(135deg, #F8FAFC, #E2E8F0, #CBD5E1)",
  },
  {
    id: "titaniumDark",
    title: "Titanium Dark",
    subtitle: "Strong industrial executive theme",
    prefersLightContent: true,
    previewAccentHex: "#a1a1aa",
    background: "linear-gradient(135deg, #18181B, #27272A, #3F3F46)",
  },
  {
    id: "softIvory",
    title: "Soft Ivory",
    subtitle: "Bright refined workspace",
    prefersLightContent: false,
    previewAccentHex: "#a16207",
    background: "linear-gradient(135deg, #FFFDF8, #FAF7F0, #F0EBE1)",
  },
  {
    id: "whiteStudio",
    title: "White Studio",
    subtitle: "Pure bright professional workspace",
    prefersLightContent: false,
    previewAccentHex: "#64748b",
    background: "linear-gradient(135deg, #FFFFFF, #FAFAFA, #F4F4F5)",
  },
  {
    id: "softWhite",
    title: "Soft White",
    subtitle: "Warm clean executive surface",
    prefersLightContent: false,
    previewAccentHex: "#475569",
    background: "linear-gradient(135deg, #FFFFFF, #FAFAFA, #F1F5F9)",
  },
  {
    id: "lightPurple",
    title: "Light Purple",
    subtitle: "Soft premium purple workspace",
    prefersLightContent: false,
    previewAccentHex: "#9333ea",
    background: "linear-gradient(135deg, #FAF5FF, #F3E8FF, #E9D5FF)",
  },
  {
    id: "lavenderMist",
    title: "Lavender Mist",
    subtitle: "Elegant lavender glass finish",
    prefersLightContent: false,
    previewAccentHex: "#7c3aed",
    background: "linear-gradient(135deg, #FAF8FF, #EDE9FE, #DDD6FE)",
  },
  {
    id: "pearlWhite",
    title: "Pearl White",
    subtitle: "Polished pearl luxury surface",
    prefersLightContent: false,
    previewAccentHex: "#94a3b8",
    background: "linear-gradient(135deg, #FFFFFF, #F8FAFC, #E8EDF3)",
  },
  {
    id: "softBlue",
    title: "Soft Blue",
    subtitle: "Bright calm business blue",
    prefersLightContent: false,
    previewAccentHex: "#0284c7",
    background: "linear-gradient(135deg, #F8FCFF, #E0F2FE, #BAE6FD)",
  },
  {
    id: "mintMist",
    title: "Mint Mist",
    subtitle: "Fresh light executive mint",
    prefersLightContent: false,
    previewAccentHex: "#10b981",
    background: "linear-gradient(135deg, #F7FFFB, #ECFDF5, #D1FAE5)",
  },
  {
    id: "roseMist",
    title: "Rose Mist",
    subtitle: "Soft rose premium elegance",
    prefersLightContent: false,
    previewAccentHex: "#db2777",
    background: "linear-gradient(135deg, #FFFAFA, #FDF2F8, #FCE7F3)",
  },
  {
    id: "champagneLight",
    title: "Champagne Light",
    subtitle: "Bright champagne executive luxury",
    prefersLightContent: false,
    previewAccentHex: "#ca8a04",
    background: "linear-gradient(135deg, #FFFEF8, #FEFCE8, #FEF3C7)",
  },
  {
    id: "liquidGlass",
    title: "Liquid Glass",
    subtitle: "Modern translucent premium surface",
    prefersLightContent: false,
    previewAccentHex: "#7c3aed",
    background: "radial-gradient(circle at 38% 8%, rgba(96, 165, 250, 0.24) 0%, rgba(96, 165, 250, 0.12) 28%, rgba(96, 165, 250, 0) 60%), radial-gradient(circle at 62% 92%, rgba(167, 139, 250, 0.22) 0%, rgba(167, 139, 250, 0.11) 28%, rgba(167, 139, 250, 0) 60%), linear-gradient(135deg, #F8FBFF, #E0F2FE, #EDE9FE)",
  },
  {
    id: "darkBlue",
    title: "Dark Blue",
    subtitle: "Deep navy executive finish",
    prefersLightContent: true,
    previewAccentHex: "#1E3A8A",
    background: "linear-gradient(135deg, #0B1F4D, #173B72, #1E4F8F)",
  },
  {
    id: "lightBlue",
    title: "Light Blue",
    subtitle: "Clear bright blue workspace",
    prefersLightContent: false,
    previewAccentHex: "#38BDF8",
    background: "linear-gradient(135deg, #F0F9FF, #D9F0FF, #B9E6FE)",
  },
  {
    id: "pastel",
    title: "Pastel",
    subtitle: "Soft blended pastel atmosphere",
    prefersLightContent: false,
    previewAccentHex: "#C4B5FD",
    background: "linear-gradient(135deg, #FFF4F7, #F3E8FF, #E0F2FE)",
  },
  {
    id: "lila",
    title: "Lila",
    subtitle: "Soft lilac executive surface",
    prefersLightContent: false,
    previewAccentHex: "#C084FC",
    background: "linear-gradient(135deg, #FCF5FF, #F3E8FF, #E9D5FF)",
  },
  {
    id: "celeste",
    title: "Celeste",
    subtitle: "Airy sky-blue professional finish",
    prefersLightContent: false,
    previewAccentHex: "#7DD3FC",
    background: "linear-gradient(135deg, #F4FCFF, #DDF5FF, #BCEBFF)",
  },
  {
    id: "softYellow",
    title: "Soft Yellow",
    subtitle: "Warm gentle yellow workspace",
    prefersLightContent: false,
    previewAccentHex: "#FDE68A",
    background: "linear-gradient(135deg, #FFFDF2, #FEF9C3, #FDE68A)",
  },
  {
    id: "peach",
    title: "Peach",
    subtitle: "Soft warm peach elegance",
    prefersLightContent: false,
    previewAccentHex: "#FDBA74",
    background: "linear-gradient(135deg, #FFF7ED, #FFE4CC, #FDBA9A)",
  },
  {
    id: "lavender",
    title: "Lavender",
    subtitle: "Classic soft lavender finish",
    prefersLightContent: false,
    previewAccentHex: "#A78BFA",
    background: "linear-gradient(135deg, #FBF8FF, #EDE9FE, #D8B4FE)",
  },
  {
    id: "mauve",
    title: "Mauve",
    subtitle: "Muted mauve premium workspace",
    prefersLightContent: false,
    previewAccentHex: "#C084A3",
    background: "linear-gradient(135deg, #FFF7FB, #F3DFEA, #D8B4C8)",
  },
  {
    id: "coral",
    title: "Coral",
    subtitle: "Warm coral modern surface",
    prefersLightContent: false,
    previewAccentHex: "#FB7185",
    background: "linear-gradient(135deg, #FFF7F5, #FFE4E1, #FDA4A0)",
  },
  {
    id: "custom",
    title: "Custom",
    subtitle: "Use your own saved background",
    prefersLightContent: false,
    previewAccentHex: "#64748b",
    background: "linear-gradient(135deg, #F8FAFC, #E2E8F0)",
  }
];

const JCS_SCREEN_BACKGROUND_ID_SET =
  new Set<string>(
    JCS_SCREEN_BACKGROUND_IDS,
  );

export function isJCSScreenBackgroundID(
  value: unknown,
): value is JCSScreenBackgroundID {
  return (
    typeof value === "string" &&
    JCS_SCREEN_BACKGROUND_ID_SET.has(
      value,
    )
  );
}

export function normalizeJCSScreenBackgroundID(
  value: unknown,
): JCSScreenBackgroundID {
  return isJCSScreenBackgroundID(
    value,
  )
    ? value
    : JCS_DEFAULT_SCREEN_BACKGROUND_ID;
}

export function getJCSScreenBackgroundOption(
  value: unknown,
): JCSScreenBackgroundOption {
  const id =
    normalizeJCSScreenBackgroundID(
      value,
    );

  return (
    JCS_SCREEN_BACKGROUND_OPTIONS.find(
      (option) =>
        option.id === id,
    ) ??
    JCS_SCREEN_BACKGROUND_OPTIONS[0]
  );
}

// =======================================================
// MARK: - Style
// =======================================================

export function getJCSScreenBackgroundStyle(
  value: unknown,
): CSSProperties {
  const option =
    getJCSScreenBackgroundOption(
      value,
    );

  return {
    background:
      option.background,
  };
}

// =======================================================
// MARK: - Renderer
// =======================================================

export interface JCSScreenBackgroundProps
  extends
    Omit<
      HTMLAttributes<HTMLDivElement>,
      "children"
    > {
  backgroundID:
    JCSScreenBackgroundID | string;

  children?: ReactNode;
}

export default function JCSScreenBackground({
  backgroundID,
  children,
  style,
  ...rest
}: JCSScreenBackgroundProps) {
  const option =
    getJCSScreenBackgroundOption(
      backgroundID,
    );

  return (
    <div
      {...rest}
      data-jcs-screen-background={
        option.id
      }
      data-jcs-prefers-light-content={
        option.prefersLightContent
          ? "true"
          : "false"
      }
      style={{
        width: "100%",
        minHeight: "100%",
        background:
          option.background,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
