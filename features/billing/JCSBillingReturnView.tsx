"use client";

import {
  useCallback,
  useEffect,
  useRef,
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


const AUTOMATIC_VERIFICATION_MAX_ATTEMPTS =
  8;

const AUTOMATIC_VERIFICATION_DELAY_MS =
  1500;


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
  } =
    useAuth();


  const [
    sessionID,
    setSessionID,
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


  const automaticVerificationAttemptRef =
    useRef(0);

  const automaticVerificationTimerRef =
    useRef<number | null>(
      null
    );


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
      async (): Promise<VerificationState> => {

        const normalizedBusinessID =
          clean(
            businessID
          );


        if (
          !normalizedBusinessID
        ) {

          setVerificationState(
            "error"
          );

          setVerificationError(
            "JCS could not resolve the authenticated business identity."
          );

          return "error";
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
              normalizedBusinessID
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

            return "blocked";
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

            return "allowed";
          }


          setVerificationState(
            "blocked"
          );

          return "blocked";

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

          return "error";
        }
      },
      [
        businessID,
      ]
    );


  useEffect(() => {

    if (
      isLoading ||
      !isAuthenticated ||
      isLoadingBusinessContext ||
      !isBusinessContextReady
    ) {

      return;
    }


    let isCancelled =
      false;


    const runAutomaticVerification =
      async (): Promise<void> => {

        if (isCancelled) {
          return;
        }


        automaticVerificationAttemptRef.current +=
          1;


        const result =
          await verifyCanonicalSubscription();


        if (isCancelled) {
          return;
        }


        if (
          result ===
          "allowed"
        ) {

          router.replace(
            "/dashboard"
          );

          return;
        }


        if (
          result !==
            "blocked" ||
          automaticVerificationAttemptRef.current >=
            AUTOMATIC_VERIFICATION_MAX_ATTEMPTS
        ) {

          return;
        }


        automaticVerificationTimerRef.current =
          window.setTimeout(
            () => {

              void runAutomaticVerification();
            },
            AUTOMATIC_VERIFICATION_DELAY_MS
          );
      };


    automaticVerificationAttemptRef.current =
      0;


    void runAutomaticVerification();


    return () => {

      isCancelled =
        true;


      if (
        automaticVerificationTimerRef.current !==
        null
      ) {

        window.clearTimeout(
          automaticVerificationTimerRef.current
        );

        automaticVerificationTimerRef.current =
          null;
      }
    };

  }, [
    isAuthenticated,
    isBusinessContextReady,
    isLoading,
    isLoadingBusinessContext,
    router,
    verifyCanonicalSubscription,
  ]);


  const normalizedBusinessID =
    clean(
      businessID
    );


  const retryPlan =
    storedBillingPlan
      .toLowerCase() ===
      "premium"
        ? "premium"
        : "starter";


  const retryURL =
    normalizedBusinessID
      ? (
          "/billing/checkout" +
          "?businessID=" +
          encodeURIComponent(
            normalizedBusinessID
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
              <h1
                className={
                  styles.statusTitle
                }
              >
                Verifying subscription
              </h1>

              <p
                className={
                  styles.statusText
                }
              >
                JCS Business Suite is
                checking the canonical
                subscription record.
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
          <p
            className={
              styles.eyebrow
            }
          >
            JCS Business Suite
          </p>

          <h1
            className={
              styles.title
            }
          >
            Subscription Verification
          </h1>

          <p
            className={
              styles.subtitle
            }
          >
            Returning from Stripe does not
            grant access by itself.
            JCS verifies the canonical
            Platform Client record.
          </p>
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
                  Checking Stripe confirmation
                </h2>

                <p
                  className={
                    styles.statusText
                  }
                >
                  The secure billing backend
                  may take a moment to process
                  the verified Stripe event.
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
                  Subscription verified
                </h2>

                <div
                  className={
                    styles.successBox
                  }
                >
                  Your JCS subscription is
                  active and the business
                  workspace is available.
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
                  Verification pending
                </h2>

                <p
                  className={
                    styles.statusText
                  }
                >
                  Stripe has returned you to
                  JCS, but the canonical
                  subscription record does
                  not yet grant workspace
                  access.
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
                  Continue to Dashboard
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
          Checkout Session IDs and browser
          return state never grant JCS
          entitlement. Stripe webhooks and
          the canonical Platform Client
          remain authoritative.
        </p>
      </div>
    </main>
  );
}
