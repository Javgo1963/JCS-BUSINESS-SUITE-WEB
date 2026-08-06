//
// JCS Business Suite
// DashboardModuleRegistry.ts
//
// Central source of truth for Dashboard cards, routes,
// sections, business capabilities and access rules.
//

import type {
  BusinessCapabilityKey,
  BusinessConfiguration,
} from "@/core/business-mode/BusinessConfigurationEngine";

import type {
  DashboardAccess,
} from "./DashboardAccess";

import {
  DashboardRoute,
  DashboardSection,
  type DashboardItem,
} from "./DashboardTypes";

// MARK: - Extended Dashboard Module

export interface DashboardModuleDefinition
  extends DashboardItem {
  /**
   * Capability supported by the selected business mode.
   *
   * Example:
   * - inventory
   * - appointments
   * - transportation
   */
  capability?: BusinessCapabilityKey;

  /**
   * Operational module key stored in Firestore.
   *
   * The module must normally appear in enabledModules.
   */
  moduleKey?: string;

  /**
   * Module remains available based on role even when it is not
   * explicitly listed in enabledModules.
   *
   * Use this only for foundational administrative functions.
   */
  roleControlled?: boolean;

  /**
   * Roles allowed to access this module.
   */
  allowedRoles?: readonly DashboardRole[];

  /**
   * A user with at least one listed permission may access it.
   */
  anyPermissions?: readonly string[];

  /**
   * A user must possess every listed permission.
   */
  allPermissions?: readonly string[];

  /**
   * Whether the module should be presented in the hero shortcuts.
   */
  heroShortcut?: boolean;

  /**
   * Position used to sort cards inside a section.
   */
  sortOrder: number;

  /**
   * Whether PlatformAdmin can always access the module.
   *
   * Defaults to true.
   */
  platformOverride?: boolean;

  /**
   * Module is visible only to PlatformAdmin.
   */
  platformOnly?: boolean;
}

// MARK: - Dashboard Roles

export type DashboardRole =
  | "platformAdmin"
  | "businessOwner"
  | "businessAdmin"
  | "admin"
  | "manager"
  | "employee"
  | "customer"
  | "provider";

// MARK: - Visibility Context

export interface DashboardModuleVisibilityContext {
  access: DashboardAccess;
  configuration: BusinessConfiguration;
}

// MARK: - Common Role Groups

const BUSINESS_LEADERSHIP_ROLES: readonly DashboardRole[] = [
  "businessOwner",
  "businessAdmin",
  "admin",
  "manager",
];

const BUSINESS_TEAM_ROLES: readonly DashboardRole[] = [
  "businessOwner",
  "businessAdmin",
  "admin",
  "manager",
  "employee",
];

const BUSINESS_ADMINISTRATION_ROLES: readonly DashboardRole[] = [
  "businessOwner",
  "businessAdmin",
  "admin",
];

// MARK: - Registry

export const DASHBOARD_MODULE_REGISTRY:
  readonly DashboardModuleDefinition[] = [
    // =========================================================
    // STORE
    // =========================================================

    {
      id: "customer-home",
      title: "CUSTOMER HOME",
      subtitle: "Shopping home",
      icon: "house",
      section: DashboardSection.Store,
      route: DashboardRoute.CustomerHome,
      capability: "customerPortal",
      moduleKey: "customerPortal",
      sortOrder: 10,
    },

    {
      id: "restaurant-store",
      title: "RESTAURANT STORE",
      subtitle: "Restaurant menu & ordering",
      icon: "utensils",
      section: DashboardSection.Store,
      route: DashboardRoute.RestaurantStore,
      capability: "restaurantStore",
      moduleKey: "restaurantStore",
      sortOrder: 20,
    },

    {
      id: "catalog",
      title: "CATALOG",
      subtitle: "Browse products",
      icon: "shopping-bag",
      section: DashboardSection.Store,
      route: DashboardRoute.Catalog,
      capability: "catalog",
      moduleKey: "catalog",
      sortOrder: 30,
    },

    {
      id: "favorites",
      title: "FAVORITES",
      subtitle: "Saved products",
      icon: "heart",
      section: DashboardSection.Store,
      route: DashboardRoute.Favorites,
      capability: "favorites",
      moduleKey: "favorites",
      sortOrder: 40,
    },

    {
      id: "account",
      title: "ACCOUNT",
      subtitle: "Profile",
      icon: "circle-user-round",
      section: DashboardSection.Store,
      route: DashboardRoute.Account,
      capability: "account",
      moduleKey: "account",
      roleControlled: true,
      sortOrder: 50,
    },

    // =========================================================
    // BUSINESS
    // =========================================================

    {
      id: "pos",
      title: "POINT OF SALE",
      subtitle: "Checkout",
      icon: "credit-card",
      section: DashboardSection.Business,
      route: DashboardRoute.POS,
      capability: "pos",
      moduleKey: "pos",
      requiredModules: ["pos"],
      anyPermissions: [
        "pos.view",
        "pos.use",
        "sales.create",
      ],
      heroShortcut: true,
      sortOrder: 10,
    },

    {
      id: "cash-register",
      title: "CASH REGISTER",
      subtitle: "Restaurant • Retail POS",
      icon: "scan-line",
      section: DashboardSection.Business,
      route: DashboardRoute.CashRegister,
      capability: "cashRegister",
      moduleKey: "cashRegister",
      requiredModules: ["cash-register"],
      allowedRoles: BUSINESS_TEAM_ROLES,
      anyPermissions: [
        "cash-register.view",
        "cash-register.use",
        "pos.use",
      ],
      sortOrder: 20,
    },

    {
      id: "insights",
      title: "INSIGHTS",
      subtitle: "Analytics",
      icon: "chart-no-axes-combined",
      section: DashboardSection.Business,
      route: DashboardRoute.Insights,
      capability: "insights",
      moduleKey: "insights",
      requiredModules: ["insights"],
      anyPermissions: [
        "insights.view",
        "analytics.view",
        "reports.view",
      ],
      heroShortcut: true,
      sortOrder: 30,
    },

    {
      id: "accounting",
      title: "ACCOUNTING",
      subtitle: "Accounting",
      icon: "circle-dollar-sign",
      section: DashboardSection.Business,
      route: DashboardRoute.Accounting,
      capability: "accounting",
      moduleKey: "accounting",
      requiredModules: ["accounting"],
      allowedRoles: BUSINESS_LEADERSHIP_ROLES,
      anyPermissions: [
        "accounting.view",
        "accounting.manage",
      ],
      sortOrder: 40,
    },

    {
      id: "sales",
      title: "SALES",
      subtitle: "Performance",
      icon: "chart-line",
      section: DashboardSection.Business,
      route: DashboardRoute.Sales,
      capability: "sales",
      moduleKey: "sales",
      requiredModules: ["sales"],
      anyPermissions: [
        "sales.view",
        "sales-dashboard.view",
        "reports.view",
      ],
      sortOrder: 50,
    },

    // =========================================================
    // OPERATIONS
    // =========================================================

    {
      id: "products",
      title: "PRODUCTS & SKU",
      subtitle: "Manage products",
      icon: "package",
      section: DashboardSection.Operations,
      route: DashboardRoute.Products,
      capability: "products",
      moduleKey: "products",
      requiredModules: ["products"],
      anyPermissions: [
        "products.view",
        "products.manage",
        "inventory.view",
      ],
      sortOrder: 10,
    },

    {
      id: "inventory",
      title: "INVENTORY",
      subtitle: "Track stock",
      icon: "archive",
      section: DashboardSection.Operations,
      route: DashboardRoute.Inventory,
      capability: "inventory",
      moduleKey: "inventory",
      requiredModules: ["inventory"],
      anyPermissions: [
        "inventory.view",
        "inventory.manage",
      ],
      sortOrder: 20,
    },

    {
      id: "orders",
      title: "ORDERS",
      subtitle: "Manage orders",
      icon: "shopping-cart",
      section: DashboardSection.Operations,
      route: DashboardRoute.Orders,
      capability: "orders",
      moduleKey: "orders",
      requiredModules: ["orders"],
      anyPermissions: [
        "orders.view",
        "orders.manage",
      ],
      sortOrder: 30,
    },

    {
      id: "returns",
      title: "RETURNS",
      subtitle: "Returns & refunds",
      icon: "undo-2",
      section: DashboardSection.Operations,
      route: DashboardRoute.Returns,
      capability: "returns",
      moduleKey: "returns",
      requiredModules: ["returns"],
      allowedRoles: BUSINESS_TEAM_ROLES,
      anyPermissions: [
        "returns.view",
        "returns.manage",
        "refunds.manage",
      ],
      sortOrder: 40,
    },

    {
      id: "services",
      title: "SERVICES",
      subtitle: "Manage services",
      icon: "wrench",
      section: DashboardSection.Operations,
      route: DashboardRoute.Services,
      capability: "services",
      moduleKey: "services",
      requiredModules: ["services"],
      anyPermissions: [
        "services.view",
        "services.manage",
      ],
      sortOrder: 50,
    },

    {
      id: "transportation",
      title: "TRANSPORTATION HUB",
      subtitle: "Fleet • Shipping • Delivery",
      icon: "truck",
      section: DashboardSection.Operations,
      route: DashboardRoute.Transportation,
      capability: "transportation",
      moduleKey: "transportation",
      requiredModules: ["transportation"],
      allowedRoles: BUSINESS_TEAM_ROLES,
      anyPermissions: [
        "transportation.view",
        "transportation.manage",
        "fleet.view",
      ],
      sortOrder: 60,
    },

    {
      id: "compliance",
      title: "COMPLIANCE",
      subtitle: "Guardian alerts",
      icon: "shield-check",
      section: DashboardSection.Operations,
      route: DashboardRoute.Compliance,
      capability: "compliance",
      moduleKey: "compliance",
      requiredModules: ["compliance"],
      allowedRoles: BUSINESS_LEADERSHIP_ROLES,
      anyPermissions: [
        "compliance.view",
        "compliance.manage",
      ],
      sortOrder: 70,
    },

    {
      id: "facilities",
      title: "FACILITIES",
      subtitle: "Buildings & equipment",
      icon: "building-2",
      section: DashboardSection.Operations,
      route: DashboardRoute.Buildings,
      capability: "facilities",
      moduleKey: "facilities",
      requiredModules: ["facilities"],
      allowedRoles: BUSINESS_LEADERSHIP_ROLES,
      anyPermissions: [
        "facilities.view",
        "facilities.manage",
      ],
      sortOrder: 80,
    },

    {
      id: "receiving",
      title: "RECEIVING",
      subtitle: "Add stock",
      icon: "package-plus",
      section: DashboardSection.Operations,
      route: DashboardRoute.Receiving,
      capability: "receiving",
      moduleKey: "receiving",
      requiredModules: ["receiving"],
      anyPermissions: [
        "receiving.view",
        "receiving.manage",
        "inventory.receive",
      ],
      sortOrder: 90,
    },

    {
      id: "receiving-history",
      title: "RECEIVING HISTORY",
      subtitle: "Past receiving",
      icon: "history",
      section: DashboardSection.Operations,
      route: DashboardRoute.ReceivingHistory,
      capability: "receivingHistory",
      moduleKey: "receivingHistory",
      requiredModules: ["receiving-history"],
      anyPermissions: [
        "receiving.view",
        "receiving-history.view",
      ],
      sortOrder: 100,
    },

    {
      id: "shipping",
      title: "SHIPPING",
      subtitle: "Ship products",
      icon: "package-open",
      section: DashboardSection.Operations,
      route: DashboardRoute.Shipping,
      capability: "shipping",
      moduleKey: "shipping",
      requiredModules: ["shipping"],
      allowedRoles: BUSINESS_LEADERSHIP_ROLES,
      anyPermissions: [
        "shipping.view",
        "shipping.manage",
      ],
      sortOrder: 110,
    },

    {
      id: "shipments",
      title: "SHIPMENTS",
      subtitle: "Track shipments",
      icon: "map-pinned",
      section: DashboardSection.Operations,
      route: DashboardRoute.Shipments,
      capability: "shipments",
      moduleKey: "shipments",
      requiredModules: ["shipments"],
      allowedRoles: BUSINESS_LEADERSHIP_ROLES,
      anyPermissions: [
        "shipments.view",
        "shipping.view",
      ],
      sortOrder: 120,
    },

    {
      id: "appointments",
      title: "APPOINTMENTS",
      subtitle: "Bookings & calendar",
      icon: "calendar-clock",
      section: DashboardSection.Operations,
      route: DashboardRoute.Calendar,
      capability: "appointments",
      moduleKey: "appointments",
      requiredModules: ["appointments"],
      anyPermissions: [
        "appointments.view",
        "appointments.manage",
        "calendar.view",
      ],
      heroShortcut: true,
      sortOrder: 130,
    },

    {
      id: "backorders",
      title: "BACKORDERS",
      subtitle: "Pending orders",
      icon: "clock-arrow-up",
      section: DashboardSection.Operations,
      route: DashboardRoute.Backorders,
      capability: "backorders",
      moduleKey: "backorders",
      requiredModules: ["backorders"],
      allowedRoles: BUSINESS_LEADERSHIP_ROLES,
      anyPermissions: [
        "backorders.view",
        "backorders.manage",
      ],
      sortOrder: 140,
    },

    // =========================================================
    // MANAGEMENT
    // =========================================================

    {
      id: "events",
      title: "EVENTS",
      subtitle: "Events, jobs, projects",
      icon: "calendar-plus",
      section: DashboardSection.Management,
      route: DashboardRoute.Events,
      capability: "events",
      moduleKey: "events",
      requiredModules: ["events"],
      anyPermissions: [
        "events.view",
        "events.manage",
        "projects.view",
      ],
      sortOrder: 10,
    },

    {
      id: "customers",
      title: "CUSTOMERS",
      subtitle: "Manage customers",
      icon: "users",
      section: DashboardSection.Management,
      route: DashboardRoute.Customers,
      capability: "customers",
      moduleKey: "customers",
      requiredModules: ["customers"],
      anyPermissions: [
        "customers.view",
        "customers.manage",
      ],
      sortOrder: 20,
    },

    {
      id: "employees",
      title: "EMPLOYEES",
      subtitle: "Manage employees",
      icon: "users-round",
      section: DashboardSection.Management,
      route: DashboardRoute.Employees,
      capability: "employees",
      moduleKey: "employees",
      requiredModules: ["employees"],
      anyPermissions: [
        "employees.view",
        "employees.manage",
      ],
      sortOrder: 30,
    },

    {
      id: "platform-clients",
      title: "PLATFORM CLIENTS",
      subtitle: "Manage businesses and owner invitations",
      icon: "landmark",
      section: DashboardSection.Management,
      route: DashboardRoute.PlatformClients,
      platformOnly: true,
      moduleKey: "executiveCenter",
      roleControlled: true,
      sortOrder: 40,
    },

    {
      id: "business-invitations",
      title: "INVITATIONS",
      subtitle: "Invite customers & team",
      icon: "user-plus",
      section: DashboardSection.Management,
      route: DashboardRoute.BusinessInvitations,
      capability: "businessInvitations",
      moduleKey: "businessInvitations",
      roleControlled: true,
      allowedRoles: BUSINESS_LEADERSHIP_ROLES,
      anyPermissions: [
        "invitations.view",
        "invitations.manage",
        "users.invite",
      ],
      sortOrder: 50,
    },

    {
      id: "payroll",
      title: "PAYROLL",
      subtitle: "Employees & drivers pay",
      icon: "badge-dollar-sign",
      section: DashboardSection.Management,
      route: DashboardRoute.Payroll,
      capability: "payroll",
      moduleKey: "payroll",
      requiredModules: ["payroll"],
      allowedRoles: BUSINESS_LEADERSHIP_ROLES,
      anyPermissions: [
        "payroll.view",
        "payroll.manage",
      ],
      sortOrder: 60,
    },

    {
      id: "providers",
      title: "PROVIDERS",
      subtitle: "Suppliers",
      icon: "container",
      section: DashboardSection.Management,
      route: DashboardRoute.Providers,
      capability: "providers",
      moduleKey: "providers",
      requiredModules: ["providers"],
      anyPermissions: [
        "providers.view",
        "providers.manage",
      ],
      sortOrder: 70,
    },

    {
      id: "users",
      title: "USERS",
      subtitle: "Manage roles and module access",
      icon: "user-cog",
      section: DashboardSection.Management,
      route: DashboardRoute.Users,
      capability: "users",
      moduleKey: "users",
      roleControlled: true,
      allowedRoles: BUSINESS_ADMINISTRATION_ROLES,
      anyPermissions: [
        "users.view",
        "users.manage",
        "roles.manage",
        "permissions.manage",
      ],
      sortOrder: 80,
    },

    {
      id: "app-settings",
      title: "APP SETTINGS",
      subtitle: "Logo, accent color, taxes and configuration",
      icon: "settings",
      section: DashboardSection.Management,
      route: DashboardRoute.AppSettings,
      capability: "appSettings",
      moduleKey: "appSettings",
      roleControlled: true,
      allowedRoles: BUSINESS_ADMINISTRATION_ROLES,
      anyPermissions: [
        "settings.view",
        "settings.manage",
        "app-settings.manage",
      ],
      sortOrder: 90,
    },
  ];

// MARK: - Role Resolution

export function resolveDashboardRoles(
  access: DashboardAccess
): ReadonlySet<DashboardRole> {
  const roles = new Set<DashboardRole>();

  if (access.isPlatformAdmin) {
    roles.add("platformAdmin");
  }

  if (access.isBusinessOwner) {
    roles.add("businessOwner");
  }

  if (access.isBusinessAdmin) {
    roles.add("businessAdmin");
  }

  if (access.isAdmin) {
    roles.add("admin");
  }

  if (access.isManager) {
    roles.add("manager");
  }

  if (access.isEmployee) {
    roles.add("employee");
  }

  return roles;
}

// MARK: - Access Helpers

function hasAnyRole(
  userRoles: ReadonlySet<DashboardRole>,
  allowedRoles?: readonly DashboardRole[]
): boolean {
  if (!allowedRoles || allowedRoles.length === 0) {
    return false;
  }

  return allowedRoles.some((role) =>
    userRoles.has(role)
  );
}

function hasAnyPermission(
  access: DashboardAccess,
  permissions?: readonly string[]
): boolean {
  if (!permissions || permissions.length === 0) {
    return false;
  }

  return permissions.some((permission) =>
    access.permissions.has(permission)
  );
}

function hasAllPermissions(
  access: DashboardAccess,
  permissions?: readonly string[]
): boolean {
  if (!permissions || permissions.length === 0) {
    return true;
  }

  return permissions.every((permission) =>
    access.permissions.has(permission)
  );
}

function moduleIsEnabled(
  module: DashboardModuleDefinition,
  configuration: BusinessConfiguration
): boolean {
  if (!module.moduleKey) {
    return true;
  }

  return configuration.hasEnabledModule(
    module.moduleKey
  );
}

function capabilityIsSupported(
  module: DashboardModuleDefinition,
  configuration: BusinessConfiguration
): boolean {
  if (!module.capability) {
    return true;
  }

  return configuration.hasCapability(
    module.capability
  );
}

// MARK: - Main Visibility Rule

export function canDisplayDashboardModule(
  module: DashboardModuleDefinition,
  context: DashboardModuleVisibilityContext
): boolean {
  const {
    access,
    configuration,
  } = context;

  const platformOverride =
    module.platformOverride !== false;

  /*
   * PlatformAdmin has absolute access unless a module
   * explicitly disables the override.
   */
  if (
    access.isPlatformAdmin &&
    platformOverride
  ) {
    return true;
  }

  if (module.platformOnly) {
    return false;
  }

  const supported =
    capabilityIsSupported(
      module,
      configuration
    );

  if (!supported) {
    return false;
  }

  const enabled =
    moduleIsEnabled(
      module,
      configuration
    );

  const userRoles =
    resolveDashboardRoles(access);

  const roleAccess =
    hasAnyRole(
      userRoles,
      module.allowedRoles
    );

  const permissionAccess =
    hasAnyPermission(
      access,
      module.anyPermissions
    );

  const hasRequiredPermissions =
    hasAllPermissions(
      access,
      module.allPermissions
    );

  if (!hasRequiredPermissions) {
    return false;
  }

  /*
   * Foundational modules such as Users, Invitations and
   * App Settings may be controlled directly by role.
   */
  if (
    module.roleControlled &&
    (roleAccess || permissionAccess)
  ) {
    return true;
  }

  /*
   * For regular operational modules, the module must be
   * provisioned and the user must have role or permission access
   * when those restrictions are declared.
   */
  if (!enabled) {
    return false;
  }

  const hasAccessRestrictions =
    Boolean(module.allowedRoles?.length) ||
    Boolean(module.anyPermissions?.length);

  if (!hasAccessRestrictions) {
    return true;
  }

  return roleAccess || permissionAccess;
}

// MARK: - Visible Modules

export function getVisibleDashboardModules(
  context: DashboardModuleVisibilityContext
): DashboardModuleDefinition[] {
  return DASHBOARD_MODULE_REGISTRY
    .filter((module) =>
      canDisplayDashboardModule(
        module,
        context
      )
    )
    .sort((left, right) => {
      if (left.section !== right.section) {
        return left.section.localeCompare(
          right.section
        );
      }

      return left.sortOrder - right.sortOrder;
    });
}

// MARK: - Section Modules

export function getDashboardModulesForSection(
  section: DashboardSection,
  context: DashboardModuleVisibilityContext
): DashboardModuleDefinition[] {
  return getVisibleDashboardModules(context)
    .filter(
      (module) =>
        module.section === section
    )
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder
    );
}

// MARK: - Hero Shortcuts

export function getDashboardHeroShortcuts(
  context: DashboardModuleVisibilityContext
): DashboardModuleDefinition[] {
  return getVisibleDashboardModules(context)
    .filter(
      (module) =>
        module.heroShortcut === true
    )
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder
    );
}

// MARK: - Route Lookup

export function findDashboardModuleByRoute(
  route: DashboardRoute
): DashboardModuleDefinition | undefined {
  return DASHBOARD_MODULE_REGISTRY.find(
    (module) =>
      module.route === route
  );
}