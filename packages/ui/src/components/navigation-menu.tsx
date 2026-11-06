"use client"

import * as React from "react"
import { NavigationMenu as NavigationMenuPrimitive } from "radix-ui"
import { ArrowUpRightIcon, ChevronDownIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

/** A link in a menu's panel: a title, and optionally an icon and a line under it. */
type NavigationMenuLink = {
  label: React.ReactNode
  href: string
  /** A line under the title: what's there. */
  description?: React.ReactNode
  icon?: React.ReactNode
  /** Opens in a new tab, marked with an arrow. */
  external?: boolean
  /** The page you're on. */
  active?: boolean
}

/** One entry on the bar: a plain link, a menu of links, or a panel of your own. */
type NavigationMenuItem =
  | {
      label: React.ReactNode
      href: string
      external?: boolean
      /** The page you're on: marked, and announced as the current page. */
      active?: boolean
    }
  | {
      label: React.ReactNode
      /** The panel's links. */
      links: NavigationMenuLink[]
      /** Links side by side from the md breakpoint up. */
      columns?: 1 | 2
      /** A card at the panel's start, e.g. the product with a picture and a line about it. */
      featured?: React.ReactNode
      /** Under the links, across the panel, e.g. "See all integrations →". */
      footer?: React.ReactNode
    }
  | {
      label: React.ReactNode
      /** A panel of your own; it needs a width (w-[480px]) since the panel takes its size from what's in it. */
      content: React.ReactNode
    }

type NavigationMenuProps = Omit<React.ComponentProps<typeof NavigationMenuPrimitive.Root>, "children"> & {
  items: NavigationMenuItem[]
  /** Your router's link (Next.js Link), for every href. */
  linkAs?: React.ElementType
  /** Where the panel opens, under the bar: at its start (default) or centred. */
  align?: "start" | "center"
  /** Names the navigation for screen readers. "Main" by default. */
  "aria-label"?: string
  classNames?: { list?: string; trigger?: string; viewport?: string }
}

const triggerClass =
  "inline-flex h-9 items-center justify-center gap-1 rounded-md px-3 text-sm font-medium text-muted-foreground outline-none transition-colors select-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:bg-accent/60 data-[state=open]:text-foreground data-[active]:text-foreground"

/**
 * A site's main navigation, in one tag: links, and menus that open a panel of links with icons and descriptions, as in
 * a landing page's header. One panel slides between menus as you move across, resizing to fit. On a phone, show the
 * same items in a Sheet instead (see the examples).
 */
function NavigationMenu({ items, linkAs: Link = "a", align = "start", className, classNames, "aria-label": ariaLabel, ...props }: NavigationMenuProps) {
  const { t } = useLocale()

  /** A link through the router's component, or an <a> that opens a new tab. */
  const link = (href: string, external: boolean | undefined, active: boolean | undefined, className: string, children: React.ReactNode) => (
    <NavigationMenuPrimitive.Link asChild active={active}>
      {external ? (
        <a href={href} target="_blank" rel="noreferrer" className={className}>
          {children}
        </a>
      ) : (
        <Link href={href} aria-current={active ? "page" : undefined} className={className}>
          {children}
        </Link>
      )}
    </NavigationMenuPrimitive.Link>
  )

  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      aria-label={ariaLabel ?? t("navigation")}
      className={cn("relative z-10 flex max-w-[min(100%,max-content)] flex-1 items-center", className)}
      {...props}
    >
      <NavigationMenuPrimitive.List className={cn("flex flex-1 flex-wrap list-none items-center justify-center gap-1", classNames?.list)}>
        {items.map((item, i) => (
          <NavigationMenuPrimitive.Item key={i}>
            {"href" in item ? (
              link(item.href, item.external, item.active, cn(triggerClass, classNames?.trigger), item.label)
            ) : (
              <>
                <NavigationMenuPrimitive.Trigger className={cn(triggerClass, "group/nav-trigger", classNames?.trigger)}>
                  {item.label}
                  <ChevronDownIcon
                    aria-hidden
                    className="relative top-px size-3.5 opacity-70 transition-transform duration-(--duration-standard) ease-spring group-data-[state=open]/nav-trigger:rotate-180 motion-reduce:transition-none"
                  />
                </NavigationMenuPrimitive.Trigger>
                <NavigationMenuPrimitive.Content
                  className={cn(
                    "start-0 top-0 w-full md:absolute md:w-auto",
                    // Moving between menus, the panels slide from the side you came from (logical sides, so it reverses
                    // in Arabic); opening and closing, the viewport fades instead.
                    "data-[motion^=from-]:animate-in data-[motion^=from-]:fade-in data-[motion^=to-]:animate-out data-[motion^=to-]:fade-out",
                    "data-[motion=from-end]:slide-in-from-end-12 data-[motion=from-start]:slide-in-from-start-12 data-[motion=to-end]:slide-out-to-end-12 data-[motion=to-start]:slide-out-to-start-12",
                    "data-[motion]:duration-(--duration-standard) data-[motion]:ease-standard motion-reduce:animate-none"
                  )}
                >
                  {"content" in item ? (
                    item.content
                  ) : (
                    <div className={cn("grid gap-1 p-2", item.featured && "md:grid-cols-[13rem_1fr]")}>
                      {item.featured && <div className="max-md:hidden">{item.featured}</div>}
                      <div className="grid gap-1">
                        <ul className={cn("grid gap-0.5 w-full md:w-[22rem]", item.columns === 2 && "md:w-[36rem] md:grid-cols-2")}>
                          {item.links.map((entry, j) => (
                            <li key={j}>
                              {link(
                                entry.href,
                                entry.external,
                                entry.active,
                                cn(
                                  "flex gap-3 rounded-md p-2.5 outline-none transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50",
                                  entry.active && "bg-accent/60"
                                ),
                                <>
                                  {entry.icon && (
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-card text-muted-foreground shadow-xs [&_svg]:size-4">
                                      {entry.icon}
                                    </span>
                                  )}
                                  <span className="grid min-w-0 gap-0.5">
                                    <span className="flex items-center gap-1 text-sm font-medium">
                                      {entry.label}
                                      {entry.external && <ArrowUpRightIcon aria-hidden className="size-3.5 text-muted-foreground" />}
                                    </span>
                                    {entry.description && <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">{entry.description}</span>}
                                  </span>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                        {item.footer && <div className="border-t px-2.5 pt-2 pb-1 text-sm">{item.footer}</div>}
                      </div>
                    </div>
                  )}
                </NavigationMenuPrimitive.Content>
              </>
            )}
          </NavigationMenuPrimitive.Item>
        ))}
      </NavigationMenuPrimitive.List>
      <div className={cn("absolute top-full flex", align === "center" ? "inset-x-0 justify-center" : "start-0")}>
        <NavigationMenuPrimitive.Viewport
          className={cn(
            "relative mt-2 h-(--radix-navigation-menu-viewport-height) w-[calc(100vw-2rem)] origin-[top_center] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg md:w-(--radix-navigation-menu-viewport-width)",
            "transition-[width,height] duration-(--duration-standard) ease-standard motion-reduce:transition-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:duration-(--duration-standard) data-[state=open]:ease-spring",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-(--duration-fast) data-[state=closed]:ease-exit",
            classNames?.viewport
          )}
        />
      </div>
    </NavigationMenuPrimitive.Root>
  )
}

export { NavigationMenu, type NavigationMenuProps, type NavigationMenuItem, type NavigationMenuLink }
