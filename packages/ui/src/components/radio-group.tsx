"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { cn } from "../lib/utils"
import { ChoiceField, FieldLabel, FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldOwnProps } from "./field"

type ControlColor = "primary" | "neutral" | "info" | "success" | "warning" | "destructive" | "highlight"

// The dot and border when picked. Every class is written out in full so Tailwind finds it.
const radioColors: Record<ControlColor, string> = {
  primary: "text-primary data-[state=checked]:border-primary",
  neutral: "text-foreground data-[state=checked]:border-foreground",
  info: "text-info data-[state=checked]:border-info",
  success: "text-success data-[state=checked]:border-success",
  warning: "text-warning data-[state=checked]:border-warning",
  destructive: "text-destructive data-[state=checked]:border-destructive",
  highlight: "text-highlight data-[state=checked]:border-highlight",
}

// A picked card: its border and a tint in the color.
const cardColors: Record<ControlColor, string> = {
  primary: "has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5",
  neutral: "has-[[data-state=checked]]:border-foreground has-[[data-state=checked]]:bg-foreground/5",
  info: "has-[[data-state=checked]]:border-info has-[[data-state=checked]]:bg-info/5",
  success: "has-[[data-state=checked]]:border-success has-[[data-state=checked]]:bg-success/5",
  warning: "has-[[data-state=checked]]:border-warning has-[[data-state=checked]]:bg-warning/5",
  destructive: "has-[[data-state=checked]]:border-destructive has-[[data-state=checked]]:bg-destructive/5",
  highlight: "has-[[data-state=checked]]:border-highlight has-[[data-state=checked]]:bg-highlight/5",
}

type RadioOption =
  | string
  | { value: string; label?: React.ReactNode; description?: React.ReactNode; icon?: React.ReactNode; disabled?: boolean }

type RadioGroupProps = Omit<React.ComponentProps<typeof RadioGroupPrimitive.Root>, "children"> &
  FieldOwnProps & {
    /** The radios: strings, or { value, label, description, icon, disabled }. icon shows on cards. */
    options: RadioOption[]
    /** "cards" draws each option as a bordered card you click anywhere on. */
    variant?: "default" | "cards"
    /** With cards: false hides the radio dot, and the card's border alone shows what's picked. */
    indicator?: boolean
    /** The color of the picked radio (and card). */
    color?: ControlColor
    classNames?: FieldClassNames & { group?: string; item?: string; radio?: string }
  }

/**
 * A set of radios in one tag. label names the whole group; each option can carry its own description and icon, and
 * variant="cards" turns them into cards you click anywhere on.
 */
function RadioGroup(props: RadioGroupProps) {
  const [field, control] = splitFieldProps(props)
  return (
    <FieldWrapper {...field} group>
      <RadioGroupControl {...control} />
    </FieldWrapper>
  )
}

function RadioGroupControl({
  options,
  variant = "default",
  indicator = true,
  color = "primary",
  className,
  classNames,
  ...rest
}: Omit<RadioGroupProps, keyof FieldOwnProps>) {
  const props = useFieldControl(rest)
  const groupId = React.useId()

  return (
    <RadioGroupPrimitive.Root data-slot="radio-group" className={cn("grid gap-3", className, classNames?.group)} {...props}>
      {options.map((option) => {
        const { value, label = value, description, icon, disabled } = typeof option === "string" ? { value: option } : option
        const id = `${groupId}-${value}`
        const radio = (extra?: string, describedBy?: string) => (
          <Radio
            id={id}
            value={value}
            disabled={disabled}
            aria-describedby={describedBy}
            className={cn(radioColors[color], extra, classNames?.radio)}
          />
        )

        if (variant === "cards") {
          const descriptionId = description ? `${id}-description` : undefined
          return (
            <FieldLabel
              key={value}
              htmlFor={id}
              data-slot="radio-card"
              className={cn(
                "flex items-start gap-3 rounded-lg border p-4 font-normal transition-colors hover:bg-accent/50",
                "has-focus-visible:ring-2 has-focus-visible:ring-ring/50 has-disabled:cursor-not-allowed has-disabled:opacity-50",
                cardColors[color],
                classNames?.item
              )}
            >
              {icon && <span className="flex shrink-0 text-muted-foreground [&_svg]:size-5">{icon}</span>}
              <span className="grid min-w-0 flex-1 gap-1">
                <span className="leading-4 font-medium">{label}</span>
                {description && (
                  <span id={descriptionId} className="text-xs text-muted-foreground">
                    {description}
                  </span>
                )}
              </span>
              {/* Hidden, the radio still takes focus and the arrow keys. */}
              {radio(indicator ? undefined : "sr-only", descriptionId)}
            </FieldLabel>
          )
        }

        return (
          <ChoiceField key={value} id={id} label={label} description={description} disabled={disabled} leading="leading-4" classNames={{ root: classNames?.item }}>
            {(choice) => radio(undefined, choice["aria-describedby"])}
          </ChoiceField>
        )
      })}
    </RadioGroupPrimitive.Root>
  )
}

function Radio({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "aspect-square size-4 shrink-0 rounded-full border border-input shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 in-[[aria-invalid=true]]:border-destructive",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        // The dot springs in when picked.
        className="relative flex animate-in items-center justify-center zoom-in-0 duration-(--duration-standard) ease-spring motion-reduce:animate-none"
      >
        <span className="size-2 rounded-full bg-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, type RadioGroupProps, type RadioOption }
