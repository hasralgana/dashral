"use client"

import * as React from "react"
import { ChevronRightIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react"
import { AnimatePresence, LayoutGroup, motion, type MotionValue } from "motion/react"
import type { SidebarLink, SidebarProps } from "@dashral/ui/components/sidebar"
import { useLocale } from "@dashral/ui/lib/locale"
import { cn } from "@dashral/ui/lib/utils"

import { useHoverPill } from "../lib/hover"
import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"
import { DropdownMenu } from "./dropdown-menu"
import { Tooltip } from "./tooltip"

export type { SidebarProps, SidebarItem, SidebarLink } from "@dashral/ui/components/sidebar"

// The list's columns are minmax(0, 1fr) (grid-cols-1): a row can shrink below its label's width as the sidebar narrows.
// 14px in from the row's edge, the icon sits in the middle of the narrowed sidebar (60px), so it never moves as it folds.
const rowClass =
  "relative flex w-full items-center gap-3 rounded-md px-3.5 py-2 text-[13px] font-medium text-sidebar-foreground outline-none transition-colors hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-[current=page]:text-sidebar-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0"

/** What every row shares: the collapse, the hover and the motion settings. */
const RowContext = React.createContext<{
  collapsed: boolean
  reduced: boolean
  side: "left" | "right"
  linkAs: React.ElementType
  hot: string | null
  enter: (key: string) => void
  opacity: MotionValue<number> | null
  className?: string
}>({ collapsed: false, reduced: false, side: "right", linkAs: "a", hot: null, enter: () => {}, opacity: null })

/**
 * The kit's Sidebar with motion: the same items, header, footer, collapse and props. Collapsing springs its width and
 * the labels fade as they slide away; the current page's highlight is one element gliding from row to row; the hover
 * is one soft pill gliding after the pointer without a blink; a section opens with its height gliding and its chevron
 * turning, its links rising in. Collapsed, rows name themselves in tooltips and a section opens its links in a menu
 * beside it. With reduced motion everything changes at once.
 */
export function Sidebar({
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
  const reduced = useReducedMotion()
  const [own, setOwn] = React.useState(defaultCollapsed)
  const collapsed = collapsedProp ?? own
  const toggle = () => {
    if (collapsedProp === undefined) setOwn(!collapsed)
    onCollapsedChange?.(!collapsed)
  }
  const side = dir === "rtl" ? "left" : "right"
  const Toggle = collapsed !== (dir === "rtl") ? PanelLeftOpenIcon : PanelLeftCloseIcon
  const hover = useHoverPill<string>(reduced)
  const group = React.useId()

  const context = { collapsed, reduced, side, linkAs, hot: hover.hot, enter: hover.enter, opacity: hover.opacity, className: classNames?.item } as const

  return (
    <motion.aside
      data-slot="sidebar"
      data-collapsed={collapsed || undefined}
      initial={false}
      animate={{ width: collapsed ? 60 : 240 }}
      transition={reduced ? { duration: 0 } : spring.glide}
      className={cn("flex h-full shrink-0 flex-col overflow-hidden border-e border-sidebar-border bg-sidebar text-sidebar-foreground", className)}
      {...(props as React.ComponentProps<typeof motion.aside>)}
    >
      {header && (
        // Narrowed, only its first 28px show (a logo's mark), right where the icons below sit; the rest is clipped away.
        <div className={cn("flex h-14 shrink-0 items-center ps-4 pe-3", classNames?.header)}>
          <motion.div
            className="flex min-w-0 items-center overflow-hidden"
            initial={false}
            animate={{ maxWidth: collapsed ? 28 : 208 }}
            transition={reduced ? { duration: 0 } : spring.glide}
          >
            {header}
          </motion.div>
        </div>
      )}
      <nav aria-label={ariaLabel ?? t("navigation")} className={cn("min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 py-2", classNames?.nav)}>
        <RowContext value={context}>
          <LayoutGroup id={group}>
            {/* The list, not each row, is the stacking context: the highlights stay behind every row's text. */}
            <div className="relative isolate grid grid-cols-1 gap-0.5" onPointerLeave={hover.leave}>
              {items.map((item, i) =>
                item.type === "separator" ? (
                  <hr key={i} className="my-2 border-sidebar-border" />
                ) : item.type === "group" ? (
                  <div key={i} role="group" aria-label={typeof item.label === "string" ? item.label : undefined} className="mt-3 grid grid-cols-1 gap-0.5 first:mt-0">
                    {item.label && (
                      <div className="relative h-6">
                        <AnimatePresence initial={false}>
                          {collapsed ? (
                            <motion.hr
                              key="line"
                              className="absolute inset-x-2 top-1/2 border-sidebar-border"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: duration.fast }}
                            />
                          ) : (
                            <motion.p
                              key="label"
                              className="absolute inset-x-0 truncate px-3 pt-1 text-[11px] font-medium tracking-wide whitespace-nowrap text-muted-foreground uppercase"
                              initial={reduced ? { opacity: 0 } : { opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, transition: { duration: duration.fast } }}
                              transition={{ duration: duration.standard, ease: ease.enter, delay: reduced ? 0 : 0.08 }}
                            >
                              {item.label}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                    {item.items.map((link, j) => (
                      <Row key={j} id={`${i}-${j}`} link={link} />
                    ))}
                  </div>
                ) : (
                  <Row key={i} id={String(i)} link={item} />
                )
              )}
            </div>
          </LayoutGroup>
        </RowContext>
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
                className={cn(rowClass, "text-muted-foreground hover:bg-sidebar-accent/60")}
              >
                <Toggle aria-hidden />
                <Label collapsed={collapsed} reduced={reduced}>
                  {collapsed ? t("expandSidebar") : t("collapseSidebar")}
                </Label>
              </button>
            </Tooltip>
          )}
        </div>
      )}
    </motion.aside>
  )
}

/** A row's words: they fade as they slide away while the sidebar narrows, and come back after it's widened. */
function Label({ collapsed, reduced, children }: { collapsed: boolean; reduced: boolean; children: React.ReactNode }) {
  return (
    <motion.span
      // Still read out while it's faded: the narrowed sidebar only hides it from sight.
      className="min-w-0 flex-1 truncate text-start whitespace-nowrap"
      initial={false}
      animate={collapsed ? { opacity: 0, x: -8 } : { opacity: 1, x: 0 }}
      transition={reduced ? { duration: 0 } : { duration: collapsed ? duration.fast : duration.standard, ease: collapsed ? ease.exit : ease.enter, delay: collapsed ? 0 : 0.1 }}
    >
      {children}
    </motion.span>
  )
}

/** The two highlights a row can have under it: the current page's (one element gliding between rows) and the hover's. */
function Highlights({ id, current }: { id: string; current: boolean }) {
  const { hot, opacity, reduced } = React.useContext(RowContext)
  return (
    <>
      {current && <motion.span layoutId="sidebar-current" aria-hidden className="absolute inset-0 -z-10 rounded-md bg-sidebar-accent" transition={reduced ? { duration: 0 } : spring.move} />}
      {hot === id && opacity && (
        <motion.span
          layoutId="sidebar-hover"
          aria-hidden
          className="absolute inset-0 -z-20 rounded-md bg-sidebar-accent/60"
          style={{ opacity }}
          transition={reduced ? { duration: 0 } : spring.move}
        />
      )}
    </>
  )
}

function Row({ id, link }: { id: string; link: SidebarLink }) {
  const { collapsed, reduced, side, linkAs: Link, enter, className } = React.useContext(RowContext)
  const childActive = link.children?.some((child) => child.active) ?? false
  const [open, setOpen] = React.useState(link.defaultOpen ?? childActive)
  // A section with the current page in it opens when you arrive there.
  const [wasActive, setWasActive] = React.useState(childActive)
  if (wasActive !== childActive) {
    setWasActive(childActive)
    if (childActive) setOpen(true)
  }
  const sectionId = React.useId()
  const hovered = { onPointerEnter: () => !link.disabled && enter(id) }

  const inner = (
    <>
      {link.icon}
      <Label collapsed={collapsed} reduced={reduced}>
        {link.label}
      </Label>
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
            <button type="button" aria-label={link.label} disabled={link.disabled} {...hovered} className={cn(rowClass, className)}>
              <Highlights id={id} current={childActive} />
              {link.icon}
            </button>
          }
        />
      )
    }
    return (
      <div>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={sectionId} disabled={link.disabled} {...hovered} className={cn(rowClass, className)}>
          {/* Closed with the current page inside, the section's own row carries the highlight. */}
          <Highlights id={id} current={childActive && !open} />
          {inner}
          <motion.span className="flex" animate={{ rotate: open ? 90 : 0 }} transition={reduced ? { duration: 0 } : spring.move}>
            <ChevronRightIcon aria-hidden className="rtl:-scale-x-100" />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={sectionId}
              key="section"
              className="overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={reduced ? { duration: 0 } : { ...spring.glide, opacity: { duration: duration.fast } }}
            >
              <div className="ms-5 grid grid-cols-1 gap-0.5 border-s border-sidebar-border py-0.5 ps-2">
                {link.children.map((child, i) => (
                  <motion.div
                    key={i}
                    initial={reduced ? false : { opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: duration.standard, ease: ease.enter, delay: 0.04 + i * 0.03 }}
                  >
                    <Row id={`${id}-${i}`} link={child} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  const row = link.href ? (
    <Link
      href={link.href}
      aria-current={link.active ? "page" : undefined}
      aria-disabled={link.disabled || undefined}
      onClick={link.onSelect}
      {...hovered}
      className={cn(rowClass, link.disabled && "pointer-events-none opacity-50", className)}
    >
      <Highlights id={id} current={!!link.active} />
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={link.onSelect} disabled={link.disabled} aria-current={link.active ? "page" : undefined} {...hovered} className={cn(rowClass, className)}>
      <Highlights id={id} current={!!link.active} />
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
