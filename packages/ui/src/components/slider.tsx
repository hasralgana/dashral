"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "../lib/utils"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldOwnProps } from "./field"

type ControlColor = "primary" | "neutral" | "info" | "success" | "warning" | "destructive" | "highlight"

// Track, filled range, and the thumb's border and halo (on hover and focus), all in the slider's color. Every class is
// written out in full so Tailwind finds it.
const colors: Record<ControlColor, { track: string; range: string; thumb: string }> = {
  primary: { track: "bg-primary/15", range: "bg-primary", thumb: "border-primary hover:ring-primary/20 focus-visible:ring-primary/30" },
  neutral: { track: "bg-foreground/10", range: "bg-foreground", thumb: "border-foreground hover:ring-foreground/15 focus-visible:ring-foreground/25" },
  info: { track: "bg-info/15", range: "bg-info", thumb: "border-info hover:ring-info/20 focus-visible:ring-info/30" },
  success: { track: "bg-success/15", range: "bg-success", thumb: "border-success hover:ring-success/20 focus-visible:ring-success/30" },
  warning: { track: "bg-warning/20", range: "bg-warning", thumb: "border-warning hover:ring-warning/25 focus-visible:ring-warning/35" },
  destructive: { track: "bg-destructive/15", range: "bg-destructive", thumb: "border-destructive hover:ring-destructive/20 focus-visible:ring-destructive/30" },
  highlight: { track: "bg-highlight/15", range: "bg-highlight", thumb: "border-highlight hover:ring-highlight/20 focus-visible:ring-highlight/30" },
}

type SliderProps = Omit<React.ComponentProps<typeof SliderPrimitive.Root>, "color"> &
  FieldOwnProps & {
    /** The filled part and the thumbs. */
    color?: ControlColor
    /** Each thumb's accessible name, e.g. ["Minimum price", "Maximum price"] for a range. */
    thumbLabels?: string[]
    classNames?: FieldClassNames & { track?: string; range?: string; thumb?: string }
  }

/** A value (or, with two values, a range) picked by dragging. Give it a label and it becomes a whole field. */
function Slider(props: SliderProps) {
  const [field, control] = splitFieldProps(props)
  return (
    <FieldWrapper {...field} group>
      <SliderControl {...control} />
    </FieldWrapper>
  )
}

function SliderControl({
  className,
  classNames,
  color = "primary",
  thumbLabels,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...rest
}: Omit<SliderProps, keyof FieldOwnProps>) {
  const { "aria-label": ariaLabel, "aria-labelledby": labelledBy, "aria-describedby": describedBy, "aria-invalid": _invalid, ...props } =
    useFieldControl(rest)
  // One thumb per value — pass two values for a range slider.
  const thumbs = React.useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min]),
    [value, defaultValue, min]
  )
  const tone = colors[color]

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5",
          tone.track,
          classNames?.track
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn("absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full", tone.range, classNames?.range)}
        />
      </SliderPrimitive.Track>
      {thumbs.map((_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          // The thumbs are what's focused, so they carry the name: thumbLabels for a range, else the label or aria-label.
          aria-label={thumbLabels?.[index] ?? (labelledBy ? undefined : ariaLabel)}
          aria-labelledby={thumbLabels?.[index] ? undefined : labelledBy}
          aria-describedby={describedBy}
          className={cn(
            "block size-4 shrink-0 rounded-full border bg-background shadow-sm transition-[color,box-shadow,scale] duration-(--duration-fast) ease-spring active:scale-115 motion-reduce:active:scale-100 hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50",
            tone.thumb,
            classNames?.thumb
          )}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider, type SliderProps }
