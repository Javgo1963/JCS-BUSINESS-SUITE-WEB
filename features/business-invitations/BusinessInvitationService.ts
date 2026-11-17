import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  type DocumentData,
} from "firebase/firestore";

import {
  db,
} from "@/core/firebase/firebase";

import type {
  AppUserRole,
} from "@/models/AppUser";

// ============================================================
// MARK: - Constants
// ============================================================

const BUSINESS_INVITATIONS_COLLECTION =
  "BusinessInvitations";

const INVITATION_EXPIRATION_DAYS =
  7;

// ============================================================
// MARK: - Types
// ============================================================

export type BusinessInvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "expired";

export interface CreateBusinessInvitationInput {
  businessID: string;
  ownerUID: string;
  invitedByUID: string;

  fullName: string;
  email: string;
  phone?: string;

  role: AppUserRole;
  notes?: string;
}

export interface BusinessInvitationRecord {
  id: string;

  invitationType: "business";

  invitationCode: string;
  inviteCode: string;
  normalizedInvitationCode: string;

  invitationLink: string;
  inviteLink: string;

  businessID: string;
  ownerUID: string;
  invitedByUID: string;

  fullName: string;
  email: string;
  phone: string;

  roleRawValue: AppUserRole;
  role: AppUserRole;

  statusRawValue: BusinessInvitationStatus;
  status: BusinessInvitationStatus;

  isActive: boolean;

  notes: string;

  createdAt: Date;
  expiresAt: Date;

  acceptedAt?: Date;
  declinedAt?: Date;
  cancelledAt?: Date;

  acceptedByUID?: string;
  acceptedUserEmail?: string;
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

function normalizeInvitationCode(
  value:
    | string
    | null
    | undefined
): string {
  return cleanText(
    value
  ).toUpperCase();
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

function createInvitationCode(): string {
  return crypto
    .randomUUID()
    .replaceAll(
      "-",
      ""
    )
    .slice(
      0,
      12
    )
    .toUpperCase();
}

function createInvitationLink(
  code: string
): string {
  return `https://www.jcsbusinesssuite.com/invite?code=${encodeURIComponent(
    code
  )}`;
}

// ============================================================
// MARK: - Duplicate Check
// ============================================================

async function assertNoActiveDuplicateInvitation(
  businessID: string,
  ownerUID: string,
  email: string,
  role: AppUserRole
): Promise<void> {
  const snapshot =
    await getDocs(
      query(
        collection(
          db,
          BUSINESS_INVITATIONS_COLLECTION
        ),
        where(
          "businessID",
          "==",
          businessID
        ),
        where(
          "ownerUID",
          "==",
          ownerUID
        ),
        where(
          "email",
          "==",
          email
        ),
        where(
          "role",
          "==",
          role
        ),
        where(
          "isActive",
          "==",
          true
        ),
        limit(
          1
        )
      )
    );

  if (!snapshot.empty) {
    throw new Error(
      "An active invitation already exists for this user and role."
    );
  }
}

// ============================================================
// MARK: - Create Business Invitation
// ============================================================

export async function createBusinessInvitation(
  input: CreateBusinessInvitationInput
): Promise<BusinessInvitationRecord> {
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
      input.invitedByUID,
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
    !email.includes(
      "@"
    )
  ) {
    throw new Error(
      "Enter a valid email address."
    );
  }

  await assertNoActiveDuplicateInvitation(
    businessID,
    ownerUID,
    email,
    input.role
  );

  const code =
    normalizeInvitationCode(
      createInvitationCode()
    );

  const inviteLink =
    createInvitationLink(
      code
    );

  const now =
    new Date();

  const expiresAt =
    new Date(
      now.getTime() +
      INVITATION_EXPIRATION_DAYS *
        24 *
        60 *
        60 *
        1000
    );

  const id =
    crypto.randomUUID();

  const record:
    BusinessInvitationRecord = {
      id,

      invitationType:
        "business",

      invitationCode:
        code,

      inviteCode:
        code,

      normalizedInvitationCode:
        code,

      invitationLink:
        inviteLink,

      inviteLink,

      businessID,
      ownerUID,
      invitedByUID,

      fullName,
      email,

      phone:
        cleanText(
          input.phone
        ),

      roleRawValue:
        input.role,

      role:
        input.role,

      statusRawValue:
        "pending",

      status:
        "pending",

      isActive:
        true,

      notes:
        cleanText(
          input.notes
        ),

      createdAt:
        now,

      expiresAt,
    };

  const payload = {
    ...record,

    createdAt:
      Timestamp.fromDate(
        now
      ),

    expiresAt:
      Timestamp.fromDate(
        expiresAt
      ),

    updatedAt:
      serverTimestamp(),
  };

  await setDoc(
    doc(
      db,
      BUSINESS_INVITATIONS_COLLECTION,
      code
    ),
    payload,
    {
      merge:
        true,
    }
  );

  return record;
}

// ============================================================
// MARK: - Firestore Normalization
// ============================================================

function dateFromFirestore(
  value:
    unknown,
  fallback:
    Date = new Date(0)
): Date {
  if (
    value instanceof Timestamp
  ) {
    return value.toDate();
  }

  if (
    value instanceof Date
  ) {
    return value;
  }

  if (
    typeof value === "string"
  ) {
    const parsed =
      new Date(
        value
      );

    if (
      !Number.isNaN(
        parsed.getTime()
      )
    ) {
      return parsed;
    }
  }

  return fallback;
}

function optionalDateFromFirestore(
  value:
    unknown
): Date | undefined {
  const date =
    dateFromFirestore(
      value
    );

  return date.getTime() > 0
    ? date
    : undefined;
}

function normalizeBusinessInvitationRecord(
  documentID: string,
  data: DocumentData
): BusinessInvitationRecord {
  const invitationCode =
    normalizeInvitationCode(
      data["invitationCode"] ??
      data["inviteCode"] ??
      data["normalizedInvitationCode"] ??
      documentID
    );

  const status =
    cleanText(
      data["status"] ??
      data["statusRawValue"]
    ) as BusinessInvitationStatus;

  const role =
    cleanText(
      data["role"] ??
      data["roleRawValue"]
    ) as AppUserRole;

  const createdAt =
    dateFromFirestore(
      data["createdAt"]
    );

  const expiresAt =
    dateFromFirestore(
      data["expiresAt"]
    );

  return {
    id:
      cleanText(
        data["id"]
      ) ||
      documentID,

    invitationType:
      "business",

    invitationCode,

    inviteCode:
      invitationCode,

    normalizedInvitationCode:
      invitationCode,

    invitationLink:
      cleanText(
        data["invitationLink"] ??
        data["inviteLink"]
      ) ||
      createInvitationLink(
        invitationCode
      ),

    inviteLink:
      cleanText(
        data["inviteLink"] ??
        data["invitationLink"]
      ) ||
      createInvitationLink(
        invitationCode
      ),

    businessID:
      cleanText(
        data["businessID"]
      ),

    ownerUID:
      cleanText(
        data["ownerUID"]
      ),

    invitedByUID:
      cleanText(
        data["invitedByUID"]
      ),

    fullName:
      cleanText(
        data["fullName"]
      ),

    email:
      normalizeEmail(
        data["email"]
      ),

    phone:
      cleanText(
        data["phone"]
      ),

    roleRawValue:
      role,

    role,

    statusRawValue:
      status,

    status,

    isActive:
      data["isActive"] === true,

    notes:
      cleanText(
        data["notes"]
      ),

    createdAt,

    expiresAt,

    acceptedAt:
      optionalDateFromFirestore(
        data["acceptedAt"]
      ),

    declinedAt:
      optionalDateFromFirestore(
        data["declinedAt"]
      ),

    cancelledAt:
      optionalDateFromFirestore(
        data["cancelledAt"]
      ),

    acceptedByUID:
      cleanText(
        data["acceptedByUID"]
      ) ||
      undefined,

    acceptedUserEmail:
      normalizeEmail(
        data["acceptedUserEmail"]
      ) ||
      undefined,
  };
}

// ============================================================
// MARK: - Fetch Business Invitations
// ============================================================

export async function fetchBusinessInvitations(
  businessIDValue: string,
  ownerUIDValue?: string
): Promise<BusinessInvitationRecord[]> {
  const businessID =
    requireText(
      businessIDValue,
      "Business ID"
    );

  const ownerUID =
    cleanText(
      ownerUIDValue
    );

  const snapshot =
    await getDocs(
      query(
        collection(
          db,
          BUSINESS_INVITATIONS_COLLECTION
        ),
        where(
          "businessID",
          "==",
          businessID
        )
      )
    );

  return snapshot.docs
    .map(
      (document) =>
        normalizeBusinessInvitationRecord(
          document.id,
          document.data()
        )
    )
    .filter(
      (invitation) =>
        invitation.businessID ===
          businessID &&
        (
          !ownerUID ||
          invitation.ownerUID ===
            ownerUID
        )
    )
    .sort(
      (a, b) =>
        b.createdAt.getTime() -
        a.createdAt.getTime()
    );
}

