"use client"

import * as React from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { cn } from "../lib/utils"
import { toggleVariants, type ToggleColor, type ToggleSize, type ToggleVariant } from "./toggle"

type ToggleGroupItem = {
  value: string
  label?: React.ReactNode
  icon?: React.ReactNode
  /** Needed when there's only an icon. */
  "aria-label"?: string
  disabled?: boolean
}

type ToggleGroupOwnProps = {
  /** The toggles: { value, label, icon, aria-label, disabled }. */
  items: ToggleGroupItem[]
  variant?: ToggleVariant
  size?: ToggleSize
  /** The tint of a pressed toggle: neutral grey (the default, as a segmented control), or a soft primary. */
  color?: ToggleColor
  /** Joined into one bar, as a toolbar's Bold / Italic / Underline; otherwise they stand apart. */
  attached?: boolean
  className?: string
  classNames?: { item?: string }
}

/** Single: one pressed at a time (alignment). Multiple: any of them (Bold, Italic, Underline). */
type ToggleGroupProps =
  | (ToggleGroupOwnProps & Omit<React.ComponentProps<typeof ToggleGroupPrimitive.Root>, "type" | "children" | "value" | "defaultValue" | "onValueChange"> & { type: "single"; value?: string; defaultValue?: string; onValueChange?: (value: string) => void })
  | (ToggleGroupOwnProps & Omit<React.ComponentProps<typeof ToggleGroupPrimitive.Root>, "type" | "children" | "value" | "defaultValue" | "onValueChange"> & { type: "multiple"; value?: string[]; defaultValue?: string[]; onValueChange?: (value: string[]) => void })

/**
 * A set of toggles in one tag: type="single" for one at a time (text alignment, a view), "multiple" for any of them
 * (Bold, Italic, Underline). attached joins them into one bar. The arrow keys move between them.
 */
function ToggleGroup({ items, variant = "ghost", size, color = "neutral", attached = false, className, classNames, ...props }: ToggleGroupProps) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn(
        "inline-flex w-fit items-center",
        attached ? (variant === "outline" ? "rounded-md border border-input shadow-xs" : "rounded-md") : "gap-1",
        className
      )}
      {...(props as React.ComponentProps<typeof ToggleGroupPrimitive.Root>)}
    >
      {items.map((item) => (
        <ToggleGroupPrimitive.Item
          key={item.value}
          value={item.value}
          disabled={item.disabled}
          aria-label={item["aria-label"]}
          data-slot="toggle-group-item"
          className={toggleVariants({
            variant: attached ? "ghost" : variant,
            size,
            color,
            className: cn(attached && "rounded-none first:rounded-s-md last:rounded-e-md", attached && variant === "outline" && "border-s border-input first:border-s-0", classNames?.item),
          })}
        >
          {item.icon}
          {item.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  )
}

export { ToggleGroup, type ToggleGroupProps, type ToggleGroupItem }
