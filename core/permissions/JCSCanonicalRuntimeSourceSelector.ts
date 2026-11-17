// ============================================================
// JCSCanonicalRuntimeSourceSelector.ts
// ============================================================
//
// Platform-neutral canonical runtime source selector.
//
// IMPORTANT:
// - Pure decision logic only.
// - NO Firebase imports.
// - NO Firestore reads.
// - NO Firestore writes.
// - NO identity mutation.
// - NO provenance mutation.
// - NO runtime cutover activation.
// - NO legacy authority mutation.
//
// Productive runtime integration is intentionally deferred.
// ============================================================


export type JCSCanonicalRuntimeReadStatus =
  | "missing"
  | "valid"
  | "invalid"
  | "readError";


export type JCSCanonicalRuntimeProvenanceState =
  | null
  | "legacyUnresolved"
  | "canonicalExplicit"
  | "canonicalConfirmed"
  | "tenantAuthority"
  | "platformAuthority";


export type JCSCanonicalRuntimeAccessSource =
  | "legacy"
  | "canonical"
  | "none";


export type JCSCanonicalRuntimeSourceDecision =
  | "LEGACY"
  | "CANONICAL"
  | "FAIL_CLOSED";


export type JCSCanonicalRuntimeSourceReason =
  | "cutoverDisabled"
  | "canonicalRecordAbsent"
  | "legacyUnresolvedNotCutoverEligible"
  | "validatedEligibleCanonicalRecord"
  | "canonicalReadFailure"
  | "canonicalValidationFailure"
  | "canonicalIdentityBindingFailure"
  | "unexpectedCanonicalState";


export interface JCSCanonicalRuntimeSourceSelectorInput {
  runtimeCutoverEnabled: boolean;

  canonicalReadStatus:
    JCSCanonicalRuntimeReadStatus;

  subjectBindingValid: boolean;

  businessBindingValid: boolean;

  provenanceState:
    JCSCanonicalRuntimeProvenanceState;

  cutoverEligible: boolean;
}


export interface JCSCanonicalRuntimeSourceSelectorResult {
  source:
    JCSCanonicalRuntimeAccessSource;

  decision:
    JCSCanonicalRuntimeSourceDecision;

  reason:
    JCSCanonicalRuntimeSourceReason;

  failClosed: boolean;

  legacyFallbackAllowed: boolean;

  canonicalResolverAllowed: boolean;
}


export const
JCS_CANONICAL_RUNTIME_SOURCE_SELECTOR_SCHEMA_VERSION =
  1 as const;


export const
JCS_CANONICAL_RUNTIME_SOURCE_SELECTOR_INVARIANTS =
  [
    "CUTOVER_DISABLED_ALWAYS_LEGACY",
    "MISSING_CANONICAL_MAY_FALL_BACK_TO_LEGACY",
    "LEGACY_UNRESOLVED_MAY_FALL_BACK_TO_LEGACY",
    "VALID_ELIGIBLE_CANONICAL_MUST_USE_CANONICAL",
    "INVALID_CANONICAL_MUST_FAIL_CLOSED",
    "CANONICAL_READ_ERROR_MUST_FAIL_CLOSED",
    "SUBJECT_BINDING_FAILURE_MUST_FAIL_CLOSED",
    "BUSINESS_BINDING_FAILURE_MUST_FAIL_CLOSED",
    "UNEXPECTED_CANONICAL_STATE_MUST_FAIL_CLOSED",
    "FAIL_CLOSED_MUST_NEVER_ALLOW_LEGACY_FALLBACK",
    "CANONICAL_DECISION_MUST_NEVER_ALLOW_LEGACY_FALLBACK",
    "CANONICAL_RESOLVER_ALLOWED_ONLY_FOR_CANONICAL_DECISION",
    "LEGACY_DECISION_MUST_NOT_INVOKE_CANONICAL_RESOLVER",
    "SELECTOR_MUST_NOT_MUTATE_IDENTITY",
    "SELECTOR_MUST_NOT_MUTATE_PROVENANCE",
    "SELECTOR_MUST_NOT_WRITE_FIRESTORE",
    "SELECTOR_MUST_NOT_ENABLE_CUTOVER",
    "SELECTOR_POLICY_MUST_BE_IDENTICAL_ACROSS_FUNCTIONS_WEB_APPLE",
  ] as const;


function legacyResult(
  reason:
    | "cutoverDisabled"
    | "canonicalRecordAbsent"
    | "legacyUnresolvedNotCutoverEligible"
): JCSCanonicalRuntimeSourceSelectorResult {

  return {
    source:
      "legacy",

    decision:
      "LEGACY",

    reason,

    failClosed:
      false,

    legacyFallbackAllowed:
      true,

    canonicalResolverAllowed:
      false,
  };
}


function failClosedResult(
  reason:
    | "canonicalReadFailure"
    | "canonicalValidationFailure"
    | "canonicalIdentityBindingFailure"
    | "unexpectedCanonicalState"
): JCSCanonicalRuntimeSourceSelectorResult {

  return {
    source:
      "none",

    decision:
      "FAIL_CLOSED",

    reason,

    failClosed:
      true,

    legacyFallbackAllowed:
      false,

    canonicalResolverAllowed:
      false,
  };
}


function canonicalResult():
JCSCanonicalRuntimeSourceSelectorResult {

  return {
    source:
      "canonical",

    decision:
      "CANONICAL",

    reason:
      "validatedEligibleCanonicalRecord",

    failClosed:
      false,

    legacyFallbackAllowed:
      false,

    canonicalResolverAllowed:
      true,
  };
}


export function selectCanonicalRuntimeAccessSource(
  input:
    JCSCanonicalRuntimeSourceSelectorInput
): JCSCanonicalRuntimeSourceSelectorResult {

  if (
    input.runtimeCutoverEnabled !==
      true
  ) {

    return legacyResult(
      "cutoverDisabled"
    );
  }


  if (
    input.canonicalReadStatus ===
      "missing"
  ) {

    return legacyResult(
      "canonicalRecordAbsent"
    );
  }


  if (
    input.canonicalReadStatus ===
      "readError"
  ) {

    return failClosedResult(
      "canonicalReadFailure"
    );
  }


  if (
    input.canonicalReadStatus ===
      "invalid"
  ) {

    return failClosedResult(
      "canonicalValidationFailure"
    );
  }


  if (
    input.subjectBindingValid !==
      true ||
    input.businessBindingValid !==
      true
  ) {

    return failClosedResult(
      "canonicalIdentityBindingFailure"
    );
  }


  if (
    input.provenanceState ===
      "legacyUnresolved"
  ) {

    return legacyResult(
      "legacyUnresolvedNotCutoverEligible"
    );
  }


  if (
    input.cutoverEligible !==
      true
  ) {

    return failClosedResult(
      "unexpectedCanonicalState"
    );
  }


  return canonicalResult();
}
