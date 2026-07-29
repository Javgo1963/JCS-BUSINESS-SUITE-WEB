/**
 * ==============================================================
 * JCS BUSINESS SUITE WEB
 * BusinessRegistrationExecutor.ts
 * --------------------------------------------------------------
 * Infrastructure contract used by the Business Registration
 * Manager.
 *
 * The manager depends only on this contract and never communicates
 * directly with Firebase, Firestore, Storage or Cloud Functions.
 * ==============================================================
 */

import type { BusinessRegistrationRequest } from "../contracts/BusinessRegistrationRequest";
import type { BusinessRegistrationResult } from "../contracts/BusinessRegistrationResult";
import type { BusinessRegistrationProgress } from "../BusinessRegistrationProgress";

/**
 * Context supplied by the registration manager.
 *
 * Implementations should:
 * - Respect the AbortSignal.
 * - Report progress through updateProgress().
 */
export interface BusinessRegistrationExecutionContext {

    /**
     * Cancellation signal.
     */
    readonly signal: AbortSignal;

    /**
     * Publishes a registration progress update.
     */
    updateProgress(
        progress: Omit<BusinessRegistrationProgress, "updatedAt">
    ): void;
}

/**
 * Contract implemented by every registration executor.
 *
 * Examples:
 *
 * • Firebase executor
 * • Local development executor
 * • Testing executor
 * • Import/Migration executor
 */
export interface BusinessRegistrationExecutor {

    /**
     * Executes the complete business registration workflow.
     */
    execute(
        request: BusinessRegistrationRequest,
        context: BusinessRegistrationExecutionContext
    ): Promise<BusinessRegistrationResult>;
}
