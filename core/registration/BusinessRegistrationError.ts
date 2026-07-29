import { BusinessRegistrationState } from "./BusinessRegistrationState";

/**
 * ==============================================================
 * JCS BUSINESS SUITE WEB
 * BusinessRegistrationError.ts
 * --------------------------------------------------------------
 * Standardized errors produced by the Business Registration
 * Engine.
 * ==============================================================
 */

export type BusinessRegistrationErrorCode =
  | "invalid-request"
  | "email-already-in-use"
  | "authentication-failed"
  | "business-creation-failed"
  | "owner-creation-failed"
  | "app-user-creation-failed"
  | "app-settings-creation-failed"
  | "platform-client-creation-failed"
  | "business-dna-creation-failed"
  | "logo-generation-failed"
  | "module-assignment-failed"
  | "workspace-bootstrap-failed"
  | "invitation-completion-failed"
  | "registration-cancelled"
  | "registration-in-progress"
  | "unknown-registration-error";

/**
 * Serializable information used to construct a registration error.
 */
export interface BusinessRegistrationErrorDetails {
  code: BusinessRegistrationErrorCode;

  message: string;

  state?: BusinessRegistrationState;

  recoverable: boolean;

  originalError?: unknown;
}

/**
 * Official error produced by the JCS Business Registration Engine.
 */
export class BusinessRegistrationError extends Error {
  public readonly code: BusinessRegistrationErrorCode;

  public readonly state?: BusinessRegistrationState;

  public readonly recoverable: boolean;

  public readonly originalError?: unknown;

  constructor(details: BusinessRegistrationErrorDetails) {
    super(details.message);

    this.name = "BusinessRegistrationError";

    this.code = details.code;
    this.state = details.state;
    this.recoverable = details.recoverable;
    this.originalError = details.originalError;

    Object.setPrototypeOf(
      this,
      BusinessRegistrationError.prototype
    );
  }
}

/**
 * Converts any unknown error into a standardized JCS
 * BusinessRegistrationError.
 */
export function normalizeBusinessRegistrationError(
  error: unknown,
  fallbackState?: BusinessRegistrationState
): BusinessRegistrationError {
  if (error instanceof BusinessRegistrationError) {
    return error;
  }

  if (error instanceof Error) {
    return new BusinessRegistrationError({
      code: "unknown-registration-error",
      message: error.message,
      state: fallbackState,
      recoverable: false,
      originalError: error,
    });
  }

  return new BusinessRegistrationError({
    code: "unknown-registration-error",
    message: "An unknown business registration error occurred.",
    state: fallbackState,
    recoverable: false,
    originalError: error,
  });
}