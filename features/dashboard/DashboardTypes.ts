//
// MARK: - Dashboard Route
//

export enum DashboardRoute {

    CustomerHome = "customer-home",

    RestaurantStore = "restaurant-store",

    Catalog = "catalog",

    Favorites = "favorites",

    Account = "account",

    POS = "pos",

    CashRegister = "cash-register",

    Insights = "insights",

    Sales = "sales",

    Products = "products",

    Inventory = "inventory",

    Orders = "orders",

    Services = "services",

    Transportation = "transportation",

    Receiving = "receiving",

    ReceivingHistory = "receiving-history",

    Shipping = "shipping",

    Shipments = "shipments",

    Calendar = "calendar",

    Backorders = "backorders",

    Customers = "customers",

    Employees = "employees",

    Providers = "providers",

    Users = "users",

    AppSettings = "app-settings",

    Events = "events",

    Accounting = "accounting",

    Returns = "returns",

    Compliance = "compliance",

    Buildings = "buildings",

    Payroll = "payroll",

    PlatformClients = "platform-clients",

    ExecutiveCenter = "executive-center",

    BusinessInvitations = "business-invitations",
}

//
// MARK: Dashboard Sections
//

export enum DashboardSection {

    Store = "store",

    Business = "business",

    Operations = "operations",

    Management = "management",
}

//
// MARK: Dashboard Item
//

export interface DashboardItem {

    id: string;

    title: string;

    subtitle: string;

    icon: string;

    section: DashboardSection;

    route: DashboardRoute;

    requiredModules?: string[];

    requiredPermissions?: string[];

    platformOnly?: boolean;
}