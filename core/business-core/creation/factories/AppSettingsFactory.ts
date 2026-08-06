import type {
  FieldValue,
} from "firebase/firestore";

import {
  cleanFactoryText,
  createFactoryAuditFields,
  normalizeFactoryEmail,
  requireFactoryText,
  type BusinessCreationFactoryContext,
} from "./BusinessCreationFactoryContext";

// MARK: - App Settings Document

export interface JCSAppSettingsDocument {
  id: string;
  appSettingsID: string;

  businessID: string;
  ownerUID: string;
  firebaseUID: string;

  companyName: string;

  addressLine1: string;
  addressLine2: string;

  phone: string;
  email: string;
  website: string;

  taxPercent: number;

  accentColorName: string;

  logoFileName: string;
  backgroundFileName: string;

  useAccentColorForLogo: boolean;

  currencyCode: string;
  localeIdentifier: string;
  timeZoneIdentifier: string;

  settingsVersion: number;
  isConfigured: boolean;

  createdByUID: string;
  updatedByUID: string;

  createdAtISO: string;
  updatedAtISO: string;

  createdAt: FieldValue;
  updatedAt: FieldValue;
}

// MARK: - App Settings Factory Overrides

export interface AppSettingsFactoryOverrides {
  addressLine1?: string;
  addressLine2?: string;

  taxPercent?: number;

  accentColorName?: string;

  logoFileName?: string;
  backgroundFileName?: string;

  useAccentColorForLogo?: boolean;

  currencyCode?: string;
}

// MARK: - App Settings Factory

export class AppSettingsFactory {
  static create(
    context: BusinessCreationFactoryContext,
    overrides: AppSettingsFactoryOverrides = {}
  ): JCSAppSettingsDocument {
    const factoryName =
      "AppSettingsFactory";

    const {
      input,
      identity,
      configuration,
    } = context;

    const businessID =
      requireFactoryText(
        factoryName,
        "businessID",
        identity.businessID
      );

    const appSettingsID =
      requireFactoryText(
        factoryName,
        "appSettingsID",
        identity.appSettingsID
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

    const companyName =
      requireFactoryText(
        factoryName,
        "companyName",
        input.businessName
      );

    const ownerEmail =
      requireFactoryText(
        factoryName,
        "ownerEmail",
        input.ownerEmail
      );

    const localeIdentifier =
      requireFactoryText(
        factoryName,
        "localeIdentifier",
        input.localeIdentifier
      );

    const timeZoneIdentifier =
      requireFactoryText(
        factoryName,
        "timeZoneIdentifier",
        input.timeZoneIdentifier
      );

    const taxPercent =
      AppSettingsFactory.resolveTaxPercent(
        overrides.taxPercent
      );

    const accentColorName =
      cleanFactoryText(
        overrides.accentColorName
      ) ||
      cleanFactoryText(
        configuration.accentColorName
      ) ||
      "blue";

    const currencyCode =
      cleanFactoryText(
        overrides.currencyCode
      ) ||
      cleanFactoryText(
        configuration.currencyCode
      ) ||
      "USD";

    const auditFields =
      createFactoryAuditFields(context);

    return {
      id: appSettingsID,
      appSettingsID,

      businessID,
      ownerUID,
      firebaseUID,

      companyName,

      addressLine1:
        cleanFactoryText(
          overrides.addressLine1
        ),

      addressLine2:
        cleanFactoryText(
          overrides.addressLine2
        ),

      phone:
        cleanFactoryText(
          input.businessPhone
        ),

      email:
        normalizeFactoryEmail(
          ownerEmail
        ),

      website:
        cleanFactoryText(
          input.website
        ),

      taxPercent,

      accentColorName,

      logoFileName:
        cleanFactoryText(
          overrides.logoFileName
        ),

      backgroundFileName:
        cleanFactoryText(
          overrides.backgroundFileName
        ),

      useAccentColorForLogo:
        overrides.useAccentColorForLogo ??
        true,

      currencyCode:
        currencyCode.toUpperCase(),

      localeIdentifier,
      timeZoneIdentifier,

      settingsVersion: 1,

      /**
       * The owner still needs to configure address and tax.
       */
      isConfigured: false,

      ...auditFields,
    };
  }

  // MARK: - Tax Validation

  private static resolveTaxPercent(
    value?: number
  ): number {
    const taxPercent =
      value ?? 0;

    if (
      !Number.isFinite(taxPercent) ||
      taxPercent < 0 ||
      taxPercent > 100
    ) {
      throw new Error(
        "AppSettingsFactory taxPercent must be between 0 and 100."
      );
    }

    return taxPercent;
  }
}

// MARK: - Convenience Factory

export function createAppSettingsDocument(
  context: BusinessCreationFactoryContext,
  overrides: AppSettingsFactoryOverrides = {}
): JCSAppSettingsDocument {
  return AppSettingsFactory.create(
    context,
    overrides
  );
}