"use client"

import * as React from "react"
import { Menubar as MenubarPrimitive } from "radix-ui"

import { cn } from "../lib/utils"
import { usePortalContainer } from "../lib/portal"
import { MenuItems, type MenuItem } from "./dropdown-menu"

type MenubarMenu = {
  /** The menu's name on the bar: "File", "Edit", "View". */
  label: React.ReactNode
  /** The same items DropdownMenu takes: icons, shortcuts, checkboxes, radio groups, labels, separators, submenus. */
  items: MenuItem[]
  disabled?: boolean
  /** The panel's classes, e.g. a width. */
  className?: string
}

type MenubarProps = Omit<React.ComponentProps<typeof MenubarPrimitive.Root>, "children"> & {
  menus: MenubarMenu[]
  /** Your router's link, for items with href. */
  linkAs?: React.ElementType
}

// The same panel as DropdownMenu's, positioned by the menubar's own variables.
const contentClass =
  "z-50 max-h-(--radix-menubar-content-available-height) min-w-[12rem] origin-(--radix-menubar-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:zoom-in-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:blur-in-[2px] data-[state=open]:duration-(--duration-standard) data-[state=open]:ease-spring data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-(--duration-fast) data-[state=closed]:ease-exit motion-reduce:blur-in-0"

/**
 * The row of menus along the top of an app, in one tag: `<Menubar menus={[{ label: "File", items: […] }]} />`. Once
 * one is open, hovering or the arrow keys move to the next, as in a desktop app. Items work as in DropdownMenu.
 */
function Menubar({ menus, linkAs, className, ...props }: MenubarProps) {
  const portalContainer = usePortalContainer()
  return (
    <MenubarPrimitive.Root
      data-slot="menubar"
      className={cn("flex h-10 w-fit items-center gap-0.5 rounded-lg border bg-card p-1 shadow-xs", className)}
      {...props}
    >
      {menus.map((menu, i) => (
        <MenubarPrimitive.Menu key={i}>
          <MenubarPrimitive.Trigger
            disabled={menu.disabled}
            className="flex h-8 items-center rounded-md px-2.5 text-sm font-medium outline-none select-none hover:bg-accent focus-visible:bg-accent data-[state=open]:bg-accent data-[state=open]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          >
            {menu.label}
          </MenubarPrimitive.Trigger>
          <MenubarPrimitive.Portal container={portalContainer}>
            <MenubarPrimitive.Content align="start" sideOffset={6} alignOffset={-4} className={cn(contentClass, menu.className)}>
              <MenuItems items={menu.items} primitives={MenubarPrimitive} linkAs={linkAs} panelClass={contentClass} />
            </MenubarPrimitive.Content>
          </MenubarPrimitive.Portal>
        </MenubarPrimitive.Menu>
      ))}
    </MenubarPrimitive.Root>
  )
}

export { Menubar, type MenubarProps, type MenubarMenu }
