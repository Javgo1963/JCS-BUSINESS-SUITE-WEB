//
// JCS Business Suite
// BusinessConfigurationEngine.ts
//
// Central business-capability engine shared by the Dashboard,
// POS, Inventory, Orders, Reports and Executive Center.
//

// MARK: - Capability Keys

export type BusinessCapabilityKey =
  | "dashboard"
  | "customerPortal"
  | "restaurantStore"
  | "catalog"
  | "favorites"
  | "account"
  | "pos"
  | "cashRegister"
  | "insights"
  | "sales"
  | "products"
  | "inventory"
  | "orders"
  | "services"
  | "transportation"
  | "receiving"
  | "receivingHistory"
  | "shipping"
  | "shipments"
  | "appointments"
  | "backorders"
  | "customers"
  | "employees"
  | "providers"
  | "users"
  | "appSettings"
  | "businessInvitations"
  | "events"
  | "accounting"
  | "returns"
  | "compliance"
  | "facilities"
  | "payroll"
  | "reports"
  | "notifications"
  | "executiveCenter";

// MARK: - Configuration Input

export interface BusinessConfigurationInput {
  businessModeKey?: string | null;
  businessModeName?: string | null;

  industryCategoryKey?: string | null;
  industryCategoryTitle?: string | null;

  recommendedModules?: readonly string[] | null;
  enabledModules?: readonly string[] | null;
  disabledModules?: readonly string[] | null;
}

// MARK: - Business Configuration

export interface BusinessConfiguration {
  businessModeKey: string;
  businessModeName: string;

  industryCategoryKey: string;
  industryCategoryTitle: string;

  primaryWorkflow: string;

  recommendedModules: ReadonlySet<string>;
  enabledModules: ReadonlySet<string>;
  disabledModules: ReadonlySet<string>;

  supportsDashboard: boolean;

  supportsCustomerPortal: boolean;
  supportsRestaurantStore: boolean;
  supportsCatalog: boolean;
  supportsFavorites: boolean;
  supportsAccount: boolean;

  supportsPOS: boolean;
  supportsCashRegister: boolean;
  supportsInsights: boolean;
  supportsSales: boolean;

  supportsProducts: boolean;
  supportsInventory: boolean;
  supportsOrders: boolean;
  supportsServices: boolean;
  supportsTransportation: boolean;
  supportsReceiving: boolean;
  supportsReceivingHistory: boolean;
  supportsShipping: boolean;
  supportsShipments: boolean;
  supportsAppointments: boolean;
  supportsBackorders: boolean;
  supportsReturns: boolean;

  supportsCustomers: boolean;
  supportsEmployees: boolean;
  supportsProviders: boolean;
  supportsUsers: boolean;
  supportsAppSettings: boolean;
  supportsBusinessInvitations: boolean;

  supportsEvents: boolean;
  supportsAccounting: boolean;
  supportsCompliance: boolean;
  supportsFacilities: boolean;
  supportsPayroll: boolean;
  supportsReports: boolean;
  supportsNotifications: boolean;
  supportsExecutiveCenter: boolean;

  supportsRestaurant: boolean;
  supportsRetail: boolean;
  supportsMedical: boolean;
  supportsAutomotive: boolean;
  supportsRental: boolean;
  supportsWholesale: boolean;
  supportsManufacturing: boolean;
  supportsConstruction: boolean;
  supportsProfessionalServices: boolean;

  hasCapability: (
    capability: BusinessCapabilityKey | string
  ) => boolean;

  hasEnabledModule: (moduleKey: string) => boolean;
}

// MARK: - Preset

interface BusinessModePreset {
  aliases: readonly string[];
  primaryWorkflow: string;
  capabilities: readonly BusinessCapabilityKey[];
}

// MARK: - Module Normalization

const MODULE_ALIASES: Readonly<Record<string, string>> = {
  dashboard: "dashboard",

  "customer-home": "customerPortal",
  customerhome: "customerPortal",
  "customer-portal": "customerPortal",
  customerportal: "customerPortal",
  storefront: "customerPortal",

  "restaurant-store": "restaurantStore",
  restaurantstore: "restaurantStore",
  "restaurant-menu": "restaurantStore",

  catalog: "catalog",
  products: "products",
  product: "products",
  sku: "products",
  "products-sku": "products",

  favorites: "favorites",
  account: "account",

  pos: "pos",
  "point-of-sale": "pos",
  pointofsale: "pos",

  "cash-register": "cashRegister",
  cashregister: "cashRegister",
  register: "cashRegister",

  insights: "insights",
  analytics: "insights",
  "business-insights": "insights",

  sales: "sales",
  "sales-dashboard": "sales",

  inventory: "inventory",

  orders: "orders",
  order: "orders",

  services: "services",
  service: "services",

  transportation: "transportation",
  "transportation-hub": "transportation",
  fleet: "transportation",
  delivery: "transportation",

  receiving: "receiving",
  "receiving-history": "receivingHistory",
  receivinghistory: "receivingHistory",

  shipping: "shipping",
  shipments: "shipments",
  shipment: "shipments",

  appointments: "appointments",
  appointment: "appointments",
  calendar: "appointments",
  bookings: "appointments",

  backorders: "backorders",
  backorder: "backorders",

  returns: "returns",
  refunds: "returns",
  "returns-refunds": "returns",

  customers: "customers",
  customer: "customers",

  employees: "employees",
  employee: "employees",

  providers: "providers",
  provider: "providers",
  suppliers: "providers",

  users: "users",
  roles: "users",
  permissions: "users",

  settings: "appSettings",
  "app-settings": "appSettings",
  appsettings: "appSettings",

  invitations: "businessInvitations",
  invites: "businessInvitations",
  "business-invitations": "businessInvitations",
  businessinvitations: "businessInvitations",

  events: "events",
  projects: "events",
  jobs: "events",

  accounting: "accounting",
  finance: "accounting",

  compliance: "compliance",

  facilities: "facilities",
  buildings: "facilities",
  equipment: "facilities",

  payroll: "payroll",

  reports: "reports",
  reporting: "reports",

  notifications: "notifications",

  "executive-center": "executiveCenter",
  executivecenter: "executiveCenter",
};

// MARK: - Shared Capabilities

const CORE_CAPABILITIES: readonly BusinessCapabilityKey[] = [
  "dashboard",
  "customerPortal",
  "account",
  "customers",
  "users",
  "appSettings",
  "businessInvitations",
  "reports",
  "notifications",
];

const COMMERCE_CAPABILITIES: readonly BusinessCapabilityKey[] = [
  "catalog",
  "favorites",
  "pos",
  "cashRegister",
  "insights",
  "sales",
  "products",
  "inventory",
  "orders",
  "receiving",
  "receivingHistory",
  "shipping",
  "shipments",
  "backorders",
  "returns",
  "providers",
];

const SERVICE_CAPABILITIES: readonly BusinessCapabilityKey[] = [
  "pos",
  "cashRegister",
  "insights",
  "sales",
  "orders",
  "services",
  "appointments",
  "customers",
  "employees",
  "providers",
  "returns",
];

const MANAGEMENT_CAPABILITIES: readonly BusinessCapabilityKey[] = [
  "employees",
  "providers",
  "events",
  "accounting",
  "payroll",
  "reports",
];

// MARK: - Business Mode Presets

const BUSINESS_MODE_PRESETS: readonly BusinessModePreset[] = [
  {
    aliases: [
      "restaurant",
      "food-service",
      "foodservice",
      "cafe",
      "coffee-shop",
      "bakery",
      "bar",
    ],
    primaryWorkflow:
      "Manage menus, dining orders, checkout, employees and customer service.",
    capabilities: [
      ...CORE_CAPABILITIES,
      ...COMMERCE_CAPABILITIES,
      ...MANAGEMENT_CAPABILITIES,
      "restaurantStore",
      "services",
      "appointments",
    ],
  },

  {
    aliases: [
      "retail",
      "retail-store",
      "store",
      "shop",
      "ecommerce",
      "e-commerce",
    ],
    primaryWorkflow:
      "Manage products, inventory, customers, orders and point-of-sale operations.",
    capabilities: [
      ...CORE_CAPABILITIES,
      ...COMMERCE_CAPABILITIES,
      ...MANAGEMENT_CAPABILITIES,
    ],
  },

  {
    aliases: [
      "automotive",
      "auto",
      "car-dealership",
      "dealership",
      "vehicle-sales",
      "auto-repair",
      "repair-shop",
    ],
    primaryWorkflow:
      "Manage vehicles, products, services, customers, sales and transportation.",
    capabilities: [
      ...CORE_CAPABILITIES,
      ...COMMERCE_CAPABILITIES,
      ...SERVICE_CAPABILITIES,
      ...MANAGEMENT_CAPABILITIES,
      "transportation",
      "compliance",
      "facilities",
    ],
  },

  {
    aliases: [
      "service",
      "service-business",
      "professional-services",
      "consulting",
      "salon",
      "spa",
      "cleaning",
    ],
    primaryWorkflow:
      "Manage services, appointments, customers, employees and payments.",
    capabilities: [
      ...CORE_CAPABILITIES,
      ...SERVICE_CAPABILITIES,
      ...MANAGEMENT_CAPABILITIES,
    ],
  },

  {
    aliases: [
      "medical",
      "healthcare",
      "clinic",
      "dental",
      "therapy",
      "wellness",
    ],
    primaryWorkflow:
      "Manage appointments, services, customers, compliance and payments.",
    capabilities: [
      ...CORE_CAPABILITIES,
      ...SERVICE_CAPABILITIES,
      ...MANAGEMENT_CAPABILITIES,
      "compliance",
      "facilities",
    ],
  },

  {
    aliases: [
      "rental",
      "equipment-rental",
      "vehicle-rental",
      "property-rental",
    ],
    primaryWorkflow:
      "Manage rental inventory, customers, reservations, payments and returns.",
    capabilities: [
      ...CORE_CAPABILITIES,
      ...COMMERCE_CAPABILITIES,
      ...SERVICE_CAPABILITIES,
      ...MANAGEMENT_CAPABILITIES,
      "transportation",
      "appointments",
      "facilities",
    ],
  },

  {
    aliases: [
      "wholesale",
      "distribution",
      "distributor",
      "warehouse",
    ],
    primaryWorkflow:
      "Manage high-volume inventory, orders, receiving, shipping and providers.",
    capabilities: [
      ...CORE_CAPABILITIES,
      ...COMMERCE_CAPABILITIES,
      ...MANAGEMENT_CAPABILITIES,
      "transportation",
      "facilities",
    ],
  },

  {
    aliases: [
      "transportation",
      "logistics",
      "delivery",
      "trucking",
      "fleet",
    ],
    primaryWorkflow:
      "Manage transportation, fleet operations, shipping, deliveries and customers.",
    capabilities: [
      ...CORE_CAPABILITIES,
      ...SERVICE_CAPABILITIES,
      ...MANAGEMENT_CAPABILITIES,
      "transportation",
      "shipping",
      "shipments",
      "receiving",
      "receivingHistory",
      "compliance",
      "facilities",
    ],
  },

  {
    aliases: [
      "manufacturing",
      "manufacturer",
      "production",
      "factory",
    ],
    primaryWorkflow:
      "Manage products, materials, inventory, production, receiving and shipping.",
    capabilities: [
      ...CORE_CAPABILITIES,
      ...COMMERCE_CAPABILITIES,
      ...MANAGEMENT_CAPABILITIES,
      "transportation",
      "compliance",
      "facilities",
    ],
  },

  {
    aliases: [
      "construction",
      "contractor",
      "general-contractor",
      "home-services",
    ],
    primaryWorkflow:
      "Manage projects, services, employees, equipment, customers and accounting.",
    capabilities: [
      ...CORE_CAPABILITIES,
      ...SERVICE_CAPABILITIES,
      ...MANAGEMENT_CAPABILITIES,
      "transportation",
      "compliance",
      "facilities",
    ],
  },

  {
    aliases: [
      "general",
      "general-business",
      "custom",
      "other",
      "multi-business",
    ],
    primaryWorkflow:
      "Manage customers, operations, sales and business administration.",
    capabilities: [
      ...CORE_CAPABILITIES,
      ...COMMERCE_CAPABILITIES,
      ...SERVICE_CAPABILITIES,
      ...MANAGEMENT_CAPABILITIES,
      "transportation",
      "compliance",
      "facilities",
    ],
  },
];

// MARK: - Helpers

function normalizeKey(value?: string | null): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeModuleKey(value: string): string {
  const normalized = normalizeKey(value);

  return MODULE_ALIASES[normalized] ?? normalized;
}

function normalizeModuleSet(
  modules?: readonly string[] | null
): Set<string> {
  const result = new Set<string>();

  for (const moduleKey of modules ?? []) {
    const normalizedModule = normalizeModuleKey(moduleKey);

    if (normalizedModule) {
      result.add(normalizedModule);
    }
  }

  return result;
}

function addCapabilities(
  target: Set<string>,
  capabilities: readonly BusinessCapabilityKey[]
): void {
  for (const capability of capabilities) {
    target.add(capability);
  }
}

function findPreset(
  businessModeKey: string,
  businessModeName: string,
  industryCategoryKey: string,
  industryCategoryTitle: string
): BusinessModePreset {
  const possibleKeys = [
    businessModeKey,
    businessModeName,
    industryCategoryKey,
    industryCategoryTitle,
  ]
    .map(normalizeKey)
    .filter(Boolean);

  const matchedPreset = BUSINESS_MODE_PRESETS.find((preset) =>
    preset.aliases.some((alias) => {
      const normalizedAlias = normalizeKey(alias);

      return possibleKeys.some(
        (possibleKey) =>
          possibleKey === normalizedAlias ||
          possibleKey.includes(normalizedAlias) ||
          normalizedAlias.includes(possibleKey)
      );
    })
  );

  return (
    matchedPreset ??
    BUSINESS_MODE_PRESETS[
      BUSINESS_MODE_PRESETS.length - 1
    ]
  );
}

function titleFromKey(value: string): string {
  if (!value) {
    return "";
  }

  return value
    .split("-")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

// MARK: - Engine

export class BusinessConfigurationEngine {
  static configuration(
    input: BusinessConfigurationInput
  ): BusinessConfiguration {
    const businessModeKey =
      normalizeKey(input.businessModeKey) ||
      "general-business";

    const businessModeName =
      input.businessModeName?.trim() ||
      titleFromKey(businessModeKey) ||
      "General Business";

    const industryCategoryKey =
      normalizeKey(input.industryCategoryKey);

    const industryCategoryTitle =
      input.industryCategoryTitle?.trim() ||
      titleFromKey(industryCategoryKey);

    const preset = findPreset(
      businessModeKey,
      businessModeName,
      industryCategoryKey,
      industryCategoryTitle
    );

    const recommendedModules = normalizeModuleSet(
      input.recommendedModules
    );

    const explicitlyEnabledModules = normalizeModuleSet(
      input.enabledModules
    );

    const disabledModules = normalizeModuleSet(
      input.disabledModules
    );

    const supportedCapabilities = new Set<string>();

    addCapabilities(
      supportedCapabilities,
      preset.capabilities
    );

    for (const moduleKey of recommendedModules) {
      supportedCapabilities.add(moduleKey);
    }

    /*
     * An explicitly enabled module is considered supported even when
     * it was not included in the original business-mode preset.
     *
     * This allows PlatformAdmin to add modules to any business.
     */
    for (const moduleKey of explicitlyEnabledModules) {
      supportedCapabilities.add(moduleKey);
    }

    for (const moduleKey of disabledModules) {
      supportedCapabilities.delete(moduleKey);
    }

    /*
     * When enabledModules exists, it is the operational source of truth.
     * Presets still describe what the business type supports, but the
     * Dashboard must only expose provisioned modules.
     *
     * Empty enabledModules means the business is still using its preset
     * or recommended-module defaults.
     */
    const operationalModules =
      explicitlyEnabledModules.size > 0
        ? new Set(explicitlyEnabledModules)
        : recommendedModules.size > 0
          ? new Set(recommendedModules)
          : new Set(supportedCapabilities);

    operationalModules.add("dashboard");
    operationalModules.add("account");
    operationalModules.add("appSettings");

    for (const moduleKey of disabledModules) {
      operationalModules.delete(moduleKey);
    }

    const supports = (
      capability: BusinessCapabilityKey | string
    ): boolean =>
      supportedCapabilities.has(
        normalizeModuleKey(capability)
      );

    const isOperationallyEnabled = (
      moduleKey: string
    ): boolean =>
      operationalModules.has(
        normalizeModuleKey(moduleKey)
      );

    const normalizedModeSearchText = [
      businessModeKey,
      businessModeName,
      industryCategoryKey,
      industryCategoryTitle,
    ]
      .join(" ")
      .toLowerCase();

    return {
      businessModeKey,
      businessModeName,

      industryCategoryKey,
      industryCategoryTitle,

      primaryWorkflow: preset.primaryWorkflow,

      recommendedModules,
      enabledModules: operationalModules,
      disabledModules,

      supportsDashboard: supports("dashboard"),

      supportsCustomerPortal: supports(
        "customerPortal"
      ),

      supportsRestaurantStore: supports(
        "restaurantStore"
      ),

      supportsCatalog: supports("catalog"),
      supportsFavorites: supports("favorites"),
      supportsAccount: supports("account"),

      supportsPOS: supports("pos"),

      supportsCashRegister: supports(
        "cashRegister"
      ),

      supportsInsights: supports("insights"),
      supportsSales: supports("sales"),

      supportsProducts: supports("products"),
      supportsInventory: supports("inventory"),
      supportsOrders: supports("orders"),
      supportsServices: supports("services"),

      supportsTransportation: supports(
        "transportation"
      ),

      supportsReceiving: supports("receiving"),

      supportsReceivingHistory: supports(
        "receivingHistory"
      ),

      supportsShipping: supports("shipping"),
      supportsShipments: supports("shipments"),

      supportsAppointments: supports(
        "appointments"
      ),

      supportsBackorders: supports("backorders"),
      supportsReturns: supports("returns"),

      supportsCustomers: supports("customers"),
      supportsEmployees: supports("employees"),
      supportsProviders: supports("providers"),
      supportsUsers: supports("users"),

      supportsAppSettings: supports(
        "appSettings"
      ),

      supportsBusinessInvitations: supports(
        "businessInvitations"
      ),

      supportsEvents: supports("events"),
      supportsAccounting: supports("accounting"),
      supportsCompliance: supports("compliance"),
      supportsFacilities: supports("facilities"),
      supportsPayroll: supports("payroll"),
      supportsReports: supports("reports"),

      supportsNotifications: supports(
        "notifications"
      ),

      supportsExecutiveCenter: supports(
        "executiveCenter"
      ),

      supportsRestaurant:
        normalizedModeSearchText.includes(
          "restaurant"
        ) ||
        normalizedModeSearchText.includes("food") ||
        normalizedModeSearchText.includes("cafe"),

      supportsRetail:
        normalizedModeSearchText.includes("retail") ||
        normalizedModeSearchText.includes("store") ||
        normalizedModeSearchText.includes("shop"),

      supportsMedical:
        normalizedModeSearchText.includes("medical") ||
        normalizedModeSearchText.includes(
          "healthcare"
        ) ||
        normalizedModeSearchText.includes("clinic"),

      supportsAutomotive:
        normalizedModeSearchText.includes(
          "automotive"
        ) ||
        normalizedModeSearchText.includes(
          "dealership"
        ) ||
        normalizedModeSearchText.includes("vehicle") ||
        normalizedModeSearchText.includes("auto"),

      supportsRental:
        normalizedModeSearchText.includes("rental"),

      supportsWholesale:
        normalizedModeSearchText.includes(
          "wholesale"
        ) ||
        normalizedModeSearchText.includes(
          "distribution"
        ),

      supportsManufacturing:
        normalizedModeSearchText.includes(
          "manufacturing"
        ) ||
        normalizedModeSearchText.includes(
          "production"
        ) ||
        normalizedModeSearchText.includes("factory"),

      supportsConstruction:
        normalizedModeSearchText.includes(
          "construction"
        ) ||
        normalizedModeSearchText.includes(
          "contractor"
        ),

      supportsProfessionalServices:
        normalizedModeSearchText.includes(
          "professional"
        ) ||
        normalizedModeSearchText.includes(
          "consulting"
        ) ||
        normalizedModeSearchText.includes("service"),

      hasCapability: supports,

      hasEnabledModule: isOperationallyEnabled,
    };
  }
}

// MARK: - Convenience Function

export function createBusinessConfiguration(
  input: BusinessConfigurationInput
): BusinessConfiguration {
  return BusinessConfigurationEngine.configuration(
    input
  );
}