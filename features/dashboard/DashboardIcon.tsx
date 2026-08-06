//
// JCS Business Suite
// DashboardIcon.tsx
//
// Central icon resolver for Dashboard modules.
// Converts icon keys stored in DashboardModuleRegistry
// into real Lucide React components.
//

import type {
  ComponentType,
  SVGProps,
} from "react";

import {
  Archive,
  BadgeDollarSign,
  Bell,
  Building2,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  ChartLine,
  ChartNoAxesCombined,
  CircleDollarSign,
  CircleUserRound,
  ClipboardCheck,
  ClockArrowUp,
  Container,
  CreditCard,
  Heart,
  History,
  House,
  Landmark,
  MapPinned,
  Package,
  PackageOpen,
  PackagePlus,
  RotateCcw,
  ScanLine,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Truck,
  Undo2,
  UserCog,
  UserPlus,
  Users,
  UsersRound,
  Utensils,
  Wrench,
} from "lucide-react";

// MARK: - Types

export interface DashboardIconProps {
  name?: string | null;
  size?: number;
  strokeWidth?: number;
  className?: string;
  decorative?: boolean;
  title?: string;
}

type LucideIconComponent = ComponentType<
  SVGProps<SVGSVGElement> & {
    size?: number | string;
    strokeWidth?: number | string;
  }
>;

// MARK: - Icon Registry

const DASHBOARD_ICON_REGISTRY: Readonly<
  Record<string, LucideIconComponent>
> = {
  // Store

  house: House,
  home: House,

  utensils: Utensils,
  restaurant: Utensils,
  menu: Utensils,

  "shopping-bag": ShoppingBag,
  catalog: ShoppingBag,

  heart: Heart,
  favorites: Heart,

  "circle-user-round": CircleUserRound,
  account: CircleUserRound,
  profile: CircleUserRound,

  // Business

  "credit-card": CreditCard,
  pos: CreditCard,
  payment: CreditCard,

  "scan-line": ScanLine,
  scanner: ScanLine,
  "cash-register": ScanLine,

  "chart-no-axes-combined": ChartNoAxesCombined,
  insights: ChartNoAxesCombined,
  analytics: ChartNoAxesCombined,

  "circle-dollar-sign": CircleDollarSign,
  accounting: CircleDollarSign,
  finance: CircleDollarSign,

  "chart-line": ChartLine,
  sales: ChartLine,

  // Operations

  package: Package,
  products: Package,
  product: Package,

  archive: Archive,
  inventory: Archive,

  "shopping-cart": ShoppingCart,
  orders: ShoppingCart,
  order: ShoppingCart,

  "undo-2": Undo2,
  returns: Undo2,
  refunds: Undo2,

  wrench: Wrench,
  services: Wrench,
  service: Wrench,

  truck: Truck,
  transportation: Truck,
  delivery: Truck,
  fleet: Truck,

  "shield-check": ShieldCheck,
  compliance: ShieldCheck,

  "building-2": Building2,
  buildings: Building2,
  facilities: Building2,

  "package-plus": PackagePlus,
  receiving: PackagePlus,

  history: History,
  "receiving-history": History,

  "package-open": PackageOpen,
  shipping: PackageOpen,

  "map-pinned": MapPinned,
  shipments: MapPinned,
  tracking: MapPinned,

  "calendar-clock": CalendarClock,
  appointments: CalendarClock,
  booking: CalendarClock,

  "clock-arrow-up": ClockArrowUp,
  backorders: ClockArrowUp,

  // Management

  "calendar-plus": CalendarPlus,
  events: CalendarPlus,
  projects: CalendarPlus,

  users: Users,
  customers: Users,

  "users-round": UsersRound,
  employees: UsersRound,
  team: UsersRound,

  landmark: Landmark,
  platform: Landmark,
  "platform-clients": Landmark,

  "user-plus": UserPlus,
  invitations: UserPlus,
  invite: UserPlus,

  "badge-dollar-sign": BadgeDollarSign,
  payroll: BadgeDollarSign,

  container: Container,
  providers: Container,
  suppliers: Container,

  "user-cog": UserCog,
  roles: UserCog,
  permissions: UserCog,

  settings: Settings,
  "app-settings": Settings,

  // Shared and future modules

  bell: Bell,
  notifications: Bell,

  calendar: CalendarDays,

  sparkles: Sparkles,
  sofia: Sparkles,
  intelligence: Sparkles,

  "clipboard-check": ClipboardCheck,
  tasks: ClipboardCheck,

  "rotate-ccw": RotateCcw,
  activity: RotateCcw,
};

// MARK: - Helpers

function normalizeIconName(
  value?: string | null
): string {
  return (
    value
      ?.trim()
      .toLowerCase()
      .replace(/[_\s]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") ||
    "sparkles"
  );
}

// MARK: - Resolver

export function resolveDashboardIcon(
  name?: string | null
): LucideIconComponent {
  const normalizedName =
    normalizeIconName(name);

  return (
    DASHBOARD_ICON_REGISTRY[
      normalizedName
    ] ?? Sparkles
  );
}

// MARK: - Component

export default function DashboardIcon({
  name,
  size = 20,
  strokeWidth = 1.8,
  className,
  decorative = true,
  title,
}: DashboardIconProps) {
  const Icon = resolveDashboardIcon(name);

  const accessibilityProps =
    decorative
      ? {
          "aria-hidden": true,
        }
      : {
          role: "img",
          "aria-label":
            title ||
            normalizeIconName(name),
        };

  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      focusable="false"
      {...accessibilityProps}
    />
  );
}

// MARK: - Named Icon

export function DashboardNamedIcon(
  props: DashboardIconProps
) {
  return <DashboardIcon {...props} />;
}