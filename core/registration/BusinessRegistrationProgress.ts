import { BusinessRegistrationStage } from "./BusinessRegistrationStage";
import { BusinessRegistrationState } from "./BusinessRegistrationState";

/**
 * ==============================================================
 * JCS BUSINESS SUITE WEB
 * BusinessRegistrationProgress.ts
 * --------------------------------------------------------------
 * Describes the current progress of a business registration.
 * ==============================================================
 */

export interface BusinessRegistrationProgress {
  stage: BusinessRegistrationStage;

  state: BusinessRegistrationState;

  /**
   * Registration progress between 0 and 100.
   */
  percentage: number;

  /**
   * Short title displayed to the user.
   */
  title: string;

  /**
   * Detailed progress message.
   */
  message: string;

  /**
   * Internal identifier of the operation currently running.
   */
  currentOperation?: string;

  /**
   * Determines whether the active registration may be cancelled.
   */
  canCancel: boolean;

  /**
   * Determines whether the failed operation may be retried.
   */
  canRetry: boolean;

  /**
   * ISO-8601 timestamp.
   */
  updatedAt: string;
}

/**
 * Initial progress state used before registration begins.
 */
export const InitialBusinessRegistrationProgress: BusinessRegistrationProgress =
  {
    stage: BusinessRegistrationStage.Idle,
    state: BusinessRegistrationState.Idle,
    percentage: 0,
    title: "Business registration",
    message: "Ready to begin.",
    currentOperation: undefined,
    canCancel: false,
    canRetry: false,
    updatedAt: new Date().toISOString(),
  };

/**
 * Creates a safe registration progress object.
 *
 * The percentage is automatically limited to a value
 * between 0 and 100.
 */
export function makeBusinessRegistrationProgress(
  progress: Omit<BusinessRegistrationProgress, "updatedAt">
): BusinessRegistrationProgress {
  return {
    ...progress,
    percentage: Math.min(100, Math.max(0, progress.percentage)),
    updatedAt: new Date().toISOString(),
  };
}