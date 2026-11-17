import {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

// ============================================================
// MARK: - Background IDs
// ============================================================

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
  "custom",
] as const;

export type JCSScreenBackgroundID =
  (typeof JCS_SCREEN_BACKGROUND_IDS)[number];

// ============================================================
// MARK: - Background Definition
// ============================================================

export interface JCSScreenBackgroundDefinition {
  id:
    Exclude<
      JCSScreenBackgroundID,
      "custom"
    >;

  title:
    string;

  subtitle:
    string;

  background:
    string;

  overlay?:
    string;

  prefersLightContent:
    boolean;

  previewAccent:
    string;
}

// ============================================================
// MARK: - Premium Background Registry
// ============================================================

export const JCS_SCREEN_BACKGROUND_OPTIONS:
  readonly JCSScreenBackgroundDefinition[] = [
    {
      id:
        "default",

      title:
        "JCS Default",

      subtitle:
        "Clean professional workspace",

      background:
        `
        linear-gradient(
          180deg,
          #f8fafc 0%,
          #f1f5f9 48%,
          #e2e8f0 100%
        )
        `,

      prefersLightContent:
        false,

      previewAccent:
        "#2563eb",
    },

    {
      id:
        "executiveGlass",

      title:
        "Executive Glass",

      subtitle:
        "Premium glass and soft depth",

      background:
        `
        radial-gradient(
          circle at 15% 12%,
          rgba(255,255,255,.95),
          transparent 28%
        ),
        radial-gradient(
          circle at 88% 10%,
          rgba(191,219,254,.48),
          transparent 28%
        ),
        linear-gradient(
          145deg,
          #eef4fa 0%,
          #dbe7f3 48%,
          #cbd8e5 100%
        )
        `,

      overlay:
        `
        linear-gradient(
          120deg,
          rgba(255,255,255,.28),
          rgba(255,255,255,.02)
        )
        `,

      prefersLightContent:
        false,

      previewAccent:
        "#64748b",
    },

    {
      id:
        "midnightLuxe",

      title:
        "Midnight Luxe",

      subtitle:
        "Dark executive premium",

      background:
        `
        radial-gradient(
          circle at 15% 8%,
          rgba(59,130,246,.28),
          transparent 32%
        ),
        radial-gradient(
          circle at 90% 16%,
          rgba(139,92,246,.18),
          transparent 28%
        ),
        linear-gradient(
          145deg,
          #020617 0%,
          #0f172a 48%,
          #111827 100%
        )
        `,

      overlay:
        `
        linear-gradient(
          180deg,
          rgba(255,255,255,.025),
          rgba(0,0,0,.14)
        )
        `,

      prefersLightContent:
        true,

      previewAccent:
        "#60a5fa",
    },

    {
      id:
        "oceanExecutive",

      title:
        "Ocean Executive",

      subtitle:
        "Deep ocean business finish",

      background:
        `
        radial-gradient(
          circle at 12% 10%,
          rgba(34,211,238,.3),
          transparent 30%
        ),
        radial-gradient(
          circle at 92% 88%,
          rgba(14,116,144,.28),
          transparent 34%
        ),
        linear-gradient(
          150deg,
          #083344 0%,
          #0e7490 44%,
          #164e63 100%
        )
        `,

      prefersLightContent:
        true,

      previewAccent:
        "#22d3ee",
    },

    {
      id:
        "sapphireMist",

      title:
        "Sapphire Mist",

      subtitle:
        "Refined blue crystalline depth",

      background:
        `
        radial-gradient(
          circle at 18% 12%,
          rgba(147,197,253,.42),
          transparent 31%
        ),
        radial-gradient(
          circle at 86% 14%,
          rgba(59,130,246,.28),
          transparent 28%
        ),
        linear-gradient(
          145deg,
          #dbeafe 0%,
          #bfdbfe 42%,
          #93c5fd 100%
        )
        `,

      prefersLightContent:
        false,

      previewAccent:
        "#1d4ed8",
    },

    {
      id:
        "emeraldGlass",

      title:
        "Emerald Glass",

      subtitle:
        "Modern green executive glass",

      background:
        `
        radial-gradient(
          circle at 14% 12%,
          rgba(110,231,183,.34),
          transparent 30%
        ),
        radial-gradient(
          circle at 90% 10%,
          rgba(16,185,129,.22),
          transparent 28%
        ),
        linear-gradient(
          145deg,
          #ecfdf5 0%,
          #d1fae5 48%,
          #a7f3d0 100%
        )
        `,

      prefersLightContent:
        false,

      previewAccent:
        "#059669",
    },

    {
      id:
        "copperStudio",

      title:
        "Copper Studio",

      subtitle:
        "Warm metallic executive style",

      background:
        `
        radial-gradient(
          circle at 18% 10%,
          rgba(251,191,154,.34),
          transparent 30%
        ),
        radial-gradient(
          circle at 88% 88%,
          rgba(146,64,14,.18),
          transparent 32%
        ),
        linear-gradient(
          145deg,
          #fdf2e9 0%,
          #f4d6c3 44%,
          #d9a27d 100%
        )
        `,

      prefersLightContent:
        false,

      previewAccent:
        "#b45f35",
    },

    {
      id:
        "champagnePearl",

      title:
        "Champagne Pearl",

      subtitle:
        "Soft luxury and warm elegance",

      background:
        `
        radial-gradient(
          circle at 18% 10%,
          rgba(255,255,255,.8),
          transparent 30%
        ),
        radial-gradient(
          circle at 88% 14%,
          rgba(253,230,138,.26),
          transparent 28%
        ),
        linear-gradient(
          145deg,
          #fffaf0 0%,
          #f8edcf 48%,
          #ead7ad 100%
        )
        `,

      prefersLightContent:
        false,

      previewAccent:
        "#b28a3c",
    },

    {
      id:
        "platinumFrost",

      title:
        "Platinum Frost",

      subtitle:
        "Cool metallic professional",

      background:
        `
        radial-gradient(
          circle at 12% 12%,
          rgba(255,255,255,.9),
          transparent 30%
        ),
        radial-gradient(
          circle at 88% 10%,
          rgba(203,213,225,.42),
          transparent 30%
        ),
        linear-gradient(
          145deg,
          #f8fafc 0%,
          #e2e8f0 48%,
          #cbd5e1 100%
        )
        `,

      prefersLightContent:
        false,

      previewAccent:
        "#64748b",
    },

    {
      id:
        "titaniumDark",

      title:
        "Titanium Dark",

      subtitle:
        "Strong industrial executive theme",

      background:
        `
        radial-gradient(
          circle at 16% 12%,
          rgba(148,163,184,.18),
          transparent 30%
        ),
        radial-gradient(
          circle at 92% 10%,
          rgba(255,255,255,.05),
          transparent 28%
        ),
        linear-gradient(
          145deg,
          #18181b 0%,
          #27272a 45%,
          #3f3f46 100%
        )
        `,

      prefersLightContent:
        true,

      previewAccent:
        "#a1a1aa",
    },

    {
      id:
        "softIvory",

      title:
        "Soft Ivory",

      subtitle:
        "Bright refined workspace",

      background:
        `
        radial-gradient(
          circle at 14% 10%,
          rgba(255,255,255,.95),
          transparent 28%
        ),
        linear-gradient(
          145deg,
          #fffdf8 0%,
          #faf7f0 48%,
          #f0ebe1 100%
        )
        `,

      prefersLightContent:
        false,

      previewAccent:
        "#a16207",
    },

    {
      id:
        "whiteStudio",

      title:
        "White Studio",

      subtitle:
        "Pure bright professional workspace",

      background:
        `
        linear-gradient(
          145deg,
          #ffffff 0%,
          #fafafa 48%,
          #f4f4f5 100%
        )
        `,

      prefersLightContent:
        false,

      previewAccent:
        "#64748b",
    },

    {
      id:
        "softWhite",

      title:
        "Soft White",

      subtitle:
        "Warm clean executive surface",

      background:
        `
        radial-gradient(
          circle at 15% 10%,
          rgba(255,255,255,1),
          transparent 30%
        ),
        linear-gradient(
          145deg,
          #ffffff 0%,
          #fafafa 45%,
          #f1f5f9 100%
        )
        `,

      prefersLightContent:
        false,

      previewAccent:
        "#475569",
    },

    {
      id:
        "lightPurple",

      title:
        "Light Purple",

      subtitle:
        "Soft premium purple workspace",

      background:
        `
        radial-gradient(
          circle at 15% 10%,
          rgba(255,255,255,.9),
          transparent 30%
        ),
        radial-gradient(
          circle at 88% 12%,
          rgba(196,181,253,.42),
          transparent 30%
        ),
        linear-gradient(
          145deg,
          #faf5ff 0%,
          #f3e8ff 48%,
          #e9d5ff 100%
        )
        `,

      prefersLightContent:
        false,

      previewAccent:
        "#9333ea",
    },

    {
      id:
        "lavenderMist",

      title:
        "Lavender Mist",

      subtitle:
        "Elegant lavender glass finish",

      background:
        `
        radial-gradient(
          circle at 16% 12%,
          rgba(255,255,255,.92),
          transparent 30%
        ),
        radial-gradient(
          circle at 86% 15%,
          rgba(221,214,254,.58),
          transparent 32%
        ),
        linear-gradient(
          145deg,
          #faf8ff 0%,
          #ede9fe 48%,
          #ddd6fe 100%
        )
        `,

      prefersLightContent:
        false,

      previewAccent:
        "#7c3aed",
    },

    {
      id:
        "pearlWhite",

      title:
        "Pearl White",

      subtitle:
        "Polished pearl luxury surface",

      background:
        `
        radial-gradient(
          circle at 12% 10%,
          rgba(255,255,255,1),
          transparent 28%
        ),
        radial-gradient(
          circle at 88% 14%,
          rgba(226,232,240,.46),
          transparent 30%
        ),
        linear-gradient(
          145deg,
          #ffffff 0%,
          #f8fafc 50%,
          #e8edf3 100%
        )
        `,

      prefersLightContent:
        false,

      previewAccent:
        "#94a3b8",
    },

    {
      id:
        "softBlue",

      title:
        "Soft Blue",

      subtitle:
        "Bright calm business blue",

      background:
        `
        radial-gradient(
          circle at 16% 10%,
          rgba(255,255,255,.92),
          transparent 30%
        ),
        radial-gradient(
          circle at 88% 12%,
          rgba(186,230,253,.5),
          transparent 30%
        ),
        linear-gradient(
          145deg,
          #f8fcff 0%,
          #e0f2fe 48%,
          #bae6fd 100%
        )
        `,

      prefersLightContent:
        false,

      previewAccent:
        "#0284c7",
    },

    {
      id:
        "mintMist",

      title:
        "Mint Mist",

      subtitle:
        "Fresh light executive mint",

      background:
        `
        radial-gradient(
          circle at 14% 12%,
          rgba(255,255,255,.92),
          transparent 30%
        ),
        radial-gradient(
          circle at 88% 16%,
          rgba(167,243,208,.46),
          transparent 30%
        ),
        linear-gradient(
          145deg,
          #f7fffb 0%,
          #ecfdf5 48%,
          #d1fae5 100%
        )
        `,

      prefersLightContent:
        false,

      previewAccent:
        "#10b981",
    },

    {
      id:
        "roseMist",

      title:
        "Rose Mist",

      subtitle:
        "Soft rose premium elegance",

      background:
        `
        radial-gradient(
          circle at 15% 10%,
          rgba(255,255,255,.94),
          transparent 30%
        ),
        radial-gradient(
          circle at 88% 14%,
          rgba(251,207,232,.52),
          transparent 30%
        ),
        linear-gradient(
          145deg,
          #fffafa 0%,
          #fdf2f8 48%,
          #fce7f3 100%
        )
        `,

      prefersLightContent:
        false,

      previewAccent:
        "#db2777",
    },

    {
      id:
        "champagneLight",

      title:
        "Champagne Light",

      subtitle:
        "Bright champagne executive luxury",

      background:
        `
        radial-gradient(
          circle at 14% 10%,
          rgba(255,255,255,.96),
          transparent 30%
        ),
        radial-gradient(
          circle at 88% 12%,
          rgba(254,240,138,.28),
          transparent 30%
        ),
        linear-gradient(
          145deg,
          #fffef8 0%,
          #fefce8 48%,
          #fef3c7 100%
        )
        `,

      prefersLightContent:
        false,

      previewAccent:
        "#ca8a04",
    },

    {
      id:
        "liquidGlass",

      title:
        "Liquid Glass",

      subtitle:
        "Modern translucent premium surface",

      background:
        `
        radial-gradient(
          circle at 15% 10%,
          rgba(255,255,255,.9),
          transparent 28%
        ),
        radial-gradient(
          circle at 85% 8%,
          rgba(125,211,252,.5),
          transparent 26%
        ),
        radial-gradient(
          circle at 75% 90%,
          rgba(196,181,253,.45),
          transparent 32%
        ),
        linear-gradient(
          145deg,
          #f8fbff 0%,
          #e0f2fe 42%,
          #ede9fe 100%
        )
        `,

      overlay:
        `
        linear-gradient(
          120deg,
          rgba(255,255,255,.34),
          rgba(255,255,255,.05)
        )
        `,

      prefersLightContent:
        false,

      previewAccent:
        "#7c3aed",
    },
  ] as const;

// ============================================================
// MARK: - Helpers
// ============================================================

export function isJCSScreenBackgroundID(
  value:
    unknown,
): value is JCSScreenBackgroundID {

  return (
    typeof value ===
      "string" &&
    JCS_SCREEN_BACKGROUND_IDS.includes(
      value as
        JCSScreenBackgroundID,
    )
  );
}

export function resolveJCSScreenBackground(
  backgroundID:
    JCSScreenBackgroundID,
): JCSScreenBackgroundDefinition {

  if (
    backgroundID ===
      "custom"
  ) {
    return (
      JCS_SCREEN_BACKGROUND_OPTIONS[0]
    );
  }

  return (
    JCS_SCREEN_BACKGROUND_OPTIONS.find(
      (
        option
      ) =>
        option.id ===
        backgroundID,
    ) ??
    JCS_SCREEN_BACKGROUND_OPTIONS[0]
  );
}

// ============================================================
// MARK: - Component
// ============================================================

export interface JCSScreenBackgroundProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    "children"
  > {
  children:
    ReactNode;

  backgroundID?:
    JCSScreenBackgroundID;

  customBackgroundURL?:
    string;

  className?:
    string;

  style?:
    CSSProperties;
}

export default function JCSScreenBackground({
  children,

  backgroundID =
    "default",

  customBackgroundURL =
    "",

  className =
    "",

  style,

  ...restProps
}: JCSScreenBackgroundProps) {

  const resolvedBackground =
    resolveJCSScreenBackground(
      backgroundID,
    );

  const cleanCustomBackgroundURL =
    customBackgroundURL
      .trim();

  const usesCustomBackground =
    backgroundID ===
      "custom" &&
    cleanCustomBackgroundURL
      .length >
      0;

  const rootStyle =
    {
      position:
        "relative",

      isolation:
        "isolate",

      minHeight:
        "100%",

      width:
        "100%",

      backgroundImage:
        usesCustomBackground
          ? `
            linear-gradient(
              rgba(15,23,42,.08),
              rgba(15,23,42,.08)
            ),
            url("${cleanCustomBackgroundURL}")
          `
          : resolvedBackground
              .background,

      backgroundSize:
        usesCustomBackground
          ? "cover"
          : "auto",

      backgroundPosition:
        "center",

      backgroundRepeat:
        "no-repeat",

      colorScheme:
        resolvedBackground
          .prefersLightContent
          ? "dark"
          : "light",

      ...style,
    } satisfies CSSProperties;

  const overlayStyle =
    resolvedBackground
      .overlay
      ? {
          position:
            "absolute",

          inset:
            0,

          zIndex:
            -1,

          pointerEvents:
            "none",

          background:
            resolvedBackground
              .overlay,
        } satisfies CSSProperties
      : null;

  return (
    <div
      {...restProps}
      className={[
        "jcs-screen-background",
        `jcs-screen-background--${backgroundID}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        rootStyle
      }
      data-jcs-background={
        backgroundID
      }
      data-jcs-light-content={
        resolvedBackground
          .prefersLightContent
          ? "true"
          : "false"
      }
    >
      {overlayStyle ? (
        <span
          aria-hidden="true"
          style={
            overlayStyle
          }
        />
      ) : null}

      {children}
    </div>
  );
}
