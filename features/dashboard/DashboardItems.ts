import {

    DashboardItem,

    DashboardRoute,

    DashboardSection,

} from "./DashboardTypes";

export const dashboardItems: DashboardItem[] = [

//
// STORE
//

{
    id: "customer-home",

    title: "Customer Home",

    subtitle: "Shopping home",

    icon: "home",

    section: DashboardSection.Store,

    route: DashboardRoute.CustomerHome,
},

{
    id: "catalog",

    title: "Catalog",

    subtitle: "Browse products",

    icon: "shopping-bag",

    section: DashboardSection.Store,

    route: DashboardRoute.Catalog,
},

{
    id: "favorites",

    title: "Favorites",

    subtitle: "Saved products",

    icon: "heart",

    section: DashboardSection.Store,

    route: DashboardRoute.Favorites,
},

{
    id: "account",

    title: "Account",

    subtitle: "Customer profile",

    icon: "user",

    section: DashboardSection.Store,

    route: DashboardRoute.Account,
},

//
// BUSINESS
//

{
    id: "pos",

    title: "Point of Sale",

    subtitle: "Checkout",

    icon: "credit-card",

    section: DashboardSection.Business,

    route: DashboardRoute.POS,

    requiredModules: ["pos"],
},

{
    id: "cash-register",

    title: "Cash Register",

    subtitle: "Restaurant • Retail POS",

    icon: "wallet",

    section: DashboardSection.Business,

    route: DashboardRoute.CashRegister,

    requiredModules: ["cash-register"],
},

{
    id: "insights",

    title: "Insights",

    subtitle: "Business analytics",

    icon: "chart-column",

    section: DashboardSection.Business,

    route: DashboardRoute.Insights,

    requiredModules: ["insights"],
},

{
    id: "sales",

    title: "Sales Dashboard",

    subtitle: "Sales performance",

    icon: "chart-line",

    section: DashboardSection.Business,

    route: DashboardRoute.Sales,

    requiredModules: ["sales"],
},

//
// OPERATIONS
//

{
    id: "products",

    title: "Products",

    subtitle: "Products & SKU",

    icon: "package",

    section: DashboardSection.Operations,

    route: DashboardRoute.Products,

    requiredModules: ["products"],
},

{
    id: "inventory",

    title: "Inventory",

    subtitle: "Inventory control",

    icon: "warehouse",

    section: DashboardSection.Operations,

    route: DashboardRoute.Inventory,

    requiredModules: ["inventory"],
},

{
    id: "orders",

    title: "Orders",

    subtitle: "Customer orders",

    icon: "shopping-cart",

    section: DashboardSection.Operations,

    route: DashboardRoute.Orders,

    requiredModules: ["orders"],
},

{
    id: "services",

    title: "Services",

    subtitle: "Business services",

    icon: "wrench",

    section: DashboardSection.Operations,

    route: DashboardRoute.Services,

    requiredModules: ["services"],
},

{
    id: "transportation",

    title: "Transportation",

    subtitle: "Fleet & delivery",

    icon: "truck",

    section: DashboardSection.Operations,

    route: DashboardRoute.Transportation,

    requiredModules: ["transportation"],
},

{
    id: "shipping",

    title: "Shipping",

    subtitle: "Ship products",

    icon: "package-check",

    section: DashboardSection.Operations,

    route: DashboardRoute.Shipping,

    requiredModules: ["shipping"],
},

{
    id: "receiving",

    title: "Receiving",

    subtitle: "Receive inventory",

    icon: "download",

    section: DashboardSection.Operations,

    route: DashboardRoute.Receiving,

    requiredModules: ["receiving"],
},

//
// MANAGEMENT
//

{
    id: "customers",

    title: "Customers",

    subtitle: "Manage customers",

    icon: "users",

    section: DashboardSection.Management,

    route: DashboardRoute.Customers,

    requiredModules: ["customers"],
},

{
    id: "employees",

    title: "Employees",

    subtitle: "Manage employees",

    icon: "user-round",

    section: DashboardSection.Management,

    route: DashboardRoute.Employees,

    requiredModules: ["employees"],
},

{
    id: "providers",

    title: "Providers",

    subtitle: "Suppliers",

    icon: "truck",

    section: DashboardSection.Management,

    route: DashboardRoute.Providers,

    requiredModules: ["providers"],
},

{
    id: "users",

    title: "Users",

    subtitle: "Roles & Permissions",

    icon: "shield-check",

    section: DashboardSection.Management,

    route: DashboardRoute.Users,

    requiredModules: ["users"],
},

{
    id: "settings",

    title: "App Settings",

    subtitle: "Logo • Accent Color • Taxes",

    icon: "settings",

    section: DashboardSection.Management,

    route: DashboardRoute.AppSettings,

    requiredModules: ["app-settings"],
},

{
    id: "platform",

    title: "Platform Clients",

    subtitle: "Executive Center",

    icon: "building-2",

    section: DashboardSection.Management,

    route: DashboardRoute.PlatformClients,

    platformOnly: true,
},

{
    id: "business-invitations",

    title: "Invitations",

    subtitle: "Invite customers & employees",

    icon: "user-plus",

    section: DashboardSection.Management,

    route: DashboardRoute.BusinessInvitations,

    requiredModules: ["business-invitations"],
},
];