import "@/core/firebase/firebase";

import {
  getApp,
} from "firebase/app";

import {
  getFunctions,
  httpsCallable,
} from "firebase/functions";

export interface JCSAdditionalBusinessCreationRequest {
  creationRequestID: string;
  businessName: string;
  industry: string;
  businessModeRawValue: string;
  phone: string;
  website: string;
}

export interface JCSAdditionalBusinessCreationResult {
  businessID: string;
  businessName: string;

  creationRequestID?: string;
  replayed?: boolean;

  [key: string]: unknown;
}

function cleanText(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function requireText(
  value: unknown,
  message: string,
): string {
  const clean =
    cleanText(value);

  if (!clean) {
    throw new Error(message);
  }

  return clean;
}

export class JCSAdditionalBusinessCreationService {
  createCreationRequestID():
    string
  {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }

    return [
      "web",
      Date.now().toString(36),
      Math.random()
        .toString(36)
        .slice(2),
    ].join("-");
  }

  async createAdditionalBusiness(
    request:
      JCSAdditionalBusinessCreationRequest,
  ): Promise<JCSAdditionalBusinessCreationResult> {

    const creationRequestID =
      requireText(
        request.creationRequestID,
        "Creation Request ID is required.",
      );

    const businessName =
      requireText(
        request.businessName,
        "Business name is required.",
      );

    const industry =
      requireText(
        request.industry,
        "Industry is required.",
      );

    const businessModeRawValue =
      requireText(
        request.businessModeRawValue,
        "Business type is required.",
      );

    /*
     * Resolve Firebase Functions lazily.
     *
     * The shared core/firebase/firebase module above establishes the
     * Web Firebase app before this method is invoked. Keeping getApp()
     * here prevents module-import time initialization races.
     */
    const functions =
      getFunctions(
        getApp(),
        "us-central1",
      );

    const callable =
      httpsCallable<
        JCSAdditionalBusinessCreationRequest,
        JCSAdditionalBusinessCreationResult
      >(
        functions,
        "createAdditionalBusinessForOwner",
        {
          timeout:
            120000,
        },
      );

    const response =
      await callable({
        creationRequestID,

        businessName,
        industry,
        businessModeRawValue,

        phone:
          cleanText(
            request.phone,
          ),

        website:
          cleanText(
            request.website,
          ),
      });

    const data =
      response.data;

    const returnedBusinessID =
      requireText(
        data?.businessID,
        "Additional Business creation returned no Business ID.",
      );

    const returnedBusinessName =
      cleanText(
        data?.businessName,
      ) ||
      businessName;

    return {
      ...data,

      businessID:
        returnedBusinessID,

      businessName:
        returnedBusinessName,
    };
  }
}

export const
  jcsAdditionalBusinessCreationService =
    new JCSAdditionalBusinessCreationService();

export default
  jcsAdditionalBusinessCreationService;
