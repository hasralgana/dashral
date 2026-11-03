"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { cn } from "../lib/utils"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldOwnProps } from "./field"

type SegmentedControlOption =
  | string
  | { value: string; label?: React.ReactNode; icon?: React.ReactNode; disabled?: boolean; "aria-label"?: string }

type SegmentedControlProps = Omit<React.ComponentProps<typeof RadioGroupPrimitive.Root>, "children" | "orientation"> &
  FieldOwnProps & {
    /** The segments: strings, or { value, label, icon, disabled }. An icon-only segment needs an aria-label. */
    options: SegmentedControlOption[]
    classNames?: FieldClassNames & { group?: string; item?: string }
  }

/**
 * A row of mutually exclusive options, like a view switcher (Day / Week / Month). Behaves as a radio group: Tab moves
 * into it, the arrow keys move and select. The highlight slides to the picked option (it just appears with reduced
 * motion). For switching between panels of content, use Tabs.
 */
function SegmentedControl(props: SegmentedControlProps) {
  const [field, control] = splitFieldProps(props)
  return (
    <FieldWrapper {...field} group>
      <SegmentedControlGroup {...control} />
    </FieldWrapper>
  )
}

function SegmentedControlGroup({ options, className, classNames, ...rest }: Omit<SegmentedControlProps, keyof FieldOwnProps>) {
  const props = useFieldControl(rest)
  const ref = React.useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = React.useState<{ left: number; width: number } | null>(null)

  // Measure the checked item so the thumb can slide to it; again whenever the control resizes.
  React.useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const measure = () => {
      const item = root.querySelector<HTMLElement>("[data-slot=segmented-control-item][data-state=checked]")
      setThumb(item ? { left: item.offsetLeft, width: item.offsetWidth } : null)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    const mutations = new MutationObserver(measure)
    mutations.observe(root, { attributes: true, subtree: true, attributeFilter: ["data-state"] })
    return () => {
      observer.disconnect()
      mutations.disconnect()
    }
  }, [])

  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      data-slot="segmented-control"
      data-measured={thumb ? "" : undefined}
      orientation="horizontal"
      className={cn("relative inline-flex h-9 w-fit items-center rounded-lg bg-muted p-1 text-muted-foreground", className, classNames?.group)}
      {...props}
    >
      {thumb && (
        <span
          aria-hidden
          className="absolute inset-y-1 left-0 rounded-md bg-background shadow-sm transition-[translate,width] duration-(--duration-considered) ease-standard motion-reduce:transition-none dark:bg-input/60"
          style={{ translate: `${thumb.left}px 0`, width: thumb.width }}
        />
      )}
      {options.map((option) => {
        const { value, label, icon, disabled, "aria-label": ariaLabel } =
          typeof option === "string" ? { value: option, label: option } : option
        return (
          <SegmentedControlItem key={value} value={value} disabled={disabled} aria-label={ariaLabel} className={classNames?.item}>
            {icon}
            {label}
          </SegmentedControlItem>
        )
      })}
    </RadioGroupPrimitive.Root>
  )
}

function SegmentedControlItem({ className, children, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="segmented-control-item"
      className={cn(
        "relative z-10 inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none",
        "hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=checked]:text-foreground",
        // Until the sliding thumb is measured (server render, no JavaScript yet), the checked item draws its own.
        "not-in-data-measured:data-[state=checked]:bg-background not-in-data-measured:data-[state=checked]:shadow-sm dark:not-in-data-measured:data-[state=checked]:bg-input/60",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
    </RadioGroupPrimitive.Item>
  )
}

export { SegmentedControl, type SegmentedControlProps, type SegmentedControlOption }
