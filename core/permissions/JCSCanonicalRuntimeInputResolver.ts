/**
 * JCSCanonicalRuntimeInputResolver.ts
 *
 * R39-C6D-T23-A
 *
 * Platform-neutral Functions-side runtime input derivation core.
 *
 * IMPORTANT:
 * - READ-ONLY decision preparation only.
 * - NO Firebase imports.
 * - NO Firestore reads.
 * - NO Firestore writes.
 * - NO identity mutation.
 * - NO provenance mutation.
 * - NO user migration.
 * - NO cutover activation.
 *
 * Firestore-specific transports remain outside this file.
 */

import type {
  JCSCanonicalRuntimeSourceSelectorInput,
} from "./JCSCanonicalRuntimeSourceSelector";


export type JCSCanonicalRuntimeProvenanceState =
  JCSCanonicalRuntimeSourceSelectorInput[
    "provenanceState"
  ];


export type JCSCanonicalRuntimeRecordObservation =
  | {
      status:
        "missing";
    }
  | {
      status:
        "readError";
    }
  | {
      status:
        "invalid";
    }
  | {
      status:
        "valid";

      subjectUID:
        string;

      businessID:
        string;
    };


export type JCSCanonicalRuntimeProvenanceObservation =
  | {
      status:
        "missing";
    }
  | {
      status:
        "readError";
    }
  | {
      status:
        "invalid";
    }
  | {
      status:
        "valid";

      provenanceState:
        JCSCanonicalRuntimeProvenanceState;

      provenanceCutoverEligible:
        boolean;
    };


export interface JCSCanonicalRuntimeInputResolverRequest {

  /**
   * Certified platform-local runtime flag.
   *
   * This resolver NEVER derives or changes this flag.
   */
  runtimeCutoverEnabled:
    boolean;


  /**
   * Authenticated Firebase Authentication UID.
   */
  authenticatedUID:
    string;


  /**
   * Business authority being evaluated.
   */
  requestedBusinessID:
    string;


  /**
   * Result of the canonical user/business read transport.
   */
  canonicalRecord:
    JCSCanonicalRuntimeRecordObservation;


  /**
   * Result of the certified provenance read transport.
   */
  provenance:
    JCSCanonicalRuntimeProvenanceObservation;
}


export const JCS_CANONICAL_RUNTIME_INPUT_RESOLVER_SCHEMA_VERSION =
  1 as const;


export const JCS_CANONICAL_RUNTIME_INPUT_RESOLVER_INVARIANTS =
  [
    "RESOLVER_IS_READ_ONLY",

    "RESOLVER_MUST_NOT_WRITE_FIRESTORE",

    "RESOLVER_MUST_NOT_MUTATE_IDENTITY",

    "RESOLVER_MUST_NOT_MUTATE_PROVENANCE",

    "RESOLVER_MUST_NOT_MIGRATE_USERS",

    "RESOLVER_MUST_NOT_ENABLE_CUTOVER",

    "RUNTIME_CUTOVER_FLAG_IS_CALLER_SUPPLIED",

    "MISSING_CANONICAL_MAPS_TO_MISSING",

    "CANONICAL_READ_ERROR_MAPS_TO_READ_ERROR",

    "INVALID_CANONICAL_MAPS_TO_INVALID",

    "VALID_CANONICAL_MAPS_TO_VALID",

    "PROVENANCE_READ_ERROR_MAPS_TO_READ_ERROR",

    "INVALID_PROVENANCE_MAPS_TO_INVALID",

    "MISSING_PROVENANCE_MUST_NOT_BE_GUESSED",

    "SUBJECT_BINDING_IS_EXPLICIT_UID_EQUALITY",

    "BUSINESS_BINDING_IS_EXPLICIT_BUSINESS_ID_EQUALITY",

    "LEGACY_UNRESOLVED_IS_NEVER_CUTOVER_ELIGIBLE",

    "CUTOVER_ELIGIBILITY_REQUIRES_VALID_BINDINGS",

    "CUTOVER_ELIGIBILITY_DOES_NOT_ENABLE_CUTOVER",

    "SELECTOR_REMAINS_FINAL_RUNTIME_SOURCE_AUTHORITY",
  ] as const;


function clean(
  value:
    string
): string {

  return value.trim();
}


function falseInput(
  runtimeCutoverEnabled:
    boolean,

  canonicalReadStatus:
    JCSCanonicalRuntimeSourceSelectorInput[
      "canonicalReadStatus"
    ],

  provenanceState:
    JCSCanonicalRuntimeProvenanceState =
      null
): JCSCanonicalRuntimeSourceSelectorInput {

  return {
    runtimeCutoverEnabled,

    canonicalReadStatus,

    subjectBindingValid:
      false,

    businessBindingValid:
      false,

    provenanceState,

    cutoverEligible:
      false,
  };
}


export function resolveCanonicalRuntimeSelectorInput(
  request:
    JCSCanonicalRuntimeInputResolverRequest
): JCSCanonicalRuntimeSourceSelectorInput {

  const runtimeCutoverEnabled =
    request.runtimeCutoverEnabled ===
    true;


  const canonical =
    request.canonicalRecord;


  /*
   * Canonical record transport mapping.
   */
  if (
    canonical.status ===
    "missing"
  ) {

    return falseInput(
      runtimeCutoverEnabled,
      "missing"
    );
  }


  if (
    canonical.status ===
    "readError"
  ) {

    return falseInput(
      runtimeCutoverEnabled,
      "readError"
    );
  }


  if (
    canonical.status ===
    "invalid"
  ) {

    return falseInput(
      runtimeCutoverEnabled,
      "invalid"
    );
  }


  /*
   * From here forward the canonical record itself
   * has passed transport/schema validation.
   */
  const authenticatedUID =
    clean(
      request.authenticatedUID
    );


  const canonicalSubjectUID =
    clean(
      canonical.subjectUID
    );


  const requestedBusinessID =
    clean(
      request.requestedBusinessID
    );


  const canonicalBusinessID =
    clean(
      canonical.businessID
    );


  const subjectBindingValid =
    authenticatedUID.length >
      0 &&
    canonicalSubjectUID.length >
      0 &&
    authenticatedUID ===
      canonicalSubjectUID;


  const businessBindingValid =
    requestedBusinessID.length >
      0 &&
    canonicalBusinessID.length >
      0 &&
    requestedBusinessID ===
      canonicalBusinessID;


  const provenance =
    request.provenance;


  /*
   * Provenance transport failures participate in the
   * aggregate runtime canonical-read health contract.
   */
  if (
    provenance.status ===
    "readError"
  ) {

    return {
      runtimeCutoverEnabled,

      canonicalReadStatus:
        "readError",

      subjectBindingValid,

      businessBindingValid,

      provenanceState:
        null,

      cutoverEligible:
        false,
    };
  }


  if (
    provenance.status ===
    "invalid"
  ) {

    return {
      runtimeCutoverEnabled,

      canonicalReadStatus:
        "invalid",

      subjectBindingValid,

      businessBindingValid,

      provenanceState:
        null,

      cutoverEligible:
        false,
    };
  }


  /*
   * Missing provenance is intentionally NOT guessed.
   *
   * The canonical record may itself be structurally valid,
   * but no provenance authority exists to make it eligible.
   *
   * The selector therefore receives:
   *   canonicalReadStatus = valid
   *   provenanceState     = null
   *   cutoverEligible     = false
   *
   * If cutover were ever enabled, this combination fails
   * closed as unexpectedCanonicalState.
   */
  if (
    provenance.status ===
    "missing"
  ) {

    return {
      runtimeCutoverEnabled,

      canonicalReadStatus:
        "valid",

      subjectBindingValid,

      businessBindingValid,

      provenanceState:
        null,

      cutoverEligible:
        false,
    };
  }


  const provenanceState =
    provenance.provenanceState;


  const provenanceStateKnown =
    provenanceState !==
      null;


  const legacyUnresolved =
    provenanceState ===
      "legacyUnresolved";


  /*
   * Even if an upstream provenance repository accidentally
   * reports eligibility=true for legacyUnresolved, this
   * boundary forces it back to false.
   */
  const cutoverEligible =
    subjectBindingValid &&
    businessBindingValid &&
    provenanceStateKnown &&
    !legacyUnresolved &&
    provenance
      .provenanceCutoverEligible ===
        true;


  return {
    runtimeCutoverEnabled,

    canonicalReadStatus:
      "valid",

    subjectBindingValid,

    businessBindingValid,

    provenanceState,

    cutoverEligible,
  };
}
