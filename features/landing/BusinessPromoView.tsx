"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

import {
  allCategories,
  BusinessModeStatistics,
  type BusinessModeCategory,
} from "@/core/business-mode/BusinessModeLibrary";

import { usePlatformSettingsContext } from
  "@/features/platform-settings/PlatformSettingsContext";

import {
  resolveAppAccentColorCSS,
} from "@/features/app-settings/AppAccentColors";

import {
  resolveJCSScreenBackground,
} from "@/components/layout/JCSScreenBackground";

import styles from "./BusinessPromoView.module.css";

// MARK: - Category Presentation

const CATEGORY_EMOJI: Record<string, string> = {
  "Retail & Commerce": "🛍️",
  "Restaurant & Food": "🍽️",
  "Beauty & Personal Care": "✨",
  "Medical & Healthcare": "🩺",
  "Construction & Trades": "🏗️",
  "Transportation & Logistics": "🚚",
  Automotive: "🚗",
  "Professional Services": "💼",
  "Engineering & Design": "📐",
  "Real Estate & Property": "🏠",
  "Technology & Digital": "💻",
  "Education & Training": "🎓",
  "Fitness & Sports": "🏋️",
  "Creative & Media": "🎨",
  "Events & Entertainment": "🎉",
  "Hospitality & Travel": "🏨",
  "Industrial & Manufacturing": "🏭",
  "Agriculture & Farming": "🌾",
  "Nonprofit & Community": "🤝",
  "Modern Online Businesses": "🌐",
  "Banking & Financial Services": "🏦",
  "Legal Services": "⚖️",
  "Energy & Utilities": "⚡",
  "Oil & Gas": "🔥",
  Telecommunications: "📡",
  "Security & Public Safety": "🛡️",
  "Scientific & Laboratory": "🧪",
  "Aviation & Aerospace": "✈️",
  "Animal Services": "🐾",
  "Childcare & Family Services": "👨‍👩‍👧",
  "Senior Care & Home Services": "❤️",
  "Laundry & Garment Care": "🧺",
  "Fashion & Apparel": "👕",
  "Publishing & Information": "📰",
  "Advanced Technology": "🤖",
};

const FEATURE_GROUPS = [
  {
    icon: "🛒",
    title: "Sell Anywhere",
    description:
      "POS, online catalog, checkout, orders, receipts and customer favorites.",
    tags: ["POS", "Catalog", "Checkout", "Orders"],
  },
  {
    icon: "⚙️",
    title: "Operate Smarter",
    description:
      "Inventory, services, appointments, receiving, shipping and backorders.",
    tags: ["Inventory", "Services", "Receiving", "Shipping"],
  },
  {
    icon: "📈",
    title: "Know Your Numbers",
    description:
      "Sales, profit, taxes, reports and intelligent business insights.",
    tags: ["Analytics", "Profit", "Taxes", "Reports"],
  },
];

const BUSINESS_TOOLS = [
  {
    icon: "🏪",
    title: "Customer Store",
    description: "Premium online storefront",
  },
  {
    icon: "📅",
    title: "Appointments",
    description: "Bookings and calendar",
  },
  {
    icon: "▦",
    title: "SKU & Barcodes",
    description: "Variants and labels",
  },
  {
    icon: "👥",
    title: "Employees",
    description: "Roles and permissions",
  },
  {
    icon: "🛡️",
    title: "Compliance",
    description: "Records and safety",
  },
  {
    icon: "🚚",
    title: "Transportation",
    description: "Fleet and logistics",
  },
  {
    icon: "🍴",
    title: "Restaurant Mode",
    description: "Menus and tickets",
  },
  {
    icon: "📊",
    title: "Tax Reports",
    description: "Year-end preparation",
  },
];


// MARK: - Official Public Branding

type BusinessPromoStyle =
  CSSProperties & {
    "--jcs-accent": string;
    "--jcs-accent-rgb": string;
    "--jcs-accent-preview": string;
    "--jcs-screen-background": string;
    "--jcs-screen-overlay": string;
  };

function resolveRepresentativeAccentColor(
  preview: string,
): string {
  const colors =
    preview.match(/#[0-9a-fA-F]{6}/g) ?? [];

  if (colors.length === 0) {
    return "#2379d4";
  }

  if (colors.length === 1) {
    return colors[0];
  }

  return colors[
    Math.floor(colors.length / 2)
  ];
}

function resolveAccentRGB(
  color: string,
): string {
  const normalized =
    color.replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return "35, 121, 212";
  }

  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ].join(", ");
}

// MARK: - Component

export default function BusinessPromoView() {
  const {
    platformName,
    platformTagline,
    platformLogoDownloadURL,
    platformAccentColorName,
    platformScreenBackgroundID,
  } = usePlatformSettingsContext();

  const resolvedPlatformName =
    platformName?.trim() || "JCS Business Suite";

  const resolvedPlatformTagline =
    platformTagline?.trim() ||
    "One Platform | Every Business | Endless Possibilities";

  const resolvedPlatformLogoURL =
    platformLogoDownloadURL?.trim() || "";

  const accentPreview =
    resolveAppAccentColorCSS(
      platformAccentColorName,
    );

  const accentColor =
    resolveRepresentativeAccentColor(
      accentPreview,
    );

  const accentRGB =
    resolveAccentRGB(
      accentColor,
    );

  const resolvedScreenBackground =
    resolveJCSScreenBackground(
      platformScreenBackgroundID ??
        "default",
    );

  const pageStyle: BusinessPromoStyle = {
    "--jcs-accent": accentColor,
    "--jcs-accent-rgb": accentRGB,
    "--jcs-accent-preview": accentPreview,
    "--jcs-screen-background":
      resolvedScreenBackground.background,
    "--jcs-screen-overlay":
      resolvedScreenBackground.overlay ??
      "none",
  };

  const [expandedCategoryID, setExpandedCategoryID] =
    useState<string | null>(null);

  const [appearance, setAppearance] =
    useState<"light" | "dark">("light");

  useEffect(() => {
    const storedAppearance =
      window.localStorage.getItem(
        "jcs-public-appearance",
      );

    if (
      storedAppearance === "light" ||
      storedAppearance === "dark"
    ) {
      setAppearance(storedAppearance);
      return;
    }

    const prefersDark =
      window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;

    setAppearance(
      prefersDark ? "dark" : "light",
    );
  }, []);

  const toggleAppearance = () => {
    setAppearance((current) => {
      const next =
        current === "dark"
          ? "light"
          : "dark";

      window.localStorage.setItem(
        "jcs-public-appearance",
        next,
      );

      return next;
    });
  };

  const toggleCategory = (
    category: BusinessModeCategory
  ) => {
    setExpandedCategoryID((current) =>
      current === category.id ? null : category.id
    );
  };

  return (
    <main
      className={styles.page}
      data-accent={platformAccentColorName}
      data-theme={appearance}
      style={pageStyle}
    >
      <div
        className={styles.backgroundGlow}
        aria-hidden="true"
      />

      <header className={styles.navigation}>
        <Link
          href="/"
          className={styles.brand}
          aria-label="JCS Business Suite home"
        >
          <span className={styles.brandMark}>
            {resolvedPlatformLogoURL ? (
              <img
                src={resolvedPlatformLogoURL}
                alt={resolvedPlatformName}
                className={styles.brandLogoImage}
              />
            ) : (
              "JCS"
            )}
          </span>

          <span className={styles.brandCopy}>
            <strong>{resolvedPlatformName}</strong>
            <small>{resolvedPlatformTagline}</small>
          </span>
        </Link>

        <nav
          className={styles.desktopNavigation}
          aria-label="Main navigation"
        >
          <a href="#platform">Platform</a>
          <a href="#features">Features</a>
          <a href="#industries">Industries</a>
          <a href="#business-tools">Business Tools</a>
        </nav>

        <div className={styles.navigationActions}>
          <button
            type="button"
            className={styles.appearanceButton}
            onClick={toggleAppearance}
            aria-label={
              appearance === "dark"
                ? "Use daylight appearance"
                : "Use dark appearance"
            }
            title={
              appearance === "dark"
                ? "Daylight"
                : "Dark"
            }
          >
            <span aria-hidden="true">
              {appearance === "dark"
                ? "☀"
                : "☾"}
            </span>

            <strong>
              {appearance === "dark"
                ? "Daylight"
                : "Dark"}
            </strong>
          </button>

          <Link
            href="/login"
            className={styles.signInLink}
          >
            Sign In
          </Link>

          <Link
            href="/create-business"
            className={styles.navigationCTA}
          >
            Get Started
          </Link>
        </div>
      </header>

      <section className={styles.hero}>
        {/* =================================================
            LEFT — OFFICIAL PROMO CONTENT
        ================================================= */}

        <div className={styles.heroContent}>
          <h1>
            Build, Run &amp; Grow
            <br />
            Your Business
          </h1>

          <p className={styles.heroDescription}>
            JCS Business Suite connects sales,
            customers, employees, providers,
            inventory, payments, POS, online store,
            catalog, calendar/events, accounting,
            operations and business insights —
            all in one premium workspace.
          </p>

          {/* MARK: - Business Performance Preview */}

          <div className={styles.performanceCard}>
            <div className={styles.performancePrimary}>
              <span>Today</span>

              <strong>$18,420</strong>

              <small>
                Sales across POS, catalog and services
              </small>
            </div>

            <div
              className={styles.performanceTrend}
              aria-hidden="true"
            >
              ↗
            </div>

            <div className={styles.performanceMetrics}>
              <div>
                <span>▤</span>
                <strong>142</strong>
                <small>Orders</small>
              </div>

              <div>
                <span>$</span>
                <strong>$7.8K</strong>
                <small>Profit</small>
              </div>

              <div>
                <span>◇</span>
                <strong>94%</strong>
                <small>Stock</small>
              </div>
            </div>
          </div>

          <div className={styles.heroFeatureChips}>
            <div>
              <span>✦</span>
              <p>
                <strong>AI Setup</strong>
                <small>Start smart</small>
              </p>
            </div>

            <div>
              <span>▦</span>
              <p>
                <strong>All-in-One</strong>
                <small>Connected everything</small>
              </p>
            </div>

            <div>
              <span>✧</span>
              <p>
                <strong>Apple Style</strong>
                <small>Premium UI</small>
              </p>
            </div>
          </div>

          {/* MARK: - Start */}

          <div className={styles.startPanel}>
            <div className={styles.startHeading}>
              <span />
              <strong>START</strong>
            </div>

            <Link
              href="/create-business"
              className={styles.startAction}
            >
              <span
                className={styles.startActionIcon}
                aria-hidden="true"
              >
                ◷
              </span>

              <span className={styles.startActionCopy}>
                <strong>
                  Start 7-Day Free Trial
                </strong>

                <small>
                  Experience JCS Business Suite
                  risk-free for 7 days.
                </small>
              </span>

              <span aria-hidden="true">›</span>
            </Link>

            <Link
              href="/create-business"
              className={styles.startAction}
            >
              <span
                className={styles.startActionIcon}
                aria-hidden="true"
              >
                ▦
              </span>

              <span className={styles.startActionCopy}>
                <strong>
                  Create or Move Your Business
                </strong>

                <small>
                  Set up a new workspace or bring
                  your business to JCS.
                </small>
              </span>

              <span aria-hidden="true">›</span>
            </Link>

            <a
              href="#platform"
              className={styles.startAction}
            >
              <span
                className={styles.startActionIcon}
                aria-hidden="true"
              >
                ▶
              </span>

              <span className={styles.startActionCopy}>
                <strong>
                  Explore Interactive Demo
                </strong>

                <small>
                  See the platform experience
                  before creating your business.
                </small>
              </span>

              <span aria-hidden="true">›</span>
            </a>
          </div>
        </div>

        {/* =================================================
            RIGHT / MOBILE BELOW — ONE PLATFORM PREVIEW
        ================================================= */}

        <div
          id="platform"
          className={styles.platformPreview}
        >
          <div className={styles.platformPreviewHeading}>
            <span />
            <div>
              <strong>PLATFORM PREVIEW</strong>
              <small>
                A clean workspace for owners,
                teams and customers.
              </small>
            </div>
          </div>

          <div
            className={styles.dashboardWindow}
            data-background={
              platformScreenBackgroundID ??
              "default"
            }
            aria-label="JCS Business Suite Dashboard preview"
          >
            {/* Dashboard Top Bar */}

            <div className={styles.dashboardTopBar}>
              <div className={styles.dashboardWorkspace}>
                <small>WORKSPACE</small>
                <strong>Dashboard</strong>
              </div>

              <span className={styles.syncBadge}>
                <i />
                Synchronized
              </span>

              <div className={styles.dashboardSearch}>
                Search modules and actions
                <kbd>⌘ K</kbd>
              </div>

              <div className={styles.dashboardTopActions}>
                <span aria-hidden="true">
                  {appearance === "dark"
                    ? "☾"
                    : "☀"}
                </span>

                <span aria-hidden="true">
                  ♢
                </span>

                <div>
                  <strong>Javier</strong>
                  <small>
                    Platform Administrator
                  </small>
                </div>
              </div>
            </div>

            <div className={styles.dashboardBody}>
              {/* Sidebar */}

              <aside className={styles.previewSidebar}>
                <div className={styles.previewSidebarBrand}>
                  <span>J</span>
                  <div>
                    <strong>JCS</strong>
                    <small>Business Suite</small>
                  </div>
                </div>

                <small className={styles.previewNavLabel}>
                  WORKSPACE
                </small>

                <nav>
                  <span
                    className={styles.previewNavActive}
                  >
                    ▦ Dashboard
                  </span>

                  <span>♙ Customers</span>
                  <span>◷ Appointments</span>
                  <span>⚙ App Settings</span>
                  <span>⌘ Platform Settings</span>
                  <span>◉ Executive Center</span>
                </nav>

                <small className={styles.previewNavLabel}>
                  MODULES
                </small>

                <nav>
                  <span>⌂ Customer Home</span>
                  <span>♨ Restaurant Store</span>
                  <span>▦ Catalog</span>
                  <span>♡ Favorites</span>
                  <span>▣ Products</span>
                  <span>◫ Inventory</span>
                  <span>◇ Services</span>
                  <span>▤ Orders</span>
                  <span>▥ Universal POS</span>
                  <span>♙ Employees</span>
                  <span>♧ Providers</span>
                  <span>◷ Calendar & Events</span>
                  <span>◈ Transportation</span>
                  <span>↩ Returns</span>
                  <span>▧ Receiving</span>
                  <span>⇢ Shipping</span>
                  <span>◎ Accounting</span>
                  <span>⌁ Reports</span>
                  <span>△ Business Insights</span>
                  <span>♢ Notifications</span>
                  <span>⌘ Compliance</span>
                  <span>▦ Facilities</span>
                  <span>⚙ Users</span>
                </nav>

                <div className={styles.previewSidebarFooter}>
                  <span>J</span>
                  <small>Sign Out</small>
                </div>
              </aside>

              {/* Main Dashboard */}

              <div className={styles.previewDashboardMain}>
                {/* ==========================================
                    HERO CARD — SAME HIERARCHY AS DASHBOARD
                ========================================== */}

                <section className={styles.previewHeroCard}>
                  <div className={styles.previewHeroContent}>
                    <div className={styles.previewLogoArea}>
                      {resolvedPlatformLogoURL ? (
                        <img
                          src={resolvedPlatformLogoURL}
                          alt={resolvedPlatformName}
                        />
                      ) : (
                        <strong>JCS</strong>
                      )}
                    </div>

                    <div className={styles.previewHeroTagline}>
                      {resolvedPlatformTagline}
                    </div>

                    <div className={styles.executiveOverview}>
                      <span aria-hidden="true">
                        ✦
                      </span>

                      <div>
                        <small>
                          Executive overview
                        </small>

                        <strong>
                          Your workspace is configured
                          and operating normally.
                        </strong>

                        <p>
                          Live information is
                          synchronized with the current
                          workspace.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Command Center is INSIDE Hero */}

                  <aside
                    className={
                      styles.previewHeroCommandCenter
                    }
                  >
                    <small>
                      GOOD MORNING, JAVIER 👋
                    </small>

                    <h3>
                      Command Center
                    </h3>

                    <p>
                      for your business
                    </p>

                    <div
                      className={
                        styles.previewDateCard
                      }
                    >
                      <span>
                        Saturday, August 22, 2026
                      </span>

                      <strong>
                        12:28:04 AM
                      </strong>
                    </div>

                    <div
                      className={
                        styles.previewWeatherCard
                      }
                    >
                      <div>
                        <span>☁</span>

                        <p>
                          <strong>
                            Partly cloudy
                          </strong>

                          <small>
                            Feels like 70°F
                          </small>
                        </p>
                      </div>

                      <strong>
                        67°F
                      </strong>

                      <small>
                        Toledo, Ohio
                      </small>

                      <div
                        className={
                          styles.previewWeatherStats
                        }
                      >
                        <span>
                          <strong>86%</strong>
                          Humidity
                        </span>

                        <span>
                          <strong>4 mph</strong>
                          Wind
                        </span>
                      </div>

                      <footer>
                        <small>
                          Updated 12:27 AM
                        </small>

                        <span>
                          <i />
                          Active
                        </span>
                      </footer>
                    </div>
                  </aside>
                </section>

                {/* ==========================================
                    FOUR REAL DASHBOARD METRIC CARDS
                ========================================== */}

                <div className={styles.previewMetricsGrid}>
                  <article>
                    <span>Revenue today</span>
                    <strong>$18,420</strong>
                    <small>
                      Completed sales recorded today
                    </small>
                    <b>Live</b>
                  </article>

                  <article>
                    <span>Open orders</span>
                    <strong>24</strong>
                    <small>
                      Orders require attention
                    </small>
                    <b>Current</b>
                  </article>

                  <article>
                    <span>Customers</span>
                    <strong>142</strong>
                    <small>
                      Business customer records
                    </small>
                    <b>Total</b>
                  </article>

                  <article>
                    <span>Active products</span>
                    <strong>94</strong>
                    <small>
                      Products ready for sale
                    </small>
                    <b>Healthy</b>
                  </article>
                </div>

                {/* ==========================================
                    LOWER DASHBOARD
                ========================================== */}

                <div className={styles.previewLowerDashboard}>
                  <div className={styles.previewLowerMain}>
                    {/* Quick Access */}

                    <section className={styles.previewSectionCard}>
                      <header>
                        <div>
                          <small>QUICK ACCESS</small>
                          <strong>
                            Your most-used business tools
                          </strong>
                        </div>
                      </header>

                      <div className={styles.previewQuickGrid}>
                        <span>▥ Point of Sale</span>
                        <span>▦ Cash Register</span>
                        <span>△ Business Insights</span>
                      </div>
                    </section>

                    {/* Store */}

                    <section className={styles.previewSectionCard}>
                      <header>
                        <div>
                          <small>STORE</small>
                          <strong>
                            Customer-facing experiences
                          </strong>
                        </div>
                      </header>

                      <div className={styles.previewModuleGrid}>
                        <span>⌂ Customer Home</span>
                        <span>♨ Restaurant Store</span>
                        <span>▦ Catalog</span>
                        <span>♡ Favorites</span>
                        <span>♙ Account</span>
                      </div>
                    </section>

                    {/* Business */}

                    <section className={styles.previewSectionCard}>
                      <header>
                        <div>
                          <small>BUSINESS</small>
                          <strong>
                            Sales and financial performance
                          </strong>
                        </div>
                      </header>

                      <div className={styles.previewModuleGrid}>
                        <span>▥ Point of Sale</span>
                        <span>▧ Cash Register</span>
                        <span>△ Insights</span>
                        <span>◎ Accounting</span>
                        <span>⌁ Reports</span>
                      </div>
                    </section>

                    {/* Operations */}

                    <section className={styles.previewSectionCard}>
                      <header>
                        <div>
                          <small>OPERATIONS</small>
                          <strong>
                            Daily workflows and fulfillment
                          </strong>
                        </div>
                      </header>

                      <div className={styles.previewModuleGrid}>
                        <span>▣ Products</span>
                        <span>◫ Inventory</span>
                        <span>▤ Orders</span>
                        <span>▧ Receiving</span>
                        <span>⇢ Shipping</span>
                        <span>↩ Returns</span>
                        <span>◷ Appointments</span>
                        <span>◈ Transportation</span>
                      </div>
                    </section>

                    {/* Management */}

                    <section className={styles.previewSectionCard}>
                      <header>
                        <div>
                          <small>MANAGEMENT</small>
                          <strong>
                            People and business control
                          </strong>
                        </div>
                      </header>

                      <div className={styles.previewModuleGrid}>
                        <span>♙ Customers</span>
                        <span>♟ Employees</span>
                        <span>♧ Providers</span>
                        <span>⚙ App Settings</span>
                        <span>⌘ Users</span>
                        <span>◇ Compliance</span>
                      </div>
                    </section>
                  </div>

                  {/* ======================================
                      RIGHT SIDE DASHBOARD CARDS
                  ====================================== */}

                  <aside className={styles.previewLowerAside}>
                    <section className={styles.previewSofiaCard}>
                      <header>
                        <span>✦</span>

                        <div>
                          <small>
                            SOFÍA INTELLIGENCE
                          </small>

                          <strong>
                            Business Assistant
                          </strong>
                        </div>

                        <b>ACTIVE</b>
                      </header>

                      <p>
                        Your business intelligence is
                        ready to help with decisions,
                        performance and opportunities.
                      </p>

                      <button type="button">
                        Ask Sofía
                        <span>›</span>
                      </button>
                    </section>

                    <section className={styles.previewWorkspaceCard}>
                      <small>
                        WORKSPACE
                      </small>

                      <strong>
                        JCS Business Suite
                      </strong>

                      <div>
                        <span>
                          <b>24 / 7</b>
                          Workspace access
                        </span>

                        <span>
                          <b>23</b>
                          Active modules
                        </span>

                        <span>
                          <b>Online</b>
                          Platform status
                        </span>
                      </div>
                    </section>

                    <section className={styles.previewActivityCard}>
                      <small>
                        RECENT ACTIVITY
                      </small>

                      <strong>
                        Business activity
                      </strong>

                      <div>
                        <span>
                          Order #1042 completed
                        </span>

                        <span>
                          New customer added
                        </span>

                        <span>
                          Inventory synchronized
                        </span>

                        <span>
                          Payment received
                        </span>
                      </div>
                    </section>

                    <section
                      className={
                        styles.previewBusinessHealthCard
                      }
                    >
                      <header>
                        <div>
                          <small>
                            BUSINESS HEALTH
                          </small>

                          <strong>
                            Operating normally
                          </strong>
                        </div>

                        <span>
                          Healthy
                        </span>
                      </header>

                      <div
                        className={
                          styles.previewBusinessHealthScore
                        }
                      >
                        <strong>
                          96%
                        </strong>

                        <div>
                          <span>
                            Overall readiness
                          </span>

                          <small>
                            Core business systems are
                            synchronized and available.
                          </small>
                        </div>
                      </div>

                      <div
                        className={
                          styles.previewBusinessHealthGrid
                        }
                      >
                        <span>
                          <b>Online</b>
                          Platform
                        </span>

                        <span>
                          <b>Healthy</b>
                          Inventory
                        </span>

                        <span>
                          <b>Ready</b>
                          Payments
                        </span>

                        <span>
                          <b>Active</b>
                          Operations
                        </span>
                      </div>
                    </section>
                  </aside>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className={styles.section}
      >
        <div className={styles.sectionHeading}>
          <span>Core Features</span>

          <h2>
            Sell, operate and understand your
            business.
          </h2>
        </div>

        <div className={styles.featureGrid}>
          {FEATURE_GROUPS.map((feature) => (
            <article
              key={feature.title}
              className={styles.featureCard}
            >
              <div className={styles.featureIcon}>
                {feature.icon}
              </div>

              <div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>

              <div className={styles.tagList}>
                {feature.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        id="business-tools"
        className={styles.section}
      >
        <div className={styles.sectionHeading}>
          <span>Business Tools</span>

          <h2>
            Professional tools ready for real
            operations.
          </h2>
        </div>

        <div className={styles.toolsGrid}>
          {BUSINESS_TOOLS.map((tool) => (
            <article
              key={tool.title}
              className={styles.toolCard}
            >
              <div className={styles.toolIcon}>
                {tool.icon}
              </div>

              <h3>{tool.title}</h3>
              <p>{tool.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="industries"
        className={styles.industriesSection}
      >
        <div className={styles.sectionHeading}>
          <span>All Industries Supported</span>

          <h2>
            One platform. Hundreds of business
            models.
          </h2>

          <p>
            JCS Business Suite currently includes{" "}
            <strong>
              {BusinessModeStatistics.totalCategories}
            </strong>{" "}
            categories and{" "}
            <strong>
              {BusinessModeStatistics.totalModes}
            </strong>{" "}
            business modes from the master Business
            Mode Library.
          </p>
        </div>

        <div className={styles.industryList}>
          {allCategories.map((category) => {
            const isExpanded =
              expandedCategoryID === category.id;

            return (
              <article
                key={category.id}
                className={[
                  styles.industryCard,
                  isExpanded
                    ? styles.industryCardExpanded
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <button
                  type="button"
                  onClick={() =>
                    toggleCategory(category)
                  }
                  aria-expanded={isExpanded}
                >
                  <span className={styles.industryEmoji}>
                    {CATEGORY_EMOJI[category.title] ??
                      "🏢"}
                  </span>

                  <span className={styles.industryCopy}>
                    <strong>{category.title}</strong>

                    <small>
                      {category.modes.length} business
                      types
                    </small>
                  </span>

                  <span className={styles.chevron}>
                    {isExpanded ? "−" : "+"}
                  </span>
                </button>

                {isExpanded && (
                  <div className={styles.modeList}>
                    {category.modes.map((mode) => (
                      <span key={mode.id}>
                        {mode.name}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>

      </section>

      <section className={styles.callToAction}>
        <div>
          <span>Ready to begin?</span>

          <h2>
            Create your intelligent business
            workspace today.
          </h2>

          <p>
            Start with your industry, configure your
            business and enter a workspace designed
            to grow with you.
          </p>
        </div>

        <div className={styles.callToActionButtons}>
          <Link
            href="/create-business"
            className={styles.primaryButton}
          >
            Create Business
            <span aria-hidden="true">→</span>
          </Link>

          <Link
            href="/login"
            className={styles.secondaryButton}
          >
            Sign In
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <span className={styles.brandMark}>
            {resolvedPlatformLogoURL ? (
              <img
                src={resolvedPlatformLogoURL}
                alt={resolvedPlatformName}
                className={styles.brandLogoImage}
              />
            ) : (
              "JCS"
            )}
          </span>

          <div>
            <strong>{resolvedPlatformName}</strong>
            <p>{resolvedPlatformTagline}</p>
          </div>
        </div>

        <div className={styles.footerLinks}>
          <a href="#platform">Platform</a>
          <a href="#features">Features</a>
          <a href="#industries">Industries</a>
          <Link href="/login">Sign In</Link>
        </div>

        <small>
          © {new Date().getFullYear()} JCS Business
          Suite. All rights reserved.
        </small>
      </footer>

      <div className={styles.mobileBottomBar}>
        <Link
          href="/login"
          className={styles.mobileSignIn}
        >
          Sign In
        </Link>

        <Link
          href="/create-business"
          className={styles.mobileGetStarted}
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}