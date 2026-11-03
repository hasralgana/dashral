"use client"

import { useState } from "react"
import {
  BarChart3,
  ChevronDown,
  ChevronsUpDown,
  CreditCard,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Settings,
  ShoppingCart,
  Sparkles,
  User,
  Users,
} from "lucide-react"
import { Avatar } from "@dashral/ui/components/avatar"
import { Button } from "@dashral/ui/components/button"
import { DropdownMenu } from "@dashral/ui/components/dropdown-menu"
import { Progress } from "@dashral/ui/components/progress"
import { Sheet, SheetClose } from "@dashral/ui/components/sheet"
import { Tooltip } from "@dashral/ui/components/tooltip"
import { indicatorMotion, useIndicator } from "@dashral/ui/lib/use-indicator"
import { cn } from "@dashral/ui/lib/utils"

/** A page in the sidebar, with a count, or a section that opens to its children. Pages are named by their label. */
export type SidebarItem = { label: string; icon: React.ReactNode; count?: number; children?: string[] }
export type SidebarGroup = { label: string; items: SidebarItem[] }
/** What the account menu asks for. */
export type AccountAction = "profile" | "billing" | "settings" | "sign-out"
/** Everything the sidebar shows besides where you are. */
type Config = {
  groups: SidebarGroup[]
  brand: { name: string; plan?: string; mark?: string }
  user: { name: string; email: string; src?: string }
  /** The card above the account: a line, a meter and a button; null hides it. */
  promo: { title: string; value: number; action: string; onAction?: () => void } | null
  onAccount?: (action: AccountAction) => void
}

const sampleGroups: SidebarGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", icon: <LayoutDashboard /> },
      { label: "Inbox", icon: <Inbox />, count: 4 },
      { label: "Reports", icon: <BarChart3 />, children: ["Sales", "Traffic", "Cohorts"] },
    ],
  },
  {
    label: "Store",
    items: [
      { label: "Orders", icon: <ShoppingCart />, count: 12 },
      { label: "Products", icon: <Package /> },
      { label: "Customers", icon: <Users /> },
      { label: "Invoices", icon: <FileText /> },
    ],
  },
]

/**
 * A dashboard's sidebar: the product, grouped pages with counts, a section that opens (Reports), a plan card and the
 * account menu. It collapses to a rail of icons with their names in tooltips, and on phones becomes a top bar whose
 * menu opens in a sheet. Every part comes from props: your pages (the one you're on controllable, `onNavigate` to go
 * there), brand, user and promo card.
 */
export function DashboardSidebar({
  groups = sampleGroups,
  current: currentProp,
  onNavigate,
  brand = { name: "Acme Inc.", plan: "Team plan" },
  user = { name: "Olivia Martin", email: "olivia@acme.com", src: "https://randomuser.me/api/portraits/women/44.jpg" },
  promo = { title: "7 of 10 seats used", value: 70, action: "Upgrade to Business" },
  onAccount,
}: {
  groups?: SidebarGroup[]
  /** The page you're on, by label (the sidebar keeps it without it). */
  current?: string
  onNavigate?: (page: string) => void
  brand?: Config["brand"]
  user?: Config["user"]
  promo?: Config["promo"]
  onAccount?: Config["onAccount"]
}) {
  const config: Config = { groups, brand, user, promo, onAccount }
  const [collapsed, setCollapsed] = useState(false)
  const [ownCurrent, setOwnCurrent] = useState(groups[0]?.items[0]?.label ?? "")
  const current = currentProp ?? ownCurrent
  const setCurrent = (page: string) => {
    setOwnCurrent(page)
    onNavigate?.(page)
  }
  const [open, setOpen] = useState<string[]>(() => groups.flatMap((g) => g.items.filter((i) => i.children).map((i) => i.label)).slice(0, 1))
  const [sheet, setSheet] = useState(false)

  return (
    <>
      {/* Phones: a top bar, and the same menu in a sheet. */}
      <div className="flex h-14 items-center gap-3 border-b bg-sidebar px-4 md:hidden">
        <Button variant="ghost" size="icon" aria-label="Open the menu" onClick={() => setSheet(true)}>
          <Menu />
        </Button>
        <Brand brand={brand} />
      </div>
      <Sheet open={sheet} onOpenChange={setSheet} side="left" title="Menu" padding="none" showCloseButton={false} className="w-72 bg-sidebar" classNames={{ header: "sr-only" }}>
        <SidebarBody
          config={config}
          inSheet
          collapsed={false}
          current={current}
          open={open}
          onOpen={setOpen}
          onPick={(page) => {
            setCurrent(page)
            setSheet(false)
          }}
        />
      </Sheet>

      <aside
        aria-label="Sidebar"
        className={cn(
          "sticky top-0 hidden h-svh shrink-0 border-e bg-sidebar transition-[width] duration-(--duration-standard) ease-standard motion-reduce:transition-none md:block",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarBody config={config} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} current={current} open={open} onOpen={setOpen} onPick={setCurrent} />
      </aside>
    </>
  )
}

function Brand({ brand, compact = false }: { brand: Config["brand"]; compact?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        {brand.mark ?? brand.name[0]}
      </span>
      {!compact && (
        <span className="grid min-w-0">
          <span className="truncate text-sm font-semibold">{brand.name}</span>
          {brand.plan && <span className="truncate text-xs text-muted-foreground">{brand.plan}</span>}
        </span>
      )}
    </span>
  )
}

function SidebarBody({
  config: { groups, brand, user, promo, onAccount },
  inSheet = false,
  collapsed,
  onToggle,
  current,
  open,
  onOpen,
  onPick,
}: {
  config: Config
  /** In the phone sheet: a close button where the collapse button would be. */
  inSheet?: boolean
  collapsed: boolean
  onToggle?: () => void
  current: string
  open: string[]
  onOpen: (open: string[]) => void
  onPick: (page: string) => void
}) {
  // One highlight behind the current page, sliding to the next one you open.
  const [navRef, highlight] = useIndicator<HTMLElement>("[aria-current=page]")
  const row =
    "relative flex h-9 w-full items-center gap-3 rounded-md text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 [&>svg]:size-4 [&>svg]:shrink-0"

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 shrink-0 items-center gap-2 px-4", collapsed && "justify-center px-0")}>
        {collapsed ? (
          <Tooltip content="Expand sidebar" side="right">
            <button type="button" aria-label="Expand sidebar" onClick={onToggle} className="group relative rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              <Brand brand={brand} compact />
              <span aria-hidden className="absolute inset-0 hidden items-center justify-center rounded-lg bg-sidebar-accent text-foreground group-hover:flex [&>svg]:size-4">
                <PanelLeftOpen />
              </span>
            </button>
          </Tooltip>
        ) : (
          <>
            <Brand brand={brand} />
            {inSheet && (
              <SheetClose asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Close the menu" className="ms-auto text-muted-foreground">
                  <X />
                </Button>
              </SheetClose>
            )}
            {onToggle && (
              <Button variant="ghost" size="icon-sm" aria-label="Collapse sidebar" onClick={onToggle} className="ms-auto text-muted-foreground">
                <PanelLeftClose />
              </Button>
            )}
          </>
        )}
      </div>

      <nav ref={navRef} aria-label="Main" className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {highlight && (
          <span
            aria-hidden
            className={cn(indicatorMotion, "rounded-md bg-sidebar-accent")}
            style={{ translate: `${highlight.x}px ${highlight.y}px`, width: highlight.width, height: highlight.height }}
          />
        )}
        {groups.map((group, g) => (
          <div key={group.label} className={cn(g > 0 && "mt-5")}>
            {collapsed ? (
              g > 0 && <span aria-hidden className="mx-auto mb-3 block h-px w-6 bg-border" />
            ) : (
              <p className="mb-1 px-3 text-xs font-medium text-muted-foreground">{group.label}</p>
            )}
            <ul className="grid gap-0.5">
              {group.items.map((item) => {
                const here = current === item.label || item.children?.includes(current)
                const expanded = open.includes(item.label)

                if (collapsed) {
                  const icon = (
                    <button
                      type="button"
                      aria-label={item.count ? `${item.label}, ${item.count}` : item.label}
                      aria-current={here ? "page" : undefined}
                      onClick={() => !item.children && onPick(item.label)}
                      className={cn(row, "justify-center", here ? "text-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground")}
                    >
                      {item.icon}
                      {item.count && <span aria-hidden className="absolute end-1.5 top-1.5 size-1.5 rounded-full bg-primary" />}
                    </button>
                  )
                  return (
                    <li key={item.label}>
                      {item.children ? (
                        // A section opens to the side when the rail is collapsed.
                        <DropdownMenu
                          side="right"
                          align="start"
                          className="w-44"
                          trigger={icon}
                          items={[{ type: "label", label: item.label }, ...item.children.map((child) => ({ label: child, onSelect: () => onPick(child) }))]}
                        />
                      ) : (
                        <Tooltip content={item.count ? `${item.label} · ${item.count}` : item.label} side="right">
                          {icon}
                        </Tooltip>
                      )}
                    </li>
                  )
                }

                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      aria-current={!item.children && here ? "page" : undefined}
                      aria-expanded={item.children ? expanded : undefined}
                      onClick={() => (item.children ? onOpen(expanded ? open.filter((o) => o !== item.label) : [...open, item.label]) : onPick(item.label))}
                      className={cn(row, "px-3", here ? "font-medium text-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground")}
                    >
                      {item.icon}
                      <span className="flex-1 truncate text-start">{item.label}</span>
                      {item.count && <span className="rounded-full bg-primary/12 px-1.5 text-[11px] font-medium text-primary-text tabular-nums">{item.count}</span>}
                      {item.children && (
                        <ChevronDown aria-hidden className={cn("size-4 text-muted-foreground transition-transform duration-(--duration-standard) ease-standard", !expanded && "-rotate-90 rtl:rotate-90")} />
                      )}
                    </button>
                    {item.children && (
                      <div
                        inert={!expanded || undefined}
                        className="grid transition-[grid-template-rows] duration-(--duration-standard) ease-standard motion-reduce:transition-none"
                        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
                      >
                        <ul className="ms-5 min-h-0 overflow-hidden border-s ps-2">
                          {item.children.map((child) => (
                            <li key={child} className="pt-0.5">
                              <button
                                type="button"
                                aria-current={current === child ? "page" : undefined}
                                onClick={() => onPick(child)}
                                className={cn(row, "h-8 px-3", current === child ? "font-medium text-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground")}
                              >
                                {child}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn("grid shrink-0 gap-3 border-t p-3", collapsed && "justify-center")}>
        {!collapsed && promo && (
          <div className="rounded-lg border bg-card p-3">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="size-4 text-primary-text" aria-hidden /> {promo.title}
            </p>
            <Progress value={promo.value} className="mt-2 h-1.5" aria-label={promo.title} />
            <Button size="sm" className="mt-3 w-full" onClick={promo.onAction}>
              {promo.action}
            </Button>
          </div>
        )}
        <DropdownMenu
          side={collapsed ? "right" : "top"}
          align={collapsed ? "end" : "start"}
          className="w-56"
          trigger={
            <button
              type="button"
              aria-label={`Account menu for ${user.name}`}
              className={cn("flex items-center gap-3 rounded-md p-1.5 text-start outline-none transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:bg-sidebar-accent", !collapsed && "w-full")}
            >
              <Avatar src={user.src} name={user.name} alt="" size="md" />
              {!collapsed && (
                <>
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate text-sm font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </span>
                  <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </>
              )}
            </button>
          }
          items={[
            { label: "Profile", icon: <User />, onSelect: () => onAccount?.("profile") },
            { label: "Billing", icon: <CreditCard />, onSelect: () => onAccount?.("billing") },
            { label: "Settings", icon: <Settings />, onSelect: () => onAccount?.("settings") },
            { type: "separator" },
            { label: "Sign out", icon: <LogOut />, color: "destructive", onSelect: () => onAccount?.("sign-out") },
          ]}
        />
      </div>
    </div>
  )
}
