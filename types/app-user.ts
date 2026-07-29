import type { Timestamp } from "firebase/firestore";

// MARK: - User Role

export type UserRole =
  | "admin"
  | "manager"
  | "employee"
  | "customer"
  | "provider";

// MARK: - App User Record

export interface AppUserRecord {
  firebaseUID: string;

  businessID: string;
  ownerUID: string;

  username: string;
  fullName: string;
  email: string;
  phone: string;

  role: UserRole;
  businessName: string;

  isBusinessOwner: boolean;
  isPlatformAdministrator: boolean;
  isActive: boolean;

  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

// MARK: - Default App User

export function makeEmptyAppUserRecord(
  firebaseUID: string
): AppUserRecord {
  return {
    firebaseUID,

    businessID: "",
    ownerUID: "",

    username: "",
    fullName: "",
    email: "",
    phone: "",

    role: "customer",
    businessName: "",

    isBusinessOwner: false,
    isPlatformAdministrator: false,
    isActive: true,

    createdAt: null,
    updatedAt: null,
  };
}