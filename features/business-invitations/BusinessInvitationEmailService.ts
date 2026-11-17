import {
  firebaseAuth,
} from "@/core/firebase/firebase";

import type {
  BusinessInvitationRecord,
} from "./BusinessInvitationService";

// ============================================================
// MARK: - Result
// ============================================================

export interface BusinessInvitationEmailResult {
  success: boolean;
  message: string;
  messageID: string | null;
}

// ============================================================
// MARK: - Configuration
// ============================================================

const BUSINESS_USER_INVITATION_EMAIL_URL =
  process.env
    .NEXT_PUBLIC_JCS_BUSINESS_USER_INVITATION_EMAIL_URL
    ?.trim() ||
  "https://us-central1-jcs-business-suite.cloudfunctions.net/sendBusinessUserInvitationEmail";

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

// ============================================================
// MARK: - Send Business User Invitation Email
// ============================================================

export async function sendBusinessUserInvitationEmail(
  invitation: BusinessInvitationRecord,
  businessName: string
): Promise<BusinessInvitationEmailResult> {
  const authenticatedUser =
    firebaseAuth.currentUser;

  if (!authenticatedUser) {
    throw new Error(
      "Authentication is required before sending a business invitation email."
    );
  }

  const invitedByUID =
    cleanText(
      invitation.invitedByUID
    );

  if (
    !invitedByUID ||
    authenticatedUser.uid !== invitedByUID
  ) {
    throw new Error(
      "The authenticated Firebase user does not match the invitation sender."
    );
  }

  const firebaseIDToken =
    await authenticatedUser
      .getIdToken();

  const response =
    await fetch(
      BUSINESS_USER_INVITATION_EMAIL_URL,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${firebaseIDToken}`,
        },

        body:
          JSON.stringify({
            invitationType:
              "businessUser",

            invitationID:
              invitation.id,

            invitationCode:
              invitation.invitationCode,

            businessID:
              invitation.businessID,

            ownerUID:
              invitation.ownerUID,

            invitedByUID:
              invitation.invitedByUID,

            businessName:
              cleanText(
                businessName
              ),

            recipientName:
              invitation.fullName,

            recipientEmail:
              invitation.email,

            recipientPhone:
              invitation.phone,

            role:
              invitation.role,

            invitationLink:
              invitation.invitationLink,

            senderName:
              cleanText(
                businessName
              ) ||
              "JCS Business Suite",

            replyToEmail:
              "",

            logoURL:
              "",

            notes:
              invitation.notes,
          }),
      }
    );

  let responseBody:
    {
      success?: boolean;
      message?: string;
      messageID?: string | null;
      error?: string;
    } = {};

  try {
    responseBody =
      await response.json();
  } catch {
    responseBody = {};
  }

  if (
    !response.ok ||
    responseBody.success !== true
  ) {
    throw new Error(
      responseBody.message ||
      responseBody.error ||
      `Business invitation email failed with HTTP ${response.status}.`
    );
  }

  return {
    success:
      true,

    message:
      responseBody.message ||
      "Business invitation email sent successfully.",

    messageID:
      responseBody.messageID ??
      null,
  };
}
