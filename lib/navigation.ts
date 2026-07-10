import {
  BarChart3,
  Building2,
  CalendarCheck2,
  ClipboardCheck,
  ClipboardList,
  HelpCircle,
  Gauge,
  Handshake,
  KeyRound,
  LayoutDashboard,
  Bell,
  Package,
  Palette,
  ShieldAlert,
  Stethoscope,
  Store,
  Tractor,
  Truck,
  type LucideIcon,
  UsersRound,
  Wrench
} from "lucide-react";
import type { ModuleKey } from "@/lib/users/permissions";

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  module?: ModuleKey;
};

type NavigationGroup = {
  label: string;
  items: readonly NavigationItem[];
};

export const navigationGroups: readonly NavigationGroup[] = [
  {
    label: "Daily Work",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        module: "dashboard",
        icon: LayoutDashboard
      },
      {
        label: "My Pending Work",
        href: "/my-pending-work",
        module: "my-pending-work",
        icon: ClipboardList
      },
      {
        label: "Notifications",
        href: "/notifications",
        icon: Bell
      },
      {
        label: "My Visits",
        href: "/my-visits",
        module: "pilots",
        icon: CalendarCheck2
      }
    ]
  },
  {
    label: "Sales & Partners",
    items: [
      {
        label: "Farmer Leads",
        href: "/farmer-leads",
        module: "farmer-leads",
        icon: Tractor
      },
      {
        label: "Dealers",
        href: "/dealers",
        module: "dealers",
        icon: Store
      },
      {
        label: "Institutional Partners",
        href: "/institutional-partners",
        module: "institutional-partners",
        icon: Handshake
      }
    ]
  },
  {
    label: "R&D",
    items: [
      {
        label: "Pilots",
        href: "/pilots",
        module: "pilots",
        icon: Gauge
      }
    ]
  },
  {
    label: "Operations",
    items: [
      {
        label: "Devices",
        href: "/devices",
        module: "devices",
        icon: Package
      },
      {
        label: "Dispatches",
        href: "/dispatches",
        module: "dispatches",
        icon: Truck
      },
      {
        label: "Installations",
        href: "/installations",
        module: "installations",
        icon: Wrench
      },
      {
        label: "Post Installation Follow-ups",
        href: "/follow-ups",
        module: "follow-ups",
        icon: ClipboardCheck
      }
    ]
  },
  {
    label: "Team Workflows",
    items: [
      {
        label: "Marketing Requests",
        href: "/marketing-requests",
        module: "marketing-requests",
        icon: Palette
      }
    ]
  },
  {
    label: "Management",
    items: [
      {
        label: "KPI Dashboard",
        href: "/kpi-dashboard",
        module: "kpi-dashboard",
        icon: BarChart3
      },
      {
        label: "Data Quality",
        href: "/data-quality",
        module: "data-quality",
        icon: ShieldAlert
      },
      {
        label: "System Health",
        href: "/system-health",
        module: "system-health",
        icon: Stethoscope
      },
      {
        label: "Regions",
        href: "/regions",
        module: "regions",
        icon: Building2
      },
      {
        label: "Internal Users",
        href: "/internal-users",
        module: "internal-users",
        icon: UsersRound
      }
    ]
  },
  {
    label: "Support",
    items: [
      {
        label: "Help / SOP",
        href: "/help",
        icon: HelpCircle
      },
      {
        label: "Change Password",
        href: "/account/password",
        icon: KeyRound
      }
    ]
  }
];
