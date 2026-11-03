"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "../lib/utils"
import { ChoiceField, joinIds, type ChoiceOwnProps, type FieldClassNames } from "./field"

type ControlColor = "primary" | "neutral" | "info" | "success" | "warning" | "destructive" | "highlight"

// The track when on. Every class is written out in full so Tailwind finds it.
const trackColors: Record<ControlColor, string> = {
  primary: "data-[state=checked]:bg-primary",
  neutral: "data-[state=checked]:bg-foreground",
  info: "data-[state=checked]:bg-info",
  success: "data-[state=checked]:bg-success",
  warning: "data-[state=checked]:bg-warning",
  destructive: "data-[state=checked]:bg-destructive",
  highlight: "data-[state=checked]:bg-highlight",
}

type SwitchProps = React.ComponentProps<typeof SwitchPrimitive.Root> &
  ChoiceOwnProps & {
    /** The track's color when on. */
    color?: ControlColor
    /** "start" puts the label first and the switch at the far end, as in a settings row. */
    labelPosition?: "start" | "end"
    classNames?: FieldClassNames & { switch?: string }
  }

/** An on/off switch. Give it a label (and a description) and they sit beside it; clicking them flips it. */
function Switch({ label, description, error, id, disabled, labelPosition, color = "primary", className, classNames, ...props }: SwitchProps) {
  return (
    <ChoiceField {...{ label, description, error, id, disabled, labelPosition, classNames }} leading="leading-5">
      {(control) => (
        <SwitchControl
          {...props}
          {...control}
          color={color}
          disabled={disabled}
          aria-describedby={joinIds(props["aria-describedby"], control["aria-describedby"])}
          aria-invalid={props["aria-invalid"] ?? control["aria-invalid"]}
          className={cn(trackColors[color], className, classNames?.switch)}
        />
      )}
    </ChoiceField>
  )
}

function SwitchControl({ className, color, ...props }: Omit<React.ComponentProps<typeof SwitchPrimitive.Root>, "color"> & { color: ControlColor }) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-color={color}
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=unchecked]:bg-input",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-white ring-0 shadow-sm transition-transform duration-(--duration-standard) ease-spring data-[state=checked]:translate-x-[calc(100%)] rtl:data-[state=checked]:-translate-x-[calc(100%)] data-[state=unchecked]:translate-x-0.5 rtl:data-[state=unchecked]:-translate-x-0.5",
          // A white thumb would vanish on the light track neutral has in dark mode.
          color === "neutral" && "data-[state=checked]:bg-background"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch, type SwitchProps }
