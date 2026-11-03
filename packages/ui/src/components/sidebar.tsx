"use client"

import * as React from "react"
import { ChevronRightIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { indicatorMotion, useIndicator } from "../lib/use-indicator"
import { cn } from "../lib/utils"
import { DropdownMenu } from "./dropdown-menu"
import { Tooltip } from "./tooltip"

/** A place in the sidebar: a link (href), an action (onSelect), or a section that opens to more (children). */
type SidebarLink = {
  type?: "item"
  /** The name, shown beside the icon (and in a tooltip while the sidebar is collapsed). */
  label: string
  icon?: React.ReactNode
  href?: string
  onSelect?: () => void
  /** The page you're on: highlighted and announced as the current page. */
  active?: boolean
  /** At the end of the row, e.g. a count or a "New" tag. Hidden while collapsed. */
  badge?: React.ReactNode
  disabled?: boolean
  /** One level of links under this one, opened and closed by its row. */
  children?: SidebarLink[]
  /** With children: open to begin with (a section with the current page in it opens on its own). */
  defaultOpen?: boolean
}

type SidebarItem = SidebarLink | { type: "group"; label?: React.ReactNode; items: SidebarLink[] } | { type: "separator" }

type SidebarProps = Omit<React.ComponentProps<"aside">, "children"> & {
  items: SidebarItem[]
  /** At the top: a logo, a workspace switcher. Only its first icon-sized part shows while collapsed, so keep one there. */
  header?: React.ReactNode
  /** At the bottom: the signed-in user, a help link. */
  footer?: React.ReactNode
  /** Narrowed to its icons. Controlled; or set defaultCollapsed and let the toggle change it. */
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  /** The collapse toggle at the bottom. On by default. */
  collapsible?: boolean
  /** Your router's link, for items with href. */
  linkAs?: React.ElementType
  /** Names the navigation for screen readers. */
  "aria-label"?: string
  classNames?: { header?: string; nav?: string; footer?: string; item?: string }
}

// The list's columns are minmax(0, 1fr) (grid-cols-1): a row can shrink below its label's width as the sidebar narrows.
// The current row's background is the sliding highlight; until that's measured (no JavaScript yet), the row draws its own.
const rowClass =
  "relative z-10 flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium text-sidebar-foreground outline-none transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-[current=page]:text-sidebar-accent-foreground aria-[current=page]:hover:bg-transparent not-in-data-measured:data-sidebar-current:bg-sidebar-accent [&_svg]:size-4 [&_svg]:shrink-0"

/**
 * An app's side navigation in one tag: a header (your logo), groups of links with icons, badges and one level of
 * sections that open, and a footer (the signed-in user). The current page's highlight slides to it. Collapsed, it
 * narrows to its icons: each shows its name in a tooltip, and a section opens its links in a menu beside it. For phones,
 * put it in a Sheet.
 */
function Sidebar({
  items,
  header,
  footer,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  collapsible = true,
  linkAs = "a",
  "aria-label": ariaLabel,
  className,
  classNames,
  ...props
}: SidebarProps) {
  const { t, dir } = useLocale()
  const [own, setOwn] = React.useState(defaultCollapsed)
  const collapsed = collapsedProp ?? own
  const toggle = () => {
    if (collapsedProp === undefined) setOwn(!collapsed)
    onCollapsedChange?.(!collapsed)
  }
  // The current page's highlight: one element sliding to whichever row is marked current.
  const [nav, rect] = useIndicator<HTMLDivElement>("[data-sidebar-current]")
  const side = dir === "rtl" ? "left" : "right"
  const Toggle = collapsed !== (dir === "rtl") ? PanelLeftOpenIcon : PanelLeftCloseIcon

  return (
    <aside
      data-slot="sidebar"
      data-collapsed={collapsed || undefined}
      className={cn(
        "flex h-full shrink-0 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-(--duration-considered) ease-standard motion-reduce:transition-none",
        collapsed ? "w-15" : "w-60",
        className
      )}
      {...props}
    >
      {header && (
        // Narrowed, only its first 28px show (a logo's mark), right where the icons below sit; the rest is clipped away.
        <div className={cn("flex h-14 shrink-0 items-center ps-4 pe-3", classNames?.header)}>
          <div
            className={cn(
              "flex min-w-0 items-center overflow-hidden transition-[max-width] duration-(--duration-considered) ease-standard motion-reduce:transition-none",
              collapsed ? "max-w-7" : "max-w-52"
            )}
          >
            {header}
          </div>
        </div>
      )}
      <nav aria-label={ariaLabel ?? t("navigation")} className={cn("min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 py-2", classNames?.nav)}>
        <div ref={nav} className="relative grid grid-cols-1 gap-0.5" data-measured={rect ? "" : undefined}>
          {rect && (
            <span
              aria-hidden
              className={cn(indicatorMotion, "rounded-md bg-sidebar-accent")}
              style={{ translate: `${rect.x}px ${rect.y}px`, width: rect.width, height: rect.height }}
            />
          )}
          {items.map((item, i) =>
            item.type === "separator" ? (
              <hr key={i} className="my-2 border-sidebar-border" />
            ) : item.type === "group" ? (
              <div key={i} role="group" aria-label={typeof item.label === "string" ? item.label : undefined} className="mt-3 grid grid-cols-1 gap-0.5 first:mt-0">
                {item.label &&
                  (collapsed ? (
                    <hr className="mx-2 mb-1 border-sidebar-border" />
                  ) : (
                    <p className="truncate px-3 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{item.label}</p>
                  ))}
                {item.items.map((link, j) => (
                  <SidebarRow key={j} link={link} collapsed={collapsed} side={side} linkAs={linkAs} className={classNames?.item} />
                ))}
              </div>
            ) : (
              <SidebarRow key={i} link={item} collapsed={collapsed} side={side} linkAs={linkAs} className={classNames?.item} />
            )
          )}
        </div>
      </nav>
      {(footer || collapsible) && (
        <div className={cn("grid shrink-0 grid-cols-1 gap-2 border-t border-sidebar-border p-2", classNames?.footer)}>
          {/* Clipped to the row's width, so folded only what's in line with the icons shows (an avatar, say). */}
          {footer && <div className="min-w-0 overflow-hidden">{footer}</div>}
          {collapsible && (
            <Tooltip content={collapsed ? t("expandSidebar") : t("collapseSidebar")} side={side}>
              <button
                type="button"
                onClick={toggle}
                aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
                aria-expanded={!collapsed}
                className={cn(rowClass, "text-muted-foreground", collapsed && "justify-center px-0")}
              >
                <Toggle aria-hidden />
                <span className={cn("truncate", collapsed && "sr-only")}>{collapsed ? t("expandSidebar") : t("collapseSidebar")}</span>
              </button>
            </Tooltip>
          )}
        </div>
      )}
    </aside>
  )
}

/** A row: a link or action, or a section's toggle with its links under it. */
function SidebarRow({
  link,
  collapsed,
  side,
  linkAs: Link,
  className,
}: {
  link: SidebarLink
  collapsed: boolean
  side: "left" | "right"
  linkAs: React.ElementType
  className?: string
}) {
  const childActive = link.children?.some((child) => child.active) ?? false
  const [open, setOpen] = React.useState(link.defaultOpen ?? childActive)
  // A section with the current page in it opens when you arrive there.
  const [wasActive, setWasActive] = React.useState(childActive)
  if (wasActive !== childActive) {
    setWasActive(childActive)
    if (childActive) setOpen(true)
  }
  const sectionId = React.useId()

  const inner = (
    <>
      {link.icon}
      <span className={cn("min-w-0 flex-1 truncate text-start", collapsed && "sr-only")}>{link.label}</span>
      {link.badge && !collapsed && <span className="shrink-0">{link.badge}</span>}
    </>
  )

  if (link.children) {
    if (collapsed) {
      // Narrowed: the section's links open in a menu beside it.
      return (
        <DropdownMenu
          side={side}
          align="start"
          className="min-w-44"
          linkAs={Link}
          items={[
            { type: "label", label: link.label },
            ...link.children.map((child) => ({ label: child.label, icon: child.icon, href: child.href, active: child.active, disabled: child.disabled, onSelect: child.onSelect })),
          ]}
          trigger={
            <button
              type="button"
              aria-label={link.label}
              disabled={link.disabled}
              data-sidebar-current={childActive || undefined}
              className={cn(rowClass, "justify-center px-0", className)}
            >
              {link.icon}
            </button>
          }
        />
      )
    }
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={sectionId}
          disabled={link.disabled}
          // Closed with the current page inside, the section's own row carries the highlight.
          data-sidebar-current={(childActive && !open) || undefined}
          className={cn(rowClass, className)}
        >
          {inner}
          <ChevronRightIcon aria-hidden className={cn("transition-transform duration-(--duration-standard) ease-standard rtl:-scale-x-100", open && "rotate-90 rtl:rotate-90")} />
        </button>
        {/* Height by grid rows, so it opens and closes without measuring; closed, it's inert. */}
        <div
          id={sectionId}
          inert={!open}
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-(--duration-standard) ease-standard motion-reduce:transition-none",
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="ms-5 grid grid-cols-1 gap-0.5 border-s border-sidebar-border py-0.5 ps-2">
              {link.children.map((child, i) => (
                <SidebarRow key={i} link={child} collapsed={false} side={side} linkAs={Link} className={cn("py-1.5", className)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const row = link.href ? (
    <Link
      href={link.href}
      aria-current={link.active ? "page" : undefined}
      aria-disabled={link.disabled || undefined}
      data-sidebar-current={link.active || undefined}
      onClick={link.onSelect}
      className={cn(rowClass, collapsed && "justify-center px-0", link.disabled && "pointer-events-none opacity-50", className)}
    >
      {inner}
    </Link>
  ) : (
    <button
      type="button"
      onClick={link.onSelect}
      disabled={link.disabled}
      data-sidebar-current={link.active || undefined}
      aria-current={link.active ? "page" : undefined}
      className={cn(rowClass, collapsed && "justify-center px-0", className)}
    >
      {inner}
    </button>
  )

  // Narrowed to its icon, a row says its name in a tooltip beside it.
  return collapsed ? (
    <Tooltip content={link.label} side={side}>
      {row}
    </Tooltip>
  ) : (
    row
  )
}

export { Sidebar, type SidebarProps, type SidebarItem, type SidebarLink }
