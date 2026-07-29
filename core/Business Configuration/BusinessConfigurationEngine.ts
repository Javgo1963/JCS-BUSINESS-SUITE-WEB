import {
    allCategories,
    findModeByName,
    type BusinessModeOption
} from "@/core/business-mode/BusinessModeLibrary"
// =======================================================
// MARK: - Module Names
// =======================================================

export enum BusinessModule {

    Dashboard = "dashboard",

    POS = "pos",

    Products = "products",

    Services = "services",

    Inventory = "inventory",

    Receiving = "receiving",

    Shipping = "shipping",

    Transportation = "transportation",

    Customers = "customers",

    Providers = "providers",

    Employees = "employees",

    Orders = "orders",

    Returns = "returns",

    Accounting = "accounting",

    Reports = "reports",

    Payroll = "payroll",

    Vehicles = "vehicles",

    Appointments = "appointments",

    CRM = "crm",

    Notifications = "notifications",

    Analytics = "analytics",

    AI = "ai",

    BusinessDNA = "businessDNA",

    Settings = "settings"

}

// =======================================================
// MARK: - Checkout Modes
// =======================================================

export enum CheckoutMode {

    Retail = "retail",

    Restaurant = "restaurant",

    Service = "service",

    Medical = "medical",

    Construction = "construction",

    Logistics = "logistics",

    Automotive = "automotive",

    Rental = "rental",

    Wholesale = "wholesale",

    Manufacturing = "manufacturing",

    Professional = "professional",

    Education = "education",

    Custom = "custom"

}

// =======================================================
// MARK: - Dashboard Styles
// =======================================================

export enum DashboardStyle {

    Retail = "retail",

    Restaurant = "restaurant",

    Medical = "medical",

    Construction = "construction",

    Logistics = "logistics",

    Professional = "professional",

    Manufacturing = "manufacturing",

    Universal = "universal"

}

// =======================================================
// MARK: - Configuration
// =======================================================

export interface BusinessConfiguration {

    mode: BusinessModeOption

    dashboard: DashboardStyle

    checkoutMode: CheckoutMode

    modules: BusinessModule[]

    aiLogoPrompt: string

    businessDNA: string

    defaultAccentColor: string

    supportsInventory: boolean

    supportsServices: boolean

    supportsAppointments: boolean

    supportsReceiving: boolean

    supportsShipping: boolean

    supportsTransportation: boolean

    supportsFleet: boolean

    supportsAccounting: boolean

    supportsReports: boolean

    supportsPayroll: boolean

    supportsCRM: boolean

    supportsProviders: boolean

    supportsCustomers: boolean

    supportsEmployees: boolean

    supportsReturns: boolean

    supportsAI: boolean

}

// =======================================================
// MARK: - Default Modules
// =======================================================

const universalModules: BusinessModule[] = [

    BusinessModule.Dashboard,

    BusinessModule.Customers,

    BusinessModule.Employees,

    BusinessModule.Products,

    BusinessModule.Services,

    BusinessModule.Orders,

    BusinessModule.Notifications,

    BusinessModule.Reports,

    BusinessModule.Settings,

    BusinessModule.AI,

    BusinessModule.BusinessDNA

]

// =======================================================
// MARK: - Default Configuration
// =======================================================

function baseConfiguration(

    mode: BusinessModeOption

): BusinessConfiguration {

    return {

        mode,

        dashboard: DashboardStyle.Universal,

        checkoutMode: CheckoutMode.Custom,

        modules: [...universalModules],

        aiLogoPrompt: mode.name,

        businessDNA: mode.name,

        defaultAccentColor: "blue",

        supportsInventory: true,

        supportsServices: true,

        supportsAppointments: false,

        supportsReceiving: true,

        supportsShipping: true,

        supportsTransportation: false,

        supportsFleet: false,

        supportsAccounting: true,

        supportsReports: true,

        supportsPayroll: true,

        supportsCRM: true,

        supportsProviders: true,

        supportsCustomers: true,

        supportsEmployees: true,

        supportsReturns: true,

        supportsAI: true

    }

}

// =======================================================
// MARK: - Configuration Overrides
// =======================================================

type BusinessConfigurationOverrides =
    Partial<Omit<BusinessConfiguration, "mode">>

function createConfiguration(
    mode: BusinessModeOption,
    overrides: BusinessConfigurationOverrides = {}
): BusinessConfiguration {

    const base = baseConfiguration(mode)

    return {

        ...base,

        ...overrides,

        modules: overrides.modules
            ? [...new Set(overrides.modules)]
            : [...base.modules]

    }

}

// =======================================================
// MARK: - Module Utilities
// =======================================================

function mergeModules(
    ...moduleGroups: BusinessModule[][]
): BusinessModule[] {

    return [...new Set(moduleGroups.flat())]

}

const commerceModules: BusinessModule[] = [

    BusinessModule.POS,

    BusinessModule.Products,

    BusinessModule.Inventory,

    BusinessModule.Receiving,

    BusinessModule.Shipping,

    BusinessModule.Providers,

    BusinessModule.Orders,

    BusinessModule.Returns,

    BusinessModule.Accounting,

    BusinessModule.Reports,

    BusinessModule.Analytics

]

const serviceModules: BusinessModule[] = [

    BusinessModule.POS,

    BusinessModule.Services,

    BusinessModule.Appointments,

    BusinessModule.Customers,

    BusinessModule.Employees,

    BusinessModule.Orders,

    BusinessModule.Accounting,

    BusinessModule.Reports,

    BusinessModule.CRM,

    BusinessModule.Analytics

]

const workforceModules: BusinessModule[] = [

    BusinessModule.Employees,

    BusinessModule.Payroll,

    BusinessModule.Notifications,

    BusinessModule.Reports

]

const logisticsModules: BusinessModule[] = [

    BusinessModule.Inventory,

    BusinessModule.Receiving,

    BusinessModule.Shipping,

    BusinessModule.Transportation,

    BusinessModule.Vehicles,

    BusinessModule.Providers,

    BusinessModule.Orders,

    BusinessModule.Reports,

    BusinessModule.Analytics

]

const officeModules: BusinessModule[] = [

    BusinessModule.Services,

    BusinessModule.Appointments,

    BusinessModule.Customers,

    BusinessModule.Employees,

    BusinessModule.Accounting,

    BusinessModule.Reports,

    BusinessModule.CRM,

    BusinessModule.Notifications,

    BusinessModule.Analytics

]

// =======================================================
// MARK: - Reusable Configuration Profiles
// =======================================================

function retailConfiguration(
    mode: BusinessModeOption
): BusinessConfiguration {

    return createConfiguration(mode, {

        dashboard: DashboardStyle.Retail,

        checkoutMode: CheckoutMode.Retail,

        modules: mergeModules(
            universalModules,
            commerceModules,
            workforceModules
        ),

        aiLogoPrompt:
            `Create a premium, professional retail brand identity for ${mode.name}. ` +
            "Use a polished commercial style suitable for storefronts, packaging, " +
            "receipts, websites and mobile applications.",

        businessDNA:
            `${mode.name} focused on product sales, inventory control, ` +
            "customer service, purchasing, receiving, checkout and fulfillment.",

        defaultAccentColor: "blue",

        supportsInventory: true,

        supportsServices: true,

        supportsAppointments: false,

        supportsReceiving: true,

        supportsShipping: true,

        supportsTransportation: false,

        supportsFleet: false,

        supportsProviders: true,

        supportsReturns: true

    })

}

function restaurantConfiguration(
    mode: BusinessModeOption
): BusinessConfiguration {

    return createConfiguration(mode, {

        dashboard: DashboardStyle.Restaurant,

        checkoutMode: CheckoutMode.Restaurant,

        modules: mergeModules(
            universalModules,
            commerceModules,
            workforceModules,
            [
                BusinessModule.Appointments,
                BusinessModule.CRM
            ]
        ),

        aiLogoPrompt:
            `Create an appetizing, premium and memorable food-service identity ` +
            `for ${mode.name}. The logo should work for menus, restaurant signs, ` +
            "delivery packaging, receipts, websites and mobile ordering.",

        businessDNA:
            `${mode.name} focused on menus, food items, customer orders, ` +
            "pickup, delivery, dine-in service, employees, payments and reporting.",

        defaultAccentColor: "orange",

        supportsInventory: true,

        supportsServices: true,

        supportsAppointments: true,

        supportsReceiving: true,

        supportsShipping: false,

        supportsTransportation: true,

        supportsFleet: true,

        supportsProviders: true,

        supportsReturns: false

    })

}

function serviceConfiguration(
    mode: BusinessModeOption
): BusinessConfiguration {

    return createConfiguration(mode, {

        dashboard: DashboardStyle.Professional,

        checkoutMode: CheckoutMode.Service,

        modules: mergeModules(
            universalModules,
            serviceModules,
            workforceModules
        ),

        aiLogoPrompt:
            `Create a trustworthy, modern and professional service-business ` +
            `identity for ${mode.name}. The design should communicate expertise, ` +
            "reliability and excellent customer care.",

        businessDNA:
            `${mode.name} focused on appointments, service delivery, ` +
            "customer relationships, employees, invoicing, payments and reports.",

        defaultAccentColor: "indigo",

        supportsInventory: false,

        supportsServices: true,

        supportsAppointments: true,

        supportsReceiving: false,

        supportsShipping: false,

        supportsTransportation: false,

        supportsFleet: false,

        supportsProviders: true,

        supportsReturns: false

    })

}

function medicalConfiguration(
    mode: BusinessModeOption
): BusinessConfiguration {

    return createConfiguration(mode, {

        dashboard: DashboardStyle.Medical,

        checkoutMode: CheckoutMode.Medical,

        modules: mergeModules(
            universalModules,
            serviceModules,
            workforceModules,
            [
                BusinessModule.Inventory,
                BusinessModule.Receiving,
                BusinessModule.Providers
            ]
        ),

        aiLogoPrompt:
            `Create a clean, trustworthy and sophisticated healthcare identity ` +
            `for ${mode.name}. The design should communicate care, professionalism, ` +
            "safety and confidence without appearing generic.",

        businessDNA:
            `${mode.name} focused on patients or clients, appointments, ` +
            "professional services, staff coordination, supplies, billing and reports.",

        defaultAccentColor: "teal",

        supportsInventory: true,

        supportsServices: true,

        supportsAppointments: true,

        supportsReceiving: true,

        supportsShipping: false,

        supportsTransportation: false,

        supportsFleet: false,

        supportsProviders: true,

        supportsReturns: false

    })

}

function constructionConfiguration(
    mode: BusinessModeOption
): BusinessConfiguration {

    return createConfiguration(mode, {

        dashboard: DashboardStyle.Construction,

        checkoutMode: CheckoutMode.Construction,

        modules: mergeModules(
            universalModules,
            serviceModules,
            commerceModules,
            workforceModules,
            [
                BusinessModule.Vehicles,
                BusinessModule.Transportation
            ]
        ),

        aiLogoPrompt:
            `Create a strong, premium and highly professional construction or ` +
            `trade-services identity for ${mode.name}. The design should communicate ` +
            "strength, craftsmanship, reliability and technical competence.",

        businessDNA:
            `${mode.name} focused on projects, estimates, services, labor, ` +
            "materials, tools, vehicles, customers, suppliers, invoicing and reports.",

        defaultAccentColor: "orange",

        supportsInventory: true,

        supportsServices: true,

        supportsAppointments: true,

        supportsReceiving: true,

        supportsShipping: true,

        supportsTransportation: true,

        supportsFleet: true,

        supportsProviders: true,

        supportsReturns: true

    })

}

function logisticsConfiguration(
    mode: BusinessModeOption
): BusinessConfiguration {

    return createConfiguration(mode, {

        dashboard: DashboardStyle.Logistics,

        checkoutMode: CheckoutMode.Logistics,

        modules: mergeModules(
            universalModules,
            logisticsModules,
            workforceModules,
            [
                BusinessModule.POS,
                BusinessModule.Services,
                BusinessModule.CRM
            ]
        ),

        aiLogoPrompt:
            `Create a modern, powerful and dependable transportation or logistics ` +
            `identity for ${mode.name}. The design should communicate movement, ` +
            "speed, organization, reliability and nationwide capability.",

        businessDNA:
            `${mode.name} focused on transportation, dispatch, drivers, vehicles, ` +
            "shipments, receiving, tracking, customers, providers and operational reports.",

        defaultAccentColor: "blue",

        supportsInventory: true,

        supportsServices: true,

        supportsAppointments: true,

        supportsReceiving: true,

        supportsShipping: true,

        supportsTransportation: true,

        supportsFleet: true,

        supportsProviders: true,

        supportsReturns: true

    })

}

function automotiveConfiguration(
    mode: BusinessModeOption
): BusinessConfiguration {

    return createConfiguration(mode, {

        dashboard: DashboardStyle.Retail,

        checkoutMode: CheckoutMode.Automotive,

        modules: mergeModules(
            universalModules,
            commerceModules,
            serviceModules,
            workforceModules,
            [
                BusinessModule.Vehicles,
                BusinessModule.Transportation
            ]
        ),

        aiLogoPrompt:
            `Create a premium and realistic automotive business identity for ` +
            `${mode.name}. The design should communicate performance, precision, ` +
            "trust, professional service and automotive expertise.",

        businessDNA:
            `${mode.name} focused on vehicles, products or parts, services, ` +
            "appointments, inventory, customers, employees, checkout and reporting.",

        defaultAccentColor: "red",

        supportsInventory: true,

        supportsServices: true,

        supportsAppointments: true,

        supportsReceiving: true,

        supportsShipping: true,

        supportsTransportation: true,

        supportsFleet: true,

        supportsProviders: true,

        supportsReturns: true

    })

}

function professionalConfiguration(
    mode: BusinessModeOption
): BusinessConfiguration {

    return createConfiguration(mode, {

        dashboard: DashboardStyle.Professional,

        checkoutMode: CheckoutMode.Professional,

        modules: mergeModules(
            universalModules,
            officeModules,
            workforceModules
        ),

        aiLogoPrompt:
            `Create an elegant, credible and premium professional-services ` +
            `identity for ${mode.name}. The design should communicate authority, ` +
            "expertise, discretion, trust and long-term stability.",

        businessDNA:
            `${mode.name} focused on professional services, appointments, ` +
            "clients, employees, documents, invoicing, accounting and analytics.",

        defaultAccentColor: "indigo",

        supportsInventory: false,

        supportsServices: true,

        supportsAppointments: true,

        supportsReceiving: false,

        supportsShipping: false,

        supportsTransportation: false,

        supportsFleet: false,

        supportsProviders: true,

        supportsReturns: false

    })

}// =======================================================
// MARK: - Configuration Resolution
// =======================================================

function retailBusinesses(): string[] {

    return [

        "Retail Store",
        "Convenience Store",
        "Department Store",
        "Supermarket",
        "Grocery Store",
        "Liquor Store",
        "Pharmacy",
        "Pet Store",
        "Toy Store",
        "Gift Shop",
        "Book Store",
        "Office Supply Store",
        "Furniture Store",
        "Electronics Store",
        "Appliance Store",
        "Jewelry Store",
        "Shoe Store",
        "Sporting Goods Store",
        "Hardware Store",
        "Garden Center",
        "Wholesale Distributor",
        "Warehouse Club",
        "E-Commerce Store",
        "Online Marketplace",
        "Custom Retail Business"

    ]

}

function restaurantBusinesses(): string[] {

    return [

        "Restaurant",
        "Fast Food",
        "Coffee Shop",
        "Bakery",
        "Cafe",
        "Food Truck",
        "Pizzeria",
        "Ice Cream Shop",
        "Bar",
        "Brewery",
        "Winery",
        "Catering",
        "Buffet",
        "Dessert Shop",
        "Juice Bar",
        "Tea House",
        "Custom Restaurant"

    ]

}

function beautyBusinesses(): string[] {

    return [

        "Hair Salon",
        "Barbershop",
        "Spa",
        "Nail Salon",
        "Massage Therapy",
        "Beauty Clinic",
        "Cosmetic Studio",
        "Skincare Clinic",
        "Makeup Artist",
        "Wellness Center",
        "Custom Beauty Business"

    ]

}

function medicalBusinesses(): string[] {

    return [

        "Medical Clinic",
        "Dental Office",
        "Hospital",
        "Urgent Care",
        "Physical Therapy",
        "Chiropractic Clinic",
        "Mental Health Practice",
        "Optometry",
        "Veterinary Clinic",
        "Home Health",
        "Medical Laboratory",
        "Medical Imaging",
        "Custom Medical Business"

    ]

}

function serviceBusinesses(): string[] {

    return [

        "Consulting Firm",
        "Accounting Firm",
        "Marketing Agency",
        "Insurance Agency",
        "Travel Agency",
        "Employment Agency",
        "Cleaning Services",
        "IT Services",
        "Computer Repair",
        "Photography Studio",
        "Printing Services",
        "Translation Services",
        "Business Coaching",
        "Custom Professional Business"

    ]

}

// =======================================================
// MARK: - Resolver Helpers
// =======================================================

function belongsTo(
    mode: BusinessModeOption,
    values: string[]
): boolean {

    return values.includes(mode.name)

}

// =======================================================
// MARK: - Main Resolver
// =======================================================

export function configurationForMode(
    modeName: string
): BusinessConfiguration {

    const mode = findModeByName(modeName)

    if (!mode) {

        throw new Error(
            `Unknown Business Mode: ${modeName}`
        )

    }

    if (belongsTo(mode, retailBusinesses())) {

        return retailConfiguration(mode)

    }

    if (belongsTo(mode, restaurantBusinesses())) {

        return restaurantConfiguration(mode)

    }

    if (belongsTo(mode, beautyBusinesses())) {

        return serviceConfiguration(mode)

    }

    if (belongsTo(mode, medicalBusinesses())) {

        return medicalConfiguration(mode)

    }

    if (belongsTo(mode, serviceBusinesses())) {

        return professionalConfiguration(mode)

    }

    return createConfiguration(mode)

}

// =======================================================
// MARK: - Category Resolution
// =======================================================

export function configurationForCategory(
    categoryTitle: string
): BusinessConfiguration | undefined {

    const firstMode = allCategories
        .find(category => category.title === categoryTitle)
        ?.modes.at(0)

    if (!firstMode) {

        return undefined

    }

    return configurationForMode(firstMode.name)

}

// =======================================================
// MARK: - Safe Configuration
// =======================================================

export function safeConfiguration(
    modeName: string
): BusinessConfiguration {

    try {

        return configurationForMode(modeName)

    } catch {

        const fallback = findModeByName(
            "Retail Store"
        )

        if (!fallback) {

            throw new Error(
                "Retail Store configuration missing."
            )

        }

        return retailConfiguration(fallback)

    }

}

// =======================================================
// MARK: - Convenience Helpers
// =======================================================

export function modulesForMode(
    modeName: string
): BusinessModule[] {

    return safeConfiguration(modeName).modules

}

export function dashboardForMode(
    modeName: string
): DashboardStyle {

    return safeConfiguration(modeName).dashboard

}

export function checkoutModeForBusiness(
    modeName: string
): CheckoutMode {

    return safeConfiguration(modeName).checkoutMode

}

export function logoPromptForMode(
    modeName: string
): string {

    return safeConfiguration(modeName).aiLogoPrompt

}

export function businessDNAForMode(
    modeName: string
): string {

    return safeConfiguration(modeName).businessDNA

}

// =======================================================
// MARK: - Feature Helpers
// =======================================================

export function supportsInventory(
    modeName: string
): boolean {

    return safeConfiguration(modeName)
        .supportsInventory

}

export function supportsAppointments(
    modeName: string
): boolean {

    return safeConfiguration(modeName)
        .supportsAppointments

}

export function supportsTransportation(
    modeName: string
): boolean {

    return safeConfiguration(modeName)
        .supportsTransportation

}

export function supportsFleet(
    modeName: string
): boolean {

    return safeConfiguration(modeName)
        .supportsFleet

}

export function supportsPayroll(
    modeName: string
): boolean {

    return safeConfiguration(modeName)
        .supportsPayroll

}

export function supportsCRM(
    modeName: string
): boolean {

    return safeConfiguration(modeName)
        .supportsCRM

}

export function supportsReceiving(
    modeName: string
): boolean {

    return safeConfiguration(modeName)
        .supportsReceiving

}

export function supportsShipping(
    modeName: string
): boolean {

    return safeConfiguration(modeName)
        .supportsShipping

}

// =======================================================
// MARK: - Validation
// =======================================================

export function isBusinessModeSupported(
    modeName: string
): boolean {

    return findModeByName(modeName) !== undefined

}

// =======================================================
// MARK: - Defaults
// =======================================================

export const DefaultBusinessMode =

    "Retail Store"

export const DefaultConfiguration =

    safeConfiguration(DefaultBusinessMode)

// =======================================================
// MARK: - Engine
// =======================================================

export const BusinessConfigurationEngine = {

    configurationForMode,

    configurationForCategory,

    safeConfiguration,

    modulesForMode,

    dashboardForMode,

    checkoutModeForBusiness,

    logoPromptForMode,

    businessDNAForMode,

    supportsInventory,

    supportsAppointments,

    supportsTransportation,

    supportsFleet,

    supportsPayroll,

    supportsCRM,

    supportsReceiving,

    supportsShipping,

    isBusinessModeSupported,

    defaultConfiguration:

        DefaultConfiguration

}

export default BusinessConfigurationEngine