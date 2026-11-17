"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LoaderCircle,
  Mail,
  Plus,
  Search,
  Send,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";

import {
  useBusinessContext,
} from "@/core/business-context/JCSBusinessContext";

import {
  APP_USER_ROLES,
  type AppUserRole,
} from "@/models/AppUser";

import {
  sendBusinessUserInvitation,
} from "./BusinessInvitationSenderService";

import {
  fetchBusinessInvitations,
  type BusinessInvitationRecord,
  type BusinessInvitationStatus,
} from "./BusinessInvitationService";

import "./BusinessInvitationsView.css";

// ============================================================
// MARK: - Roles
// ============================================================

const INVITABLE_ROLES: {
  value: AppUserRole;
  label: string;
}[] = [
  {
    value: APP_USER_ROLES.manager,
    label: "Manager",
  },
  {
    value: APP_USER_ROLES.employee,
    label: "Employee",
  },
  {
    value: APP_USER_ROLES.provider,
    label: "Provider",
  },
  {
    value: APP_USER_ROLES.customer,
    label: "Customer",
  },
];

const ROLE_DESCRIPTIONS:
  Readonly<
    Record<
      string,
      string
    >
  > = {
    manager:
      "Management access prepared according to this business configuration.",

    employee:
      "Employee access prepared for the operational modules assigned to this business.",

    provider:
      "Provider access prepared for the areas available to external business partners.",

    customer:
      "Customer access prepared for the customer-facing experience and applicable services.",
  };

// ============================================================
// MARK: - Helpers
// ============================================================

function cleanText(
  value:
    | string
    | null
    | undefined
): string {
  return value?.trim() ?? "";
}

function roleDisplayName(
  role: AppUserRole
): string {
  const normalized =
    String(
      role
    )
      .toLowerCase();

  return INVITABLE_ROLES.find(
    (option) =>
      String(
        option.value
      )
        .toLowerCase() ===
      normalized
  )?.label ??
  String(
    role
  );
}

function statusDisplayName(
  status:
    BusinessInvitationStatus
): string {
  switch (
    status
  ) {
    case "pending":
      return "Pending";

    case "accepted":
      return "Accepted";

    case "declined":
      return "Declined";

    case "cancelled":
      return "Cancelled";

    case "expired":
      return "Expired";

    default:
      return status;
  }
}

function formatInvitationDate(
  date:
    Date
): string {
  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month:
        "short",

      day:
        "numeric",

      year:
        "numeric",
    }
  )
    .format(
      date
    );
}

// ============================================================
// MARK: - View
// ============================================================

export default function BusinessInvitationsView() {
  const {
    firebaseUser,
    appUser,
    business,
    businessID,
    isPlatformAdministrator,
    isLoading,
    errorMessage,
  } = useBusinessContext();

  // ==========================================================
  // MARK: - Invite Center State
  // ==========================================================

  const [
    invitations,
    setInvitations,
  ] =
    useState<
      BusinessInvitationRecord[]
    >([]);

  const [
    isLoadingInvitations,
    setIsLoadingInvitations,
  ] =
    useState(
      false
    );

  const [
    invitationsError,
    setInvitationsError,
  ] =
    useState(
      ""
    );

  const [
    searchText,
    setSearchText,
  ] =
    useState(
      ""
    );

  const [
    showingCreateInvitation,
    setShowingCreateInvitation,
  ] =
    useState(
      false
    );

  // ==========================================================
  // MARK: - Form State
  // ==========================================================

  const [
    fullName,
    setFullName,
  ] =
    useState(
      ""
    );

  const [
    email,
    setEmail,
  ] =
    useState(
      ""
    );

  const [
    phone,
    setPhone,
  ] =
    useState(
      ""
    );

  const [
    temporaryPassword,
    setTemporaryPassword,
  ] =
    useState(
      ""
    );

  const [
    notes,
    setNotes,
  ] =
    useState(
      ""
    );

  const [
    role,
    setRole,
  ] =
    useState<AppUserRole>(
      APP_USER_ROLES.employee
    );

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(
      false
    );

  const [
    submitError,
    setSubmitError,
  ] =
    useState(
      ""
    );

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState(
      ""
    );

  // ==========================================================
  // MARK: - Access
  // ==========================================================

  const canManageInvitations =
    Boolean(
      appUser?.isBusinessOwner ||
      appUser?.canManageAppUsers
    );

  const selectedRoleLabel =
    useMemo(
      () =>
        INVITABLE_ROLES.find(
          (
            option
          ) =>
            option.value ===
              role
        )?.label ??
        "Employee",
      [
        role,
      ]
    );

  const selectedRoleDescription =
    ROLE_DESCRIPTIONS[
      String(
        role
      )
        .toLowerCase()
    ] ??
    "Business access will be prepared according to the selected role.";

  const businessName =
    business?.businessName?.trim() ||
    "Your Business";

  // ==========================================================
  // MARK: - Load Invitations
  // ==========================================================

  async function reloadInvitations():
    Promise<void> {
    if (
      !businessID
    ) {
      setInvitations(
        []
      );

      return;
    }

    setIsLoadingInvitations(
      true
    );

    setInvitationsError(
      ""
    );

    try {
      const records =
        await fetchBusinessInvitations(
          businessID,
          business?.ownerUID
        );

      setInvitations(
        records
      );
    } catch (
      error:
        unknown
    ) {
      setInvitationsError(
        error instanceof Error
          ? error.message
          : "Unable to load business invitations."
      );
    } finally {
      setIsLoadingInvitations(
        false
      );
    }
  }

  useEffect(
    () => {
      if (
        !businessID ||
        !canManageInvitations ||
        isPlatformAdministrator
      ) {
        return;
      }

      void reloadInvitations();
    },
    [
      businessID,
      business?.ownerUID,
      canManageInvitations,
      isPlatformAdministrator,
    ]
  );

  // ==========================================================
  // MARK: - Invitation Metrics
  // ==========================================================

  const pendingCount =
    useMemo(
      () =>
        invitations.filter(
          (
            invitation
          ) =>
            invitation.status ===
              "pending"
        ).length,
      [
        invitations,
      ]
    );

  const acceptedCount =
    useMemo(
      () =>
        invitations.filter(
          (
            invitation
          ) =>
            invitation.status ===
              "accepted"
        ).length,
      [
        invitations,
      ]
    );

  const inactiveCount =
    useMemo(
      () =>
        invitations.filter(
          (
            invitation
          ) =>
            invitation.status ===
              "expired" ||
            invitation.status ===
              "cancelled" ||
            invitation.status ===
              "declined"
        ).length,
      [
        invitations,
      ]
    );

  // ==========================================================
  // MARK: - Search
  // ==========================================================

  const filteredInvitations =
    useMemo(
      () => {
        const query =
          cleanText(
            searchText
          )
            .toLowerCase();

        if (
          !query
        ) {
          return invitations;
        }

        return invitations.filter(
          (
            invitation
          ) => {
            const searchable =
              [
                invitation.fullName,
                invitation.email,
                invitation.phone,
                invitation.invitationCode,
                invitation.role,
                statusDisplayName(
                  invitation.status
                ),
              ]
                .join(
                  " "
                )
                .toLowerCase();

            return searchable.includes(
              query
            );
          }
        );
      },
      [
        invitations,
        searchText,
      ]
    );

  // ==========================================================
  // MARK: - Submit
  // ==========================================================

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ): Promise<void> => {
      event.preventDefault();

      setSubmitError(
        ""
      );

      setSuccessMessage(
        ""
      );

      if (
        !firebaseUser ||
        !appUser ||
        !business
      ) {
        setSubmitError(
          "The business context is not available."
        );

        return;
      }

      if (
        !businessID ||
        !business.ownerUID
      ) {
        setSubmitError(
          "The business identity is incomplete."
        );

        return;
      }

      if (
        !canManageInvitations
      ) {
        setSubmitError(
          "You do not have permission to manage business invitations."
        );

        return;
      }

      setIsSubmitting(
        true
      );

      try {
        const result =
          await sendBusinessUserInvitation({
            actor: {
              firebaseUID:
                firebaseUser.uid,

              businessID,

              isActive:
                appUser.isActive,

              isBusinessOwner:
                appUser.isBusinessOwner,

              isPlatformAdministrator:
                appUser.isPlatformAdministrator,

              canManageAppUsers:
                appUser.canManageAppUsers,
            },

            businessID,

            ownerUID:
              business.ownerUID,

            businessName:
              business.businessName,

            industryCategoryTitle:
              business.industryCategoryTitle,

            businessModeKey:
              business.businessModeKey,

            businessModeName:
              business.businessModeName,

            fullName,
            email,
            phone,
            role,
            temporaryPassword,
            notes,
          });

        setSuccessMessage(
          `Invitation created successfully. Code: ${result.invitation.inviteCode}`
        );

        setFullName(
          ""
        );

        setEmail(
          ""
        );

        setPhone(
          ""
        );

        setTemporaryPassword(
          ""
        );

        setNotes(
          ""
        );

        setRole(
          APP_USER_ROLES.employee
        );

        await reloadInvitations();

        setShowingCreateInvitation(
          false
        );
      } catch (
        error:
          unknown
      ) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Unable to create the business invitation."
        );
      } finally {
        setIsSubmitting(
          false
        );
      }
    };

  // ==========================================================
  // MARK: - Loading / Errors
  // ==========================================================

  if (
    isLoading
  ) {
    return (
      <main className="jcs-business-invitations">
        <div className="jcs-business-invitations__state">
          <LoaderCircle
            size={28}
            strokeWidth={1.8}
          />

          <h1>
            Invite Center
          </h1>

          <p>
            Loading business context...
          </p>
        </div>
      </main>
    );
  }

  if (
    errorMessage
  ) {
    return (
      <main className="jcs-business-invitations">
        <div className="jcs-business-invitations__state">
          <h1>
            Invite Center
          </h1>

          <p>
            {errorMessage}
          </p>
        </div>
      </main>
    );
  }

  if (
    isPlatformAdministrator
  ) {
    return (
      <main className="jcs-business-invitations">
        <div className="jcs-business-invitations__state">
          <ShieldCheck
            size={30}
            strokeWidth={1.8}
          />

          <h1>
            Invite Center
          </h1>

          <p>
            Select a business before managing business-user invitations.
          </p>
        </div>
      </main>
    );
  }

  if (
    !canManageInvitations
  ) {
    return (
      <main className="jcs-business-invitations">
        <div className="jcs-business-invitations__state">
          <ShieldCheck
            size={30}
            strokeWidth={1.8}
          />

          <h1>
            Invite Center
          </h1>

          <p>
            You do not have permission to manage business invitations.
          </p>
        </div>
      </main>
    );
  }

  // ==========================================================
  // MARK: - Main Content
  // ==========================================================

  return (
    <main className="jcs-business-invitations">
      <div className="jcs-business-invitations__workspace">

        {/* ==================================================
            MARK: - Hero
        ================================================== */}

        <section className="jcs-business-invitations__hero">
          <div className="jcs-business-invitations__hero-copy">
            <div className="jcs-business-invitations__hero-icon">
              <UserPlus
                size={27}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <p className="jcs-business-invitations__eyebrow">
                People & Access
              </p>

              <h1>
                Invite Center
              </h1>

              <p>
                Customers • Team • Providers
              </p>
            </div>
          </div>

          <div className="jcs-business-invitations__business-badge">
            <Building2
              size={16}
              strokeWidth={1.9}
            />

            <span>
              {businessName}
            </span>
          </div>
        </section>

        {/* ==================================================
            MARK: - Overview
        ================================================== */}

        <section className="jcs-business-invitations__card">
          <div className="jcs-business-invitations__section-heading">
            <div className="jcs-business-invitations__section-heading-main">
              <span className="jcs-business-invitations__section-marker" />

              <div>
                <h2>
                  Invitation Overview
                </h2>

                <p>
                  Current invitation activity for {businessName}.
                </p>
              </div>
            </div>
          </div>

          <div className="jcs-business-invitations__overview-grid">

            <div className="jcs-business-invitations__stat-card">
              <Users
                size={20}
                strokeWidth={1.8}
              />

              <strong>
                {invitations.length}
              </strong>

              <span>
                Total
              </span>
            </div>

            <div className="jcs-business-invitations__stat-card">
              <Clock3
                size={20}
                strokeWidth={1.8}
              />

              <strong>
                {pendingCount}
              </strong>

              <span>
                Pending
              </span>
            </div>

            <div className="jcs-business-invitations__stat-card">
              <UserCheck
                size={20}
                strokeWidth={1.8}
              />

              <strong>
                {acceptedCount}
              </strong>

              <span>
                Accepted
              </span>
            </div>

            <div className="jcs-business-invitations__stat-card">
              <UserX
                size={20}
                strokeWidth={1.8}
              />

              <strong>
                {inactiveCount}
              </strong>

              <span>
                Inactive
              </span>
            </div>
          </div>
        </section>

        {/* ==================================================
            MARK: - Search
        ================================================== */}

        <section className="jcs-business-invitations__card">
          <div className="jcs-business-invitations__section-heading">
            <div className="jcs-business-invitations__section-heading-main">
              <span className="jcs-business-invitations__section-marker" />

              <div>
                <h2>
                  Search Invitations
                </h2>

                <p>
                  Search by name, email, phone, code, role or status.
                </p>
              </div>
            </div>

            <Search
              size={21}
              strokeWidth={1.8}
            />
          </div>

          <div className="jcs-business-invitations__search">
            <Search
              size={18}
              strokeWidth={1.8}
            />

            <input
              type="search"
              value={searchText}
              onChange={
                (
                  event
                ) =>
                  setSearchText(
                    event.target.value
                  )
              }
              placeholder="Search invitations..."
            />
          </div>
        </section>

        {/* ==================================================
            MARK: - New Invitation Action
        ================================================== */}

        <section className="jcs-business-invitations__card">
          <div className="jcs-business-invitations__section-heading">
            <div className="jcs-business-invitations__section-heading-main">
              <span className="jcs-business-invitations__section-marker" />

              <div>
                <h2>
                  New Invitation
                </h2>

                <p>
                  Create secure access for a customer, team member or provider.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="jcs-business-invitations__create-button"
            onClick={
              () => {
                setSubmitError(
                  ""
                );

                setShowingCreateInvitation(
                  (
                    current
                  ) =>
                    !current
                );
              }
            }
          >
            <Plus
              size={19}
              strokeWidth={2}
            />

            <span>
              Create New Invitation
            </span>

            <ChevronRight
              size={18}
              strokeWidth={1.8}
            />
          </button>
        </section>

        {/* ==================================================
            MARK: - Invitation Form
        ================================================== */}

        {showingCreateInvitation ? (
          <section className="jcs-business-invitations__card">
            <div className="jcs-business-invitations__section-heading">
              <div className="jcs-business-invitations__section-heading-main">
                <span className="jcs-business-invitations__section-marker" />

                <div>
                  <h2>
                    Create Invitation
                  </h2>

                  <p>
                    Prepare a JCS Business Suite account
                    and invitation for {businessName}.
                  </p>
                </div>
              </div>

              <Mail
                size={22}
                strokeWidth={1.7}
              />
            </div>

            <form
              className="jcs-business-invitations__form"
              onSubmit={
                handleSubmit
              }
            >
              <div className="jcs-business-invitations__grid">

                <div className="jcs-business-invitations__field">
                  <label htmlFor="fullName">
                    Full Name
                  </label>

                  <input
                    className="jcs-business-invitations__input"
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={
                      (
                        event
                      ) =>
                        setFullName(
                          event.target.value
                        )
                    }
                    autoComplete="name"
                    required
                  />
                </div>

                <div className="jcs-business-invitations__field">
                  <label htmlFor="email">
                    Email
                  </label>

                  <input
                    className="jcs-business-invitations__input"
                    id="email"
                    type="email"
                    value={email}
                    onChange={
                      (
                        event
                      ) =>
                        setEmail(
                          event.target.value
                        )
                    }
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="jcs-business-invitations__field">
                  <label htmlFor="phone">
                    Phone
                  </label>

                  <input
                    className="jcs-business-invitations__input"
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={
                      (
                        event
                      ) =>
                        setPhone(
                          event.target.value
                        )
                    }
                    autoComplete="tel"
                  />
                </div>

                <div className="jcs-business-invitations__field">
                  <label htmlFor="role">
                    Role
                  </label>

                  <select
                    className="jcs-business-invitations__select"
                    id="role"
                    value={role}
                    onChange={
                      (
                        event
                      ) =>
                        setRole(
                          event.target.value as AppUserRole
                        )
                    }
                  >
                    {INVITABLE_ROLES.map(
                      (
                        option
                      ) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="jcs-business-invitations__field jcs-business-invitations__field--full">
                  <label htmlFor="temporaryPassword">
                    Temporary Password
                  </label>

                  <input
                    className="jcs-business-invitations__input"
                    id="temporaryPassword"
                    type="password"
                    value={temporaryPassword}
                    onChange={
                      (
                        event
                      ) =>
                        setTemporaryPassword(
                          event.target.value
                        )
                    }
                    minLength={6}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="jcs-business-invitations__field jcs-business-invitations__field--full">
                  <label htmlFor="notes">
                    Notes
                  </label>

                  <textarea
                    className="jcs-business-invitations__textarea"
                    id="notes"
                    value={notes}
                    onChange={
                      (
                        event
                      ) =>
                        setNotes(
                          event.target.value
                        )
                    }
                    placeholder="Optional internal notes about this invitation."
                  />
                </div>
              </div>

              <div className="jcs-business-invitations__role-preview">
                <div>
                  <strong>
                    Default Access
                  </strong>

                  <span>
                    {selectedRoleDescription}
                  </span>
                </div>

                <div className="jcs-business-invitations__role-pill">
                  {selectedRoleLabel}
                </div>
              </div>

              {submitError ? (
                <div
                  className="jcs-business-invitations__message jcs-business-invitations__message--error"
                  role="alert"
                >
                  {submitError}
                </div>
              ) : null}

              <button
                className="jcs-business-invitations__submit"
                type="submit"
                disabled={
                  isSubmitting
                }
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle
                      size={18}
                      strokeWidth={2}
                    />

                    Creating Invitation...
                  </>
                ) : (
                  <>
                    <Send
                      size={18}
                      strokeWidth={2}
                    />

                    Create Invitation
                  </>
                )}
              </button>
            </form>
          </section>
        ) : null}

        {/* ==================================================
            MARK: - Success
        ================================================== */}

        {successMessage ? (
          <div
            className="jcs-business-invitations__message jcs-business-invitations__message--success"
            role="status"
          >
            <CheckCircle2
              size={17}
              strokeWidth={2}
            />

            {successMessage}
          </div>
        ) : null}

        {/* ==================================================
            MARK: - Invitations List
        ================================================== */}

        <section className="jcs-business-invitations__card">
          <div className="jcs-business-invitations__section-heading">
            <div className="jcs-business-invitations__section-heading-main">
              <span className="jcs-business-invitations__section-marker" />

              <div>
                <h2>
                  Invitations
                </h2>

                <p>
                  {filteredInvitations.length}
                  {" "}
                  {filteredInvitations.length === 1
                    ? "invitation"
                    : "invitations"}
                </p>
              </div>
            </div>
          </div>

          {isLoadingInvitations ? (
            <div className="jcs-business-invitations__list-state">
              <LoaderCircle
                size={22}
                strokeWidth={1.8}
              />

              <span>
                Loading invitations...
              </span>
            </div>
          ) : invitationsError ? (
            <div
              className="jcs-business-invitations__message jcs-business-invitations__message--error"
              role="alert"
            >
              {invitationsError}
            </div>
          ) : filteredInvitations.length === 0 ? (
            <div className="jcs-business-invitations__empty">
              <UserPlus
                size={28}
                strokeWidth={1.7}
              />

              <strong>
                {searchText
                  ? "No invitations match your search."
                  : "No invitations yet."}
              </strong>

              <span>
                {searchText
                  ? "Try another name, email, code, role or status."
                  : "Create your first invitation to get started."}
              </span>
            </div>
          ) : (
            <div className="jcs-business-invitations__list">
              {filteredInvitations.map(
                (
                  invitation
                ) => (
                  <article
                    className="jcs-business-invitations__invite-card"
                    key={invitation.id}
                  >
                    <div className="jcs-business-invitations__invite-main">
                      <div className="jcs-business-invitations__invite-avatar">
                        <UserPlus
                          size={19}
                          strokeWidth={1.9}
                        />
                      </div>

                      <div className="jcs-business-invitations__invite-person">
                        <strong>
                          {invitation.fullName}
                        </strong>

                        <span>
                          {roleDisplayName(
                            invitation.role
                          )}
                        </span>
                      </div>

                      <span
                        className={[
                          "jcs-business-invitations__status",
                          `jcs-business-invitations__status--${invitation.status}`,
                        ].join(
                          " "
                        )}
                      >
                        {statusDisplayName(
                          invitation.status
                        )}
                      </span>
                    </div>

                    <div className="jcs-business-invitations__invite-details">
                      <span>
                        {invitation.email}
                      </span>

                      {invitation.phone ? (
                        <span>
                          {invitation.phone}
                        </span>
                      ) : null}

                      <span>
                        Created{" "}
                        {formatInvitationDate(
                          invitation.createdAt
                        )}
                      </span>
                    </div>

                    <div className="jcs-business-invitations__invite-code">
                      <div>
                        <span>
                          INVITATION CODE
                        </span>

                        <strong>
                          {invitation.normalizedInvitationCode}
                        </strong>
                      </div>

                      <ChevronRight
                        size={19}
                        strokeWidth={1.8}
                      />
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
