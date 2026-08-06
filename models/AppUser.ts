/*
 * JCS Business Suite
 * AppUser.ts
 *
 * Web equivalent of the SwiftData AppUser model.
 *
 * Responsibilities:
 *
 * - Preserve compatibility with the Apple application.
 * - Represent business users, customers, employees and providers.
 * - Maintain role-based default permissions.
 * - Maintain custom per-user permissions.
 * - Preserve multi-tenant business isolation.
 * - Normalize Firestore data safely.
 *
 * Passwords must never be stored in this model.
 */

// ============================================================
// MARK: - Roles
// ============================================================

export const APP_USER_ROLES = {
  customer: "customer",
  provider: "provider",
  employee: "employee",
  manager: "manager",
  admin: "admin",
} as const;

export type AppUserRole =
  (typeof APP_USER_ROLES)[keyof typeof APP_USER_ROLES];

export const APP_USER_ROLE_VALUES =
  Object.values(
    APP_USER_ROLES
  ) as AppUserRole[];

// ============================================================
// MARK: - Permissions
// ============================================================

export interface AppUserPermissions {
  // Customer Store Permissions

  canAccessCustomerHome: boolean;
  canAccessCatalog: boolean;
  canAccessFavorites: boolean;
  canAccessCart: boolean;
  canAccessCheckout: boolean;
  canAccessCustomerAccount: boolean;
  canAccessOrderHistory: boolean;
  canAccessTracking: boolean;

  // Project / Event Customer Permissions

  canAccessProjects: boolean;
  canViewProjectDetails: boolean;
  canViewProjectPhotos: boolean;
  canViewProgressPhotos: boolean;
  canViewProjectGallery: boolean;
  canCreateProjects: boolean;
  canEditOwnProjects: boolean;
  canUploadProjectPhotos: boolean;
  canCommentOnProjects: boolean;

  // Business / Employee Permissions

  canAccessDashboard: boolean;
  canAccessPOS: boolean;
  canAccessProducts: boolean;
  canAccessInventory: boolean;
  canAccessOrders: boolean;
  canAccessReturns: boolean;
  canAccessServices: boolean;
  canAccessAppointments: boolean;
  canAccessTransportation: boolean;
  canAccessReceiving: boolean;
  canAccessShipping: boolean;
  canAccessBackorders: boolean;

  // Management Permissions

  canManageCustomers: boolean;
  canManageEmployees: boolean;
  canManageProviders: boolean;
  canManageAppUsers: boolean;
  canManageSettings: boolean;

  // Compliance / Facility Permissions

  canAccessCompliance: boolean;
  canManageCompliance: boolean;
  canAccessFacilities: boolean;
  canManageFacilities: boolean;

  // Reports / Administration

  canAccessInsights: boolean;
  canExportReports: boolean;
  canSeeFinancials: boolean;
  canSeeCostsAndProfit: boolean;
}

// ============================================================
// MARK: - App User Record
// ============================================================

export interface AppUserRecord
  extends AppUserPermissions {
  id: string;

  // Identity

  username: string;

  fullName: string;
  email: string;
  phone: string;

  addressLine1: string;
  addressLine2: string;

  roleRawValue: AppUserRole;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date | null;

  /*
   * Web and Firestore should store a URL or Storage path,
   * not raw Data bytes like SwiftData.
   */
  profileImageURL: string;

  // Firebase / SaaS Tenant

  firebaseUID: string;
  businessID: string;
  ownerUID: string;

  businessName: string;
  isBusinessOwner: boolean;
  isPlatformAdministrator: boolean;
  enabledModules: string[];
  disabledModules: string[];
}

// ============================================================
// MARK: - Creation Input
// ============================================================

export interface CreateAppUserInput {
  username: string;

  fullName?: string;
  email?: string;
  phone?: string;

  addressLine1?: string;
  addressLine2?: string;

  role?: AppUserRole;
  isActive?: boolean;

  profileImageURL?: string;

  firebaseUID?: string;
  businessID: string;
  ownerUID: string;

  businessName?: string;
  isBusinessOwner?: boolean;
  isPlatformAdministrator?: boolean;
  enabledModules?: string[];
  disabledModules?: string[];

  permissions?: Partial<AppUserPermissions>;
}

// ============================================================
// MARK: - Update Input
// ============================================================

export interface UpdateAppUserInput {
  username?: string;

  fullName?: string;
  email?: string;
  phone?: string;

  addressLine1?: string;
  addressLine2?: string;

  role?: AppUserRole;
  isActive?: boolean;

  profileImageURL?: string;

  businessName?: string;
  isBusinessOwner?: boolean;

  permissions?: Partial<AppUserPermissions>;
  enabledModules?: string[];
  disabledModules?: string[]; 
}

// ============================================================
// MARK: - Permission Keys
// ============================================================

export const APP_USER_PERMISSION_KEYS: readonly (
  keyof AppUserPermissions
)[] = [
  "canAccessCustomerHome",
  "canAccessCatalog",
  "canAccessFavorites",
  "canAccessCart",
  "canAccessCheckout",
  "canAccessCustomerAccount",
  "canAccessOrderHistory",
  "canAccessTracking",

  "canAccessProjects",
  "canViewProjectDetails",
  "canViewProjectPhotos",
  "canViewProgressPhotos",
  "canViewProjectGallery",
  "canCreateProjects",
  "canEditOwnProjects",
  "canUploadProjectPhotos",
  "canCommentOnProjects",

  "canAccessDashboard",
  "canAccessPOS",
  "canAccessProducts",
  "canAccessInventory",
  "canAccessOrders",
  "canAccessReturns",
  "canAccessServices",
  "canAccessAppointments",
  "canAccessTransportation",
  "canAccessReceiving",
  "canAccessShipping",
  "canAccessBackorders",

  "canManageCustomers",
  "canManageEmployees",
  "canManageProviders",
  "canManageAppUsers",
  "canManageSettings",

  "canAccessCompliance",
  "canManageCompliance",
  "canAccessFacilities",
  "canManageFacilities",

  "canAccessInsights",
  "canExportReports",
  "canSeeFinancials",
  "canSeeCostsAndProfit",
];

// ============================================================
// MARK: - Normalization Helpers
// ============================================================

function cleanText(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeEmail(
  value: unknown
): string {
  return cleanText(
    value
  ).toLowerCase();
}

function normalizeBoolean(
  value: unknown,
  fallback = false
): boolean {
  return typeof value === "boolean"
    ? value
    : fallback;
}

function normalizeStringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) =>
          cleanText(item)
        )
        .filter(Boolean)
    )
  );
}

function normalizeRole(
  value: unknown
): AppUserRole {
  const normalized =
    cleanText(
      value
    ).toLowerCase();

  return APP_USER_ROLE_VALUES.includes(
    normalized as AppUserRole
  )
    ? (normalized as AppUserRole)
    : APP_USER_ROLES.employee;
}

function dateFromUnknown(
  value: unknown,
  fallback = new Date()
): Date {
  if (
    value instanceof Date
  ) {
    return value;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const parsed =
      new Date(
        value
      );

    return Number.isNaN(
      parsed.getTime()
    )
      ? fallback
      : parsed;
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (
      value as {
        toDate?: unknown;
      }
    ).toDate === "function"
  ) {
    const converted =
      (
        value as {
          toDate: () => Date;
        }
      ).toDate();

    return converted instanceof Date
      ? converted
      : fallback;
  }

  return fallback;
}

function optionalDateFromUnknown(
  value: unknown
): Date | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  return dateFromUnknown(
    value
  );
}

// ============================================================
// MARK: - Empty Permissions
// ============================================================

export function createEmptyAppUserPermissions():
  AppUserPermissions {
  return {
    canAccessCustomerHome: false,
    canAccessCatalog: false,
    canAccessFavorites: false,
    canAccessCart: false,
    canAccessCheckout: false,
    canAccessCustomerAccount: false,
    canAccessOrderHistory: false,
    canAccessTracking: false,

    canAccessProjects: false,
    canViewProjectDetails: false,
    canViewProjectPhotos: false,
    canViewProgressPhotos: false,
    canViewProjectGallery: false,
    canCreateProjects: false,
    canEditOwnProjects: false,
    canUploadProjectPhotos: false,
    canCommentOnProjects: false,

    canAccessDashboard: false,
    canAccessPOS: false,
    canAccessProducts: false,
    canAccessInventory: false,
    canAccessOrders: false,
    canAccessReturns: false,
    canAccessServices: false,
    canAccessAppointments: false,
    canAccessTransportation: false,
    canAccessReceiving: false,
    canAccessShipping: false,
    canAccessBackorders: false,

    canManageCustomers: false,
    canManageEmployees: false,
    canManageProviders: false,
    canManageAppUsers: false,
    canManageSettings: false,

    canAccessCompliance: false,
    canManageCompliance: false,
    canAccessFacilities: false,
    canManageFacilities: false,

    canAccessInsights: false,
    canExportReports: false,
    canSeeFinancials: false,
    canSeeCostsAndProfit: false,
  };
}

// ============================================================
// MARK: - Customer Defaults
// ============================================================

export function createCustomerDefaultPermissions():
  AppUserPermissions {
  return {
    ...createEmptyAppUserPermissions(),

    canAccessCustomerHome: true,
    canAccessCatalog: true,
    canAccessFavorites: true,
    canAccessCart: true,
    canAccessCheckout: true,
    canAccessCustomerAccount: true,
    canAccessOrderHistory: true,
    canAccessTracking: true,
  };
}

// ============================================================
// MARK: - Provider Defaults
// ============================================================

export function createProviderDefaultPermissions():
  AppUserPermissions {
  return {
    ...createEmptyAppUserPermissions(),

    canAccessDashboard: true,
    canAccessTransportation: true,
  };
}

// ============================================================
// MARK: - Employee Defaults
// ============================================================

export function createEmployeeDefaultPermissions():
  AppUserPermissions {
  return {
    ...createEmptyAppUserPermissions(),

    canAccessDashboard: true,
    canAccessPOS: true,
    canAccessProducts: true,
    canAccessInventory: true,
    canAccessOrders: true,
    canAccessReturns: true,
    canAccessServices: true,
    canAccessAppointments: true,
    canAccessTransportation: true,
    canAccessReceiving: true,
    canAccessShipping: true,
  };
}

// ============================================================
// MARK: - Manager Defaults
// ============================================================

export function createManagerDefaultPermissions():
  AppUserPermissions {
  return {
    ...createEmployeeDefaultPermissions(),

    canAccessProjects: true,
    canViewProjectDetails: true,
    canViewProjectPhotos: true,
    canViewProgressPhotos: true,
    canViewProjectGallery: true,
    canCreateProjects: true,
    canEditOwnProjects: true,
    canUploadProjectPhotos: true,
    canCommentOnProjects: true,

    canAccessBackorders: true,

    canManageCustomers: true,
    canManageEmployees: true,
    canManageProviders: true,

    canAccessCompliance: true,
    canManageCompliance: true,
    canAccessFacilities: true,
    canManageFacilities: true,

    canAccessInsights: true,
    canExportReports: true,
    canSeeFinancials: true,
    canSeeCostsAndProfit: true,
  };
}

// ============================================================
// MARK: - Administrator Defaults
// ============================================================

export function createAdministratorDefaultPermissions():
  AppUserPermissions {
  return {
    ...createManagerDefaultPermissions(),

    canManageAppUsers: true,
    canManageSettings: true,
  };
}

// ============================================================
// MARK: - Role Defaults
// ============================================================

export function defaultPermissionsForRole(
  role: AppUserRole
): AppUserPermissions {
  switch (role) {
    case APP_USER_ROLES.customer:
      return createCustomerDefaultPermissions();

    case APP_USER_ROLES.provider:
      return createProviderDefaultPermissions();

    case APP_USER_ROLES.manager:
      return createManagerDefaultPermissions();

    case APP_USER_ROLES.admin:
      return createAdministratorDefaultPermissions();

    case APP_USER_ROLES.employee:
    default:
      return createEmployeeDefaultPermissions();
  }
}

// ============================================================
// MARK: - Customer Presets
// ============================================================

export function createShoppingCustomerPermissions():
  AppUserPermissions {
  return createCustomerDefaultPermissions();
}

export function createProjectViewerCustomerPermissions():
  AppUserPermissions {
  return {
    ...createEmptyAppUserPermissions(),

    canAccessCustomerHome: true,
    canAccessCustomerAccount: true,
    canAccessTracking: true,

    canAccessProjects: true,
    canViewProjectDetails: true,
    canViewProjectPhotos: true,
    canViewProgressPhotos: true,
    canViewProjectGallery: true,
    canCommentOnProjects: true,
  };
}

export function createProjectManagerCustomerPermissions():
  AppUserPermissions {
  return {
    ...createProjectViewerCustomerPermissions(),

    canCreateProjects: true,
    canEditOwnProjects: true,
    canUploadProjectPhotos: true,
  };
}

// ============================================================
// MARK: - Permission Normalization
// ============================================================

export function normalizeAppUserPermissions(
  source: unknown,
  fallback:
    AppUserPermissions =
      createEmptyAppUserPermissions()
): AppUserPermissions {
  const record =
    source &&
    typeof source === "object"
      ? (
          source as Record<
            string,
            unknown
          >
        )
      : {};

  const normalized = {
    ...fallback,
  };

  APP_USER_PERMISSION_KEYS.forEach(
    (
      permissionKey
    ) => {
      const value =
        record[
          permissionKey
        ];

      normalized[
        permissionKey
      ] =
        typeof value ===
        "boolean"
          ? value
          : fallback[
              permissionKey
            ];
    }
  );

  return normalized;
}

// ============================================================
// MARK: - App User Creation
// ============================================================

export function createAppUserRecord(
  input: CreateAppUserInput
): AppUserRecord {
  const role =
    normalizeRole(
      input.role
    );

  const defaults =
    defaultPermissionsForRole(
      role
    );

  const permissions =
    normalizeAppUserPermissions(
      input.permissions,
      defaults
    );

  const now =
    new Date();

  const firebaseUID =
    cleanText(
      input.firebaseUID
    );

  const username =
    cleanText(
      input.username
    );

  return {
    id:
      firebaseUID ||
      username,

    username,

    fullName:
      cleanText(
        input.fullName
      ),

    email:
      normalizeEmail(
        input.email
      ),

    phone:
      cleanText(
        input.phone
      ),

    addressLine1:
      cleanText(
        input.addressLine1
      ),

    addressLine2:
      cleanText(
        input.addressLine2
      ),

    roleRawValue:
      role,

    isActive:
      input.isActive ??
      true,

    createdAt:
      now,

    updatedAt:
      now,

    profileImageURL:
      cleanText(
        input.profileImageURL
      ),

    firebaseUID,

    businessID:
      cleanText(
        input.businessID
      ),

    ownerUID:
      cleanText(
        input.ownerUID
      ),

    businessName:
      cleanText(
        input.businessName
      ),

    isBusinessOwner:
      input.isBusinessOwner ??
      false,

    isPlatformAdministrator:
      input.isPlatformAdministrator ??
      false,

      enabledModules:
  normalizeStringArray(
    input.enabledModules
  ),

disabledModules:
  normalizeStringArray(
    input.disabledModules
  ),

    ...permissions,
  };
}

// ============================================================
// MARK: - Firestore Normalization
// ============================================================

export function normalizeAppUserRecord(
  documentID: string,
  source: unknown
): AppUserRecord {
  const record =
    source &&
    typeof source === "object"
      ? (
          source as Record<
            string,
            unknown
          >
        )
      : {};

  const role =
    normalizeRole(
      record.roleRawValue ??
      record.role
    );

  const defaultPermissions =
    defaultPermissionsForRole(
      role
    );

  const permissions =
    normalizeAppUserPermissions(
      record,
      defaultPermissions
    );

  const firebaseUID =
    cleanText(
      record.firebaseUID
    );

  return {
    id:
      cleanText(
        record.id
      ) ||
      documentID ||
      firebaseUID,

    username:
      cleanText(
        record.username
      ),

    fullName:
      cleanText(
        record.fullName
      ),

    email:
      normalizeEmail(
        record.email
      ),

    phone:
      cleanText(
        record.phone
      ),

    addressLine1:
      cleanText(
        record.addressLine1
      ),

    addressLine2:
      cleanText(
        record.addressLine2
      ),

    roleRawValue:
      role,

    isActive:
      normalizeBoolean(
        record.isActive,
        true
      ),

    createdAt:
      dateFromUnknown(
        record.createdAt
      ),

    updatedAt:
      optionalDateFromUnknown(
        record.updatedAt
      ),

    profileImageURL:
      cleanText(
        record.profileImageURL ??
        record.photoURL ??
        record.avatarURL
      ),

    firebaseUID,

    businessID:
      cleanText(
        record.businessID
      ),

    ownerUID:
      cleanText(
        record.ownerUID
      ),

    businessName:
      cleanText(
        record.businessName
      ),

    isBusinessOwner:
      normalizeBoolean(
        record.isBusinessOwner
      ),

    isPlatformAdministrator:
      normalizeBoolean(
        record.isPlatformAdministrator
      ),

      enabledModules:
  normalizeStringArray(
    record.enabledModules
  ),

disabledModules:
  normalizeStringArray(
    record.disabledModules
  ),

    ...permissions,
  };
}

// ============================================================
// MARK: - Firestore Payload
// ============================================================

export function appUserToFirestorePayload(
  user: AppUserRecord
): Record<
  string,
  unknown
> {
  const payload:
    Record<
      string,
      unknown
    > = {
      username:
        cleanText(
          user.username
        ),

      fullName:
        cleanText(
          user.fullName
        ),

      email:
        normalizeEmail(
          user.email
        ),

      phone:
        cleanText(
          user.phone
        ),

      addressLine1:
        cleanText(
          user.addressLine1
        ),

      addressLine2:
        cleanText(
          user.addressLine2
        ),

      roleRawValue:
        normalizeRole(
          user.roleRawValue
        ),

      isActive:
        Boolean(
          user.isActive
        ),

      createdAt:
        user.createdAt,

      updatedAt:
        new Date(),

      profileImageURL:
        cleanText(
          user.profileImageURL
        ),

      firebaseUID:
        cleanText(
          user.firebaseUID
        ),

      businessID:
        cleanText(
          user.businessID
        ),

      ownerUID:
        cleanText(
          user.ownerUID
        ),

      businessName:
        cleanText(
          user.businessName
        ),

      isBusinessOwner:
        Boolean(
          user.isBusinessOwner
        ),

      isPlatformAdministrator:
        Boolean(
          user.isPlatformAdministrator
        ),

        enabledModules:
  normalizeStringArray(
    user.enabledModules
  ),

disabledModules:
  normalizeStringArray(
    user.disabledModules
  ),

    };

  APP_USER_PERMISSION_KEYS.forEach(
    (
      permissionKey
    ) => {
      payload[
        permissionKey
      ] =
        Boolean(
          user[
            permissionKey
          ]
        );
    }
  );

  return payload;
}

// ============================================================
// MARK: - Role Changes
// ============================================================

export function appUserWithRole(
  user: AppUserRecord,
  role: AppUserRole,
  preserveCustomPermissions =
    false
): AppUserRecord {
  const normalizedRole =
    normalizeRole(
      role
    );

  const permissions =
    preserveCustomPermissions
      ? normalizeAppUserPermissions(
          user
        )
      : defaultPermissionsForRole(
          normalizedRole
        );

  return {
    ...user,

    roleRawValue:
      normalizedRole,

    updatedAt:
      new Date(),

    ...permissions,
  };
}

// ============================================================
// MARK: - Permission Changes
// ============================================================

export function appUserWithPermissions(
  user: AppUserRecord,
  permissions:
    Partial<AppUserPermissions>
): AppUserRecord {
  return {
    ...user,

    ...normalizeAppUserPermissions(
      permissions,
      normalizeAppUserPermissions(
        user
      )
    ),

    updatedAt:
      new Date(),
  };
}

// ============================================================
// MARK: - Display Helpers
// ============================================================

export function appUserDisplayName(
  user: Pick<
    AppUserRecord,
    | "fullName"
    | "username"
    | "email"
  >
): string {
  return (
    cleanText(
      user.fullName
    ) ||
    cleanText(
      user.username
    ) ||
    normalizeEmail(
      user.email
    ) ||
    "Unnamed User"
  );
}

export function appUserBusinessDisplayName(
  user: Pick<
    AppUserRecord,
    | "businessName"
    | "fullName"
  >
): string {
  return (
    cleanText(
      user.businessName
    ) ||
    cleanText(
      user.fullName
    ) ||
    "JCS Business Suite"
  );
}

export function appUserRoleLabel(
  role: AppUserRole
): string {
  switch (
    normalizeRole(
      role
    )
  ) {
    case APP_USER_ROLES.customer:
      return "Customer";

    case APP_USER_ROLES.provider:
      return "Provider";

    case APP_USER_ROLES.manager:
      return "Manager";

    case APP_USER_ROLES.admin:
      return "Administrator";

    case APP_USER_ROLES.employee:
    default:
      return "Employee";
  }
}

// ============================================================
// MARK: - Role Helpers
// ============================================================

export function isAppUserCustomer(
  user: AppUserRecord
): boolean {
  return (
    user.roleRawValue ===
    APP_USER_ROLES.customer
  );
}

export function isAppUserEmployee(
  user: AppUserRecord
): boolean {
  return (
    user.roleRawValue ===
    APP_USER_ROLES.employee
  );
}

export function isAppUserManager(
  user: AppUserRecord
): boolean {
  return (
    user.roleRawValue ===
    APP_USER_ROLES.manager
  );
}

export function isAppUserAdministrator(
  user: AppUserRecord
): boolean {
  return (
    user.roleRawValue ===
    APP_USER_ROLES.admin
  );
}

export function isAppUserProvider(
  user: AppUserRecord
): boolean {
  return (
    user.roleRawValue ===
    APP_USER_ROLES.provider
  );
}

export function isBusinessOwnerAdministrator(
  user: AppUserRecord
): boolean {
  return Boolean(
    user.isBusinessOwner &&
    user.roleRawValue ===
      APP_USER_ROLES.admin &&
    cleanText(
      user.ownerUID
    )
  );
}

// ============================================================
// MARK: - Tenant Helpers
// ============================================================

export function appUserBelongsToBusiness(
  user: AppUserRecord,
  businessID: string
): boolean {
  const currentBusinessID =
    cleanText(
      user.businessID
    );

  const targetBusinessID =
    cleanText(
      businessID
    );

  return Boolean(
    currentBusinessID &&
    targetBusinessID &&
    currentBusinessID ===
      targetBusinessID
  );
}

export function appUserIsOwnedBy(
  user: AppUserRecord,
  ownerUID: string
): boolean {
  const currentOwnerUID =
    cleanText(
      user.ownerUID
    );

  const targetOwnerUID =
    cleanText(
      ownerUID
    );

  return Boolean(
    currentOwnerUID &&
    targetOwnerUID &&
    currentOwnerUID ===
      targetOwnerUID
  );
}

export function appUserHasFirebaseIdentity(
  user: AppUserRecord,
  firebaseUID: string
): boolean {
  const currentFirebaseUID =
    cleanText(
      user.firebaseUID
    );

  const targetFirebaseUID =
    cleanText(
      firebaseUID
    );

  return Boolean(
    currentFirebaseUID &&
    targetFirebaseUID &&
    currentFirebaseUID ===
      targetFirebaseUID
  );
}

// ============================================================
// MARK: - Authorization Helpers
// ============================================================

export function canManageBusinessAppUsers(
  actor: AppUserRecord,
  targetBusinessID: string
): boolean {
  if (
    actor.isPlatformAdministrator
  ) {
    return true;
  }

  if (
    !actor.isActive
  ) {
    return false;
  }

  if (
    !appUserBelongsToBusiness(
      actor,
      targetBusinessID
    )
  ) {
    return false;
  }

  return Boolean(
    actor.isBusinessOwner ||
    actor.canManageAppUsers
  );
}

export function canEditAppUser(
  actor: AppUserRecord,
  target: AppUserRecord
): boolean {
  if (
    actor.isPlatformAdministrator
  ) {
    return true;
  }

  if (
    !canManageBusinessAppUsers(
      actor,
      target.businessID
    )
  ) {
    return false;
  }

  /*
   * A normal Business Owner or administrator
   * cannot modify a Platform Administrator.
   */
  if (
    target.isPlatformAdministrator
  ) {
    return false;
  }

  return true;
}

export function canDeleteAppUser(
  actor: AppUserRecord,
  target: AppUserRecord
): boolean {
  if (
    !canEditAppUser(
      actor,
      target
    )
  ) {
    return false;
  }

  /*
   * Protect the primary Business Owner account.
   */
  if (
    target.isBusinessOwner
  ) {
    return false;
  }

  /*
   * Prevent a user from deleting themselves.
   */
  if (
    actor.firebaseUID &&
    actor.firebaseUID ===
      target.firebaseUID
  ) {
    return false;
  }

  return true;
}