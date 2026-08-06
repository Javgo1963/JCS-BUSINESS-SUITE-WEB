"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  type DocumentData,
} from "firebase/firestore";

import type {
  User,
} from "firebase/auth";

import {
  observeAuthState,
} from "@/core/services/AuthService";

import {
  db,
} from "@/core/firebase/firebase";

// =======================================================
// MARK: - Firestore Models
// =======================================================

export interface JCSAppUser {
  firebaseUID: string;

  /*
   * Required for business-linked users.
   * Optional for PlatformAdmin.
   */
  businessID?: string;
  ownerUID?: string;

  fullName: string;
  email: string;

  profileImageURL?: string;

  role: string;
  roleRawValue?: string;

  enabledModules: string[];
  disabledModules?: string[];

  permissions: string[];

  isBusinessOwner: boolean;
  isPlatformAdministrator: boolean;
  isActive: boolean;
  canManageCustomers: boolean;
  canManageEmployees: boolean;
  canManageProviders: boolean;
  canManageAppUsers: boolean;
  canManageSettings: boolean;
}

export interface JCSBusiness {
  businessID: string;
  businessName: string;

  ownerUID: string;

  businessModeKey: string;
  businessModeName: string;

  industryCategoryKey: string;
  industryCategoryTitle: string;

  status: string;

  recommendedModules?: string[];
  enabledModules?: string[];
  disabledModules?: string[];
}

export interface JCSAppSettings {
  businessID: string;

  companyName: string;

  accentColorName: string;

  logoFileName?: string;
  backgroundFileName?: string;

  taxPercent: number;

  languageCode: string;
  localeIdentifier: string;
  timeZoneIdentifier: string;
  currencyCode?: string;
}

export interface JCSBusinessMembership {
  businessID: string;

  /*
   * userUID may contain the internal ownerUID.
   * firebaseUID identifies the Firebase Authentication user.
   */
  userUID: string;
  firebaseUID?: string;

  role: string;

  permissions: string[];
  enabledModules?: string[];

  status: string;
  isActive?: boolean;
}

// =======================================================
// MARK: - Context
// =======================================================

interface BusinessContextValue {
  firebaseUser: User | null;

  appUser: JCSAppUser | null;
  business: JCSBusiness | null;
  appSettings: JCSAppSettings | null;
  membership: JCSBusinessMembership | null;

  businessID: string;
  ownerUID: string;

  isPlatformAdministrator: boolean;

  activeAccentColorName: string;

  setActiveAccentColor: (
    accentColorName: string
  ) => void;

  isLoading: boolean;
  errorMessage: string;

  refresh: () => Promise<void>;
}

const BusinessContext =
  createContext<BusinessContextValue | null>(
    null
  );

// =======================================================
// MARK: - Helpers
// =======================================================

function cleanText(
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

  return value.filter(
    (item): item is string =>
      typeof item === "string" &&
      item.trim().length > 0
  );
}

function resolvePlatformAdministrator(
  data: DocumentData
): boolean {
  if (
    data.isPlatformAdministrator === true ||
    data.isPlatformAdmin === true
  ) {
    return true;
  }

  const role = (
    cleanText(data.roleRawValue) ||
    cleanText(data.role)
  )
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  return (
    role === "platformadministrator" ||
    role === "platformadmin"
  );
}

function appUserFromData(
  data: DocumentData,
  firebaseUID: string,
  firebaseEmail: string
): JCSAppUser {
  return {
    firebaseUID:
      cleanText(
        data.firebaseUID
      ) ||
      firebaseUID,

    businessID:
      cleanText(
        data.businessID
      ) ||
      undefined,

    ownerUID:
      cleanText(
        data.ownerUID
      ) ||
      undefined,

    fullName:
      cleanText(
        data.fullName
      ) ||
      cleanText(
        data.displayName
      ),

    email:
      cleanText(
        data.email
      ) ||
      cleanText(
        data.username
      ) ||
      firebaseEmail,

      profileImageURL:
      cleanText(
       data.profileImageURL
      ) ||
       undefined,

    role:
      cleanText(
        data.role
      ) ||
      cleanText(
        data.roleRawValue
      ) ||
      "user",

    roleRawValue:
      cleanText(
        data.roleRawValue
      ) ||
      undefined,

    enabledModules:
      stringArray(
        data.enabledModules
      ),

    disabledModules:
      stringArray(
        data.disabledModules
      ),

    permissions:
      stringArray(
        data.permissions
      ),

    isBusinessOwner:
      data.isBusinessOwner ===
      true,

    isPlatformAdministrator:
      resolvePlatformAdministrator(
        data
      ),

    isActive:
      data.isActive !==
      false,

    canManageCustomers:
      data.canManageCustomers ===
      true,

    canManageEmployees:
      data.canManageEmployees ===
      true,

    canManageProviders:
      data.canManageProviders ===
      true,

    canManageAppUsers:
      data.canManageAppUsers ===
      true,

    canManageSettings:
      data.canManageSettings ===
      true,
  };
}

// =======================================================
// MARK: - Provider
// =======================================================

export function JCSBusinessContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    firebaseUser,
    setFirebaseUser,
  ] = useState<User | null>(null);

  const [
    appUser,
    setAppUser,
  ] = useState<JCSAppUser | null>(
    null
  );

  const [
    business,
    setBusiness,
  ] = useState<JCSBusiness | null>(
    null
  );

  const [
    membership,
    setMembership,
  ] =
    useState<JCSBusinessMembership | null>(
      null
    );

  const [
    appSettings,
    setAppSettings,
  ] = useState<JCSAppSettings | null>(
    null
  );

  // =====================================================
// MARK: - Accent Color
// =====================================================

const setActiveAccentColor =
  useCallback(
    (
      accentColorName: string
    ): void => {
      const normalizedAccentColor =
        cleanText(
          accentColorName
        );

      if (!normalizedAccentColor) {
        return;
      }

      setAppSettings(
        (
          currentSettings
        ) => {
          /*
           * A business context may still be loading its
           * Firestore App Settings record.
           *
           * In that case, create a safe temporary settings
           * object so the shell can still preview the selected
           * Accent Color immediately.
           */
          if (!currentSettings) {
            return {
              businessID:
                cleanText(
                  appUser?.businessID
                ),

              companyName:
                cleanText(
                  business?.businessName
                ) ||
                "JCS Business Suite",

              accentColorName:
                normalizedAccentColor,

              taxPercent:
                0,

              languageCode:
                "system",

              localeIdentifier:
                "en-US",

              timeZoneIdentifier:
                Intl.DateTimeFormat()
                  .resolvedOptions()
                  .timeZone,

              currencyCode:
                "USD",
            };
          }

          if (
            currentSettings
              .accentColorName ===
            normalizedAccentColor
          ) {
            return currentSettings;
          }

          return {
            ...currentSettings,

            accentColorName:
              normalizedAccentColor,
          };
        }
      );
    },
    [
      appUser?.businessID,
      business?.businessName,
    ]
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  // =====================================================
  // MARK: - Clear Business Data
  // =====================================================

  const clearBusinessData =
    useCallback((): void => {
      setBusiness(null);
      setMembership(null);
      setAppSettings(null);
    }, []);

  // =====================================================
  // MARK: - Load Business Context
  // =====================================================

  const loadBusinessContext =
    useCallback(
      async (
        firebase: User | null
      ): Promise<void> => {
        setFirebaseUser(firebase);
        setErrorMessage("");
        setIsLoading(true);

        /*
         * Clear previous tenant data immediately.
         * This prevents data from one signed-in user
         * appearing briefly for another user.
         */
        setAppUser(null);
        clearBusinessData();

        try {
          // MARK: No Authenticated User

          if (!firebase) {
            return;
          }

          // MARK: users/{firebaseUID}

          const userReference =
            doc(
              db,
              "users",
              firebase.uid
            );

          const userSnapshot =
            await getDoc(
              userReference
            );

          if (
            !userSnapshot.exists()
          ) {
            setErrorMessage(
              "The authenticated account does not have a JCS user profile."
            );

            return;
          }

          const resolvedAppUser =
            appUserFromData(
              userSnapshot.data(),
              firebase.uid,
              firebase.email ?? ""
            );

          setAppUser(
            resolvedAppUser
          );

          // MARK: Platform Administrator

          /*
           * PlatformAdmin is a global platform identity.
           *
           * It does not require:
           * - businessID
           * - ownerUID
           * - business membership
           * - tenant AppSettings
           *
           * Its access comes from:
           * isPlatformAdministrator === true
           *
           * It receives the complete Dashboard and the
           * exclusive Executive Center module.
           */
          if (
            resolvedAppUser
              .isPlatformAdministrator
          ) {
            clearBusinessData();

            return;
          }

          // MARK: Business User Validation

          const resolvedBusinessID =
            cleanText(
              resolvedAppUser
                .businessID
            );

          if (!resolvedBusinessID) {
            setErrorMessage(
              "This business user does not have a businessID."
            );

            return;
          }

          const resolvedOwnerUID =
            cleanText(
              resolvedAppUser
                .ownerUID
            );

          if (!resolvedOwnerUID) {
            setErrorMessage(
              "This business user does not have an ownerUID."
            );

            return;
          }

          // MARK: Load Tenant Documents

          /*
           * Business and AppSettings are independent,
           * so they can be loaded at the same time.
           */
          const [
            businessSnapshot,
            settingsSnapshot,
          ] = await Promise.all([
            getDoc(
              doc(
                db,
                "businesses",
                resolvedBusinessID
              )
            ),

            getDoc(
              doc(
                db,
             "businessSettings",
             resolvedBusinessID
             )
             )
          ]);

          if (
            businessSnapshot.exists()
          ) {
            setBusiness(
              businessSnapshot.data() as JCSBusiness
            );
          } else {
            setBusiness(null);

            setErrorMessage(
              "The business profile could not be found."
            );
          }

          if (
            settingsSnapshot.exists()
          ) {
            setAppSettings(
              settingsSnapshot.data() as JCSAppSettings
            );
          } else {
            setAppSettings(null);
          }

          // MARK: Membership

          /*
           * The registration engine stores:
           *
           * userUID     = internal ownerUID
           * firebaseUID = Firebase Authentication UID
           *
           * Therefore membership lookup must use
           * firebaseUID, not userUID.
           */
          const membershipQuery =
            query(
              collection(
                db,
                "businessMemberships"
              ),

              where(
                "businessID",
                "==",
                resolvedBusinessID
              ),

              where(
                "firebaseUID",
                "==",
                firebase.uid
              ),

              limit(1)
            );

          const membershipDocuments =
            await getDocs(
              membershipQuery
            );

          if (
            !membershipDocuments.empty
          ) {
            setMembership(
              membershipDocuments
                .docs[0]
                .data() as JCSBusinessMembership
            );
          } else {
            setMembership(null);

            /*
             * The Business Owner document already contains
             * complete owner permissions, so a temporarily
             * missing membership must not freeze the UI.
             */
            if (
              !resolvedAppUser
                .isBusinessOwner
            ) {
              setErrorMessage(
                "No active business membership was found for this user."
              );
            }
          }
        } catch (
          error: unknown
        ) {
          console.error(
            "❌ JCSBusinessContext load error:",
            error
          );

          const message =
            error instanceof Error
              ? error.message
              : "The business context could not be loaded.";

          setErrorMessage(
            message
          );
        } finally {
          /*
           * Critical:
           *
           * This always runs, even when Firestore throws
           * a permission, index, network or document error.
           * The Dashboard can no longer remain indefinitely
           * on “Preparing your workspace”.
           */
          setIsLoading(false);
        }
      },
      [
        clearBusinessData,
      ]
    );

  // =====================================================
  // MARK: - Firebase Listener
  // =====================================================

  useEffect(() => {
    const unsubscribe =
      observeAuthState(
        (
          resolvedFirebaseUser
        ) => {
          void loadBusinessContext(
            resolvedFirebaseUser
          );
        }
      );

    return unsubscribe;
  }, [
    loadBusinessContext,
  ]);

  // =====================================================
  // MARK: - Context Value
  // =====================================================

  const value =
    useMemo<BusinessContextValue>(
      () => ({
        firebaseUser,

        appUser,

        business,

        appSettings,

        membership,

        businessID:
          appUser
            ?.isPlatformAdministrator
            ? ""
            : appUser
                ?.businessID ??
              "",

        ownerUID:
          appUser
            ?.isPlatformAdministrator
            ? ""
            : appUser
                ?.ownerUID ??
              business
                ?.ownerUID ??
              "",

        isPlatformAdministrator:
  appUser
    ?.isPlatformAdministrator ===
  true,

activeAccentColorName:
  cleanText(
    appSettings
      ?.accentColorName
  ) ||
  "copper",

setActiveAccentColor,

isLoading,

errorMessage,

        refresh:
          async (): Promise<void> => {
            await loadBusinessContext(
              firebaseUser
            );
          },
      }),
      [
        firebaseUser,
        appUser,
        business,
        appSettings,
        membership,
        isLoading,
        errorMessage,
        loadBusinessContext,
        setActiveAccentColor,
      ]
    );

  return (
    <BusinessContext.Provider
      value={value}
    >
      {children}
    </BusinessContext.Provider>
  );
}

// =======================================================
// MARK: - Hook
// =======================================================

export function useBusinessContext(): BusinessContextValue {
  const context =
    useContext(
      BusinessContext
    );

  if (!context) {
    throw new Error(
      "useBusinessContext must be used inside JCSBusinessContextProvider."
    );
  }

  return context;
}