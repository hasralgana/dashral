"use client"

import { useEffect, useState } from "react"
import {
  Bell,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Search,
  Settings,
  User,
  UserPlus,
  Users,
} from "lucide-react"
import { Avatar } from "@dashral/ui/components/avatar"
import { Breadcrumb } from "@dashral/ui/components/breadcrumb"
import { Button } from "@dashral/ui/components/button"
import { CommandDialog } from "@dashral/ui/components/command"
import { DropdownMenu } from "@dashral/ui/components/dropdown-menu"
import { Popover } from "@dashral/ui/components/popover"
import { cn } from "@dashral/ui/lib/utils"

/** One line in the bell's list: who did what, and when (as you'd write it: "2m ago"). Unread unless `read`. */
export type HeaderNotification = { id: string | number; who: string; what: string; when: string; src?: string; read?: boolean }
/** A row in the ⌘K search; it closes the search when picked. */
export type HeaderSearchItem = { label: string; icon?: React.ReactNode; shortcut?: string; onSelect?: () => void }
export type HeaderSearchGroup = { heading: string; items: HeaderSearchItem[] }
/** What the account menu asks for. */
export type HeaderAccountAction = "profile" | "billing" | "settings" | "sign-out"

const sampleNotifications: HeaderNotification[] = [
  { id: 1, who: "Sofia Davis", what: "commented on Invoice #1042", when: "2m ago" },
  { id: 2, who: "Liam Johnson", what: "invited you to Acme Marketing", when: "1h ago" },
  { id: 3, who: "Budi Santoso", what: "exported the Q3 sales report", when: "Yesterday" },
]
const sampleSearch: HeaderSearchGroup[] = [
  {
    heading: "Pages",
    items: [
      { label: "Overview", icon: <LayoutDashboard /> },
      { label: "Customers", icon: <Users /> },
      { label: "Invoices", icon: <FileText /> },
    ],
  },
  {
    heading: "Actions",
    items: [
      { label: "Invite a teammate", icon: <UserPlus /> },
      { label: "Settings", icon: <Settings />, shortcut: "⌘," },
    ],
  },
]

/**
 * A dashboard's top bar: the sidebar toggle and where you are on the left; search (also on ⌘K / Ctrl+K),
 * notifications and the account menu on the right. The trail, notifications, search and account come from props,
 * with the sample by default; reading a notification calls `onRead` (all of them, `onReadAll`).
 */
export function DashboardHeader({
  onToggleSidebar,
  breadcrumb = [{ label: "Dashboard", href: "#" }, { label: "Analytics", href: "#" }, { label: "Overview" }],
  notifications = sampleNotifications,
  onRead,
  onReadAll,
  search = sampleSearch,
  user = { name: "Olivia Martin", email: "olivia@acme.com", src: "https://randomuser.me/api/portraits/women/44.jpg" },
  onAccount,
}: {
  onToggleSidebar?: () => void
  /** Where you are; the last one is this page (on phones, the only one shown). */
  breadcrumb?: { label: string; href?: string }[]
  /** Re-read when you pass a new list. */
  notifications?: HeaderNotification[]
  onRead?: (id: HeaderNotification["id"]) => void
  onReadAll?: () => void
  /** The groups in the ⌘K search. */
  search?: HeaderSearchGroup[]
  user?: { name: string; email: string; src?: string }
  onAccount?: (action: HeaderAccountAction) => void
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const unreadOf = (list: HeaderNotification[]) => new Set(list.filter((n) => !n.read).map((n) => n.id))
  const [unread, setUnread] = useState(() => unreadOf(notifications))
  const [lastNotifications, setLastNotifications] = useState(notifications)
  if (notifications !== lastNotifications) {
    setLastNotifications(notifications)
    setUnread(unreadOf(notifications))
  }

  // ⌘K / Ctrl+K opens the search from anywhere on the page.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6">
      <Button variant="ghost" size="icon" aria-label="Toggle the sidebar" onClick={onToggleSidebar}>
        <PanelLeft />
      </Button>
      <span aria-hidden className="h-5 w-px bg-border" />
      {/* The whole trail where there's room; on phones, just the page. */}
      <Breadcrumb className="hidden min-w-0 sm:block" items={breadcrumb} />
      <span className="truncate text-sm font-medium sm:hidden">{breadcrumb.at(-1)?.label}</span>

      <div className="ms-auto flex items-center gap-1.5">
        {/* A search field on wider screens, an icon on phones; both open the palette. */}
        <Button
          variant="outline"
          onClick={() => setSearchOpen(true)}
          className="hidden w-60 justify-start gap-2 pe-[5px] has-[>svg]:pe-[5px] font-normal text-muted-foreground md:inline-flex"
        >
          <Search aria-hidden />
          Search…
          <kbd className="ms-auto inline-flex h-6 items-center rounded-[max(0px,calc(var(--radius-md)-6px))] border bg-muted px-1.5 font-sans text-[11px] text-muted-foreground">⌘K</kbd>
        </Button>
        <Button variant="ghost" size="icon" aria-label="Search" onClick={() => setSearchOpen(true)} className="md:hidden">
          <Search />
        </Button>

        <Popover
          align="end"
          className="w-80 p-0"
          trigger={
            <Button variant="ghost" size="icon" aria-label={unread.size ? `Notifications, ${unread.size} unread` : "Notifications"} className="relative">
              <Bell />
              {unread.size > 0 && (
                <span aria-hidden className="absolute top-1 right-1 grid size-4 ring-2 ring-background place-items-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                  {unread.size}
                </span>
              )}
            </Button>
          }
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-medium">Notifications</p>
            <Button
              variant="link"
              size="inline"
              className="text-xs"
              disabled={!unread.size}
              onClick={() => {
                setUnread(new Set())
                onReadAll?.()
              }}
            >
              Mark all as read
            </Button>
          </div>
          <ul className="p-1.5">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (unread.has(n.id)) onRead?.(n.id)
                    setUnread((ids) => new Set([...ids].filter((id) => id !== n.id)))
                  }}
                  className="flex w-full items-start gap-3 rounded-md p-2.5 text-start transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <Avatar src={n.src} name={n.who} size="md" />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="font-medium">{n.who}</span> <span className="text-muted-foreground">{n.what}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{n.when}</span>
                  </span>
                  <span aria-label={unread.has(n.id) ? "Unread" : undefined} className={cn("mt-1.5 size-2 shrink-0 rounded-full", unread.has(n.id) ? "bg-primary" : "bg-transparent")} />
                </button>
              </li>
            ))}
          </ul>
        </Popover>

        <DropdownMenu
          align="end"
          className="w-56"
          trigger={
            <button type="button" aria-label="Account" className="ms-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              <Avatar name={user.name} src={user.src} size="md" />
            </button>
          }
          items={[
            {
              type: "label",
              label: (
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{user.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                </span>
              ),
            },
            { type: "separator" },
            { label: "Profile", icon: <User />, shortcut: "⇧⌘P", onSelect: () => onAccount?.("profile") },
            { label: "Billing", icon: <CreditCard />, onSelect: () => onAccount?.("billing") },
            { label: "Settings", icon: <Settings />, shortcut: "⌘,", onSelect: () => onAccount?.("settings") },
            { type: "separator" },
            { label: "Sign out", icon: <LogOut />, color: "destructive", onSelect: () => onAccount?.("sign-out") },
          ]}
        />
      </div>

      <CommandDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        groups={search.map((group) => ({
          heading: group.heading,
          items: group.items.map((item) => ({
            ...item,
            onSelect: () => {
              setSearchOpen(false)
              item.onSelect?.()
            },
          })),
        }))}
      />
    </header>
  )
}
