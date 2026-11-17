/*
 * JCS Business Suite
 * JCSRoleAccessPolicyEngine.ts
 *
 * Web equivalent of the Apple JCSRoleAccessPolicyEngine.
 *
 * Responsibilities:
 *
 * - Resolve a functional business family from business identity.
 * - Produce safe default permissions for a business family and role.
 * - Give PlatformAdmin absolute platform access.
 * - Give Business Owners complete access to applicable business functions.
 * - Give Admin, Manager, Employee, Customer and Provider role-based defaults.
 * - Preserve the existing AppUser Boolean permission model.
 * - Allow custom per-user permissions to be applied after defaults.
 */

import {
  APP_USER_ROLES,
  createEmptyAppUserPermissions,
  type AppUserPermissions,
  type AppUserRole,
} from "../../models/AppUser";

// ============================================================
// MARK: - Business Family
// ============================================================

export const JCS_BUSINESS_FAMILIES = {
  retailCommerce: "retailCommerce",
  restaurantFood: "restaurantFood",
  beautyWellness: "beautyWellness",
  healthcare: "healthcare",
  constructionTrades: "constructionTrades",
  transportationLogistics: "transportationLogistics",
  automotive: "automotive",
  professionalServices: "professionalServices",
  realEstateProperty: "realEstateProperty",
  technologyDigital: "technologyDigital",
  educationTraining: "educationTraining",
  fitnessSports: "fitnessSports",
  creativeMedia: "creativeMedia",
  eventsEntertainment: "eventsEntertainment",
  hospitalityTravel: "hospitalityTravel",
  industrialManufacturing: "industrialManufacturing",
  agricultureFarming: "agricultureFarming",
  nonprofitCommunity: "nonprofitCommunity",
  financialServices: "financialServices",
  legalGovernment: "legalGovernment",
  energyUtilities: "energyUtilities",
  securitySafety: "securitySafety",
  scienceBiotechnology: "scienceBiotechnology",
  aviationMaritime: "aviationMaritime",
  animalServices: "animalServices",
  childcareFamily: "childcareFamily",
  seniorCareFuneral: "seniorCareFuneral",
  facilityRepairServices: "facilityRepairServices",
  generalBusiness: "generalBusiness",
} as const;

export type JCSBusinessFamily =
  (typeof JCS_BUSINESS_FAMILIES)[keyof typeof JCS_BUSINESS_FAMILIES];

// ============================================================
// MARK: - Business Identity
// ============================================================

export interface JCSBusinessIdentityInput {
  industry?: string | null;
  businessCategory?: string | null;
  businessModeRawValue?: string | null;
}

function cleanText(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalized(
  value: unknown
): string {
  return cleanText(value)
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase();
}

function containsAny(
  text: string,
  values: readonly string[]
): boolean {
  return values.some(
    (value) =>
      text.includes(value)
  );
}

// ============================================================
// MARK: - Official Category Mapping
// ============================================================

const FAMILY_BY_CATEGORY:
  Readonly<Record<string, JCSBusinessFamily>> = {
    [normalized("Retail & Commerce")]:
      JCS_BUSINESS_FAMILIES.retailCommerce,

    [normalized("Restaurant & Food")]:
      JCS_BUSINESS_FAMILIES.restaurantFood,

    [normalized("Beauty & Personal Care")]:
      JCS_BUSINESS_FAMILIES.beautyWellness,

    [normalized("Medical & Healthcare")]:
      JCS_BUSINESS_FAMILIES.healthcare,

    [normalized("Construction & Trades")]:
      JCS_BUSINESS_FAMILIES.constructionTrades,

    [normalized("Transportation & Logistics")]:
      JCS_BUSINESS_FAMILIES.transportationLogistics,

    [normalized("Automotive")]:
      JCS_BUSINESS_FAMILIES.automotive,

    [normalized("Professional Services")]:
      JCS_BUSINESS_FAMILIES.professionalServices,

    [normalized("Engineering & Design")]:
      JCS_BUSINESS_FAMILIES.professionalServices,

    [normalized("Real Estate & Property")]:
      JCS_BUSINESS_FAMILIES.realEstateProperty,

    [normalized("Technology & Digital")]:
      JCS_BUSINESS_FAMILIES.technologyDigital,

    [normalized("Education & Training")]:
      JCS_BUSINESS_FAMILIES.educationTraining,

    [normalized("Fitness & Sports")]:
      JCS_BUSINESS_FAMILIES.fitnessSports,

    [normalized("Creative & Media")]:
      JCS_BUSINESS_FAMILIES.creativeMedia,

    [normalized("Events & Entertainment")]:
      JCS_BUSINESS_FAMILIES.eventsEntertainment,

    [normalized("Hospitality & Travel")]:
      JCS_BUSINESS_FAMILIES.hospitalityTravel,

    [normalized("Industrial & Manufacturing")]:
      JCS_BUSINESS_FAMILIES.industrialManufacturing,

    [normalized("Agriculture & Farming")]:
      JCS_BUSINESS_FAMILIES.agricultureFarming,

    [normalized("Nonprofit & Community")]:
      JCS_BUSINESS_FAMILIES.nonprofitCommunity,

    [normalized("Modern Online Business Models")]:
      JCS_BUSINESS_FAMILIES.technologyDigital,

    [normalized("Banking & Financial Services")]:
      JCS_BUSINESS_FAMILIES.financialServices,

    [normalized("Legal & Government")]:
      JCS_BUSINESS_FAMILIES.legalGovernment,

    [normalized("Energy & Utilities")]:
      JCS_BUSINESS_FAMILIES.energyUtilities,

    [normalized("Oil, Gas & Mining")]:
      JCS_BUSINESS_FAMILIES.energyUtilities,

    [normalized("Telecommunications")]:
      JCS_BUSINESS_FAMILIES.technologyDigital,

    [normalized("Security & Safety")]:
      JCS_BUSINESS_FAMILIES.securitySafety,

    [normalized("Scientific & Biotechnology")]:
      JCS_BUSINESS_FAMILIES.scienceBiotechnology,

    [normalized("Aviation & Maritime")]:
      JCS_BUSINESS_FAMILIES.aviationMaritime,

    [normalized("Animal Services")]:
      JCS_BUSINESS_FAMILIES.animalServices,

    [normalized("Childcare & Family Services")]:
      JCS_BUSINESS_FAMILIES.childcareFamily,

    [normalized("Senior Care & Funeral Services")]:
      JCS_BUSINESS_FAMILIES.seniorCareFuneral,

    [normalized("Laundry, Repair & Facility Services")]:
      JCS_BUSINESS_FAMILIES.facilityRepairServices,

    [normalized("Fashion, Luxury & Jewelry")]:
      JCS_BUSINESS_FAMILIES.retailCommerce,

    [normalized("Publishing, Broadcasting & Gaming")]:
      JCS_BUSINESS_FAMILIES.creativeMedia,

    [normalized("Advanced Technology & Aerospace")]:
      JCS_BUSINESS_FAMILIES.technologyDigital,
  };

// ============================================================
// MARK: - Business Family Resolver
// ============================================================

export function resolveJCSBusinessFamily(
  input: JCSBusinessIdentityInput
): JCSBusinessFamily {
  const industry =
    cleanText(
      input.industry
    );

  const businessCategory =
    cleanText(
      input.businessCategory
    );

  const preferredCategory =
    industry ||
    businessCategory;

  const categoryFamily =
    FAMILY_BY_CATEGORY[
      normalized(
        preferredCategory
      )
    ];

  if (
    categoryFamily
  ) {
    return categoryFamily;
  }

  const mode =
    normalized(
      input.businessModeRawValue
    );

  if (
    containsAny(
      mode,
      [
        "restaurant",
        "food",
        "bakery",
        "cafe",
        "coffee",
        "catering",
        "bar ",
        "barbecue",
        "pizza",
      ]
    )
  ) {
    return JCS_BUSINESS_FAMILIES
      .restaurantFood;
  }

  if (
    containsAny(
      mode,
      [
        "transport",
        "logistics",
        "trucking",
        "taxi",
        "delivery",
        "courier",
        "freight",
        "shipping",
        "moving",
      ]
    )
  ) {
    return JCS_BUSINESS_FAMILIES
      .transportationLogistics;
  }

  if (
    containsAny(
      mode,
      [
        "construction",
        "contractor",
        "plumbing",
        "electric",
        "roofing",
        "carpentry",
        "landscaping",
        "masonry",
        "painting",
      ]
    )
  ) {
    return JCS_BUSINESS_FAMILIES
      .constructionTrades;
  }

  if (
    containsAny(
      mode,
      [
        "medical",
        "health",
        "clinic",
        "hospital",
        "dental",
        "pharmacy",
        "therapy",
      ]
    )
  ) {
    return JCS_BUSINESS_FAMILIES
      .healthcare;
  }

  if (
    containsAny(
      mode,
      [
        "salon",
        "beauty",
        "spa",
        "barber",
        "nail",
        "cosmetic",
      ]
    )
  ) {
    return JCS_BUSINESS_FAMILIES
      .beautyWellness;
  }

  if (
    containsAny(
      mode,
      [
        "automotive",
        "auto ",
        "car dealer",
        "mechanic",
        "tire",
        "vehicle",
      ]
    )
  ) {
    return JCS_BUSINESS_FAMILIES
      .automotive;
  }

  if (
    containsAny(
      mode,
      [
        "retail",
        "store",
        "shop",
        "boutique",
        "market",
        "jewelry",
        "ecommerce",
      ]
    )
  ) {
    return JCS_BUSINESS_FAMILIES
      .retailCommerce;
  }

  return JCS_BUSINESS_FAMILIES
    .generalBusiness;
}

// ============================================================
// MARK: - Family Capabilities
// ============================================================

function supportsPOS(
  family: JCSBusinessFamily
): boolean {
  return [
    JCS_BUSINESS_FAMILIES.retailCommerce,
    JCS_BUSINESS_FAMILIES.restaurantFood,
    JCS_BUSINESS_FAMILIES.beautyWellness,
    JCS_BUSINESS_FAMILIES.healthcare,
    JCS_BUSINESS_FAMILIES.automotive,
    JCS_BUSINESS_FAMILIES.fitnessSports,
    JCS_BUSINESS_FAMILIES.hospitalityTravel,
    JCS_BUSINESS_FAMILIES.eventsEntertainment,
    JCS_BUSINESS_FAMILIES.animalServices,
    JCS_BUSINESS_FAMILIES.facilityRepairServices,
    JCS_BUSINESS_FAMILIES.generalBusiness,
  ].some((candidate) => candidate === family);
}

function supportsProducts(
  family: JCSBusinessFamily
): boolean {
  return [
    JCS_BUSINESS_FAMILIES.retailCommerce,
    JCS_BUSINESS_FAMILIES.restaurantFood,
    JCS_BUSINESS_FAMILIES.beautyWellness,
    JCS_BUSINESS_FAMILIES.healthcare,
    JCS_BUSINESS_FAMILIES.constructionTrades,
    JCS_BUSINESS_FAMILIES.transportationLogistics,
    JCS_BUSINESS_FAMILIES.automotive,
    JCS_BUSINESS_FAMILIES.industrialManufacturing,
    JCS_BUSINESS_FAMILIES.agricultureFarming,
    JCS_BUSINESS_FAMILIES.energyUtilities,
    JCS_BUSINESS_FAMILIES.scienceBiotechnology,
    JCS_BUSINESS_FAMILIES.aviationMaritime,
    JCS_BUSINESS_FAMILIES.animalServices,
    JCS_BUSINESS_FAMILIES.facilityRepairServices,
    JCS_BUSINESS_FAMILIES.generalBusiness,
  ].some((candidate) => candidate === family);
}

function supportsInventory(
  family: JCSBusinessFamily
): boolean {
  return supportsProducts(
    family
  );
}

function supportsReturns(
  family: JCSBusinessFamily
): boolean {
  return [
    JCS_BUSINESS_FAMILIES.retailCommerce,
    JCS_BUSINESS_FAMILIES.automotive,
    JCS_BUSINESS_FAMILIES.industrialManufacturing,
    JCS_BUSINESS_FAMILIES.technologyDigital,
    JCS_BUSINESS_FAMILIES.generalBusiness,
  ].some((candidate) => candidate === family);
}

function supportsAppointments(
  family: JCSBusinessFamily
): boolean {
  return [
    JCS_BUSINESS_FAMILIES.beautyWellness,
    JCS_BUSINESS_FAMILIES.healthcare,
    JCS_BUSINESS_FAMILIES.constructionTrades,
    JCS_BUSINESS_FAMILIES.automotive,
    JCS_BUSINESS_FAMILIES.professionalServices,
    JCS_BUSINESS_FAMILIES.realEstateProperty,
    JCS_BUSINESS_FAMILIES.educationTraining,
    JCS_BUSINESS_FAMILIES.fitnessSports,
    JCS_BUSINESS_FAMILIES.hospitalityTravel,
    JCS_BUSINESS_FAMILIES.animalServices,
    JCS_BUSINESS_FAMILIES.childcareFamily,
    JCS_BUSINESS_FAMILIES.seniorCareFuneral,
    JCS_BUSINESS_FAMILIES.facilityRepairServices,
    JCS_BUSINESS_FAMILIES.generalBusiness,
  ].some((candidate) => candidate === family);
}

function supportsProjects(
  family: JCSBusinessFamily
): boolean {
  return [
    JCS_BUSINESS_FAMILIES.constructionTrades,
    JCS_BUSINESS_FAMILIES.professionalServices,
    JCS_BUSINESS_FAMILIES.realEstateProperty,
    JCS_BUSINESS_FAMILIES.technologyDigital,
    JCS_BUSINESS_FAMILIES.creativeMedia,
    JCS_BUSINESS_FAMILIES.eventsEntertainment,
    JCS_BUSINESS_FAMILIES.industrialManufacturing,
    JCS_BUSINESS_FAMILIES.energyUtilities,
    JCS_BUSINESS_FAMILIES.securitySafety,
    JCS_BUSINESS_FAMILIES.scienceBiotechnology,
    JCS_BUSINESS_FAMILIES.facilityRepairServices,
    JCS_BUSINESS_FAMILIES.generalBusiness,
  ].some((candidate) => candidate === family);
}

function supportsTransportation(
  family: JCSBusinessFamily
): boolean {
  return [
    JCS_BUSINESS_FAMILIES.transportationLogistics,
    JCS_BUSINESS_FAMILIES.constructionTrades,
    JCS_BUSINESS_FAMILIES.automotive,
    JCS_BUSINESS_FAMILIES.hospitalityTravel,
    JCS_BUSINESS_FAMILIES.industrialManufacturing,
    JCS_BUSINESS_FAMILIES.agricultureFarming,
    JCS_BUSINESS_FAMILIES.energyUtilities,
    JCS_BUSINESS_FAMILIES.aviationMaritime,
    JCS_BUSINESS_FAMILIES.seniorCareFuneral,
    JCS_BUSINESS_FAMILIES.generalBusiness,
  ].some((candidate) => candidate === family);
}

function supportsReceiving(
  family: JCSBusinessFamily
): boolean {
  return supportsInventory(
    family
  );
}

function supportsShipping(
  family: JCSBusinessFamily
): boolean {
  return [
    JCS_BUSINESS_FAMILIES.retailCommerce,
    JCS_BUSINESS_FAMILIES.transportationLogistics,
    JCS_BUSINESS_FAMILIES.automotive,
    JCS_BUSINESS_FAMILIES.industrialManufacturing,
    JCS_BUSINESS_FAMILIES.agricultureFarming,
    JCS_BUSINESS_FAMILIES.energyUtilities,
    JCS_BUSINESS_FAMILIES.aviationMaritime,
    JCS_BUSINESS_FAMILIES.generalBusiness,
  ].some((candidate) => candidate === family);
}

function supportsBackorders(
  family: JCSBusinessFamily
): boolean {
  return [
    JCS_BUSINESS_FAMILIES.retailCommerce,
    JCS_BUSINESS_FAMILIES.constructionTrades,
    JCS_BUSINESS_FAMILIES.transportationLogistics,
    JCS_BUSINESS_FAMILIES.automotive,
    JCS_BUSINESS_FAMILIES.industrialManufacturing,
    JCS_BUSINESS_FAMILIES.agricultureFarming,
    JCS_BUSINESS_FAMILIES.energyUtilities,
    JCS_BUSINESS_FAMILIES.aviationMaritime,
    JCS_BUSINESS_FAMILIES.generalBusiness,
  ].some((candidate) => candidate === family);
}

function supportsCompliance(
  family: JCSBusinessFamily
): boolean {
  return [
    JCS_BUSINESS_FAMILIES.healthcare,
    JCS_BUSINESS_FAMILIES.constructionTrades,
    JCS_BUSINESS_FAMILIES.transportationLogistics,
    JCS_BUSINESS_FAMILIES.automotive,
    JCS_BUSINESS_FAMILIES.realEstateProperty,
    JCS_BUSINESS_FAMILIES.educationTraining,
    JCS_BUSINESS_FAMILIES.hospitalityTravel,
    JCS_BUSINESS_FAMILIES.industrialManufacturing,
    JCS_BUSINESS_FAMILIES.agricultureFarming,
    JCS_BUSINESS_FAMILIES.nonprofitCommunity,
    JCS_BUSINESS_FAMILIES.financialServices,
    JCS_BUSINESS_FAMILIES.legalGovernment,
    JCS_BUSINESS_FAMILIES.energyUtilities,
    JCS_BUSINESS_FAMILIES.securitySafety,
    JCS_BUSINESS_FAMILIES.scienceBiotechnology,
    JCS_BUSINESS_FAMILIES.aviationMaritime,
    JCS_BUSINESS_FAMILIES.animalServices,
    JCS_BUSINESS_FAMILIES.childcareFamily,
    JCS_BUSINESS_FAMILIES.seniorCareFuneral,
    JCS_BUSINESS_FAMILIES.facilityRepairServices,
    JCS_BUSINESS_FAMILIES.generalBusiness,
  ].some((candidate) => candidate === family);
}

function supportsFacilities(
  family: JCSBusinessFamily
): boolean {
  return [
    JCS_BUSINESS_FAMILIES.restaurantFood,
    JCS_BUSINESS_FAMILIES.healthcare,
    JCS_BUSINESS_FAMILIES.constructionTrades,
    JCS_BUSINESS_FAMILIES.transportationLogistics,
    JCS_BUSINESS_FAMILIES.automotive,
    JCS_BUSINESS_FAMILIES.realEstateProperty,
    JCS_BUSINESS_FAMILIES.educationTraining,
    JCS_BUSINESS_FAMILIES.fitnessSports,
    JCS_BUSINESS_FAMILIES.eventsEntertainment,
    JCS_BUSINESS_FAMILIES.hospitalityTravel,
    JCS_BUSINESS_FAMILIES.industrialManufacturing,
    JCS_BUSINESS_FAMILIES.agricultureFarming,
    JCS_BUSINESS_FAMILIES.nonprofitCommunity,
    JCS_BUSINESS_FAMILIES.legalGovernment,
    JCS_BUSINESS_FAMILIES.energyUtilities,
    JCS_BUSINESS_FAMILIES.securitySafety,
    JCS_BUSINESS_FAMILIES.scienceBiotechnology,
    JCS_BUSINESS_FAMILIES.aviationMaritime,
    JCS_BUSINESS_FAMILIES.animalServices,
    JCS_BUSINESS_FAMILIES.childcareFamily,
    JCS_BUSINESS_FAMILIES.seniorCareFuneral,
    JCS_BUSINESS_FAMILIES.facilityRepairServices,
    JCS_BUSINESS_FAMILIES.generalBusiness,
  ].some((candidate) => candidate === family);
}

// ============================================================
// MARK: - Customer Policies
// ============================================================

function shoppingCustomerPolicy():
  AppUserPermissions {
  return {
    ...createEmptyAppUserPermissions(),

    canAccessCustomerHome: true,
    canAccessCatalog: true,
    canAccessFavorites: true,
    canAccessCart: true,
    canAccessCheckout: true,
    canAccessCustomerAccount: true,
    canAccessOrderHistory: true,
    canAccessTracking: true,
  };
}

function projectCustomerPolicy():
  AppUserPermissions {
  return {
    ...createEmptyAppUserPermissions(),

    canAccessCustomerHome: true,
    canAccessCustomerAccount: true,
    canAccessOrderHistory: true,
    canAccessTracking: true,

    canAccessProjects: true,
    canViewProjectDetails: true,
    canViewProjectPhotos: true,
    canViewProgressPhotos: true,
    canViewProjectGallery: true,
    canCommentOnProjects: true,
  };
}

function transportationCustomerPolicy():
  AppUserPermissions {
  return {
    ...createEmptyAppUserPermissions(),

    canAccessCustomerHome: true,
    canAccessCustomerAccount: true,
    canAccessOrderHistory: true,
    canAccessTracking: true,
    canAccessCheckout: true,
  };
}

function appointmentCustomerPolicy(
  includesCatalog: boolean
): AppUserPermissions {
  return {
    ...createEmptyAppUserPermissions(),

    canAccessCustomerHome: true,
    canAccessCustomerAccount: true,
    canAccessOrderHistory: true,
    canAccessTracking: true,
    canAccessCheckout: true,

    canAccessCatalog:
      includesCatalog,

    canAccessFavorites:
      includesCatalog,

    canAccessCart:
      includesCatalog,
  };
}

function customerPolicy(
  family: JCSBusinessFamily
): AppUserPermissions {
  switch (
    family
  ) {
    case JCS_BUSINESS_FAMILIES
      .constructionTrades:
    case JCS_BUSINESS_FAMILIES
      .realEstateProperty:
    case JCS_BUSINESS_FAMILIES
      .professionalServices:
      return projectCustomerPolicy();

    case JCS_BUSINESS_FAMILIES
      .transportationLogistics:
    case JCS_BUSINESS_FAMILIES
      .aviationMaritime:
      return transportationCustomerPolicy();

    case JCS_BUSINESS_FAMILIES
      .healthcare:
    case JCS_BUSINESS_FAMILIES
      .seniorCareFuneral:
    case JCS_BUSINESS_FAMILIES
      .childcareFamily:
      return appointmentCustomerPolicy(
        false
      );

    case JCS_BUSINESS_FAMILIES
      .beautyWellness:
    case JCS_BUSINESS_FAMILIES
      .fitnessSports:
    case JCS_BUSINESS_FAMILIES
      .animalServices:
    case JCS_BUSINESS_FAMILIES
      .educationTraining:
      return appointmentCustomerPolicy(
        true
      );

    default:
      return shoppingCustomerPolicy();
  }
}

// ============================================================
// MARK: - Provider
// ============================================================

function providerPolicy(
  family: JCSBusinessFamily
): AppUserPermissions {
  const policy =
    createEmptyAppUserPermissions();

  policy.canAccessDashboard =
    true;

  if (
    supportsProducts(
      family
    )
  ) {
    policy.canAccessProducts =
      true;
  }

  if (
    supportsInventory(
      family
    )
  ) {
    policy.canAccessInventory =
      true;
  }

  if (
    supportsTransportation(
      family
    )
  ) {
    policy.canAccessTransportation =
      true;
  }

  if (
    supportsReceiving(
      family
    )
  ) {
    policy.canAccessReceiving =
      true;
  }

  if (
    supportsShipping(
      family
    )
  ) {
    policy.canAccessShipping =
      true;
  }

  if (
    supportsCompliance(
      family
    )
  ) {
    policy.canAccessCompliance =
      true;
  }

  return policy;
}

// ============================================================
// MARK: - Employee
// ============================================================

function employeePolicy(
  family: JCSBusinessFamily
): AppUserPermissions {
  const policy =
    createEmptyAppUserPermissions();

  policy.canAccessDashboard =
    true;

  policy.canAccessOrders =
    true;

  policy.canAccessServices =
    true;

  if (
    supportsPOS(
      family
    )
  ) {
    policy.canAccessPOS =
      true;
  }

  if (
    supportsProducts(
      family
    )
  ) {
    policy.canAccessProducts =
      true;
  }

  if (
    supportsInventory(
      family
    )
  ) {
    policy.canAccessInventory =
      true;
  }

  if (
    supportsReturns(
      family
    )
  ) {
    policy.canAccessReturns =
      true;
  }

  if (
    supportsAppointments(
      family
    )
  ) {
    policy.canAccessAppointments =
      true;
  }

  if (
    supportsTransportation(
      family
    )
  ) {
    policy.canAccessTransportation =
      true;
  }

  if (
    supportsReceiving(
      family
    )
  ) {
    policy.canAccessReceiving =
      true;
  }

  if (
    supportsShipping(
      family
    )
  ) {
    policy.canAccessShipping =
      true;
  }

  if (
    supportsCompliance(
      family
    )
  ) {
    policy.canAccessCompliance =
      true;
  }

  if (
    supportsFacilities(
      family
    )
  ) {
    policy.canAccessFacilities =
      true;
  }

  return policy;
}

// ============================================================
// MARK: - Manager
// ============================================================

function managerPolicy(
  family: JCSBusinessFamily
): AppUserPermissions {
  const policy =
    employeePolicy(
      family
    );

  policy.canManageCustomers =
    true;

  policy.canManageEmployees =
    true;

  policy.canManageProviders =
    true;

  policy.canAccessInsights =
    true;

  policy.canExportReports =
    true;

  policy.canSeeFinancials =
    true;

  policy.canSeeCostsAndProfit =
    true;

  if (
    supportsProjects(
      family
    )
  ) {
    policy.canAccessProjects =
      true;

    policy.canViewProjectDetails =
      true;

    policy.canViewProjectPhotos =
      true;

    policy.canViewProgressPhotos =
      true;

    policy.canViewProjectGallery =
      true;

    policy.canCreateProjects =
      true;

    policy.canEditOwnProjects =
      true;

    policy.canUploadProjectPhotos =
      true;

    policy.canCommentOnProjects =
      true;
  }

  if (
    supportsCompliance(
      family
    )
  ) {
    policy.canAccessCompliance =
      true;

    policy.canManageCompliance =
      true;
  }

  if (
    supportsFacilities(
      family
    )
  ) {
    policy.canAccessFacilities =
      true;

    policy.canManageFacilities =
      true;
  }

  if (
    supportsBackorders(
      family
    )
  ) {
    policy.canAccessBackorders =
      true;
  }

  return policy;
}

// ============================================================
// MARK: - Administrator / Business Owner
// ============================================================

function administratorPolicy(
  family: JCSBusinessFamily
): AppUserPermissions {
  const policy =
    managerPolicy(
      family
    );

  policy.canManageAppUsers =
    true;

  policy.canManageSettings =
    true;

  policy.canSeeFinancials =
    true;

  policy.canSeeCostsAndProfit =
    true;

  policy.canExportReports =
    true;

  return policy;
}

function businessOwnerPolicy(
  family: JCSBusinessFamily
): AppUserPermissions {
  const policy =
    administratorPolicy(
      family
    );

  policy.canManageAppUsers =
    true;

  policy.canManageSettings =
    true;

  return policy;
}

// ============================================================
// MARK: - Platform Administrator
// ============================================================

function platformAdministratorPolicy():
  AppUserPermissions {
  const policy =
    createEmptyAppUserPermissions();

  (
    Object.keys(
      policy
    ) as Array<
      keyof AppUserPermissions
    >
  ).forEach(
    (key) => {
      policy[key] =
        true;
    }
  );

  return policy;
}

// ============================================================
// MARK: - Public Role Policy Engine
// ============================================================

export interface JCSRoleAccessPolicyInput
  extends JCSBusinessIdentityInput {
  role: AppUserRole;
  isBusinessOwner?: boolean;
  isPlatformAdministrator?: boolean;
}

export function jcsRoleAccessPolicy(
  input: JCSRoleAccessPolicyInput
): AppUserPermissions {
  if (
    input.isPlatformAdministrator
  ) {
    return platformAdministratorPolicy();
  }

  const family =
    resolveJCSBusinessFamily(
      input
    );

  if (
    input.isBusinessOwner
  ) {
    return businessOwnerPolicy(
      family
    );
  }

  switch (
    input.role
  ) {
    case APP_USER_ROLES.admin:
      return administratorPolicy(
        family
      );

    case APP_USER_ROLES.manager:
      return managerPolicy(
        family
      );

    case APP_USER_ROLES.customer:
      return customerPolicy(
        family
      );

    case APP_USER_ROLES.provider:
      return providerPolicy(
        family
      );

    case APP_USER_ROLES.employee:
    default:
      return employeePolicy(
        family
      );
  }
}

// ============================================================
// MARK: - Engine Facade
// ============================================================

export class JCSRoleAccessPolicyEngine {
  static policy(
    input: JCSRoleAccessPolicyInput
  ): AppUserPermissions {
    return jcsRoleAccessPolicy(
      input
    );
  }

  static family(
    input: JCSBusinessIdentityInput
  ): JCSBusinessFamily {
    return resolveJCSBusinessFamily(
      input
    );
  }
}
