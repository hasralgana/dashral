"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { LayoutGroup, motion } from "motion/react"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldOwnProps } from "@dashral/ui/components/field"
import type { SegmentedControlProps } from "@dashral/ui/components/segmented-control"
import { cn } from "@dashral/ui/lib/utils"

import { useHoverPill } from "../lib/hover"
import { motionMessages } from "../lib/field"
import { useReducedMotion } from "../lib/reduced"
import { spring } from "../lib/tokens"

export type { SegmentedControlProps, SegmentedControlOption } from "@dashral/ui/components/segmented-control"

/**
 * The kit's SegmentedControl with motion: the same options, label and props. The picked option's card springs to the
 * one you pick, with a touch of overshoot to settle, and a soft highlight glides after the pointer from option to
 * option; an option presses in while held. With reduced motion the card moves at once.
 */
export function SegmentedControl(props: SegmentedControlProps) {
  const [field, control] = splitFieldProps(props)
  return (
    <FieldWrapper {...field} group renderMessages={motionMessages}>
      <SegmentedControlGroup {...control} />
    </FieldWrapper>
  )
}

function SegmentedControlGroup({ options, value, defaultValue, onValueChange, className, classNames, ...rest }: Omit<SegmentedControlProps, keyof FieldOwnProps>) {
  const props = useFieldControl(rest)
  const reduced = useReducedMotion()
  const id = React.useId()
  const first = options[0]
  const [own, setOwn] = React.useState(defaultValue ?? (typeof first === "string" ? first : first?.value) ?? "")
  const picked = value ?? own
  const hover = useHoverPill<string>(reduced)
  const move = reduced ? { duration: 0 } : spring.move

  return (
    <LayoutGroup id={id}>
      <RadioGroupPrimitive.Root
        data-slot="segmented-control"
        orientation="horizontal"
        value={picked}
        onValueChange={(next) => {
          if (value === undefined) setOwn(next)
          onValueChange?.(next)
        }}
        onPointerLeave={hover.leave}
        className={cn("relative isolate inline-flex h-9 w-fit items-center rounded-lg bg-muted p-1 text-muted-foreground", className, classNames?.group)}
        {...props}
      >
        {options.map((option) => {
          const { value: itemValue, label, icon, disabled, "aria-label": ariaLabel } =
            typeof option === "string" ? { value: option, label: option } : option
          return (
            <RadioGroupPrimitive.Item
              key={itemValue}
              value={itemValue}
              disabled={disabled}
              aria-label={ariaLabel}
              data-slot="segmented-control-item"
              onPointerEnter={() => hover.enter(itemValue)}
              asChild
            >
              <motion.button
                type="button"
                whileTap={reduced || disabled ? undefined : { scale: 0.96 }}
                transition={spring.press}
                className={cn(
                  "relative inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none",
                  "hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=checked]:text-foreground",
                  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                  classNames?.item
                )}
              >
                {/* The picked option's card: one element that springs from option to option (motion's shared layout). */}
                {picked === itemValue && (
                  <motion.span
                    layoutId="picked"
                    aria-hidden
                    transition={move}
                    className="absolute inset-0 -z-10 rounded-md bg-background shadow-sm dark:bg-input/60"
                  />
                )}
                {/* A softer one under the pointer, gliding the same way from option to option. */}
                {hover.hot === itemValue && (
                  <motion.span
                    layoutId="hovered"
                    aria-hidden
                    // Its opacity is the control's, so it doesn't start from nothing at each new option.
                    style={{ opacity: hover.opacity }}
                    transition={move}
                    className="absolute inset-0 -z-20 rounded-md bg-foreground/5"
                  />
                )}
                {icon}
                {label}
              </motion.button>
            </RadioGroupPrimitive.Item>
          )
        })}
      </RadioGroupPrimitive.Root>
    </LayoutGroup>
  )
}
