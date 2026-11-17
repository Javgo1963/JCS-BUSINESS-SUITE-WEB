import {
  createHash,
} from "node:crypto";

import {
  JCS_CANONICAL_RUNTIME_SOURCE_SELECTOR_INVARIANTS,
  JCS_CANONICAL_RUNTIME_SOURCE_SELECTOR_SCHEMA_VERSION,
  selectCanonicalRuntimeAccessSource,

  type JCSCanonicalRuntimeSourceSelectorInput,
} from "./JCSCanonicalRuntimeSourceSelector";


const LOCKED_T12_MATRIX_SHA =
  "6c7424663b96117083dc0db47a1c57cdda39f931c8db4ce80b642f5da8ba5fe4";


function canonicalize(
  value: unknown
): unknown {

  if (
    Array.isArray(value)
  ) {
    return value.map(
      canonicalize
    );
  }


  if (
    value !== null &&
    typeof value ===
      "object"
  ) {

    const source =
      value as
        Record<
          string,
          unknown
        >;


    return Object.fromEntries(
      Object.keys(source)
        .sort()
        .map(
          key => [
            key,
            canonicalize(
              source[key]
            ),
          ]
        )
    );
  }


  return value;
}


function hashObject(
  value: unknown
): string {

  return createHash(
    "sha256"
  )
    .update(
      JSON.stringify(
        canonicalize(
          value
        )
      ),
      "utf8"
    )
    .digest(
      "hex"
    );
}


interface Scenario {
  id: string;

  input:
    JCSCanonicalRuntimeSourceSelectorInput;

  expectedDecision:
    "LEGACY" |
    "CANONICAL" |
    "FAIL_CLOSED";

  expectedReason:
    string;
}


const scenarios:
Scenario[] =
  [
    {
      id:
        "CUTOVER_DISABLED_VALID_CANONICAL",

      input: {
        runtimeCutoverEnabled:
          false,

        canonicalReadStatus:
          "valid",

        subjectBindingValid:
          true,

        businessBindingValid:
          true,

        provenanceState:
          "tenantAuthority",

        cutoverEligible:
          true,
      },

      expectedDecision:
        "LEGACY",

      expectedReason:
        "cutoverDisabled",
    },

    {
      id:
        "CUTOVER_ENABLED_VALID_TENANT_AUTHORITY",

      input: {
        runtimeCutoverEnabled:
          true,

        canonicalReadStatus:
          "valid",

        subjectBindingValid:
          true,

        businessBindingValid:
          true,

        provenanceState:
          "tenantAuthority",

        cutoverEligible:
          true,
      },

      expectedDecision:
        "CANONICAL",

      expectedReason:
        "validatedEligibleCanonicalRecord",
    },

    {
      id:
        "CUTOVER_ENABLED_VALID_CANONICAL_EXPLICIT",

      input: {
        runtimeCutoverEnabled:
          true,

        canonicalReadStatus:
          "valid",

        subjectBindingValid:
          true,

        businessBindingValid:
          true,

        provenanceState:
          "canonicalExplicit",

        cutoverEligible:
          true,
      },

      expectedDecision:
        "CANONICAL",

      expectedReason:
        "validatedEligibleCanonicalRecord",
    },

    {
      id:
        "CUTOVER_ENABLED_VALID_CANONICAL_CONFIRMED",

      input: {
        runtimeCutoverEnabled:
          true,

        canonicalReadStatus:
          "valid",

        subjectBindingValid:
          true,

        businessBindingValid:
          true,

        provenanceState:
          "canonicalConfirmed",

        cutoverEligible:
          true,
      },

      expectedDecision:
        "CANONICAL",

      expectedReason:
        "validatedEligibleCanonicalRecord",
    },

    {
      id:
        "CUTOVER_ENABLED_VALID_PLATFORM_AUTHORITY",

      input: {
        runtimeCutoverEnabled:
          true,

        canonicalReadStatus:
          "valid",

        subjectBindingValid:
          true,

        businessBindingValid:
          true,

        provenanceState:
          "platformAuthority",

        cutoverEligible:
          true,
      },

      expectedDecision:
        "CANONICAL",

      expectedReason:
        "validatedEligibleCanonicalRecord",
    },

    {
      id:
        "CUTOVER_ENABLED_CANONICAL_MISSING",

      input: {
        runtimeCutoverEnabled:
          true,

        canonicalReadStatus:
          "missing",

        subjectBindingValid:
          false,

        businessBindingValid:
          false,

        provenanceState:
          null,

        cutoverEligible:
          false,
      },

      expectedDecision:
        "LEGACY",

      expectedReason:
        "canonicalRecordAbsent",
    },

    {
      id:
        "CUTOVER_ENABLED_LEGACY_UNRESOLVED",

      input: {
        runtimeCutoverEnabled:
          true,

        canonicalReadStatus:
          "valid",

        subjectBindingValid:
          true,

        businessBindingValid:
          true,

        provenanceState:
          "legacyUnresolved",

        cutoverEligible:
          false,
      },

      expectedDecision:
        "LEGACY",

      expectedReason:
        "legacyUnresolvedNotCutoverEligible",
    },

    {
      id:
        "CUTOVER_ENABLED_INVALID_CANONICAL",

      input: {
        runtimeCutoverEnabled:
          true,

        canonicalReadStatus:
          "invalid",

        subjectBindingValid:
          false,

        businessBindingValid:
          false,

        provenanceState:
          null,

        cutoverEligible:
          false,
      },

      expectedDecision:
        "FAIL_CLOSED",

      expectedReason:
        "canonicalValidationFailure",
    },

    {
      id:
        "CUTOVER_ENABLED_CANONICAL_READ_ERROR",

      input: {
        runtimeCutoverEnabled:
          true,

        canonicalReadStatus:
          "readError",

        subjectBindingValid:
          false,

        businessBindingValid:
          false,

        provenanceState:
          null,

        cutoverEligible:
          false,
      },

      expectedDecision:
        "FAIL_CLOSED",

      expectedReason:
        "canonicalReadFailure",
    },

    {
      id:
        "CUTOVER_ENABLED_SUBJECT_BINDING_FAILURE",

      input: {
        runtimeCutoverEnabled:
          true,

        canonicalReadStatus:
          "valid",

        subjectBindingValid:
          false,

        businessBindingValid:
          true,

        provenanceState:
          "tenantAuthority",

        cutoverEligible:
          true,
      },

      expectedDecision:
        "FAIL_CLOSED",

      expectedReason:
        "canonicalIdentityBindingFailure",
    },

    {
      id:
        "CUTOVER_ENABLED_BUSINESS_BINDING_FAILURE",

      input: {
        runtimeCutoverEnabled:
          true,

        canonicalReadStatus:
          "valid",

        subjectBindingValid:
          true,

        businessBindingValid:
          false,

        provenanceState:
          "tenantAuthority",

        cutoverEligible:
          true,
      },

      expectedDecision:
        "FAIL_CLOSED",

      expectedReason:
        "canonicalIdentityBindingFailure",
    },

    {
      id:
        "CUTOVER_ENABLED_UNEXPECTED_NONELIGIBLE_STATE",

      input: {
        runtimeCutoverEnabled:
          true,

        canonicalReadStatus:
          "valid",

        subjectBindingValid:
          true,

        businessBindingValid:
          true,

        provenanceState:
          "canonicalExplicit",

        cutoverEligible:
          false,
      },

      expectedDecision:
        "FAIL_CLOSED",

      expectedReason:
        "unexpectedCanonicalState",
    },
  ];


let passCount =
  0;


const results =
  scenarios.map(
    scenario => {

      const actual =
        selectCanonicalRuntimeAccessSource(
          scenario.input
        );


      const passed =
        actual.decision ===
          scenario.expectedDecision &&
        actual.reason ===
          scenario.expectedReason;


      if (
        passed
      ) {
        passCount +=
          1;
      }


      if (
        actual.decision ===
          "FAIL_CLOSED" &&
        (
          actual.source !==
            "none" ||
          actual.failClosed !==
            true ||
          actual.legacyFallbackAllowed !==
            false ||
          actual.canonicalResolverAllowed !==
            false
        )
      ) {

        throw new Error(
          `FAIL_CLOSED invariant failed: ${scenario.id}`
        );
      }


      if (
        actual.decision ===
          "CANONICAL" &&
        (
          actual.source !==
            "canonical" ||
          actual.failClosed !==
            false ||
          actual.legacyFallbackAllowed !==
            false ||
          actual.canonicalResolverAllowed !==
            true
        )
      ) {

        throw new Error(
          `CANONICAL invariant failed: ${scenario.id}`
        );
      }


      if (
        actual.decision ===
          "LEGACY" &&
        (
          actual.source !==
            "legacy" ||
          actual.failClosed !==
            false ||
          actual.legacyFallbackAllowed !==
            true ||
          actual.canonicalResolverAllowed !==
            false
        )
      ) {

        throw new Error(
          `LEGACY invariant failed: ${scenario.id}`
        );
      }


      return {
        id:
          scenario.id,

        input:
          scenario.input,

        actual,

        expectedDecision:
          scenario.expectedDecision,

        expectedReason:
          scenario.expectedReason,

        passed,
      };
    }
  );


if (
  passCount !==
    scenarios.length
) {

  throw new Error(
    `Web selector certification failed: ${passCount}/${scenarios.length}.`
  );
}


const matrixSHA =
  hashObject(
    results
  );


if (
  matrixSHA !==
    LOCKED_T12_MATRIX_SHA
) {

  throw new Error(
    [
      "Web selector matrix drift.",
      `ACTUAL=${matrixSHA}`,
      `EXPECTED=${LOCKED_T12_MATRIX_SHA}`,
    ].join(
      " "
    )
  );
}


console.log(
  "============================================================"
);

console.log(
  "R39-C6D-T16 — WEB SOURCE-SELECTOR CERTIFICATION"
);

console.log(
  "============================================================"
);

console.log(
  `T16_WEB_SELECTOR_SCHEMA_VERSION=${JCS_CANONICAL_RUNTIME_SOURCE_SELECTOR_SCHEMA_VERSION}`
);

console.log(
  `T16_WEB_SCENARIO_COUNT=${scenarios.length}`
);

console.log(
  `T16_WEB_SCENARIO_PASS_COUNT=${passCount}`
);

console.log(
  `T16_WEB_T12_MATRIX_REPRODUCED_SHA256=${matrixSHA}`
);

console.log(
  `T16_WEB_INVARIANT_COUNT=${JCS_CANONICAL_RUNTIME_SOURCE_SELECTOR_INVARIANTS.length}`
);

console.log(
  "T16_WEB_SELECTOR_MATRIX_EXACT_MATCH=true"
);

console.log(
  "T16_WEB_SELECTOR_CORE_CERTIFIED=true"
);

console.log(
  "============================================================"
);

console.log(
  "R39-C6D-T16 WEB SELECTOR CERTIFICATION PASSED"
);

console.log(
  "============================================================"
);
