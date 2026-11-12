"use client"

import * as React from "react"
import { MenuIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { Button } from "./button"
import { PageHeader, type PageHeaderProps } from "./page-header"
import { Sheet } from "./sheet"
import { Sidebar, type SidebarProps } from "./sidebar"

type AppShellProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The side navigation, as Sidebar's props: items, header (your logo), footer (the user), linkAs and the rest. */
  sidebar: Omit<SidebarProps, "collapsed" | "defaultCollapsed" | "onCollapsedChange">
  /** The bar along the top, beside the menu button on a phone: a search, notifications, the user. It sticks as the page scrolls. */
  header?: React.ReactNode
  /** The page's header under the bar, as PageHeader's props: title, description, breadcrumb, actions, tabs. */
  page?: PageHeaderProps
  /** The page itself. */
  children?: React.ReactNode
  /** The sidebar narrowed to its icons. Controlled; or set defaultCollapsed and let its toggle change it. */
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  /**
   * Inside a box of your own instead of the whole window: it fills the box's height and the page scrolls within it, the
   * bar sticking at its top. For a preview, a demo or a panel; an app leaves it off and scrolls with the window.
   */
  contained?: boolean
  classNames?: { sidebar?: string; header?: string; main?: string; page?: string }
}

/**
 * A dashboard's frame, in one tag: `<AppShell sidebar={{ items }} header={<Search />} page={{ title: "Orders" }}>…</AppShell>`.
 * The sidebar on the left (it narrows to its icons with its toggle), a bar along the top that sticks as the page
 * scrolls, the page's header and then the page. On a phone the sidebar moves into a sheet opened from the bar's menu
 * button, which closes again when a link in it is followed.
 */
function AppShell({
  sidebar,
  header,
  page,
  children,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  contained = false,
  className,
  classNames,
  ...props
}: AppShellProps) {
  const { t } = useLocale()
  const [own, setOwn] = React.useState(defaultCollapsed)
  const collapsed = collapsedProp ?? own
  const [menuOpen, setMenuOpen] = React.useState(false)

  function setCollapsed(next: boolean) {
    if (collapsedProp === undefined) setOwn(next)
    onCollapsedChange?.(next)
  }

  return (
    <div data-slot="app-shell" className={cn("flex w-full bg-background", contained ? "h-full min-h-0 overflow-hidden" : "min-h-svh", className)} {...props}>
      {/* The sidebar from lg up, as tall as the window while the page scrolls past it; in a box, stretched to its height
          (a flex row stretches it: a percentage height wouldn't resolve against a height the box only gets from flex). */}
      <div className={cn("hidden shrink-0 lg:flex", !contained && "sticky top-0 h-svh")}>
        <Sidebar {...sidebar} collapsed={collapsed} onCollapsedChange={setCollapsed} className={cn("h-full", sidebar.className, classNames?.sidebar)} />
      </div>
      <div className={cn("flex min-w-0 flex-1 flex-col", contained && "overflow-y-auto")}>
        <header
          data-slot="app-shell-header"
          className={cn(
            "sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-divider bg-background/85 px-4 backdrop-blur-md md:px-6",
            classNames?.header
          )}
        >
          <Sheet
            open={menuOpen}
            onOpenChange={setMenuOpen}
            side="left"
            padding="none"
            title={sidebar["aria-label"] ?? t("navigation")}
            classNames={{ title: "sr-only" }}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label={t("openNavigation")} className="-ms-1.5 lg:hidden">
                <MenuIcon />
              </Button>
            }
          >
            {/* Following a link closes the sheet, so the page it opens is in view. */}
            <div
              className="h-full"
              onClickCapture={(event) => {
                if ((event.target as Element).closest("a[href]")) setMenuOpen(false)
              }}
            >
              <Sidebar {...sidebar} collapsible={false} className={cn("h-full w-full border-e-0", sidebar.className)} />
            </div>
          </Sheet>
          <div className="flex min-w-0 flex-1 items-center gap-2">{header}</div>
        </header>
        <main data-slot="app-shell-main" className={cn("w-full flex-1 space-y-6 p-4 md:p-6", classNames?.main)}>
          {page && <PageHeader {...page} className={cn(page.className, classNames?.page)} />}
          {children}
        </main>
      </div>
    </div>
  )
}

export { AppShell, type AppShellProps }
