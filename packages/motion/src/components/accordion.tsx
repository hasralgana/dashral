"use client"

import * as React from "react"
import { Accordion as AccordionPrimitive } from "radix-ui"
import { ChevronDownIcon } from "lucide-react"
import { animate, motion, useMotionValue, useTransform, type MotionValue } from "motion/react"
import type { AccordionItem, AccordionProps } from "@dashral/ui/components/accordion"
import { cn } from "@dashral/ui/lib/utils"

import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type { AccordionItem, AccordionProps } from "@dashral/ui/components/accordion"

/**
 * The kit's Accordion with motion: the same items, variants and props. A section opens and closes on a spring, its
 * height gliding with no overshoot, while what's inside rises a little as it fades in. The chevron turns with the
 * panel itself, as far as it has opened, so a section reversed halfway turns back from where it is; hovered, it leans
 * the way the section will go. An open section keeps following what's inside: a line added or removed, an answer swapped for a thank
 * you, and it glides to the new height. Closed sections stay out of reach of the keyboard. With reduced motion they
 * open at once.
 */
export function Accordion({ items, multiple = false, value, defaultValue, onValueChange, variant = "default", className, classNames, ...props }: AccordionProps) {
  const reduced = useReducedMotion()
  const [own, setOwn] = React.useState<string[]>(defaultValue ?? [])
  const open = value ?? own
  const change = (next: string[]) => {
    if (value === undefined) setOwn(next)
    onValueChange?.(next)
  }

  const keyOf = (item: AccordionItem, i: number) => item.value ?? String(i)
  const rows = items.map((item, i) => {
    const key = keyOf(item, i)
    return <AccordionRow key={key} value={key} item={item} open={open.includes(key)} reduced={reduced} variant={variant} classNames={classNames} />
  })

  const root = cn(variant === "separated" && "grid gap-2", className)
  // Radix takes a string for one open item and an array for several; the outside always sees an array.
  return multiple ? (
    <AccordionPrimitive.Root data-slot="accordion" type="multiple" value={open} onValueChange={change} className={root} {...props}>
      {rows}
    </AccordionPrimitive.Root>
  ) : (
    <AccordionPrimitive.Root
      data-slot="accordion"
      type="single"
      collapsible
      value={open[0] ?? ""}
      onValueChange={(next: string) => change(next ? [next] : [])}
      className={root}
      {...props}
    >
      {rows}
    </AccordionPrimitive.Root>
  )
}

/** One section: its trigger and panel, sharing how far the panel has opened so the chevron turns with it. */
function AccordionRow({
  value,
  item,
  open,
  reduced,
  variant,
  classNames,
}: {
  value: string
  item: AccordionItem
  open: boolean
  reduced: boolean
  variant: AccordionProps["variant"]
  classNames: AccordionProps["classNames"]
}) {
  // The panel's height now, and its height open: their ratio is how far it has opened.
  const height = useMotionValue<number | "auto">(open ? "auto" : 0)
  const full = useMotionValue(0)
  const turn = useTransform(() => {
    const now = height.get()
    const whole = full.get()
    if (now === "auto") return 180
    return whole ? Math.min(1, now / whole) * 180 : open ? 180 : 0
  })
  return (
    <AccordionPrimitive.Item
      value={value}
      disabled={item.disabled}
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", variant === "separated" && "rounded-lg border px-4 last:border-b", classNames?.item)}
    >
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
          data-slot="accordion-trigger"
          className={cn(
            "group/trigger flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-start text-sm font-medium transition-colors outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
            classNames?.trigger
          )}
        >
          {item.title}
          {/* Hovered, it leans the way the section will go: down to open, up to close. */}
          <span
            aria-hidden
            className={cn(
              "pointer-events-none shrink-0 translate-y-0.5 text-muted-foreground transition-[translate,color] duration-(--duration-fast) ease-standard group-hover/trigger:text-foreground motion-reduce:transition-none",
              open ? "group-hover/trigger:-translate-y-px" : "group-hover/trigger:translate-y-1"
            )}
          >
            <motion.span className="flex" style={{ rotate: turn }}>
              <ChevronDownIcon className="size-4" />
            </motion.span>
          </span>
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPanel open={open} reduced={reduced} height={height} full={full} className={classNames?.content}>
        {item.content}
      </AccordionPanel>
    </AccordionPrimitive.Item>
  )
}

/**
 * A section's body: always mounted, so closing can play out (Radix would hide it at once, so `hidden` is left to the
 * height). The height is what's inside measured, or 0 when closed, and glides to it whenever either changes.
 */
function AccordionPanel({
  open,
  reduced,
  height,
  full,
  className,
  children,
}: {
  open: boolean
  reduced: boolean
  height: MotionValue<number | "auto">
  full: MotionValue<number>
  className?: string
  children: React.ReactNode
}) {
  const inside = React.useRef<HTMLDivElement>(null)
  const target = React.useRef<number | null>(null)
  // The first height is set, not glided to, so a section open from the start doesn't grow on load.
  const settled = React.useRef(false)

  React.useEffect(() => {
    const node = inside.current
    if (!node) return
    const glide = () => {
      full.set(node.offsetHeight)
      const next = open ? node.offsetHeight : 0
      if (next === target.current) return
      target.current = next
      if (!settled.current || reduced) height.jump(next)
      else animate(height, next, spring.glide)
      settled.current = true
    }
    glide()
    const observer = new ResizeObserver(glide)
    observer.observe(node)
    return () => observer.disconnect()
  }, [full, height, reduced, open])

  return (
    <AccordionPrimitive.Content forceMount hidden={false} asChild>
      <motion.div data-slot="accordion-content" inert={!open} style={{ height }} className="overflow-hidden text-sm">
        <motion.div
          ref={inside}
          className={cn("pt-0 pb-4", className)}
          initial={false}
          animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: reduced ? 0 : -4 }}
          transition={{ duration: open ? duration.standard : duration.fast, ease: open ? ease.enter : ease.exit }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AccordionPrimitive.Content>
  )
}
