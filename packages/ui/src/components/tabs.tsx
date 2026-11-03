"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "../lib/utils"

type TabItem = {
  value: string
  label: React.ReactNode
  icon?: React.ReactNode
  /** After the label, e.g. a count. */
  badge?: React.ReactNode
  disabled?: boolean
  /** The panel shown while this tab is picked. Without any, Tabs is just the row, a switcher for content of your own. */
  content?: React.ReactNode
}

type TabsProps = Omit<React.ComponentProps<typeof TabsPrimitive.Root>, "children"> & {
  items: TabItem[]
  /** default: a raised card on a muted track; line: plain tabs with an underline, for the top of a page or a panel. */
  variant?: "default" | "line"
  /** The tab row fills the width, tabs sharing it equally. */
  fullWidth?: boolean
  /** At the end of the tab row, e.g. buttons that act on the current tab. */
  listAction?: React.ReactNode
  /** More content in the tabs, under the panels — e.g. one view that changes with the picked tab. */
  children?: React.ReactNode
  classNames?: { header?: string; list?: string; trigger?: string; content?: string }
}

/**
 * Tabs in one tag: items with a label (and an icon or badge) and the panel each shows. The picked tab's card or
 * underline glides to the tab you pick (it just moves with reduced motion). Opens on the first tab.
 * `orientation="vertical"`: the tabs in a column beside their panel (↑ ↓ move between them), the card or a line at
 * their start edge gliding up and down; stack them above the panel on narrow screens with `className`.
 */
function Tabs({ items, variant = "default", fullWidth, listAction, defaultValue, orientation = "horizontal", className, classNames, children, ...props }: TabsProps) {
  const vertical = orientation === "vertical"
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      orientation={orientation}
      defaultValue={props.value === undefined ? (defaultValue ?? items[0]?.value) : undefined}
      className={cn("flex flex-col gap-2", vertical && "flex-row gap-6", className)}
      {...props}
    >
      {/* The action wraps below the tabs when they don't fit side by side (a phone); in a column it sits under them. */}
      <div
        data-slot="tabs-header"
        className={cn("flex flex-wrap items-center justify-between gap-x-3 gap-y-2", vertical && "flex-col flex-nowrap items-stretch", classNames?.header)}
      >
        <TabsList variant={variant} className={cn(fullWidth && "w-full", classNames?.list)}>
          {items.map((item) => (
            <TabsTrigger key={item.value} value={item.value} disabled={item.disabled} className={classNames?.trigger}>
              {item.icon}
              {item.label}
              {item.badge}
            </TabsTrigger>
          ))}
        </TabsList>
        {listAction}
      </div>
      {items.map((item) =>
        item.content === undefined ? null : (
          <TabsContent key={item.value} value={item.value} className={classNames?.content}>
            {item.content}
          </TabsContent>
        )
      )}
      {children}
    </TabsPrimitive.Root>
  )
}

/**
 * The tab row. `default`: the selected tab is a raised card on a muted track. `line`: plain tabs with an underline,
 * for the top of a page or a panel. Either way the card or line slides to the tab you pick (it just moves with
 * reduced motion), easing to a soft stop.
 */
function TabsList({
  className,
  children,
  variant = "default",
  ref: forwardedRef,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & { variant?: "default" | "line" }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null)

  const [vertical, setVertical] = React.useState(false)

  // Measure the selected tab so the card can move to it; again when the row resizes or the selection changes.
  React.useLayoutEffect(() => {
    const list = ref.current
    if (!list) return
    const measure = () => {
      const tab = list.querySelector<HTMLElement>(":scope > [data-slot=tabs-trigger][data-state=active]")
      // Radix marks the list with its orientation.
      setVertical(list.dataset.orientation === "vertical")
      setThumb(tab ? { x: tab.offsetLeft, y: tab.offsetTop, width: tab.offsetWidth, height: tab.offsetHeight } : null)
    }
    measure()
    const resize = new ResizeObserver(measure)
    resize.observe(list)
    const changes = new MutationObserver(measure)
    changes.observe(list, { attributes: true, subtree: true, attributeFilter: ["data-state"], childList: true })
    return () => {
      resize.disconnect()
      changes.disconnect()
    }
  }, [])

  return (
    <TabsPrimitive.List
      ref={(node) => {
        ref.current = node
        if (typeof forwardedRef === "function") forwardedRef(node)
        else if (forwardedRef) forwardedRef.current = node
      }}
      data-slot="tabs-list"
      data-variant={variant}
      data-measured={thumb ? "" : undefined}
      className={cn(
        "relative inline-flex w-fit items-center justify-center text-muted-foreground",
        variant === "default" ? "h-9 rounded-lg bg-muted p-[3px]" : "h-10 gap-5",
        // A column: the tabs stacked and as wide as the widest; line tabs on a hairline at their start edge.
        "data-[orientation=vertical]:h-auto data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch data-[orientation=vertical]:justify-start",
        variant === "line" && "data-[orientation=vertical]:gap-0 data-[orientation=vertical]:border-s data-[orientation=vertical]:border-border",
        className
      )}
      {...props}
    >
      {thumb && (
        <span
          aria-hidden
          data-slot="tabs-thumb"
          className={cn(
            "absolute top-0 transition-[translate,width,height] duration-(--duration-considered) ease-standard motion-reduce:transition-none",
            // A vertical line sits on the list's hairline at the start edge (right in RTL); the rest go by offsets.
            variant === "line" && vertical ? "-start-px" : "left-0",
            variant === "default"
              ? "rounded-md border border-border bg-card shadow-sm dark:border-transparent dark:bg-input"
              : "rounded-full bg-foreground"
          )}
          style={
            variant === "default"
              ? { translate: `${thumb.x}px ${thumb.y}px`, width: thumb.width, height: thumb.height }
              : vertical
                ? { translate: `0 ${thumb.y}px`, width: 2, height: thumb.height }
                : { translate: `${thumb.x}px ${thumb.y + thumb.height - 2}px`, width: thumb.width, height: 2 }
          }
        />
      )}
      {children}
    </TabsPrimitive.List>
  )
}

// The selected tab is a raised card on the muted track: white with an edge and a shadow in light mode, a lighter
// fill in dark mode. (The page background is nearly as light as the track, so it can't be the selected color.) Once
// the list has measured it, the card is TabsList's sliding thumb; before that (server render), the tab draws its own.
function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative z-10 inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 hover:text-foreground data-[state=active]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Card tabs: before the thumb is measured, the selected tab draws its own card.
        "in-data-[variant=default]:not-in-data-measured:data-[state=active]:border-border in-data-[variant=default]:not-in-data-measured:data-[state=active]:bg-card in-data-[variant=default]:not-in-data-measured:data-[state=active]:shadow-sm dark:in-data-[variant=default]:not-in-data-measured:data-[state=active]:border-transparent dark:in-data-[variant=default]:not-in-data-measured:data-[state=active]:bg-input",
        // Line tabs: no padding at the sides, and the same fallback as an underline.
        "in-data-[variant=line]:flex-none in-data-[variant=line]:rounded-none in-data-[variant=line]:px-0.5 in-data-[variant=line]:not-in-data-measured:data-[state=active]:shadow-[inset_0_-2px_0_var(--foreground)]",
        // In a column: as wide as the list, the label at the start and free to wrap; line tabs indented from their line,
        // whose fallback is at the start edge instead of underneath.
        "data-[orientation=vertical]:h-auto data-[orientation=vertical]:justify-start data-[orientation=vertical]:py-1.5 data-[orientation=vertical]:text-start data-[orientation=vertical]:whitespace-normal",
        "in-data-[variant=line]:data-[orientation=vertical]:py-2 in-data-[variant=line]:data-[orientation=vertical]:ps-4 in-data-[variant=line]:data-[orientation=vertical]:pe-1 in-data-[variant=line]:not-in-data-measured:data-[orientation=vertical]:data-[state=active]:shadow-[inset_2px_0_0_var(--foreground)] rtl:in-data-[variant=line]:not-in-data-measured:data-[orientation=vertical]:data-[state=active]:shadow-[inset_-2px_0_0_var(--foreground)]",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:blur-in-[3px] data-[state=active]:duration-(--duration-standard) data-[state=active]:ease-enter motion-reduce:data-[state=active]:blur-in-0",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, type TabsProps, type TabItem }
