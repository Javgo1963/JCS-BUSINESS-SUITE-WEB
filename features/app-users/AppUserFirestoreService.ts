/*
 * JCS Business Suite
 * AppUserFirestoreService.ts
 *
 * Firestore and Firebase Authentication operations for business AppUsers.
 *
 * Responsibilities:
 *
 * - Load and subscribe to AppUsers for one business.
 * - Create and update business users.
 * - Change roles, permissions and modules.
 * - Activate and deactivate users.
 * - Protect Business Owners and Platform Administrators.
 * - Request secure Firebase Authentication operations through Cloud Functions.
 *
 * Passwords must never be stored in Firestore.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type FirestoreError,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import {
  httpsCallable,
} from "firebase/functions";

import {
  db,
  functions,
} from "@/core/firebase/firebase";

import {
  APP_USER_ROLES,
  appUserToFirestorePayload,
  canDeleteAppUser,
  canEditAppUser,
  canManageBusinessAppUsers,
  createAppUserRecord,
  normalizeAppUserRecord,
  type AppUserPermissions,
  type AppUserRecord,
  type AppUserRole,
  type CreateAppUserInput,
  type UpdateAppUserInput,
} from "@/models/AppUser";

// ============================================================
// MARK: - Constants
// ============================================================

const BUSINESSES_COLLECTION =
  "Businesses";

const APP_USERS_COLLECTION =
  "AppUsers";

// ============================================================
// MARK: - Inputs
// ============================================================

export interface AppUserActor {
  firebaseUID: string;
  businessID: string;

  isActive: boolean;
  isBusinessOwner: boolean;
  isPlatformAdministrator: boolean;
  canManageAppUsers: boolean;
}

export interface CreateBusinessAppUserInput
  extends CreateAppUserInput {
  temporaryPassword?: string;

  createAuthenticationAccount?: boolean;
  sendWelcomeEmail?: boolean;
}

export interface UpdateBusinessAppUserInput
  extends UpdateAppUserInput {
  enabledModules?: string[];
  disabledModules?: string[];
}

export interface AppUserSubscriptionHandlers {
  onUsers:
    (
      users: AppUserRecord[]
    ) => void;

  onError?:
    (
      error: Error
    ) => void;
}

export interface AuthenticationUserResult {
  firebaseUID: string;
  email: string;
  authenticationCreated: boolean;
  passwordResetSent: boolean;
}

// ============================================================
// MARK: - Cloud Function Payloads
// ============================================================

interface CreateAuthenticationAccountRequest {
  businessID: string;
  appUserDocumentID: string;

  email: string;
  fullName: string;

  temporaryPassword?: string;
  sendWelcomeEmail: boolean;
}

interface CreateAuthenticationAccountResponse {
  firebaseUID: string;
  email: string;
  authenticationCreated: boolean;
  passwordResetSent?: boolean;
}

interface UpdateAuthenticationEmailRequest {
  businessID: string;
  targetFirebaseUID: string;
  newEmail: string;
}

interface SetTemporaryPasswordRequest {
  businessID: string;
  targetFirebaseUID: string;
  temporaryPassword: string;
}

interface SendPasswordResetRequest {
  businessID: string;
  targetFirebaseUID: string;
  email: string;
}

interface SetAuthenticationDisabledRequest {
  businessID: string;
  targetFirebaseUID: string;
  disabled: boolean;
}

interface DeleteAuthenticationAccountRequest {
  businessID: string;
  targetFirebaseUID: string;
}

// ============================================================
// MARK: - Text Helpers
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

function normalizeStringArray(
  values:
    | readonly string[]
    | null
    | undefined
): string[] {
  if (!values) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map(
          cleanText
        )
        .filter(Boolean)
    )
  );
}

function normalizedError(
  error: unknown,
  fallbackMessage: string
): Error {
  if (
    error instanceof Error
  ) {
    return error;
  }

  return new Error(
    fallbackMessage
  );
}

// ============================================================
// MARK: - Validation
// ============================================================

function requireText(
  value: string,
  fieldName: string
): string {
  const normalized =
    cleanText(
      value
    );

  if (!normalized) {
    throw new Error(
      `${fieldName} is required.`
    );
  }

  return normalized;
}

function assertActorCanManageBusiness(
  actor: AppUserActor,
  businessID: string
): void {
  const normalizedBusinessID =
    requireText(
      businessID,
      "Business ID"
    );

  if (
    actor.isPlatformAdministrator
  ) {
    return;
  }

  if (
    !actor.isActive
  ) {
    throw new Error(
      "Your AppUser account is inactive."
    );
  }

  if (
    cleanText(
      actor.businessID
    ) !== normalizedBusinessID
  ) {
    throw new Error(
      "You cannot manage users from another business."
    );
  }

  if (
    !actor.isBusinessOwner &&
    !actor.canManageAppUsers
  ) {
    throw new Error(
      "You do not have permission to manage App Users."
    );
  }
}

function actorAsAppUserRecord(
  actor: AppUserActor
): AppUserRecord {
  return createAppUserRecord({
    username:
      actor.firebaseUID,

    firebaseUID:
      actor.firebaseUID,

    businessID:
      actor.businessID,

    ownerUID:
      actor.firebaseUID,

    role:
      APP_USER_ROLES.admin,

    isActive:
      actor.isActive,

    isBusinessOwner:
      actor.isBusinessOwner,

    isPlatformAdministrator:
      actor.isPlatformAdministrator,

      enabledModules:[],
      disabledModules:[],

    permissions: {
      canManageAppUsers:
        actor.canManageAppUsers,
    },
  });
}

function assertCanEditTarget(
  actor: AppUserActor,
  target: AppUserRecord
): void {
  assertActorCanManageBusiness(
    actor,
    target.businessID
  );

  if (
    !canEditAppUser(
      actorAsAppUserRecord(
        actor
      ),
      target
    )
  ) {
    throw new Error(
      "You cannot edit this App User."
    );
  }
}

function assertCanDeleteTarget(
  actor: AppUserActor,
  target: AppUserRecord
): void {
  assertActorCanManageBusiness(
    actor,
    target.businessID
  );

  if (
    !canDeleteAppUser(
      actorAsAppUserRecord(
        actor
      ),
      target
    )
  ) {
    throw new Error(
      "This App User cannot be deleted."
    );
  }
}

// ============================================================
// MARK: - Firestore References
// ============================================================

function businessAppUsersCollection(
  businessID: string
) {
  const normalizedBusinessID =
    requireText(
      businessID,
      "Business ID"
    );

  return collection(
    db,
    BUSINESSES_COLLECTION,
    normalizedBusinessID,
    APP_USERS_COLLECTION
  );
}

function businessAppUserDocument(
  businessID: string,
  appUserDocumentID: string
) {
  const normalizedBusinessID =
    requireText(
      businessID,
      "Business ID"
    );

  const normalizedDocumentID =
    requireText(
      appUserDocumentID,
      "App User document ID"
    );

  return doc(
    db,
    BUSINESSES_COLLECTION,
    normalizedBusinessID,
    APP_USERS_COLLECTION,
    normalizedDocumentID
  );
}

// ============================================================
// MARK: - Document Normalization
// ============================================================

function appUserFromSnapshot(
  snapshot:
    QueryDocumentSnapshot<
      DocumentData
    >
): AppUserRecord {
  return normalizeAppUserRecord(
    snapshot.id,
    snapshot.data()
  );
}

function sortAppUsers(
  users:
    readonly AppUserRecord[]
): AppUserRecord[] {
  return [...users]
    .sort(
      (
        first,
        second
      ) => {
        if (
          first.isBusinessOwner !==
          second.isBusinessOwner
        ) {
          return first.isBusinessOwner
            ? -1
            : 1;
        }

        if (
          first.isActive !==
          second.isActive
        ) {
          return first.isActive
            ? -1
            : 1;
        }

        const firstName =
          first.fullName ||
          first.username ||
          first.email;

        const secondName =
          second.fullName ||
          second.username ||
          second.email;

        return firstName.localeCompare(
          secondName,
          undefined,
          {
            sensitivity:
              "base",
          }
        );
      }
    );
}

// ============================================================
// MARK: - Read App Users
// ============================================================

export async function fetchBusinessAppUsers(
  actor: AppUserActor,
  businessID: string
): Promise<AppUserRecord[]> {
  assertActorCanManageBusiness(
    actor,
    businessID
  );

  const appUsersQuery =
    query(
      businessAppUsersCollection(
        businessID
      ),
      orderBy(
        "fullName",
        "asc"
      ),
      limit(
        1000
      )
    );

  const snapshot =
    await getDocs(
      appUsersQuery
    );

  return sortAppUsers(
    snapshot.docs.map(
      appUserFromSnapshot
    )
  );
}

// ============================================================
// MARK: - Live App User Subscription
// ============================================================

export function subscribeToBusinessAppUsers(
  actor: AppUserActor,
  businessID: string,
  handlers: AppUserSubscriptionHandlers
): Unsubscribe {
  assertActorCanManageBusiness(
    actor,
    businessID
  );

  const appUsersQuery =
    query(
      businessAppUsersCollection(
        businessID
      ),
      orderBy(
        "fullName",
        "asc"
      ),
      limit(
        1000
      )
    );

  return onSnapshot(
    appUsersQuery,
    (
      snapshot
    ) => {
      handlers.onUsers(
        sortAppUsers(
          snapshot.docs.map(
            appUserFromSnapshot
          )
        )
      );
    },
    (
      error:
        FirestoreError
    ) => {
      handlers.onError?.(
        normalizedError(
          error,
          "Unable to synchronize App Users."
        )
      );
    }
  );
}

// ============================================================
// MARK: - Read One App User
// ============================================================

export async function fetchBusinessAppUser(
  actor: AppUserActor,
  businessID: string,
  appUserDocumentID: string
): Promise<AppUserRecord | null> {
  assertActorCanManageBusiness(
    actor,
    businessID
  );

  const snapshot =
    await getDoc(
      businessAppUserDocument(
        businessID,
        appUserDocumentID
      )
    );

  if (
    !snapshot.exists()
  ) {
    return null;
  }

  return normalizeAppUserRecord(
    snapshot.id,
    snapshot.data()
  );
}

// ============================================================
// MARK: - Duplicate Validation
// ============================================================

async function assertUsernameAvailable(
  businessID: string,
  username: string,
  excludingDocumentID?: string
): Promise<void> {
  const normalizedUsername =
    cleanText(
      username
    ).toLowerCase();

  if (
    !normalizedUsername
  ) {
    throw new Error(
      "Username is required."
    );
  }

  const usernameQuery =
    query(
      businessAppUsersCollection(
        businessID
      ),
      where(
        "usernameNormalized",
        "==",
        normalizedUsername
      ),
      limit(
        2
      )
    );

  const snapshot =
    await getDocs(
      usernameQuery
    );

  const duplicate =
    snapshot.docs.some(
      (
        document
      ) =>
        document.id !==
        excludingDocumentID
    );

  if (
    duplicate
  ) {
    throw new Error(
      "This username is already used by another App User."
    );
  }
}

async function assertEmailAvailable(
  businessID: string,
  email: string,
  excludingDocumentID?: string
): Promise<void> {
  const normalizedEmail =
    normalizeEmail(
      email
    );

  if (
    !normalizedEmail
  ) {
    return;
  }

  const emailQuery =
    query(
      businessAppUsersCollection(
        businessID
      ),
      where(
        "emailNormalized",
        "==",
        normalizedEmail
      ),
      limit(
        2
      )
    );

  const snapshot =
    await getDocs(
      emailQuery
    );

  const duplicate =
    snapshot.docs.some(
      (
        document
      ) =>
        document.id !==
        excludingDocumentID
    );

  if (
    duplicate
  ) {
    throw new Error(
      "This email is already assigned to another App User in this business."
    );
  }
}

// ============================================================
// MARK: - Create App User
// ============================================================

export async function createBusinessAppUser(
  actor: AppUserActor,
  input: CreateBusinessAppUserInput
): Promise<AppUserRecord> {
  const businessID =
    requireText(
      input.businessID,
      "Business ID"
    );

  assertActorCanManageBusiness(
    actor,
    businessID
  );

  const username =
    requireText(
      input.username,
      "Username"
    ).toLowerCase();

  const fullName =
    requireText(
      input.fullName ?? "",
      "Full name"
    );

  const email =
    normalizeEmail(
      input.email
    );

  await Promise.all([
    assertUsernameAvailable(
      businessID,
      username
    ),

    assertEmailAvailable(
      businessID,
      email
    ),
  ]);

  const appUserReference =
    doc(
      businessAppUsersCollection(
        businessID
      )
    );

  let user =
    createAppUserRecord({
      ...input,

      username,
      fullName,
      email,

      businessID,

      ownerUID:
        requireText(
          input.ownerUID,
          "Owner UID"
        ),

      firebaseUID:
        cleanText(
          input.firebaseUID
        ),

      isBusinessOwner:
        false,

      isPlatformAdministrator:
        false,
    });

  user = {
    ...user,

    id:
      appUserReference.id,

    enabledModules:
      normalizeStringArray(
        input.enabledModules
      ),

    disabledModules:
      normalizeStringArray(
        input.disabledModules
      ),
  };

  const payload = {
    ...appUserToFirestorePayload(
      user
    ),

    usernameNormalized:
      username,

    emailNormalized:
      email,

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),

    createdByUID:
      cleanText(
        actor.firebaseUID
      ),
  };

  await setDoc(
    appUserReference,
    payload
  );

  const shouldCreateAuthentication =
    input.createAuthenticationAccount ??
    Boolean(
      email
    );

  if (
    shouldCreateAuthentication
  ) {
    try {
      const authenticationResult =
        await createAppUserAuthenticationAccount({
          businessID,
          appUserDocumentID:
            appUserReference.id,

          email,
          fullName,

          temporaryPassword:
            cleanText(
              input.temporaryPassword
            ) || undefined,

          sendWelcomeEmail:
            input.sendWelcomeEmail ??
            true,
        });

      user = {
        ...user,

        firebaseUID:
          authenticationResult.firebaseUID,
      };

      await updateDoc(
        appUserReference,
        {
          firebaseUID:
            authenticationResult.firebaseUID,

          authenticationEnabled:
            true,

          authenticationCreatedAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );
    } catch (
      error: unknown
    ) {
      await updateDoc(
        appUserReference,
        {
          authenticationEnabled:
            false,

          authenticationSetupError:
            normalizedError(
              error,
              "Unable to create authentication account."
            ).message,

          updatedAt:
            serverTimestamp(),
        }
      );

      throw error;
    }
  }

  return user;
}

// ============================================================
// MARK: - Update App User
// ============================================================

export async function updateBusinessAppUser(
  actor: AppUserActor,
  target: AppUserRecord,
  input: UpdateBusinessAppUserInput
): Promise<AppUserRecord> {
  assertCanEditTarget(
    actor,
    target
  );

  const businessID =
    requireText(
      target.businessID,
      "Business ID"
    );

  const fullName =
    input.fullName !==
    undefined
      ? requireText(
          input.fullName,
          "Full name"
        )
      : target.fullName;

  const username =
    input.username !==
    undefined
      ? requireText(
          input.username,
          "Username"
        ).toLowerCase()
      : target.username;

  const email =
    input.email !==
    undefined
      ? normalizeEmail(
          input.email
        )
      : target.email;

  await Promise.all([
    assertUsernameAvailable(
      businessID,
      username,
      target.id
    ),

    assertEmailAvailable(
      businessID,
      email,
      target.id
    ),
  ]);

  const requestedRole:
    AppUserRole =
      target.isBusinessOwner
        ? APP_USER_ROLES.admin
        : input.role ??
          target.roleRawValue;

  const nextUser:
    AppUserRecord = {
      ...target,

      username,
      fullName,
      email,

      phone:
        input.phone !==
        undefined
          ? cleanText(
              input.phone
            )
          : target.phone,

      addressLine1:
        input.addressLine1 !==
        undefined
          ? cleanText(
              input.addressLine1
            )
          : target.addressLine1,

      addressLine2:
        input.addressLine2 !==
        undefined
          ? cleanText(
              input.addressLine2
            )
          : target.addressLine2,

      roleRawValue:
        requestedRole,

      isActive:
        target.isBusinessOwner
          ? true
          : input.isActive ??
            target.isActive,

      profileImageURL:
        input.profileImageURL !==
        undefined
          ? cleanText(
              input.profileImageURL
            )
          : target.profileImageURL,

      businessName:
        input.businessName !==
        undefined
          ? cleanText(
              input.businessName
            )
          : target.businessName,

      isBusinessOwner:
        target.isBusinessOwner,

      enabledModules:
        input.enabledModules !==
        undefined
          ? normalizeStringArray(
              input.enabledModules
            )
          : target.enabledModules,

      disabledModules:
        input.disabledModules !==
        undefined
          ? normalizeStringArray(
              input.disabledModules
            )
          : target.disabledModules,

      updatedAt:
        new Date(),

      ...(
        input.permissions ??
        {}
      ),
    };

  await updateDoc(
    businessAppUserDocument(
      businessID,
      target.id
    ),
    {
      ...appUserToFirestorePayload(
        nextUser
      ),

      usernameNormalized:
        username.toLowerCase(),

      emailNormalized:
        email,

      updatedAt:
        serverTimestamp(),

      updatedByUID:
        cleanText(
          actor.firebaseUID
        ),
    }
  );

  return nextUser;
}

// ============================================================
// MARK: - Role and Permission Updates
// ============================================================

export async function updateBusinessAppUserAccess(
  actor: AppUserActor,
  target: AppUserRecord,
  options: {
    role: AppUserRole;
    permissions: Partial<AppUserPermissions>;
    enabledModules: string[];
    disabledModules: string[];
  }
): Promise<AppUserRecord> {
  return updateBusinessAppUser(
    actor,
    target,
    {
      role:
        options.role,

      permissions:
        options.permissions,

      enabledModules:
        options.enabledModules,

      disabledModules:
        options.disabledModules,
    }
  );
}

// ============================================================
// MARK: - Activate / Deactivate
// ============================================================

export async function setBusinessAppUserActive(
  actor: AppUserActor,
  target: AppUserRecord,
  isActive: boolean
): Promise<void> {
  assertCanEditTarget(
    actor,
    target
  );

  if (
    target.isBusinessOwner &&
    !isActive
  ) {
    throw new Error(
      "The primary Business Owner cannot be deactivated."
    );
  }

  await updateDoc(
    businessAppUserDocument(
      target.businessID,
      target.id
    ),
    {
      isActive,

      updatedAt:
        serverTimestamp(),

      updatedByUID:
        cleanText(
          actor.firebaseUID
        ),
    }
  );

  if (
    target.firebaseUID
  ) {
    await setAppUserAuthenticationDisabled({
      businessID:
        target.businessID,

      targetFirebaseUID:
        target.firebaseUID,

      disabled:
        !isActive,
    });
  }
}

// ============================================================
// MARK: - Delete App User
// ============================================================

export async function deleteBusinessAppUser(
  actor: AppUserActor,
  target: AppUserRecord,
  options?: {
    deleteAuthenticationAccount?: boolean;
  }
): Promise<void> {
  assertCanDeleteTarget(
    actor,
    target
  );

  if (
    options
      ?.deleteAuthenticationAccount &&
    target.firebaseUID
  ) {
    await deleteAppUserAuthenticationAccount({
      businessID:
        target.businessID,

      targetFirebaseUID:
        target.firebaseUID,
    });
  }

  await deleteDoc(
    businessAppUserDocument(
      target.businessID,
      target.id
    )
  );
}

// ============================================================
// MARK: - Bulk Module Assignment
// ============================================================

export async function updateAppUserModules(
  actor: AppUserActor,
  target: AppUserRecord,
  enabledModules: readonly string[],
  disabledModules: readonly string[]
): Promise<void> {
  assertCanEditTarget(
    actor,
    target
  );

  await updateDoc(
    businessAppUserDocument(
      target.businessID,
      target.id
    ),
    {
      enabledModules:
        normalizeStringArray(
          enabledModules
        ),

      disabledModules:
        normalizeStringArray(
          disabledModules
        ),

      updatedAt:
        serverTimestamp(),

      updatedByUID:
        cleanText(
          actor.firebaseUID
        ),
    }
  );
}

// ============================================================
// MARK: - Bulk Permission Assignment
// ============================================================

export async function updateAppUserPermissions(
  actor: AppUserActor,
  target: AppUserRecord,
  permissions:
    Partial<AppUserPermissions>
): Promise<void> {
  assertCanEditTarget(
    actor,
    target
  );

  const permissionPayload:
    Record<string, unknown> = {
      updatedAt:
        serverTimestamp(),

      updatedByUID:
        cleanText(
          actor.firebaseUID
        ),
  };

  Object.entries(
    permissions
  ).forEach(
    (
      [
        permissionName,
        permissionValue,
      ]
    ) => {
      if (
        typeof permissionValue ===
        "boolean"
      ) {
        permissionPayload[
          permissionName
        ] =
          permissionValue;
      }
    }
  );

  await updateDoc(
    businessAppUserDocument(
      target.businessID,
      target.id
    ),
    permissionPayload
  );
}

// ============================================================
// MARK: - Authentication Cloud Functions
// ============================================================

export async function createAppUserAuthenticationAccount(
  request:
    CreateAuthenticationAccountRequest
): Promise<AuthenticationUserResult> {
  const callable =
    httpsCallable<
      CreateAuthenticationAccountRequest,
      CreateAuthenticationAccountResponse
    >(
      functions,
      "createBusinessAppUserAuthentication"
    );

  const result =
    await callable(
      request
    );

  return {
    firebaseUID:
      requireText(
        result.data.firebaseUID,
        "Firebase UID"
      ),

    email:
      normalizeEmail(
        result.data.email
      ),

    authenticationCreated:
      Boolean(
        result.data.authenticationCreated
      ),

    passwordResetSent:
      Boolean(
        result.data.passwordResetSent
      ),
  };
}

export async function updateAppUserAuthenticationEmail(
  request:
    UpdateAuthenticationEmailRequest
): Promise<void> {
  const callable =
    httpsCallable<
      UpdateAuthenticationEmailRequest,
      {
        success: boolean;
      }
    >(
      functions,
      "updateBusinessAppUserAuthenticationEmail"
    );

  await callable({
    ...request,

    newEmail:
      normalizeEmail(
        request.newEmail
      ),
  });
}

export async function setAppUserTemporaryPassword(
  request:
    SetTemporaryPasswordRequest
): Promise<void> {
  const callable =
    httpsCallable<
      SetTemporaryPasswordRequest,
      {
        success: boolean;
      }
    >(
      functions,
      "setBusinessAppUserTemporaryPassword"
    );

  await callable(
    request
  );
}

export async function sendAppUserPasswordReset(
  request:
    SendPasswordResetRequest
): Promise<void> {
  const callable =
    httpsCallable<
      SendPasswordResetRequest,
      {
        success: boolean;
      }
    >(
      functions,
      "sendBusinessAppUserPasswordReset"
    );

  await callable({
    ...request,

    email:
      normalizeEmail(
        request.email
      ),
  });
}

export async function setAppUserAuthenticationDisabled(
  request:
    SetAuthenticationDisabledRequest
): Promise<void> {
  const callable =
    httpsCallable<
      SetAuthenticationDisabledRequest,
      {
        success: boolean;
      }
    >(
      functions,
      "setBusinessAppUserAuthenticationDisabled"
    );

  await callable(
    request
  );
}

export async function deleteAppUserAuthenticationAccount(
  request:
    DeleteAuthenticationAccountRequest
): Promise<void> {
  const callable =
    httpsCallable<
      DeleteAuthenticationAccountRequest,
      {
        success: boolean;
      }
    >(
      functions,
      "deleteBusinessAppUserAuthentication"
    );

  await callable(
    request
  );
}

// ============================================================
// MARK: - Migration Helper
// ============================================================

export async function ensureAppUserNormalizationFields(
  actor: AppUserActor,
  businessID: string
): Promise<number> {
  assertActorCanManageBusiness(
    actor,
    businessID
  );

  const snapshot =
    await getDocs(
      businessAppUsersCollection(
        businessID
      )
    );

  if (
    snapshot.empty
  ) {
    return 0;
  }

  const batch =
    writeBatch(
      db
    );

  snapshot.docs.forEach(
    (
      document
    ) => {
      const user =
        normalizeAppUserRecord(
          document.id,
          document.data()
        );

      batch.update(
        document.ref,
        {
          usernameNormalized:
            user.username
              .trim()
              .toLowerCase(),

          emailNormalized:
            user.email
              .trim()
              .toLowerCase(),

          updatedAt:
            serverTimestamp(),
        }
      );
    }
  );

  await batch.commit();

  return snapshot.size;
}