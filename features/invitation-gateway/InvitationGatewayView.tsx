"use client";

import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Globe2,
  KeyRound,
  Laptop,
  LockKeyhole,
  MailCheck,
  MonitorSmartphone,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import "./InvitationGatewayView.css";


import {
  useAuth,
} from "@/core/hooks/useAuth";


import {
  acceptBusinessInvitation,
} from "@/features/invitation-gateway/services/BusinessInvitationAcceptanceService";

// ============================================================
// MARK: - Helpers
// ============================================================

function normalizeInvitationCode(
  value: string | null
): string {
  return (value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase()
    .slice(0, 96);
}

function cleanOptionalParameter(
  value: string | null
): string {
  return (value ?? "")
    .trim()
    .slice(0, 120);
}

function invitationRoleTitle(
  role: string
): string {
  const normalized =
    role.trim().toLowerCase();

  switch (normalized) {
    case "businessowner":
    case "business-owner":
      return "Business Owner";

    case "businessadmin":
    case "business-admin":
    case "admin":
      return "Business Administrator";

    case "manager":
      return "Manager";

    case "employee":
      return "Team Member";

    case "provider":
      return "Provider";

    case "customer":
      return "Customer";

    default:
      return role.trim() || "Business User";
  }
}

// ============================================================
// MARK: - Resolver Contracts
// ============================================================

type InvitationGatewayKind =
  | "premium-business"
  | "secure-public";

type InvitationResolutionStatus =
  | "valid"
  | "expired"
  | "accepted"
  | "inactive"
  | "invalid";

interface ResolvedJCSInvitation {
  success: boolean;

  invitationFamily?:
    | "platformBusinessOwner"
    | "business";

  invitationCode?: string;

  recipientName?: string;
  businessName?: string;
  email?: string;

  role?: string;

  status?: InvitationResolutionStatus;

  expiresAt?: string | null;

  gateway?: InvitationGatewayKind;

  message: string;
}

const invitationResolverURL =
  process.env
    .NEXT_PUBLIC_JCS_INVITATION_RESOLVER_URL
    ?.trim() || "";

async function resolveInvitation(
  code: string,
  signal: AbortSignal
): Promise<ResolvedJCSInvitation> {
  if (!invitationResolverURL) {
    throw new Error(
      "The invitation validation service is not configured."
    );
  }

  const url =
    new URL(
      invitationResolverURL
    );

  url.searchParams.set(
    "code",
    code
  );

  const response =
    await fetch(
      url.toString(),
      {
        method: "GET",
        signal,
        cache: "no-store",
        headers: {
          Accept:
            "application/json",
        },
      }
    );

  const payload =
    await response
      .json() as
      ResolvedJCSInvitation;

  if (
    !response.ok &&
    !payload.message
  ) {
    throw new Error(
      "The invitation could not be validated."
    );
  }

  return payload;
}

// ============================================================
// MARK: - View
// ============================================================

export default function InvitationGatewayView() {
  const searchParams =
    useSearchParams();


  const {
    signIn,
    signOut,
  } = useAuth();

const invitationCode =
    useMemo(
      () =>
        normalizeInvitationCode(
          searchParams.get("code")
        ),
      [searchParams]
    );

  const invitationSource =
    useMemo(
      () =>
        cleanOptionalParameter(
          searchParams.get("source")
        ),
      [searchParams]
    );

  const hasInvitationCode =
    invitationCode.length > 0;

  /*
   * PlatformAdmin → future Business Owner
   *
   * Legacy Web invitations used:
   * /invite?code=...&source=platform-owner-invitation
   *
   * Xcode and the canonical Web flow now enter
   * Create Business directly.
   */
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !hasInvitationCode
    ) {
      return;
    }

    const normalizedSource =
      invitationSource
        .trim()
        .toLowerCase();

    if (
      normalizedSource !==
      "platform-owner-invitation"
    ) {
      return;
    }

    const target =
      `/create-business?invitation=${encodeURIComponent(
        invitationCode
      )}&source=platform`;

    window.location.replace(
      target
    );
  }, [
    hasInvitationCode,
    invitationCode,
    invitationSource,
  ]);

  const [
    invitation,
    setInvitation,
  ] =
    useState<
      ResolvedJCSInvitation | null
    >(null);

  const [
    isResolving,
    setIsResolving,
  ] =
    useState(false);

  const [
    resolverError,
    setResolverError,
  ] =
    useState("");


  const [
    temporaryPassword,
    setTemporaryPassword,
  ] =
    useState("");


  const [
    isJoiningBusiness,
    setIsJoiningBusiness,
  ] =
    useState(false);


  const [
    joinBusinessError,
    setJoinBusinessError,
  ] =
    useState("");

  useEffect(
    () => {
      setInvitation(null);
      setResolverError("");

      if (!hasInvitationCode) {
        setIsResolving(false);
        return;
      }

      const controller =
        new AbortController();

      setIsResolving(true);

      void resolveInvitation(
        invitationCode,
        controller.signal
      )
        .then(
          (result) => {
            setInvitation(
              result
            );

            if (!result.success) {
              setResolverError(
                result.message
              );
            }
          }
        )
        .catch(
          (error: unknown) => {
            if (
              error instanceof DOMException &&
              error.name === "AbortError"
            ) {
              return;
            }

            console.error(
              "Invitation validation failed:",
              error
            );

            setResolverError(
              error instanceof Error
                ? error.message
                : "The invitation could not be validated."
            );
          }
        )
        .finally(
          () => {
            if (
              !controller.signal
                .aborted
            ) {
              setIsResolving(
                false
              );
            }
          }
        );

      return () => {
        controller.abort();
      };
    },
    [
      hasInvitationCode,
      invitationCode,
    ]
  );

  const invitationIsValid =
    invitation?.success ===
      true &&
    invitation.status ===
      "valid";

  const isPremiumBusinessGateway =
    invitationIsValid &&
    invitation?.gateway ===
      "premium-business";

  const resolvedRoleTitle =
    invitationRoleTitle(
      invitation?.role ?? ""
    );


  const isBusinessUserHandoff =
    invitationIsValid &&
    !isPremiumBusinessGateway &&
    invitation?.invitationFamily ===
      "business";



  const handleJoinBusiness =
    async (): Promise<void> => {
      if (
        !invitationIsValid ||
        invitation?.invitationFamily !==
          "business"
      ) {
        return;
      }


      const invitationEmail =
        (
          invitation.email ??
          ""
        )
          .trim()
          .toLowerCase();


      if (!invitationEmail) {
        setJoinBusinessError(
          "The invitation does not contain a valid email address."
        );
        return;
      }


      if (
        temporaryPassword.length <
        6
      ) {
        setJoinBusinessError(
          "Enter the temporary password included with your invitation."
        );
        return;
      }


      setJoinBusinessError("");
      setIsJoiningBusiness(true);


      let authenticated =
        false;


      try {
        /*
         * Step 1:
         * Authenticate the exact invited Firebase account.
         */
        await signIn({
          email:
            invitationEmail,

          password:
            temporaryPassword,

          rememberSession:
            true,
        });


        authenticated =
          true;


        /*
         * Step 2:
         * Protected Admin-backed validation.
         *
         * The callable re-reads the authoritative invitation,
         * authenticated root user and nested business AppUser
         * before accepting the invitation.
         */
        const acceptance =
          await acceptBusinessInvitation(
            invitationCode
          );


        if (!acceptance.success) {
          throw new Error(
            "The invitation could not be accepted."
          );
        }


        /*
         * Step 3:
         * Enter the authenticated business workspace.
         *
         * JCSBusinessContext observes Firebase Authentication
         * and loads the user's tenant, role, modules and
         * permissions for the Dashboard.
         */
        window.location.replace(
          "/dashboard"
        );
      } catch (
        error: unknown
      ) {
        console.error(
          "JCS Business Suite invitation join error:",
          error
        );


        /*
         * Never leave a partially validated invitation
         * authenticated.
         */
        if (authenticated) {
          try {
            await signOut();
          } catch (
            signOutError: unknown
          ) {
            console.error(
              "Unable to clear failed invitation session:",
              signOutError
            );
          }
        }


        setJoinBusinessError(
          error instanceof Error &&
          error.message.trim().length > 0
            ? error.message
            : "Unable to join this business. Verify the temporary password and try again."
        );
      } finally {
        setIsJoiningBusiness(
          false
        );
      }
    };


  if (isBusinessUserHandoff) {
    const invitationEmail =
      (
        invitation?.email ??
        ""
      )
        .trim()
        .toLowerCase();


    return (
      <main
        className="jcs-invitation-gateway jcs-official-public-experience jcs-invitation-gateway--secure-public"
        data-theme="dark"
        data-accent="blue"
      >
        <section className="jcs-invitation-gateway__shell">
          <header className="jcs-invitation-gateway__brand">
            <div className="jcs-invitation-gateway__brand-mark">
              <Building2
                size={30}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </div>


            <div>
              <p className="jcs-invitation-gateway__eyebrow">
                JCS Business Suite
              </p>


              <h1>
                JCS Business Suite
              </h1>
            </div>
          </header>


          <div className="jcs-invitation-gateway__layout">
            <section className="jcs-invitation-gateway__hero">
              <div className="jcs-invitation-gateway__hero-icon">
                <ShieldCheck
                  size={28}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />
              </div>


              <p className="jcs-invitation-gateway__kicker">
                Secure Business Access
              </p>


              <h2>
                Join {invitation?.businessName || "your business"}.
              </h2>


              <p className="jcs-invitation-gateway__hero-copy">
                Your invitation has been securely verified.
                Sign in with the temporary password provided
                for this invitation to enter your assigned
                workspace.
              </p>


              <div className="jcs-invitation-gateway__platforms">
                <span>
                  <Globe2 size={17} />
                  Web
                </span>


                <span>
                  <Smartphone size={17} />
                  iPhone &amp; Android
                </span>


                <span>
                  <MonitorSmartphone size={17} />
                  iPad &amp; Mac
                </span>


                <span>
                  <Laptop size={17} />
                  Windows
                </span>
              </div>
            </section>


            <section
              className="jcs-invitation-gateway__card"
              aria-labelledby="join-business-title"
            >
              <div className="jcs-invitation-gateway__status-line">
                <span className="jcs-invitation-gateway__status-dot jcs-invitation-gateway__status-dot--received" />

                <span>
                  Invitation verified
                </span>
              </div>


              <div className="jcs-invitation-gateway__card-heading">
                <div className="jcs-invitation-gateway__card-icon">
                  <MailCheck
                    size={27}
                    aria-hidden="true"
                  />
                </div>


                <div>
                  <p>
                    Welcome
                  </p>


                  <h3 id="join-business-title">
                    {invitation?.recipientName
                      ? `Welcome, ${invitation.recipientName}`
                      : `Welcome, ${resolvedRoleTitle}`}
                  </h3>
                </div>
              </div>


              <div className="jcs-invitation-gateway__resolved-details">
                {invitation?.businessName && (
                  <div>
                    <span>
                      Business
                    </span>

                    <strong>
                      {invitation.businessName}
                    </strong>
                  </div>
                )}


                <div>
                  <span>
                    Access
                  </span>

                  <strong>
                    {resolvedRoleTitle}
                  </strong>
                </div>
              </div>


              <form
                className="jcs-invitation-gateway__join-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleJoinBusiness();
                }}
              >
                <label className="jcs-invitation-gateway__field">
                  <span>
                    Invited email
                  </span>

                  <input
                    type="email"
                    value={invitationEmail}
                    readOnly
                    disabled
                    autoComplete="username"
                    aria-label="Invited email"
                  />
                </label>


                <label className="jcs-invitation-gateway__field">
                  <span>
                    Temporary password
                  </span>

                  <input
                    type="password"
                    value={temporaryPassword}
                    onChange={(event) => {
                      setTemporaryPassword(
                        event.target.value
                      );

                      if (joinBusinessError) {
                        setJoinBusinessError("");
                      }
                    }}
                    disabled={isJoiningBusiness}
                    autoComplete="current-password"
                    autoFocus
                    aria-label="Temporary password"
                    placeholder="Enter temporary password"
                  />
                </label>


                {joinBusinessError && (
                  <p
                    className="jcs-invitation-gateway__join-error"
                    role="alert"
                  >
                    {joinBusinessError}
                  </p>
                )}


                <button
                  type="submit"
                  className="jcs-invitation-gateway__continue"
                  disabled={
                    isJoiningBusiness ||
                    !invitationEmail ||
                    temporaryPassword.length < 6
                  }
                >
                  <span>
                    {isJoiningBusiness
                      ? "Joining Business..."
                      : "Join Business"}
                  </span>


                  <ArrowRight
                    size={20}
                    aria-hidden="true"
                  />
                </button>
              </form>


              <p className="jcs-invitation-gateway__privacy-note">
                The invitation link never grants permissions by
                itself. JCS Business Suite validates your
                authenticated identity, business, role and
                invitation before access is activated.
              </p>
            </section>
          </div>


          <footer className="jcs-invitation-gateway__footer">
            <span>
              © {new Date().getFullYear()} JCS Business Suite
            </span>


            <span>
              One Platform · Every Business · Endless Possibilities
            </span>
          </footer>
        </section>
      </main>
    );
  }


  return (
    <main
      className={
        `jcs-invitation-gateway jcs-official-public-experience ${
          isPremiumBusinessGateway
            ? "jcs-invitation-gateway--premium-business"
            : "jcs-invitation-gateway--secure-public"
        }`
      }
      data-theme="dark"
      data-accent="blue"
    >
      <section className="jcs-invitation-gateway__shell">
        <header className="jcs-invitation-gateway__brand">
          <div className="jcs-invitation-gateway__brand-mark">
            <Building2
              size={30}
              strokeWidth={1.9}
              aria-hidden="true"
            />
          </div>

          <div>
            <p className="jcs-invitation-gateway__eyebrow">
              JCS Business Suite
            </p>

            <h1>
              JCS Business Suite
            </h1>
          </div>
        </header>

        <div className="jcs-invitation-gateway__layout">
          <section className="jcs-invitation-gateway__hero">
            <div className="jcs-invitation-gateway__hero-icon">
              <Sparkles
                size={28}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </div>

            <p className="jcs-invitation-gateway__kicker">
              {isPremiumBusinessGateway
                ? "Welcome to JCS Business Suite"
                : "One Platform · Every Business · Endless Possibilities"}
            </p>

            <h2>
              {isPremiumBusinessGateway
                ? "Create your business and make JCS Business Suite yours."
                : "Welcome to your JCS Business Suite invitation."}
            </h2>

            <p className="jcs-invitation-gateway__hero-copy">
              {isPremiumBusinessGateway
                ? "Tell us about your business and JCS Business Suite will prepare the workspace and modules that fit your industry."
                : "A secure, professional entrance to your business workspace from any supported device."}
            </p>

            <div className="jcs-invitation-gateway__platforms">
              <span>
                <Globe2 size={17} />
                Web
              </span>

              <span>
                <Smartphone size={17} />
                iPhone &amp; Android
              </span>

              <span>
                <MonitorSmartphone size={17} />
                iPad &amp; Mac
              </span>

              <span>
                <Laptop size={17} />
                Windows
              </span>
            </div>
          </section>

          <section
            className="jcs-invitation-gateway__card"
            aria-labelledby="invitation-card-title"
          >
            <div className="jcs-invitation-gateway__status-line">
              <span
                className={
                  invitationIsValid
                    ? "jcs-invitation-gateway__status-dot jcs-invitation-gateway__status-dot--received"
                    : "jcs-invitation-gateway__status-dot"
                }
              />

              <span>
                {!hasInvitationCode
                  ? "Invitation code required"
                  : isResolving
                    ? "Preparing your invitation"
                    : invitationIsValid
                      ? (
                          isPremiumBusinessGateway
                            ? "Ready to create your business"
                            : "Invitation verified"
                        )
                      : "Invitation requires attention"}
              </span>
            </div>

            <div className="jcs-invitation-gateway__card-heading">
              <div className="jcs-invitation-gateway__card-icon">
                {invitationIsValid ? (
                  <MailCheck
                    size={27}
                    aria-hidden="true"
                  />
                ) : (
                  <KeyRound
                    size={27}
                    aria-hidden="true"
                  />
                )}
              </div>

              <div>
                <p>
                  Welcome
                </p>

                <h3 id="invitation-card-title">
                  {!hasInvitationCode
                    ? "Open your invitation link"
                    : isResolving
                      ? "Verifying your invitation"
                      : invitationIsValid
                        ? (
                            isPremiumBusinessGateway
                              ? "Your business starts here"
                              : `Welcome, ${resolvedRoleTitle}`
                          )
                        : "Invitation unavailable"}
                </h3>
              </div>
            </div>

            <p className="jcs-invitation-gateway__card-copy">
              {!hasInvitationCode
                ? "Use the secure link included in your JCS Business Suite invitation email, text message, or QR code."
                : isResolving
                  ? "JCS Business Suite is securely validating the invitation through Firebase."
                  : invitationIsValid
                    ? (
                        isPremiumBusinessGateway
                          ? "Continue to Create Business. Choose your industry and category, enter your information, and JCS Business Suite will prepare your business workspace."
                          : "Your invitation has been verified. Continue securely to your assigned business access."
                      )
                    : (
                        resolverError ||
                        invitation?.message ||
                        "This invitation is not currently available."
                      )}
            </p>

            {hasInvitationCode &&
              !isPremiumBusinessGateway && (
              <div className="jcs-invitation-gateway__code-panel">
                <span>
                  Invitation code
                </span>

                <strong>
                  {invitationCode}
                </strong>

                {invitationSource && (
                  <small>
                    Source: {invitationSource}
                  </small>
                )}
              </div>
            )}

            {invitationIsValid &&
              !isPremiumBusinessGateway && (
              <div className="jcs-invitation-gateway__resolved-details">
                {invitation?.recipientName && (
                  <div>
                    <span>
                      Invited user
                    </span>

                    <strong>
                      {invitation.recipientName}
                    </strong>
                  </div>
                )}

                {invitation?.businessName && (
                  <div>
                    <span>
                      Business
                    </span>

                    <strong>
                      {invitation.businessName}
                    </strong>
                  </div>
                )}

                <div>
                  <span>
                    Access
                  </span>

                  <strong>
                    {resolvedRoleTitle}
                  </strong>
                </div>
              </div>
            )}

            <div className="jcs-invitation-gateway__security-grid">
              <div>
                <ShieldCheck
                  size={20}
                  aria-hidden="true"
                />

                <span>
                  Protected access
                </span>
              </div>

              <div>
                <LockKeyhole
                  size={20}
                  aria-hidden="true"
                />

                <span>
                  Secure connection
                </span>
              </div>

              <div>
                <BadgeCheck
                  size={20}
                  aria-hidden="true"
                />

                <span>
                  Verified through Firebase
                </span>
              </div>
            </div>

            <button
              type="button"
              className="jcs-invitation-gateway__continue"
              disabled={
                !invitationIsValid ||
                isResolving
              }
              onClick={() => {
                if (!invitationIsValid) {
                  return;
                }

                if (
                  isPremiumBusinessGateway
                ) {
                  window.location.href =
                    `/create-business?code=${encodeURIComponent(
                      invitationCode
                    )}&source=invitation`;

                  return;
                }

                window.location.href =
  `jcsbusinesssuite://invite?code=${encodeURIComponent(
    invitationCode
  )}`;
              }}
            >
              <span>
                {!hasInvitationCode
                  ? "Invitation link required"
                  : isResolving
                    ? (
                        isPremiumBusinessGateway
                          ? "Preparing Create Business..."
                          : "Validating securely..."
                      )
                    : invitationIsValid
                      ? (
                          isPremiumBusinessGateway
                            ? "Create Business"
                            : "Continue Securely"
                        )
                      : "Invitation unavailable"}
              </span>

              <ArrowRight
                size={20}
                aria-hidden="true"
              />
            </button>

            <p className="jcs-invitation-gateway__privacy-note">
              The link never grants permissions by itself. JCS Business
              Suite verifies the original invitation record before
              allowing access.
            </p>
          </section>
        </div>

        <footer className="jcs-invitation-gateway__footer">
          <span>
            © {new Date().getFullYear()} JCS Business Suite
          </span>

          <span>
            One Platform · Every Business · Endless Possibilities
          </span>
        </footer>
      </section>
    </main>
  );
}
