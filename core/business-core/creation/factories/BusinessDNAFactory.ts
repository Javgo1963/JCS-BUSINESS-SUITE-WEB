import type {
  FieldValue,
} from "firebase/firestore";

import {
  cleanFactoryText,
  createFactoryAuditFields,
  requireFactoryText,
  uniqueFactoryStrings,
  type BusinessCreationFactoryContext,
} from "./BusinessCreationFactoryContext";

// MARK: - Business DNA Status

export type BusinessDNAStatus =
  | "initialized"
  | "enriching"
  | "ready"
  | "failed";

// MARK: - Business DNA Document

export interface JCSBusinessDNADocument {
  id: string;
  businessDNAID: string;

  businessID: string;
  ownerUID: string;
  firebaseUID: string;

  businessName: string;

  industryCategoryKey: string;
  industryCategoryTitle: string;

  businessModeKey: string;
  businessModeName: string;

  recommendedModules: string[];
  enabledModules: string[];

  mission: string;
  vision: string;

  brandVoice: string;
  businessSummary: string;

  targetAudience: string;
  uniqueValueProposition: string;

  productsAndServicesSummary: string;

  aiSystemPrompt: string;
  aiContextSummary: string;

  aiEnrichmentStatus:
    | "notRequested"
    | "pending"
    | "completed"
    | "failed";

  aiEnrichmentVersion: number;

  localeIdentifier: string;
  timeZoneIdentifier: string;

  dnaVersion: number;
  schemaVersion: number;

  status: BusinessDNAStatus;

  createdByUID: string;
  updatedByUID: string;

  createdAtISO: string;
  updatedAtISO: string;

  createdAt: FieldValue;
  updatedAt: FieldValue;
}

// MARK: - Business DNA Factory Overrides

export interface BusinessDNAFactoryOverrides {
  mission?: string;
  vision?: string;

  brandVoice?: string;
  businessSummary?: string;

  targetAudience?: string;
  uniqueValueProposition?: string;

  productsAndServicesSummary?: string;

  aiSystemPrompt?: string;
  aiContextSummary?: string;

  status?: BusinessDNAStatus;

  aiEnrichmentStatus?:
    | "notRequested"
    | "pending"
    | "completed"
    | "failed";
}

// MARK: - Business DNA Factory

export class BusinessDNAFactory {
  static create(
    context: BusinessCreationFactoryContext,
    overrides:
      BusinessDNAFactoryOverrides = {}
  ): JCSBusinessDNADocument {
    const factoryName =
      "BusinessDNAFactory";

    const {
      input,
      identity,
    } = context;

    const businessDNAID =
      requireFactoryText(
        factoryName,
        "businessDNAID",
        identity.businessDNAID
      );

    const businessID =
      requireFactoryText(
        factoryName,
        "businessID",
        identity.businessID
      );

    const ownerUID =
      requireFactoryText(
        factoryName,
        "ownerUID",
        identity.ownerUID
      );

    const firebaseUID =
      requireFactoryText(
        factoryName,
        "firebaseUID",
        identity.firebaseUID
      );

    const businessName =
      requireFactoryText(
        factoryName,
        "businessName",
        input.businessName
      );

    const industryCategoryKey =
      requireFactoryText(
        factoryName,
        "industryCategoryKey",
        input.industryCategoryKey
      );

    const industryCategoryTitle =
      requireFactoryText(
        factoryName,
        "industryCategoryTitle",
        input.industryCategoryTitle
      );

    const businessModeKey =
      requireFactoryText(
        factoryName,
        "businessModeKey",
        input.businessModeKey
      );

    const businessModeName =
      requireFactoryText(
        factoryName,
        "businessModeName",
        input.businessModeName
      );

    const auditFields =
      createFactoryAuditFields(context);

    return {
      id: businessDNAID,
      businessDNAID,

      businessID,
      ownerUID,
      firebaseUID,

      businessName,

      industryCategoryKey,
      industryCategoryTitle,

      businessModeKey,
      businessModeName,

      recommendedModules:
        uniqueFactoryStrings(
          input.recommendedModules
        ),

      enabledModules:
        uniqueFactoryStrings(
          context.enabledModules
        ),

      mission:
        cleanFactoryText(
          overrides.mission
        ),

      vision:
        cleanFactoryText(
          overrides.vision
        ),

      brandVoice:
        cleanFactoryText(
          overrides.brandVoice
        ),

      businessSummary:
        cleanFactoryText(
          overrides.businessSummary
        ),

      targetAudience:
        cleanFactoryText(
          overrides.targetAudience
        ),

      uniqueValueProposition:
        cleanFactoryText(
          overrides.uniqueValueProposition
        ),

      productsAndServicesSummary:
        cleanFactoryText(
          overrides.productsAndServicesSummary
        ),

      aiSystemPrompt:
        cleanFactoryText(
          overrides.aiSystemPrompt
        ),

      aiContextSummary:
        cleanFactoryText(
          overrides.aiContextSummary
        ),

      aiEnrichmentStatus:
        overrides.aiEnrichmentStatus ??
        "notRequested",

      aiEnrichmentVersion: 0,

      localeIdentifier:
        requireFactoryText(
          factoryName,
          "localeIdentifier",
          input.localeIdentifier
        ),

      timeZoneIdentifier:
        requireFactoryText(
          factoryName,
          "timeZoneIdentifier",
          input.timeZoneIdentifier
        ),

      dnaVersion: 1,
      schemaVersion: 1,

      status:
        overrides.status ??
        "initialized",

      ...auditFields,
    };
  }
}

// MARK: - Convenience Factory

export function createBusinessDNADocument(
  context: BusinessCreationFactoryContext,
  overrides:
    BusinessDNAFactoryOverrides = {}
): JCSBusinessDNADocument {
  return BusinessDNAFactory.create(
    context,
    overrides
  );
}