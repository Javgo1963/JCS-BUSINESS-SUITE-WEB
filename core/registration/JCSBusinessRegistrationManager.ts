/**
 * ==============================================================
 * JCS BUSINESS SUITE WEB
 * JCSBusinessRegistrationManager.ts
 * --------------------------------------------------------------
 * Central coordinator for the Business Registration Engine.
 *
 * Responsibilities:
 * - Prevent simultaneous registration operations.
 * - Validate the minimum registration information.
 * - Coordinate the configured registration executor.
 * - Publish registration progress.
 * - Support cancellation through AbortController.
 * - Prevent stale progress updates.
 * - Preserve separation between business logic and infrastructure.
 *
 * This manager does not communicate directly with:
 * - Firebase Authentication
 * - Firestore
 * - Firebase Storage
 * - Cloud Functions
 * - External APIs
 *
 * Those responsibilities belong to a
 * BusinessRegistrationExecutor implementation.
 * ==============================================================
 */

import type { BusinessRegistrationProgress } from
  "./BusinessRegistrationProgress";

import type { BusinessRegistrationRequest } from
  "./contracts/BusinessRegistrationRequest";

import type { BusinessRegistrationResult } from
  "./contracts/BusinessRegistrationResult";

import type {
  BusinessRegistrationExecutionContext,
  BusinessRegistrationExecutor,
} from "./executors/BusinessRegistrationExecutor";

/**
 * Listener used by views, hooks, stores, or controllers that need
 * to receive registration progress updates.
 */
export type BusinessRegistrationProgressListener = (
  progress: BusinessRegistrationProgress
) => void;

/**
 * Listener used when the manager changes its running state.
 */
export type BusinessRegistrationRunningStateListener = (
  isRunning: boolean
) => void;

/**
 * Minimum runtime fields expected from a registration request.
 *
 * The official request type may contain additional fields.
 * This internal structure is used only for safe runtime validation.
 */
type RegistrationRequestRuntimeShape = {
  businessName?: unknown;
  fullName?: unknown;
  email?: unknown;
  password?: unknown;
  businessCategory?: unknown;
  businessMode?: unknown;
};

/**
 * JCS Business Registration Manager.
 *
 * The manager coordinates the complete registration process while
 * remaining independent from Firebase and other infrastructure.
 */
export class JCSBusinessRegistrationManager {
  /**
   * Infrastructure executor used to perform the actual registration.
   */
  private executor: BusinessRegistrationExecutor;

  /**
   * Active AbortController for the current registration operation.
   */
  private abortController: AbortController | null = null;

  /**
   * Unique identifier for the currently active operation.
   *
   * It prevents delayed progress events from an older execution
   * from modifying the current operation state.
   */
  private activeOperationID: string | null = null;

  /**
   * Most recent progress update published by the executor.
   */
  private currentProgress: BusinessRegistrationProgress | null = null;

  /**
   * Indicates whether a registration operation is currently active.
   */
  private running = false;

  /**
   * Registered progress subscribers.
   */
  private readonly progressListeners =
    new Set<BusinessRegistrationProgressListener>();

  /**
   * Registered running-state subscribers.
   */
  private readonly runningStateListeners =
    new Set<BusinessRegistrationRunningStateListener>();

  /**
   * Creates the registration manager.
   *
   * @param executor Infrastructure implementation that performs
   * the actual registration.
   */
  constructor(executor: BusinessRegistrationExecutor) {
    this.executor = executor;
  }

  /**
   * Replaces the currently configured executor.
   *
   * This is useful for:
   * - Firebase production executor
   * - Test executor
   * - Local development executor
   * - Future migration/import executor
   *
   * The executor cannot be replaced while registration is running.
   */
  setExecutor(executor: BusinessRegistrationExecutor): void {
    if (this.running) {
      throw new Error(
        "The business registration executor cannot be changed " +
          "while registration is running."
      );
    }

    this.executor = executor;
  }

  /**
   * Returns whether a registration operation is active.
   */
  get isRunning(): boolean {
    return this.running;
  }

  /**
   * Returns the most recently published registration progress.
   */
  get progress(): BusinessRegistrationProgress | null {
    return this.currentProgress;
  }

  /**
   * Returns whether the current operation can be cancelled.
   */
  get canCancel(): boolean {
    return Boolean(
      this.running &&
        this.abortController &&
        !this.abortController.signal.aborted &&
        this.currentProgress?.canCancel !== false
    );
  }

  /**
   * Executes the complete business registration process.
   *
   * Only one registration operation may run at a time.
   */
  async register(
    request: BusinessRegistrationRequest
  ): Promise<BusinessRegistrationResult> {
    if (this.running) {
      throw new Error(
        "A business registration operation is already in progress."
      );
    }

    this.validateRequest(request);

    const operationID = this.createOperationID();

    this.activeOperationID = operationID;
    this.abortController = new AbortController();
    this.currentProgress = null;

    this.setRunning(true);

    const executionContext: BusinessRegistrationExecutionContext = {
      signal: this.abortController.signal,

      updateProgress: progress => {
        if (
          this.activeOperationID !== operationID ||
          this.abortController?.signal.aborted
        ) {
          return;
        }

        const completeProgress: BusinessRegistrationProgress = {
          ...progress,
          updatedAt: new Date().toISOString(),
        };

        this.publishProgress(completeProgress);
      },
    };

    try {
      const result = await this.executor.execute(
        request,
        executionContext
      );

      this.throwIfCancelled(operationID);

      return result;
    } catch (error: unknown) {
      if (this.isCancellationError(error, operationID)) {
        throw new Error(
          "Business registration was cancelled."
        );
      }

      throw this.normalizeError(error);
    } finally {
      if (this.activeOperationID === operationID) {
        this.activeOperationID = null;
        this.abortController = null;
        this.setRunning(false);
      }
    }
  }

  /**
   * Alias for register().
   */
  async registerBusiness(
    request: BusinessRegistrationRequest
  ): Promise<BusinessRegistrationResult> {
    return this.register(request);
  }

  /**
   * Cancels the current registration operation.
   *
   * The executor must respect the AbortSignal provided through
   * BusinessRegistrationExecutionContext.
   */
  cancel(): boolean {
    if (
      !this.running ||
      !this.abortController ||
      this.abortController.signal.aborted
    ) {
      return false;
    }

    if (this.currentProgress?.canCancel === false) {
      return false;
    }

    this.abortController.abort();

    return true;
  }

  /**
   * Alias for cancel().
   */
  cancelRegistration(): boolean {
    return this.cancel();
  }

  /**
   * Subscribes to registration progress.
   *
   * Returns a cleanup function that removes the listener.
   */
  subscribe(
    listener: BusinessRegistrationProgressListener
  ): () => void {
    this.progressListeners.add(listener);

    if (this.currentProgress) {
      listener(this.currentProgress);
    }

    return () => {
      this.progressListeners.delete(listener);
    };
  }

  /**
   * Explicit alias for progress subscriptions.
   */
  subscribeToProgress(
    listener: BusinessRegistrationProgressListener
  ): () => void {
    return this.subscribe(listener);
  }

  /**
   * Subscribes to changes in the manager's running state.
   *
   * Returns a cleanup function that removes the listener.
   */
  subscribeToRunningState(
    listener: BusinessRegistrationRunningStateListener
  ): () => void {
    this.runningStateListeners.add(listener);

    listener(this.running);

    return () => {
      this.runningStateListeners.delete(listener);
    };
  }

  /**
   * Removes all registered listeners.
   *
   * This may be useful when disposing a temporary manager instance.
   */
  removeAllListeners(): void {
    this.progressListeners.clear();
    this.runningStateListeners.clear();
  }

  /**
   * Clears the last progress value.
   *
   * Progress cannot be cleared while registration is active.
   */
  clearProgress(): void {
    if (this.running) {
      return;
    }

    this.currentProgress = null;
  }

  /**
   * Publishes a progress update to all subscribers.
   */
  private publishProgress(
    progress: BusinessRegistrationProgress
  ): void {
    this.currentProgress = progress;

    for (const listener of this.progressListeners) {
      try {
        listener(progress);
      } catch (error: unknown) {
        console.error(
          "[JCSBusinessRegistrationManager] " +
            "Progress listener failed:",
          error
        );
      }
    }
  }

  /**
   * Changes the manager's running state and notifies subscribers.
   */
  private setRunning(isRunning: boolean): void {
    if (this.running === isRunning) {
      return;
    }

    this.running = isRunning;

    for (const listener of this.runningStateListeners) {
      try {
        listener(isRunning);
      } catch (error: unknown) {
        console.error(
          "[JCSBusinessRegistrationManager] " +
            "Running-state listener failed:",
          error
        );
      }
    }
  }

  /**
   * Performs minimum runtime validation before calling the executor.
   *
   * Deeper validation and infrastructure-specific validation may
   * still be performed by the executor or server.
   */
  private validateRequest(
    request: BusinessRegistrationRequest
  ): void {
    if (!request || typeof request !== "object") {
      throw new Error(
        "A valid business registration request is required."
      );
    }

    const runtimeRequest =
      request as RegistrationRequestRuntimeShape;

    this.requireText(
      runtimeRequest.businessName,
      "Business name is required."
    );

    this.requireText(
      runtimeRequest.fullName,
      "Business owner full name is required."
    );

    const email = this.requireText(
      runtimeRequest.email,
      "Business owner email is required."
    );

    if (!this.isValidEmail(email)) {
      throw new Error(
        "A valid business owner email address is required."
      );
    }

    const password = this.requireText(
      runtimeRequest.password,
      "A password is required."
    );

    if (password.length < 8) {
      throw new Error(
        "The password must contain at least 8 characters."
      );
    }

    this.requireText(
      runtimeRequest.businessCategory,
      "A business category is required."
    );

    this.requireText(
      runtimeRequest.businessMode,
      "A business mode is required."
    );
  }

  /**
   * Validates and returns a trimmed string.
   */
  private requireText(
    value: unknown,
    message: string
  ): string {
    if (typeof value !== "string") {
      throw new Error(message);
    }

    const trimmedValue = value.trim();

    if (!trimmedValue) {
      throw new Error(message);
    }

    return trimmedValue;
  }

  /**
   * Performs lightweight client-side email validation.
   *
   * Firebase and the server remain responsible for definitive
   * validation.
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Creates a unique operation identifier.
   */
  private createOperationID(): string {
    if (
      typeof globalThis.crypto !== "undefined" &&
      typeof globalThis.crypto.randomUUID === "function"
    ) {
      return globalThis.crypto.randomUUID();
    }

    return [
      Date.now().toString(36),
      Math.random().toString(36).slice(2),
    ].join("-");
  }

  /**
   * Throws when the active AbortSignal has been cancelled.
   */
  private throwIfCancelled(
    operationID: string
  ): void {
    if (
      this.activeOperationID !== operationID ||
      this.abortController?.signal.aborted
    ) {
      throw new DOMException(
        "Business registration was cancelled.",
        "AbortError"
      );
    }
  }

  /**
   * Determines whether an unknown error represents cancellation.
   */
  private isCancellationError(
    error: unknown,
    operationID: string
  ): boolean {
    if (
      this.activeOperationID !== operationID ||
      this.abortController?.signal.aborted
    ) {
      return true;
    }

    if (error instanceof DOMException) {
      return error.name === "AbortError";
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      return (
        error.name === "AbortError" ||
        message.includes("cancelled") ||
        message.includes("canceled")
      );
    }

    return false;
  }

  /**
   * Converts unknown thrown values into a standard Error.
   */
  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === "string" && error.trim()) {
      return new Error(error.trim());
    }

    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return new Error(error.message);
    }

    return new Error(
      "An unexpected error occurred during " +
        "business registration."
    );
  }
}

export default JCSBusinessRegistrationManager;