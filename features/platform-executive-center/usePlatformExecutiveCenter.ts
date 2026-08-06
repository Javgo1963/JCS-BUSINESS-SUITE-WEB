"use client";

/*
 * JCS Business Suite
 * usePlatformExecutiveCenter.ts
 *
 * Central state and action controller for:
 *
 * - Platform Executive Center
 * - Platform Clients
 * - Business Owner invitations
 * - Subscription administration
 * - Platform access administration
 * - Archive and protected deletion workflows
 *
 * UI components should not communicate directly with Firestore.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createPlatformExecutiveAttentionItems,
  createPlatformExecutiveMetrics,
  queryPlatformClients,
} from "./PlatformClientDomain";

import {
  archivePlatformClient,
  cancelPlatformClientDeletionRequest,
  disablePlatformOwnerAccess,
  enablePlatformOwnerAccess,
  fetchPlatformClients,
  fetchPlatformOwnerInvitations,
  requestPlatformClientDeletion,
  restorePlatformClientFromArchive,
  setPlatformClientActivation,
  subscribeToPlatformClients,
  subscribeToPlatformOwnerInvitations,
  type PlatformExecutiveActor,
} from "./PlatformExecutiveFirestoreService";

import type {
  PlatformClientFilter,
  PlatformClientViewModel,
  PlatformExecutiveAttentionItem,
  PlatformExecutiveMetrics,
  PlatformOwnerInvitationRecord,
} from "./PlatformExecutiveTypes";

// ============================================================
// MARK: - Public Options
// ============================================================

export interface UsePlatformExecutiveCenterOptions {
  enabled: boolean;

  actor:
    PlatformExecutiveActor;

  /**
   * Uses Firestore live listeners when true.
   *
   * When false, data is loaded using direct Firestore reads.
   */
  usesRealtimeListeners?: boolean;
}

// ============================================================
// MARK: - Public Result
// ============================================================

export interface UsePlatformExecutiveCenterResult {
  // Raw and Presentation Data

  clients:
    PlatformClientViewModel[];

  filteredClients:
    PlatformClientViewModel[];

  invitations:
    PlatformOwnerInvitationRecord[];

  attentionItems:
    PlatformExecutiveAttentionItem[];

  metrics:
    PlatformExecutiveMetrics;

  // Search and Filtering

  searchText:
    string;

  setSearchText:
    (
      value: string
    ) => void;

  clientFilter:
    PlatformClientFilter;

  setClientFilter:
    (
      value:
        PlatformClientFilter
    ) => void;

  // Selection

  selectedClient:
    PlatformClientViewModel | null;

  selectClient:
    (
      client:
        PlatformClientViewModel
    ) => void;

  selectClientByBusinessID:
    (
      businessID: string
    ) => void;

  closeSelectedClient:
    () => void;

  // Loading and Synchronization

  isLoading:
    boolean;

  isRefreshing:
    boolean;

  isMutating:
    boolean;

  errorMessage:
    string | null;

  lastRefreshedAt:
    Date | null;

  refresh:
    () => Promise<void>;

  clearError:
    () => void;

  // Business Lifecycle

  activateClient:
    (
      businessID: string
    ) => Promise<void>;

  deactivateClient:
    (
      businessID: string
    ) => Promise<void>;

  archiveClient:
    (
      businessID: string
    ) => Promise<void>;

  restoreClient:
    (
      businessID: string
    ) => Promise<void>;

  requestDeletion:
    (
      businessID: string
    ) => Promise<void>;

  cancelDeletion:
    (
      businessID: string
    ) => Promise<void>;

  // Owner Access

  enableOwnerAccess:
    (
      businessID: string
    ) => Promise<void>;

  disableOwnerAccess:
    (
      businessID: string,
      reason?: string
    ) => Promise<void>;
}

// ============================================================
// MARK: - Stable Empty Metrics
// ============================================================

const EMPTY_METRICS:
  PlatformExecutiveMetrics = {
    totalBusinesses: 0,
    activeBusinesses: 0,

    activeSubscriptions: 0,
    payingBusinesses: 0,

    activeTrials: 0,
    expiredTrials: 0,

    restrictedAccess: 0,
    accessEnabledCount: 0,
    accessPercentage: 0,

    registeredOwners: 0,
    pendingOwnerInvitations: 0,

    onboardingComplete: 0,


    businessesNeedingAttention: 0,

    monthlyRevenue: 0,
    averageMonthlyRevenue: 0,
  };

// ============================================================
// MARK: - Internal Helpers
// ============================================================

function cleanText(
  value:
    | string
    | null
    | undefined
): string {
  return value?.trim() ?? "";
}

function normalizeError(
  error: unknown,
  fallback: string
): string {
  if (
    error instanceof Error &&
    cleanText(
      error.message
    )
  ) {
    return error.message;
  }

  if (
    typeof error ===
      "string" &&
    cleanText(
      error
    )
  ) {
    return error;
  }

  return fallback;
}

function assertPlatformAdministrator(
  actor:
    PlatformExecutiveActor
): void {
  if (
    !actor
      .isPlatformAdministrator
  ) {
    throw new Error(
      "Platform Administrator access is required."
    );
  }

  const firebaseUID =
    cleanText(
      actor.firebaseUID
    );

  if (!firebaseUID) {
    throw new Error(
      "The Platform Administrator Firebase UID is not available."
    );
  }
}

function assertBusinessID(
  businessID: string
): string {
  const normalizedBusinessID =
    cleanText(
      businessID
    );

  if (
    !normalizedBusinessID
  ) {
    throw new Error(
      "A valid Business ID is required."
    );
  }

  return normalizedBusinessID;
}

function invitationSortTime(
  invitation:
    PlatformOwnerInvitationRecord
): number {
  if (
    invitation.createdAt
    instanceof Date
  ) {
    return invitation
      .createdAt
      .getTime();
  }

  return 0;
}

function sortInvitations(
  invitations:
    PlatformOwnerInvitationRecord[]
):
  PlatformOwnerInvitationRecord[] {
  return [
    ...invitations,
  ].sort(
    (
      first,
      second
    ) =>
      invitationSortTime(
        second
      ) -
      invitationSortTime(
        first
      )
  );
}

// ============================================================
// MARK: - Hook
// ============================================================

export function usePlatformExecutiveCenter({
  enabled,
  actor,
  usesRealtimeListeners = true,
}: UsePlatformExecutiveCenterOptions):
  UsePlatformExecutiveCenterResult {

  // ==========================================================
  // MARK: - Firestore State
  // ==========================================================

  const [
    clients,
    setClients,
  ] = useState<
    PlatformClientViewModel[]
  >([]);

  const [
    invitations,
    setInvitations,
  ] = useState<
    PlatformOwnerInvitationRecord[]
  >([]);

  // ==========================================================
  // MARK: - Presentation State
  // ==========================================================

  const [
    searchText,
    setSearchTextState,
  ] = useState("");

  const [
    clientFilter,
    setClientFilterState,
  ] = useState<
    PlatformClientFilter
  >("all");

  const [
    selectedBusinessID,
    setSelectedBusinessID,
  ] = useState<
    string | null
  >(null);

  // ==========================================================
  // MARK: - Request State
  // ==========================================================

  const [
    isLoading,
    setIsLoading,
  ] = useState(
    enabled
  );

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    mutationCount,
    setMutationCount,
  ] = useState(0);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<
    string | null
  >(null);

  const [
    lastRefreshedAt,
    setLastRefreshedAt,
  ] = useState<
    Date | null
  >(null);

  // ==========================================================
  // MARK: - Lifecycle References
  // ==========================================================

  const isMountedRef =
    useRef(true);

  const activeRefreshIDRef =
    useRef(0);

  const actorFirebaseUID =
    cleanText(
      actor.firebaseUID
    );

  const actorIsPlatformAdministrator =
    Boolean(
      actor
        .isPlatformAdministrator
    );

  // ==========================================================
  // MARK: - Safe State Helpers
  // ==========================================================

  const clearError =
    useCallback(() => {
      if (
        isMountedRef.current
      ) {
        setErrorMessage(
          null
        );
      }
    }, []);

  const registerError =
    useCallback(
      (
        error: unknown,
        fallback: string
      ): void => {
        if (
          !isMountedRef.current
        ) {
          return;
        }

        setErrorMessage(
          normalizeError(
            error,
            fallback
          )
        );
      },
      []
    );

  const beginMutation =
    useCallback(() => {
      if (
        !isMountedRef.current
      ) {
        return;
      }

      setMutationCount(
        (current) =>
          current + 1
      );
    }, []);

  const finishMutation =
    useCallback(() => {
      if (
        !isMountedRef.current
      ) {
        return;
      }

      setMutationCount(
        (current) =>
          Math.max(
            0,
            current - 1
          )
      );
    }, []);

  // ==========================================================
  // MARK: - Derived Client Data
  // ==========================================================

  const filteredClients =
  useMemo<
    PlatformClientViewModel[]
  >(
    () =>
      queryPlatformClients(
        clients,
        {
          searchText,

          filter:
            clientFilter,

          sortField:
            "businessName",

          sortDirection:
            "ascending",
        }
      ),
    [
      clients,
      clientFilter,
      searchText,
    ]
  );

  const attentionItems =
    useMemo<
      PlatformExecutiveAttentionItem[]
    >(
      () =>
        createPlatformExecutiveAttentionItems(
          clients
        ),
      [
        clients,
      ]
    );

  const metrics =
    useMemo<
      PlatformExecutiveMetrics
    >(
      () => {
        if (
          clients.length ===
            0 &&
          invitations.length ===
            0
        ) {
          return {
            ...EMPTY_METRICS,
          };
        }

        return createPlatformExecutiveMetrics(
          clients,
          invitations
        );
      },
      [
        clients,
        invitations,
      ]
    );

  const selectedClient =
    useMemo<
      PlatformClientViewModel | null
    >(
      () => {
        if (
          !selectedBusinessID
        ) {
          return null;
        }

        return (
          clients.find(
            (
              client
            ) =>
              client.businessID ===
              selectedBusinessID
          ) ??
          null
        );
      },
      [
        clients,
        selectedBusinessID,
      ]
    );

  const isMutating =
    mutationCount > 0;

  // ==========================================================
  // MARK: - Search and Filter
  // ==========================================================

  const setSearchText =
    useCallback(
      (
        value: string
      ) => {
        setSearchTextState(
          value
        );
      },
      []
    );

  const setClientFilter =
    useCallback(
      (
        value:
          PlatformClientFilter
      ) => {
        setClientFilterState(
          value
        );
      },
      []
    );

  // ==========================================================
  // MARK: - Selection
  // ==========================================================

  const selectClient =
    useCallback(
      (
        client:
          PlatformClientViewModel
      ) => {
        const businessID =
          cleanText(
            client.businessID
          );

        if (!businessID) {
          return;
        }

        setSelectedBusinessID(
          businessID
        );
      },
      []
    );

  const selectClientByBusinessID =
    useCallback(
      (
        businessID: string
      ) => {
        const normalizedBusinessID =
          cleanText(
            businessID
          );

        if (
          !normalizedBusinessID
        ) {
          return;
        }

        setSelectedBusinessID(
          normalizedBusinessID
        );
      },
      []
    );

  const closeSelectedClient =
    useCallback(() => {
      setSelectedBusinessID(
        null
      );
    }, []);

  // ==========================================================
  // MARK: - Direct Refresh
  // ==========================================================

  const refresh =
    useCallback(
      async (): Promise<void> => {
        if (!enabled) {
          if (
            isMountedRef.current
          ) {
            setClients(
              []
            );

            setInvitations(
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

        assertPlatformAdministrator(
          actor
        );

        const refreshID =
          activeRefreshIDRef
            .current + 1;

        activeRefreshIDRef.current =
          refreshID;

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
          const [
            loadedClients,
            loadedInvitations,
          ] =
            await Promise.all([
              fetchPlatformClients(
                actor
              ),

              fetchPlatformOwnerInvitations(
                actor
              ),
            ]);

          if (
            !isMountedRef.current ||
            activeRefreshIDRef
              .current !==
              refreshID
          ) {
            return;
          }

          setClients(
            loadedClients
          );

          setInvitations(
            sortInvitations(
              loadedInvitations
            )
          );

          setLastRefreshedAt(
            new Date()
          );
        } catch (
          error: unknown
        ) {
          if (
            !isMountedRef.current ||
            activeRefreshIDRef
              .current !==
              refreshID
          ) {
            return;
          }

          registerError(
            error,
            "Unable to load Platform Executive Center data."
          );

          throw error;
        } finally {
          if (
            isMountedRef.current &&
            activeRefreshIDRef
              .current ===
              refreshID
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
        actor,
        enabled,
        registerError,
      ]
    );

    const actorRef =
  useRef(
    actor
  );

const refreshRef =
  useRef(
    refresh
  );

const registerErrorRef =
  useRef(
    registerError
  );

useEffect(() => {
  actorRef.current =
    actor;
}, [
  actor,
]);

useEffect(() => {
  refreshRef.current =
    refresh;
}, [
  refresh,
]);

useEffect(() => {
  registerErrorRef.current =
    registerError;
}, [
  registerError,
]);

  // ==========================================================
  // MARK: - Initial Load and Live Listeners
  // ==========================================================

  useEffect(() => {
  isMountedRef.current =
    true;

  if (!enabled) {
    setClients(
      []
    );

    setInvitations(
      []
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

    setLastRefreshedAt(
      null
    );

    setSelectedBusinessID(
      null
    );

    return () => {
      isMountedRef.current =
        false;
    };
  }

  if (
    !actorIsPlatformAdministrator ||
    !actorFirebaseUID
  ) {
    setClients(
      []
    );

    setInvitations(
      []
    );

    setIsLoading(
      false
    );

    setIsRefreshing(
      false
    );

    setErrorMessage(
      "Platform Administrator access could not be verified."
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

  let unsubscribeClients:
    (() => void) | undefined;

  let unsubscribeInvitations:
    (() => void) | undefined;

  let clientListenerReady =
    false;

  let invitationListenerReady =
    false;

  const completeInitialLoading =
    (): void => {
      if (
        !isMountedRef.current
      ) {
        return;
      }

      if (
        clientListenerReady &&
        invitationListenerReady
      ) {
        setIsLoading(
          false
        );

        setLastRefreshedAt(
          new Date()
        );
      }
    };

  const loadWithListeners =
    (): void => {
      try {
        unsubscribeClients =
          subscribeToPlatformClients(
            actorRef.current,
            {
              onClients:
                (
                  loadedClients
                ) => {
                  if (
                    !isMountedRef.current
                  ) {
                    return;
                  }

                  setClients(
                    loadedClients
                  );

                  clientListenerReady =
                    true;

                  setLastRefreshedAt(
                    new Date()
                  );

                  completeInitialLoading();
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

                  clientListenerReady =
                    true;

                  registerErrorRef.current(
                    error,
                    "Unable to synchronize Platform Clients."
                  );

                  completeInitialLoading();
                },
            }
          );

        unsubscribeInvitations =
          subscribeToPlatformOwnerInvitations(
            actorRef.current,
            {
              onInvitations:
                (
                  loadedInvitations
                ) => {
                  if (
                    !isMountedRef.current
                  ) {
                    return;
                  }

                  setInvitations(
                    sortInvitations(
                      loadedInvitations
                    )
                  );

                  invitationListenerReady =
                    true;

                  setLastRefreshedAt(
                    new Date()
                  );

                  completeInitialLoading();
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

                  invitationListenerReady =
                    true;

                  registerErrorRef.current(
                    error,
                    "Unable to synchronize Business Owner invitations."
                  );

                  completeInitialLoading();
                },
            }
          );
      } catch (
        error: unknown
      ) {
        registerErrorRef.current(
          error,
          "Unable to start Platform Executive Center synchronization."
        );

        void refreshRef.current()
          .catch(() => {
            /*
             * The refresh function already stores
             * the appropriate error message.
             */
          });
      }
    };

  if (
    usesRealtimeListeners
  ) {
    loadWithListeners();
  } else {
    void refreshRef.current()
      .catch(() => {
        /*
         * The refresh function already stores
         * the appropriate error message.
         */
      });
  }

  return () => {
    isMountedRef.current =
      false;

    unsubscribeClients?.();
    unsubscribeInvitations?.();
  };
}, [
  actorFirebaseUID,
  actorIsPlatformAdministrator,
  enabled,
  usesRealtimeListeners,
]);

  // ==========================================================
  // MARK: - Keep Selection Valid
  // ==========================================================

  useEffect(() => {
    if (
      !selectedBusinessID
    ) {
      return;
    }

    const stillExists =
      clients.some(
        (
          client
        ) =>
          client.businessID ===
          selectedBusinessID
      );

    if (!stillExists) {
      setSelectedBusinessID(
        null
      );
    }
  }, [
    clients,
    selectedBusinessID,
  ]);

  // ==========================================================
  // MARK: - Shared Mutation Executor
  // ==========================================================

  const executeMutation =
    useCallback(
      async (
        mutation:
          () => Promise<unknown>,
        fallbackError:
          string
      ): Promise<void> => {
        assertPlatformAdministrator(
          actor
        );

        beginMutation();
        clearError();

        try {
          await mutation();

          /*
           * Firestore listeners update local state automatically
           * when realtime synchronization is enabled.
           */
          if (
            !usesRealtimeListeners
          ) {
            await refresh();
          } else if (
            isMountedRef.current
          ) {
            setLastRefreshedAt(
              new Date()
            );
          }
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
        actor,
        beginMutation,
        clearError,
        finishMutation,
        refresh,
        registerError,
        usesRealtimeListeners,
      ]
    );

  // ==========================================================
  // MARK: - Business Activation
  // ==========================================================

  const activateClient =
    useCallback(
      async (
        businessID: string
      ): Promise<void> => {
        const normalizedBusinessID =
          assertBusinessID(
            businessID
          );

        await executeMutation(
          () =>
            setPlatformClientActivation(
              actor,
              normalizedBusinessID,
              true
            ),

          "Unable to activate the selected business."
        );
      },
      [
        actor,
        executeMutation,
      ]
    );

  const deactivateClient =
    useCallback(
      async (
        businessID: string
      ): Promise<void> => {
        const normalizedBusinessID =
          assertBusinessID(
            businessID
          );

        await executeMutation(
          () =>
            setPlatformClientActivation(
              actor,
              normalizedBusinessID,
              false
            ),

          "Unable to deactivate the selected business."
        );
      },
      [
        actor,
        executeMutation,
      ]
    );

  // ==========================================================
  // MARK: - Archive
  // ==========================================================

  const archiveClient =
    useCallback(
      async (
        businessID: string
      ): Promise<void> => {
        const normalizedBusinessID =
          assertBusinessID(
            businessID
          );

        await executeMutation(
          () =>
            archivePlatformClient(
              actor,
              normalizedBusinessID
            ),

          "Unable to archive the selected business."
        );
      },
      [
        actor,
        executeMutation,
      ]
    );

  const restoreClient =
    useCallback(
      async (
        businessID: string
      ): Promise<void> => {
        const normalizedBusinessID =
          assertBusinessID(
            businessID
          );

        await executeMutation(
          () =>
            restorePlatformClientFromArchive(
              actor,
              normalizedBusinessID
            ),

          "Unable to restore the selected business."
        );
      },
      [
        actor,
        executeMutation,
      ]
    );

  // ==========================================================
  // MARK: - Protected Deletion
  // ==========================================================

  const requestDeletion =
    useCallback(
      async (
        businessID: string
      ): Promise<void> => {
        const normalizedBusinessID =
          assertBusinessID(
            businessID
          );

        await executeMutation(
          () =>
            requestPlatformClientDeletion(
              actor,
              normalizedBusinessID
            ),

          "Unable to start the protected deletion workflow."
        );
      },
      [
        actor,
        executeMutation,
      ]
    );

  const cancelDeletion =
    useCallback(
      async (
        businessID: string
      ): Promise<void> => {
        const normalizedBusinessID =
          assertBusinessID(
            businessID
          );

        await executeMutation(
          () =>
            cancelPlatformClientDeletionRequest(
              actor,
              normalizedBusinessID
            ),

          "Unable to cancel the protected deletion request."
        );
      },
      [
        actor,
        executeMutation,
      ]
    );

  // ==========================================================
  // MARK: - Owner Access
  // ==========================================================

  const enableOwnerAccess =
    useCallback(
      async (
        businessID: string
      ): Promise<void> => {
        const normalizedBusinessID =
          assertBusinessID(
            businessID
          );

        await executeMutation(
          () =>
            enablePlatformOwnerAccess(
              actor,
              normalizedBusinessID
            ),

          "Unable to enable Business Owner access."
        );
      },
      [
        actor,
        executeMutation,
      ]
    );

  const disableOwnerAccess =
    useCallback(
      async (
        businessID: string,
        reason =
          "Disabled by Platform Administration"
      ): Promise<void> => {
        const normalizedBusinessID =
          assertBusinessID(
            businessID
          );

        const normalizedReason =
          cleanText(
            reason
          ) ||
          "Disabled by Platform Administration";

        await executeMutation(
          () =>
            disablePlatformOwnerAccess(
              actor,
              normalizedBusinessID,
              {
                reason:
                  normalizedReason,
              }
            ),

          "Unable to disable Business Owner access."
        );
      },
      [
        actor,
        executeMutation,
      ]
    );

  // ==========================================================
  // MARK: - Result
  // ==========================================================

  return {
    clients,
    filteredClients,

    invitations,
    attentionItems,
    metrics,

    searchText,
    setSearchText,

    clientFilter,
    setClientFilter,

    selectedClient,
    selectClient,
    selectClientByBusinessID,
    closeSelectedClient,

    isLoading,
    isRefreshing,
    isMutating,

    errorMessage,
    lastRefreshedAt,

    refresh,
    clearError,

    activateClient,
    deactivateClient,

    archiveClient,
    restoreClient,

    requestDeletion,
    cancelDeletion,

    enableOwnerAccess,
    disableOwnerAccess,
  };
}

export default
  usePlatformExecutiveCenter;