"use client";

import {
  httpsCallable,
} from "firebase/functions";

import {
  functions,
} from "@/core/firebase/firebase";

export interface BusinessInvitationAcceptanceResponse {
  success: boolean;

  invitationCode: string;

  firebaseUID: string;

  appUserDocumentID: string;

  email: string;

  fullName: string;

  businessID: string;

  ownerUID: string;

  businessName: string;

  role: string;

  isActive: boolean;

  isBusinessOwner: boolean;

  isPlatformAdministrator: boolean;

  enabledModules: string[];

  disabledModules: string[];

  permissions: Record<string, boolean>;
}

interface BusinessInvitationAcceptanceRequest {
  code: string;
}

export async function acceptBusinessInvitation(
  code: string
): Promise<BusinessInvitationAcceptanceResponse> {

  const normalizedCode =
    code
      .trim()
      .replace(/[\s-]+/g, "")
      .toUpperCase();

  if (!normalizedCode) {
    throw new Error(
      "The invitation code is required."
    );
  }

  const callable =
    httpsCallable<
      BusinessInvitationAcceptanceRequest,
      BusinessInvitationAcceptanceResponse
    >(
      functions,
      "acceptBusinessInvitation"
    );

  const result =
    await callable({
      code: normalizedCode,
    });

  return result.data;
}
