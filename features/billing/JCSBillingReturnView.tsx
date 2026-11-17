"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  useRouter,
} from "next/navigation";

import {
  db,
} from "@/core/firebase/firebase";

import {
  useAuth,
} from "@/core/hooks/useAuth";

import {
  canAccessBusiness,
} from "@/core/business-context/JCSAccessibleBusinessService";

import {
  normalizePlatformClientRecord,
  platformClientCanAccessApp,
  platformClientDisplaySubscriptionStatus,
} from "@/features/platform-executive-center/PlatformClientDomain";

import type {
  PlatformClientFirestoreData,
} from "@/features/platform-executive-center/PlatformExecutiveTypes";

import styles from
  "./JCSBilling.module.css";


type VerificationState =
  | "waiting"
  | "checking"
  | "allowed"
  | "blocked"
  | "error";


const WORKSPACE_PROGRESS_STAGES = [
  "Preparing your workspace",
  "Setting up your workspace",
  "Almost ready",
  "Finalizing access",
] as const;


function clean(
  value: unknown
): string {

  return typeof value === "string"
    ? value.trim()
    : "";
}


export default function JCSBillingReturnView() {

  const router =
    useRouter();

  const {
    isAuthenticated,
    isLoading,

    isBusinessContextReady,
    isLoadingBusinessContext,

    businessID,
    accessibleBusinesses,
  } =
    useAuth();


  const [
    sessionID,
    setSessionID,
  ] =
    useState("");


  const [
    storedBillingBusinessID,
    setStoredBillingBusinessID,
  ] =
    useState("");


  const [
    storedBillingPlan,
    setStoredBillingPlan,
  ] =
    useState("");


  const [
    storedBillingFlow,
    setStoredBillingFlow,
  ] =
    useState("");


  const [
    billingReturnStateReady,
    setBillingReturnStateReady,
  ] =
    useState(false);


  const [
    verificationState,
    setVerificationState,
  ] =
    useState<VerificationState>(
      "waiting"
    );


  const [
    subscriptionPlan,
    setSubscriptionPlan,
  ] =
    useState("");


  const [
    subscriptionStatus,
    setSubscriptionStatus,
  ] =
    useState("");


  const [
    verificationError,
    setVerificationError,
  ] =
    useState("");


  useEffect(() => {

    const params =
      new URLSearchParams(
        window.location.search
      );

    setSessionID(
      clean(
        params.get(
          "session_id"
        )
      )
    );


    setStoredBillingBusinessID(
      clean(
        window.sessionStorage.getItem(
          "jcsBillingBusinessID"
        )
      )
    );

    setStoredBillingPlan(
      clean(
        window.sessionStorage.getItem(
          "jcsBillingPlan"
        )
      )
    );

    setStoredBillingFlow(
      clean(
        window.sessionStorage.getItem(
          "jcsBillingFlow"
        )
      )
    );


    setBillingReturnStateReady(
      true
    );

  }, []);


  useEffect(() => {

    if (
      !isLoading &&
      !isAuthenticated
    ) {

      router.replace(
        "/login"
      );
    }

  }, [
    isAuthenticated,
    isLoading,
    router,
  ]);


  const verifyCanonicalSubscription =
    useCallback(
      async (): Promise<void> => {

        const normalizedBillingBusinessID =
          clean(
            storedBillingBusinessID
          );


        if (
          !normalizedBillingBusinessID
        ) {

          setVerificationState(
            "error"
          );

          setVerificationError(
            "JCS could not recover the exact business associated with this billing return."
          );

          return;
        }


        if (
          !canAccessBusiness(
            accessibleBusinesses,
            normalizedBillingBusinessID
          )
        ) {

          setVerificationState(
            "error"
          );

          setVerificationError(
            "The authenticated JCS user is not authorized for the business associated with this billing return."
          );

          return;
        }


        setVerificationState(
          "checking"
        );

        setVerificationError(
          ""
        );


        try {

          const reference =
            doc(
              db,
              "platformClients",
              normalizedBillingBusinessID
            );


          const snapshot =
            await getDoc(
              reference
            );


          if (
            !snapshot.exists()
          ) {

            setSubscriptionPlan(
              ""
            );

            setSubscriptionStatus(
              "Subscription Required"
            );

            setVerificationState(
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

            setVerificationState(
              "allowed"
            );

            return;
          }


          setVerificationState(
            "blocked"
          );

        } catch (error: unknown) {

          console.error(
            "❌ JCS billing return verification failed:",
            error
          );


          setVerificationState(
            "error"
          );

          setVerificationError(
            error instanceof Error
              ? error.message
              : "JCS could not verify the subscription."
          );
        }
      },
      [
        accessibleBusinesses,
        storedBillingBusinessID,
      ]
    );


  useEffect(() => {

    if (
      !billingReturnStateReady ||
      isLoading ||
      !isAuthenticated ||
      isLoadingBusinessContext ||
      !isBusinessContextReady
    ) {

      return;
    }


    void verifyCanonicalSubscription();

  }, [    billingReturnStateReady,

    isAuthenticated,
    isBusinessContextReady,
    isLoading,
    isLoadingBusinessContext,
    verifyCanonicalSubscription,
  ]);


  const normalizedBillingBusinessID =
    clean(
      storedBillingBusinessID
    );


  useEffect(() => {

    if (
      verificationState !==
      "allowed"
    ) {
      return;
    }

    const redirectTimer =
      window.setTimeout(
        () => {
          router.replace(
            "/dashboard"
          );
        },
        1400
      );

    return () => {
      window.clearTimeout(
        redirectTimer
      );
    };

  }, [
    router,
    verificationState,
  ]);


  const progressStageIndex =
    verificationState ===
      "allowed"
      ? 3
      : verificationState ===
          "blocked"
        ? 2
        : verificationState ===
            "checking"
          ? 1
          : 0;


  const retryPlan =
    storedBillingPlan
      .toLowerCase() ===
      "premium"
        ? "premium"
        : "starter";


  const retryURL =
    normalizedBillingBusinessID
      ? (
          "/billing/checkout" +
          "?businessID=" +
          encodeURIComponent(
            normalizedBillingBusinessID
          ) +
          "&plan=" +
          retryPlan +
          (
            storedBillingFlow
              .toLowerCase() ===
              "recovery"
              ? "&flow=recovery"
              : ""
          )
        )
      : "/";


  if (
    !billingReturnStateReady ||
    isLoading ||
    isLoadingBusinessContext
  ) {

    return (
      <main
        className={
          styles.billingPage
        }
      >
        <div
          className={
            styles.shell
          }
        >
          <section
            className={
              styles.card
            }
          >
            <div
              className={
                styles.statusPanel
              }
            >
              <img
                src="/branding/jcs-business-suite-logo.png"
                alt="JCS Business Suite"
                width={320}
                height={160}
                style={{
                  display: "block",
                  width: "min(320px, 78vw)",
                  height: "auto",
                  margin: "0 auto 18px",
                  objectFit: "contain",
                }}
              />

              <p
                style={{
                  margin: "0 0 18px",
                  textAlign: "center",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                }}
              >
                ONE PLATFORM
                {" | "}
                EVERY BUSINESS
                {" | "}
                ENDLESS POSSIBILITIES
              </p>

              <h1
                className={
                  styles.statusTitle
                }
              >
                Preparing your workspace
              </h1>

              <p
                className={
                  styles.statusText
                }
              >
                JCS Business Suite is
                loading your secure business
                context.
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }


  if (
    !isAuthenticated
  ) {

    return null;
  }


  return (
    <main
      className={
        styles.billingPage
      }
    >
      <div
        className={
          styles.shell
        }
      >
        <header
          className={
            styles.header
          }
        >
          <img
            src="/branding/jcs-business-suite-logo.png"
            alt="JCS Business Suite"
            width={420}
            height={210}
            style={{
              display: "block",
              width: "min(420px, 82vw)",
              height: "auto",
              margin: "0 auto 14px",
              objectFit: "contain",
            }}
          />

          <p
            style={{
              margin: "0 auto 24px",
              textAlign: "center",
              fontSize: "0.8rem",
              fontWeight: 800,
              letterSpacing: "0.12em",
            }}
          >
            ONE PLATFORM
            {" | "}
            EVERY BUSINESS
            {" | "}
            ENDLESS POSSIBILITIES
          </p>

          <h1
            className={
              styles.title
            }
          >
            Preparing your workspace
          </h1>

          <p
            className={
              styles.subtitle
            }
          >
            Your secure JCS subscription
            is being confirmed and your
            business workspace is being
            prepared.
          </p>

          <div
            aria-label="Workspace setup progress"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4, minmax(0, 1fr))",
              gap: "10px",
              width: "min(760px, 100%)",
              margin: "28px auto 0",
            }}
          >
            {WORKSPACE_PROGRESS_STAGES.map(
              (
                stage,
                index
              ) => {

                const reached =
                  index <=
                  progressStageIndex;

                return (
                  <div
                    key={stage}
                    style={{
                      display: "grid",
                      justifyItems: "center",
                      gap: "8px",
                      minWidth: 0,
                      textAlign: "center",
                      opacity:
                        reached
                          ? 1
                          : 0.48,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        display: "grid",
                        placeItems: "center",
                        width: "34px",
                        height: "34px",
                        borderRadius: "999px",
                        border:
                          reached
                            ? "2px solid currentColor"
                            : "1px solid currentColor",
                        fontWeight: 800,
                      }}
                    >
                      {reached
                        ? "✓"
                        : index + 1}
                    </span>

                    <span
                      style={{
                        fontSize: "0.78rem",
                        lineHeight: 1.35,
                        fontWeight:
                          reached
                            ? 700
                            : 500,
                      }}
                    >
                      {stage}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </header>


        <section
          className={
            styles.card
          }
        >
          <div
            className={
              styles.statusPanel
            }
          >

            {verificationState ===
              "checking" ? (
              <>
                <h2
                  className={
                    styles.statusTitle
                  }
                >
                  Setting up your workspace
                </h2>

                <p
                  className={
                    styles.statusText
                  }
                >
                  JCS is confirming your secure subscription state and preparing workspace access.
                </p>
              </>
            ) : null}


            {verificationState ===
              "allowed" ? (
              <>
                <h2
                  className={
                    styles.statusTitle
                  }
                >
                  Almost ready
                </h2>

                <div
                  className={
                    styles.successBox
                  }
                >
                  Finalizing access. Your JCS subscription is active and your dashboard will open automatically.
                </div>
              </>
            ) : null}


            {verificationState ===
              "blocked" ? (
              <>
                <h2
                  className={
                    styles.statusTitle
                  }
                >
                  Almost ready
                </h2>

                <p
                  className={
                    styles.statusText
                  }
                >
                  JCS is waiting for the verified subscription record to finish updating before workspace access can be finalized.
                </p>
              </>
            ) : null}


            {verificationState ===
              "error" ? (
              <>
                <h2
                  className={
                    styles.statusTitle
                  }
                >
                  Verification unavailable
                </h2>

                <div
                  className={
                    styles.errorBox
                  }
                >
                  {verificationError}
                </div>
              </>
            ) : null}


            <div
              className={
                styles.details
              }
            >
              <div
                className={
                  styles.detailCard
                }
              >
                <span
                  className={
                    styles.detailLabel
                  }
                >
                  Plan
                </span>

                <p
                  className={
                    styles.detailValue
                  }
                >
                  {subscriptionPlan ||
                    storedBillingPlan ||
                    "Pending"}
                </p>
              </div>


              <div
                className={
                  styles.detailCard
                }
              >
                <span
                  className={
                    styles.detailLabel
                  }
                >
                  Status
                </span>

                <p
                  className={
                    styles.detailValue
                  }
                >
                  {subscriptionStatus ||
                    "Verifying"}
                </p>
              </div>
            </div>


            {!sessionID ? (
              <div
                className={
                  styles.errorBox
                }
              >
                Stripe did not return a
                Checkout Session ID in this
                URL. Subscription access will
                still remain controlled by
                the canonical backend.
              </div>
            ) : null}


            <div
              className={
                styles.actions
              }
            >
              {verificationState ===
                "allowed" ? (
                <button
                  type="button"
                  className={
                    styles.primaryButton
                  }
                  onClick={() => {
                    router.replace(
                      "/dashboard"
                    );
                  }}
                >
                  Open Dashboard Now
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className={
                      styles.primaryButton
                    }
                    disabled={
                      verificationState ===
                      "checking"
                    }
                    onClick={() => {
                      void verifyCanonicalSubscription();
                    }}
                  >
                    Check Again
                  </button>

                  <a
                    className={
                      styles.secondaryButton
                    }
                    href={
                      retryURL
                    }
                  >
                    Return to Billing
                  </a>
                </>
              )}
            </div>
          </div>
        </section>


        <p
          className={
            styles.footerNote
          }
        >
          Access opens only after the secure JCS subscription state has been confirmed.
        </p>
      </div>
    </main>
  );
}
