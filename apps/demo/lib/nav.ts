import {
  Activity,
  BarChart3,
  Blocks,
  Boxes,
  CalendarDays,
  ChartPie,
  CreditCard,
  FileWarning,
  FolderKanban,
  FolderOpen,
  Headset,
  KanbanSquare,
  KeyRound,
  Landmark,
  LayoutDashboard,
  LogIn,
  MessageSquare,
  MonitorDot,
  Network,
  Receipt,
  Rocket,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Tag,
  UserCog,
  UserPlus,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react"

import type messages from "@/messages/en"

import type { Template } from "./templates"

/** A key in messages/<locale>.json → nav; useNavGroups() gives the translated menu. */
export type NavKey = keyof (typeof messages)["nav"]

export type NavItem = {
  title: NavKey
  href: string
  icon: LucideIcon
  /** Available in Dashral Pro only — links to the upgrade page. */
  pro?: boolean
  /** Renders a collapsible sub-menu. `href` is the section prefix used for the active state. */
  children?: { title: NavKey; href: string }[]
}

export type NavGroup = {
  label: NavKey
  items: NavItem[]
}

// @dashral-if classic
const errorPages: NavItem = {
  title: "errorPages",
  href: "/errors",
  icon: FileWarning,
  children: [
    { title: "notFound", href: "/errors/404" },
    { title: "serverError", href: "/errors/500" },
    { title: "maintenance", href: "/errors/maintenance" },
  ],
}

/** Classic's menu. */
export const navGroups: NavGroup[] = [
  {
    label: "dashboards",
    items: [
      { title: "overview", href: "/", icon: LayoutDashboard },
      { title: "finance", href: "/finance", icon: Landmark },
      { title: "projects", href: "/projects", icon: FolderKanban },
      { title: "support", href: "/support", icon: Headset },
      { title: "inventory", href: "/inventory", icon: Boxes },
      { title: "monitoring", href: "/monitoring", icon: MonitorDot },
      { title: "analytics", href: "/pro/analytics", icon: BarChart3, pro: true },
      { title: "services", href: "/pro/services", icon: Network, pro: true },
      { title: "ecommerce", href: "/pro/ecommerce", icon: ShoppingCart, pro: true },
      { title: "crm", href: "/pro/crm", icon: Users, pro: true },
    ],
  },
  {
    label: "apps",
    items: [
      { title: "files", href: "/files", icon: FolderOpen },
      { title: "assistant", href: "/assistant", icon: Sparkles },
      { title: "kanban", href: "/pro/kanban", icon: KanbanSquare, pro: true },
      { title: "calendar", href: "/pro/calendar", icon: CalendarDays, pro: true },
      { title: "chat", href: "/pro/chat", icon: MessageSquare, pro: true },
    ],
  },
  {
    label: "pages",
    items: [
      { title: "gettingStarted", href: "/getting-started", icon: Rocket },
      { title: "settings", href: "/settings", icon: Settings },
      { title: "pricing", href: "/pricing", icon: Tag },
      { title: "signIn", href: "/login", icon: LogIn },
      { title: "signUp", href: "/register", icon: UserPlus },
      { title: "twoFactor", href: "/two-factor", icon: ShieldCheck },
      errorPages,
    ],
  },
]

// @dashral-end

// @dashral-if inset
/**
 * Inset's menu: its own pages, then the ones it shares with Classic. Everything that would take you out of Inset's
 * frame stays in Classic's menu only: the Pro features (their pages show them in Classic), sign-in, sign-up and the
 * error pages.
 */
export const insetNavGroups: NavGroup[] = [
  {
    label: "workspace",
    items: [
      { title: "overview", href: "/inset", icon: LayoutDashboard },
      { title: "customers", href: "/inset/customers", icon: UsersRound },
      { title: "invoices", href: "/inset/invoices", icon: Receipt },
      { title: "activity", href: "/inset/activity", icon: Activity },
    ],
  },
  {
    label: "insights",
    items: [{ title: "reports", href: "/inset/reports", icon: ChartPie }],
  },
  {
    label: "organization",
    items: [
      { title: "team", href: "/inset/team", icon: UserCog },
      { title: "billing", href: "/inset/billing", icon: CreditCard },
    ],
  },
  {
    label: "developers",
    items: [
      { title: "apiKeys", href: "/inset/api-keys", icon: KeyRound },
      { title: "integrations", href: "/inset/integrations", icon: Blocks },
    ],
  },
  {
    label: "pages",
    items: [
      { title: "settings", href: "/inset/settings", icon: Settings },
      { title: "pricing", href: "/inset/pricing", icon: Tag },
    ],
  },
]

// @dashral-end

export const templateNavGroups: Record<Template, NavGroup[]> = {
  // @dashral-if classic
  classic: navGroups,
  // @dashral-end
  // @dashral-if inset
  inset: insetNavGroups,
  // @dashral-end
}
