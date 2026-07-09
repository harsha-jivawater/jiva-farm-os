import {
  BarChart3,
  Building2,
  CalendarCheck2,
  ClipboardCheck,
  ClipboardList,
  Gauge,
  Handshake,
  LayoutDashboard,
  Package,
  Palette,
  ShieldAlert,
  Stethoscope,
  Store,
  Tractor,
  Truck,
  UsersRound,
  Wrench
} from "lucide-react";
import type { ModuleKey } from "@/lib/users/permissions";

export const navigationItems = [
  {
    label: "Home",
    href: "/dashboard",
    module: "dashboard" satisfies ModuleKey,
    icon: LayoutDashboard
  },
  {
    label: "My Pending Work",
    href: "/my-pending-work",
    module: "my-pending-work" satisfies ModuleKey,
    icon: ClipboardList
  },
  {
    label: "Farmer Leads",
    href: "/farmer-leads",
    module: "farmer-leads" satisfies ModuleKey,
    icon: Tractor
  },
  {
    label: "Dealers",
    href: "/dealers",
    module: "dealers" satisfies ModuleKey,
    icon: Store
  },
  {
    label: "Institutional Partners",
    href: "/institutional-partners",
    module: "institutional-partners" satisfies ModuleKey,
    icon: Handshake,
    gapAfter: true
  },
  {
    label: "Pilots",
    href: "/pilots",
    module: "pilots" satisfies ModuleKey,
    icon: Gauge
  },
  {
    label: "My Visits",
    href: "/my-visits",
    module: "pilots" satisfies ModuleKey,
    icon: CalendarCheck2,
    gapAfter: true
  },
  {
    label: "Dispatches",
    href: "/dispatches",
    module: "dispatches" satisfies ModuleKey,
    icon: Truck
  },
  {
    label: "Installations",
    href: "/installations",
    module: "installations" satisfies ModuleKey,
    icon: Wrench
  },
  {
    label: "Post Installation Follow-ups",
    href: "/follow-ups",
    module: "follow-ups" satisfies ModuleKey,
    icon: ClipboardCheck,
    gapAfter: true
  },
  {
    label: "Devices",
    href: "/devices",
    module: "devices" satisfies ModuleKey,
    icon: Package
  },
  {
    label: "KPI Dashboard",
    href: "/kpi-dashboard",
    module: "kpi-dashboard" satisfies ModuleKey,
    icon: BarChart3
  }
] as const;

export const teamItems = [
  {
    label: "Regions",
    href: "/regions",
    module: "regions" satisfies ModuleKey,
    icon: Building2
  },
  {
    label: "Internal Users",
    href: "/internal-users",
    module: "internal-users" satisfies ModuleKey,
    icon: UsersRound
  }
] as const;

export const teamWorkflowItems = [
  {
    label: "System Health",
    href: "/system-health",
    module: "system-health" satisfies ModuleKey,
    icon: Stethoscope
  },
  {
    label: "Data Quality",
    href: "/data-quality",
    module: "data-quality" satisfies ModuleKey,
    icon: ShieldAlert
  },
  {
    label: "Marketing Requests",
    href: "/marketing-requests",
    module: "marketing-requests" satisfies ModuleKey,
    icon: Palette
  }
] as const;
