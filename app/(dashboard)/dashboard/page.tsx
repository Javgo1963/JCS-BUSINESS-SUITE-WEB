"use client";

import {
  useState,
  type ReactNode,
} from "react";

import { useRouter } from "next/navigation";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/core/hooks/useAuth";

// MARK: - Dashboard Page

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <TemporaryDashboard />
    </ProtectedRoute>
  );
}

// MARK: - Temporary Dashboard

function TemporaryDashboard() {
  const router = useRouter();

  const {
    user,
    signOut,
    refreshUser,
  } = useAuth();

  const [isSigningOut, setIsSigningOut] =
    useState(false);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [actionMessage, setActionMessage] =
    useState<string | null>(null);

  // MARK: - User Information

  const displayName =
    user?.displayName?.trim() ||
    user?.email?.split("@")[0] ||
    "JCS User";

  const email =
    user?.email ||
    "No email is available.";

  const emailVerificationLabel =
    user?.emailVerified
      ? "Verified"
      : "Pending verification";

  // MARK: - Sign Out

  async function handleSignOut(): Promise<void> {
    setActionMessage(null);
    setIsSigningOut(true);

    try {
      await signOut();
      router.replace("/login");
    } catch {
      setActionMessage(
        "We could not sign you out. Please try again."
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  // MARK: - Refresh Session

  async function handleRefreshUser(): Promise<void> {
    setActionMessage(null);
    setIsRefreshing(true);

    try {
      await refreshUser();

      setActionMessage(
        "Your Firebase session was refreshed successfully."
      );
    } catch {
      setActionMessage(
        "We could not refresh your session."
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  // MARK: - View

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      {/* MARK: - Top Bar */}

      <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
        <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white shadow-lg dark:bg-white dark:text-slate-950">
              JCS
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
                JCS Business Suite
              </p>

              <h1 className="truncate text-lg font-semibold">
                Temporary Dashboard
              </h1>
            </div>
          </div>

          <button
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-sky-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-slate-900 dark:text-white dark:hover:bg-white/5"
            disabled={isSigningOut}
            onClick={handleSignOut}
            type="button"
          >
            {isSigningOut
              ? "Signing out..."
              : "Sign out"}
          </button>
        </div>
      </header>

      {/* MARK: - Dashboard Content */}

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome */}

        <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-2xl shadow-slate-950/15 sm:p-10">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.35),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.20),transparent_40%)]"
          />

          <div className="relative z-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">
              Authentication successful
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome, {displayName}
            </h2>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Your protected JCS Business Suite workspace is
              now connected to Firebase Authentication.
            </p>
          </div>
        </section>

        {/* Status Cards */}

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <StatusCard
            label="Authentication"
            title="Connected"
            description="Firebase recognized the current signed-in user."
          />

          <StatusCard
            label="Protected Route"
            title="Active"
            description="Unauthenticated visitors cannot open this dashboard."
          />

          <StatusCard
            label="Business Context"
            title="Next step"
            description="Tomorrow we will connect the user to the correct business."
          />
        </section>

        {/* Account and Modules */}

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
          {/* Account Information */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-7">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
                Firebase account
              </p>

              <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                Session information
              </h3>
            </div>

            <dl className="mt-7 space-y-5">
              <AccountRow
                label="Display name"
                value={displayName}
              />

              <AccountRow
                label="Email"
                value={email}
              />

              <AccountRow
                label="Email status"
                value={emailVerificationLabel}
              />

              <AccountRow
                label="Firebase UID"
                value={user?.uid || "Unavailable"}
              />
            </dl>

            <button
              className="mt-7 flex h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-sky-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-slate-950 dark:text-white dark:hover:bg-white/5"
              disabled={isRefreshing}
              onClick={handleRefreshUser}
              type="button"
            >
              {isRefreshing
                ? "Refreshing session..."
                : "Refresh Firebase session"}
            </button>

            {actionMessage ? (
              <p
                aria-live="polite"
                className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700 dark:bg-white/5 dark:text-slate-300"
              >
                {actionMessage}
              </p>
            ) : null}
          </div>

          {/* Future Modules */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-7">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
                Platform modules
              </p>

              <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                Your future business workspace
              </h3>

              <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">
                These cards are temporary. Later they will be
                controlled by the business category, role,
                permissions, and Module Registry.
              </p>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <ModulePlaceholder
                title="Point of Sale"
                description="Sales and checkout"
              />

              <ModulePlaceholder
                title="Products"
                description="Catalog management"
              />

              <ModulePlaceholder
                title="Inventory"
                description="Stock and locations"
              />

              <ModulePlaceholder
                title="Customers"
                description="Customer relationships"
              />

              <ModulePlaceholder
                title="Employees"
                description="Staff and permissions"
              />

              <ModulePlaceholder
                title="Reports"
                description="Business performance"
              />
            </div>
          </div>
        </section>

        {/* Tomorrow */}

        <section className="mt-8 rounded-3xl border border-sky-200 bg-sky-50 p-6 dark:border-sky-500/20 dark:bg-sky-500/10 sm:p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
            Tomorrow
          </p>

          <h3 className="mt-2 text-2xl font-semibold tracking-tight">
            Create Business and Business Context
          </h3>

          <p className="mt-3 max-w-4xl leading-7 text-slate-700 dark:text-slate-300">
            We will connect Firebase Authentication with
            AppUser, Business, PlatformClient and the business
            creation operation so every new business appears
            automatically in the Platform Executive Center.
          </p>
        </section>
      </div>
    </main>
  );
}

// MARK: - Status Card

interface StatusCardProps {
  label: string;
  title: string;
  description: string;
}

function StatusCard({
  label,
  title,
  description,
}: StatusCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
        {label}
      </p>

      <h3 className="mt-3 text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
        {description}
      </p>
    </article>
  );
}

// MARK: - Account Row

interface AccountRowProps {
  label: string;
  value: string;
}

function AccountRow({
  label,
  value,
}: AccountRowProps) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-500">
        {label}
      </dt>

      <dd className="mt-1 break-all text-sm font-medium text-slate-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}

// MARK: - Module Placeholder

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

function ModulePlaceholder({
  title,
  description,
}: ModulePlaceholderProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-950">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sm font-bold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
        JCS
      </div>

      <h4 className="font-semibold">
        {title}
      </h4>

      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
        {description}
      </p>

      <span className="mt-4 inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
        Coming soon
      </span>
    </article>
  );
}