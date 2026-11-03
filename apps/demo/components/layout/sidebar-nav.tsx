"use client"

import { useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowUpRight, ChevronRight, PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@dashral/ui/components/button"
import { DropdownMenu } from "@dashral/ui/components/dropdown-menu"
import { ScrollShadow } from "@dashral/ui/components/scroll-shadow"
import { Tooltip } from "@dashral/ui/components/tooltip"
import { indicatorMotion, useIndicator } from "@dashral/ui/lib/use-indicator"
import { cn } from "@dashral/ui/lib/utils"

import { Logo } from "@/components/icons"
import { SidebarLinks } from "@/components/layout/sidebar-links"
import { FreeTag, proColors, ProTag } from "@/components/pro-tag"
import { useDir } from "@/lib/use-dir"
import { useNavGroups, type TranslatedNavItem as NavItem } from "@/lib/use-nav"
import { toggleSidebar, useSidebarCollapsed } from "@/lib/sidebar"
import { dashral, siteConfig } from "@/lib/site"
import { templateHome } from "@/lib/templates"
import { useTemplate } from "@/lib/use-template"

/*
 * The `collapsed:` variant (app/globals.css) only applies inside the desktop panel when
 * <html data-sidebar="collapsed">, so the mobile sheet always renders the full sidebar.
 */
const itemClass =
  "relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors collapsed:mx-auto collapsed:size-10 collapsed:justify-center collapsed:px-0"
const idleClass = "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
// The current page's background is the menu's sliding highlight; until that's measured (no JavaScript yet), the item
// draws its own. Items marked data-nav-current are what the highlight goes to.
const activeClass = "text-sidebar-accent-foreground not-in-data-measured:bg-sidebar-accent"

// A template's home (/, /inset) is only current on itself, not on every page under it.
const homes = Object.values(templateHome)

function isActive(href: string, pathname: string) {
  return homes.includes(href) ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
}

/** Shows a label to the right of an icon-only item, but only while the desktop sidebar is minimized. */
function CollapsedTooltip({
  label,
  enabled,
  children,
  ...triggerProps
}: { label: React.ReactNode; enabled: boolean; children: React.ReactElement } & React.ComponentProps<"button">) {
  // Always controlled: switching `open` between undefined and false makes React warn. While disabled, opening is
  // ignored: a hidden tooltip never reports closing, so remembering the hover would show every tooltip hovered in
  // the full sidebar at once after minimizing it.
  const [open, setOpen] = useState(false)
  // Beside the sidebar: to its right, or to its left when the page reads right to left.
  const side = useDir() === "rtl" ? "left" : "right"
  if (!enabled && open) setOpen(false)
  return (
    // Other props (from a menu trigger around it) go on to the button.
    <Tooltip open={enabled && open} onOpenChange={(next) => setOpen(enabled && next)} content={label} side={side} {...triggerProps}>
      {children}
    </Tooltip>
  )
}

function ProBadge() {
  const t = useTranslations("layout")
  return (
    <ProTag label={t("pro")} locked className="collapsed:hidden" />
  )
}

function NavLink({
  item,
  pathname,
  tooltips,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  tooltips: boolean
  onNavigate?: () => void
}) {
  const t = useTranslations("layout")
  const active = isActive(item.href, pathname)
  return (
    <CollapsedTooltip label={item.pro ? `${item.title} · ${t("pro")}` : item.title} enabled={tooltips}>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        data-nav-current={active || undefined}
        className={cn(itemClass, active ? activeClass : idleClass)}
      >
        <item.icon className="size-4 shrink-0" />
        {/* sr-only (not hidden) when minimized, so the link keeps its accessible name. */}
        <span className="flex-1 collapsed:sr-only">{item.title}</span>
        {item.pro && <ProBadge />}
      </Link>
    </CollapsedTooltip>
  )
}

function NavCollapsible({
  item,
  pathname,
  tooltips,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  tooltips: boolean
  onNavigate?: () => void
}) {
  const dir = useDir()
  const inSection = isActive(item.href, pathname)
  // The deepest child the page is in: /crm/deals/<id> highlights Deals, not the section's own /crm.
  // A child at the section's own address (an overview) only matches exactly, so other pages don't light it up.
  const current = item
    .children!.filter((child) => pathname === child.href || (child.href !== item.href && pathname.startsWith(`${child.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href
  const [open, setOpen] = useState(inSection)
  const listId = useId()
  const activeRef = useRef<HTMLAnchorElement>(null)

  // Open the section when navigating into it, and keep the current page visible in a long list.
  useEffect(() => {
    if (inSection) setOpen(true)
  }, [inSection])
  useEffect(() => {
    if (open) activeRef.current?.scrollIntoView({ block: "nearest" })
  }, [open, pathname])

  return (
    <>
      {/* Expanded sidebar: inline sub-menu */}
      <div className="collapsed:hidden">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={listId}
          data-nav-current={(inSection && !open) || undefined}
          className={cn(itemClass, inSection && !open ? activeClass : idleClass, inSection && "text-sidebar-accent-foreground")}
        >
          <item.icon className="size-4 shrink-0" />
          <span className="flex-1 text-start">{item.title}</span>
          <ChevronRight
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-standard) ease-spring rtl:-scale-x-100",
              open && "rotate-90 rtl:-rotate-90"
            )}
            aria-hidden
          />
        </button>
        {/* Opens and closes by height (0fr ↔ 1fr). A closed sub-menu stays in the page but can't be reached (inert). */}
        <div
          className="grid transition-[grid-template-rows] duration-(--duration-standard) ease-standard motion-reduce:transition-none"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
          inert={!open}
        >
          <div className="min-h-0 overflow-hidden">
            <ul id={listId} className="mt-0.5 ms-5 space-y-0.5 border-s border-divider ps-2">
              {item.children!.map((child) => {
                const active = child.href === current
                return (
                  <li key={child.href}>
                    <Link
                      ref={active ? activeRef : undefined}
                      href={child.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      data-nav-current={active || undefined}
                      className={cn(
                        "relative block rounded-md px-3 py-1.5 text-[13px] transition-colors",
                        active
                          ? "font-medium text-sidebar-accent-foreground not-in-data-measured:bg-sidebar-accent"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      {child.title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Minimized sidebar: the sub-menu opens as a flyout */}
      <div className="hidden collapsed:block">
        <DropdownMenu
          side={dir === "rtl" ? "left" : "right"}
          align="start"
          sideOffset={8}
          className="max-h-[70svh] w-52"
          linkAs={Link}
          trigger={
            <CollapsedTooltip label={item.title} enabled={tooltips}>
              <button
                type="button"
                data-nav-current={inSection || undefined}
                className={cn(itemClass, inSection ? activeClass : idleClass)}
                aria-label={item.title}
              >
                <item.icon className="size-4 shrink-0" />
              </button>
            </CollapsedTooltip>
          }
          items={[
            { type: "label", label: item.title },
            { type: "separator" },
            ...item.children!.map((child) => ({ href: child.href, label: child.title, active: child.href === current })),
          ]}
        />
      </div>
    </>
  )
}

export function SidebarNav({
  variant = "mobile",
  onNavigate,
}: {
  /** "desktop" enables the minimized mode; the mobile sheet is always full width. */
  variant?: "desktop" | "mobile"
  onNavigate?: () => void
}) {
  const t = useTranslations("layout")
  const dir = useDir()
  const navGroups = useNavGroups()
  const pathname = usePathname()
  const collapsed = useSidebarCollapsed()
  const home = templateHome[useTemplate()]
  const desktop = variant === "desktop"
  const tooltips = desktop && collapsed
  // One highlight behind the current page that slides to the next one you open.
  const [navRef, highlight] = useIndicator<HTMLElement>("[data-nav-current]")

  // ⌘B / Ctrl+B toggles the desktop sidebar.
  useEffect(() => {
    if (!desktop) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "b" && (event.metaKey || event.ctrlKey) && !event.altKey) {
        event.preventDefault()
        toggleSidebar()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [desktop])

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2.5 pe-3 ps-5 collapsed:justify-center collapsed:px-0">
        {/* Expanded: logo and name, with the minimize button at the end */}
        <Link href={home} onClick={onNavigate} className="flex min-w-0 items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50 collapsed:hidden">
          <Logo className="size-7 shrink-0" />
          <span className="text-lg font-semibold tracking-tight">{siteConfig.name}</span>
          {dashral.show && <FreeTag label={t("free")} />}
        </Link>
        {desktop && (
          <Tooltip
            content={
              <>
                {t("minimizeSidebar")}
                <kbd className="ms-1 font-mono text-[10px] opacity-70">⌘B</kbd>
              </>
            }
            side={dir === "rtl" ? "left" : "right"}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebar}
              aria-label={t("minimizeSidebar")}
              className="ms-auto text-muted-foreground hover:text-foreground collapsed:hidden"
            >
              <PanelLeftClose className="rtl:-scale-x-100" />
            </Button>
          </Tooltip>
        )}
        {/* Minimized: the logo turns into the expand button on hover/focus */}
        {desktop && (
          <CollapsedTooltip
            label={
              <>
                {t("expandSidebar")} <kbd className="ms-1 font-mono text-[10px] opacity-70">⌘B</kbd>
              </>
            }
            enabled={tooltips}
          >
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={t("expandSidebar")}
              className="group/expand relative hidden size-10 items-center justify-center rounded-md outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50 collapsed:flex"
            >
              <Logo className="size-7 transition-opacity group-hover/expand:opacity-0 group-focus-visible/expand:opacity-0" />
              <PanelLeftOpen className="absolute size-5 rtl:-scale-x-100 opacity-0 transition-opacity group-hover/expand:opacity-100 group-focus-visible/expand:opacity-100" aria-hidden />
            </button>
          </CollapsedTooltip>
        )}
      </div>

      {/* The menu fades at the top or bottom while there's more to scroll, instead of showing a scrollbar. */}
      {/* A thin scrollbar against the edge, with the top or bottom fading while there's more to scroll. */}
      <ScrollShadow
        as="nav"
        ref={navRef}
        size={32}
        scrollbar
        data-measured={highlight ? "" : undefined}
        className="thin-scrollbar relative flex-1 space-y-6 overflow-x-hidden px-3 py-4 collapsed:space-y-3 collapsed:px-2"
      >
        {highlight && (
          <span
            aria-hidden
            className={cn(indicatorMotion, "rounded-md bg-sidebar-accent")}
            style={{ translate: `${highlight.x}px ${highlight.y}px`, width: highlight.width, height: highlight.height }}
          />
        )}
        {navGroups.map((group, index) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase collapsed:sr-only">
              {group.label}
            </p>
            {index > 0 && <div aria-hidden className="mx-2 mb-3 hidden h-px bg-sidebar-border collapsed:block" />}
            <ul className="space-y-0.5 collapsed:space-y-1">
              {group.items.map((item) => (
                <li key={item.href}>
                  {item.children ? (
                    <NavCollapsible item={item} pathname={pathname} tooltips={tooltips} onNavigate={onNavigate} />
                  ) : (
                    <NavLink item={item} pathname={pathname} tooltips={tooltips} onNavigate={onNavigate} />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </ScrollShadow>

      {dashral.show && (
        <div className="p-3 collapsed:px-2">
          {/* The whole card is the link; the arrow nudges toward the corner on hover. */}
          <Link
            href={dashral.links.pro}
            onClick={onNavigate}
            data-slot="pro-card"
            className={cn(
              proColors,
              "group block rounded-lg border border-transparent p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 collapsed:hidden",
              // Pro's gradient as a hairline, and a faint tint of it inside that deepens on hover.
              "[background:linear-gradient(135deg,color-mix(in_oklab,var(--tag-from)_14%,var(--sidebar)),color-mix(in_oklab,var(--tag-to)_12%,var(--sidebar)))_padding-box,linear-gradient(90deg,var(--tag-from),var(--tag-via),var(--tag-to))_border-box]",
              "hover:[background:linear-gradient(135deg,color-mix(in_oklab,var(--tag-from)_22%,var(--sidebar)),color-mix(in_oklab,var(--tag-to)_20%,var(--sidebar)))_padding-box,linear-gradient(90deg,var(--tag-from),var(--tag-via),var(--tag-to))_border-box]"
            )}
          >
            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Sparkles className="size-4 text-[var(--tag-via)]" aria-hidden />
              {dashral.name} Pro
              <ArrowUpRight
                className="ms-auto size-4 text-muted-foreground transition-[translate,color] duration-(--duration-fast) group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--tag-via)] rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5 motion-reduce:group-hover:translate-0"
                aria-hidden
              />
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">{t("proPitch")}</span>
            <span className="sr-only">{t("getPro")}</span>
          </Link>
          <div className="hidden justify-center collapsed:flex">
            <CollapsedTooltip label={t("getDashralPro")} enabled={tooltips}>
              <Button asChild size="icon" aria-label={t("getDashralPro")}>
                <Link href={dashral.links.pro}>
                  <Sparkles />
                </Link>
              </Button>
            </CollapsedTooltip>
          </div>
        </div>
      )}
      <SidebarLinks />
    </div>
  )
}
