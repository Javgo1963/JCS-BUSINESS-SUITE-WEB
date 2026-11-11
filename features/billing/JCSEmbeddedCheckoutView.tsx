"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";

import {
  loadStripe,
} from "@stripe/stripe-js";

import {
  httpsCallable,
} from "firebase/functions";

import {
  useRouter,
} from "next/navigation";

import {
  firebaseFunctions,
} from "@/core/firebase/firebase";

import {
  useAuth,
} from "@/core/hooks/useAuth";

import styles from
  "./JCSBilling.module.css";


type BillingPlan =
  | "starter"
  | "premium";


type BillingFlow =
  | "checkout"
  | "recovery";


interface EmbeddedCheckoutRequest {
  businessID: string;
  checkoutPresentation: "embedded";
}


interface SubscriptionRecoveryRequest {
  businessID: string;
}


type EmbeddedCheckoutCallableRequest =
  | EmbeddedCheckoutRequest
  | SubscriptionRecoveryRequest;


interface EmbeddedCheckoutResponse {
  success?: boolean;
  businessID?: string;
  plan?: string;
  action?:
    | "new-checkout"
    | "portal"
    | "already-current"
    | "terminal-renewal-required";
  stripeStatus?: string;
  portalURL?: string;
  terminalRenewalOperationID?: string;
  checkoutSessionID?: string;
  checkoutClientSecret?: string;
  reused?: boolean;
}


function clean(
  value: unknown
): string {

  return typeof value === "string"
    ? value.trim()
    : "";
}


function normalizedPlan(
  value: string
): BillingPlan | null {

  const normalized =
    value.trim().toLowerCase();

  if (
    normalized ===
    "starter"
  ) {
    return "starter";
  }

  if (
    normalized ===
    "premium"
  ) {
    return "premium";
  }

  return null;
}


const stripePublishableKey =
  (
    process.env
      .NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
    ""
  ).trim();


const stripePromise =
  stripePublishableKey
    ? loadStripe(
        stripePublishableKey
      )
    : null;


export default function JCSEmbeddedCheckoutView() {

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
    requestedBusinessID,
    setRequestedBusinessID,
  ] =
    useState("");


  const [
    requestedPlan,
    setRequestedPlan,
  ] =
    useState<BillingPlan | null>(
      null
    );


  const [
    requestedFlow,
    setRequestedFlow,
  ] =
    useState<BillingFlow>(
      "checkout"
    );


  const [
    routeReady,
    setRouteReady,
  ] =
    useState(false);


  const [
    routeError,
    setRouteError,
  ] =
    useState("");


  const clientSecretPromiseRef =
    useRef<Promise<string> | null>(
      null
    );


  useEffect(() => {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const routeBusinessID =
      clean(
        params.get(
          "businessID"
        )
      );

    const routePlan =
      normalizedPlan(
        clean(
          params.get(
            "plan"
          )
        )
      );


    const routeFlow =
      clean(
        params.get(
          "flow"
        )
      ).toLowerCase() ===
        "recovery"
        ? "recovery"
        : "checkout";


    if (
      !routeBusinessID ||
      !routePlan
    ) {

      setRouteError(
        "This billing request is missing a valid business or subscription plan."
      );

      setRouteReady(
        true
      );

      return;
    }


    setRequestedBusinessID(
      routeBusinessID
    );

    setRequestedPlan(
      routePlan
    );

    setRequestedFlow(
      routeFlow
    );


    /*
     UX continuity only.

     These values are NEVER billing authority.

     Firebase callable owner validation,
     server Price IDs and Stripe webhooks
     remain authoritative.
    */
    window.sessionStorage.setItem(
      "jcsBillingBusinessID",
      routeBusinessID
    );

    window.sessionStorage.setItem(
      "jcsBillingPlan",
      routePlan
    );

    window.sessionStorage.setItem(
      "jcsBillingFlow",
      routeFlow
    );


    setRouteReady(
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


  const contextBusinessID =
    clean(
      businessID
    );


  const canPrepareCheckout =
    routeReady &&
    !routeError &&
    !isLoading &&
    isAuthenticated &&
    !isLoadingBusinessContext &&
    isBusinessContextReady &&
    Boolean(
      contextBusinessID
    ) &&
    Boolean(
      requestedBusinessID
    ) &&
    contextBusinessID ===
      requestedBusinessID &&
    Boolean(
      requestedPlan
    );


  const fetchClientSecret =
    useCallback(
      (): Promise<string> => {

        if (
          clientSecretPromiseRef.current
        ) {

          return (
            clientSecretPromiseRef.current
          );
        }


        const operation =
          (
            async () => {

              if (
                !canPrepareCheckout ||
                !requestedPlan
              ) {

                throw new Error(
                  "JCS billing context is not ready."
                );
              }


              if (
                !stripePublishableKey
              ) {

                throw new Error(
                  "JCS Stripe publishable key is not configured."
                );
              }


              const callableName =
                requestedFlow ===
                  "recovery"
                  ? "createSubscriptionRecoverySession"
                  : (
                      requestedPlan ===
                        "premium"
                        ? "createPremiumSubscriptionCheckout"
                        : "createBaseSubscriptionCheckout"
                    );


              const beginCheckout =
                httpsCallable<
                  EmbeddedCheckoutCallableRequest,
                  EmbeddedCheckoutResponse
                >(
                  firebaseFunctions,
                  callableName
                );


              const result =
                await beginCheckout(
                  requestedFlow ===
                    "recovery"
                    ? {
                        businessID:
                          requestedBusinessID,
                      }
                    : {
                        businessID:
                          requestedBusinessID,

                        checkoutPresentation:
                          "embedded",
                      }
                );


              const response =
                result.data;


              if (
                response.success !==
                true
              ) {

                throw new Error(
                  "JCS billing backend did not approve Checkout creation."
                );
              }


              if (
                clean(
                  response.businessID
                ) !==
                requestedBusinessID
              ) {

                throw new Error(
                  "JCS billing backend returned an unexpected business identity."
                );
              }


              if (
                requestedFlow ===
                  "recovery"
              ) {

                if (
                  response.action ===
                    "already-current"
                ) {
                  router.replace(
                    "/dashboard"
                  );

                  throw new Error(
                    "JCS subscription is already current. Returning to the dashboard."
                  );
                }


                if (
                  response.action ===
                    "portal"
                ) {

                  const portalURL =
                    clean(
                      response.portalURL
                    );

                  if (!portalURL) {
                    throw new Error(
                      "JCS recovery did not return a Billing Portal URL."
                    );
                  }


                  const parsed =
                    new URL(
                      portalURL
                    );


                  if (
                    parsed.protocol !==
                      "https:"
                  ) {
                    throw new Error(
                      "JCS recovery returned an insecure Billing Portal URL."
                    );
                  }


                  window.location.assign(
                    parsed.toString()
                  );

                  throw new Error(
                    "Opening Stripe Billing Portal."
                  );
                }


                if (
                  response.action ===
                    "new-checkout"
                ) {
                  router.replace(
                    "/billing/checkout" +
                    "?businessID=" +
                    encodeURIComponent(
                      requestedBusinessID
                    ) +
                    "&plan=" +
                    requestedPlan
                  );

                  throw new Error(
                    "JCS recovery resolved to normal Checkout."
                  );
                }


                if (
                  response.action !==
                    "terminal-renewal-required"
                ) {
                  throw new Error(
                    "JCS recovery returned an unsupported action."
                  );
                }
              }


              const sessionID =
                clean(
                  response
                    .checkoutSessionID
                );


              const clientSecret =
                clean(
                  response
                    .checkoutClientSecret
                );


              if (
                !sessionID ||
                !clientSecret
              ) {

                throw new Error(
                  "Stripe Embedded Checkout information is incomplete."
                );
              }


              return clientSecret;
            }
          )();


        clientSecretPromiseRef.current =
          operation;


        void operation.catch(
          () => {

            if (
              clientSecretPromiseRef
                .current ===
              operation
            ) {

              clientSecretPromiseRef
                .current =
                null;
            }
          }
        );


        return operation;
      },
      [
        canPrepareCheckout,
        requestedBusinessID,
        requestedFlow,
        requestedPlan,
        router,
      ]
    );


  const options =
    useMemo(
      () => ({
        fetchClientSecret,
      }),
      [
        fetchClientSecret,
      ]
    );


  if (
    isLoading ||
    isLoadingBusinessContext ||
    !routeReady
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
                Preparing secure billing
              </h1>

              <p
                className={
                  styles.statusText
                }
              >
                JCS Business Suite is
                validating your business
                identity before opening
                Stripe Checkout.
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


  if (
    routeError
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
                Billing request unavailable
              </h1>

              <div
                className={
                  styles.errorBox
                }
              >
                {routeError}
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }


  if (
    !isBusinessContextReady ||
    !contextBusinessID ||
    contextBusinessID !==
      requestedBusinessID
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
                Business verification stopped
              </h1>

              <div
                className={
                  styles.errorBox
                }
              >
                The authenticated JCS
                business does not match this
                billing request.
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }


  if (
    !stripePromise
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
                Stripe setup required
              </h1>

              <div
                className={
                  styles.errorBox
                }
              >
                NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
                is not configured for
                JCS Business Suite Web.
              </div>
            </div>
          </section>
        </div>
      </main>
    );
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
            Secure Billing
          </h1>

          <p
            className={
              styles.subtitle
            }
          >
            Complete your subscription
            securely without leaving
            JCS Business Suite.
          </p>
        </header>


        <section
          className={
            styles.card
          }
        >
          <div
            className={
              styles.cardHeader
            }
          >
            <span
              className={
                styles.planBadge
              }
            >
              {requestedPlan ===
                "premium"
                ? "Premium"
                : "Starter"}
            </span>

            <p
              className={
                styles.secureText
              }
            >
              Payment details are handled
              securely by Stripe.
            </p>
          </div>


          <div
            className={
              styles.checkoutFrame
            }
          >
            <EmbeddedCheckoutProvider
              stripe={
                stripePromise
              }
              options={
                options
              }
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        </section>


        <p
          className={
            styles.footerNote
          }
        >
          JCS does not grant subscription
          access from this screen.
          Verified Stripe events remain
          the subscription authority.
        </p>
      </div>
    </main>
  );
}
