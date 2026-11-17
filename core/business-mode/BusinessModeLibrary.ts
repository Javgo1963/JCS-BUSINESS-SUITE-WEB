// =======================================================
// JCS Business Suite
// BusinessModeLibrary.ts
// =======================================================
//
// Master Business Mode Library
//
// This file is the single source of truth for every
// business category and business mode used throughout
// the entire JCS Business Suite platform.
//
// Used by:
//
// • BusinessOwnerPromo
// • BusinessSignUp
// • Dashboard
// • POS
// • Inventory
// • Services
// • Reports
// • AI Logo Generator
// • BusinessDNA
// • Permissions
// • Future Android / Windows versions
//
// Swift Source:
// BusinessModeLibrary.swift
// =======================================================

export interface BusinessModeOption {
    id: string;
    name: string;
    icon: string;
    recommendedModules: string[];
}

export interface BusinessModeCategory {
    id: string
    title: string
    icon: string
    modes: BusinessModeOption[]
}

const DEFAULT_RECOMMENDED_MODULES: readonly string[] = [
    "dashboard",
    "insights",
    "appointments",
    "events",
    "accounting",
    "compliance",
    "facilities",
    "services",
    "customers",
    "employees",
    "reports",
    "notifications",
    "users",
    "app-settings",
];

function withUniversalModules(
    specializedModules: readonly string[]
): readonly string[] {
    return [
        ...DEFAULT_RECOMMENDED_MODULES,
        ...specializedModules.filter(
            module => !DEFAULT_RECOMMENDED_MODULES.includes(module)
        ),
    ];
}

const BUSINESS_MODULE_PROFILES = {
    commerce: withUniversalModules([
        "pos",
        "cash-register",
        "catalog",
        "products",
        "inventory",
        "orders",
        "receiving",
        "receiving-history",
        "returns",
        "providers",
    ]),

    restaurant: withUniversalModules([
        "pos",
        "cash-register",
        "restaurant-store",
        "catalog",
        "products",
        "inventory",
        "orders",
        "receiving",
        "receiving-history",
        "providers",
    ]),

    rental: withUniversalModules([
        "pos",
        "products",
        "inventory",
        "orders",
        "receiving",
        "receiving-history",
        "returns",
        "providers",
    ]),

    construction: withUniversalModules([
        "products",
        "inventory",
        "orders",
        "receiving",
        "providers",
        "transportation",
    ]),

    logistics: withUniversalModules([
        "transportation",
        "orders",
        "shipping",
        "shipments",
        "receiving",
        "receiving-history",
        "providers",
        "backorders",
    ]),

    automotive: withUniversalModules([
        "pos",
        "products",
        "inventory",
        "orders",
        "receiving",
        "returns",
        "providers",
        "transportation",
    ]),

    healthcare: withUniversalModules([
        "products",
        "inventory",
        "orders",
        "providers",
    ]),

    professional: withUniversalModules([
        "appointments",
        "accounting",
        "services",
    ]),

    scientific: withUniversalModules([
        "products",
        "inventory",
        "orders",
        "receiving",
        "providers",
    ]),

    agriculture: withUniversalModules([
        "products",
        "inventory",
        "orders",
        "receiving",
        "providers",
        "transportation",
    ]),

    aviation: withUniversalModules([
        "transportation",
        "orders",
        "appointments",
        "services",
        "products",
        "inventory",
        "providers",
    ]),

    utilities: withUniversalModules([
        "products",
        "inventory",
        "orders",
        "receiving",
        "providers",
        "transportation",
    ]),

    industrial: withUniversalModules([
        "products",
        "inventory",
        "orders",
        "receiving",
        "shipping",
        "providers",
        "transportation",
        "backorders",
    ]),

    media: withUniversalModules([
        "services",
        "events",
        "products",
        "orders",
    ]),

    online: withUniversalModules([
        "catalog",
        "products",
        "orders",
        "services",
    ]),

    manufacturing: withUniversalModules([
        "products",
        "inventory",
        "orders",
        "receiving",
        "shipping",
        "providers",
        "backorders",
    ]),

    wholesale: withUniversalModules([
        "products",
        "inventory",
        "orders",
        "receiving",
        "shipping",
        "shipments",
        "providers",
        "backorders",
    ]),

    hospitality: withUniversalModules([
        "pos",
        "products",
        "inventory",
        "orders",
        "appointments",
        "events",
        "providers",
    ]),

    education: withUniversalModules([
        "appointments",
        "events",
        "services",
    ]),

    financial: withUniversalModules([
        "appointments",
        "accounting",
        "services",
        "compliance",
    ]),

    technology: withUniversalModules([
        "services",
    ]),

    events: withUniversalModules([
        "events",
        "appointments",
        "services",
        "products",
        "inventory",
        "orders",
    ]),

    nonprofit: withUniversalModules([
        "events",
        "services",
        "customers",
    ]),
} as const;

function createMode(
    name: string,
    icon: string,
    recommendedModules: readonly string[] =
        DEFAULT_RECOMMENDED_MODULES
): BusinessModeOption {
    return {
        id: slugify(name),
        name,
        icon,
        recommendedModules: [
            ...recommendedModules,
        ],
    };
}

function createCategory(
    title: string,
    icon: string,
    modes: BusinessModeOption[]
): BusinessModeCategory {

    return {
        id: slugify(title),
        title,
        icon,
        modes
    }

}

function slugify(text: string): string {

    return text
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/\//g, "-")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

}

export const BusinessModeLibrary = {

    categories: [

        createCategory(

            "Retail & Commerce",

            "bag.fill",

            [

                createMode(
                    "Retail Store",
                    "bag.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Online Store",
                    "storefront.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "E-Commerce Store",
                    "cart.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Marketplace App",
                    "square.grid.2x2.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Boutique",
                    "tshirt.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Clothing Store",
                    "tshirt.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Shoe Store",
                    "shoeprints.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Jewelry Store",
                    "diamond.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Watch Store",
                    "clock.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Electronics Store",
                    "desktopcomputer",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Cell Phone Store",
                    "iphone",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Computer Store",
                    "display",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Gaming Store",
                    "gamecontroller.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Furniture Store",
                    "chair.lounge.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Mattress Store",
                    "bed.double.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Home Decor Store",
                    "house.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Appliance Store",
                    "washer.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Hardware Store",
                    "hammer.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Grocery Store",
                    "basket.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Supermarket",
                    "cart.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Convenience Store",
                    "cart.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Dollar Store",
                    "dollarsign.circle.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Discount Store",
                    "tag.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Wholesale",
                    "shippingbox.fill",
                    BUSINESS_MODULE_PROFILES.wholesale
),

                createMode(
                    "Warehouse Retail",
                    "building.2.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Office Supply Store",
                    "doc.text.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Book Store",
                    "book.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Toy Store",
                    "teddybear.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Baby Store",
                    "figure.2.and.child.holdinghands",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Gift Shop",
                    "gift.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Florist",
                    "camera.macro",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Pet Store",
                    "pawprint.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Sporting Goods",
                    "figure.run",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Outdoor Store",
                    "tent.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Hunting & Fishing Store",
                    "scope",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Music Store",
                    "music.note",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Art Supply Store",
                    "paintpalette.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Beauty Supply",
                    "sparkles",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Cosmetics Store",
                    "sparkles",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Thrift Store",
                    "tag.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Pawn Shop",
                    "tag.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Auction House",
                    "hammer.circle.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Specialty Shop",
                    "star.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Custom Retail Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.commerce
)

            ]

        ),
        createCategory(

            "Restaurant & Food",

            "fork.knife",

            [

                createMode(
                    "Restaurant",
                    "fork.knife",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Fine Dining",
                    "fork.knife",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Casual Dining",
                    "fork.knife",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Fast Food",
                    "takeoutbag.and.cup.and.straw.fill",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Food Truck",
                    "truck.box.fill",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Coffee Shop",
                    "cup.and.saucer.fill",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Bakery",
                    "birthday.cake.fill",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Pizza Shop",
                    "fork.knife",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Burger Restaurant",
                    "takeoutbag.and.cup.and.straw.fill",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Mexican Restaurant",
                    "fork.knife",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Italian Restaurant",
                    "fork.knife",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Seafood Restaurant",
                    "fork.knife",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Steakhouse",
                    "fork.knife",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Sushi Restaurant",
                    "fork.knife",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Chinese Restaurant",
                    "fork.knife",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "BBQ Restaurant",
                    "flame.fill",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Breakfast Cafe",
                    "cup.and.saucer.fill",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Deli",
                    "takeoutbag.and.cup.and.straw.fill",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Sandwich Shop",
                    "takeoutbag.and.cup.and.straw.fill",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Dessert Shop",
                    "birthday.cake.fill",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Ice Cream Shop",
                    "snowflake",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Juice Bar",
                    "drop.fill",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Smoothie Bar",
                    "drop.fill",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Tea Shop",
                    "cup.and.saucer.fill",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Bar & Grill",
                    "wineglass.fill",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Catering",
                    "fork.knife.circle.fill",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Meal Prep Business",
                    "takeoutbag.and.cup.and.straw.fill",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Cloud Kitchen",
                    "cloud.fill",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Ghost Kitchen",
                    "cloud.fill",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Food Production",
                    "shippingbox.fill",
                    BUSINESS_MODULE_PROFILES.restaurant
),

                createMode(
                    "Custom Food Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.restaurant
)

            ]

        ),

        createCategory(

            "Beauty & Personal Care",

            "sparkles",

            [

                createMode(
                    "Beauty Salon",
                    "sparkles",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Hair Salon",
                    "scissors",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Barbershop",
                    "scissors",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Nail Salon",
                    "paintbrush.pointed.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Spa",
                    "leaf.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Medical Spa",
                    "sparkles",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Massage Therapy",
                    "hands.sparkles.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Skincare Clinic",
                    "sparkles",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Esthetician Studio",
                    "sparkles",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Makeup Artist",
                    "paintbrush.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Lash Studio",
                    "eye.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Brow Studio",
                    "eye.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Hair Extensions",
                    "scissors",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Tanning Salon",
                    "sun.max.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Tattoo Studio",
                    "pencil.tip.crop.circle.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Piercing Studio",
                    "sparkles",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Wellness Center",
                    "heart.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Personal Styling",
                    "tshirt.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Beauty Academy",
                    "graduationcap.fill",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Custom Beauty Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.professional
)

            ]

        ),

        createCategory(

            "Medical & Healthcare",

            "cross.case.fill",

            [

                createMode(
                    "Medical Office",
                    "cross.case.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Medical Clinic",
                    "cross.case.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Primary Care",
                    "stethoscope",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Urgent Care",
                    "cross.case.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Pediatric Clinic",
                    "figure.2.and.child.holdinghands",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Dental Clinic",
                    "cross.case.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Orthodontic Office",
                    "cross.case.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Pharmacy",
                    "pills.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Veterinary Clinic",
                    "pawprint.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Optometry",
                    "eyeglasses",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Chiropractic Clinic",
                    "figure.stand",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Physical Therapy",
                    "figure.walk.motion",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Occupational Therapy",
                    "figure.walk.motion",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Speech Therapy",
                    "waveform",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Mental Health Practice",
                    "brain.head.profile",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Counseling Center",
                    "person.2.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Home Healthcare",
                    "heart.text.square.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Hospice",
                    "heart.text.square.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Senior Care",
                    "person.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Assisted Living",
                    "house.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Medical Laboratory",
                    "testtube.2",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Medical Billing",
                    "doc.text.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Medical Equipment Supplier",
                    "shippingbox.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Ambulance Service",
                    "cross.case.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Rehabilitation Center",
                    "figure.walk",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Specialist Office",
                    "cross.case.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Custom Healthcare Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.healthcare
)

            ]

        ),
                createCategory(

            "Construction & Trades",

            "hammer.fill",

            [

                createMode(
                    "Construction Company",
                    "hammer.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "General Contractor",
                    "person.3.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Home Builder",
                    "house.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Commercial Contractor",
                    "building.2.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Remodeling",
                    "hammer.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Kitchen Remodeling",
                    "fork.knife",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Bathroom Remodeling",
                    "bathtub.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Roofing",
                    "house.lodge.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Siding",
                    "rectangle.grid.2x2.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Gutters",
                    "drop.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Windows & Doors",
                    "door.left.hand.open",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Plumbing",
                    "drop.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Electrical",
                    "bolt.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "HVAC",
                    "snowflake",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Painting",
                    "paintbrush.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Flooring",
                    "rectangle.grid.2x2.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Carpeting",
                    "rectangle.fill.on.rectangle.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Tile Installation",
                    "square.grid.3x3.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Concrete",
                    "square.grid.3x3.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Asphalt",
                    "road.lanes",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Paving",
                    "road.lanes",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Welding",
                    "flame.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Carpentry",
                    "hammer.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Masonry",
                    "bricks.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Drywall",
                    "square.split.2x2.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Excavation",
                    "mountain.2.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Demolition",
                    "hammer.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Landscaping",
                    "leaf.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Lawn Care",
                    "leaf.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Tree Service",
                    "tree.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Irrigation",
                    "drop.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Snow Removal",
                    "snowflake",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Cleaning Service",
                    "sparkles",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Residential Cleaning",
                    "house.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Commercial Cleaning",
                    "building.2.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "House Maid",
                    "house.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Janitorial Services",
                    "sparkles",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Window Cleaning",
                    "sparkles",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Pressure Washing",
                    "water.waves",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Handyman",
                    "wrench.and.screwdriver.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Pest Control",
                    "ant.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Pool Service",
                    "water.waves",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Solar Installation",
                    "sun.max.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Generator Service",
                    "bolt.batteryblock.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Glass Shop",
                    "rectangle.on.rectangle.angled",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Fence Installation",
                    "rectangle.grid.1x2.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Deck Builder",
                    "hammer.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Garage Door Service",
                    "door.garage.closed",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Insulation",
                    "snowflake",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Septic Service",
                    "drop.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Well Drilling",
                    "drop.circle.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Property Maintenance",
                    "building.2.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Restoration Services",
                    "arrow.triangle.2.circlepath",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Water Damage Restoration",
                    "drop.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Fire Damage Restoration",
                    "flame.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Mold Remediation",
                    "exclamationmark.triangle.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Custom Trade Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.construction
)

            ]

        ),

        createCategory(

            "Rental & Equipment",

            "wrench.and.screwdriver.fill",

            [

                createMode(
                    "Rental Tools",
                    "wrench.and.screwdriver.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Tool Rental",
                    "hammer.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Equipment Rental",
                    "shippingbox.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Construction Equipment Rental",
                    "hammer.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Power Tool Rental",
                    "bolt.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Lawn Equipment Rental",
                    "leaf.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Generator Rental",
                    "bolt.circle.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Trailer Rental",
                    "truck.box.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Dumpster Rental",
                    "trash.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Scaffolding Rental",
                    "square.stack.3d.up.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Forklift Rental",
                    "shippingbox.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Excavator Rental",
                    "gearshape.2.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Skid Steer Rental",
                    "gearshape.2.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Mini Excavator Rental",
                    "gearshape.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Concrete Equipment Rental",
                    "hammer.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Floor Equipment Rental",
                    "square.grid.3x3.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Moving Equipment Rental",
                    "dolly.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Storage Container Rental",
                    "shippingbox.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Portable Toilet Rental",
                    "door.left.hand.open",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Furniture Rental",
                    "chair.lounge.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Appliance Rental",
                    "washer.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Audio Visual Equipment Rental",
                    "tv.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Medical Equipment Rental",
                    "cross.case.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Sports Equipment Rental",
                    "figure.run",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Outdoor Equipment Rental",
                    "tent.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Event Equipment Rental",
                    "party.popper.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Office Equipment Rental",
                    "printer.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Computer Equipment Rental",
                    "desktopcomputer",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Camera Equipment Rental",
                    "camera.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Cleaning Equipment Rental",
                    "sparkles",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Pressure Washer Rental",
                    "drop.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Custom Rental Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.rental
)

            ]

        ),

        createCategory(

            "Transportation & Logistics",

            "truck.box.fill",

            [

                createMode(
                    "Trucking Company",
                    "truck.box.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Freight Broker",
                    "shippingbox.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Freight Forwarding",
                    "shippingbox.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Delivery Service",
                    "box.truck.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Courier Service",
                    "paperplane.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Last-Mile Delivery",
                    "box.truck.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Route Delivery",
                    "point.topleft.down.curvedto.point.bottomright.up",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Moving Company",
                    "shippingbox.and.arrow.backward.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Warehouse",
                    "building.2.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Shipping Company",
                    "shippingbox.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Dispatch Company",
                    "location.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Towing Company",
                    "truck.pickup.side.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Fleet Management",
                    "car.2.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Distribution Company",
                    "building.2.crop.circle.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Storage Facility",
                    "archivebox.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Cold Chain Logistics",
                    "snowflake",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Refrigerated Transport",
                    "snowflake",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Medical Transport",
                    "cross.case.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Non-Emergency Medical Transport",
                    "cross.case.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Bus Company",
                    "bus.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Charter Bus",
                    "bus.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "School Bus Service",
                    "bus.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Taxi Service",
                    "car.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Limousine Service",
                    "car.2.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Ride Share Fleet",
                    "car.2.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Car Hauling",
                    "car.2.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Auto Transport",
                    "car.2.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Heavy Haul",
                    "truck.box.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Dump Truck Service",
                    "truck.box.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Hazmat Transport",
                    "exclamationmark.triangle.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Import / Export",
                    "globe",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Logistics Company",
                    "shippingbox.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Custom Logistics Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.logistics
)

            ]

        ),

                createCategory(

            "Automotive",

            "car.fill",

            [

                createMode(
                    "Auto Repair Shop",
                    "car.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Auto Body Shop",
                    "wrench.and.screwdriver.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Collision Center",
                    "wrench.and.screwdriver.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Tire Shop",
                    "circle.hexagongrid.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Car Wash",
                    "drop.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Auto Detailing",
                    "sparkles",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Car Dealership",
                    "car.2.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Used Car Dealership",
                    "car.2.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "New Car Dealership",
                    "car.2.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Auto Parts Store",
                    "gearshape.2.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Oil Change Center",
                    "drop.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Mobile Mechanic",
                    "wrench.and.screwdriver.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Car Rental",
                    "key.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Diesel Repair",
                    "fuelpump.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Transmission Shop",
                    "gearshape.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Brake Shop",
                    "exclamationmark.octagon.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Muffler Shop",
                    "wrench.and.screwdriver.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Alignment Shop",
                    "steeringwheel",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Fleet Repair",
                    "car.2.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Motorcycle Shop",
                    "motorcycle.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Powersports Dealer",
                    "motorcycle.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Boat Repair",
                    "ferry.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Marine Services",
                    "sailboat.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "RV Dealer",
                    "bus.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "RV Repair",
                    "bus.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Window Tint",
                    "sun.max.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Car Audio Installation",
                    "speaker.wave.3.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Vehicle Wraps",
                    "paintbrush.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Paint Protection Film",
                    "shield.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Windshield Repair",
                    "rectangle.on.rectangle.angled",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Towing Service",
                    "truck.pickup.side.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Roadside Assistance",
                    "wrench.and.screwdriver.fill",
                    BUSINESS_MODULE_PROFILES.automotive
),

                createMode(
                    "Custom Automotive Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.automotive
)

            ]

        ),

        createCategory(

            "Professional Services",

            "briefcase.fill",

            [

                createMode(
                    "Accounting Firm",
                    "chart.bar.doc.horizontal.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "CPA Firm",
                    "chart.bar.doc.horizontal.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Bookkeeping",
                    "book.closed.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Tax Preparation",
                    "doc.text.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Payroll Services",
                    "creditcard.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Law Office",
                    "scale.3d",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Immigration Services",
                    "globe",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Insurance Agency",
                    "shield.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Financial Advisor",
                    "dollarsign.circle.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Investment Firm",
                    "chart.line.uptrend.xyaxis",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Business Consulting",
                    "person.2.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Management Consulting",
                    "person.3.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Marketing Agency",
                    "megaphone.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Advertising Agency",
                    "megaphone.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Branding Agency",
                    "paintpalette.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Recruiting Agency",
                    "person.badge.plus.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Staffing Agency",
                    "person.3.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "HR Services",
                    "person.2.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Translation Services",
                    "globe",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Interpreter Services",
                    "character.bubble.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Notary Public",
                    "signature",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Document Preparation",
                    "doc.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Private Investigator",
                    "magnifyingglass",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Security Company",
                    "shield.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Call Center",
                    "phone.connection.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Virtual Assistant",
                    "desktopcomputer",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Business Broker",
                    "building.2.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Franchise Consulting",
                    "building.columns.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Custom Professional Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.professional
)

            ]

        ),

        createCategory(

            "Engineering & Design",

            "ruler.fill",

            [

                createMode(
                    "Engineering Firm",
                    "gearshape.2.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Civil Engineering",
                    "building.2.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Mechanical Engineering",
                    "gearshape.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Electrical Engineering",
                    "bolt.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Structural Engineering",
                    "building.columns.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Architecture Firm",
                    "building.columns.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Interior Design",
                    "sofa.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Landscape Architecture",
                    "leaf.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "CAD Design",
                    "pencil.and.ruler.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "3D Modeling",
                    "cube.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Industrial Design",
                    "cube.box.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Surveying",
                    "map.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Blueprint Services",
                    "doc.richtext.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Custom Engineering Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.professional
)

            ]

        ),

                createCategory(

            "Real Estate & Property",

            "house.fill",

            [

                createMode(
                    "Real Estate Agency",
                    "house.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Commercial Real Estate",
                    "building.2.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Luxury Real Estate",
                    "house.lodge.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Property Management",
                    "building.2.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Apartment Management",
                    "building.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "HOA Management",
                    "person.3.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Vacation Rentals",
                    "bed.double.fill",
                    BUSINESS_MODULE_PROFILES.hospitality
),

                createMode(
                    "Airbnb Management",
                    "house.lodge.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Storage Facility",
                    "archivebox.fill",
                    BUSINESS_MODULE_PROFILES.logistics
                ),

                createMode(
                    "Home Inspection",
                    "checkmark.shield.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Home Appraisal",
                    "house.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Mortgage Brokerage",
                    "dollarsign.circle.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Title Company",
                    "doc.text.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Escrow Services",
                    "lock.doc.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Real Estate Investor",
                    "chart.line.uptrend.xyaxis",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "House Flipping",
                    "hammer.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Custom Real Estate Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.professional
)

            ]

        ),

        createCategory(

            "Technology & Digital",

            "desktopcomputer",

            [

                createMode(
                    "Software Company",
                    "curlybraces",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "SaaS Company",
                    "cloud.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "AI Company",
                    "brain.head.profile",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "AI Consulting",
                    "brain.head.profile",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "IT Services",
                    "network",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Managed IT",
                    "server.rack",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Cybersecurity",
                    "lock.shield.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Cloud Services",
                    "icloud.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Data Center",
                    "server.rack",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Hosting Company",
                    "server.rack",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Computer Repair",
                    "desktopcomputer",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Networking",
                    "network",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Fiber Optic Installation",
                    "cable.connector",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Telecommunications",
                    "antenna.radiowaves.left.and.right",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "CCTV Installation",
                    "video.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Access Control Systems",
                    "lock.rectangle.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "POS Systems",
                    "creditcard.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "ERP Solutions",
                    "square.grid.2x2.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "CRM Solutions",
                    "person.3.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Web Design",
                    "globe",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Web Development",
                    "globe",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Mobile App Development",
                    "iphone",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Automation Services",
                    "gearshape.2.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Robotics",
                    "cpu.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Drone Services",
                    "airplane",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Blockchain",
                    "link",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Game Development",
                    "gamecontroller.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Digital Marketing",
                    "megaphone.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "SEO Agency",
                    "magnifyingglass",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "UI / UX Design",
                    "paintbrush.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Graphic Design Studio",
                    "paintpalette.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Custom Technology Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.technology
)

            ]

        ),

        createCategory(

            "Education & Training",

            "graduationcap.fill",

            [

                createMode(
                    "University",
                    "graduationcap.fill",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "College",
                    "building.columns.fill",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "School",
                    "graduationcap.fill",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Elementary School",
                    "book.fill",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "High School",
                    "book.fill",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Daycare",
                    "figure.2.and.child.holdinghands",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Preschool",
                    "figure.2.and.child.holdinghands",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Tutoring Center",
                    "book.fill",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Driving School",
                    "car.fill",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "CDL School",
                    "truck.box.fill",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Trade School",
                    "hammer.fill",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Coding Bootcamp",
                    "curlybraces",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Online Academy",
                    "play.rectangle.fill",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Language Academy",
                    "globe",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Music School",
                    "music.note",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Dance Academy",
                    "figure.dance",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Martial Arts Academy",
                    "figure.martial.arts",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Corporate Training",
                    "person.3.fill",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Custom Education Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.education
)

            ]

        ),

                createCategory(

            "Fitness & Sports",

            "figure.run",

            [

                createMode(
                    "Fitness Center",
                    "figure.run",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Gym",
                    "dumbbell.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Personal Training",
                    "figure.strengthtraining.traditional",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "CrossFit Gym",
                    "figure.strengthtraining.traditional",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Yoga Studio",
                    "figure.yoga",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Pilates Studio",
                    "figure.flexibility",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Martial Arts School",
                    "figure.martial.arts",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Boxing Gym",
                    "figure.boxing",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Dance Studio",
                    "figure.dance",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Swimming School",
                    "figure.pool.swim",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Sports Academy",
                    "sportscourt.fill",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Sports Club",
                    "sportscourt.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Sports Performance Center",
                    "figure.run.circle.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Recreation Center",
                    "building.2.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Custom Fitness Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.professional
)

            ]

        ),

        createCategory(

            "Creative & Media",

            "paintpalette.fill",

            [

                createMode(
                    "Photography Studio",
                    "camera.fill",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "Videography",
                    "video.fill",
                    BUSINESS_MODULE_PROFILES.events
),

                createMode(
                    "Film Production",
                    "film.fill",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "Podcast Studio",
                    "mic.fill",
                    BUSINESS_MODULE_PROFILES.events
),

                createMode(
                    "Recording Studio",
                    "music.mic",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "Music Production",
                    "music.note.house.fill",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "Graphic Design",
                    "paintpalette.fill",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "Branding Studio",
                    "paintbrush.fill",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "Advertising Agency",
                    "megaphone.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Animation Studio",
                    "sparkles.tv.fill",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "3D Animation",
                    "cube.fill",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "Printing Company",
                    "printer.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Sign Company",
                    "signpost.right.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Digital Content Creator",
                    "play.rectangle.fill",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "Influencer Agency",
                    "person.crop.circle.badge.star",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "Marketing Studio",
                    "megaphone.fill",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "Custom Creative Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.media
)

            ]

        ),

        createCategory(

            "Events & Entertainment",

            "party.popper.fill",

            [

                createMode(
                    "Event Planner",
                    "calendar",
                    BUSINESS_MODULE_PROFILES.events
),

                createMode(
                    "Wedding Planner",
                    "heart.fill",
                    BUSINESS_MODULE_PROFILES.events
),

                createMode(
                    "Party Rentals",
                    "party.popper.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Bounce House Rentals",
                    "house.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "DJ Services",
                    "music.note.list",
                    BUSINESS_MODULE_PROFILES.events
),

                createMode(
                    "Live Entertainment",
                    "music.mic",
                    BUSINESS_MODULE_PROFILES.events
),

                createMode(
                    "Concert Promoter",
                    "music.note",
                    BUSINESS_MODULE_PROFILES.events
),

                createMode(
                    "Event Venue",
                    "building.columns.fill",
                    BUSINESS_MODULE_PROFILES.events
),

                createMode(
                    "Banquet Hall",
                    "building.fill",
                    BUSINESS_MODULE_PROFILES.events
),

                createMode(
                    "Convention Center",
                    "building.2.fill",
                    BUSINESS_MODULE_PROFILES.events
),

                createMode(
                    "Casino",
                    "suit.club.fill",
                    BUSINESS_MODULE_PROFILES.events
),

                createMode(
                    "Movie Theater",
                    "film.fill",
                    BUSINESS_MODULE_PROFILES.events
),

                createMode(
                    "Arcade",
                    "gamecontroller.fill",
                    BUSINESS_MODULE_PROFILES.events
),

                createMode(
                    "Escape Room",
                    "lock.fill",
                    BUSINESS_MODULE_PROFILES.events
),

                createMode(
                    "Custom Event Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.events
)

            ]

        ),

        createCategory(

            "Hospitality & Travel",

            "bed.double.fill",

            [

                createMode(
                    "Hotel",
                    "bed.double.fill",
                    BUSINESS_MODULE_PROFILES.hospitality
),

                createMode(
                    "Motel",
                    "bed.double.fill",
                    BUSINESS_MODULE_PROFILES.hospitality
),

                createMode(
                    "Resort",
                    "beach.umbrella.fill",
                    BUSINESS_MODULE_PROFILES.hospitality
),

                createMode(
                    "Bed & Breakfast",
                    "house.lodge.fill",
                    BUSINESS_MODULE_PROFILES.hospitality
),

                createMode(
                    "Vacation Rental",
                    "house.fill",
                    BUSINESS_MODULE_PROFILES.hospitality
),

                createMode(
                    "Travel Agency",
                    "airplane",
                    BUSINESS_MODULE_PROFILES.hospitality
),

                createMode(
                    "Tour Operator",
                    "map.fill",
                    BUSINESS_MODULE_PROFILES.hospitality
),

                createMode(
                    "Cruise Agency",
                    "ferry.fill",
                    BUSINESS_MODULE_PROFILES.hospitality
),

                createMode(
                    "Campground",
                    "tent.fill",
                    BUSINESS_MODULE_PROFILES.hospitality
),

                createMode(
                    "RV Park",
                    "bus.fill",
                    BUSINESS_MODULE_PROFILES.hospitality
),

                createMode(
                    "Hostel",
                    "building.fill",
                    BUSINESS_MODULE_PROFILES.hospitality
),

                createMode(
                    "Luxury Concierge",
                    "star.fill",
                    BUSINESS_MODULE_PROFILES.hospitality
),

                createMode(
                    "Vacation Planning",
                    "calendar.badge.clock",
                    BUSINESS_MODULE_PROFILES.hospitality
),

                createMode(
                    "Custom Hospitality Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.hospitality
)

            ]

        ),

                createCategory(

            "Industrial & Manufacturing",

            "gearshape.2.fill",

            [

                createMode(
                    "Manufacturing Company",
                    "gearshape.2.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Industrial Plant",
                    "building.2.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Factory",
                    "building.2.crop.circle.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Machine Shop",
                    "gearshape.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Metal Fabrication",
                    "hammer.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Steel Fabrication",
                    "building.columns.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Wood Manufacturing",
                    "tree.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Furniture Manufacturing",
                    "chair.lounge.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Cabinet Manufacturing",
                    "cabinet.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Packaging Company",
                    "shippingbox.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Printing Manufacturing",
                    "printer.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Plastic Manufacturing",
                    "cube.box.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Food Manufacturing",
                    "fork.knife",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Beverage Manufacturing",
                    "cup.and.saucer.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Textile Manufacturing",
                    "tshirt.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Chemical Manufacturing",
                    "flask.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Electronics Manufacturing",
                    "cpu.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Medical Device Manufacturing",
                    "cross.case.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Custom Manufacturing Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.manufacturing
)

            ]

        ),

        createCategory(

            "Agriculture & Farming",

            "leaf.fill",

            [

                createMode(
                    "Farm",
                    "leaf.fill",
                    BUSINESS_MODULE_PROFILES.agriculture
),

                createMode(
                    "Crop Farm",
                    "leaf.fill",
                    BUSINESS_MODULE_PROFILES.agriculture
),

                createMode(
                    "Livestock Farm",
                    "hare.fill",
                    BUSINESS_MODULE_PROFILES.agriculture
),

                createMode(
                    "Dairy Farm",
                    "drop.fill",
                    BUSINESS_MODULE_PROFILES.agriculture
),

                createMode(
                    "Poultry Farm",
                    "bird.fill",
                    BUSINESS_MODULE_PROFILES.agriculture
),

                createMode(
                    "Horse Farm",
                    "figure.equestrian.sports",
                    BUSINESS_MODULE_PROFILES.agriculture
),

                createMode(
                    "Greenhouse",
                    "leaf.circle.fill",
                    BUSINESS_MODULE_PROFILES.agriculture
),

                createMode(
                    "Nursery",
                    "tree.fill",
                    BUSINESS_MODULE_PROFILES.agriculture
),

                createMode(
                    "Garden Center",
                    "camera.macro",
                    BUSINESS_MODULE_PROFILES.agriculture
),

                createMode(
                    "Orchard",
                    "apple.logo",
                    BUSINESS_MODULE_PROFILES.agriculture
),

                createMode(
                    "Vineyard",
                    "wineglass.fill",
                    BUSINESS_MODULE_PROFILES.agriculture
),

                createMode(
                    "Apiary",
                    "hexagon.fill",
                    BUSINESS_MODULE_PROFILES.agriculture
),

                createMode(
                    "Aquaculture",
                    "fish.fill",
                    BUSINESS_MODULE_PROFILES.agriculture
),

                createMode(
                    "Agricultural Services",
                    "tractor",
                    BUSINESS_MODULE_PROFILES.agriculture
),

                createMode(
                    "Feed Supplier",
                    "shippingbox.fill",
                    BUSINESS_MODULE_PROFILES.wholesale
),

                createMode(
                    "Farm Equipment Dealer",
                    "tractor",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Organic Farming",
                    "leaf.fill",
                    BUSINESS_MODULE_PROFILES.agriculture
),

                createMode(
                    "Custom Agriculture Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.agriculture
)

            ]

        ),

        createCategory(

            "Nonprofit & Community",

            "heart.fill",

            [

                createMode(
                    "Nonprofit Organization",
                    "heart.fill",
                    BUSINESS_MODULE_PROFILES.nonprofit
),

                createMode(
                    "Charity",
                    "heart.circle.fill",
                    BUSINESS_MODULE_PROFILES.nonprofit
),

                createMode(
                    "Foundation",
                    "building.columns.fill",
                    BUSINESS_MODULE_PROFILES.nonprofit
),

                createMode(
                    "Religious Organization",
                    "building.columns.fill",
                    BUSINESS_MODULE_PROFILES.nonprofit
),

                createMode(
                    "Church",
                    "building.columns.fill",
                    BUSINESS_MODULE_PROFILES.nonprofit
),

                createMode(
                    "Community Center",
                    "person.3.fill",
                    BUSINESS_MODULE_PROFILES.nonprofit
),

                createMode(
                    "Food Bank",
                    "basket.fill",
                    BUSINESS_MODULE_PROFILES.nonprofit
),

                createMode(
                    "Animal Rescue",
                    "pawprint.fill",
                    BUSINESS_MODULE_PROFILES.nonprofit
),

                createMode(
                    "Shelter",
                    "house.fill",
                    BUSINESS_MODULE_PROFILES.nonprofit
),

                createMode(
                    "Youth Organization",
                    "figure.2.and.child.holdinghands",
                    BUSINESS_MODULE_PROFILES.nonprofit
),

                createMode(
                    "Senior Center",
                    "person.fill",
                    BUSINESS_MODULE_PROFILES.nonprofit
),

                createMode(
                    "Volunteer Organization",
                    "person.3.sequence.fill",
                    BUSINESS_MODULE_PROFILES.nonprofit
),

                createMode(
                    "Cultural Organization",
                    "globe",
                    BUSINESS_MODULE_PROFILES.nonprofit
),

                createMode(
                    "Educational Foundation",
                    "graduationcap.fill",
                    BUSINESS_MODULE_PROFILES.nonprofit
),

                createMode(
                    "Environmental Organization",
                    "leaf.fill",
                    BUSINESS_MODULE_PROFILES.nonprofit
),

                createMode(
                    "Community Outreach",
                    "person.2.wave.2.fill",
                    BUSINESS_MODULE_PROFILES.nonprofit
),

                createMode(
                    "Custom Nonprofit Organization",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.nonprofit
)

            ]

        ),

        createCategory(

            "Modern Online Businesses",

            "globe",

            [

                createMode(
                    "E-Commerce Brand",
                    "cart.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Subscription Business",
                    "repeat.circle.fill",
                    BUSINESS_MODULE_PROFILES.online
),

                createMode(
                    "Digital Products",
                    "square.stack.3d.up.fill",
                    BUSINESS_MODULE_PROFILES.online
),

                createMode(
                    "Online Courses",
                    "play.rectangle.fill",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Membership Website",
                    "person.crop.circle.badge.checkmark",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Affiliate Marketing",
                    "link",
                    BUSINESS_MODULE_PROFILES.online
),

                createMode(
                    "Dropshipping",
                    "shippingbox.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Print On Demand",
                    "printer.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Marketplace Seller",
                    "storefront.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Creator Economy",
                    "person.crop.square",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "Influencer Business",
                    "person.crop.circle.badge.star",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "YouTube Channel",
                    "play.tv.fill",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "Podcast Network",
                    "mic.fill",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "Newsletter Business",
                    "newspaper.fill",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "Online Coaching",
                    "person.fill.questionmark",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Virtual Services",
                    "desktopcomputer",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Remote Agency",
                    "network",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Custom Digital Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.online
)

            ]

        ),

                createCategory(

            "Banking & Financial Services",

            "building.columns.fill",

            [

                createMode(
                    "Bank",
                    "building.columns.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Credit Union",
                    "building.columns.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Mortgage Company",
                    "house.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Investment Firm",
                    "chart.line.uptrend.xyaxis",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Financial Planning",
                    "dollarsign.circle.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Wealth Management",
                    "chart.pie.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Accounting Firm",
                    "chart.bar.doc.horizontal.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "CPA Firm",
                    "doc.text.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Bookkeeping",
                    "book.closed.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Tax Services",
                    "percent",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Payroll Services",
                    "creditcard.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Payment Processing",
                    "creditcard.and.123",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "FinTech Company",
                    "iphone",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Cryptocurrency Services",
                    "bitcoinsign.circle.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Insurance Company",
                    "shield.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Insurance Agency",
                    "shield.lefthalf.filled",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Loan Company",
                    "banknote.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Collection Agency",
                    "tray.full.fill",
                    BUSINESS_MODULE_PROFILES.financial
),

                createMode(
                    "Custom Financial Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.financial
)

            ]

        ),

        createCategory(

            "Legal Services",

            "scale.3d",

            [

                createMode(
                    "Law Firm",
                    "scale.3d",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Attorney Office",
                    "person.crop.rectangle",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Family Law",
                    "person.3.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Immigration Law",
                    "globe",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Criminal Defense",
                    "shield.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Civil Litigation",
                    "doc.text.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Corporate Law",
                    "building.columns.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Estate Planning",
                    "doc.richtext.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Real Estate Law",
                    "house.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Bankruptcy Law",
                    "tray.full.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Employment Law",
                    "person.2.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Notary Public",
                    "signature",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Legal Consulting",
                    "person.fill.questionmark",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Legal Document Services",
                    "doc.text.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Custom Legal Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.professional
)

            ]

        ),

        createCategory(

            "Energy & Utilities",

            "bolt.fill",

            [

                createMode(
                    "Electric Utility",
                    "bolt.fill",
                    BUSINESS_MODULE_PROFILES.utilities
),

                createMode(
                    "Water Utility",
                    "drop.fill",
                    BUSINESS_MODULE_PROFILES.utilities
),

                createMode(
                    "Natural Gas Utility",
                    "flame.fill",
                    BUSINESS_MODULE_PROFILES.utilities
),

                createMode(
                    "Solar Energy",
                    "sun.max.fill",
                    BUSINESS_MODULE_PROFILES.utilities
),

                createMode(
                    "Wind Energy",
                    "wind",
                    BUSINESS_MODULE_PROFILES.utilities
),

                createMode(
                    "Battery Storage",
                    "battery.100percent",
                    BUSINESS_MODULE_PROFILES.utilities
),

                createMode(
                    "EV Charging",
                    "ev.charger.fill",
                    BUSINESS_MODULE_PROFILES.utilities
),

                createMode(
                    "Utility Contractor",
                    "wrench.and.screwdriver.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Power Generation",
                    "bolt.circle.fill",
                    BUSINESS_MODULE_PROFILES.utilities
),

                createMode(
                    "Energy Consulting",
                    "leaf.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Custom Energy Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.utilities
)

            ]

        ),

        createCategory(

            "Oil & Gas",

            "flame.fill",

            [

                createMode(
                    "Oil Company",
                    "drop.fill",
                    BUSINESS_MODULE_PROFILES.industrial
),

                createMode(
                    "Gas Company",
                    "flame.fill",
                    BUSINESS_MODULE_PROFILES.industrial
),

                createMode(
                    "Pipeline Services",
                    "pipe.and.drop.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Refinery",
                    "building.2.fill",
                    BUSINESS_MODULE_PROFILES.industrial
),

                createMode(
                    "Fuel Distributor",
                    "fuelpump.fill",
                    BUSINESS_MODULE_PROFILES.wholesale
),

                createMode(
                    "Fuel Station",
                    "fuelpump.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Petroleum Services",
                    "drop.circle.fill",
                    BUSINESS_MODULE_PROFILES.industrial
),

                createMode(
                    "Oilfield Services",
                    "hammer.fill",
                    BUSINESS_MODULE_PROFILES.industrial
),

                createMode(
                    "Drilling Contractor",
                    "mountain.2.fill",
                    BUSINESS_MODULE_PROFILES.construction
),

                createMode(
                    "Custom Oil & Gas Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.industrial
)

            ]

        ),

        createCategory(

            "Telecommunications",

            "antenna.radiowaves.left.and.right",

            [

                createMode(
                    "Telecommunications Company",
                    "antenna.radiowaves.left.and.right",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Internet Service Provider",
                    "wifi",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Fiber Internet",
                    "cable.connector",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Wireless Carrier",
                    "cellularbars",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "VoIP Services",
                    "phone.connection.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Satellite Communications",
                    "dot.radiowaves.left.and.right",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Network Infrastructure",
                    "network",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Data Communications",
                    "externaldrive.connected.to.line.below.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Telecom Equipment",
                    "server.rack",
                    BUSINESS_MODULE_PROFILES.wholesale
),

                createMode(
                    "Custom Telecommunications Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.technology
)

            ]

        ),

                createCategory(

            "Security & Public Safety",

            "shield.fill",

            [

                createMode(
                    "Security Company",
                    "shield.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Private Security",
                    "person.badge.shield.checkmark.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Security Guard Services",
                    "person.badge.shield.checkmark.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Patrol Services",
                    "car.2.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Alarm Company",
                    "bell.and.waves.left.and.right.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Fire Alarm Services",
                    "flame.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Security System Installation",
                    "lock.shield.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "CCTV Security",
                    "video.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Access Control",
                    "lock.rectangle.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Cybersecurity Services",
                    "lock.shield.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Emergency Management",
                    "exclamationmark.triangle.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Fire Protection Services",
                    "flame.circle.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Fire Extinguisher Service",
                    "flame.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Workplace Safety",
                    "cross.case.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Safety Consulting",
                    "checkmark.shield.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Background Check Services",
                    "person.text.rectangle.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Custom Security Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.professional
)

            ]

        ),

        createCategory(

            "Scientific & Laboratory",

            "flask.fill",

            [

                createMode(
                    "Scientific Laboratory",
                    "flask.fill",
                    BUSINESS_MODULE_PROFILES.scientific
),

                createMode(
                    "Research Laboratory",
                    "testtube.2",
                    BUSINESS_MODULE_PROFILES.scientific
),

                createMode(
                    "Medical Laboratory",
                    "cross.vial.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Diagnostic Laboratory",
                    "waveform.path.ecg.rectangle.fill",
                    BUSINESS_MODULE_PROFILES.scientific
),

                createMode(
                    "Testing Laboratory",
                    "checkmark.seal.fill",
                    BUSINESS_MODULE_PROFILES.scientific
),

                createMode(
                    "Environmental Testing",
                    "leaf.fill",
                    BUSINESS_MODULE_PROFILES.scientific
),

                createMode(
                    "Water Testing",
                    "drop.fill",
                    BUSINESS_MODULE_PROFILES.scientific
),

                createMode(
                    "Food Testing Laboratory",
                    "fork.knife",
                    BUSINESS_MODULE_PROFILES.scientific
),

                createMode(
                    "Chemical Laboratory",
                    "flask.fill",
                    BUSINESS_MODULE_PROFILES.scientific
),

                createMode(
                    "Biotechnology Company",
                    "microbe.fill",
                    BUSINESS_MODULE_PROFILES.scientific
),

                createMode(
                    "Pharmaceutical Research",
                    "pills.fill",
                    BUSINESS_MODULE_PROFILES.scientific
),

                createMode(
                    "Clinical Research",
                    "cross.case.fill",
                    BUSINESS_MODULE_PROFILES.scientific
),

                createMode(
                    "Forensic Laboratory",
                    "magnifyingglass",
                    BUSINESS_MODULE_PROFILES.scientific
),

                createMode(
                    "Quality Control Laboratory",
                    "checkmark.shield.fill",
                    BUSINESS_MODULE_PROFILES.scientific
),

                createMode(
                    "Calibration Services",
                    "ruler.fill",
                    BUSINESS_MODULE_PROFILES.scientific
),

                createMode(
                    "Custom Scientific Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.scientific
)

            ]

        ),

        createCategory(

            "Aviation & Aerospace",

            "airplane",

            [

                createMode(
                    "Airline",
                    "airplane",
                    BUSINESS_MODULE_PROFILES.aviation
),

                createMode(
                    "Charter Airline",
                    "airplane.departure",
                    BUSINESS_MODULE_PROFILES.aviation
),

                createMode(
                    "Private Aviation",
                    "airplane.circle.fill",
                    BUSINESS_MODULE_PROFILES.aviation
),

                createMode(
                    "Flight School",
                    "graduationcap.fill",
                    BUSINESS_MODULE_PROFILES.aviation
),

                createMode(
                    "Aircraft Rental",
                    "airplane",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Aircraft Maintenance",
                    "wrench.and.screwdriver.fill",
                    BUSINESS_MODULE_PROFILES.aviation
),

                createMode(
                    "Aircraft Repair",
                    "gearshape.2.fill",
                    BUSINESS_MODULE_PROFILES.aviation
),

                createMode(
                    "Aircraft Parts Supplier",
                    "shippingbox.fill",
                    BUSINESS_MODULE_PROFILES.wholesale
),

                createMode(
                    "Aviation Consulting",
                    "person.2.fill",
                    BUSINESS_MODULE_PROFILES.aviation
),

                createMode(
                    "Airport Services",
                    "airplane.arrival",
                    BUSINESS_MODULE_PROFILES.aviation
),

                createMode(
                    "Ground Handling",
                    "truck.box.fill",
                    BUSINESS_MODULE_PROFILES.aviation
),

                createMode(
                    "Air Cargo",
                    "shippingbox.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Drone Company",
                    "airplane",
                    BUSINESS_MODULE_PROFILES.aviation
),

                createMode(
                    "Drone Photography",
                    "camera.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Drone Inspection",
                    "viewfinder",
                    BUSINESS_MODULE_PROFILES.aviation
),

                createMode(
                    "Aerospace Engineering",
                    "gearshape.2.fill",
                    BUSINESS_MODULE_PROFILES.aviation
),

                createMode(
                    "Aerospace Manufacturing",
                    "building.2.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Custom Aviation Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.aviation
)

            ]

        ),

        createCategory(

            "Animal Services",

            "pawprint.fill",

            [

                createMode(
                    "Veterinary Clinic",
                    "cross.case.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Animal Hospital",
                    "cross.case.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Pet Grooming",
                    "scissors",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Mobile Pet Grooming",
                    "truck.box.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Pet Boarding",
                    "house.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Dog Daycare",
                    "pawprint.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Pet Sitting",
                    "person.and.background.dotted",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Dog Walking",
                    "figure.walk",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Pet Training",
                    "figure.and.child.holdinghands",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Dog Training",
                    "pawprint.circle.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Pet Store",
                    "cart.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Pet Supply Store",
                    "shippingbox.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Animal Rescue",
                    "heart.fill",
                    BUSINESS_MODULE_PROFILES.nonprofit
),

                createMode(
                    "Animal Shelter",
                    "house.fill",
                    BUSINESS_MODULE_PROFILES.nonprofit
),

                createMode(
                    "Horse Boarding",
                    "figure.equestrian.sports",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Equine Services",
                    "figure.equestrian.sports",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Pet Transportation",
                    "car.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Custom Animal Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.professional
)

            ]

        ),

                createCategory(

            "Childcare & Family Services",

            "figure.2.and.child.holdinghands",

            [

                createMode(
                    "Childcare Center",
                    "figure.2.and.child.holdinghands",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Daycare",
                    "figure.2.and.child.holdinghands",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Preschool",
                    "graduationcap.fill",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "After School Program",
                    "book.fill",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Early Learning Center",
                    "book.closed.fill",
                    BUSINESS_MODULE_PROFILES.education
),

                createMode(
                    "Babysitting Services",
                    "person.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Nanny Agency",
                    "person.2.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Family Counseling",
                    "heart.text.square.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Parent Coaching",
                    "person.2.wave.2.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Children's Therapy",
                    "heart.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Custom Family Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.education
)

            ]

        ),

        createCategory(

            "Senior Care & Home Services",

            "house.fill",

            [

                createMode(
                    "Senior Care",
                    "person.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Home Care",
                    "house.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Home Health Agency",
                    "heart.text.square.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Assisted Living",
                    "building.2.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Memory Care",
                    "brain.head.profile",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Hospice Care",
                    "cross.case.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Companion Care",
                    "person.2.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Private Duty Nursing",
                    "cross.case.fill",
                    BUSINESS_MODULE_PROFILES.healthcare
),

                createMode(
                    "Medical Transportation",
                    "car.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Meal Delivery",
                    "takeoutbag.and.cup.and.straw.fill",
                    BUSINESS_MODULE_PROFILES.logistics
),

                createMode(
                    "Custom Senior Care Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.healthcare
)

            ]

        ),

        createCategory(

            "Laundry & Garment Care",

            "washer.fill",

            [

                createMode(
                    "Laundry Service",
                    "washer.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Laundromat",
                    "washer.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Dry Cleaning",
                    "sparkles",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Commercial Laundry",
                    "building.2.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Uniform Rental",
                    "tshirt.fill",
                    BUSINESS_MODULE_PROFILES.rental
),

                createMode(
                    "Alterations",
                    "scissors",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Tailor Shop",
                    "scissors",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Shoe Repair",
                    "shoeprints.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Leather Repair",
                    "shippingbox.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Custom Laundry Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.professional
)

            ]

        ),

        createCategory(

            "Fashion & Apparel",

            "tshirt.fill",

            [

                createMode(
                    "Fashion Boutique",
                    "tshirt.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Clothing Brand",
                    "tshirt.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Designer Studio",
                    "paintpalette.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Custom Apparel",
                    "tshirt.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Embroidery",
                    "pencil.tip",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Screen Printing",
                    "printer.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Promotional Products",
                    "gift.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Uniform Supplier",
                    "person.crop.rectangle",
                    BUSINESS_MODULE_PROFILES.wholesale
),

                createMode(
                    "Fashion Accessories",
                    "bag.fill",
                    BUSINESS_MODULE_PROFILES.commerce
),

                createMode(
                    "Jewelry Designer",
                    "diamond.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Custom Fashion Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.commerce
)

            ]

        ),

        createCategory(

            "Publishing & Information",

            "newspaper.fill",

            [

                createMode(
                    "Publishing Company",
                    "newspaper.fill",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "Magazine Publisher",
                    "book.closed.fill",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "Newspaper",
                    "newspaper.fill",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "Book Publisher",
                    "book.fill",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "Printing Press",
                    "printer.fill",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Media Company",
                    "tv.fill",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "News Agency",
                    "newspaper.fill",
                    BUSINESS_MODULE_PROFILES.media
),

                createMode(
                    "Research Organization",
                    "magnifyingglass",
                    BUSINESS_MODULE_PROFILES.scientific
),

                createMode(
                    "Technical Documentation",
                    "doc.richtext.fill",
                    BUSINESS_MODULE_PROFILES.professional
),

                createMode(
                    "Knowledge Platform",
                    "brain.head.profile",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Custom Publishing Business",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.media
)

            ]

        ),

        createCategory(

            "Advanced Technology",

            "cpu.fill",

            [

                createMode(
                    "Artificial Intelligence",
                    "brain.head.profile",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Machine Learning",
                    "cpu.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Robotics",
                    "gearshape.2.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Internet of Things",
                    "network",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Quantum Computing",
                    "atom",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Semiconductor Company",
                    "cpu",
                    BUSINESS_MODULE_PROFILES.manufacturing
),

                createMode(
                    "Space Technology",
                    "sparkles",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Nanotechnology",
                    "circle.hexagongrid.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Research & Development",
                    "flask.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Innovation Lab",
                    "lightbulb.fill",
                    BUSINESS_MODULE_PROFILES.technology
),

                createMode(
                    "Custom Technology Company",
                    "square.and.pencil",
                    BUSINESS_MODULE_PROFILES.technology
)

            ]

        ),

            ]

}

// =======================================================
// MARK: - Computed Collections
// =======================================================

export const allCategories = BusinessModeLibrary.categories

export const allModes = allCategories.flatMap(category => category.modes)

export const allModeNames = allModes.map(mode => mode.name)

// =======================================================
// MARK: - Find Helpers
// =======================================================

export function findCategory(
    id: string
): BusinessModeCategory | undefined {

    return allCategories.find(category => category.id === id)

}

export function findCategoryByTitle(
    title: string
): BusinessModeCategory | undefined {

    return allCategories.find(category => category.title === title)

}

export function findMode(
    id: string
): BusinessModeOption | undefined {

    return allModes.find(mode => mode.id === id)

}

export function findModeByName(
    name: string
): BusinessModeOption | undefined {

    return allModes.find(mode => mode.name === name)

}

// =======================================================
// MARK: - Business Information
// =======================================================

export function iconForMode(
    modeName: string
): string {

    return (
        findModeByName(modeName)?.icon ??
        "briefcase.fill"
    )

}

export function categoryTitleForMode(
    modeName: string
): string {

    const category = allCategories.find(category =>
        category.modes.some(mode => mode.name === modeName)
    )

    return category?.title ?? ""

}

export function categoryForMode(
    modeName: string
): BusinessModeCategory | undefined {

    return allCategories.find(category =>
        category.modes.some(mode => mode.name === modeName)
    )

}

// =======================================================
// MARK: - Validation
// =======================================================

export function isValidMode(
    modeName: string
): boolean {

    return allModes.some(mode => mode.name === modeName)

}

export function isValidCategory(
    title: string
): boolean {

    return allCategories.some(category => category.title === title)

}

// =======================================================
// MARK: - Defaults
// =======================================================

export function defaultCategory(): BusinessModeCategory {

    return allCategories[0]

}

export function defaultMode(): BusinessModeOption {

    return allCategories[0].modes[0]

}

// =======================================================
// MARK: - Search
// =======================================================

export function searchCategories(
    text: string
): BusinessModeCategory[] {

    if (!text.trim()) {

        return allCategories

    }

    const value = text.toLowerCase()

    return allCategories.filter(category =>
        category.title.toLowerCase().includes(value)
    )

}

export function searchModes(
    text: string
): BusinessModeOption[] {

    if (!text.trim()) {

        return allModes

    }

    const value = text.toLowerCase()

    return allModes.filter(mode =>
        mode.name.toLowerCase().includes(value)
    )

}

// =======================================================
// MARK: - Grouped Search
// =======================================================

export function searchGrouped(
    text: string
): BusinessModeCategory[] {

    if (!text.trim()) {

        return allCategories

    }

    const value = text.toLowerCase()

    return allCategories
        .map(category => ({

            ...category,

            modes: category.modes.filter(mode =>
                mode.name.toLowerCase().includes(value)
            )

        }))
        .filter(category => category.modes.length > 0)

}

// =======================================================
// MARK: - Statistics
// =======================================================

export const BusinessModeStatistics = {

    totalCategories: allCategories.length,

    totalModes: allModes.length

}

// =======================================================
// MARK: - Export
// =======================================================

export default BusinessModeLibrary
