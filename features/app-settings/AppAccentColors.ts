/*
 * JCS Business Suite Web
 * AppAccentColors.ts
 *
 * Shared official Accent Color registry.
 *
 * This is the single visual source of truth for:
 *
 * - AppSettingsView
 * - PlatformSettingsView
 * - Dashboard
 * - Future JCS Business Suite surfaces
 */

import type {
  AppAccentColorName,
} from "./AppSettingsTypes";

// =======================================================
// MARK: - Types
// =======================================================

export interface AppAccentColorDisplayOption {
  name:
    AppAccentColorName;

  title:
    string;

  preview:
    string;

  foreground:
    string;
}

// =======================================================
// MARK: - Official Accent Color Registry
// =======================================================

export const APP_ACCENT_COLOR_DISPLAY_OPTIONS:
  readonly AppAccentColorDisplayOption[] = [
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

// =======================================================
// MARK: - Helpers
// =======================================================

export function resolveAppAccentColorOption(
  accentColorName:
    AppAccentColorName,
): AppAccentColorDisplayOption {
  return (
    APP_ACCENT_COLOR_DISPLAY_OPTIONS.find(
      (option) =>
        option.name ===
        accentColorName,
    ) ??
    APP_ACCENT_COLOR_DISPLAY_OPTIONS[0]
  );
}

export function resolveAppAccentColorCSS(
  accentColorName:
    AppAccentColorName,
): string {
  return resolveAppAccentColorOption(
    accentColorName,
  ).preview;
}

export function resolveAppAccentForegroundCSS(
  accentColorName:
    AppAccentColorName,
): string {
  return resolveAppAccentColorOption(
    accentColorName,
  ).foreground;
}
