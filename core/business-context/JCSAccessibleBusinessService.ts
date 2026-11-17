/*
 * JCS Business Suite Web
 * JCSAccessibleBusinessService.ts
 *
 * Shared multi-business authority for authenticated JCS users.
 *
 * PURPOSE
 *
 * A Firebase Authentication user may be associated with more than
 * one JCS business.
 *
 * Examples:
 *
 * - Business Owner:
 *   every business owned by that owner.
 *
 * - Team Member:
 *   every business where the user has an active membership.
 *
 * - Customer / Provider:
 *   every business where the user has an active authorized
 *   association represented by businessMemberships.
 *
 * IMPORTANT
 *
 * accessibleBusinesses is NOT the same thing as activeBusinessID.
 *
 * Creating another business must not automatically replace the
 * currently selected workspace.
 *
 * This service is READ ONLY.
 * It never grants entitlement.
 * It never writes the active workspace to Firestore.
 * It never changes Stripe state.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import {
  db,
} from "@/core/firebase/firebase";


// =======================================================
// MARK: - Types
// =======================================================

export interface JCSAccessibleBusinessMembership {
  membershipID: string;

  businessID: string;

  userUID: string;
  firebaseUID: string;

  role: string;

  permissions: string[];
  enabledModules: string[];

  status: string;
  isActive: boolean;
}


export interface JCSAccessibleBusiness {
  businessID: string;
  businessName: string;

  ownerUID: string;
  ownerFirebaseUID: string;

  role: string;

  permissions: string[];
  enabledModules: string[];

  membershipID: string;

  membershipStatus: string;
  membershipIsActive: boolean;

  isOwnedByAuthenticatedUser: boolean;

  businessStatus: string;
  onboardingStatus: string;

  planName: string;
}


export interface JCSAccessibleBusinessResolution {
  firebaseUID: string;

  businesses: JCSAccessibleBusiness[];

  memberships:
    JCSAccessibleBusinessMembership[];
}


// =======================================================
// MARK: - Helpers
// =======================================================

function clean(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}


function stringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (
        item
      ): item is string =>
        typeof item === "string"
    )
    .map(
      (item) => item.trim()
    )
    .filter(Boolean);
}


function booleanValue(
  value: unknown,
  fallback = false
): boolean {
  return typeof value === "boolean"
    ? value
    : fallback;
}


function membershipFromSnapshot(
  snapshot:
    QueryDocumentSnapshot<DocumentData>
): JCSAccessibleBusinessMembership {

  const data =
    snapshot.data();

  return {
    membershipID:
      clean(data.membershipID) ||
      snapshot.id,

    businessID:
      clean(data.businessID),

    userUID:
      clean(data.userUID),

    firebaseUID:
      clean(data.firebaseUID),

    role:
      clean(data.role),

    permissions:
      stringArray(
        data.permissions
      ),

    enabledModules:
      stringArray(
        data.enabledModules
      ),

    status:
      clean(data.status),

    isActive:
      booleanValue(
        data.isActive,
        clean(data.status)
          .toLowerCase() ===
          "active"
      ),
  };
}


// =======================================================
// MARK: - Resolve Accessible Businesses
// =======================================================

/**
 * Returns every active JCS business association belonging to
 * the authenticated Firebase user.
 *
 * Authority:
 *
 * businessMemberships
 *   where firebaseUID == authenticated Firebase UID
 *
 * followed by:
 *
 * businesses/{businessID}
 *
 * No active-workspace decision is made here.
 */
export async function
resolveAccessibleBusinessesForFirebaseUser(
  firebaseUID: string
): Promise<JCSAccessibleBusinessResolution> {

  const normalizedFirebaseUID =
    clean(
      firebaseUID
    );

  if (!normalizedFirebaseUID) {
    return {
      firebaseUID: "",
      businesses: [],
      memberships: [],
    };
  }


  const membershipQuery =
    query(
      collection(
        db,
        "businessMemberships"
      ),

      where(
        "firebaseUID",
        "==",
        normalizedFirebaseUID
      )
    );


  const membershipSnapshot =
    await getDocs(
      membershipQuery
    );


  const memberships =
    membershipSnapshot.docs
      .map(
        membershipFromSnapshot
      )
      .filter(
        (membership) =>
          Boolean(
            membership.businessID
          ) &&
          membership.firebaseUID ===
            normalizedFirebaseUID &&
          membership.isActive !== false &&
          (
            !membership.status ||
            membership.status
              .toLowerCase() ===
              "active"
          )
      );


  const uniqueMembershipByBusinessID =
    new Map<
      string,
      JCSAccessibleBusinessMembership
    >();


  for (
    const membership of memberships
  ) {
    if (
      !uniqueMembershipByBusinessID.has(
        membership.businessID
      )
    ) {
      uniqueMembershipByBusinessID.set(
        membership.businessID,
        membership
      );
    }
  }


  const uniqueMemberships =
    Array.from(
      uniqueMembershipByBusinessID.values()
    );


  const businesses =
    (
      await Promise.all(
        uniqueMemberships.map(
          async (
            membership
          ): Promise<
            JCSAccessibleBusiness | null
          > => {

            const businessSnapshot =
              await getDoc(
                doc(
                  db,
                  "businesses",
                  membership.businessID
                )
              );


            if (
              !businessSnapshot.exists()
            ) {
              return null;
            }


            const businessData =
              businessSnapshot.data();


            const businessID =
              clean(
                businessData.businessID
              ) ||
              businessSnapshot.id;


            if (
              businessID !==
              membership.businessID
            ) {
              return null;
            }


            const ownerFirebaseUID =
              clean(
                businessData.ownerFirebaseUID
              );


            return {
              businessID,

              businessName:
                clean(
                  businessData.businessName
                ) ||
                clean(
                  businessData.companyName
                ) ||
                "Business",

              ownerUID:
                clean(
                  businessData.ownerUID
                ),

              ownerFirebaseUID,

              role:
                membership.role,

              permissions:
                membership.permissions,

              enabledModules:
                membership.enabledModules,

              membershipID:
                membership.membershipID,

              membershipStatus:
                membership.status,

              membershipIsActive:
                membership.isActive,

              isOwnedByAuthenticatedUser:
                ownerFirebaseUID ===
                  normalizedFirebaseUID ||
                membership.role
                  .toLowerCase() ===
                  "businessowner",

              businessStatus:
                clean(
                  businessData.status
                ),

              onboardingStatus:
                clean(
                  businessData
                    .onboardingStatus
                ),

              planName:
                clean(
                  businessData.planName
                ),
            };
          }
        )
      )
    )
      .filter(
        (
          business
        ): business is JCSAccessibleBusiness =>
          business !== null
      )
      .sort(
        (
          left,
          right
        ) =>
          left.businessName.localeCompare(
            right.businessName,
            undefined,
            {
              sensitivity: "base",
            }
          )
      );


  return {
    firebaseUID:
      normalizedFirebaseUID,

    businesses,

    memberships:
      uniqueMemberships,
  };
}


// =======================================================
// MARK: - Access Check
// =======================================================

export function
canAccessBusiness(
  businesses:
    readonly JCSAccessibleBusiness[],
  businessID: string
): boolean {

  const normalizedBusinessID =
    clean(
      businessID
    );

  if (!normalizedBusinessID) {
    return false;
  }


  return businesses.some(
    (business) =>
      business.businessID ===
        normalizedBusinessID &&
      business.membershipIsActive !==
        false
  );
}


// =======================================================
// MARK: - Owned Businesses
// =======================================================

export function
ownedBusinessesFromAccessibleBusinesses(
  businesses:
    readonly JCSAccessibleBusiness[]
): JCSAccessibleBusiness[] {

  return businesses.filter(
    (business) =>
      business
        .isOwnedByAuthenticatedUser
  );
}
