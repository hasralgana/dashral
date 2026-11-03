"use client"

import * as React from "react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"
import { ArrowUpRightIcon, ChevronRightIcon } from "lucide-react"
import { AnimatePresence, LayoutGroup, motion, type MotionValue } from "motion/react"
import type { DropdownMenuProps, MenuItem } from "@dashral/ui/components/dropdown-menu"
import { cn } from "@dashral/ui/lib/utils"
import { usePortalContainer } from "@dashral/ui/lib/portal"

import { useHoverPill } from "../lib/hover"
import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type { DropdownMenuProps, MenuItem } from "@dashral/ui/components/dropdown-menu"

// As the kit's menu items, but the highlight is this component's: a pill that glides from item to item, so the item
// itself keeps a transparent background. The panel, not each item, is the stacking context: the pill sits behind every
// item's text, so gliding down past one never covers it.
const itemClass =
  "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[variant=destructive]:text-destructive-text [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground data-[variant=destructive]:[&_svg:not([class*='text-'])]:text-destructive-text"
const indicatorItemClass =
  "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pe-2 ps-8 text-sm outline-hidden select-none focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
const panelClass =
  "isolate z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none"

// How far the panel starts back toward its trigger, by side.
const offsets = { top: { x: 0, y: 6 }, bottom: { x: 0, y: -6 }, left: { x: 6, y: 0 }, right: { x: -6, y: 0 } } as const

/** The item the pointer or keyboard is on, shared by a panel's items so one pill can glide between them. */
const HotContext = React.createContext<{
  hot: string | null
  enter: (key: string) => void
  leave: () => void
  opacity: MotionValue<number> | null
  reduced: boolean
}>({ hot: null, enter: () => {}, leave: () => {}, opacity: null, reduced: false })

/** The highlight under the item that's on: one element per panel, gliding from item to item. */
function Pill({ id, destructive }: { id: string; destructive?: boolean }) {
  const { hot, opacity, reduced } = React.useContext(HotContext)
  if (hot !== id || !opacity) return null
  return (
    <motion.span
      layoutId="hot"
      aria-hidden
      className={cn("absolute inset-0 -z-10 rounded-sm transition-colors", destructive ? "bg-destructive/10" : "bg-accent")}
      // Its opacity is the panel's, so it doesn't start from nothing at each new item.
      style={{ opacity }}
      transition={reduced ? { duration: 0 } : spring.move}
    />
  )
}

/** What an item does to be the one that's on: takes the pill on focus (pointer or keys) and gives it up on blur. */
function useHot(id: string) {
  const { enter, leave } = React.useContext(HotContext)
  return { onFocus: () => enter(id), onBlur: leave }
}

/** An item's content, rising in after the ones above it as the panel opens. */
function Rise({ index, children, className }: { index: number; children: React.ReactNode; className?: string }) {
  const { reduced } = React.useContext(HotContext)
  return (
    <motion.span
      className={cn("flex min-w-0 flex-1 items-center gap-[inherit]", className)}
      initial={reduced ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.standard, ease: ease.enter, delay: Math.min(index, 8) * 0.025 }}
    >
      {children}
    </motion.span>
  )
}

const Shortcut = ({ children }: { children: string }) => <span className="ms-auto ps-3 text-xs tracking-widest text-muted-foreground">{children}</span>

/** A tick that draws itself when checked and back out when cleared. */
function Tick({ on }: { on: boolean }) {
  const { reduced } = React.useContext(HotContext)
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
      <motion.path
        d="M4 12l5 5L20 6"
        initial={false}
        animate={reduced ? { opacity: on ? 1 : 0 } : { pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
        transition={
          on
            ? { pathLength: { duration: duration.standard, ease: ease.enter }, opacity: { duration: 0.01 } }
            : { pathLength: { duration: duration.fast, ease: ease.exit }, opacity: { duration: 0.01, delay: duration.fast } }
        }
      />
    </svg>
  )
}

/** A panel's items, with its own pill. */
function MenuPanel({ items, linkAs, prefix }: { items: MenuItem[]; linkAs?: React.ElementType; prefix: string }) {
  const reduced = useReducedMotion()
  const { hot, enter, leave, opacity } = useHoverPill<string>(reduced)
  const group = React.useId()
  return (
    <HotContext value={{ hot, enter, leave, opacity, reduced }}>
      <LayoutGroup id={group}>
        <MenuItems items={items} linkAs={linkAs} prefix={prefix} />
      </LayoutGroup>
    </HotContext>
  )
}

function MenuItems({ items, linkAs: Link = "a", prefix }: { items: MenuItem[]; linkAs?: React.ElementType; prefix: string }) {
  const P = DropdownMenuPrimitive
  return items.map((item, i) => {
    const id = `${prefix}-${i}`
    switch (item.type) {
      case "separator":
        return <P.Separator key={i} className="-mx-1 my-1 h-px bg-border" />
      case "label":
        return (
          <P.Label key={i} className={cn("px-2 py-1.5 text-sm font-medium", item.className)}>
            <Rise index={i}>{item.label}</Rise>
          </P.Label>
        )
      case "row":
        return (
          <div key={i} role="group" aria-label={item.label} className="flex justify-between px-1 py-1">
            {item.items.map((entry, j) => (
              <RowItem key={j} id={`${id}-${j}`} index={i} entry={entry} />
            ))}
          </div>
        )
      case "checkbox":
        return <CheckboxItem key={i} id={id} index={i} item={item} />
      case "radio":
        return <RadioItems key={i} id={id} index={i} item={item} />
      case "submenu":
        return <Submenu key={i} id={id} index={i} item={item} linkAs={Link} />
      default:
        return <PlainItem key={i} id={id} index={i} item={item} linkAs={Link} />
    }
  })
}

type Plain = Extract<MenuItem, { type?: "item" }>

function PlainItem({ id, index, item, linkAs: Link }: { id: string; index: number; item: Plain; linkAs: React.ElementType }) {
  const hot = useHot(id)
  const inner = (
    <Rise index={index}>
      {item.icon}
      {item.label}
      {item.shortcut && <Shortcut>{item.shortcut}</Shortcut>}
      {item.external && <ArrowUpRightIcon className="ms-auto" aria-hidden />}
    </Rise>
  )
  return (
    <DropdownMenuPrimitive.Item
      asChild={item.href !== undefined}
      disabled={item.disabled}
      data-variant={item.color ?? "default"}
      onSelect={(event) => {
        if (item.keepOpen) event.preventDefault()
        item.onSelect?.(event)
      }}
      {...hot}
      className={cn(itemClass, item.active && "font-medium", item.className)}
    >
      {item.href === undefined ? (
        <>
          <Pill id={id} destructive={item.color === "destructive"} />
          {/* The page you're on keeps a soft mark of its own, under the pill. */}
          {item.active && <span aria-hidden className="absolute inset-0 -z-20 rounded-sm bg-accent/60" />}
          {inner}
        </>
      ) : item.external ? (
        <a href={item.href} target="_blank" rel="noreferrer">
          <Pill id={id} />
          {inner}
        </a>
      ) : (
        <Link href={item.href} aria-current={item.active ? "page" : undefined}>
          <Pill id={id} />
          {item.active && <span aria-hidden className="absolute inset-0 -z-20 rounded-sm bg-accent/60" />}
          {inner}
        </Link>
      )}
    </DropdownMenuPrimitive.Item>
  )
}

type RowEntry = Extract<MenuItem, { type: "row" }>["items"][number]

function RowItem({ id, index, entry }: { id: string; index: number; entry: RowEntry }) {
  const hot = useHot(id)
  const { reduced } = React.useContext(HotContext)
  return (
    <DropdownMenuPrimitive.Item
      aria-label={entry["aria-label"]}
      disabled={entry.disabled}
      onSelect={entry.onSelect}
      {...hot}
      className={cn(itemClass, "size-8 justify-center p-0 text-lg")}
    >
      <Pill id={id} />
      {/* A reaction pops in, and grows a little under the pointer. */}
      <motion.span
        initial={reduced ? false : { opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={reduced ? undefined : { scale: 1.2 }}
        transition={{ ...spring.pop, delay: Math.min(index, 8) * 0.025 }}
      >
        {entry.label}
      </motion.span>
    </DropdownMenuPrimitive.Item>
  )
}

function CheckboxItem({ id, index, item }: { id: string; index: number; item: Extract<MenuItem, { type: "checkbox" }> }) {
  const hot = useHot(id)
  return (
    <DropdownMenuPrimitive.CheckboxItem
      checked={item.checked}
      onCheckedChange={(checked) => item.onCheckedChange(checked === true)}
      onSelect={item.closeOnSelect ? undefined : (event) => event.preventDefault()}
      disabled={item.disabled}
      {...hot}
      className={cn(indicatorItemClass, item.className)}
    >
      <Pill id={id} />
      <span className="pointer-events-none absolute start-2 flex size-3.5 items-center justify-center">
        <Tick on={item.checked} />
      </span>
      <Rise index={index}>
        {item.icon}
        {item.label}
        {item.shortcut && <Shortcut>{item.shortcut}</Shortcut>}
      </Rise>
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function RadioItems({ id, index, item }: { id: string; index: number; item: Extract<MenuItem, { type: "radio" }> }) {
  return (
    <DropdownMenuPrimitive.RadioGroup value={item.value} onValueChange={item.onValueChange}>
      {item.options.map((option, j) => (
        <RadioItem key={option.value} id={`${id}-${j}`} index={index + j} option={option} picked={item.value === option.value} />
      ))}
    </DropdownMenuPrimitive.RadioGroup>
  )
}

function RadioItem({
  id,
  index,
  option,
  picked,
}: {
  id: string
  index: number
  option: Extract<MenuItem, { type: "radio" }>["options"][number]
  picked: boolean
}) {
  const hot = useHot(id)
  const { reduced } = React.useContext(HotContext)
  return (
    <DropdownMenuPrimitive.RadioItem value={option.value} disabled={option.disabled} {...hot} className={indicatorItemClass}>
      <Pill id={id} />
      <span className="pointer-events-none absolute start-2 flex size-3.5 items-center justify-center">
        {/* The dot springs into the picked one and shrinks out of the one left. */}
        <motion.span
          className="block size-2 rounded-full bg-current"
          initial={false}
          animate={{ scale: picked ? 1 : 0, opacity: picked ? 1 : 0 }}
          transition={reduced ? { duration: 0 } : picked ? spring.pop : { duration: duration.fast, ease: ease.exit }}
        />
      </span>
      <Rise index={index}>
        {option.icon}
        {option.label}
      </Rise>
    </DropdownMenuPrimitive.RadioItem>
  )
}

function Submenu({ id, index, item, linkAs }: { id: string; index: number; item: Extract<MenuItem, { type: "submenu" }>; linkAs: React.ElementType }) {
  const portalContainer = usePortalContainer()
  const hot = useHot(id)
  const { reduced } = React.useContext(HotContext)
  return (
    <DropdownMenuPrimitive.Sub>
      <DropdownMenuPrimitive.SubTrigger disabled={item.disabled} {...hot} className={cn(itemClass, "data-[state=open]:[&>[data-open-mark]]:opacity-100")}>
        <Pill id={id} />
        {/* While its submenu is open, the trigger keeps a mark even when the pill has moved on into the submenu. */}
        <span data-open-mark aria-hidden className="absolute inset-0 -z-20 rounded-sm bg-accent opacity-0" />
        <Rise index={index}>
          {item.icon}
          {item.label}
          <ChevronRightIcon className="ms-auto rtl:-scale-x-100" />
        </Rise>
      </DropdownMenuPrimitive.SubTrigger>
      <DropdownMenuPrimitive.Portal container={portalContainer}>
        <DropdownMenuPrimitive.SubContent asChild sideOffset={2}>
          <motion.div
            className={cn(panelClass, "shadow-lg")}
            style={{ transformOrigin: "var(--radix-dropdown-menu-content-transform-origin)" }}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, x: -6 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={reduced ? { duration: duration.fast } : { ...spring.appear, opacity: { duration: duration.fast, ease: ease.enter } }}
          >
            <MenuPanel items={item.items} linkAs={linkAs} prefix={id} />
          </motion.div>
        </DropdownMenuPrimitive.SubContent>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Sub>
  )
}

/**
 * The kit's DropdownMenu with motion: the same items (plain, links, checkboxes, radios, rows, labels, separators,
 * submenus) and props. It springs out of its trigger from the side it opens on, its items rising in one after another;
 * the highlight is one pill gliding from item to item after the pointer or the arrow keys instead of jumping; a tick
 * draws itself, a radio's dot springs in, a reaction grows under the pointer, and a submenu slides out from its side.
 * It leaves quickly. With reduced motion it only fades and the highlight moves at once.
 */
export function DropdownMenu({ trigger, items, side = "bottom", align, sideOffset = 4, linkAs, onCloseAutoFocus, className, open, defaultOpen, onOpenChange, ...props }: DropdownMenuProps) {
  const portalContainer = usePortalContainer()
  const reduced = useReducedMotion()
  // Kept here, so the panel can stay on screen while it leaves.
  const [own, setOwn] = React.useState(defaultOpen ?? false)
  const isOpen = open ?? own
  const change = (next: boolean) => {
    if (open === undefined) setOwn(next)
    onOpenChange?.(next)
  }
  const from = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, ...offsets[side] }

  return (
    <DropdownMenuPrimitive.Root data-slot="dropdown-menu" open={isOpen} onOpenChange={change} {...props}>
      <DropdownMenuPrimitive.Trigger asChild>{trigger}</DropdownMenuPrimitive.Trigger>
      <AnimatePresence>
        {isOpen && (
          <DropdownMenuPrimitive.Portal forceMount container={portalContainer}>
            <DropdownMenuPrimitive.Content
              forceMount
              asChild
              side={side}
              align={align}
              sideOffset={sideOffset}
              onCloseAutoFocus={onCloseAutoFocus}
            >
              <motion.div
                data-slot="dropdown-menu-content"
                className={cn(panelClass, className)}
                // It grows from the point facing its trigger (Radix works it out).
                style={{ transformOrigin: "var(--radix-dropdown-menu-content-transform-origin)" }}
                initial={from}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={{ ...from, transition: { duration: duration.fast, ease: ease.exit } }}
                transition={reduced ? { duration: duration.fast } : { ...spring.appear, opacity: { duration: duration.fast, ease: ease.enter } }}
              >
                <MenuPanel items={items} linkAs={linkAs} prefix="m" />
              </motion.div>
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Portal>
        )}
      </AnimatePresence>
    </DropdownMenuPrimitive.Root>
  )
}
