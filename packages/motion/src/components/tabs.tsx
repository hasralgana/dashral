"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"
import { animate, LayoutGroup, motion, useMotionValue } from "motion/react"
import type { TabsProps as KitTabsProps } from "@dashral/ui/components/tabs"
import { useLocale } from "@dashral/ui/lib/locale"
import { cn } from "@dashral/ui/lib/utils"

import { useHoverPill } from "../lib/hover"
import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type { TabItem } from "@dashral/ui/components/tabs"

export type TabsProps = KitTabsProps & {
  /**
   * Swipe a panel sideways to go to the next or previous tab, as on a phone; at the first or last tab it holds back
   * like a rubber band. Off by default, since a drag inside a panel may mean something else (selecting text).
   */
  swipeable?: boolean
}

/** A light buzz on phones that have one. */
const buzz = (pattern: number | number[]) => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern)
}

const trigger =
  "relative inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 hover:text-foreground data-[state=active]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

/**
 * The kit's Tabs with motion: the same items, variants and props. The picked tab's card (or line) springs to the tab
 * you pick, a soft highlight glides after the pointer from tab to tab without a break, the new panel slides in from the side of the tab
 * you came from, and the panels' height glides between them instead of jumping. With reduced motion everything only
 * fades. With swipeable, a panel follows a sideways drag and lets go into the next or previous tab, holding back like a
 * rubber band at the first and last; phones buzz as it switches. `orientation="vertical"`: the tabs in a column beside
 * their panel, the card or the start-edge line springing up and down, the panel arriving from above or below (no swipe).
 */
export function Tabs({
  items,
  variant = "default",
  fullWidth,
  listAction,
  defaultValue,
  value,
  onValueChange,
  swipeable = false,
  orientation = "horizontal",
  className,
  classNames,
  children,
  ...props
}: TabsProps) {
  const vertical = orientation === "vertical"
  // A sideways swipe through a column of tabs would go against its grain.
  const swipes = swipeable && !vertical
  const reduced = useReducedMotion()
  const id = React.useId()
  const [own, setOwn] = React.useState(defaultValue ?? items[0]?.value ?? "")
  const active = value ?? own
  // The pointer's highlight: one pill gliding from tab to tab without going out between them; it fades where it is
  // when the pointer leaves the row.
  const hover = useHoverPill<string>(reduced)
  // Which way the panel arrives: from the right when you move right, from the left when you move left.
  const order = items.map((item) => item.value)
  const previous = React.useRef(active)
  const direction = Math.sign(order.indexOf(active) - order.indexOf(previous.current))
  React.useEffect(() => {
    previous.current = active
  }, [active])

  // The tabs a swipe can reach, in order, skipping disabled ones.
  const reachable = items.filter((item) => !item.disabled).map((item) => item.value)
  const neighbour = (step: 1 | -1) => reachable[reachable.indexOf(active) + step]
  const rtl = useLocale().dir === "rtl"
  const swiped = (offset: number, velocity: number, pointer: string) => {
    const toward = (offset < -60 || velocity < -400 ? 1 : offset > 60 || velocity > 400 ? -1 : 0) * (rtl ? -1 : 1)
    const next = toward ? neighbour(toward as 1 | -1) : undefined
    if (pointer === "touch") buzz(next ? 8 : [6, 30, 6])
    if (next) pick(next)
  }

  const pick = (next: string) => {
    if (value === undefined) setOwn(next)
    onValueChange?.(next)
  }

  // The panels' height follows the open one's, on a glide; before it's measured (and with reduced motion) it's natural.
  const panel = React.useRef<HTMLDivElement>(null)
  const height = useMotionValue<number | "auto">("auto")
  // Clipped only while it glides, so a focus ring at the panel's edge isn't cut off the rest of the time.
  const [gliding, setGliding] = React.useState(false)
  React.useEffect(() => {
    const node = panel.current
    if (!node) return
    let first = true
    const observer = new ResizeObserver(([entry]) => {
      const next = entry?.borderBoxSize[0]?.blockSize ?? node.offsetHeight
      if (first || reduced) height.jump(next)
      else {
        setGliding(true)
        animate(height, next, { ...spring.glide, onComplete: () => setGliding(false) })
      }
      first = false
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [height, reduced])

  // Whether there's a tab to swipe to on that side of the panel (left is next in a left-to-right page).
  const neighbourAt = (side: "left" | "right") => {
    return Boolean(neighbour((side === "left") !== rtl ? 1 : -1))
  }

  const line = variant === "line"
  const move = reduced ? { duration: 0 } : spring.move
  const hasPanels = items.some((item) => item.content !== undefined)

  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      orientation={orientation}
      value={active}
      onValueChange={pick}
      className={cn("flex flex-col gap-2", vertical && "flex-row gap-6", className)}
      {...props}
    >
      <div
        data-slot="tabs-header"
        className={cn("flex flex-wrap items-center justify-between gap-x-3 gap-y-2", vertical && "flex-col flex-nowrap items-stretch", classNames?.header)}
      >
        <LayoutGroup id={id}>
          <TabsPrimitive.List
            data-slot="tabs-list"
            data-variant={variant}
            onPointerLeave={hover.leave}
            className={cn(
              "relative isolate inline-flex w-fit items-center justify-center text-muted-foreground",
              line ? "h-10 gap-5" : "h-9 rounded-lg bg-muted p-[3px]",
              // A column: the tabs stacked; line tabs on a hairline at their start edge.
              vertical && "h-auto flex-col items-stretch justify-start",
              vertical && line && "gap-0 border-s border-border",
              fullWidth && "w-full",
              classNames?.list
            )}
          >
            {items.map((item) => (
              <TabsPrimitive.Trigger
                key={item.value}
                value={item.value}
                disabled={item.disabled}
                onPointerEnter={() => hover.enter(item.value)}
                className={cn(
                  trigger,
                  line && "flex-none rounded-none px-0.5",
                  vertical && "h-auto justify-start py-1.5 text-start whitespace-normal",
                  vertical && line && "py-2 ps-4 pe-1",
                  classNames?.trigger
                )}
              >
                {/* The picked tab's card or line: one element that springs from tab to tab (motion's shared layout). */}
                {active === item.value && (
                  <motion.span
                    layoutId="picked"
                    aria-hidden
                    transition={move}
                    className={cn(
                      "absolute -z-10",
                      line
                        ? vertical
                          ? "inset-y-0 -start-px w-0.5 rounded-full bg-foreground"
                          : "inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground"
                        : "inset-0 rounded-md border border-border bg-card shadow-sm dark:border-transparent dark:bg-input"
                    )}
                  />
                )}
                {/* A softer one under the pointer, one element gliding from tab to tab without a break: it passes under the
                    picked tab's card too (hidden there) rather than vanishing and starting over. It fades where it is when
                    the pointer leaves the row. */}
                {hover.hot === item.value && !line && (
                  <motion.span
                    layoutId="hovered"
                    aria-hidden
                    // Its opacity is the row's, so it doesn't start from nothing at each new tab.
                    style={{ opacity: hover.opacity }}
                    transition={move}
                    className="absolute inset-0 -z-20 rounded-md bg-foreground/5"
                  />
                )}
                {item.icon}
                {item.label}
                {item.badge}
              </TabsPrimitive.Trigger>
            ))}
          </TabsPrimitive.List>
        </LayoutGroup>
        {listAction}
      </div>
      {hasPanels && (
        <motion.div style={{ height }} className={cn((gliding || swipes) && "overflow-hidden")}>
          <div ref={panel}>
            {items.map((item) =>
              item.content === undefined || item.value !== active ? null : (
                <TabsPrimitive.Content key={item.value} value={item.value} asChild>
                  <motion.div
                    className={cn("outline-none", swipes && "touch-pan-y", classNames?.content)}
                    // A swipe: free toward a neighbouring tab, a rubber band toward an end with none.
                    drag={swipes && !reduced ? "x" : false}
                    dragDirectionLock
                    dragSnapToOrigin
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={{ left: neighbourAt("left") ? 0.5 : 0.12, right: neighbourAt("right") ? 0.5 : 0.12 }}
                    onDragEnd={(event, info) => swiped(info.offset.x, info.velocity.x, (event as PointerEvent).pointerType ?? "mouse")}
                    // From the side of the tab you came from: above or below in a column.
                    initial={reduced ? { opacity: 0 } : vertical ? { opacity: 0, y: direction * 12 } : { opacity: 0, x: direction * 16 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={reduced ? { duration: duration.fast } : { duration: duration.standard, ease: ease.enter }}
                  >
                    {item.content}
                  </motion.div>
                </TabsPrimitive.Content>
              )
            )}
          </div>
        </motion.div>
      )}
      {children}
    </TabsPrimitive.Root>
  )
}
