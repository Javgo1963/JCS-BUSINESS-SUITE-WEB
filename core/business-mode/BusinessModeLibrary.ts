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
    id: string
    name: string
    icon: string
}

export interface BusinessModeCategory {
    id: string
    title: string
    icon: string
    modes: BusinessModeOption[]
}

function createMode(
    name: string,
    icon: string
): BusinessModeOption {

    return {
        id: slugify(name),
        name,
        icon
    }

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
                    "bag.fill"
                ),

                createMode(
                    "Online Store",
                    "storefront.fill"
                ),

                createMode(
                    "E-Commerce Store",
                    "cart.fill"
                ),

                createMode(
                    "Marketplace App",
                    "square.grid.2x2.fill"
                ),

                createMode(
                    "Boutique",
                    "tshirt.fill"
                ),

                createMode(
                    "Clothing Store",
                    "tshirt.fill"
                ),

                createMode(
                    "Shoe Store",
                    "shoeprints.fill"
                ),

                createMode(
                    "Jewelry Store",
                    "diamond.fill"
                ),

                createMode(
                    "Watch Store",
                    "clock.fill"
                ),

                createMode(
                    "Electronics Store",
                    "desktopcomputer"
                ),

                createMode(
                    "Cell Phone Store",
                    "iphone"
                ),

                createMode(
                    "Computer Store",
                    "display"
                ),

                createMode(
                    "Gaming Store",
                    "gamecontroller.fill"
                ),

                createMode(
                    "Furniture Store",
                    "chair.lounge.fill"
                ),

                createMode(
                    "Mattress Store",
                    "bed.double.fill"
                ),

                createMode(
                    "Home Decor Store",
                    "house.fill"
                ),

                createMode(
                    "Appliance Store",
                    "washer.fill"
                ),

                createMode(
                    "Hardware Store",
                    "hammer.fill"
                ),

                createMode(
                    "Grocery Store",
                    "basket.fill"
                ),

                createMode(
                    "Supermarket",
                    "cart.fill"
                ),

                createMode(
                    "Convenience Store",
                    "cart.fill"
                ),

                createMode(
                    "Dollar Store",
                    "dollarsign.circle.fill"
                ),

                createMode(
                    "Discount Store",
                    "tag.fill"
                ),

                createMode(
                    "Wholesale",
                    "shippingbox.fill"
                ),

                createMode(
                    "Warehouse Retail",
                    "building.2.fill"
                ),

                createMode(
                    "Office Supply Store",
                    "doc.text.fill"
                ),

                createMode(
                    "Book Store",
                    "book.fill"
                ),

                createMode(
                    "Toy Store",
                    "teddybear.fill"
                ),

                createMode(
                    "Baby Store",
                    "figure.2.and.child.holdinghands"
                ),

                createMode(
                    "Gift Shop",
                    "gift.fill"
                ),

                createMode(
                    "Florist",
                    "camera.macro"
                ),

                createMode(
                    "Pet Store",
                    "pawprint.fill"
                ),

                createMode(
                    "Sporting Goods",
                    "figure.run"
                ),

                createMode(
                    "Outdoor Store",
                    "tent.fill"
                ),

                createMode(
                    "Hunting & Fishing Store",
                    "scope"
                ),

                createMode(
                    "Music Store",
                    "music.note"
                ),

                createMode(
                    "Art Supply Store",
                    "paintpalette.fill"
                ),

                createMode(
                    "Beauty Supply",
                    "sparkles"
                ),

                createMode(
                    "Cosmetics Store",
                    "sparkles"
                ),

                createMode(
                    "Thrift Store",
                    "tag.fill"
                ),

                createMode(
                    "Pawn Shop",
                    "tag.fill"
                ),

                createMode(
                    "Auction House",
                    "hammer.circle.fill"
                ),

                createMode(
                    "Specialty Shop",
                    "star.fill"
                ),

                createMode(
                    "Custom Retail Business",
                    "square.and.pencil"
                )

            ]

        ),
        createCategory(

            "Restaurant & Food",

            "fork.knife",

            [

                createMode(
                    "Restaurant",
                    "fork.knife"
                ),

                createMode(
                    "Fine Dining",
                    "fork.knife"
                ),

                createMode(
                    "Casual Dining",
                    "fork.knife"
                ),

                createMode(
                    "Fast Food",
                    "takeoutbag.and.cup.and.straw.fill"
                ),

                createMode(
                    "Food Truck",
                    "truck.box.fill"
                ),

                createMode(
                    "Coffee Shop",
                    "cup.and.saucer.fill"
                ),

                createMode(
                    "Bakery",
                    "birthday.cake.fill"
                ),

                createMode(
                    "Pizza Shop",
                    "fork.knife"
                ),

                createMode(
                    "Burger Restaurant",
                    "takeoutbag.and.cup.and.straw.fill"
                ),

                createMode(
                    "Mexican Restaurant",
                    "fork.knife"
                ),

                createMode(
                    "Italian Restaurant",
                    "fork.knife"
                ),

                createMode(
                    "Seafood Restaurant",
                    "fork.knife"
                ),

                createMode(
                    "Steakhouse",
                    "fork.knife"
                ),

                createMode(
                    "Sushi Restaurant",
                    "fork.knife"
                ),

                createMode(
                    "Chinese Restaurant",
                    "fork.knife"
                ),

                createMode(
                    "BBQ Restaurant",
                    "flame.fill"
                ),

                createMode(
                    "Breakfast Cafe",
                    "cup.and.saucer.fill"
                ),

                createMode(
                    "Deli",
                    "takeoutbag.and.cup.and.straw.fill"
                ),

                createMode(
                    "Sandwich Shop",
                    "takeoutbag.and.cup.and.straw.fill"
                ),

                createMode(
                    "Dessert Shop",
                    "birthday.cake.fill"
                ),

                createMode(
                    "Ice Cream Shop",
                    "snowflake"
                ),

                createMode(
                    "Juice Bar",
                    "drop.fill"
                ),

                createMode(
                    "Smoothie Bar",
                    "drop.fill"
                ),

                createMode(
                    "Tea Shop",
                    "cup.and.saucer.fill"
                ),

                createMode(
                    "Bar & Grill",
                    "wineglass.fill"
                ),

                createMode(
                    "Catering",
                    "fork.knife.circle.fill"
                ),

                createMode(
                    "Meal Prep Business",
                    "takeoutbag.and.cup.and.straw.fill"
                ),

                createMode(
                    "Cloud Kitchen",
                    "cloud.fill"
                ),

                createMode(
                    "Ghost Kitchen",
                    "cloud.fill"
                ),

                createMode(
                    "Food Production",
                    "shippingbox.fill"
                ),

                createMode(
                    "Custom Food Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Beauty & Personal Care",

            "sparkles",

            [

                createMode(
                    "Beauty Salon",
                    "sparkles"
                ),

                createMode(
                    "Hair Salon",
                    "scissors"
                ),

                createMode(
                    "Barbershop",
                    "scissors"
                ),

                createMode(
                    "Nail Salon",
                    "paintbrush.pointed.fill"
                ),

                createMode(
                    "Spa",
                    "leaf.fill"
                ),

                createMode(
                    "Medical Spa",
                    "sparkles"
                ),

                createMode(
                    "Massage Therapy",
                    "hands.sparkles.fill"
                ),

                createMode(
                    "Skincare Clinic",
                    "sparkles"
                ),

                createMode(
                    "Esthetician Studio",
                    "sparkles"
                ),

                createMode(
                    "Makeup Artist",
                    "paintbrush.fill"
                ),

                createMode(
                    "Lash Studio",
                    "eye.fill"
                ),

                createMode(
                    "Brow Studio",
                    "eye.fill"
                ),

                createMode(
                    "Hair Extensions",
                    "scissors"
                ),

                createMode(
                    "Tanning Salon",
                    "sun.max.fill"
                ),

                createMode(
                    "Tattoo Studio",
                    "pencil.tip.crop.circle.fill"
                ),

                createMode(
                    "Piercing Studio",
                    "sparkles"
                ),

                createMode(
                    "Wellness Center",
                    "heart.fill"
                ),

                createMode(
                    "Personal Styling",
                    "tshirt.fill"
                ),

                createMode(
                    "Beauty Academy",
                    "graduationcap.fill"
                ),

                createMode(
                    "Custom Beauty Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Medical & Healthcare",

            "cross.case.fill",

            [

                createMode(
                    "Medical Office",
                    "cross.case.fill"
                ),

                createMode(
                    "Medical Clinic",
                    "cross.case.fill"
                ),

                createMode(
                    "Primary Care",
                    "stethoscope"
                ),

                createMode(
                    "Urgent Care",
                    "cross.case.fill"
                ),

                createMode(
                    "Pediatric Clinic",
                    "figure.2.and.child.holdinghands"
                ),

                createMode(
                    "Dental Clinic",
                    "cross.case.fill"
                ),

                createMode(
                    "Orthodontic Office",
                    "cross.case.fill"
                ),

                createMode(
                    "Pharmacy",
                    "pills.fill"
                ),

                createMode(
                    "Veterinary Clinic",
                    "pawprint.fill"
                ),

                createMode(
                    "Optometry",
                    "eyeglasses"
                ),

                createMode(
                    "Chiropractic Clinic",
                    "figure.stand"
                ),

                createMode(
                    "Physical Therapy",
                    "figure.walk.motion"
                ),

                createMode(
                    "Occupational Therapy",
                    "figure.walk.motion"
                ),

                createMode(
                    "Speech Therapy",
                    "waveform"
                ),

                createMode(
                    "Mental Health Practice",
                    "brain.head.profile"
                ),

                createMode(
                    "Counseling Center",
                    "person.2.fill"
                ),

                createMode(
                    "Home Healthcare",
                    "heart.text.square.fill"
                ),

                createMode(
                    "Hospice",
                    "heart.text.square.fill"
                ),

                createMode(
                    "Senior Care",
                    "person.fill"
                ),

                createMode(
                    "Assisted Living",
                    "house.fill"
                ),

                createMode(
                    "Medical Laboratory",
                    "testtube.2"
                ),

                createMode(
                    "Medical Billing",
                    "doc.text.fill"
                ),

                createMode(
                    "Medical Equipment Supplier",
                    "shippingbox.fill"
                ),

                createMode(
                    "Ambulance Service",
                    "cross.case.fill"
                ),

                createMode(
                    "Rehabilitation Center",
                    "figure.walk"
                ),

                createMode(
                    "Specialist Office",
                    "cross.case.fill"
                ),

                createMode(
                    "Custom Healthcare Business",
                    "square.and.pencil"
                )

            ]

        ),
                createCategory(

            "Construction & Trades",

            "hammer.fill",

            [

                createMode(
                    "Construction Company",
                    "hammer.fill"
                ),

                createMode(
                    "General Contractor",
                    "person.3.fill"
                ),

                createMode(
                    "Home Builder",
                    "house.fill"
                ),

                createMode(
                    "Commercial Contractor",
                    "building.2.fill"
                ),

                createMode(
                    "Remodeling",
                    "hammer.fill"
                ),

                createMode(
                    "Kitchen Remodeling",
                    "fork.knife"
                ),

                createMode(
                    "Bathroom Remodeling",
                    "bathtub.fill"
                ),

                createMode(
                    "Roofing",
                    "house.lodge.fill"
                ),

                createMode(
                    "Siding",
                    "rectangle.grid.2x2.fill"
                ),

                createMode(
                    "Gutters",
                    "drop.fill"
                ),

                createMode(
                    "Windows & Doors",
                    "door.left.hand.open"
                ),

                createMode(
                    "Plumbing",
                    "drop.fill"
                ),

                createMode(
                    "Electrical",
                    "bolt.fill"
                ),

                createMode(
                    "HVAC",
                    "snowflake"
                ),

                createMode(
                    "Painting",
                    "paintbrush.fill"
                ),

                createMode(
                    "Flooring",
                    "rectangle.grid.2x2.fill"
                ),

                createMode(
                    "Carpeting",
                    "rectangle.fill.on.rectangle.fill"
                ),

                createMode(
                    "Tile Installation",
                    "square.grid.3x3.fill"
                ),

                createMode(
                    "Concrete",
                    "square.grid.3x3.fill"
                ),

                createMode(
                    "Asphalt",
                    "road.lanes"
                ),

                createMode(
                    "Paving",
                    "road.lanes"
                ),

                createMode(
                    "Welding",
                    "flame.fill"
                ),

                createMode(
                    "Carpentry",
                    "hammer.fill"
                ),

                createMode(
                    "Masonry",
                    "bricks.fill"
                ),

                createMode(
                    "Drywall",
                    "square.split.2x2.fill"
                ),

                createMode(
                    "Excavation",
                    "mountain.2.fill"
                ),

                createMode(
                    "Demolition",
                    "hammer.fill"
                ),

                createMode(
                    "Landscaping",
                    "leaf.fill"
                ),

                createMode(
                    "Lawn Care",
                    "leaf.fill"
                ),

                createMode(
                    "Tree Service",
                    "tree.fill"
                ),

                createMode(
                    "Irrigation",
                    "drop.fill"
                ),

                createMode(
                    "Snow Removal",
                    "snowflake"
                ),

                createMode(
                    "Cleaning Service",
                    "sparkles"
                ),

                createMode(
                    "Residential Cleaning",
                    "house.fill"
                ),

                createMode(
                    "Commercial Cleaning",
                    "building.2.fill"
                ),

                createMode(
                    "House Maid",
                    "house.fill"
                ),

                createMode(
                    "Janitorial Services",
                    "sparkles"
                ),

                createMode(
                    "Window Cleaning",
                    "sparkles"
                ),

                createMode(
                    "Pressure Washing",
                    "water.waves"
                ),

                createMode(
                    "Handyman",
                    "wrench.and.screwdriver.fill"
                ),

                createMode(
                    "Pest Control",
                    "ant.fill"
                ),

                createMode(
                    "Pool Service",
                    "water.waves"
                ),

                createMode(
                    "Solar Installation",
                    "sun.max.fill"
                ),

                createMode(
                    "Generator Service",
                    "bolt.batteryblock.fill"
                ),

                createMode(
                    "Glass Shop",
                    "rectangle.on.rectangle.angled"
                ),

                createMode(
                    "Fence Installation",
                    "rectangle.grid.1x2.fill"
                ),

                createMode(
                    "Deck Builder",
                    "hammer.fill"
                ),

                createMode(
                    "Garage Door Service",
                    "door.garage.closed"
                ),

                createMode(
                    "Insulation",
                    "snowflake"
                ),

                createMode(
                    "Septic Service",
                    "drop.fill"
                ),

                createMode(
                    "Well Drilling",
                    "drop.circle.fill"
                ),

                createMode(
                    "Property Maintenance",
                    "building.2.fill"
                ),

                createMode(
                    "Restoration Services",
                    "arrow.triangle.2.circlepath"
                ),

                createMode(
                    "Water Damage Restoration",
                    "drop.fill"
                ),

                createMode(
                    "Fire Damage Restoration",
                    "flame.fill"
                ),

                createMode(
                    "Mold Remediation",
                    "exclamationmark.triangle.fill"
                ),

                createMode(
                    "Custom Trade Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Transportation & Logistics",

            "truck.box.fill",

            [

                createMode(
                    "Trucking Company",
                    "truck.box.fill"
                ),

                createMode(
                    "Freight Broker",
                    "shippingbox.fill"
                ),

                createMode(
                    "Freight Forwarding",
                    "shippingbox.fill"
                ),

                createMode(
                    "Delivery Service",
                    "box.truck.fill"
                ),

                createMode(
                    "Courier Service",
                    "paperplane.fill"
                ),

                createMode(
                    "Last-Mile Delivery",
                    "box.truck.fill"
                ),

                createMode(
                    "Route Delivery",
                    "point.topleft.down.curvedto.point.bottomright.up"
                ),

                createMode(
                    "Moving Company",
                    "shippingbox.and.arrow.backward.fill"
                ),

                createMode(
                    "Warehouse",
                    "building.2.fill"
                ),

                createMode(
                    "Shipping Company",
                    "shippingbox.fill"
                ),

                createMode(
                    "Dispatch Company",
                    "location.fill"
                ),

                createMode(
                    "Towing Company",
                    "truck.pickup.side.fill"
                ),

                createMode(
                    "Fleet Management",
                    "car.2.fill"
                ),

                createMode(
                    "Distribution Company",
                    "building.2.crop.circle.fill"
                ),

                createMode(
                    "Storage Facility",
                    "archivebox.fill"
                ),

                createMode(
                    "Cold Chain Logistics",
                    "snowflake"
                ),

                createMode(
                    "Refrigerated Transport",
                    "snowflake"
                ),

                createMode(
                    "Medical Transport",
                    "cross.case.fill"
                ),

                createMode(
                    "Non-Emergency Medical Transport",
                    "cross.case.fill"
                ),

                createMode(
                    "Bus Company",
                    "bus.fill"
                ),

                createMode(
                    "Charter Bus",
                    "bus.fill"
                ),

                createMode(
                    "School Bus Service",
                    "bus.fill"
                ),

                createMode(
                    "Taxi Service",
                    "car.fill"
                ),

                createMode(
                    "Limousine Service",
                    "car.2.fill"
                ),

                createMode(
                    "Ride Share Fleet",
                    "car.2.fill"
                ),

                createMode(
                    "Car Hauling",
                    "car.2.fill"
                ),

                createMode(
                    "Auto Transport",
                    "car.2.fill"
                ),

                createMode(
                    "Heavy Haul",
                    "truck.box.fill"
                ),

                createMode(
                    "Dump Truck Service",
                    "truck.box.fill"
                ),

                createMode(
                    "Hazmat Transport",
                    "exclamationmark.triangle.fill"
                ),

                createMode(
                    "Import / Export",
                    "globe"
                ),

                createMode(
                    "Logistics Company",
                    "shippingbox.fill"
                ),

                createMode(
                    "Custom Logistics Business",
                    "square.and.pencil"
                )

            ]

        ),

                createCategory(

            "Automotive",

            "car.fill",

            [

                createMode(
                    "Auto Repair Shop",
                    "car.fill"
                ),

                createMode(
                    "Auto Body Shop",
                    "wrench.and.screwdriver.fill"
                ),

                createMode(
                    "Collision Center",
                    "wrench.and.screwdriver.fill"
                ),

                createMode(
                    "Tire Shop",
                    "circle.hexagongrid.fill"
                ),

                createMode(
                    "Car Wash",
                    "drop.fill"
                ),

                createMode(
                    "Auto Detailing",
                    "sparkles"
                ),

                createMode(
                    "Car Dealership",
                    "car.2.fill"
                ),

                createMode(
                    "Used Car Dealership",
                    "car.2.fill"
                ),

                createMode(
                    "New Car Dealership",
                    "car.2.fill"
                ),

                createMode(
                    "Auto Parts Store",
                    "gearshape.2.fill"
                ),

                createMode(
                    "Oil Change Center",
                    "drop.fill"
                ),

                createMode(
                    "Mobile Mechanic",
                    "wrench.and.screwdriver.fill"
                ),

                createMode(
                    "Car Rental",
                    "key.fill"
                ),

                createMode(
                    "Diesel Repair",
                    "fuelpump.fill"
                ),

                createMode(
                    "Transmission Shop",
                    "gearshape.fill"
                ),

                createMode(
                    "Brake Shop",
                    "exclamationmark.octagon.fill"
                ),

                createMode(
                    "Muffler Shop",
                    "wrench.and.screwdriver.fill"
                ),

                createMode(
                    "Alignment Shop",
                    "steeringwheel"
                ),

                createMode(
                    "Fleet Repair",
                    "car.2.fill"
                ),

                createMode(
                    "Motorcycle Shop",
                    "motorcycle.fill"
                ),

                createMode(
                    "Powersports Dealer",
                    "motorcycle.fill"
                ),

                createMode(
                    "Boat Repair",
                    "ferry.fill"
                ),

                createMode(
                    "Marine Services",
                    "sailboat.fill"
                ),

                createMode(
                    "RV Dealer",
                    "bus.fill"
                ),

                createMode(
                    "RV Repair",
                    "bus.fill"
                ),

                createMode(
                    "Window Tint",
                    "sun.max.fill"
                ),

                createMode(
                    "Car Audio Installation",
                    "speaker.wave.3.fill"
                ),

                createMode(
                    "Vehicle Wraps",
                    "paintbrush.fill"
                ),

                createMode(
                    "Paint Protection Film",
                    "shield.fill"
                ),

                createMode(
                    "Windshield Repair",
                    "rectangle.on.rectangle.angled"
                ),

                createMode(
                    "Towing Service",
                    "truck.pickup.side.fill"
                ),

                createMode(
                    "Roadside Assistance",
                    "wrench.and.screwdriver.fill"
                ),

                createMode(
                    "Custom Automotive Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Professional Services",

            "briefcase.fill",

            [

                createMode(
                    "Accounting Firm",
                    "chart.bar.doc.horizontal.fill"
                ),

                createMode(
                    "CPA Firm",
                    "chart.bar.doc.horizontal.fill"
                ),

                createMode(
                    "Bookkeeping",
                    "book.closed.fill"
                ),

                createMode(
                    "Tax Preparation",
                    "doc.text.fill"
                ),

                createMode(
                    "Payroll Services",
                    "creditcard.fill"
                ),

                createMode(
                    "Law Office",
                    "scale.3d"
                ),

                createMode(
                    "Immigration Services",
                    "globe"
                ),

                createMode(
                    "Insurance Agency",
                    "shield.fill"
                ),

                createMode(
                    "Financial Advisor",
                    "dollarsign.circle.fill"
                ),

                createMode(
                    "Investment Firm",
                    "chart.line.uptrend.xyaxis"
                ),

                createMode(
                    "Business Consulting",
                    "person.2.fill"
                ),

                createMode(
                    "Management Consulting",
                    "person.3.fill"
                ),

                createMode(
                    "Marketing Agency",
                    "megaphone.fill"
                ),

                createMode(
                    "Advertising Agency",
                    "megaphone.fill"
                ),

                createMode(
                    "Branding Agency",
                    "paintpalette.fill"
                ),

                createMode(
                    "Recruiting Agency",
                    "person.badge.plus.fill"
                ),

                createMode(
                    "Staffing Agency",
                    "person.3.fill"
                ),

                createMode(
                    "HR Services",
                    "person.2.fill"
                ),

                createMode(
                    "Translation Services",
                    "globe"
                ),

                createMode(
                    "Interpreter Services",
                    "character.bubble.fill"
                ),

                createMode(
                    "Notary Public",
                    "signature"
                ),

                createMode(
                    "Document Preparation",
                    "doc.fill"
                ),

                createMode(
                    "Private Investigator",
                    "magnifyingglass"
                ),

                createMode(
                    "Security Company",
                    "shield.fill"
                ),

                createMode(
                    "Call Center",
                    "phone.connection.fill"
                ),

                createMode(
                    "Virtual Assistant",
                    "desktopcomputer"
                ),

                createMode(
                    "Business Broker",
                    "building.2.fill"
                ),

                createMode(
                    "Franchise Consulting",
                    "building.columns.fill"
                ),

                createMode(
                    "Custom Professional Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Engineering & Design",

            "ruler.fill",

            [

                createMode(
                    "Engineering Firm",
                    "gearshape.2.fill"
                ),

                createMode(
                    "Civil Engineering",
                    "building.2.fill"
                ),

                createMode(
                    "Mechanical Engineering",
                    "gearshape.fill"
                ),

                createMode(
                    "Electrical Engineering",
                    "bolt.fill"
                ),

                createMode(
                    "Structural Engineering",
                    "building.columns.fill"
                ),

                createMode(
                    "Architecture Firm",
                    "building.columns.fill"
                ),

                createMode(
                    "Interior Design",
                    "sofa.fill"
                ),

                createMode(
                    "Landscape Architecture",
                    "leaf.fill"
                ),

                createMode(
                    "CAD Design",
                    "pencil.and.ruler.fill"
                ),

                createMode(
                    "3D Modeling",
                    "cube.fill"
                ),

                createMode(
                    "Industrial Design",
                    "cube.box.fill"
                ),

                createMode(
                    "Surveying",
                    "map.fill"
                ),

                createMode(
                    "Blueprint Services",
                    "doc.richtext.fill"
                ),

                createMode(
                    "Custom Engineering Business",
                    "square.and.pencil"
                )

            ]

        ),

                createCategory(

            "Real Estate & Property",

            "house.fill",

            [

                createMode(
                    "Real Estate Agency",
                    "house.fill"
                ),

                createMode(
                    "Commercial Real Estate",
                    "building.2.fill"
                ),

                createMode(
                    "Luxury Real Estate",
                    "house.lodge.fill"
                ),

                createMode(
                    "Property Management",
                    "building.2.fill"
                ),

                createMode(
                    "Apartment Management",
                    "building.fill"
                ),

                createMode(
                    "HOA Management",
                    "person.3.fill"
                ),

                createMode(
                    "Vacation Rentals",
                    "bed.double.fill"
                ),

                createMode(
                    "Airbnb Management",
                    "house.lodge.fill"
                ),

                createMode(
                    "Storage Facility",
                    "archivebox.fill"
                ),

                createMode(
                    "Home Inspection",
                    "checkmark.shield.fill"
                ),

                createMode(
                    "Home Appraisal",
                    "house.fill"
                ),

                createMode(
                    "Mortgage Brokerage",
                    "dollarsign.circle.fill"
                ),

                createMode(
                    "Title Company",
                    "doc.text.fill"
                ),

                createMode(
                    "Escrow Services",
                    "lock.doc.fill"
                ),

                createMode(
                    "Real Estate Investor",
                    "chart.line.uptrend.xyaxis"
                ),

                createMode(
                    "House Flipping",
                    "hammer.fill"
                ),

                createMode(
                    "Custom Real Estate Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Technology & Digital",

            "desktopcomputer",

            [

                createMode(
                    "Software Company",
                    "curlybraces"
                ),

                createMode(
                    "SaaS Company",
                    "cloud.fill"
                ),

                createMode(
                    "AI Company",
                    "brain.head.profile"
                ),

                createMode(
                    "AI Consulting",
                    "brain.head.profile"
                ),

                createMode(
                    "IT Services",
                    "network"
                ),

                createMode(
                    "Managed IT",
                    "server.rack"
                ),

                createMode(
                    "Cybersecurity",
                    "lock.shield.fill"
                ),

                createMode(
                    "Cloud Services",
                    "icloud.fill"
                ),

                createMode(
                    "Data Center",
                    "server.rack"
                ),

                createMode(
                    "Hosting Company",
                    "server.rack"
                ),

                createMode(
                    "Computer Repair",
                    "desktopcomputer"
                ),

                createMode(
                    "Networking",
                    "network"
                ),

                createMode(
                    "Fiber Optic Installation",
                    "cable.connector"
                ),

                createMode(
                    "Telecommunications",
                    "antenna.radiowaves.left.and.right"
                ),

                createMode(
                    "CCTV Installation",
                    "video.fill"
                ),

                createMode(
                    "Access Control Systems",
                    "lock.rectangle.fill"
                ),

                createMode(
                    "POS Systems",
                    "creditcard.fill"
                ),

                createMode(
                    "ERP Solutions",
                    "square.grid.2x2.fill"
                ),

                createMode(
                    "CRM Solutions",
                    "person.3.fill"
                ),

                createMode(
                    "Web Design",
                    "globe"
                ),

                createMode(
                    "Web Development",
                    "globe"
                ),

                createMode(
                    "Mobile App Development",
                    "iphone"
                ),

                createMode(
                    "Automation Services",
                    "gearshape.2.fill"
                ),

                createMode(
                    "Robotics",
                    "cpu.fill"
                ),

                createMode(
                    "Drone Services",
                    "airplane"
                ),

                createMode(
                    "Blockchain",
                    "link"
                ),

                createMode(
                    "Game Development",
                    "gamecontroller.fill"
                ),

                createMode(
                    "Digital Marketing",
                    "megaphone.fill"
                ),

                createMode(
                    "SEO Agency",
                    "magnifyingglass"
                ),

                createMode(
                    "UI / UX Design",
                    "paintbrush.fill"
                ),

                createMode(
                    "Graphic Design Studio",
                    "paintpalette.fill"
                ),

                createMode(
                    "Custom Technology Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Education & Training",

            "graduationcap.fill",

            [

                createMode(
                    "University",
                    "graduationcap.fill"
                ),

                createMode(
                    "College",
                    "building.columns.fill"
                ),

                createMode(
                    "School",
                    "graduationcap.fill"
                ),

                createMode(
                    "Elementary School",
                    "book.fill"
                ),

                createMode(
                    "High School",
                    "book.fill"
                ),

                createMode(
                    "Daycare",
                    "figure.2.and.child.holdinghands"
                ),

                createMode(
                    "Preschool",
                    "figure.2.and.child.holdinghands"
                ),

                createMode(
                    "Tutoring Center",
                    "book.fill"
                ),

                createMode(
                    "Driving School",
                    "car.fill"
                ),

                createMode(
                    "CDL School",
                    "truck.box.fill"
                ),

                createMode(
                    "Trade School",
                    "hammer.fill"
                ),

                createMode(
                    "Coding Bootcamp",
                    "curlybraces"
                ),

                createMode(
                    "Online Academy",
                    "play.rectangle.fill"
                ),

                createMode(
                    "Language Academy",
                    "globe"
                ),

                createMode(
                    "Music School",
                    "music.note"
                ),

                createMode(
                    "Dance Academy",
                    "figure.dance"
                ),

                createMode(
                    "Martial Arts Academy",
                    "figure.martial.arts"
                ),

                createMode(
                    "Corporate Training",
                    "person.3.fill"
                ),

                createMode(
                    "Custom Education Business",
                    "square.and.pencil"
                )

            ]

        ),

                createCategory(

            "Fitness & Sports",

            "figure.run",

            [

                createMode(
                    "Fitness Center",
                    "figure.run"
                ),

                createMode(
                    "Gym",
                    "dumbbell.fill"
                ),

                createMode(
                    "Personal Training",
                    "figure.strengthtraining.traditional"
                ),

                createMode(
                    "CrossFit Gym",
                    "figure.strengthtraining.traditional"
                ),

                createMode(
                    "Yoga Studio",
                    "figure.yoga"
                ),

                createMode(
                    "Pilates Studio",
                    "figure.flexibility"
                ),

                createMode(
                    "Martial Arts School",
                    "figure.martial.arts"
                ),

                createMode(
                    "Boxing Gym",
                    "figure.boxing"
                ),

                createMode(
                    "Dance Studio",
                    "figure.dance"
                ),

                createMode(
                    "Swimming School",
                    "figure.pool.swim"
                ),

                createMode(
                    "Sports Academy",
                    "sportscourt.fill"
                ),

                createMode(
                    "Sports Club",
                    "sportscourt.fill"
                ),

                createMode(
                    "Sports Performance Center",
                    "figure.run.circle.fill"
                ),

                createMode(
                    "Recreation Center",
                    "building.2.fill"
                ),

                createMode(
                    "Custom Fitness Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Creative & Media",

            "paintpalette.fill",

            [

                createMode(
                    "Photography Studio",
                    "camera.fill"
                ),

                createMode(
                    "Videography",
                    "video.fill"
                ),

                createMode(
                    "Film Production",
                    "film.fill"
                ),

                createMode(
                    "Podcast Studio",
                    "mic.fill"
                ),

                createMode(
                    "Recording Studio",
                    "music.mic"
                ),

                createMode(
                    "Music Production",
                    "music.note.house.fill"
                ),

                createMode(
                    "Graphic Design",
                    "paintpalette.fill"
                ),

                createMode(
                    "Branding Studio",
                    "paintbrush.fill"
                ),

                createMode(
                    "Advertising Agency",
                    "megaphone.fill"
                ),

                createMode(
                    "Animation Studio",
                    "sparkles.tv.fill"
                ),

                createMode(
                    "3D Animation",
                    "cube.fill"
                ),

                createMode(
                    "Printing Company",
                    "printer.fill"
                ),

                createMode(
                    "Sign Company",
                    "signpost.right.fill"
                ),

                createMode(
                    "Digital Content Creator",
                    "play.rectangle.fill"
                ),

                createMode(
                    "Influencer Agency",
                    "person.crop.circle.badge.star"
                ),

                createMode(
                    "Marketing Studio",
                    "megaphone.fill"
                ),

                createMode(
                    "Custom Creative Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Events & Entertainment",

            "party.popper.fill",

            [

                createMode(
                    "Event Planner",
                    "calendar"
                ),

                createMode(
                    "Wedding Planner",
                    "heart.fill"
                ),

                createMode(
                    "Party Rentals",
                    "party.popper.fill"
                ),

                createMode(
                    "Bounce House Rentals",
                    "house.fill"
                ),

                createMode(
                    "DJ Services",
                    "music.note.list"
                ),

                createMode(
                    "Live Entertainment",
                    "music.mic"
                ),

                createMode(
                    "Concert Promoter",
                    "music.note"
                ),

                createMode(
                    "Event Venue",
                    "building.columns.fill"
                ),

                createMode(
                    "Banquet Hall",
                    "building.fill"
                ),

                createMode(
                    "Convention Center",
                    "building.2.fill"
                ),

                createMode(
                    "Casino",
                    "suit.club.fill"
                ),

                createMode(
                    "Movie Theater",
                    "film.fill"
                ),

                createMode(
                    "Arcade",
                    "gamecontroller.fill"
                ),

                createMode(
                    "Escape Room",
                    "lock.fill"
                ),

                createMode(
                    "Custom Event Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Hospitality & Travel",

            "bed.double.fill",

            [

                createMode(
                    "Hotel",
                    "bed.double.fill"
                ),

                createMode(
                    "Motel",
                    "bed.double.fill"
                ),

                createMode(
                    "Resort",
                    "beach.umbrella.fill"
                ),

                createMode(
                    "Bed & Breakfast",
                    "house.lodge.fill"
                ),

                createMode(
                    "Vacation Rental",
                    "house.fill"
                ),

                createMode(
                    "Travel Agency",
                    "airplane"
                ),

                createMode(
                    "Tour Operator",
                    "map.fill"
                ),

                createMode(
                    "Cruise Agency",
                    "ferry.fill"
                ),

                createMode(
                    "Campground",
                    "tent.fill"
                ),

                createMode(
                    "RV Park",
                    "bus.fill"
                ),

                createMode(
                    "Hostel",
                    "building.fill"
                ),

                createMode(
                    "Luxury Concierge",
                    "star.fill"
                ),

                createMode(
                    "Vacation Planning",
                    "calendar.badge.clock"
                ),

                createMode(
                    "Custom Hospitality Business",
                    "square.and.pencil"
                )

            ]

        ),

                createCategory(

            "Industrial & Manufacturing",

            "gearshape.2.fill",

            [

                createMode(
                    "Manufacturing Company",
                    "gearshape.2.fill"
                ),

                createMode(
                    "Industrial Plant",
                    "building.2.fill"
                ),

                createMode(
                    "Factory",
                    "building.2.crop.circle.fill"
                ),

                createMode(
                    "Machine Shop",
                    "gearshape.fill"
                ),

                createMode(
                    "Metal Fabrication",
                    "hammer.fill"
                ),

                createMode(
                    "Steel Fabrication",
                    "building.columns.fill"
                ),

                createMode(
                    "Wood Manufacturing",
                    "tree.fill"
                ),

                createMode(
                    "Furniture Manufacturing",
                    "chair.lounge.fill"
                ),

                createMode(
                    "Cabinet Manufacturing",
                    "cabinet.fill"
                ),

                createMode(
                    "Packaging Company",
                    "shippingbox.fill"
                ),

                createMode(
                    "Printing Manufacturing",
                    "printer.fill"
                ),

                createMode(
                    "Plastic Manufacturing",
                    "cube.box.fill"
                ),

                createMode(
                    "Food Manufacturing",
                    "fork.knife"
                ),

                createMode(
                    "Beverage Manufacturing",
                    "cup.and.saucer.fill"
                ),

                createMode(
                    "Textile Manufacturing",
                    "tshirt.fill"
                ),

                createMode(
                    "Chemical Manufacturing",
                    "flask.fill"
                ),

                createMode(
                    "Electronics Manufacturing",
                    "cpu.fill"
                ),

                createMode(
                    "Medical Device Manufacturing",
                    "cross.case.fill"
                ),

                createMode(
                    "Custom Manufacturing Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Agriculture & Farming",

            "leaf.fill",

            [

                createMode(
                    "Farm",
                    "leaf.fill"
                ),

                createMode(
                    "Crop Farm",
                    "leaf.fill"
                ),

                createMode(
                    "Livestock Farm",
                    "hare.fill"
                ),

                createMode(
                    "Dairy Farm",
                    "drop.fill"
                ),

                createMode(
                    "Poultry Farm",
                    "bird.fill"
                ),

                createMode(
                    "Horse Farm",
                    "figure.equestrian.sports"
                ),

                createMode(
                    "Greenhouse",
                    "leaf.circle.fill"
                ),

                createMode(
                    "Nursery",
                    "tree.fill"
                ),

                createMode(
                    "Garden Center",
                    "camera.macro"
                ),

                createMode(
                    "Orchard",
                    "apple.logo"
                ),

                createMode(
                    "Vineyard",
                    "wineglass.fill"
                ),

                createMode(
                    "Apiary",
                    "hexagon.fill"
                ),

                createMode(
                    "Aquaculture",
                    "fish.fill"
                ),

                createMode(
                    "Agricultural Services",
                    "tractor"
                ),

                createMode(
                    "Feed Supplier",
                    "shippingbox.fill"
                ),

                createMode(
                    "Farm Equipment Dealer",
                    "tractor"
                ),

                createMode(
                    "Organic Farming",
                    "leaf.fill"
                ),

                createMode(
                    "Custom Agriculture Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Nonprofit & Community",

            "heart.fill",

            [

                createMode(
                    "Nonprofit Organization",
                    "heart.fill"
                ),

                createMode(
                    "Charity",
                    "heart.circle.fill"
                ),

                createMode(
                    "Foundation",
                    "building.columns.fill"
                ),

                createMode(
                    "Religious Organization",
                    "building.columns.fill"
                ),

                createMode(
                    "Church",
                    "building.columns.fill"
                ),

                createMode(
                    "Community Center",
                    "person.3.fill"
                ),

                createMode(
                    "Food Bank",
                    "basket.fill"
                ),

                createMode(
                    "Animal Rescue",
                    "pawprint.fill"
                ),

                createMode(
                    "Shelter",
                    "house.fill"
                ),

                createMode(
                    "Youth Organization",
                    "figure.2.and.child.holdinghands"
                ),

                createMode(
                    "Senior Center",
                    "person.fill"
                ),

                createMode(
                    "Volunteer Organization",
                    "person.3.sequence.fill"
                ),

                createMode(
                    "Cultural Organization",
                    "globe"
                ),

                createMode(
                    "Educational Foundation",
                    "graduationcap.fill"
                ),

                createMode(
                    "Environmental Organization",
                    "leaf.fill"
                ),

                createMode(
                    "Community Outreach",
                    "person.2.wave.2.fill"
                ),

                createMode(
                    "Custom Nonprofit Organization",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Modern Online Businesses",

            "globe",

            [

                createMode(
                    "E-Commerce Brand",
                    "cart.fill"
                ),

                createMode(
                    "Subscription Business",
                    "repeat.circle.fill"
                ),

                createMode(
                    "Digital Products",
                    "square.stack.3d.up.fill"
                ),

                createMode(
                    "Online Courses",
                    "play.rectangle.fill"
                ),

                createMode(
                    "Membership Website",
                    "person.crop.circle.badge.checkmark"
                ),

                createMode(
                    "Affiliate Marketing",
                    "link"
                ),

                createMode(
                    "Dropshipping",
                    "shippingbox.fill"
                ),

                createMode(
                    "Print On Demand",
                    "printer.fill"
                ),

                createMode(
                    "Marketplace Seller",
                    "storefront.fill"
                ),

                createMode(
                    "Creator Economy",
                    "person.crop.square"
                ),

                createMode(
                    "Influencer Business",
                    "person.crop.circle.badge.star"
                ),

                createMode(
                    "YouTube Channel",
                    "play.tv.fill"
                ),

                createMode(
                    "Podcast Network",
                    "mic.fill"
                ),

                createMode(
                    "Newsletter Business",
                    "newspaper.fill"
                ),

                createMode(
                    "Online Coaching",
                    "person.fill.questionmark"
                ),

                createMode(
                    "Virtual Services",
                    "desktopcomputer"
                ),

                createMode(
                    "Remote Agency",
                    "network"
                ),

                createMode(
                    "Custom Digital Business",
                    "square.and.pencil"
                )

            ]

        ),

                createCategory(

            "Banking & Financial Services",

            "building.columns.fill",

            [

                createMode(
                    "Bank",
                    "building.columns.fill"
                ),

                createMode(
                    "Credit Union",
                    "building.columns.fill"
                ),

                createMode(
                    "Mortgage Company",
                    "house.fill"
                ),

                createMode(
                    "Investment Firm",
                    "chart.line.uptrend.xyaxis"
                ),

                createMode(
                    "Financial Planning",
                    "dollarsign.circle.fill"
                ),

                createMode(
                    "Wealth Management",
                    "chart.pie.fill"
                ),

                createMode(
                    "Accounting Firm",
                    "chart.bar.doc.horizontal.fill"
                ),

                createMode(
                    "CPA Firm",
                    "doc.text.fill"
                ),

                createMode(
                    "Bookkeeping",
                    "book.closed.fill"
                ),

                createMode(
                    "Tax Services",
                    "percent"
                ),

                createMode(
                    "Payroll Services",
                    "creditcard.fill"
                ),

                createMode(
                    "Payment Processing",
                    "creditcard.and.123"
                ),

                createMode(
                    "FinTech Company",
                    "iphone"
                ),

                createMode(
                    "Cryptocurrency Services",
                    "bitcoinsign.circle.fill"
                ),

                createMode(
                    "Insurance Company",
                    "shield.fill"
                ),

                createMode(
                    "Insurance Agency",
                    "shield.lefthalf.filled"
                ),

                createMode(
                    "Loan Company",
                    "banknote.fill"
                ),

                createMode(
                    "Collection Agency",
                    "tray.full.fill"
                ),

                createMode(
                    "Custom Financial Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Legal Services",

            "scale.3d",

            [

                createMode(
                    "Law Firm",
                    "scale.3d"
                ),

                createMode(
                    "Attorney Office",
                    "person.crop.rectangle"
                ),

                createMode(
                    "Family Law",
                    "person.3.fill"
                ),

                createMode(
                    "Immigration Law",
                    "globe"
                ),

                createMode(
                    "Criminal Defense",
                    "shield.fill"
                ),

                createMode(
                    "Civil Litigation",
                    "doc.text.fill"
                ),

                createMode(
                    "Corporate Law",
                    "building.columns.fill"
                ),

                createMode(
                    "Estate Planning",
                    "doc.richtext.fill"
                ),

                createMode(
                    "Real Estate Law",
                    "house.fill"
                ),

                createMode(
                    "Bankruptcy Law",
                    "tray.full.fill"
                ),

                createMode(
                    "Employment Law",
                    "person.2.fill"
                ),

                createMode(
                    "Notary Public",
                    "signature"
                ),

                createMode(
                    "Legal Consulting",
                    "person.fill.questionmark"
                ),

                createMode(
                    "Legal Document Services",
                    "doc.text.fill"
                ),

                createMode(
                    "Custom Legal Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Energy & Utilities",

            "bolt.fill",

            [

                createMode(
                    "Electric Utility",
                    "bolt.fill"
                ),

                createMode(
                    "Water Utility",
                    "drop.fill"
                ),

                createMode(
                    "Natural Gas Utility",
                    "flame.fill"
                ),

                createMode(
                    "Solar Energy",
                    "sun.max.fill"
                ),

                createMode(
                    "Wind Energy",
                    "wind"
                ),

                createMode(
                    "Battery Storage",
                    "battery.100percent"
                ),

                createMode(
                    "EV Charging",
                    "ev.charger.fill"
                ),

                createMode(
                    "Utility Contractor",
                    "wrench.and.screwdriver.fill"
                ),

                createMode(
                    "Power Generation",
                    "bolt.circle.fill"
                ),

                createMode(
                    "Energy Consulting",
                    "leaf.fill"
                ),

                createMode(
                    "Custom Energy Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Oil & Gas",

            "flame.fill",

            [

                createMode(
                    "Oil Company",
                    "drop.fill"
                ),

                createMode(
                    "Gas Company",
                    "flame.fill"
                ),

                createMode(
                    "Pipeline Services",
                    "pipe.and.drop.fill"
                ),

                createMode(
                    "Refinery",
                    "building.2.fill"
                ),

                createMode(
                    "Fuel Distributor",
                    "fuelpump.fill"
                ),

                createMode(
                    "Fuel Station",
                    "fuelpump.fill"
                ),

                createMode(
                    "Petroleum Services",
                    "drop.circle.fill"
                ),

                createMode(
                    "Oilfield Services",
                    "hammer.fill"
                ),

                createMode(
                    "Drilling Contractor",
                    "mountain.2.fill"
                ),

                createMode(
                    "Custom Oil & Gas Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Telecommunications",

            "antenna.radiowaves.left.and.right",

            [

                createMode(
                    "Telecommunications Company",
                    "antenna.radiowaves.left.and.right"
                ),

                createMode(
                    "Internet Service Provider",
                    "wifi"
                ),

                createMode(
                    "Fiber Internet",
                    "cable.connector"
                ),

                createMode(
                    "Wireless Carrier",
                    "cellularbars"
                ),

                createMode(
                    "VoIP Services",
                    "phone.connection.fill"
                ),

                createMode(
                    "Satellite Communications",
                    "dot.radiowaves.left.and.right"
                ),

                createMode(
                    "Network Infrastructure",
                    "network"
                ),

                createMode(
                    "Data Communications",
                    "externaldrive.connected.to.line.below.fill"
                ),

                createMode(
                    "Telecom Equipment",
                    "server.rack"
                ),

                createMode(
                    "Custom Telecommunications Business",
                    "square.and.pencil"
                )

            ]

        ),

                createCategory(

            "Security & Public Safety",

            "shield.fill",

            [

                createMode(
                    "Security Company",
                    "shield.fill"
                ),

                createMode(
                    "Private Security",
                    "person.badge.shield.checkmark.fill"
                ),

                createMode(
                    "Security Guard Services",
                    "person.badge.shield.checkmark.fill"
                ),

                createMode(
                    "Patrol Services",
                    "car.2.fill"
                ),

                createMode(
                    "Alarm Company",
                    "bell.and.waves.left.and.right.fill"
                ),

                createMode(
                    "Fire Alarm Services",
                    "flame.fill"
                ),

                createMode(
                    "Security System Installation",
                    "lock.shield.fill"
                ),

                createMode(
                    "CCTV Security",
                    "video.fill"
                ),

                createMode(
                    "Access Control",
                    "lock.rectangle.fill"
                ),

                createMode(
                    "Cybersecurity Services",
                    "lock.shield.fill"
                ),

                createMode(
                    "Emergency Management",
                    "exclamationmark.triangle.fill"
                ),

                createMode(
                    "Fire Protection Services",
                    "flame.circle.fill"
                ),

                createMode(
                    "Fire Extinguisher Service",
                    "flame.fill"
                ),

                createMode(
                    "Workplace Safety",
                    "cross.case.fill"
                ),

                createMode(
                    "Safety Consulting",
                    "checkmark.shield.fill"
                ),

                createMode(
                    "Background Check Services",
                    "person.text.rectangle.fill"
                ),

                createMode(
                    "Custom Security Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Scientific & Laboratory",

            "flask.fill",

            [

                createMode(
                    "Scientific Laboratory",
                    "flask.fill"
                ),

                createMode(
                    "Research Laboratory",
                    "testtube.2"
                ),

                createMode(
                    "Medical Laboratory",
                    "cross.vial.fill"
                ),

                createMode(
                    "Diagnostic Laboratory",
                    "waveform.path.ecg.rectangle.fill"
                ),

                createMode(
                    "Testing Laboratory",
                    "checkmark.seal.fill"
                ),

                createMode(
                    "Environmental Testing",
                    "leaf.fill"
                ),

                createMode(
                    "Water Testing",
                    "drop.fill"
                ),

                createMode(
                    "Food Testing Laboratory",
                    "fork.knife"
                ),

                createMode(
                    "Chemical Laboratory",
                    "flask.fill"
                ),

                createMode(
                    "Biotechnology Company",
                    "microbe.fill"
                ),

                createMode(
                    "Pharmaceutical Research",
                    "pills.fill"
                ),

                createMode(
                    "Clinical Research",
                    "cross.case.fill"
                ),

                createMode(
                    "Forensic Laboratory",
                    "magnifyingglass"
                ),

                createMode(
                    "Quality Control Laboratory",
                    "checkmark.shield.fill"
                ),

                createMode(
                    "Calibration Services",
                    "ruler.fill"
                ),

                createMode(
                    "Custom Scientific Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Aviation & Aerospace",

            "airplane",

            [

                createMode(
                    "Airline",
                    "airplane"
                ),

                createMode(
                    "Charter Airline",
                    "airplane.departure"
                ),

                createMode(
                    "Private Aviation",
                    "airplane.circle.fill"
                ),

                createMode(
                    "Flight School",
                    "graduationcap.fill"
                ),

                createMode(
                    "Aircraft Rental",
                    "airplane"
                ),

                createMode(
                    "Aircraft Maintenance",
                    "wrench.and.screwdriver.fill"
                ),

                createMode(
                    "Aircraft Repair",
                    "gearshape.2.fill"
                ),

                createMode(
                    "Aircraft Parts Supplier",
                    "shippingbox.fill"
                ),

                createMode(
                    "Aviation Consulting",
                    "person.2.fill"
                ),

                createMode(
                    "Airport Services",
                    "airplane.arrival"
                ),

                createMode(
                    "Ground Handling",
                    "truck.box.fill"
                ),

                createMode(
                    "Air Cargo",
                    "shippingbox.fill"
                ),

                createMode(
                    "Drone Company",
                    "airplane"
                ),

                createMode(
                    "Drone Photography",
                    "camera.fill"
                ),

                createMode(
                    "Drone Inspection",
                    "viewfinder"
                ),

                createMode(
                    "Aerospace Engineering",
                    "gearshape.2.fill"
                ),

                createMode(
                    "Aerospace Manufacturing",
                    "building.2.fill"
                ),

                createMode(
                    "Custom Aviation Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Animal Services",

            "pawprint.fill",

            [

                createMode(
                    "Veterinary Clinic",
                    "cross.case.fill"
                ),

                createMode(
                    "Animal Hospital",
                    "cross.case.fill"
                ),

                createMode(
                    "Pet Grooming",
                    "scissors"
                ),

                createMode(
                    "Mobile Pet Grooming",
                    "truck.box.fill"
                ),

                createMode(
                    "Pet Boarding",
                    "house.fill"
                ),

                createMode(
                    "Dog Daycare",
                    "pawprint.fill"
                ),

                createMode(
                    "Pet Sitting",
                    "person.and.background.dotted"
                ),

                createMode(
                    "Dog Walking",
                    "figure.walk"
                ),

                createMode(
                    "Pet Training",
                    "figure.and.child.holdinghands"
                ),

                createMode(
                    "Dog Training",
                    "pawprint.circle.fill"
                ),

                createMode(
                    "Pet Store",
                    "cart.fill"
                ),

                createMode(
                    "Pet Supply Store",
                    "shippingbox.fill"
                ),

                createMode(
                    "Animal Rescue",
                    "heart.fill"
                ),

                createMode(
                    "Animal Shelter",
                    "house.fill"
                ),

                createMode(
                    "Horse Boarding",
                    "figure.equestrian.sports"
                ),

                createMode(
                    "Equine Services",
                    "figure.equestrian.sports"
                ),

                createMode(
                    "Pet Transportation",
                    "car.fill"
                ),

                createMode(
                    "Custom Animal Business",
                    "square.and.pencil"
                )

            ]

        ),

                createCategory(

            "Childcare & Family Services",

            "figure.2.and.child.holdinghands",

            [

                createMode(
                    "Childcare Center",
                    "figure.2.and.child.holdinghands"
                ),

                createMode(
                    "Daycare",
                    "figure.2.and.child.holdinghands"
                ),

                createMode(
                    "Preschool",
                    "graduationcap.fill"
                ),

                createMode(
                    "After School Program",
                    "book.fill"
                ),

                createMode(
                    "Early Learning Center",
                    "book.closed.fill"
                ),

                createMode(
                    "Babysitting Services",
                    "person.fill"
                ),

                createMode(
                    "Nanny Agency",
                    "person.2.fill"
                ),

                createMode(
                    "Family Counseling",
                    "heart.text.square.fill"
                ),

                createMode(
                    "Parent Coaching",
                    "person.2.wave.2.fill"
                ),

                createMode(
                    "Children's Therapy",
                    "heart.fill"
                ),

                createMode(
                    "Custom Family Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Senior Care & Home Services",

            "house.fill",

            [

                createMode(
                    "Senior Care",
                    "person.fill"
                ),

                createMode(
                    "Home Care",
                    "house.fill"
                ),

                createMode(
                    "Home Health Agency",
                    "heart.text.square.fill"
                ),

                createMode(
                    "Assisted Living",
                    "building.2.fill"
                ),

                createMode(
                    "Memory Care",
                    "brain.head.profile"
                ),

                createMode(
                    "Hospice Care",
                    "cross.case.fill"
                ),

                createMode(
                    "Companion Care",
                    "person.2.fill"
                ),

                createMode(
                    "Private Duty Nursing",
                    "cross.case.fill"
                ),

                createMode(
                    "Medical Transportation",
                    "car.fill"
                ),

                createMode(
                    "Meal Delivery",
                    "takeoutbag.and.cup.and.straw.fill"
                ),

                createMode(
                    "Custom Senior Care Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Laundry & Garment Care",

            "washer.fill",

            [

                createMode(
                    "Laundry Service",
                    "washer.fill"
                ),

                createMode(
                    "Laundromat",
                    "washer.fill"
                ),

                createMode(
                    "Dry Cleaning",
                    "sparkles"
                ),

                createMode(
                    "Commercial Laundry",
                    "building.2.fill"
                ),

                createMode(
                    "Uniform Rental",
                    "tshirt.fill"
                ),

                createMode(
                    "Alterations",
                    "scissors"
                ),

                createMode(
                    "Tailor Shop",
                    "scissors"
                ),

                createMode(
                    "Shoe Repair",
                    "shoeprints.fill"
                ),

                createMode(
                    "Leather Repair",
                    "shippingbox.fill"
                ),

                createMode(
                    "Custom Laundry Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Fashion & Apparel",

            "tshirt.fill",

            [

                createMode(
                    "Fashion Boutique",
                    "tshirt.fill"
                ),

                createMode(
                    "Clothing Brand",
                    "tshirt.fill"
                ),

                createMode(
                    "Designer Studio",
                    "paintpalette.fill"
                ),

                createMode(
                    "Custom Apparel",
                    "tshirt.fill"
                ),

                createMode(
                    "Embroidery",
                    "pencil.tip"
                ),

                createMode(
                    "Screen Printing",
                    "printer.fill"
                ),

                createMode(
                    "Promotional Products",
                    "gift.fill"
                ),

                createMode(
                    "Uniform Supplier",
                    "person.crop.rectangle"
                ),

                createMode(
                    "Fashion Accessories",
                    "bag.fill"
                ),

                createMode(
                    "Jewelry Designer",
                    "diamond.fill"
                ),

                createMode(
                    "Custom Fashion Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Publishing & Information",

            "newspaper.fill",

            [

                createMode(
                    "Publishing Company",
                    "newspaper.fill"
                ),

                createMode(
                    "Magazine Publisher",
                    "book.closed.fill"
                ),

                createMode(
                    "Newspaper",
                    "newspaper.fill"
                ),

                createMode(
                    "Book Publisher",
                    "book.fill"
                ),

                createMode(
                    "Printing Press",
                    "printer.fill"
                ),

                createMode(
                    "Media Company",
                    "tv.fill"
                ),

                createMode(
                    "News Agency",
                    "newspaper.fill"
                ),

                createMode(
                    "Research Organization",
                    "magnifyingglass"
                ),

                createMode(
                    "Technical Documentation",
                    "doc.richtext.fill"
                ),

                createMode(
                    "Knowledge Platform",
                    "brain.head.profile"
                ),

                createMode(
                    "Custom Publishing Business",
                    "square.and.pencil"
                )

            ]

        ),

        createCategory(

            "Advanced Technology",

            "cpu.fill",

            [

                createMode(
                    "Artificial Intelligence",
                    "brain.head.profile"
                ),

                createMode(
                    "Machine Learning",
                    "cpu.fill"
                ),

                createMode(
                    "Robotics",
                    "gearshape.2.fill"
                ),

                createMode(
                    "Internet of Things",
                    "network"
                ),

                createMode(
                    "Quantum Computing",
                    "atom"
                ),

                createMode(
                    "Semiconductor Company",
                    "cpu"
                ),

                createMode(
                    "Space Technology",
                    "sparkles"
                ),

                createMode(
                    "Nanotechnology",
                    "circle.hexagongrid.fill"
                ),

                createMode(
                    "Research & Development",
                    "flask.fill"
                ),

                createMode(
                    "Innovation Lab",
                    "lightbulb.fill"
                ),

                createMode(
                    "Custom Technology Company",
                    "square.and.pencil"
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
