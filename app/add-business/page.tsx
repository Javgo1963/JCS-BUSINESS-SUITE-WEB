"use client";

import {
  type FormEvent,
  useMemo,
  useState,
} from "react";

import {
  jcsAdditionalBusinessCreationService,
} from "@/core/business-core/additional-business/JCSAdditionalBusinessCreationService";

import JCSBusinessIndustrySelector, {
  type JCSBusinessIndustrySelection,
} from "@/features/business-signup/JCSBusinessIndustrySelector";


type BillingPlan =
  | "Starter"
  | "Premium";


function clean(
  value: string,
): string {
  return value.trim();
}


export default function AddBusinessPage() {

  const [
    businessName,
    setBusinessName,
  ] = useState("");

  const [
    selectedIndustry,
    setSelectedIndustry,
  ] =
    useState<JCSBusinessIndustrySelection | null>(
      null,
    );

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    website,
    setWebsite,
  ] = useState("");

  /*
   * APPLE PARITY:
   *
   * Starter
   * → 7-day free trial
   * → card required
   * → access only after Stripe/backend verification
   *
   * Premium
   * → immediate payment
   * → no trial
   * → Premium only after verified payment
   */
  const [
    selectedBillingPlan,
    setSelectedBillingPlan,
  ] =
    useState<BillingPlan>(
      "Starter",
    );

  const [
    creationRequestID,
    setCreationRequestID,
  ] = useState("");

  const [
    creationPayloadKey,
    setCreationPayloadKey,
  ] = useState("");

  const [
    isCreating,
    setIsCreating,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    billingMessage,
    setBillingMessage,
  ] = useState("");

  const [
    createdBusinessID,
    setCreatedBusinessID,
  ] = useState("");

  const [
    createdBusinessName,
    setCreatedBusinessName,
  ] = useState("");

  /*
   * Business Created != Business Ready.
   *
   * Creation and subscription entitlement remain
   * separate authorities, matching Apple.
   */
  const creationCompleted =
    Boolean(
      clean(
        createdBusinessID,
      ),
    );

  const industry =
    selectedIndustry
      ?.industryCategoryTitle ??
    "";

  const businessModeRawValue =
    selectedIndustry
      ?.businessModeName ??
    "";

  const payloadKey =
    useMemo(
      () =>
        [
          clean(
            businessName,
          ),

          clean(
            industry,
          ),

          clean(
            businessModeRawValue,
          ),

          clean(
            phone,
          ),

          clean(
            website,
          ),
        ].join(
          "\u001F",
        ),
      [
        businessName,
        industry,
        businessModeRawValue,
        phone,
        website,
      ],
    );

  const canCreate =
    Boolean(
      clean(
        businessName,
      ) &&
      clean(
        industry,
      ) &&
      clean(
        businessModeRawValue,
      ),
    );

  function
  requestIDForPayload():
    string
  {
    if (
      !creationRequestID ||
      creationPayloadKey !==
        payloadKey
    ) {
      const nextID =
        jcsAdditionalBusinessCreationService
          .createCreationRequestID();

      setCreationRequestID(
        nextID,
      );

      setCreationPayloadKey(
        payloadKey,
      );

      return nextID;
    }

    return creationRequestID;
  }

  async function
  handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      isCreating ||
      !canCreate ||
      creationCompleted
    ) {
      return;
    }

    setErrorMessage("");
    setBillingMessage("");
    setIsCreating(true);

    try {
      const requestID =
        requestIDForPayload();

      /*
       * IMPORTANT:
       *
       * Additional-business creation remains the
       * existing authenticated owner callable.
       *
       * Billing is NOT performed here.
       */
      const result =
        await
          jcsAdditionalBusinessCreationService
            .createAdditionalBusiness({
              creationRequestID:
                requestID,

              businessName:
                clean(
                  businessName,
                ),

              industry:
                clean(
                  industry,
                ),

              businessModeRawValue:
                clean(
                  businessModeRawValue,
                ),

              phone:
                clean(
                  phone,
                ),

              website:
                clean(
                  website,
                ),
            });

      setCreatedBusinessID(
        result.businessID,
      );

      setCreatedBusinessName(
        result.businessName,
      );

      /*
       * APPLE PARITY:
       *
       * The business now exists, but access must
       * remain billing-pending.
       *
       * We deliberately DO NOT:
       * - mark the business active
       * - grant local entitlement
       * - switch the current workspace
       * - assume Stripe success
       */
      setBillingMessage(
        selectedBillingPlan ===
          "Premium"
          ? (
              "The business was created successfully, but Premium access is still inactive. Complete immediate secure payment to activate this business."
            )
          : (
              "The business was created successfully, but subscription access is still inactive. Complete secure billing setup to start the 7-day trial."
            ),
      );

    } catch (error) {
      /*
       * Keep the request ID for an unchanged payload.
       * This preserves the existing idempotency
       * behavior used by Apple.
       */
      setErrorMessage(
        error instanceof Error
          ? error.message
          : (
              "JCS could not create the additional business."
            ),
      );

    } finally {
      setIsCreating(false);
    }
  }

  function
  continueToSecureBilling() {

    const businessID =
      clean(
        createdBusinessID,
      );

    if (!businessID) {
      setErrorMessage(
        "Secure billing cannot begin because the Business ID is missing.",
      );

      return;
    }

    /*
     * Reuse the exact same Web billing authority
     * already used by First Business.
     *
     * No Stripe checkout URL is trusted from this page.
     * /billing/checkout owns the secure Stripe transport.
     */
    const billingPlan =
      selectedBillingPlan ===
        "Premium"
        ? "premium"
        : "starter";

    const billingURL =
      new URL(
        "/billing/checkout",
        window.location.origin,
      );

    billingURL.searchParams.set(
      "businessID",
      businessID,
    );

    billingURL.searchParams.set(
      "plan",
      billingPlan,
    );

    /*
     * Defense in depth:
     * billing navigation must remain same-origin.
     */
    if (
      billingURL.origin !==
      window.location.origin
    ) {
      setErrorMessage(
        "Secure billing navigation must remain inside JCS Business Suite.",
      );

      return;
    }

    setErrorMessage("");

    setBillingMessage(
      selectedBillingPlan ===
        "Premium"
        ? (
            "Opening JCS Premium secure billing..."
          )
        : (
            "Opening JCS Starter secure billing..."
          ),
    );

    window.location.assign(
      billingURL.toString(),
    );
  }

  return (
    <main
      style={{
        minHeight:
          "100vh",

        padding:
          "32px 20px 64px",

        background:
          "linear-gradient(145deg, #f7f4ef 0%, #f4efe8 46%, #eee7dd 100%)",

        color:
          "#251c17",
      }}
    >
      <div
        style={{
          width:
            "min(920px, 100%)",

          margin:
            "0 auto",

          display:
            "grid",

          gap:
            20,
        }}
      >
        <header
          style={{
            display:
              "grid",

            gap:
              8,
          }}
        >
          <a
            href="/"
            style={{
              width:
                "fit-content",

              color:
                "#8b5e3c",

              textDecoration:
                "none",

              fontWeight:
                800,
            }}
          >
            ← Back
          </a>

          <span
            style={{
              fontSize:
                12,

              fontWeight:
                900,

              letterSpacing:
                "0.09em",

              textTransform:
                "uppercase",

              color:
                "#9a6947",
            }}
          >
            JCS BUSINESS SUITE
          </span>

          <h1
            style={{
              margin:
                0,

              fontSize:
                "clamp(30px, 5vw, 48px)",
            }}
          >
            Add Business
          </h1>

          <p
            style={{
              margin:
                0,

              maxWidth:
                760,

              lineHeight:
                1.6,

              opacity:
                0.76,
            }}
          >
            Create another independent business
            with your existing Business Owner account.
            Your current business remains active and
            unchanged until you choose another workspace.
          </p>
        </header>

        {creationCompleted ? (

          <section
            style={{
              padding:
                26,

              borderRadius:
                22,

              background:
                "rgba(255,255,255,0.82)",

              border:
                "1px solid rgba(154,105,71,0.22)",

              boxShadow:
                "0 18px 44px rgba(61,43,31,0.08)",

              display:
                "grid",

              gap:
                18,
            }}
          >
            <div
              style={{
                display:
                  "grid",

                gap:
                  6,
              }}
            >
              <span
                style={{
                  width:
                    "fit-content",

                  padding:
                    "6px 10px",

                  borderRadius:
                    999,

                  background:
                    "rgba(154,105,71,0.12)",

                  color:
                    "#8b5e3c",

                  fontSize:
                    12,

                  fontWeight:
                    900,
                }}
              >
                BILLING PENDING
              </span>

              <h2
                style={{
                  margin:
                    0,
                }}
              >
                Business Created — Billing Pending
              </h2>

              <p
                style={{
                  margin:
                    0,

                  opacity:
                    0.72,

                  lineHeight:
                    1.55,
                }}
              >
                Creating the business does not activate
                subscription access. Complete secure
                Stripe billing and allow JCS to verify
                the canonical subscription state.
              </p>
            </div>

            <div
              style={{
                display:
                  "grid",

                gap:
                  8,

                padding:
                  18,

                borderRadius:
                  16,

                background:
                  "rgba(154,105,71,0.07)",
              }}
            >
              <strong>
                {createdBusinessName}
              </strong>

              <code
                style={{
                  overflowWrap:
                    "anywhere",
                }}
              >
                {createdBusinessID}
              </code>

              <span>
                {
                  selectedIndustry
                    ?.industryCategoryTitle
                }
              </span>

              <span>
                {
                  selectedIndustry
                    ?.businessModeName
                }
              </span>
            </div>

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",

                gap:
                  12,
              }}
            >
              <div
                style={{
                  padding:
                    16,

                  borderRadius:
                    16,

                  background:
                    selectedBillingPlan ===
                      "Starter"
                      ? "rgba(154,105,71,0.13)"
                      : "rgba(100,116,139,0.08)",

                  border:
                    selectedBillingPlan ===
                      "Starter"
                      ? "1px solid rgba(154,105,71,0.30)"
                      : "1px solid rgba(100,116,139,0.16)",
                }}
              >
                <strong>
                  Starter
                </strong>

                <p
                  style={{
                    margin:
                      "6px 0 0",

                    fontSize:
                      13,

                    lineHeight:
                      1.5,
                  }}
                >
                  7-day free trial. Card required.
                  Monthly billing begins after the trial
                  unless canceled.
                </p>
              </div>

              <div
                style={{
                  padding:
                    16,

                  borderRadius:
                    16,

                  background:
                    selectedBillingPlan ===
                      "Premium"
                      ? "rgba(154,105,71,0.13)"
                      : "rgba(100,116,139,0.08)",

                  border:
                    selectedBillingPlan ===
                      "Premium"
                      ? "1px solid rgba(154,105,71,0.30)"
                      : "1px solid rgba(100,116,139,0.16)",
                }}
              >
                <strong>
                  Premium
                </strong>

                <p
                  style={{
                    margin:
                      "6px 0 0",

                    fontSize:
                      13,

                    lineHeight:
                      1.5,
                  }}
                >
                  Immediate payment. No free trial.
                  Premium features activate only after
                  verified payment.
                </p>
              </div>
            </div>

            {billingMessage ? (
              <div
                style={{
                  padding:
                    14,

                  borderRadius:
                    14,

                  background:
                    "rgba(154,105,71,0.08)",

                  lineHeight:
                    1.55,
                }}
              >
                {billingMessage}
              </div>
            ) : null}

            {errorMessage ? (
              <div
                role="alert"
                style={{
                  padding:
                    14,

                  borderRadius:
                    14,

                  background:
                    "rgba(239,68,68,0.10)",
                }}
              >
                {errorMessage}
              </div>
            ) : null}

            <button
              type="button"
              onClick={
                continueToSecureBilling
              }
              style={{
                minHeight:
                  52,

                border:
                  0,

                borderRadius:
                  15,

                padding:
                  "13px 20px",

                background:
                  "linear-gradient(135deg, #a66f47, #7f5134)",

                color:
                  "#ffffff",

                font:
                  "inherit",

                fontWeight:
                  900,

                cursor:
                  "pointer",
              }}
            >
              {
                selectedBillingPlan ===
                  "Premium"
                  ? "Activate Premium"
                  : "Start 7-Day Trial"
              }
            </button>

            <div
              style={{
                padding:
                  14,

                borderRadius:
                  14,

                background:
                  "rgba(59,130,246,0.06)",

                fontSize:
                  13,

                lineHeight:
                  1.55,
              }}
            >
              The current workspace was not switched.
              Returning from Stripe does not by itself
              grant access. JCS billing verification
              remains the authority.
            </div>
          </section>

        ) : (

          <form
            onSubmit={
              handleSubmit
            }
            style={{
              padding:
                24,

              borderRadius:
                22,

              background:
                "rgba(255,255,255,0.84)",

              border:
                "1px solid rgba(154,105,71,0.14)",

              boxShadow:
                "0 18px 44px rgba(61,43,31,0.08)",

              display:
                "grid",

              gap:
                22,
            }}
          >
            <section
              style={{
                display:
                  "grid",

                gap:
                  8,
              }}
            >
              <div>
                <span
                  style={{
                    display:
                      "block",

                    marginBottom:
                      6,

                    color:
                      "#9a6947",

                    fontSize:
                      11,

                    fontWeight:
                      900,

                    letterSpacing:
                      "0.08em",

                    textTransform:
                      "uppercase",
                  }}
                >
                  Business Information
                </span>

                <label
                  htmlFor="businessName"
                  style={{
                    fontWeight:
                      800,
                  }}
                >
                  Business Name
                </label>
              </div>

              <input
                id="businessName"
                value={
                  businessName
                }
                onChange={
                  (event) =>
                    setBusinessName(
                      event.target.value,
                    )
                }
                required
                disabled={
                  isCreating
                }
                style={{
                  minHeight:
                    48,

                  padding:
                    "10px 12px",

                  borderRadius:
                    13,

                  border:
                    "1px solid rgba(100,116,139,0.25)",

                  font:
                    "inherit",
                }}
              />
            </section>

            <JCSBusinessIndustrySelector
              selected={
                selectedIndustry
              }
              disabled={
                isCreating
              }
              onChange={
                setSelectedIndustry
              }
            />

            <section
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",

                gap:
                  16,
              }}
            >
              <div
                style={{
                  display:
                    "grid",

                  gap:
                    6,
                }}
              >
                <label
                  htmlFor="phone"
                  style={{
                    fontWeight:
                      800,
                  }}
                >
                  Business Phone
                </label>

                <input
                  id="phone"
                  value={
                    phone
                  }
                  onChange={
                    (event) =>
                      setPhone(
                        event.target.value,
                      )
                  }
                  disabled={
                    isCreating
                  }
                  style={{
                    minHeight:
                      46,

                    padding:
                      "10px 12px",

                    borderRadius:
                      12,

                    border:
                      "1px solid rgba(100,116,139,0.25)",

                    font:
                      "inherit",
                  }}
                />
              </div>

              <div
                style={{
                  display:
                    "grid",

                  gap:
                    6,
                }}
              >
                <label
                  htmlFor="website"
                  style={{
                    fontWeight:
                      800,
                  }}
                >
                  Website
                </label>

                <input
                  id="website"
                  value={
                    website
                  }
                  onChange={
                    (event) =>
                      setWebsite(
                        event.target.value,
                      )
                  }
                  placeholder="Optional"
                  disabled={
                    isCreating
                  }
                  style={{
                    minHeight:
                      46,

                    padding:
                      "10px 12px",

                    borderRadius:
                      12,

                    border:
                      "1px solid rgba(100,116,139,0.25)",

                    font:
                      "inherit",
                  }}
                />
              </div>
            </section>

            <section
              style={{
                display:
                  "grid",

                gap:
                  12,
              }}
            >
              <div>
                <span
                  style={{
                    display:
                      "block",

                    color:
                      "#9a6947",

                    fontSize:
                      11,

                    fontWeight:
                      900,

                    letterSpacing:
                      "0.08em",

                    textTransform:
                      "uppercase",
                  }}
                >
                  Subscription Plan
                </span>

                <h2
                  style={{
                    margin:
                      "4px 0 0",
                  }}
                >
                  Choose your plan
                </h2>
              </div>

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(240px, 1fr))",

                  gap:
                    12,
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelectedBillingPlan(
                      "Starter",
                    )
                  }
                  disabled={
                    isCreating
                  }
                  style={{
                    padding:
                      18,

                    borderRadius:
                      17,

                    border:
                      selectedBillingPlan ===
                        "Starter"
                        ? "2px solid #9a6947"
                        : "1px solid rgba(100,116,139,0.20)",

                    background:
                      selectedBillingPlan ===
                        "Starter"
                        ? "rgba(154,105,71,0.11)"
                        : "rgba(255,255,255,0.65)",

                    color:
                      "inherit",

                    textAlign:
                      "left",

                    cursor:
                      "pointer",
                  }}
                >
                  <strong>
                    Starter
                  </strong>

                  <p
                    style={{
                      margin:
                        "7px 0 0",

                      lineHeight:
                        1.5,
                    }}
                  >
                    7-day free trial. Card required.
                    Monthly billing begins after the
                    trial unless canceled.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedBillingPlan(
                      "Premium",
                    )
                  }
                  disabled={
                    isCreating
                  }
                  style={{
                    padding:
                      18,

                    borderRadius:
                      17,

                    border:
                      selectedBillingPlan ===
                        "Premium"
                        ? "2px solid #9a6947"
                        : "1px solid rgba(100,116,139,0.20)",

                    background:
                      selectedBillingPlan ===
                        "Premium"
                        ? "rgba(154,105,71,0.11)"
                        : "rgba(255,255,255,0.65)",

                    color:
                      "inherit",

                    textAlign:
                      "left",

                    cursor:
                      "pointer",
                  }}
                >
                  <strong>
                    JCS Premium
                  </strong>

                  <p
                    style={{
                      margin:
                        "7px 0 0",

                      lineHeight:
                        1.5,
                    }}
                  >
                    Immediate payment. No free trial.
                    Premium activates only after Stripe
                    confirms payment.
                  </p>
                </button>
              </div>
            </section>

            <section
              style={{
                padding:
                  16,

                borderRadius:
                  16,

                background:
                  "rgba(154,105,71,0.07)",

                display:
                  "grid",

                gap:
                  8,
              }}
            >
              <strong>
                Review
              </strong>

              <span>
                Business:{" "}
                {
                  clean(
                    businessName,
                  ) ||
                  "Not entered"
                }
              </span>

              <span>
                Industry:{" "}
                {
                  clean(
                    industry,
                  ) ||
                  "Not selected"
                }
              </span>

              <span>
                Business Type:{" "}
                {
                  clean(
                    businessModeRawValue,
                  ) ||
                  "Not selected"
                }
              </span>

              <span>
                Plan:{" "}
                {
                  selectedBillingPlan ===
                    "Premium"
                    ? "Premium — Immediate Payment"
                    : "Starter — 7-Day Trial"
                }
              </span>
            </section>

            <div
              style={{
                padding:
                  14,

                borderRadius:
                  14,

                background:
                  "rgba(59,130,246,0.06)",

                fontSize:
                  13,

                lineHeight:
                  1.55,
              }}
            >
              Each business receives its own Business ID,
              settings and data. Creating this business
              does not switch your current workspace.
              Billing entitlement remains server verified.
            </div>

            {errorMessage ? (
              <div
                role="alert"
                style={{
                  padding:
                    14,

                  borderRadius:
                    14,

                  background:
                    "rgba(239,68,68,0.10)",
                }}
              >
                {errorMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={
                !canCreate ||
                isCreating
              }
              style={{
                minHeight:
                  52,

                border:
                  0,

                borderRadius:
                  15,

                padding:
                  "13px 20px",

                background:
                  canCreate &&
                  !isCreating
                    ? "linear-gradient(135deg, #a66f47, #7f5134)"
                    : "rgba(100,116,139,0.22)",

                color:
                  canCreate &&
                  !isCreating
                    ? "#ffffff"
                    : "#64748b",

                font:
                  "inherit",

                fontWeight:
                  900,

                cursor:
                  canCreate &&
                  !isCreating
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              {
                isCreating
                  ? "Creating Business..."
                  : "Create Additional Business"
              }
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
