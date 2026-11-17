"use client";

import {
  CircleUserRound,
  Heart,
  House,
  LayoutDashboard,
  ShoppingBag,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import JCSOfficialShell from
  "@/components/app-shell/JCSOfficialShell";

import CompanyLogoView from
  "@/features/business-branding/CompanyLogoView";

import {
  useBusinessLogo,
} from "@/features/business-branding/useBusinessLogo";

import {
  useBusinessContext,
} from "@/core/business-context/JCSBusinessContext";

import {
  signOut,
} from "@/core/services/AuthService";

import "./CustomerHomeView.css";

const ACCENT_COLORS:
  Record<string, string> = {
    blue: "#2563eb",
    copper: "#b87333",
    green: "#16a34a",
    purple: "#7c3aed",
    red: "#dc2626",
    orange: "#ea580c",
    pink: "#db2777",
    teal: "#0d9488",
    gray: "#64748b",
  };

function cleanText(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

export default function CustomerHomeView() {
  const router =
    useRouter();

  const {
    firebaseUser,
    appUser,
    business,
    appSettings,
    businessID,
    refresh,
  } = useBusinessContext();

  const [
    appearance,
    setAppearance,
  ] = useState<"light" | "dark">(
    "light"
  );

  const businessName =
    cleanText(
      business?.businessName
    ) ||
    "JCS Business Suite";

  const businessModeName =
    cleanText(
      business?.businessModeName
    ) ||
    "Customer Store";

  const accentName =
    cleanText(
      appSettings?.accentColorName
    ).toLowerCase() ||
    "blue";

  const accentColorCSS =
    ACCENT_COLORS[
      accentName
    ] ??
    "#2563eb";

  const currentUID =
    firebaseUser?.uid ?? "";

  const businessOwnerUID =
    cleanText(
      business?.ownerUID
    ) ||
    cleanText(
      appUser?.ownerUID
    ) ||
    currentUID;

  const businessLogo =
    useBusinessLogo({
      businessID,
      ownerUID:
        businessOwnerUID,
      createdByUID:
        currentUID,
      businessName,
      accentColorName:
        accentName,
      autoLoad:
        Boolean(
          businessID
        ),
    });

  const displayName =
    cleanText(
      appUser?.fullName
    ) ||
    cleanText(
      firebaseUser
        ?.displayName
    ) ||
    "Customer";

  const firstName =
    displayName
      .split(/\s+/)
      .filter(Boolean)[0] ??
    "Customer";

  const role =
    cleanText(
      appUser?.roleRawValue
    ) ||
    cleanText(
      appUser?.role
    ) ||
    "customer";

  const navigationItems =
    useMemo(
      () => [
        {
          id:
            "dashboard",
          title:
            "Dashboard",
          path:
            "/dashboard",
          icon:
            LayoutDashboard,
          onSelect: () =>
            router.push(
              "/dashboard"
            ),
        },
      ],
      [router]
    );

  const moduleItems =
    useMemo(
      () => [
        {
          id:
            "customer-home",
          title:
            "Customer Home",
          subtitle:
            "Shopping home",
          iconName:
            "house",
          path:
            "/customer-home",
          isActive:
            true,
          onSelect: () =>
            router.push(
              "/customer-home"
            ),
        },
        {
          id:
            "catalog",
          title:
            "Catalog",
          subtitle:
            "Browse products",
          iconName:
            "catalog",
          path:
            "/catalog",
          onSelect: () =>
            router.push(
              "/catalog"
            ),
        },
        {
          id:
            "favorites",
          title:
            "Favorites",
          subtitle:
            "Saved products",
          iconName:
            "favorites",
          path:
            "/favorites",
          onSelect: () =>
            router.push(
              "/favorites"
            ),
        },
        {
          id:
            "account",
          title:
            "Account",
          subtitle:
            "Profile",
          iconName:
            "account",
          path:
            "/account",
          onSelect: () =>
            router.push(
              "/account"
            ),
        },
      ],
      [router]
    );

  const commandItems =
    useMemo(
      () =>
        moduleItems.map(
          (item) => ({
            id:
              item.id,
            title:
              item.title,
            subtitle:
              item.subtitle,
            iconName:
              item.iconName,
            onSelect:
              item.onSelect,
          })
        ),
      [
        moduleItems,
      ]
    );

  return (
    <JCSOfficialShell
      workspaceTitle="Customer Home"
      accentName={
        accentName
      }
      accentColorCSS={
        accentColorCSS
      }
      appearance={
        appearance
      }
      backgroundID={
        appSettings
          ?.backgroundID ??
        "default"
      }
      customBackgroundURL={
        appSettings
          ?.backgroundDownloadURL ??
        ""
      }
      identity={{
        name:
          businessName,

        subtitle:
          businessModeName,

        tagline:
          "Customer shopping and account access",

        logoNode: (
          <CompanyLogoView
            branding={
              businessLogo
                .activeBranding
            }
            logo={
              businessLogo
                .activeLogo
            }
            businessName={
              businessName
            }
            accentColor={
              accentColorCSS
            }
            size="custom"
            width={72}
            height={72}
            cornerRadius={0}
            showBackground={
              false
            }
            showBorder={
              false
            }
            enableShadow={
              false
            }
            isLoading={
              businessLogo
                .isLoading
            }
            priority
          />
        ),

        isLoading:
          businessLogo
            .isLoading,

        isPlatform:
          false,
      }}
      user={{
        firebaseUID:
          firebaseUser
            ?.uid ??
          "",

        firstName,

        displayName,

        email:
          firebaseUser
            ?.email ??
          undefined,

        role,

        imageURL:
          appUser
            ?.profileImageURL,
      }}
      navigationItems={
        navigationItems
      }
      moduleItems={
        moduleItems
      }
      commandPalette={{
        items:
          commandItems,

        title:
          "Customer actions",

        subtitle:
          "Shop and manage your account",
      }}
      actions={{
        onOpenDashboard: () =>
          router.push(
            "/dashboard"
          ),

        onOpenAccount: () =>
          router.push(
            "/account"
          ),

        onOpenSettings: () => {},

        onToggleAppearance: () => {
          setAppearance(
            current =>
              current ===
              "light"
                ? "dark"
                : "light"
          );
        },

        onOpenNotifications:
          undefined,

        onSignOut:
          async () => {
            await signOut();

            router.replace(
              "/login"
            );
          },

        onUserAvatarUpdated:
          refresh,
      }}
      liveStatus={{
        isLoading:
          businessLogo
            .isLoading,

        errorMessage:
          businessLogo
            .errorMessage ||
          null,

        refreshedAt:
          null,

        languageCode:
          "en",

        onRefresh:
          async () => {
            await refresh();

            await businessLogo
              .reloadActiveLogo();
          },
      }}
      visibleModuleCount={
        moduleItems.length
      }
    >
      <main className="jcs-customer-home">
        <section className="jcs-customer-home__hero">
          <div>
            <span className="jcs-customer-home__eyebrow">
              CUSTOMER HOME
            </span>

            <h1>
              Welcome, {firstName}.
            </h1>

            <p>
              Shop {businessName}, save your favorite items,
              and manage your customer account from one place.
            </p>
          </div>

          <div className="jcs-customer-home__hero-logo">
            <CompanyLogoView
              branding={
                businessLogo
                  .activeBranding
              }
              logo={
                businessLogo
                  .activeLogo
              }
              businessName={
                businessName
              }
              accentColor={
                accentColorCSS
              }
              size="custom"
              width={180}
              height={110}
              cornerRadius={18}
              showBackground
              showBorder
              enableShadow
              isLoading={
                businessLogo
                  .isLoading
              }
              priority
            />
          </div>
        </section>

        <section
          className="jcs-customer-home__grid"
          aria-label="Customer actions"
        >
          <button
            type="button"
            className="jcs-customer-home__card"
            onClick={() =>
              router.push(
                "/catalog"
              )
            }
          >
            <span className="jcs-customer-home__card-icon">
              <ShoppingBag
                size={26}
              />
            </span>

            <span>
              <strong>
                Catalog
              </strong>

              <small>
                Browse products
              </small>
            </span>
          </button>

          <button
            type="button"
            className="jcs-customer-home__card"
            onClick={() =>
              router.push(
                "/favorites"
              )
            }
          >
            <span className="jcs-customer-home__card-icon">
              <Heart
                size={26}
              />
            </span>

            <span>
              <strong>
                Favorites
              </strong>

              <small>
                Your saved products
              </small>
            </span>
          </button>

          <button
            type="button"
            className="jcs-customer-home__card"
            onClick={() =>
              router.push(
                "/account"
              )
            }
          >
            <span className="jcs-customer-home__card-icon">
              <CircleUserRound
                size={26}
              />
            </span>

            <span>
              <strong>
                Account
              </strong>

              <small>
                Profile and customer details
              </small>
            </span>
          </button>

          <button
            type="button"
            className="jcs-customer-home__card"
            onClick={() =>
              router.push(
                "/customer-home"
              )
            }
          >
            <span className="jcs-customer-home__card-icon">
              <House
                size={26}
              />
            </span>

            <span>
              <strong>
                Customer Home
              </strong>

              <small>
                Return to your shopping home
              </small>
            </span>
          </button>
        </section>
      </main>
    </JCSOfficialShell>
  );
}
