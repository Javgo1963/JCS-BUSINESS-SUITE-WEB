"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  allCategories,
  BusinessModeStatistics,
  type BusinessModeCategory,
} from "@/core/business-mode/BusinessModeLibrary";

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

const PLATFORM_PREVIEWS = [
  {
    icon: "▦",
    title: "Dashboard",
    description: "Insights and control",
  },
  {
    icon: "💳",
    title: "Universal POS",
    description: "Checkout for every industry",
  },
  {
    icon: "📦",
    title: "Inventory",
    description: "Products, SKU and locations",
  },
  {
    icon: "👥",
    title: "Customers",
    description: "CRM and order history",
  },
];

// MARK: - Component

export default function BusinessPromoView() {
  const [expandedCategoryID, setExpandedCategoryID] =
    useState<string | null>(null);

  const featuredCategories = useMemo(
    () => allCategories.slice(0, 12),
    []
  );

  const toggleCategory = (
    category: BusinessModeCategory
  ) => {
    setExpandedCategoryID((current) =>
      current === category.id ? null : category.id
    );
  };

  return (
    <main className={styles.page}>
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
            JCS
          </span>

          <span className={styles.brandCopy}>
            <strong>JCS Business Suite</strong>
            <small>Business Operating System</small>
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
        <div className={styles.heroContent}>
          <div className={styles.eyebrow}>
            <span>✦</span>
            One platform for every business
          </div>

          <h1>
            Build, run and grow your business from
            one intelligent platform.
          </h1>

          <p className={styles.heroDescription}>
            Connect sales, customers, employees,
            providers, inventory, payments, POS,
            online commerce, accounting, operations
            and business insights in one premium
            workspace.
          </p>

          <div className={styles.heroActions}>
            <Link
              href="/create-business"
              className={styles.primaryButton}
            >
              Start 7-Day Free Trial
              <span aria-hidden="true">→</span>
            </Link>

            <Link
              href="/login"
              className={styles.secondaryButton}
            >
              Sign In
            </Link>
          </div>

          <div className={styles.heroTrust}>
            <span>✓ No credit card required</span>
            <span>✓ Industry-specific setup</span>
            <span>✓ Works on every device</span>
          </div>
        </div>

        <div
          className={styles.heroDashboard}
          aria-label="JCS Business Suite dashboard preview"
        >
          <div className={styles.dashboardHeader}>
            <div>
              <small>Today</small>
              <strong>$18,420</strong>
              <span>
                Sales across POS, catalog and services
              </span>
            </div>

            <div className={styles.dashboardTrend}>
              ↗
            </div>
          </div>

          <div className={styles.dashboardMetrics}>
            <article>
              <span>Orders</span>
              <strong>142</strong>
              <small>+18% this week</small>
            </article>

            <article>
              <span>Profit</span>
              <strong>$7.8K</strong>
              <small>Healthy margin</small>
            </article>

            <article>
              <span>Stock</span>
              <strong>94%</strong>
              <small>Inventory ready</small>
            </article>
          </div>

          <div className={styles.dashboardFooter}>
            <span>✦ AI Setup</span>
            <span>▦ All-in-One</span>
            <span>⌘ Premium Workspace</span>
          </div>
        </div>
      </section>

      <section
        id="platform"
        className={styles.section}
      >
        <div className={styles.sectionHeading}>
          <span>Platform Preview</span>

          <h2>
            Everything your business needs,
            connected by design.
          </h2>

          <p>
            A clean workspace for owners, teams and
            customers, backed by one consistent
            business context.
          </p>
        </div>

        <div className={styles.previewGrid}>
          {PLATFORM_PREVIEWS.map((preview) => (
            <article
              key={preview.title}
              className={styles.previewCard}
            >
              <div className={styles.previewVisual}>
                <span>{preview.icon}</span>
                <strong>{preview.title}</strong>
              </div>

              <h3>{preview.title}</h3>
              <p>{preview.description}</p>
            </article>
          ))}
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
          {featuredCategories.map((category) => {
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

        {allCategories.length >
          featuredCategories.length && (
          <p className={styles.moreIndustries}>
            Plus{" "}
            {allCategories.length -
              featuredCategories.length}{" "}
            additional categories already available
            inside JCS Business Suite.
          </p>
        )}
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
            JCS
          </span>

          <div>
            <strong>JCS Business Suite</strong>
            <p>
              One intelligent platform for every
              business.
            </p>
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