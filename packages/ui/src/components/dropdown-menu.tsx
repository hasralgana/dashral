"use client"

import * as React from "react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"
import { ArrowUpRightIcon, CheckIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "../lib/utils"
import { usePortalContainer } from "../lib/portal"

/** One entry in a menu. A plain item is the default; the others say what they are with `type`. */
type MenuItem =
  | {
      type?: "item"
      label: React.ReactNode
      icon?: React.ReactNode
      /** The keys that do the same, shown at the end: "⌘K". */
      shortcut?: string
      /** destructive is red, for deleting. */
      color?: "default" | "destructive"
      disabled?: boolean
      onSelect?: (event: Event) => void
      /** Makes the item a link (through linkAs). */
      href?: string
      /** With href: opens in a new tab, marked with an arrow. */
      external?: boolean
      /** The page you're on: highlighted, and announced as the current page. */
      active?: boolean
      /** Keep the menu open after it's picked. */
      keepOpen?: boolean
      className?: string
    }
  | {
      type: "checkbox"
      label: React.ReactNode
      icon?: React.ReactNode
      checked: boolean
      onCheckedChange: (checked: boolean) => void
      disabled?: boolean
      shortcut?: string
      /** Close the menu once it's ticked; it stays open by default, so several can be ticked. */
      closeOnSelect?: boolean
      className?: string
    }
  | {
      type: "radio"
      value: string
      onValueChange: (value: string) => void
      options: { value: string; label: React.ReactNode; icon?: React.ReactNode; disabled?: boolean }[]
    }
  | {
      /** Small items side by side, e.g. a row of emoji reactions. Each needs an aria-label. */
      type: "row"
      /** Names the row for screen readers. */
      label: string
      items: { label: React.ReactNode; "aria-label": string; onSelect?: (event: Event) => void; disabled?: boolean }[]
    }
  | { type: "label"; label: React.ReactNode; className?: string }
  | { type: "separator" }
  | { type: "submenu"; label: React.ReactNode; icon?: React.ReactNode; items: MenuItem[]; disabled?: boolean }

const itemClass =
  "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[variant=destructive]:text-destructive-text data-[variant=destructive]:focus:bg-destructive/10 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground data-[variant=destructive]:[&_svg:not([class*='text-'])]:text-destructive-text"
const indicatorItemClass =
  "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pe-2 ps-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
const contentClass =
  "z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:zoom-in-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-(--duration-standard) data-[state=open]:ease-standard data-[side=bottom]:slide-in-from-top-[6px] data-[side=top]:slide-in-from-bottom-[6px] data-[side=left]:slide-in-from-right-[6px] data-[side=right]:slide-in-from-left-[6px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-(--duration-fast) data-[state=closed]:ease-exit"

/** The parts a Radix menu has; DropdownMenu and ContextMenu both fit. */
type MenuPrimitives = Pick<
  typeof DropdownMenuPrimitive,
  "Item" | "CheckboxItem" | "RadioGroup" | "RadioItem" | "ItemIndicator" | "Label" | "Separator" | "Sub" | "SubTrigger" | "SubContent" | "Portal"
>

const Shortcut = ({ children }: { children: string }) => (
  <span className="ms-auto text-xs tracking-widest text-muted-foreground">{children}</span>
)

/** Building block: renders menu items with a Radix menu's parts. ContextMenu uses it too. */
function MenuItems({
  items,
  primitives: P,
  linkAs: Link = "a",
  panelClass = contentClass,
}: {
  items: MenuItem[]
  primitives: MenuPrimitives
  linkAs?: React.ElementType
  /** The classes for a submenu's panel. */
  panelClass?: string
}) {
  const portalContainer = usePortalContainer()
  return items.map((item, i) => {
    switch (item.type) {
      case "separator":
        return <P.Separator key={i} className="-mx-1 my-1 h-px bg-border" />
      case "row":
        return (
          <div key={i} role="group" aria-label={item.label} className="flex justify-between px-1 py-1">
            {item.items.map((entry, j) => (
              <P.Item
                key={j}
                aria-label={entry["aria-label"]}
                disabled={entry.disabled}
                onSelect={entry.onSelect}
                className={cn(itemClass, "size-8 justify-center p-0 text-lg")}
              >
                {entry.label}
              </P.Item>
            ))}
          </div>
        )
      case "label":
        return (
          <P.Label key={i} className={cn("px-2 py-1.5 text-sm font-medium", item.className)}>
            {item.label}
          </P.Label>
        )
      case "checkbox":
        return (
          <P.CheckboxItem
            key={i}
            checked={item.checked}
            onCheckedChange={(checked) => item.onCheckedChange(checked === true)}
            onSelect={item.closeOnSelect ? undefined : (event) => event.preventDefault()}
            disabled={item.disabled}
            className={cn(indicatorItemClass, item.className)}
          >
            <span className="pointer-events-none absolute start-2 flex size-3.5 items-center justify-center">
              <P.ItemIndicator>
                <CheckIcon className="size-4" />
              </P.ItemIndicator>
            </span>
            {item.icon}
            {item.label}
            {item.shortcut && <Shortcut>{item.shortcut}</Shortcut>}
          </P.CheckboxItem>
        )
      case "radio":
        return (
          <P.RadioGroup key={i} value={item.value} onValueChange={item.onValueChange}>
            {item.options.map((option) => (
              <P.RadioItem key={option.value} value={option.value} disabled={option.disabled} className={indicatorItemClass}>
                <span className="pointer-events-none absolute start-2 flex size-3.5 items-center justify-center">
                  <P.ItemIndicator>
                    <span className="block size-2 rounded-full bg-current" />
                  </P.ItemIndicator>
                </span>
                {option.icon}
                {option.label}
              </P.RadioItem>
            ))}
          </P.RadioGroup>
        )
      case "submenu":
        return (
          <P.Sub key={i}>
            <P.SubTrigger disabled={item.disabled} className={cn(itemClass, "data-[state=open]:bg-accent")}>
              {item.icon}
              {item.label}
              <ChevronRightIcon className="ms-auto rtl:-scale-x-100" />
            </P.SubTrigger>
            <P.Portal container={portalContainer}>
              <P.SubContent className={cn(panelClass, "shadow-lg")}>
                <MenuItems items={item.items} primitives={P} linkAs={Link} panelClass={panelClass} />
              </P.SubContent>
            </P.Portal>
          </P.Sub>
        )
      default: {
        const inner = (
          <>
            {item.icon}
            {item.label}
            {item.shortcut && <Shortcut>{item.shortcut}</Shortcut>}
            {item.external && <ArrowUpRightIcon className="ms-auto" aria-hidden />}
          </>
        )
        return (
          <P.Item
            key={i}
            asChild={item.href !== undefined}
            disabled={item.disabled}
            data-variant={item.color ?? "default"}
            onSelect={(event) => {
              if (item.keepOpen) event.preventDefault()
              item.onSelect?.(event)
            }}
            className={cn(itemClass, item.active && "bg-accent font-medium", item.className)}
          >
            {item.href === undefined ? (
              inner
            ) : item.external ? (
              <a href={item.href} target="_blank" rel="noreferrer">
                {inner}
              </a>
            ) : (
              <Link href={item.href} aria-current={item.active ? "page" : undefined}>
                {inner}
              </Link>
            )}
          </P.Item>
        )
      }
    }
  })
}

type DropdownMenuProps = Omit<React.ComponentProps<typeof DropdownMenuPrimitive.Root>, "children"> & {
  /** What opens it, e.g. a button; it must take a ref and focus. */
  trigger: React.ReactElement
  items: MenuItem[]
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  /** Distance from the trigger, in pixels. */
  sideOffset?: number
  /** Your router's link, for items with href. */
  linkAs?: React.ElementType
  /** Called as the menu closes, before focus goes back to the trigger; preventDefault keeps it from going back. */
  onCloseAutoFocus?: (event: Event) => void
  /** The menu panel's classes, e.g. a width. */
  className?: string
}

/**
 * A menu that opens from a trigger, in one tag: items with icons and shortcuts, checkboxes, radio groups, labels,
 * separators and submenus.
 */
function DropdownMenu({ trigger, items, side, align, sideOffset = 4, linkAs, onCloseAutoFocus, className, ...props }: DropdownMenuProps) {
  const portalContainer = usePortalContainer()
  return (
    <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props}>
      <DropdownMenuPrimitive.Trigger asChild>{trigger}</DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal container={portalContainer}>
        <DropdownMenuPrimitive.Content
          data-slot="dropdown-menu-content"
          side={side}
          align={align}
          sideOffset={sideOffset}
          onCloseAutoFocus={onCloseAutoFocus}
          className={cn(contentClass, className)}
        >
          <MenuItems items={items} primitives={DropdownMenuPrimitive} linkAs={linkAs} />
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}

export { DropdownMenu, MenuItems, type DropdownMenuProps, type MenuItem, type MenuPrimitives }
