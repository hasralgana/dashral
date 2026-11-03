"use client"

import * as React from "react"
import { ContextMenu as ContextMenuPrimitive } from "radix-ui"

import { cn } from "../lib/utils"
import { usePortalContainer } from "../lib/portal"
import { MenuItems, type MenuItem } from "./dropdown-menu"

// A menu that opens on right-click (or a long press on touch screens, or Shift+F10 / the Menu key). Keep every action
// in it reachable another way too — a toolbar button or a "⋯" menu — since nothing shows it's there.

const contentClass =
  "z-50 max-h-(--radix-context-menu-content-available-height) min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:zoom-in-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:blur-in-[2px] data-[state=open]:duration-(--duration-standard) data-[state=open]:ease-spring data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-(--duration-fast) data-[state=closed]:ease-exit motion-reduce:blur-in-0"

type ContextMenuProps = Omit<React.ComponentProps<typeof ContextMenuPrimitive.Root>, "children"> & {
  /** The area that responds to right-click and long-press; it must take a ref. */
  children: React.ReactElement
  items: MenuItem[]
  /** Your router's link, for items with href. */
  linkAs?: React.ElementType
  /** The menu panel's classes, e.g. a width. */
  className?: string
}

/** A right-click menu over an area, in one tag: the same items as DropdownMenu. */
function ContextMenu({ children, items, linkAs, className, ...props }: ContextMenuProps) {
  const portalContainer = usePortalContainer()
  return (
    <ContextMenuPrimitive.Root data-slot="context-menu" {...props}>
      <ContextMenuPrimitive.Trigger asChild>{children}</ContextMenuPrimitive.Trigger>
      <ContextMenuPrimitive.Portal container={portalContainer}>
        <ContextMenuPrimitive.Content data-slot="context-menu-content" className={cn(contentClass, className)}>
          <MenuItems items={items} primitives={ContextMenuPrimitive} linkAs={linkAs} panelClass={contentClass} />
        </ContextMenuPrimitive.Content>
      </ContextMenuPrimitive.Portal>
    </ContextMenuPrimitive.Root>
  )
}

export { ContextMenu, type ContextMenuProps }
