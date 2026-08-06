"use client";

/*
 * JCS Business Suite
 * useAppUsers.ts
 *
 * Central state and action controller for:
 *
 * - Business App Users
 * - Roles and permissions
 * - Module assignments
 * - User activation
 * - Authentication administration
 * - Protected user deletion
 *
 * React components should not communicate
 * directly with Firestore.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  APP_USER_ROLES,
  appUserDisplayName,
  appUserRoleLabel,
  appUserWithRole,
  defaultPermissionsForRole,
  type AppUserPermissions,
  type AppUserRecord,
  type AppUserRole,
  type CreateAppUserInput,
  type UpdateAppUserInput,
} from "@/models/AppUser";

import {
  createBusinessAppUser,
  deleteBusinessAppUser,
  fetchBusinessAppUsers,
  sendAppUserPasswordReset,
  setAppUserAuthenticationDisabled,
  setAppUserTemporaryPassword,
  setBusinessAppUserActive,
  subscribeToBusinessAppUsers,
  updateAppUserAuthenticationEmail,
  updateAppUserModules,
  updateAppUserPermissions,
  updateBusinessAppUser,
  updateBusinessAppUserAccess,
  type AppUserActor,
  type CreateBusinessAppUserInput,
  type UpdateBusinessAppUserInput,
} from "./AppUserFirestoreService";

// ============================================================
// MARK: - Constants
// ============================================================

const DEFAULT_ROLE:
  AppUserRole =
    APP_USER_ROLES.employee;

// ============================================================
// MARK: - Types
// ============================================================

export type AppUserFilter =
  | "all"
  | "active"
  | "inactive"
  | AppUserRole;

export type AppUserSortField =
  | "name"
  | "role"
  | "status"
  | "createdAt";

export type AppUserSortDirection =
  | "ascending"
  | "descending";

export interface UseAppUsersOptions {
  enabled?: boolean;

  actor:
    AppUserActor;

  businessID: string;

  usesRealtimeListeners?: boolean;
}

export interface AppUserMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;

  customers: number;
  employees: number;
  managers: number;
  administrators: number;
  providers: number;

  usersWithAuthentication: number;
  usersWithoutAuthentication: number;
}

export interface CreateAppUserFormInput {
  username: string;

  fullName: string;
  email: string;
  phone?: string;

  addressLine1?: string;
  addressLine2?: string;

  role?: AppUserRole;
  isActive?: boolean;

  profileImageURL?: string;

  permissions?:
    Partial<AppUserPermissions>;

  enabledModules?: string[];
  disabledModules?: string[];

  temporaryPassword?: string;

  createAuthenticationAccount?: boolean;
  sendWelcomeEmail?: boolean;
}

export interface UpdateAppUserFormInput {
  username?: string;

  fullName?: string;
  email?: string;
  phone?: string;

  addressLine1?: string;
  addressLine2?: string;

  role?: AppUserRole;
  isActive?: boolean;

  profileImageURL?: string;

  permissions?:
    Partial<AppUserPermissions>;

  enabledModules?: string[];
  disabledModules?: string[];
}

export interface UpdateAppUserAccessInput {
  role: AppUserRole;

  permissions:
    Partial<AppUserPermissions>;

  enabledModules: string[];
  disabledModules: string[];
}

export interface UseAppUsersResult {
  users: AppUserRecord[];
  filteredUsers: AppUserRecord[];

  selectedUser:
    AppUserRecord | null;

  metrics:
    AppUserMetrics;

  searchText: string;
  setSearchText:
    (
      value: string
    ) => void;

  filter: AppUserFilter;
  setFilter:
    (
      value: AppUserFilter
    ) => void;

  sortField: AppUserSortField;
  setSortField:
    (
      value: AppUserSortField
    ) => void;

  sortDirection:
    AppUserSortDirection;

  setSortDirection:
    (
      value:
        AppUserSortDirection
    ) => void;

  isLoading: boolean;
  isRefreshing: boolean;
  isMutating: boolean;

  errorMessage:
    string | null;

  successMessage:
    string | null;

  lastRefreshedAt:
    Date | null;

  selectUser:
    (
      user:
        AppUserRecord
    ) => void;

  selectUserByID:
    (
      userID:
        string
    ) => void;

  closeSelectedUser:
    () => void;

  refresh:
    () => Promise<void>;

  clearError:
    () => void;

  clearSuccess:
    () => void;

  createUser:
    (
      input:
        CreateAppUserFormInput
    ) => Promise<AppUserRecord>;

  updateUser:
    (
      target:
        AppUserRecord,
      input:
        UpdateAppUserFormInput
    ) => Promise<AppUserRecord>;

  updateUserAccess:
    (
      target:
        AppUserRecord,
      input:
        UpdateAppUserAccessInput
    ) => Promise<AppUserRecord>;

  changeUserRole:
    (
      target:
        AppUserRecord,
      role:
        AppUserRole,
      preserveCustomPermissions?:
        boolean
    ) => Promise<AppUserRecord>;

  updateUserPermissions:
    (
      target:
        AppUserRecord,
      permissions:
        Partial<AppUserPermissions>
    ) => Promise<void>;

  updateUserModules:
    (
      target:
        AppUserRecord,
      enabledModules:
        readonly string[],
      disabledModules:
        readonly string[]
    ) => Promise<void>;

  activateUser:
    (
      target:
        AppUserRecord
    ) => Promise<void>;

  deactivateUser:
    (
      target:
        AppUserRecord
    ) => Promise<void>;

  sendPasswordReset:
    (
      target:
        AppUserRecord
    ) => Promise<void>;

  setTemporaryPassword:
    (
      target:
        AppUserRecord,
      temporaryPassword:
        string
    ) => Promise<void>;

  updateAuthenticationEmail:
    (
      target:
        AppUserRecord,
      newEmail:
        string
    ) => Promise<void>;

  enableAuthentication:
    (
      target:
        AppUserRecord
    ) => Promise<void>;

  disableAuthentication:
    (
      target:
        AppUserRecord
    ) => Promise<void>;

  deleteUser:
    (
      target:
        AppUserRecord,
      deleteAuthenticationAccount?:
        boolean
    ) => Promise<void>;
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

function normalizedErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  if (
    error instanceof Error &&
    cleanText(
      error.message
    )
  ) {
    return error.message;
  }

  return fallbackMessage;
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

function userSearchValue(
  user: AppUserRecord
): string {
  return [
    user.fullName,
    user.username,
    user.email,
    user.phone,
    user.roleRawValue,
    appUserRoleLabel(
      user.roleRawValue
    ),
    user.businessName,
  ]
    .map(
      cleanText
    )
    .join(" ")
    .toLowerCase();
}

function compareText(
  firstValue: string,
  secondValue: string
): number {
  return firstValue.localeCompare(
    secondValue,
    undefined,
    {
      sensitivity:
        "base",
      numeric:
        true,
    }
  );
}

function sortUsers(
  users:
    readonly AppUserRecord[],
  sortField:
    AppUserSortField,
  sortDirection:
    AppUserSortDirection
): AppUserRecord[] {
  const directionMultiplier =
    sortDirection ===
    "ascending"
      ? 1
      : -1;

  return [...users]
    .sort(
      (
        first,
        second
      ) => {
        /*
         * Keep the primary owner at the top
         * regardless of the selected sorting.
         */
        if (
          first.isBusinessOwner !==
          second.isBusinessOwner
        ) {
          return first.isBusinessOwner
            ? -1
            : 1;
        }

        let comparison =
          0;

        switch (
          sortField
        ) {
          case "role":
            comparison =
              compareText(
                appUserRoleLabel(
                  first.roleRawValue
                ),
                appUserRoleLabel(
                  second.roleRawValue
                )
              );

            break;

          case "status":
            comparison =
              Number(
                second.isActive
              ) -
              Number(
                first.isActive
              );

            break;

          case "createdAt":
            comparison =
              first.createdAt.getTime() -
              second.createdAt.getTime();

            break;

          case "name":
          default:
            comparison =
              compareText(
                appUserDisplayName(
                  first
                ),
                appUserDisplayName(
                  second
                )
              );

            break;
        }

        if (
          comparison === 0
        ) {
          comparison =
            compareText(
              appUserDisplayName(
                first
              ),
              appUserDisplayName(
                second
              )
            );
        }

        return (
          comparison *
          directionMultiplier
        );
      }
    );
}

function filterUsers(
  users:
    readonly AppUserRecord[],
  searchText: string,
  filter:
    AppUserFilter,
  sortField:
    AppUserSortField,
  sortDirection:
    AppUserSortDirection
): AppUserRecord[] {
  const normalizedSearch =
    cleanText(
      searchText
    ).toLowerCase();

  const filtered =
    users.filter(
      (
        user
      ) => {
        const matchesSearch =
          !normalizedSearch ||
          userSearchValue(
            user
          ).includes(
            normalizedSearch
          );

        if (
          !matchesSearch
        ) {
          return false;
        }

        switch (
          filter
        ) {
          case "active":
            return user.isActive;

          case "inactive":
            return !user.isActive;

          case APP_USER_ROLES.customer:
          case APP_USER_ROLES.provider:
          case APP_USER_ROLES.employee:
          case APP_USER_ROLES.manager:
          case APP_USER_ROLES.admin:
            return (
              user.roleRawValue ===
              filter
            );

          case "all":
          default:
            return true;
        }
      }
    );

  return sortUsers(
    filtered,
    sortField,
    sortDirection
  );
}

function calculateMetrics(
  users:
    readonly AppUserRecord[]
): AppUserMetrics {
  return users.reduce<AppUserMetrics>(
    (
      metrics,
      user
    ) => {
      metrics.totalUsers +=
        1;

      if (
        user.isActive
      ) {
        metrics.activeUsers +=
          1;
      } else {
        metrics.inactiveUsers +=
          1;
      }

      if (
        cleanText(
          user.firebaseUID
        )
      ) {
        metrics.usersWithAuthentication +=
          1;
      } else {
        metrics.usersWithoutAuthentication +=
          1;
      }

      switch (
        user.roleRawValue
      ) {
        case APP_USER_ROLES.customer:
          metrics.customers +=
            1;

          break;

        case APP_USER_ROLES.provider:
          metrics.providers +=
            1;

          break;

        case APP_USER_ROLES.manager:
          metrics.managers +=
            1;

          break;

        case APP_USER_ROLES.admin:
          metrics.administrators +=
            1;

          break;

        case APP_USER_ROLES.employee:
        default:
          metrics.employees +=
            1;

          break;
      }

      return metrics;
    },
    {
      totalUsers:
        0,

      activeUsers:
        0,

      inactiveUsers:
        0,

      customers:
        0,

      employees:
        0,

      managers:
        0,

      administrators:
        0,

      providers:
        0,

      usersWithAuthentication:
        0,

      usersWithoutAuthentication:
        0,
    }
  );
}

// ============================================================
// MARK: - Hook
// ============================================================

export function useAppUsers(
  options:
    UseAppUsersOptions
): UseAppUsersResult {
  const {
    actor,
    businessID,
    enabled = true,
    usesRealtimeListeners = true,
  } = options;

  // ==========================================================
  // MARK: - Stable Actor Fields
  // ==========================================================

  const actorFirebaseUID =
    cleanText(
      actor.firebaseUID
    );

  const actorBusinessID =
    cleanText(
      actor.businessID
    );

  const actorIsActive =
    Boolean(
      actor.isActive
    );

  const actorIsBusinessOwner =
    Boolean(
      actor.isBusinessOwner
    );

  const actorIsPlatformAdministrator =
    Boolean(
      actor.isPlatformAdministrator
    );

  const actorCanManageAppUsers =
    Boolean(
      actor.canManageAppUsers
    );

  const normalizedBusinessID =
    cleanText(
      businessID
    );

  // ==========================================================
  // MARK: - State
  // ==========================================================

  const [
    users,
    setUsers,
  ] =
    useState<AppUserRecord[]>(
      []
    );

  const [
    selectedUserID,
    setSelectedUserID,
  ] =
    useState<string | null>(
      null
    );

  const [
    searchText,
    setSearchText,
  ] =
    useState("");

  const [
    filter,
    setFilter,
  ] =
    useState<AppUserFilter>(
      "all"
    );

  const [
    sortField,
    setSortField,
  ] =
    useState<AppUserSortField>(
      "name"
    );

  const [
    sortDirection,
    setSortDirection,
  ] =
    useState<AppUserSortDirection>(
      "ascending"
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(
      true
    );

  const [
    isRefreshing,
    setIsRefreshing,
  ] =
    useState(
      false
    );

  const [
    mutationCount,
    setMutationCount,
  ] =
    useState(
      0
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null
    );

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<string | null>(
      null
    );

  const [
    lastRefreshedAt,
    setLastRefreshedAt,
  ] =
    useState<Date | null>(
      null
    );

  // ==========================================================
  // MARK: - References
  // ==========================================================

  const isMountedRef =
    useRef(
      false
    );

  const actorRef =
    useRef<AppUserActor>(
      actor
    );

  useEffect(() => {
    actorRef.current = {
      firebaseUID:
        actorFirebaseUID,

      businessID:
        actorBusinessID,

      isActive:
        actorIsActive,

      isBusinessOwner:
        actorIsBusinessOwner,

      isPlatformAdministrator:
        actorIsPlatformAdministrator,

      canManageAppUsers:
        actorCanManageAppUsers,
    };
  }, [
    actorFirebaseUID,
    actorBusinessID,
    actorIsActive,
    actorIsBusinessOwner,
    actorIsPlatformAdministrator,
    actorCanManageAppUsers,
  ]);

  // ==========================================================
  // MARK: - Derived State
  // ==========================================================

  const selectedUser =
    useMemo(
      () =>
        users.find(
          (
            user
          ) =>
            user.id ===
            selectedUserID
        ) ??
        null,
      [
        selectedUserID,
        users,
      ]
    );

  const filteredUsers =
    useMemo(
      () =>
        filterUsers(
          users,
          searchText,
          filter,
          sortField,
          sortDirection
        ),
      [
        users,
        searchText,
        filter,
        sortField,
        sortDirection,
      ]
    );

  const metrics =
    useMemo(
      () =>
        calculateMetrics(
          users
        ),
      [
        users,
      ]
    );

  const isMutating =
    mutationCount >
    0;

  // ==========================================================
  // MARK: - Shared State Helpers
  // ==========================================================

  const clearError =
    useCallback(() => {
      setErrorMessage(
        null
      );
    }, []);

  const clearSuccess =
    useCallback(() => {
      setSuccessMessage(
        null
      );
    }, []);

  const registerError =
    useCallback(
      (
        error: unknown,
        fallbackMessage: string
      ): void => {
        if (
          !isMountedRef.current
        ) {
          return;
        }

        setErrorMessage(
          normalizedErrorMessage(
            error,
            fallbackMessage
          )
        );
      },
      []
    );

  const registerSuccess =
    useCallback(
      (
        message: string
      ): void => {
        if (
          !isMountedRef.current
        ) {
          return;
        }

        setSuccessMessage(
          message
        );

        setErrorMessage(
          null
        );
      },
      []
    );

  const beginMutation =
    useCallback(() => {
      setMutationCount(
        (
          current
        ) =>
          current +
          1
      );

      setErrorMessage(
        null
      );

      setSuccessMessage(
        null
      );
    }, []);

  const finishMutation =
    useCallback(() => {
      setMutationCount(
        (
          current
        ) =>
          Math.max(
            0,
            current -
              1
          )
      );
    }, []);

  // ==========================================================
  // MARK: - Selection
  // ==========================================================

  const selectUser =
    useCallback(
      (
        user:
          AppUserRecord
      ): void => {
        setSelectedUserID(
          user.id
        );
      },
      []
    );

  const selectUserByID =
    useCallback(
      (
        userID:
          string
      ): void => {
        const normalizedUserID =
          cleanText(
            userID
          );

        setSelectedUserID(
          normalizedUserID ||
          null
        );
      },
      []
    );

  const closeSelectedUser =
    useCallback(() => {
      setSelectedUserID(
        null
      );
    }, []);

  // ==========================================================
  // MARK: - Refresh
  // ==========================================================

  const refresh =
    useCallback(
      async (): Promise<void> => {
        if (
          !enabled ||
          !normalizedBusinessID
        ) {
          if (
            isMountedRef.current
          ) {
            setUsers(
              []
            );

            setIsLoading(
              false
            );

            setIsRefreshing(
              false
            );
          }

          return;
        }

        if (
          isMountedRef.current
        ) {
          setIsRefreshing(
            true
          );

          setErrorMessage(
            null
          );
        }

        try {
          const loadedUsers =
            await fetchBusinessAppUsers(
              actorRef.current,
              normalizedBusinessID
            );

          if (
            !isMountedRef.current
          ) {
            return;
          }

          setUsers(
            loadedUsers
          );

          setLastRefreshedAt(
            new Date()
          );
        } catch (
          error: unknown
        ) {
          registerError(
            error,
            "Unable to load App Users."
          );

          throw error;
        } finally {
          if (
            isMountedRef.current
          ) {
            setIsLoading(
              false
            );

            setIsRefreshing(
              false
            );
          }
        }
      },
      [
        enabled,
        normalizedBusinessID,
        registerError,
      ]
    );

  const refreshRef =
    useRef(
      refresh
    );

  useEffect(() => {
    refreshRef.current =
      refresh;
  }, [
    refresh,
  ]);

  const registerErrorRef =
    useRef(
      registerError
    );

  useEffect(() => {
    registerErrorRef.current =
      registerError;
  }, [
    registerError,
  ]);

  // ==========================================================
  // MARK: - Initial Load and Live Listener
  // ==========================================================

  useEffect(() => {
    isMountedRef.current =
      true;

    if (
      !enabled
    ) {
      setUsers(
        []
      );

      setSelectedUserID(
        null
      );

      setIsLoading(
        false
      );

      setIsRefreshing(
        false
      );

      setErrorMessage(
        null
      );

      setSuccessMessage(
        null
      );

      setLastRefreshedAt(
        null
      );

      return () => {
        isMountedRef.current =
          false;
      };
    }

    if (
      !normalizedBusinessID
    ) {
      setUsers(
        []
      );

      setSelectedUserID(
        null
      );

      setIsLoading(
        false
      );

      setErrorMessage(
        "A Business ID is required to manage App Users."
      );

      return () => {
        isMountedRef.current =
          false;
      };
    }

    if (
      !actorFirebaseUID
    ) {
      setUsers(
        []
      );

      setIsLoading(
        false
      );

      setErrorMessage(
        "The current administrator identity could not be verified."
      );

      return () => {
        isMountedRef.current =
          false;
      };
    }

    setIsLoading(
      true
    );

    setErrorMessage(
      null
    );

    let unsubscribe:
      (() => void) | undefined;

    if (
      usesRealtimeListeners
    ) {
      try {
        unsubscribe =
          subscribeToBusinessAppUsers(
            actorRef.current,
            normalizedBusinessID,
            {
              onUsers:
                (
                  loadedUsers
                ) => {
                  if (
                    !isMountedRef.current
                  ) {
                    return;
                  }

                  setUsers(
                    loadedUsers
                  );

                  setIsLoading(
                    false
                  );

                  setIsRefreshing(
                    false
                  );

                  setLastRefreshedAt(
                    new Date()
                  );
                },

              onError:
                (
                  error
                ) => {
                  if (
                    !isMountedRef.current
                  ) {
                    return;
                  }

                  setIsLoading(
                    false
                  );

                  setIsRefreshing(
                    false
                  );

                  registerErrorRef.current(
                    error,
                    "Unable to synchronize App Users."
                  );
                },
            }
          );
      } catch (
        error: unknown
      ) {
        registerErrorRef.current(
          error,
          "Unable to start App User synchronization."
        );

        void refreshRef.current()
          .catch(() => {
            /*
             * refresh stores the error.
             */
          });
      }
    } else {
      void refreshRef.current()
        .catch(() => {
          /*
           * refresh stores the error.
           */
        });
    }

    return () => {
      isMountedRef.current =
        false;

      unsubscribe?.();
    };
  }, [
    enabled,
    normalizedBusinessID,
    actorFirebaseUID,
    actorBusinessID,
    actorIsActive,
    actorIsBusinessOwner,
    actorIsPlatformAdministrator,
    actorCanManageAppUsers,
    usesRealtimeListeners,
  ]);

  // ==========================================================
  // MARK: - Keep Selection Valid
  // ==========================================================

  useEffect(() => {
    if (
      !selectedUserID
    ) {
      return;
    }

    const stillExists =
      users.some(
        (
          user
        ) =>
          user.id ===
          selectedUserID
      );

    if (
      !stillExists
    ) {
      setSelectedUserID(
        null
      );
    }
  }, [
    selectedUserID,
    users,
  ]);

  // ==========================================================
  // MARK: - Shared Mutation Executor
  // ==========================================================

  const executeMutation =
    useCallback(
      async <Result,>(
        mutation:
          () => Promise<Result>,
        fallbackError:
          string,
        successMessageText?:
          string
      ): Promise<Result> => {
        beginMutation();

        try {
          const result =
            await mutation();

          if (
            !usesRealtimeListeners
          ) {
            await refreshRef.current();
          } else if (
            isMountedRef.current
          ) {
            setLastRefreshedAt(
              new Date()
            );
          }

          if (
            successMessageText
          ) {
            registerSuccess(
              successMessageText
            );
          }

          return result;
        } catch (
          error: unknown
        ) {
          registerError(
            error,
            fallbackError
          );

          throw error;
        } finally {
          finishMutation();
        }
      },
      [
        beginMutation,
        finishMutation,
        registerError,
        registerSuccess,
        usesRealtimeListeners,
      ]
    );

  // ==========================================================
  // MARK: - Create User
  // ==========================================================

  const createUser =
    useCallback(
      async (
        input:
          CreateAppUserFormInput
      ): Promise<AppUserRecord> => {
        const role =
          input.role ??
          DEFAULT_ROLE;

        const createInput:
          CreateBusinessAppUserInput = {
            username:
              cleanText(
                input.username
              ).toLowerCase(),

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

            role,

            isActive:
              input.isActive ??
              true,

            profileImageURL:
              cleanText(
                input.profileImageURL
              ),

            firebaseUID:
              "",

            businessID:
              normalizedBusinessID,

            ownerUID:
              actorRef.current
                .isBusinessOwner
                ? actorRef.current
                    .firebaseUID
                : actorRef.current
                    .firebaseUID,

            businessName:
              "",

            isBusinessOwner:
              false,

            isPlatformAdministrator:
              false,

            permissions:
              input.permissions ??
              defaultPermissionsForRole(
                role
              ),

            enabledModules:
              normalizeStringArray(
                input.enabledModules
              ),

            disabledModules:
              normalizeStringArray(
                input.disabledModules
              ),

            temporaryPassword:
              cleanText(
                input.temporaryPassword
              ) ||
              undefined,

            createAuthenticationAccount:
              input
                .createAuthenticationAccount,

            sendWelcomeEmail:
              input
                .sendWelcomeEmail,
          };

        return executeMutation(
          () =>
            createBusinessAppUser(
              actorRef.current,
              createInput
            ),

          "Unable to create the App User.",

          `${cleanText(
            input.fullName
          ) || "App User"} was created successfully.`
        );
      },
      [
        executeMutation,
        normalizedBusinessID,
      ]
    );

  // ==========================================================
  // MARK: - Update User
  // ==========================================================

  const updateUser =
    useCallback(
      async (
        target:
          AppUserRecord,
        input:
          UpdateAppUserFormInput
      ): Promise<AppUserRecord> => {
        const updateInput:
          UpdateBusinessAppUserInput = {
            username:
              input.username !==
              undefined
                ? cleanText(
                    input.username
                  ).toLowerCase()
                : undefined,

            fullName:
              input.fullName !==
              undefined
                ? cleanText(
                    input.fullName
                  )
                : undefined,

            email:
              input.email !==
              undefined
                ? normalizeEmail(
                    input.email
                  )
                : undefined,

            phone:
              input.phone !==
              undefined
                ? cleanText(
                    input.phone
                  )
                : undefined,

            addressLine1:
              input.addressLine1 !==
              undefined
                ? cleanText(
                    input.addressLine1
                  )
                : undefined,

            addressLine2:
              input.addressLine2 !==
              undefined
                ? cleanText(
                    input.addressLine2
                  )
                : undefined,

            role:
              input.role,

            isActive:
              input.isActive,

            profileImageURL:
              input.profileImageURL !==
              undefined
                ? cleanText(
                    input.profileImageURL
                  )
                : undefined,

            permissions:
              input.permissions,

            enabledModules:
              input.enabledModules !==
              undefined
                ? normalizeStringArray(
                    input.enabledModules
                  )
                : undefined,

            disabledModules:
              input.disabledModules !==
              undefined
                ? normalizeStringArray(
                    input.disabledModules
                  )
                : undefined,
          };

        return executeMutation(
          () =>
            updateBusinessAppUser(
              actorRef.current,
              target,
              updateInput
            ),

          "Unable to update the App User.",

          `${appUserDisplayName(
            target
          )} was updated successfully.`
        );
      },
      [
        executeMutation,
      ]
    );

  // ==========================================================
  // MARK: - Role, Permission and Module Access
  // ==========================================================

  const updateUserAccess =
    useCallback(
      async (
        target:
          AppUserRecord,
        input:
          UpdateAppUserAccessInput
      ): Promise<AppUserRecord> => {
        return executeMutation(
          () =>
            updateBusinessAppUserAccess(
              actorRef.current,
              target,
              {
                role:
                  input.role,

                permissions:
                  input.permissions,

                enabledModules:
                  normalizeStringArray(
                    input.enabledModules
                  ),

                disabledModules:
                  normalizeStringArray(
                    input.disabledModules
                  ),
              }
            ),

          "Unable to update this user's role and access.",

          `${appUserDisplayName(
            target
          )}'s access was updated.`
        );
      },
      [
        executeMutation,
      ]
    );

  const changeUserRole =
    useCallback(
      async (
        target:
          AppUserRecord,
        role:
          AppUserRole,
        preserveCustomPermissions =
          false
      ): Promise<AppUserRecord> => {
        const updatedUser =
          appUserWithRole(
            target,
            role,
            preserveCustomPermissions
          );

        return updateUserAccess(
          target,
          {
            role:
              updatedUser.roleRawValue,

            permissions:
              updatedUser,

            enabledModules:
              updatedUser.enabledModules,

            disabledModules:
              updatedUser.disabledModules,
          }
        );
      },
      [
        updateUserAccess,
      ]
    );

  const updateUserPermissions =
    useCallback(
      async (
        target:
          AppUserRecord,
        permissions:
          Partial<AppUserPermissions>
      ): Promise<void> => {
        await executeMutation(
          () =>
            updateAppUserPermissions(
              actorRef.current,
              target,
              permissions
            ),

          "Unable to update the user's permissions.",

          `${appUserDisplayName(
            target
          )}'s permissions were updated.`
        );
      },
      [
        executeMutation,
      ]
    );

  const updateUserModules =
    useCallback(
      async (
        target:
          AppUserRecord,
        enabledModules:
          readonly string[],
        disabledModules:
          readonly string[]
      ): Promise<void> => {
        await executeMutation(
          () =>
            updateAppUserModules(
              actorRef.current,
              target,
              normalizeStringArray(
                enabledModules
              ),
              normalizeStringArray(
                disabledModules
              )
            ),

          "Unable to update the user's modules.",

          `${appUserDisplayName(
            target
          )}'s modules were updated.`
        );
      },
      [
        executeMutation,
      ]
    );

  // ==========================================================
  // MARK: - Activation
  // ==========================================================

  const activateUser =
    useCallback(
      async (
        target:
          AppUserRecord
      ): Promise<void> => {
        await executeMutation(
          () =>
            setBusinessAppUserActive(
              actorRef.current,
              target,
              true
            ),

          "Unable to activate the App User.",

          `${appUserDisplayName(
            target
          )} was activated.`
        );
      },
      [
        executeMutation,
      ]
    );

  const deactivateUser =
    useCallback(
      async (
        target:
          AppUserRecord
      ): Promise<void> => {
        await executeMutation(
          () =>
            setBusinessAppUserActive(
              actorRef.current,
              target,
              false
            ),

          "Unable to deactivate the App User.",

          `${appUserDisplayName(
            target
          )} was deactivated.`
        );
      },
      [
        executeMutation,
      ]
    );

  // ==========================================================
  // MARK: - Authentication Administration
  // ==========================================================

  const sendPasswordReset =
    useCallback(
      async (
        target:
          AppUserRecord
      ): Promise<void> => {
        if (
          !normalizeEmail(
            target.email
          )
        ) {
          throw new Error(
            "This App User does not have an email address."
          );
        }

        if (
          !cleanText(
            target.firebaseUID
          )
        ) {
          throw new Error(
            "This App User does not have a Firebase Authentication account."
          );
        }

        await executeMutation(
          () =>
            sendAppUserPasswordReset({
              businessID:
                target.businessID,

              targetFirebaseUID:
                target.firebaseUID,

              email:
                target.email,
            }),

          "Unable to send the password reset.",

          `A password reset was sent to ${target.email}.`
        );
      },
      [
        executeMutation,
      ]
    );

  const setTemporaryPassword =
    useCallback(
      async (
        target:
          AppUserRecord,
        temporaryPassword:
          string
      ): Promise<void> => {
        const normalizedPassword =
          temporaryPassword;

        if (
          normalizedPassword.length <
          8
        ) {
          throw new Error(
            "The temporary password must contain at least 8 characters."
          );
        }

        if (
          !cleanText(
            target.firebaseUID
          )
        ) {
          throw new Error(
            "This App User does not have a Firebase Authentication account."
          );
        }

        await executeMutation(
          () =>
            setAppUserTemporaryPassword({
              businessID:
                target.businessID,

              targetFirebaseUID:
                target.firebaseUID,

              temporaryPassword:
                normalizedPassword,
            }),

          "Unable to set the temporary password.",

          `A temporary password was set for ${appUserDisplayName(
            target
          )}.`
        );
      },
      [
        executeMutation,
      ]
    );

  const updateAuthenticationEmail =
    useCallback(
      async (
        target:
          AppUserRecord,
        newEmail:
          string
      ): Promise<void> => {
        const normalizedNewEmail =
          normalizeEmail(
            newEmail
          );

        if (
          !normalizedNewEmail
        ) {
          throw new Error(
            "A valid email address is required."
          );
        }

        if (
          !cleanText(
            target.firebaseUID
          )
        ) {
          throw new Error(
            "This App User does not have a Firebase Authentication account."
          );
        }

        await executeMutation(
          async () => {
            await updateAppUserAuthenticationEmail({
              businessID:
                target.businessID,

              targetFirebaseUID:
                target.firebaseUID,

              newEmail:
                normalizedNewEmail,
            });

            await updateBusinessAppUser(
              actorRef.current,
              target,
              {
                email:
                  normalizedNewEmail,
              }
            );
          },

          "Unable to update the authentication email.",

          `${appUserDisplayName(
            target
          )}'s email was updated.`
        );
      },
      [
        executeMutation,
      ]
    );

  const enableAuthentication =
    useCallback(
      async (
        target:
          AppUserRecord
      ): Promise<void> => {
        if (
          !cleanText(
            target.firebaseUID
          )
        ) {
          throw new Error(
            "This App User does not have a Firebase Authentication account."
          );
        }

        await executeMutation(
          () =>
            setAppUserAuthenticationDisabled({
              businessID:
                target.businessID,

              targetFirebaseUID:
                target.firebaseUID,

              disabled:
                false,
            }),

          "Unable to enable the authentication account.",

          `${appUserDisplayName(
            target
          )}'s login was enabled.`
        );
      },
      [
        executeMutation,
      ]
    );

  const disableAuthentication =
    useCallback(
      async (
        target:
          AppUserRecord
      ): Promise<void> => {
        if (
          target.isBusinessOwner
        ) {
          throw new Error(
            "The primary Business Owner login cannot be disabled."
          );
        }

        if (
          !cleanText(
            target.firebaseUID
          )
        ) {
          throw new Error(
            "This App User does not have a Firebase Authentication account."
          );
        }

        await executeMutation(
          () =>
            setAppUserAuthenticationDisabled({
              businessID:
                target.businessID,

              targetFirebaseUID:
                target.firebaseUID,

              disabled:
                true,
            }),

          "Unable to disable the authentication account.",

          `${appUserDisplayName(
            target
          )}'s login was disabled.`
        );
      },
      [
        executeMutation,
      ]
    );

  // ==========================================================
  // MARK: - Delete User
  // ==========================================================

  const deleteUser =
    useCallback(
      async (
        target:
          AppUserRecord,
        deleteAuthenticationAccount =
          true
      ): Promise<void> => {
        await executeMutation(
          () =>
            deleteBusinessAppUser(
              actorRef.current,
              target,
              {
                deleteAuthenticationAccount,
              }
            ),

          "Unable to delete the App User.",

          `${appUserDisplayName(
            target
          )} was deleted.`
        );

        if (
          selectedUserID ===
          target.id
        ) {
          setSelectedUserID(
            null
          );
        }
      },
      [
        executeMutation,
        selectedUserID,
      ]
    );

  // ==========================================================
  // MARK: - Result
  // ==========================================================

  return {
    users,
    filteredUsers,

    selectedUser,

    metrics,

    searchText,
    setSearchText,

    filter,
    setFilter,

    sortField,
    setSortField,

    sortDirection,
    setSortDirection,

    isLoading,
    isRefreshing,
    isMutating,

    errorMessage,
    successMessage,

    lastRefreshedAt,

    selectUser,
    selectUserByID,
    closeSelectedUser,

    refresh,

    clearError,
    clearSuccess,

    createUser,
    updateUser,

    updateUserAccess,
    changeUserRole,

    updateUserPermissions,
    updateUserModules,

    activateUser,
    deactivateUser,

    sendPasswordReset,
    setTemporaryPassword,
    updateAuthenticationEmail,

    enableAuthentication,
    disableAuthentication,

    deleteUser,
  };
}

export default
  useAppUsers;