import {
  createBusinessAppUser,
  type AppUserActor,
} from "@/features/app-users/AppUserFirestoreService";

import {
  JCSRoleAccessPolicyEngine,
} from "@/core/permissions/JCSRoleAccessPolicyEngine";

import {
  createBusinessInvitation,
  type BusinessInvitationRecord,
} from "./BusinessInvitationService";


import {
  sendBusinessUserInvitationEmail,
} from "./BusinessInvitationEmailService";

import type {
  AppUserRecord,
  AppUserRole,
} from "@/models/AppUser";

// ============================================================
// MARK: - Input
// ============================================================

export interface SendBusinessUserInvitationInput {
  actor: AppUserActor;

  businessID: string;
  ownerUID: string;
  businessName: string;

  industryCategoryTitle?: string;
  businessModeKey?: string;
  businessModeName?: string;

  fullName: string;
  email: string;
  phone?: string;

  role: AppUserRole;

  temporaryPassword: string;
  notes?: string;
}

// ============================================================
// MARK: - Result
// ============================================================

export interface SendBusinessUserInvitationResult {
  appUser: AppUserRecord;
  invitation: BusinessInvitationRecord;
}

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

function normalizeEmail(
  value:
    | string
    | null
    | undefined
): string {
  return cleanText(
    value
  ).toLowerCase();
}

function requireText(
  value:
    | string
    | null
    | undefined,
  label: string
): string {
  const normalized =
    cleanText(
      value
    );

  if (!normalized) {
    throw new Error(
      `${label} is required.`
    );
  }

  return normalized;
}

function assertInvitableRole(
  role: AppUserRole
): void {
  const allowedRoles:
    AppUserRole[] = [
      "customer",
      "provider",
      "employee",
      "manager",
    ];

  if (
    !allowedRoles.includes(
      role
    )
  ) {
    throw new Error(
      "This role cannot be assigned through a standard business invitation."
    );
  }
}

// ============================================================
// MARK: - Send Business User Invitation
// ============================================================

export async function sendBusinessUserInvitation(
  input: SendBusinessUserInvitationInput
): Promise<SendBusinessUserInvitationResult> {
  const businessID =
    requireText(
      input.businessID,
      "Business ID"
    );

  const ownerUID =
    requireText(
      input.ownerUID,
      "Owner UID"
    );

  const invitedByUID =
    requireText(
      input.actor.firebaseUID,
      "Invited By UID"
    );

  const fullName =
    requireText(
      input.fullName,
      "Full name"
    );

  const email =
    normalizeEmail(
      input.email
    );

  if (
    !email ||
    !email.includes("@")
  ) {
    throw new Error(
      "Enter a valid email address."
    );
  }

  const temporaryPassword =
    requireText(
      input.temporaryPassword,
      "Temporary password"
    );

  if (
    temporaryPassword.length < 6
  ) {
    throw new Error(
      "Temporary password must contain at least 6 characters."
    );
  }

  assertInvitableRole(
    input.role
  );

  const permissions =
    JCSRoleAccessPolicyEngine.policy({
      role:
        input.role,

      industry:
        cleanText(
          input.industryCategoryTitle
        ),

      businessCategory:
        cleanText(
          input.industryCategoryTitle
        ),

      businessModeRawValue:
        cleanText(
          input.businessModeName
        ) ||
        cleanText(
          input.businessModeKey
        ),

      isBusinessOwner:
        false,

      isPlatformAdministrator:
        false,
    });

  const appUser =
    await createBusinessAppUser(
      input.actor,
      {
        username:
          email,

        fullName,
        email,

        phone:
          cleanText(
            input.phone
          ),

        role:
          input.role,

        isActive:
          true,

        firebaseUID:
          "",

        businessID,
        ownerUID,

        businessName:
          cleanText(
            input.businessName
          ),

        isBusinessOwner:
          false,

        isPlatformAdministrator:
          false,

        permissions,

        temporaryPassword,

        createAuthenticationAccount:
          true,

        sendWelcomeEmail:
          false,
      }
    );

  const invitation =
    await createBusinessInvitation({
      businessID,
      ownerUID,
      invitedByUID,

      fullName,
      email,

      phone:
        cleanText(
          input.phone
        ),

      role:
        input.role,

      notes:
        cleanText(
          input.notes
        ),
    });

  await sendBusinessUserInvitationEmail(
    invitation,
    cleanText(
      input.businessName
    )
  );

  return {
    appUser,
    invitation,
  };
}
