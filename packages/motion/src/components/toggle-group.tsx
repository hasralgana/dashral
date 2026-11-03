"use client"

import * as React from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"
import { AnimatePresence, LayoutGroup, motion } from "motion/react"
import { toggleOnFill, toggleVariants } from "@dashral/ui/components/toggle"
import type { ToggleGroupProps } from "@dashral/ui/components/toggle-group"
import { cn } from "@dashral/ui/lib/utils"

import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type { ToggleGroupProps, ToggleGroupItem } from "@dashral/ui/components/toggle-group"

/**
 * The kit's ToggleGroup with motion: the same items, types, variants and props. With type="single" the pressed one's
 * background is one element springing from toggle to toggle; with "multiple" each pops in from the middle and shrinks
 * away on its own. Toggles press in while held. With reduced motion the backgrounds only fade.
 */
export function ToggleGroup(allProps: ToggleGroupProps) {
  const { items, variant = "ghost", size, color = "neutral", attached = false, className, classNames, type, value, defaultValue, onValueChange, ...props } = allProps
  const reduced = useReducedMotion()
  const group = React.useId()
  const [own, setOwn] = React.useState<string | string[]>(defaultValue ?? (type === "multiple" ? [] : ""))
  const current = value ?? own
  const isOn = (item: string) => (Array.isArray(current) ? current.includes(item) : current === item)
  const change = (next: string | string[]) => {
    if (value === undefined) setOwn(next)
    ;(onValueChange as ((v: string | string[]) => void) | undefined)?.(next)
  }

  const root = {
    "data-slot": "toggle-group",
    className: cn(
      "isolate inline-flex w-fit items-center",
      attached ? (variant === "outline" ? "rounded-md border border-input shadow-xs" : "rounded-md") : "gap-1",
      className
    ),
    ...props,
  }

  const children = items.map((item) => {
    const on = isOn(item.value)
    return (
      <ToggleGroupPrimitive.Item key={item.value} value={item.value} disabled={item.disabled} aria-label={item["aria-label"]} data-slot="toggle-group-item" asChild>
        <motion.button
          whileTap={reduced || item.disabled ? undefined : { scale: 0.92 }}
          transition={spring.press}
          className={toggleVariants({
            variant: attached ? "ghost" : variant,
            size,
            color,
            className: cn(
              "relative data-[state=on]:bg-transparent data-[state=on]:hover:bg-transparent",
              attached && "rounded-none first:rounded-s-md last:rounded-e-md",
              attached && variant === "outline" && "border-s border-input first:border-s-0",
              classNames?.item
            ),
          })}
        >
          {type === "single" ? (
            on && (
              <motion.span
                layoutId="pressed"
                aria-hidden
                className={cn("absolute inset-0 -z-10 rounded-[inherit]", toggleOnFill[color])}
                transition={reduced ? { duration: 0 } : spring.move}
              />
            )
          ) : (
            <AnimatePresence initial={false}>
              {on && (
                <motion.span
                  key="on"
                  aria-hidden
                  className={cn("absolute inset-0 -z-10 rounded-[inherit]", toggleOnFill[color])}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, transition: { duration: duration.fast, ease: ease.exit } }}
                  transition={reduced ? { duration: duration.fast } : { ...spring.pop, opacity: { duration: duration.fast } }}
                />
              )}
            </AnimatePresence>
          )}
          {item.icon}
          {item.label}
        </motion.button>
      </ToggleGroupPrimitive.Item>
    )
  })

  return (
    <LayoutGroup id={group}>
      {type === "single" ? (
        <ToggleGroupPrimitive.Root type="single" value={current as string} onValueChange={change} {...root}>
          {children}
        </ToggleGroupPrimitive.Root>
      ) : (
        <ToggleGroupPrimitive.Root type="multiple" value={current as string[]} onValueChange={change} {...root}>
          {children}
        </ToggleGroupPrimitive.Root>
      )}
    </LayoutGroup>
  )
}
