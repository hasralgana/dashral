"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { CheckIcon, MinusIcon } from "lucide-react"

import { cn } from "../lib/utils"
import { ChoiceField, joinIds, type ChoiceOwnProps, type FieldClassNames } from "./field"

type ControlColor = "primary" | "neutral" | "info" | "success" | "warning" | "destructive" | "highlight"

// Ticked: filled with the color. Every class is written out in full so Tailwind finds it.
const solidColors: Record<ControlColor, string> = {
  primary: "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
  neutral: "data-[state=checked]:border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background data-[state=indeterminate]:border-foreground data-[state=indeterminate]:bg-foreground data-[state=indeterminate]:text-background",
  info: "data-[state=checked]:border-info data-[state=checked]:bg-info data-[state=checked]:text-info-foreground data-[state=indeterminate]:border-info data-[state=indeterminate]:bg-info data-[state=indeterminate]:text-info-foreground",
  success: "data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=checked]:text-success-foreground data-[state=indeterminate]:border-success data-[state=indeterminate]:bg-success data-[state=indeterminate]:text-success-foreground",
  warning: "data-[state=checked]:border-warning data-[state=checked]:bg-warning data-[state=checked]:text-warning-foreground data-[state=indeterminate]:border-warning data-[state=indeterminate]:bg-warning data-[state=indeterminate]:text-warning-foreground",
  destructive: "data-[state=checked]:border-destructive data-[state=checked]:bg-destructive data-[state=checked]:text-destructive-foreground data-[state=indeterminate]:border-destructive data-[state=indeterminate]:bg-destructive data-[state=indeterminate]:text-destructive-foreground",
  highlight: "data-[state=checked]:border-highlight data-[state=checked]:bg-highlight data-[state=checked]:text-highlight-foreground data-[state=indeterminate]:border-highlight data-[state=indeterminate]:bg-highlight data-[state=indeterminate]:text-highlight-foreground",
}

// Ticked: a colored border and mark, no fill. Every class is written out in full so Tailwind finds it.
const outlineColors: Record<ControlColor, string> = {
  primary: "data-[state=checked]:border-primary data-[state=checked]:text-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-primary",
  neutral: "data-[state=checked]:border-foreground data-[state=checked]:text-foreground data-[state=indeterminate]:border-foreground data-[state=indeterminate]:text-foreground",
  info: "data-[state=checked]:border-info data-[state=checked]:text-info data-[state=indeterminate]:border-info data-[state=indeterminate]:text-info",
  success: "data-[state=checked]:border-success data-[state=checked]:text-success data-[state=indeterminate]:border-success data-[state=indeterminate]:text-success",
  warning: "data-[state=checked]:border-warning data-[state=checked]:text-warning data-[state=indeterminate]:border-warning data-[state=indeterminate]:text-warning",
  destructive: "data-[state=checked]:border-destructive data-[state=checked]:text-destructive data-[state=indeterminate]:border-destructive data-[state=indeterminate]:text-destructive",
  highlight: "data-[state=checked]:border-highlight data-[state=checked]:text-highlight data-[state=indeterminate]:border-highlight data-[state=indeterminate]:text-highlight",
}

type CheckboxProps = React.ComponentProps<typeof CheckboxPrimitive.Root> &
  ChoiceOwnProps & {
    /** The color when ticked. */
    color?: ControlColor
    /** solid fills the box when ticked; outline colors only its border and mark. */
    variant?: "solid" | "outline"
    /** "start" puts the label first and the checkbox at the far end, as in a settings row. */
    labelPosition?: "start" | "end"
    classNames?: FieldClassNames & { checkbox?: string }
  }

/** A checkbox. Give it a label (and a description) and they sit beside it; clicking them ticks it. */
function Checkbox({ label, description, error, id, disabled, labelPosition, color = "primary", variant = "solid", className, classNames, ...props }: CheckboxProps) {
  return (
    <ChoiceField {...{ label, description, error, id, disabled, labelPosition, classNames }} leading="leading-4">
      {(control) => (
        <CheckboxControl
          {...props}
          {...control}
          disabled={disabled}
          aria-describedby={joinIds(props["aria-describedby"], control["aria-describedby"])}
          aria-invalid={props["aria-invalid"] ?? control["aria-invalid"]}
          className={cn((variant === "outline" ? outlineColors : solidColors)[color], className, classNames?.checkbox)}
        />
      )}
    </ChoiceField>
  )
}

function CheckboxControl({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer group size-4 shrink-0 rounded-[4px] border border-input shadow-xs transition-[color,background-color,border-color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        // The mark springs in when checked (Radix mounts the indicator then).
        className="flex animate-in items-center justify-center text-current zoom-in-50 fade-in-0 duration-(--duration-standard) ease-spring motion-reduce:animate-none"
      >
        <CheckIcon className="size-3.5 group-data-[state=indeterminate]:hidden" />
        <MinusIcon className="hidden size-3.5 group-data-[state=indeterminate]:block" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox, type CheckboxProps, type ControlColor }
