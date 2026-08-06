"use client";

/*
 * JCS Business Suite
 * AppUsersView.tsx
 *
 * Business Owner and authorized administrator workspace for:
 *
 * - Customers
 * - Employees
 * - Managers
 * - Administrators
 * - Providers
 * - Roles
 * - Permissions
 * - Modules
 * - Authentication access
 * - Protected deletion
 */

import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  Ban,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  ContactRound,
  Edit3,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MailCheck,
  Menu,
  MoreHorizontal,
  PackageCheck,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  ShieldOff,
  SlidersHorizontal,
  Trash2,
  UserCheck,
  UserCog,
  UserRound,
  UserRoundPlus,
  UserX,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useBusinessContext,
} from "@/core/business-context/JCSBusinessContext";

import {
  APP_USER_PERMISSION_KEYS,
  APP_USER_ROLES,
  appUserDisplayName,
  appUserRoleLabel,
  defaultPermissionsForRole,
  type AppUserPermissions,
  type AppUserRecord,
  type AppUserRole,
} from "@/models/AppUser";

import {
  useAppUsers,
  type AppUserFilter,
  type CreateAppUserFormInput,
  type UpdateAppUserFormInput,
} from "./useAppUsers";

import "./AppUsersView.css";

// ============================================================
// MARK: - Types
// ============================================================

type EditorMode =
  | "create"
  | "edit";

type EditorTab =
  | "identity"
  | "access"
  | "security";

interface AppUserDraft {
  username: string;

  fullName: string;
  email: string;
  phone: string;

  addressLine1: string;
  addressLine2: string;

  role: AppUserRole;
  isActive: boolean;

  permissions:
    AppUserPermissions;

  enabledModules:
    string[];

  disabledModules:
    string[];

  createAuthenticationAccount:
    boolean;

  sendWelcomeEmail:
    boolean;

  temporaryPassword:
    string;
}

interface RoleOption {
  role: AppUserRole;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

interface PermissionGroup {
  id: string;
  title: string;
  subtitle: string;

  permissions:
    readonly (
      keyof AppUserPermissions
    )[];
}

interface ModuleOption {
  id: string;
  title: string;
  subtitle: string;
}

// ============================================================
// MARK: - Constants
// ============================================================

const ROLE_OPTIONS:
  readonly RoleOption[] = [
    {
      role:
        APP_USER_ROLES.customer,

      title:
        "Customer",

      subtitle:
        "Store, account, orders and tracking.",

      icon:
        ContactRound,
    },

    {
      role:
        APP_USER_ROLES.employee,

      title:
        "Employee",

      subtitle:
        "Daily business operations and POS.",

      icon:
        BriefcaseBusiness,
    },

    {
      role:
        APP_USER_ROLES.manager,

      title:
        "Manager",

      subtitle:
        "Operations, reports and team management.",

      icon:
        UserCog,
    },

    {
      role:
        APP_USER_ROLES.admin,

      title:
        "Administrator",

      subtitle:
        "Full business administration and settings.",

      icon:
        ShieldCheck,
    },

    {
      role:
        APP_USER_ROLES.provider,

      title:
        "Provider",

      subtitle:
        "Provider and transportation workflows.",

      icon:
        PackageCheck,
    },
  ];

const FILTER_OPTIONS:
  readonly {
    value: AppUserFilter;
    label: string;
  }[] = [
    {
      value:
        "all",

      label:
        "All Users",
    },

    {
      value:
        "active",

      label:
        "Active",
    },

    {
      value:
        "inactive",

      label:
        "Inactive",
    },

    {
      value:
        APP_USER_ROLES.customer,

      label:
        "Customers",
    },

    {
      value:
        APP_USER_ROLES.employee,

      label:
        "Employees",
    },

    {
      value:
        APP_USER_ROLES.manager,

      label:
        "Managers",
    },

    {
      value:
        APP_USER_ROLES.admin,

      label:
        "Administrators",
    },

    {
      value:
        APP_USER_ROLES.provider,

      label:
        "Providers",
    },
  ];

const PERMISSION_GROUPS:
  readonly PermissionGroup[] = [
    {
      id:
        "customer-store",

      title:
        "Customer Store",

      subtitle:
        "Shopping, account, history and tracking.",

      permissions: [
        "canAccessCustomerHome",
        "canAccessCatalog",
        "canAccessFavorites",
        "canAccessCart",
        "canAccessCheckout",
        "canAccessCustomerAccount",
        "canAccessOrderHistory",
        "canAccessTracking",
      ],
    },

    {
      id:
        "projects",

      title:
        "Projects and Events",

      subtitle:
        "Project details, images, progress and collaboration.",

      permissions: [
        "canAccessProjects",
        "canViewProjectDetails",
        "canViewProjectPhotos",
        "canViewProgressPhotos",
        "canViewProjectGallery",
        "canCreateProjects",
        "canEditOwnProjects",
        "canUploadProjectPhotos",
        "canCommentOnProjects",
      ],
    },

    {
      id:
        "operations",

      title:
        "Business Operations",

      subtitle:
        "Dashboard, POS, inventory, orders and fulfillment.",

      permissions: [
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
      ],
    },

    {
      id:
        "management",

      title:
        "Management",

      subtitle:
        "Customers, employees, providers, users and settings.",

      permissions: [
        "canManageCustomers",
        "canManageEmployees",
        "canManageProviders",
        "canManageAppUsers",
        "canManageSettings",
      ],
    },

    {
      id:
        "compliance",

      title:
        "Compliance and Facilities",

      subtitle:
        "Operational compliance and building management.",

      permissions: [
        "canAccessCompliance",
        "canManageCompliance",
        "canAccessFacilities",
        "canManageFacilities",
      ],
    },

    {
      id:
        "reports",

      title:
        "Reports and Financials",

      subtitle:
        "Insights, exports, financials, costs and profit.",

      permissions: [
        "canAccessInsights",
        "canExportReports",
        "canSeeFinancials",
        "canSeeCostsAndProfit",
      ],
    },
  ];

const MODULE_OPTIONS:
  readonly ModuleOption[] = [
    {
      id:
        "customer-home",

      title:
        "Customer Home",

      subtitle:
        "Customer-facing landing workspace.",
    },

    {
      id:
        "catalog",

      title:
        "Catalog",

      subtitle:
        "Products and services available to customers.",
    },

    {
      id:
        "favorites",

      title:
        "Favorites",

      subtitle:
        "Saved products and services.",
    },

    {
      id:
        "account",

      title:
        "Customer Account",

      subtitle:
        "Profile, addresses and account history.",
    },

    {
      id:
        "tracking",

      title:
        "Tracking",

      subtitle:
        "Order and shipment tracking.",
    },

    {
      id:
        "dashboard",

      title:
        "Dashboard",

      subtitle:
        "Business command center.",
    },

    {
      id:
        "pos",

      title:
        "Point of Sale",

      subtitle:
        "Sales and checkout workflows.",
    },

    {
      id:
        "sales",

      title:
        "Sales",

      subtitle:
        "Sales activity and performance.",
    },

    {
      id:
        "insights",

      title:
        "Business Insights",

      subtitle:
        "Business intelligence and analytics.",
    },

    {
      id:
        "products",

      title:
        "Products",

      subtitle:
        "Product creation and administration.",
    },

    {
      id:
        "inventory",

      title:
        "Inventory",

      subtitle:
        "Inventory quantities and stock control.",
    },

    {
      id:
        "orders",

      title:
        "Orders",

      subtitle:
        "Order administration and fulfillment.",
    },

    {
      id:
        "returns",

      title:
        "Returns",

      subtitle:
        "Return and refund workflows.",
    },

    {
      id:
        "services",

      title:
        "Services",

      subtitle:
        "Business services and service activity.",
    },

    {
      id:
        "appointments",

      title:
        "Appointments",

      subtitle:
        "Calendar and appointment administration.",
    },

    {
      id:
        "transportation",

      title:
        "Transportation",

      subtitle:
        "Transportation and delivery workflows.",
    },

    {
      id:
        "receiving",

      title:
        "Receiving",

      subtitle:
        "Incoming inventory records.",
    },

    {
      id:
        "shipping",

      title:
        "Shipping",

      subtitle:
        "Shipment administration.",
    },

    {
      id:
        "backorders",

      title:
        "Backorders",

      subtitle:
        "Backordered inventory and fulfillment.",
    },

    {
      id:
        "customers",

      title:
        "Customers",

      subtitle:
        "Customer records and management.",
    },

    {
      id:
        "employees",

      title:
        "Employees",

      subtitle:
        "Employee administration.",
    },

    {
      id:
        "providers",

      title:
        "Providers",

      subtitle:
        "Provider records and management.",
    },

    {
      id:
        "users",

      title:
        "App Users",

      subtitle:
        "Roles, permissions and access.",
    },

    {
      id:
        "settings",

      title:
        "App Settings",

      subtitle:
        "Branding, taxes and business configuration.",
    },
  ];

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

function normalizeAccentName(
  value?:
    | string
    | null
): string {
  return (
    cleanText(
      value
    )
      .toLowerCase()
      .replace(
        /\s+/g,
        "-"
      ) ||
    "blue"
  );
}

function permissionLabel(
  permission:
    keyof AppUserPermissions
): string {
  return String(
    permission
  )
    .replace(
      /^can/,
      ""
    )
    .replace(
      /([a-z])([A-Z])/g,
      "$1 $2"
    )
    .replace(
      /\bPOS\b/i,
      "POS"
    )
    .trim();
}

function initialsForUser(
  user:
    Pick<
      AppUserRecord,
      | "fullName"
      | "username"
      | "email"
    >
): string {
  const source =
    appUserDisplayName(
      user
    );

  const parts =
    source
      .split(
        /\s+/
      )
      .filter(Boolean);

  if (
    parts.length >=
    2
  ) {
    return `${parts[0][0]}${parts[1][0]}`
      .toUpperCase();
  }

  return source
    .slice(
      0,
      2
    )
    .toUpperCase();
}

function roleIcon(
  role:
    AppUserRole
): LucideIcon {
  return (
    ROLE_OPTIONS.find(
      (
        option
      ) =>
        option.role ===
        role
    )?.icon ??
    UserRound
  );
}

function createEmptyDraft():
  AppUserDraft {
  const role =
    APP_USER_ROLES.employee;

  return {
    username:
      "",

    fullName:
      "",

    email:
      "",

    phone:
      "",

    addressLine1:
      "",

    addressLine2:
      "",

    role,

    isActive:
      true,

    permissions:
      defaultPermissionsForRole(
        role
      ),

    enabledModules:
      [],

    disabledModules:
      [],

    createAuthenticationAccount:
      true,

    sendWelcomeEmail:
      true,

    temporaryPassword:
      "",
  };
}

function draftFromUser(
  user:
    AppUserRecord
): AppUserDraft {
  const permissions =
    APP_USER_PERMISSION_KEYS.reduce<AppUserPermissions>(
      (
        result,
        permission
      ) => {
        result[
          permission
        ] =
          user[
            permission
          ];

        return result;
      },
      defaultPermissionsForRole(
        user.roleRawValue
      )
    );

  return {
    username:
      user.username,

    fullName:
      user.fullName,

    email:
      user.email,

    phone:
      user.phone,

    addressLine1:
      user.addressLine1,

    addressLine2:
      user.addressLine2,

    role:
      user.roleRawValue,

    isActive:
      user.isActive,

    permissions,

    enabledModules:
      [...user.enabledModules],

    disabledModules:
      [...user.disabledModules],

    createAuthenticationAccount:
      Boolean(
        user.firebaseUID
      ),

    sendWelcomeEmail:
      false,

    temporaryPassword:
      "",
  };
}

// ============================================================
// MARK: - Component
// ============================================================

export default function AppUsersView() {
  const router =
    useRouter();

  const {
    firebaseUser,
    appUser,
    appSettings,
    business,
    businessID,
    isLoading:
      businessContextIsLoading,
  } = useBusinessContext();

  // ==========================================================
  // MARK: - Identity and Access
  // ==========================================================

  const accentName =
    normalizeAccentName(
      appSettings
        ?.accentColorName
    );

  const effectiveBusinessID =
    cleanText(
      businessID ??
      appUser?.businessID
    );

  const currentFirebaseUID =
    cleanText(
      firebaseUser?.uid ??
      appUser?.firebaseUID
    );

  const isPlatformAdministrator =
    Boolean(
      appUser
        ?.isPlatformAdministrator
    );

  const isBusinessOwner =
    Boolean(
      appUser
        ?.isBusinessOwner
    );

  const canManageAppUsers =
    Boolean(
      isPlatformAdministrator ||
      isBusinessOwner ||
      appUser
        ?.canManageAppUsers
    );

  const actor =
    useMemo(
      () => ({
        firebaseUID:
          currentFirebaseUID,

        businessID:
          effectiveBusinessID,

        isActive:
          appUser
            ?.isActive ??
          true,

        isBusinessOwner,

        isPlatformAdministrator,

        canManageAppUsers,
      }),
      [
        appUser?.isActive,
        canManageAppUsers,
        currentFirebaseUID,
        effectiveBusinessID,
        isBusinessOwner,
        isPlatformAdministrator,
      ]
    );

  const {
    users,
    filteredUsers,
    metrics,

    searchText,
    setSearchText,

    filter,
    setFilter,

    isLoading,
    isRefreshing,
    isMutating,

    errorMessage,
    successMessage,

    lastRefreshedAt,

    refresh,

    createUser,
    updateUser,
    updateUserAccess,

    activateUser,
    deactivateUser,

    sendPasswordReset,
    setTemporaryPassword,
    updateAuthenticationEmail,

    enableAuthentication,
    disableAuthentication,

    deleteUser,

    clearError,
    clearSuccess,
  } = useAppUsers({
    enabled:
      Boolean(
        canManageAppUsers &&
        effectiveBusinessID &&
        currentFirebaseUID
      ),

    actor,

    businessID:
      effectiveBusinessID,

    usesRealtimeListeners:
      true,
  });

  // ==========================================================
  // MARK: - Local State
  // ==========================================================

  const [
    editorOpen,
    setEditorOpen,
  ] = useState(
    false
  );

  const [
    editorMode,
    setEditorMode,
  ] =
    useState<EditorMode>(
      "create"
    );

  const [
    editorTab,
    setEditorTab,
  ] =
    useState<EditorTab>(
      "identity"
    );

  const [
    selectedUser,
    setSelectedUser,
  ] =
    useState<AppUserRecord | null>(
      null
    );

  const [
    draft,
    setDraft,
  ] =
    useState<AppUserDraft>(
      createEmptyDraft
    );

  const [
    actionMenuUserID,
    setActionMenuUserID,
  ] =
    useState<string | null>(
      null
    );

  const [
    deleteCandidate,
    setDeleteCandidate,
  ] =
    useState<AppUserRecord | null>(
      null
    );

  const [
    temporaryPasswordUser,
    setTemporaryPasswordUser,
  ] =
    useState<AppUserRecord | null>(
      null
    );

  const [
    temporaryPassword,
    setTemporaryPasswordValue,
  ] =
    useState("");

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );

  // ==========================================================
  // MARK: - Derived Values
  // ==========================================================

  const companyName =
    cleanText(
      appSettings?.companyName ??
      business?.businessName
    ) ||
    "JCS Business Suite";

  const activePermissionCount =
    useMemo(
      () =>
        APP_USER_PERMISSION_KEYS
          .filter(
            (
              permission
            ) =>
              draft.permissions[
                permission
              ]
          )
          .length,
      [
        draft.permissions,
      ]
    );

  const roleOption =
    ROLE_OPTIONS.find(
      (
        option
      ) =>
        option.role ===
        draft.role
    );

  // ==========================================================
  // MARK: - Editor Actions
  // ==========================================================

  const closeEditor =
    useCallback(() => {
      if (
        saving
      ) {
        return;
      }

      setEditorOpen(
        false
      );

      setSelectedUser(
        null
      );

      setEditorTab(
        "identity"
      );

      setDraft(
        createEmptyDraft()
      );
    }, [
      saving,
    ]);

  const openCreateEditor =
    useCallback(() => {
      clearError();
      clearSuccess();

      setEditorMode(
        "create"
      );

      setSelectedUser(
        null
      );

      setDraft(
        createEmptyDraft()
      );

      setEditorTab(
        "identity"
      );

      setEditorOpen(
        true
      );
    }, [
      clearError,
      clearSuccess,
    ]);

  const openEditEditor =
    useCallback(
      (
        user:
          AppUserRecord
      ) => {
        clearError();
        clearSuccess();

        setEditorMode(
          "edit"
        );

        setSelectedUser(
          user
        );

        setDraft(
          draftFromUser(
            user
          )
        );

        setEditorTab(
          "identity"
        );

        setActionMenuUserID(
          null
        );

        setEditorOpen(
          true
        );
      },
      [
        clearError,
        clearSuccess,
      ]
    );

  const updateDraft =
    useCallback(
      <Key extends keyof AppUserDraft>(
        key: Key,
        value:
          AppUserDraft[Key]
      ) => {
        setDraft(
          (
            current
          ) => ({
            ...current,

            [key]:
              value,
          })
        );
      },
      []
    );

  const changeDraftRole =
    useCallback(
      (
        role:
          AppUserRole
      ) => {
        setDraft(
          (
            current
          ) => ({
            ...current,

            role,

            permissions:
              defaultPermissionsForRole(
                role
              ),
          })
        );
      },
      []
    );

  const togglePermission =
    useCallback(
      (
        permission:
          keyof AppUserPermissions
      ) => {
        setDraft(
          (
            current
          ) => ({
            ...current,

            permissions: {
              ...current.permissions,

              [permission]:
                !current
                  .permissions[
                    permission
                  ],
            },
          })
        );
      },
      []
    );

  const resetPermissionsForRole =
    useCallback(() => {
      setDraft(
        (
          current
        ) => ({
          ...current,

          permissions:
            defaultPermissionsForRole(
              current.role
            ),
        })
      );
    }, []);

  const toggleModule =
    useCallback(
      (
        moduleID:
          string
      ) => {
        setDraft(
          (
            current
          ) => {
            const isEnabled =
              current
                .enabledModules
                .includes(
                  moduleID
                );

            return {
              ...current,

              enabledModules:
                isEnabled
                  ? current
                      .enabledModules
                      .filter(
                        (
                          value
                        ) =>
                          value !==
                          moduleID
                      )
                  : [
                      ...current
                        .enabledModules,

                      moduleID,
                    ],

              disabledModules:
                current
                  .disabledModules
                  .filter(
                    (
                      value
                    ) =>
                      value !==
                      moduleID
                  ),
            };
          }
        );
      },
      []
    );

  // ==========================================================
  // MARK: - Save
  // ==========================================================

  const handleSave =
    useCallback(
      async (
        event:
          FormEvent<HTMLFormElement>
      ): Promise<void> => {
        event.preventDefault();

        const fullName =
          cleanText(
            draft.fullName
          );

        const username =
          cleanText(
            draft.username
          ).toLowerCase();

        const email =
          cleanText(
            draft.email
          ).toLowerCase();

        if (
          !fullName
        ) {
          window.alert(
            "Full Name is required."
          );

          return;
        }

        if (
          !username
        ) {
          window.alert(
            "Username is required."
          );

          return;
        }

        if (
          draft
            .createAuthenticationAccount &&
          !email
        ) {
          window.alert(
            "An email address is required when authentication access is enabled."
          );

          return;
        }

        if (
          editorMode ===
            "create" &&
          draft
            .temporaryPassword &&
          draft
            .temporaryPassword
            .length <
            8
        ) {
          window.alert(
            "The temporary password must contain at least 8 characters."
          );

          return;
        }

        setSaving(
          true
        );

        try {
          if (
            editorMode ===
              "create"
          ) {
            const createInput:
              CreateAppUserFormInput = {
                username,

                fullName,

                email,

                phone:
                  cleanText(
                    draft.phone
                  ),

                addressLine1:
                  cleanText(
                    draft.addressLine1
                  ),

                addressLine2:
                  cleanText(
                    draft.addressLine2
                  ),

                role:
                  draft.role,

                isActive:
                  draft.isActive,

                permissions:
                  draft.permissions,

                enabledModules:
                  draft.enabledModules,

                disabledModules:
                  draft.disabledModules,

                createAuthenticationAccount:
                  draft.createAuthenticationAccount,

                sendWelcomeEmail:
                  draft.sendWelcomeEmail,

                temporaryPassword:
                  cleanText(
                    draft
                      .temporaryPassword
                  ) ||
                  undefined,
              };

            await createUser(
              createInput
            );
          } else if (
            selectedUser
          ) {
            const updateInput:
              UpdateAppUserFormInput = {
                username,

                fullName,

                email,

                phone:
                  cleanText(
                    draft.phone
                  ),

                addressLine1:
                  cleanText(
                    draft.addressLine1
                  ),

                addressLine2:
                  cleanText(
                    draft.addressLine2
                  ),

                role:
                  selectedUser
                    .isBusinessOwner
                    ? APP_USER_ROLES
                        .admin
                    : draft.role,

                isActive:
                  selectedUser
                    .isBusinessOwner
                    ? true
                    : draft
                        .isActive,

                permissions:
                  draft.permissions,

                enabledModules:
                  draft.enabledModules,

                disabledModules:
                  draft.disabledModules,
              };

            const updatedUser =
              await updateUser(
                selectedUser,
                updateInput
              );

            await updateUserAccess(
              updatedUser,
              {
                role:
                  updatedUser
                    .isBusinessOwner
                    ? APP_USER_ROLES
                        .admin
                    : draft.role,

                permissions:
                  draft.permissions,

                enabledModules:
                  draft.enabledModules,

                disabledModules:
                  draft.disabledModules,
              }
            );

            if (
              selectedUser
                .firebaseUID &&
              email &&
              email !==
                selectedUser
                  .email
            ) {
              await updateAuthenticationEmail(
                selectedUser,
                email
              );
            }
          }

          closeEditor();
        } catch (
          error: unknown
        ) {
          console.error(
            "Unable to save App User:",
            error
          );
        } finally {
          setSaving(
            false
          );
        }
      },
      [
        closeEditor,
        createUser,
        draft,
        editorMode,
        selectedUser,
        updateAuthenticationEmail,
        updateUser,
        updateUserAccess,
      ]
    );

  // ==========================================================
  // MARK: - User Actions
  // ==========================================================

  const handleToggleActive =
    useCallback(
      async (
        user:
          AppUserRecord
      ) => {
        setActionMenuUserID(
          null
        );

        try {
          if (
            user.isActive
          ) {
            await deactivateUser(
              user
            );
          } else {
            await activateUser(
              user
            );
          }
        } catch (
          error: unknown
        ) {
          console.error(
            "Unable to change App User status:",
            error
          );
        }
      },
      [
        activateUser,
        deactivateUser,
      ]
    );

  const handlePasswordReset =
    useCallback(
      async (
        user:
          AppUserRecord
      ) => {
        setActionMenuUserID(
          null
        );

        try {
          await sendPasswordReset(
            user
          );
        } catch (
          error: unknown
        ) {
          console.error(
            "Unable to send password reset:",
            error
          );
        }
      },
      [
        sendPasswordReset,
      ]
    );

  const handleAuthenticationToggle =
    useCallback(
      async (
        user:
          AppUserRecord,
        disabled:
          boolean
      ) => {
        setActionMenuUserID(
          null
        );

        try {
          if (
            disabled
          ) {
            await disableAuthentication(
              user
            );
          } else {
            await enableAuthentication(
              user
            );
          }
        } catch (
          error: unknown
        ) {
          console.error(
            "Unable to change authentication access:",
            error
          );
        }
      },
      [
        disableAuthentication,
        enableAuthentication,
      ]
    );

  const confirmDelete =
    useCallback(
      async (): Promise<void> => {
        if (
          !deleteCandidate
        ) {
          return;
        }

        try {
          await deleteUser(
            deleteCandidate,
            true
          );

          setDeleteCandidate(
            null
          );
        } catch (
          error: unknown
        ) {
          console.error(
            "Unable to delete App User:",
            error
          );
        }
      },
      [
        deleteCandidate,
        deleteUser,
      ]
    );

  const saveTemporaryPassword =
    useCallback(
      async (): Promise<void> => {
        if (
          !temporaryPasswordUser
        ) {
          return;
        }

        if (
          temporaryPassword
            .length <
          8
        ) {
          window.alert(
            "The temporary password must contain at least 8 characters."
          );

          return;
        }

        try {
          await setTemporaryPassword(
            temporaryPasswordUser,
            temporaryPassword
          );

          setTemporaryPasswordUser(
            null
          );

          setTemporaryPasswordValue(
            ""
          );
        } catch (
          error: unknown
        ) {
          console.error(
            "Unable to set temporary password:",
            error
          );
        }
      },
      [
        setTemporaryPassword,
        temporaryPassword,
        temporaryPasswordUser,
      ]
    );

  // ==========================================================
  // MARK: - Escape Key
  // ==========================================================

  useEffect(() => {
    const handleKeyDown =
      (
        event:
          KeyboardEvent
      ) => {
        if (
          event.key !==
          "Escape"
        ) {
          return;
        }

        setActionMenuUserID(
          null
        );

        if (
          deleteCandidate
        ) {
          setDeleteCandidate(
            null
          );

          return;
        }

        if (
          temporaryPasswordUser
        ) {
          setTemporaryPasswordUser(
            null
          );

          setTemporaryPasswordValue(
            ""
          );

          return;
        }

        if (
          editorOpen
        ) {
          closeEditor();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    closeEditor,
    deleteCandidate,
    editorOpen,
    temporaryPasswordUser,
  ]);

  // ==========================================================
  // MARK: - Loading and Access States
  // ==========================================================

  if (
    businessContextIsLoading
  ) {
    return (
      <div
        className="jcs-app-users-state"
        data-accent={
          accentName
        }
      >
        <LoaderCircle
          className="jcs-app-users-rotating"
          size={34}
          strokeWidth={1.7}
        />

        <h1>
          Preparing App Users
        </h1>

        <p>
          Connecting the current business,
          administrator identity and permissions.
        </p>
      </div>
    );
  }

  if (
    !canManageAppUsers
  ) {
    return (
      <div
        className="jcs-app-users-state"
        data-accent={
          accentName
        }
      >
        <LockKeyhole
          size={38}
          strokeWidth={1.6}
        />

        <h1>
          App User Administration
        </h1>

        <p>
          Only the Business Owner, Platform Administrator
          or an authorized Business Administrator can
          manage users.
        </p>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/dashboard"
            )
          }
        >
          <ArrowLeft
            size={17}
            strokeWidth={1.8}
          />

          Back to Dashboard
        </button>
      </div>
    );
  }

  // ==========================================================
  // MARK: - View
  // ==========================================================

  return (
    <div
      className="jcs-app-users-shell"
      data-accent={
        accentName
      }
    >
      {/* ======================================================
          MARK: - Header
      ====================================================== */}

      <header className="jcs-app-users-header">
        <div className="jcs-app-users-header__leading">
          <button
            type="button"
            className="jcs-app-users-icon-button"
            aria-label="Back to Dashboard"
            onClick={() =>
              router.push(
                "/dashboard"
              )
            }
          >
            <ArrowLeft
              size={20}
              strokeWidth={1.8}
            />
          </button>

          <div className="jcs-app-users-header__identity">
            <span className="jcs-app-users-header__icon">
              <Users
                size={24}
                strokeWidth={1.7}
              />
            </span>

            <span>
              <small>
                {companyName}
              </small>

              <strong>
                App Users
              </strong>
            </span>
          </div>
        </div>

        <div className="jcs-app-users-header__actions">
          <div className="jcs-app-users-live-status">
            <span />

            <div>
              <strong>
                {isRefreshing
                  ? "Synchronizing"
                  : "Live business users"}
              </strong>

              <small>
                {lastRefreshedAt
                  ? `Updated ${lastRefreshedAt.toLocaleTimeString(
                      [],
                      {
                        hour:
                          "numeric",

                        minute:
                          "2-digit",
                      }
                    )}`
                  : "Waiting for Firestore"}
              </small>
            </div>
          </div>

          <button
            type="button"
            className="jcs-app-users-icon-button"
            aria-label="Refresh App Users"
            disabled={
              isRefreshing
            }
            onClick={() => {
              void refresh();
            }}
          >
            <RefreshCw
              className={
                isRefreshing
                  ? "jcs-app-users-rotating"
                  : undefined
              }
              size={19}
              strokeWidth={1.8}
            />
          </button>

          <button
            type="button"
            className="jcs-app-users-primary-button"
            onClick={
              openCreateEditor
            }
          >
            <UserRoundPlus
              size={18}
              strokeWidth={1.8}
            />

            Add User
          </button>
        </div>
      </header>

      {/* ======================================================
          MARK: - Content
      ====================================================== */}

      <main className="jcs-app-users-content">
        {/* Hero */}

        <section className="jcs-app-users-hero">
          <div className="jcs-app-users-hero__content">
            <p className="jcs-app-users-eyebrow">
              Business Access Control
            </p>

            <h1>
              Manage every user, role and module
              from one secure workspace.
            </h1>

            <p>
              Control customers, employees, managers,
              administrators and providers without using
              the Firebase Console.
            </p>

            <div className="jcs-app-users-hero__badges">
              <span>
                <ShieldCheck
                  size={15}
                  strokeWidth={1.9}
                />

                Tenant protected
              </span>

              <span>
                <Activity
                  size={15}
                  strokeWidth={1.9}
                />

                Firestore synchronized
              </span>

              <span>
                <KeyRound
                  size={15}
                  strokeWidth={1.9}
                />

                Secure authentication
              </span>
            </div>
          </div>

          <div className="jcs-app-users-hero__summary">
            <span className="jcs-app-users-hero__summary-icon">
              <Building2
                size={24}
                strokeWidth={1.7}
              />
            </span>

            <div>
              <small>
                Current business
              </small>

              <strong>
                {companyName}
              </strong>

              <span>
                {metrics.activeUsers} active of{" "}
                {metrics.totalUsers} users
              </span>
            </div>
          </div>
        </section>

        {/* Messages */}

        {errorMessage && (
          <div
            className="jcs-app-users-message"
            data-tone="error"
          >
            <ShieldOff
              size={19}
              strokeWidth={1.8}
            />

            <span>
              <strong>
                Unable to complete the action
              </strong>

              <small>
                {errorMessage}
              </small>
            </span>

            <button
              type="button"
              aria-label="Close error"
              onClick={
                clearError
              }
            >
              <X
                size={17}
                strokeWidth={1.8}
              />
            </button>
          </div>
        )}

        {successMessage && (
          <div
            className="jcs-app-users-message"
            data-tone="success"
          >
            <CheckCircle2
              size={19}
              strokeWidth={1.8}
            />

            <span>
              <strong>
                Action completed
              </strong>

              <small>
                {successMessage}
              </small>
            </span>

            <button
              type="button"
              aria-label="Close success message"
              onClick={
                clearSuccess
              }
            >
              <X
                size={17}
                strokeWidth={1.8}
              />
            </button>
          </div>
        )}

        {/* Metrics */}

        <section
          className="jcs-app-users-metrics"
          aria-label="App User metrics"
        >
          <AppUserMetricCard
            title="Total Users"
            value={
              metrics.totalUsers
            }
            detail={`${metrics.activeUsers} active accounts`}
            icon={
              Users
            }
          />

          <AppUserMetricCard
            title="Customers"
            value={
              metrics.customers
            }
            detail="Customer access accounts"
            icon={
              ContactRound
            }
          />

          <AppUserMetricCard
            title="Team Members"
            value={
              metrics.employees +
              metrics.managers +
              metrics.administrators
            }
            detail="Employees, managers and admins"
            icon={
              BriefcaseBusiness
            }
          />

          <AppUserMetricCard
            title="Authentication"
            value={
              metrics.usersWithAuthentication
            }
            detail={`${metrics.usersWithoutAuthentication} without login access`}
            icon={
              KeyRound
            }
          />
        </section>

        {/* User Panel */}

        <section className="jcs-app-users-panel">
          <div className="jcs-app-users-panel__header">
            <div>
              <p className="jcs-app-users-eyebrow">
                Business Users
              </p>

              <h2>
                Users and Access
              </h2>

              <p>
                Select a user to edit identity,
                role, permissions and modules.
              </p>
            </div>

            <span className="jcs-app-users-panel__count">
              {filteredUsers.length}
              {" "}
              {filteredUsers.length ===
              1
                ? "user"
                : "users"}
            </span>
          </div>

          <div className="jcs-app-users-toolbar">
            <label className="jcs-app-users-search">
              <Search
                size={18}
                strokeWidth={1.8}
              />

              <input
                type="search"
                value={
                  searchText
                }
                placeholder="Search name, email, username or role…"
                onChange={(
                  event
                ) =>
                  setSearchText(
                    event
                      .target
                      .value
                  )
                }
              />
            </label>

            <label className="jcs-app-users-filter">
              <SlidersHorizontal
                size={17}
                strokeWidth={1.8}
              />

              <select
                value={
                  filter
                }
                onChange={(
                  event
                ) =>
                  setFilter(
                    event
                      .target
                      .value as AppUserFilter
                  )
                }
              >
                {FILTER_OPTIONS.map(
                  (
                    option
                  ) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>

              <ChevronDown
                size={16}
                strokeWidth={1.8}
              />
            </label>
          </div>

          {isLoading ? (
            <div className="jcs-app-users-loading">
              <LoaderCircle
                className="jcs-app-users-rotating"
                size={28}
                strokeWidth={1.7}
              />

              <strong>
                Loading App Users
              </strong>

              <span>
                Synchronizing this business with Firestore.
              </span>
            </div>
          ) : filteredUsers.length ===
            0 ? (
            <div className="jcs-app-users-empty">
              <UserRoundPlus
                size={34}
                strokeWidth={1.6}
              />

              <strong>
                No users found
              </strong>

              <span>
                Add a user or change the current
                search and filter.
              </span>

              <button
                type="button"
                onClick={
                  openCreateEditor
                }
              >
                <Plus
                  size={17}
                  strokeWidth={1.8}
                />

                Add First User
              </button>
            </div>
          ) : (
            <div className="jcs-app-users-list">
              {filteredUsers.map(
                (
                  user
                ) => {
                  const RoleIcon =
                    roleIcon(
                      user.roleRawValue
                    );

                  const isCurrentUser =
                    Boolean(
                      currentFirebaseUID &&
                      user.firebaseUID ===
                        currentFirebaseUID
                    );

                  const canDelete =
                    !user.isBusinessOwner &&
                    !user
                      .isPlatformAdministrator &&
                    !isCurrentUser;

                  return (
                    <article
                      key={
                        user.id
                      }
                      className="jcs-app-user-row"
                      data-active={
                        user.isActive
                          ? "true"
                          : "false"
                      }
                    >
                      <button
                        type="button"
                        className="jcs-app-user-row__main"
                        onClick={() =>
                          openEditEditor(
                            user
                          )
                        }
                      >
                        <span className="jcs-app-user-avatar">
                          {user
                            .profileImageURL ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={
                                user.profileImageURL
                              }
                              alt=""
                            />
                          ) : (
                            initialsForUser(
                              user
                            )
                          )}
                        </span>

                        <span className="jcs-app-user-row__identity">
                          <span className="jcs-app-user-row__name">
                            <strong>
                              {appUserDisplayName(
                                user
                              )}
                            </strong>

                            {user.isBusinessOwner && (
                              <span data-badge="owner">
                                <BadgeCheck
                                  size={13}
                                  strokeWidth={2}
                                />

                                Owner
                              </span>
                            )}

                            {isCurrentUser && (
                              <span data-badge="current">
                                You
                              </span>
                            )}
                          </span>

                          <small>
                            {user.email ||
                              user.username}
                          </small>
                        </span>

                        <span className="jcs-app-user-row__role">
                          <RoleIcon
                            size={17}
                            strokeWidth={1.8}
                          />

                          <span>
                            <strong>
                              {appUserRoleLabel(
                                user.roleRawValue
                              )}
                            </strong>

                            <small>
                              {user
                                .enabledModules
                                .length}{" "}
                              custom modules
                            </small>
                          </span>
                        </span>

                        <span
                          className="jcs-app-user-row__status"
                          data-status={
                            user.isActive
                              ? "active"
                              : "inactive"
                          }
                        >
                          <span />

                          {user.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>

                        <ChevronRight
                          className="jcs-app-user-row__chevron"
                          size={18}
                          strokeWidth={1.8}
                        />
                      </button>

                      <div className="jcs-app-user-row__menu">
                        <button
                          type="button"
                          aria-label={`Actions for ${appUserDisplayName(
                            user
                          )}`}
                          aria-expanded={
                            actionMenuUserID ===
                            user.id
                          }
                          onClick={() =>
                            setActionMenuUserID(
                              (
                                current
                              ) =>
                                current ===
                                user.id
                                  ? null
                                  : user.id
                            )
                          }
                        >
                          <MoreHorizontal
                            size={19}
                            strokeWidth={1.8}
                          />
                        </button>

                        {actionMenuUserID ===
                          user.id && (
                          <div className="jcs-app-user-actions">
                            <button
                              type="button"
                              onClick={() =>
                                openEditEditor(
                                  user
                                )
                              }
                            >
                              <Edit3
                                size={16}
                                strokeWidth={1.8}
                              />

                              Edit User
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                void handleToggleActive(
                                  user
                                );
                              }}
                              disabled={
                                user.isBusinessOwner
                              }
                            >
                              {user.isActive ? (
                                <UserX
                                  size={16}
                                  strokeWidth={1.8}
                                />
                              ) : (
                                <UserCheck
                                  size={16}
                                  strokeWidth={1.8}
                                />
                              )}

                              {user.isActive
                                ? "Deactivate User"
                                : "Activate User"}
                            </button>

                            {user.firebaseUID && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    void handlePasswordReset(
                                      user
                                    );
                                  }}
                                >
                                  <MailCheck
                                    size={16}
                                    strokeWidth={1.8}
                                  />

                                  Send Password Reset
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionMenuUserID(
                                      null
                                    );

                                    setTemporaryPasswordUser(
                                      user
                                    );

                                    setTemporaryPasswordValue(
                                      ""
                                    );
                                  }}
                                >
                                  <KeyRound
                                    size={16}
                                    strokeWidth={1.8}
                                  />

                                  Set Temporary Password
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    void handleAuthenticationToggle(
                                      user,
                                      true
                                    );
                                  }}
                                  disabled={
                                    user.isBusinessOwner
                                  }
                                >
                                  <Ban
                                    size={16}
                                    strokeWidth={1.8}
                                  />

                                  Disable Login
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    void handleAuthenticationToggle(
                                      user,
                                      false
                                    );
                                  }}
                                >
                                  <UserCheck
                                    size={16}
                                    strokeWidth={1.8}
                                  />

                                  Enable Login
                                </button>
                              </>
                            )}

                            <div />

                            <button
                              type="button"
                              className="jcs-app-user-actions__danger"
                              disabled={
                                !canDelete
                              }
                              onClick={() => {
                                setActionMenuUserID(
                                  null
                                );

                                setDeleteCandidate(
                                  user
                                );
                              }}
                            >
                              <Trash2
                                size={16}
                                strokeWidth={1.8}
                              />

                              Delete User
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </main>

      {/* ======================================================
          MARK: - User Editor
      ====================================================== */}

      {editorOpen && (
        <div
          className="jcs-app-user-editor-backdrop"
          role="presentation"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEditor();
            }
          }}
        >
          <form
            className="jcs-app-user-editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="jcs-app-user-editor-title"
            onSubmit={(
              event
            ) => {
              void handleSave(
                event
              );
            }}
          >
            <header className="jcs-app-user-editor__header">
              <div>
                <span className="jcs-app-user-editor__icon">
                  {editorMode ===
                  "create" ? (
                    <UserRoundPlus
                      size={23}
                      strokeWidth={1.7}
                    />
                  ) : (
                    <UserCog
                      size={23}
                      strokeWidth={1.7}
                    />
                  )}
                </span>

                <span>
                  <small>
                    {editorMode ===
                    "create"
                      ? "New Business User"
                      : "User Administration"}
                  </small>

                  <strong id="jcs-app-user-editor-title">
                    {editorMode ===
                    "create"
                      ? "Add App User"
                      : appUserDisplayName(
                          selectedUser ??
                          {
                            fullName:
                              draft.fullName,

                            username:
                              draft.username,

                            email:
                              draft.email,
                          }
                        )}
                  </strong>
                </span>
              </div>

              <button
                type="button"
                className="jcs-app-users-icon-button"
                aria-label="Close editor"
                disabled={
                  saving
                }
                onClick={
                  closeEditor
                }
              >
                <X
                  size={20}
                  strokeWidth={1.8}
                />
              </button>
            </header>

            <nav className="jcs-app-user-editor__tabs">
              <EditorTabButton
                active={
                  editorTab ===
                  "identity"
                }
                icon={
                  CircleUserRound
                }
                title="Identity"
                onClick={() =>
                  setEditorTab(
                    "identity"
                  )
                }
              />

              <EditorTabButton
                active={
                  editorTab ===
                  "access"
                }
                icon={
                  ShieldCheck
                }
                title="Role & Access"
                onClick={() =>
                  setEditorTab(
                    "access"
                  )
                }
              />

              <EditorTabButton
                active={
                  editorTab ===
                  "security"
                }
                icon={
                  KeyRound
                }
                title="Security"
                onClick={() =>
                  setEditorTab(
                    "security"
                  )
                }
              />
            </nav>

            <div className="jcs-app-user-editor__content">
              {editorTab ===
                "identity" && (
                <div className="jcs-app-user-editor__section">
                  <EditorSectionHeading
                    eyebrow="User Information"
                    title="Identity and contact details"
                    description="Information used throughout this business workspace."
                  />

                  <div className="jcs-app-user-form-grid">
                    <EditorField
                      label="Full Name"
                      required
                      value={
                        draft.fullName
                      }
                      placeholder="Full name"
                      onChange={(
                        value
                      ) =>
                        updateDraft(
                          "fullName",
                          value
                        )
                      }
                    />

                    <EditorField
                      label="Username"
                      required
                      value={
                        draft.username
                      }
                      placeholder="username"
                      disabled={
                        editorMode ===
                        "edit"
                      }
                      onChange={(
                        value
                      ) =>
                        updateDraft(
                          "username",
                          value
                        )
                      }
                    />

                    <EditorField
                      label="Email"
                      type="email"
                      value={
                        draft.email
                      }
                      placeholder="name@example.com"
                      onChange={(
                        value
                      ) =>
                        updateDraft(
                          "email",
                          value
                        )
                      }
                    />

                    <EditorField
                      label="Phone"
                      type="tel"
                      value={
                        draft.phone
                      }
                      placeholder="Phone number"
                      onChange={(
                        value
                      ) =>
                        updateDraft(
                          "phone",
                          value
                        )
                      }
                    />

                    <EditorField
                      label="Address Line 1"
                      value={
                        draft.addressLine1
                      }
                      placeholder="Street address"
                      onChange={(
                        value
                      ) =>
                        updateDraft(
                          "addressLine1",
                          value
                        )
                      }
                    />

                    <EditorField
                      label="Address Line 2"
                      value={
                        draft.addressLine2
                      }
                      placeholder="Unit, suite or apartment"
                      onChange={(
                        value
                      ) =>
                        updateDraft(
                          "addressLine2",
                          value
                        )
                      }
                    />
                  </div>

                  <label className="jcs-app-user-toggle-card">
                    <span>
                      <strong>
                        Active User
                      </strong>

                      <small>
                        Allow this user to access assigned business features.
                      </small>
                    </span>

                    <input
                      type="checkbox"
                      checked={
                        selectedUser
                          ?.isBusinessOwner
                          ? true
                          : draft
                              .isActive
                      }
                      disabled={
                        selectedUser
                          ?.isBusinessOwner
                      }
                      onChange={(
                        event
                      ) =>
                        updateDraft(
                          "isActive",
                          event
                            .target
                            .checked
                        )
                      }
                    />

                    <span className="jcs-app-user-switch" />
                  </label>
                </div>
              )}

              {editorTab ===
                "access" && (
                <div className="jcs-app-user-editor__section">
                  <EditorSectionHeading
                    eyebrow="Business Access"
                    title="Role, permissions and modules"
                    description="Choose a default role and customize individual access."
                  />

                  <div className="jcs-app-user-role-grid">
                    {ROLE_OPTIONS.map(
                      (
                        option
                      ) => {
                        const Icon =
                          option.icon;

                        const isSelected =
                          draft.role ===
                          option.role;

                        const ownerLocked =
                          Boolean(
                            selectedUser
                              ?.isBusinessOwner &&
                            option.role !==
                              APP_USER_ROLES
                                .admin
                          );

                        return (
                          <button
                            key={
                              option.role
                            }
                            type="button"
                            className="jcs-app-user-role-card"
                            data-selected={
                              isSelected
                                ? "true"
                                : "false"
                            }
                            disabled={
                              ownerLocked
                            }
                            onClick={() =>
                              changeDraftRole(
                                option.role
                              )
                            }
                          >
                            <span>
                              <Icon
                                size={20}
                                strokeWidth={1.8}
                              />
                            </span>

                            <strong>
                              {option.title}
                            </strong>

                            <small>
                              {option.subtitle}
                            </small>

                            {isSelected && (
                              <Check
                                className="jcs-app-user-role-card__check"
                                size={17}
                                strokeWidth={2}
                              />
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <div className="jcs-app-user-access-summary">
                    <div>
                      <strong>
                        {roleOption
                          ?.title ??
                          "Employee"}
                      </strong>

                      <span>
                        {activePermissionCount} active permissions
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={
                        resetPermissionsForRole
                      }
                    >
                      Reset Role Defaults
                    </button>
                  </div>

                  <div className="jcs-app-user-permission-groups">
                    {PERMISSION_GROUPS.map(
                      (
                        group
                      ) => (
                        <section
                          key={
                            group.id
                          }
                          className="jcs-app-user-permission-group"
                        >
                          <div className="jcs-app-user-permission-group__heading">
                            <div>
                              <strong>
                                {group.title}
                              </strong>

                              <span>
                                {group.subtitle}
                              </span>
                            </div>

                            <small>
                              {
                                group.permissions.filter(
                                  (
                                    permission
                                  ) =>
                                    draft
                                      .permissions[
                                        permission
                                      ]
                                ).length
                              }
                              /
                              {
                                group
                                  .permissions
                                  .length
                              }
                            </small>
                          </div>

                          <div className="jcs-app-user-permission-list">
                            {group.permissions.map(
                              (
                                permission
                              ) => (
                                <label
                                  key={
                                    permission
                                  }
                                  className="jcs-app-user-permission-row"
                                >
                                  <span>
                                    <strong>
                                      {permissionLabel(
                                        permission
                                      )}
                                    </strong>
                                  </span>

                                  <input
                                    type="checkbox"
                                    checked={
                                      draft
                                        .permissions[
                                          permission
                                        ]
                                    }
                                    onChange={() =>
                                      togglePermission(
                                        permission
                                      )
                                    }
                                  />

                                  <span className="jcs-app-user-switch" />
                                </label>
                              )
                            )}
                          </div>
                        </section>
                      )
                    )}
                  </div>

                  <section className="jcs-app-user-module-section">
                    <div className="jcs-app-user-module-section__heading">
                      <div>
                        <strong>
                          Custom Modules
                        </strong>

                        <span>
                          Add explicit modules beyond the selected role defaults.
                        </span>
                      </div>

                      <small>
                        {
                          draft
                            .enabledModules
                            .length
                        } selected
                      </small>
                    </div>

                    <div className="jcs-app-user-module-grid">
                      {MODULE_OPTIONS.map(
                        (
                          module
                        ) => {
                          const selected =
                            draft
                              .enabledModules
                              .includes(
                                module.id
                              );

                          return (
                            <button
                              key={
                                module.id
                              }
                              type="button"
                              className="jcs-app-user-module-card"
                              data-selected={
                                selected
                                  ? "true"
                                  : "false"
                              }
                              onClick={() =>
                                toggleModule(
                                  module.id
                                )
                              }
                            >
                              <span>
                                {selected ? (
                                  <CheckCircle2
                                    size={18}
                                    strokeWidth={1.9}
                                  />
                                ) : (
                                  <Plus
                                    size={18}
                                    strokeWidth={1.9}
                                  />
                                )}
                              </span>

                              <div>
                                <strong>
                                  {module.title}
                                </strong>

                                <small>
                                  {module.subtitle}
                                </small>
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </section>
                </div>
              )}

              {editorTab ===
                "security" && (
                <div className="jcs-app-user-editor__section">
                  <EditorSectionHeading
                    eyebrow="Authentication"
                    title="Login and password administration"
                    description="Authentication changes are performed securely through Firebase Admin Cloud Functions."
                  />

                  {editorMode ===
                    "create" ? (
                    <>
                      <label className="jcs-app-user-toggle-card">
                        <span>
                          <strong>
                            Create Login Account
                          </strong>

                          <small>
                            Create Firebase Authentication access for this user.
                          </small>
                        </span>

                        <input
                          type="checkbox"
                          checked={
                            draft
                              .createAuthenticationAccount
                          }
                          onChange={(
                            event
                          ) =>
                            updateDraft(
                              "createAuthenticationAccount",
                              event
                                .target
                                .checked
                            )
                          }
                        />

                        <span className="jcs-app-user-switch" />
                      </label>

                      {draft
                        .createAuthenticationAccount && (
                        <>
                          <EditorField
                            label="Temporary Password"
                            type="password"
                            value={
                              draft
                                .temporaryPassword
                            }
                            placeholder="At least 8 characters"
                            onChange={(
                              value
                            ) =>
                              updateDraft(
                                "temporaryPassword",
                                value
                              )
                            }
                          />

                          <label className="jcs-app-user-toggle-card">
                            <span>
                              <strong>
                                Send Welcome Email
                              </strong>

                              <small>
                                Notify the user when account access is created.
                              </small>
                            </span>

                            <input
                              type="checkbox"
                              checked={
                                draft
                                  .sendWelcomeEmail
                              }
                              onChange={(
                                event
                              ) =>
                                updateDraft(
                                  "sendWelcomeEmail",
                                  event
                                    .target
                                    .checked
                                )
                              }
                            />

                            <span className="jcs-app-user-switch" />
                          </label>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="jcs-app-user-security-actions">
                      <SecurityActionCard
                        icon={
                          MailCheck
                        }
                        title="Send Password Reset"
                        description="Send a secure password reset message to this user."
                        disabled={
                          !selectedUser
                            ?.firebaseUID ||
                          !selectedUser
                            ?.email
                        }
                        onClick={() => {
                          if (
                            selectedUser
                          ) {
                            void handlePasswordReset(
                              selectedUser
                            );
                          }
                        }}
                      />

                      <SecurityActionCard
                        icon={
                          KeyRound
                        }
                        title="Set Temporary Password"
                        description="Assign a temporary password using Firebase Admin."
                        disabled={
                          !selectedUser
                            ?.firebaseUID
                        }
                        onClick={() => {
                          if (
                            selectedUser
                          ) {
                            setTemporaryPasswordUser(
                              selectedUser
                            );

                            setTemporaryPasswordValue(
                              ""
                            );
                          }
                        }}
                      />

                      <SecurityActionCard
                        icon={
                          Ban
                        }
                        title="Disable Login"
                        description="Block authentication without deleting the App User record."
                        disabled={
                          !selectedUser
                            ?.firebaseUID ||
                          selectedUser
                            ?.isBusinessOwner
                        }
                        onClick={() => {
                          if (
                            selectedUser
                          ) {
                            void handleAuthenticationToggle(
                              selectedUser,
                              true
                            );
                          }
                        }}
                      />

                      <SecurityActionCard
                        icon={
                          UserCheck
                        }
                        title="Enable Login"
                        description="Restore Firebase Authentication access."
                        disabled={
                          !selectedUser
                            ?.firebaseUID
                        }
                        onClick={() => {
                          if (
                            selectedUser
                          ) {
                            void handleAuthenticationToggle(
                              selectedUser,
                              false
                            );
                          }
                        }}
                      />
                    </div>
                  )}

                  <div className="jcs-app-user-security-note">
                    <LockKeyhole
                      size={19}
                      strokeWidth={1.8}
                    />

                    <div>
                      <strong>
                        Passwords are never stored in AppUser
                      </strong>

                      <span>
                        AppUser stores identity, business role,
                        permissions and modules. Firebase
                        Authentication securely manages login credentials.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <footer className="jcs-app-user-editor__footer">
              <button
                type="button"
                className="jcs-app-users-secondary-button"
                disabled={
                  saving
                }
                onClick={
                  closeEditor
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="jcs-app-users-primary-button"
                disabled={
                  saving ||
                  isMutating
                }
              >
                {saving ? (
                  <LoaderCircle
                    className="jcs-app-users-rotating"
                    size={18}
                    strokeWidth={1.8}
                  />
                ) : (
                  <Save
                    size={18}
                    strokeWidth={1.8}
                  />
                )}

                {saving
                  ? "Saving…"
                  : editorMode ===
                      "create"
                    ? "Create User"
                    : "Save Changes"}
              </button>
            </footer>
          </form>
        </div>
      )}

      {/* ======================================================
          MARK: - Delete Confirmation
      ====================================================== */}

      {deleteCandidate && (
        <div className="jcs-app-user-dialog-backdrop">
          <div
            className="jcs-app-user-confirmation"
            role="alertdialog"
            aria-modal="true"
          >
            <span className="jcs-app-user-confirmation__icon">
              <Trash2
                size={25}
                strokeWidth={1.7}
              />
            </span>

            <p className="jcs-app-users-eyebrow">
              Protected Deletion
            </p>

            <h2>
              Delete{" "}
              {appUserDisplayName(
                deleteCandidate
              )}?
            </h2>

            <p>
              This removes the App User record and
              its Firebase Authentication account.
              This action cannot be undone.
            </p>

            <div className="jcs-app-user-confirmation__actions">
              <button
                type="button"
                className="jcs-app-users-secondary-button"
                onClick={() =>
                  setDeleteCandidate(
                    null
                  )
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="jcs-app-users-danger-button"
                disabled={
                  isMutating
                }
                onClick={() => {
                  void confirmDelete();
                }}
              >
                <Trash2
                  size={17}
                  strokeWidth={1.8}
                />

                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          MARK: - Temporary Password
      ====================================================== */}

      {temporaryPasswordUser && (
        <div className="jcs-app-user-dialog-backdrop">
          <div
            className="jcs-app-user-confirmation"
            role="dialog"
            aria-modal="true"
          >
            <span className="jcs-app-user-confirmation__icon">
              <KeyRound
                size={25}
                strokeWidth={1.7}
              />
            </span>

            <p className="jcs-app-users-eyebrow">
              Authentication Security
            </p>

            <h2>
              Set Temporary Password
            </h2>

            <p>
              Create a temporary password for{" "}
              {appUserDisplayName(
                temporaryPasswordUser
              )}.
            </p>

            <EditorField
              label="Temporary Password"
              type="password"
              value={
                temporaryPassword
              }
              placeholder="At least 8 characters"
              onChange={
                setTemporaryPasswordValue
              }
            />

            <div className="jcs-app-user-confirmation__actions">
              <button
                type="button"
                className="jcs-app-users-secondary-button"
                onClick={() => {
                  setTemporaryPasswordUser(
                    null
                  );

                  setTemporaryPasswordValue(
                    ""
                  );
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="jcs-app-users-primary-button"
                disabled={
                  isMutating ||
                  temporaryPassword
                    .length <
                    8
                }
                onClick={() => {
                  void saveTemporaryPassword();
                }}
              >
                <KeyRound
                  size={17}
                  strokeWidth={1.8}
                />

                Save Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MARK: - Supporting Components
// ============================================================

function AppUserMetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: number;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <article className="jcs-app-user-metric-card">
      <span className="jcs-app-user-metric-card__icon">
        <Icon
          size={21}
          strokeWidth={1.8}
        />
      </span>

      <div>
        <small>
          {title}
        </small>

        <strong>
          {value}
        </strong>

        <span>
          {detail}
        </span>
      </div>
    </article>
  );
}

function EditorTabButton({
  active,
  icon: Icon,
  title,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-active={
        active
          ? "true"
          : "false"
      }
      onClick={
        onClick
      }
    >
      <Icon
        size={17}
        strokeWidth={1.8}
      />

      {title}
    </button>
  );
}

function EditorSectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="jcs-app-user-editor__section-heading">
      <p className="jcs-app-users-eyebrow">
        {eyebrow}
      </p>

      <h2>
        {title}
      </h2>

      <p>
        {description}
      </p>
    </div>
  );
}

function EditorField({
  label,
  value,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  type?:
    | "text"
    | "email"
    | "tel"
    | "password";
  required?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="jcs-app-user-field">
      <span>
        {label}

        {required && (
          <small>
            Required
          </small>
        )}
      </span>

      <input
        type={
          type
        }
        value={
          value
        }
        placeholder={
          placeholder
        }
        required={
          required
        }
        disabled={
          disabled
        }
        autoComplete="off"
        onChange={(
          event
        ) =>
          onChange(
            event
              .target
              .value
          )
        }
      />
    </label>
  );
}

function SecurityActionCard({
  icon: Icon,
  title,
  description,
  disabled = false,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="jcs-app-user-security-action"
      disabled={
        disabled
      }
      onClick={
        onClick
      }
    >
      <span>
        <Icon
          size={20}
          strokeWidth={1.8}
        />
      </span>

      <div>
        <strong>
          {title}
        </strong>

        <small>
          {description}
        </small>
      </div>

      <ChevronRight
        size={17}
        strokeWidth={1.8}
      />
    </button>
  );
}