"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { useRouter } from "next/navigation";

import { LoadingScreen } from "@/components/auth/LoadingScreen";

import { db } from "@/core/firebase/firebase";

import { useAuth } from "@/core/hooks/useAuth";

import {
  normalizePlatformClientRecord,
  platformClientCanAccessApp,
  platformClientDisplaySubscriptionStatus,
} from "@/features/platform-executive-center/PlatformClientDomain";

import type {
  PlatformClientFirestoreData,
} from "@/features/platform-executive-center/PlatformExecutiveTypes";

// ============================================================
// MARK: - H2-C6D-J-F
// JCS_WEB_PLATFORMCLIENT_SUBSCRIPTION_GATE_H2_C6D_J_F
//
// Web authority parity with macOS / iPadOS / iOS:
//
// PlatformAdmin
// → Global workspace
// → NO businessID
// → NO PlatformClient
// → NO subscription gate
//
// Business tenant
// → businessID
// → /platformClients/{businessID}
// → normalizePlatformClientRecord(...)
// → platformClientCanAccessApp(...)
// → Dashboard OR Subscription Required
//
// Firestore /platformClients/{businessID} remains canonical.
// ============================================================

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

type SubscriptionGateState =
  | "idle"
  | "checking"
  | "allowed"
  | "blocked"
  | "error";

export function ProtectedRoute({
  children,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const router = useRouter();

  const {
    isAuthenticated,
    isLoading,

    isBusinessContextReady,
    isLoadingBusinessContext,

    isPlatformAdministrator,
    businessID,

    signOut,
  } = useAuth();

  const [
    subscriptionGateState,
    setSubscriptionGateState,
  ] = useState<SubscriptionGateState>(
    "idle"
  );

  const [
    subscriptionStatus,
    setSubscriptionStatus,
  ] = useState("");

  const [
    subscriptionPlan,
    setSubscriptionPlan,
  ] = useState("");

  const [
    verificationError,
    setVerificationError,
  ] = useState("");

  // ============================================================
  // MARK: - Authentication Redirect
  // ============================================================

  useEffect(() => {
    if (
      !isLoading &&
      !isAuthenticated
    ) {
      router.replace(
        redirectTo
      );
    }
  }, [
    isAuthenticated,
    isLoading,
    redirectTo,
    router,
  ]);

  // ============================================================
  // MARK: - Canonical PlatformClient Verification
  // ============================================================

  const verifyPlatformClientAccess =
    useCallback(
      async (): Promise<void> => {
        // Authentication is handled independently.
        if (
          isLoading ||
          !isAuthenticated
        ) {
          setSubscriptionGateState(
            "idle"
          );

          return;
        }

        /*
         PlatformAdmin is a GLOBAL platform identity.

         It must never require:
         - businessID
         - PlatformClient
         - Stripe
         - trial
         - subscription

         This mirrors the native Apple RootFlow authority.
        */
        if (
          isPlatformAdministrator
        ) {
          setVerificationError("");
          setSubscriptionStatus("");
          setSubscriptionPlan("");

          setSubscriptionGateState(
            "allowed"
          );

          return;
        }

        /*
         Wait until AuthProvider has resolved the authenticated
         JCS AppUser / business identity before reading the
         canonical PlatformClient document.
        */
        if (
          isLoadingBusinessContext ||
          !isBusinessContextReady
        ) {
          setSubscriptionGateState(
            "checking"
          );

          return;
        }

        const normalizedBusinessID =
          (
            businessID ?? ""
          ).trim();

        if (!normalizedBusinessID) {
          setSubscriptionGateState(
            "error"
          );

          setVerificationError(
            "This business account does not have a valid business identity."
          );

          return;
        }

        setSubscriptionGateState(
          "checking"
        );

        setVerificationError("");

        try {
          const reference =
            doc(
              db,
              "platformClients",
              normalizedBusinessID
            );

          const snapshot =
            await getDoc(
              reference
            );

          /*
           Fail closed.

           A business tenant without its canonical
           PlatformClient cannot enter the paid workspace.
          */
          if (!snapshot.exists()) {
            setSubscriptionPlan("");
            setSubscriptionStatus(
              "Subscription Required"
            );

            setSubscriptionGateState(
              "blocked"
            );

            return;
          }

          const platformClient =
            normalizePlatformClientRecord(
              snapshot.id,
              snapshot.data() as
                PlatformClientFirestoreData
            );

          setSubscriptionPlan(
            platformClient.planName
          );

          setSubscriptionStatus(
            platformClientDisplaySubscriptionStatus(
              platformClient
            )
          );

          if (
            platformClientCanAccessApp(
              platformClient
            )
          ) {
            setSubscriptionGateState(
              "allowed"
            );

            return;
          }

          setSubscriptionGateState(
            "blocked"
          );
        } catch (error: unknown) {
          console.error(
            "❌ JCS Web PlatformClient subscription verification failed:",
            error
          );

          setSubscriptionGateState(
            "error"
          );

          setVerificationError(
            error instanceof Error
              ? error.message
              : "JCS Business Suite could not verify this business subscription."
          );
        }
      },
      [
        businessID,
        isAuthenticated,
        isBusinessContextReady,
        isLoading,
        isLoadingBusinessContext,
        isPlatformAdministrator,
      ]
    );

  useEffect(() => {
    void verifyPlatformClientAccess();
  }, [
    verifyPlatformClientAccess,
  ]);

  // ============================================================
  // MARK: - Authentication Loading
  // ============================================================

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <LoadingScreen
        message="Redirecting to login..."
      />
    );
  }

  // ============================================================
  // MARK: - PlatformAdmin Global Bypass
  // ============================================================

  if (
    isPlatformAdministrator &&
    subscriptionGateState === "allowed"
  ) {
    return <>{children}</>;
  }

  // ============================================================
  // MARK: - Tenant Verification Loading
  // ============================================================

  if (
    isLoadingBusinessContext ||
    !isBusinessContextReady ||
    subscriptionGateState === "idle" ||
    subscriptionGateState === "checking"
  ) {
    return (
      <LoadingScreen
        message="Verifying your JCS Business Suite subscription..."
      />
    );
  }

  // ============================================================
  // MARK: - Authorized Business Tenant
  // ============================================================

  if (
    subscriptionGateState === "allowed"
  ) {
    return <>{children}</>;
  }

  // ============================================================
  // MARK: - Verification Error
  // ============================================================

  if (
    subscriptionGateState === "error"
  ) {
    return (
      <main
        className="
          min-h-screen
          bg-slate-50
          px-4
          py-10
          text-slate-950
          dark:bg-slate-950
          dark:text-white
        "
      >
        <section
          className="
            mx-auto
            flex
            min-h-[calc(100vh-5rem)]
            w-full
            max-w-3xl
            items-center
            justify-center
          "
        >
          <div
            className="
              w-full
              rounded-3xl
              border
              border-slate-200
              bg-white
              p-8
              text-center
              shadow-2xl
              shadow-slate-950/10
              dark:border-white/10
              dark:bg-slate-900
              sm:p-12
            "
          >
            <p
              className="
                text-sm
                font-semibold
                uppercase
                tracking-[0.22em]
                text-amber-600
                dark:text-amber-400
              "
            >
              JCS Business Suite
            </p>

            <h1
              className="
                mt-4
                text-3xl
                font-semibold
                tracking-tight
                sm:text-4xl
              "
            >
              Subscription verification unavailable
            </h1>

            <p
              className="
                mx-auto
                mt-5
                max-w-2xl
                text-base
                leading-7
                text-slate-600
                dark:text-slate-300
              "
            >
              We could not verify this business subscription.
              Your workspace has not been opened.
            </p>

            {verificationError ? (
              <p
                className="
                  mx-auto
                  mt-4
                  max-w-2xl
                  rounded-2xl
                  border
                  border-amber-200
                  bg-amber-50
                  px-4
                  py-3
                  text-sm
                  text-amber-900
                  dark:border-amber-400/20
                  dark:bg-amber-400/10
                  dark:text-amber-200
                "
              >
                {verificationError}
              </p>
            ) : null}

            <div
              className="
                mt-8
                flex
                flex-wrap
                justify-center
                gap-3
              "
            >
              <button
                type="button"
                onClick={() => {
                  void verifyPlatformClientAccess();
                }}
                className="
                  rounded-xl
                  bg-slate-950
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-slate-800
                  dark:bg-white
                  dark:text-slate-950
                  dark:hover:bg-slate-200
                "
              >
                Try Again
              </button>

              <button
                type="button"
                onClick={() => {
                  void signOut().finally(
                    () => {
                      router.replace(
                        "/login"
                      );
                    }
                  );
                }}
                className="
                  rounded-xl
                  border
                  border-slate-300
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  transition
                  hover:bg-slate-100
                  dark:border-white/20
                  dark:hover:bg-white/10
                "
              >
                Sign Out
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // ============================================================
  // MARK: - Subscription Required
  // ============================================================

  return (
    <main
      className="
        min-h-screen
        bg-slate-50
        px-4
        py-10
        text-slate-950
        dark:bg-slate-950
        dark:text-white
      "
    >
      <section
        className="
          mx-auto
          flex
          min-h-[calc(100vh-5rem)]
          w-full
          max-w-3xl
          items-center
          justify-center
        "
      >
        <div
          className="
            w-full
            overflow-hidden
            rounded-3xl
            border
            border-slate-200
            bg-white
            shadow-2xl
            shadow-slate-950/10
            dark:border-white/10
            dark:bg-slate-900
          "
        >
          <div
            className="
              border-b
              border-slate-200
              bg-slate-950
              px-8
              py-8
              text-white
              dark:border-white/10
              sm:px-12
            "
          >
            <p
              className="
                text-sm
                font-semibold
                uppercase
                tracking-[0.22em]
                text-sky-300
              "
            >
              JCS Business Suite
            </p>

            <h1
              className="
                mt-3
                text-3xl
                font-semibold
                tracking-tight
                sm:text-4xl
              "
            >
              Subscription Required
            </h1>

            <p
              className="
                mt-4
                max-w-2xl
                text-base
                leading-7
                text-slate-300
              "
            >
              This business does not currently have an active
              JCS Business Suite subscription or valid trial.
            </p>
          </div>

          <div
            className="
              px-8
              py-8
              sm:px-12
              sm:py-10
            "
          >
            <div
              className="
                grid
                gap-4
                sm:grid-cols-2
              "
            >
              <div
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-slate-50
                  p-5
                  dark:border-white/10
                  dark:bg-white/5
                "
              >
                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-[0.18em]
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Plan
                </p>

                <p
                  className="
                    mt-2
                    text-lg
                    font-semibold
                  "
                >
                  {subscriptionPlan ||
                    "JCS Business Suite"}
                </p>
              </div>

              <div
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-slate-50
                  p-5
                  dark:border-white/10
                  dark:bg-white/5
                "
              >
                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-[0.18em]
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Status
                </p>

                <p
                  className="
                    mt-2
                    text-lg
                    font-semibold
                  "
                >
                  {subscriptionStatus ||
                    "Subscription Required"}
                </p>
              </div>
            </div>

            <p
              className="
                mt-6
                text-sm
                leading-6
                text-slate-600
                dark:text-slate-300
              "
            >
              If you recently renewed or completed checkout,
              refresh the subscription status below.
            </p>

            <div
              className="
                mt-8
                flex
                flex-wrap
                gap-3
              "
            >
              <button
                type="button"
                onClick={() => {
                  void verifyPlatformClientAccess();
                }}
                className="
                  rounded-xl
                  bg-slate-950
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-slate-800
                  dark:bg-white
                  dark:text-slate-950
                  dark:hover:bg-slate-200
                "
              >
                Refresh Subscription
              </button>

              <button
                type="button"
                onClick={() => {
                  void signOut().finally(
                    () => {
                      router.replace(
                        "/login"
                      );
                    }
                  );
                }}
                className="
                  rounded-xl
                  border
                  border-slate-300
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  transition
                  hover:bg-slate-100
                  dark:border-white/20
                  dark:hover:bg-white/10
                "
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
