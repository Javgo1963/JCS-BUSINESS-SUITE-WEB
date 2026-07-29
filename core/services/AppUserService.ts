import {
  doc,
  getDoc,
  onSnapshot,
  type DocumentData,
  type DocumentSnapshot,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/core/firebase/firebase";

import type {
  AppUserRecord,
  UserRole,
} from "@/types/app-user";

// MARK: - Constants

const USERS_COLLECTION = "users";

// MARK: - Normalization Helpers

function stringValue(
  value: unknown,
  fallback = ""
): string {
  return typeof value === "string"
    ? value.trim()
    : fallback;
}

function booleanValue(
  value: unknown,
  fallback = false
): boolean {
  return typeof value === "boolean"
    ? value
    : fallback;
}

function normalizeRole(value: unknown): UserRole {
  switch (value) {
    case "admin":
    case "manager":
    case "employee":
    case "customer":
    case "provider":
      return value;

    default:
      return "customer";
  }
}

// MARK: - Document Mapping

function mapAppUserDocument(
  snapshot: DocumentSnapshot<DocumentData>
): AppUserRecord | null {
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    firebaseUID:
      stringValue(data.firebaseUID) ||
      snapshot.id,

    businessID: stringValue(data.businessID),
    ownerUID: stringValue(data.ownerUID),

    username: stringValue(data.username),
    fullName: stringValue(data.fullName),
    email: stringValue(data.email),
    phone: stringValue(data.phone),

    role: normalizeRole(data.role),
    businessName: stringValue(data.businessName),

    isBusinessOwner: booleanValue(
      data.isBusinessOwner
    ),

    isPlatformAdministrator: booleanValue(
      data.isPlatformAdministrator
    ),

    isActive: booleanValue(
      data.isActive,
      true
    ),

    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

// MARK: - App User Service

export const AppUserService = {
  async getUserByFirebaseUID(
    firebaseUID: string
  ): Promise<AppUserRecord | null> {
    const cleanUID = firebaseUID.trim();

    if (!cleanUID) {
      return null;
    }

    const userReference = doc(
      db,
      USERS_COLLECTION,
      cleanUID
    );

    const snapshot = await getDoc(
      userReference
    );

    return mapAppUserDocument(snapshot);
  },

  observeUserByFirebaseUID(
    firebaseUID: string,
    observer: (
      appUser: AppUserRecord | null
    ) => void,
    errorObserver?: (
      error: FirestoreError
    ) => void
  ): Unsubscribe {
    const cleanUID = firebaseUID.trim();

    if (!cleanUID) {
      observer(null);
      return () => undefined;
    }

    const userReference = doc(
      db,
      USERS_COLLECTION,
      cleanUID
    );

    return onSnapshot(
      userReference,
      (snapshot) => {
        observer(
          mapAppUserDocument(snapshot)
        );
      },
      (error) => {
        errorObserver?.(error);
      }
    );
  },
};