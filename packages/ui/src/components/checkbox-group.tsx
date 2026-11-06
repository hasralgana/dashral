"use client"

import * as React from "react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { Checkbox } from "./checkbox"
import { FieldLabel, FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldControlProps, type FieldOwnProps } from "./field"

type ControlColor = "primary" | "neutral" | "info" | "success" | "warning" | "destructive" | "highlight"

// A ticked card: its border and a tint in the color, as RadioGroup's cards.
const cardColors: Record<ControlColor, string> = {
  primary: "has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5",
  neutral: "has-[[data-state=checked]]:border-foreground has-[[data-state=checked]]:bg-foreground/5",
  info: "has-[[data-state=checked]]:border-info has-[[data-state=checked]]:bg-info/5",
  success: "has-[[data-state=checked]]:border-success has-[[data-state=checked]]:bg-success/5",
  warning: "has-[[data-state=checked]]:border-warning has-[[data-state=checked]]:bg-warning/5",
  destructive: "has-[[data-state=checked]]:border-destructive has-[[data-state=checked]]:bg-destructive/5",
  highlight: "has-[[data-state=checked]]:border-highlight has-[[data-state=checked]]:bg-highlight/5",
}

type CheckboxOption =
  | string
  | { value: string; label?: React.ReactNode; description?: React.ReactNode; icon?: React.ReactNode; disabled?: boolean }

type CheckboxGroupProps = FieldOwnProps & {
  /** The checkboxes: strings, or { value, label, description, icon, disabled }. icon shows on cards. */
  options: CheckboxOption[]
  /** The ticked values, controlled. */
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  /** "cards" draws each option as a bordered card you click anywhere on. */
  variant?: "default" | "cards"
  /** A checkbox above the rest that ticks or clears them all, half-ticked when some are. true for "Select all", or your words. */
  selectAll?: boolean | React.ReactNode
  /** At most this many: the rest are disabled once it's reached. */
  max?: number
  /** The color of a ticked checkbox (and card). */
  color?: ControlColor
  /** The form field's name: each ticked value is sent under it, as checkboxes are. */
  name?: string
  id?: string
  disabled?: boolean
  required?: boolean
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
  /** The group's classes, e.g. columns: "grid-cols-2". */
  className?: string
  classNames?: FieldClassNames & { group?: string; item?: string; checkbox?: string }
}

/**
 * A set of checkboxes in one tag, RadioGroup's companion for picking several: label names the whole group, each option
 * can carry a description and an icon, variant="cards" turns them into cards, and selectAll adds a box that ticks them
 * all. The value is the array of ticked values, in the options' order.
 */
function CheckboxGroup(props: CheckboxGroupProps) {
  const [field, control] = splitFieldProps(props)
  return (
    <FieldWrapper {...field} group>
      <CheckboxGroupControl {...control} />
    </FieldWrapper>
  )
}

function CheckboxGroupControl({
  options,
  value,
  defaultValue = [],
  onValueChange,
  variant = "default",
  selectAll,
  max,
  color = "primary",
  name,
  className,
  classNames,
  ...rest
}: Omit<CheckboxGroupProps, keyof FieldOwnProps>) {
  const { t } = useLocale()
  const { id, disabled, ...aria } = useFieldControl<FieldControlProps>({
    id: rest.id,
    disabled: rest.disabled,
    required: rest.required,
    "aria-invalid": rest["aria-invalid"],
  })
  const groupId = React.useId()
  const [internal, setInternal] = React.useState(defaultValue)
  const current = value ?? internal
  const normalized = options.map((option) => (typeof option === "string" ? { value: option } : option))
  const enabled = normalized.filter((option) => !option.disabled)
  const full = max !== undefined && current.length >= max

  function set(next: string[]) {
    // Kept in the options' order, whatever order they were ticked in.
    const ordered = normalized.map((option) => option.value).filter((v) => next.includes(v))
    if (value === undefined) setInternal(ordered)
    onValueChange?.(ordered)
  }
  const toggle = (v: string, checked: boolean) => set(checked ? [...current, v] : current.filter((x) => x !== v))

  const tickedEnabled = enabled.filter((option) => current.includes(option.value)).length
  const allState: boolean | "indeterminate" = tickedEnabled === 0 ? false : tickedEnabled === enabled.length ? true : "indeterminate"

  return (
    <div
      id={id}
      role="group"
      data-slot="checkbox-group"
      aria-labelledby={aria["aria-labelledby"]}
      aria-describedby={aria["aria-describedby"]}
      className={cn("grid gap-3", className, classNames?.group)}
    >
      {selectAll && (
        // Across the whole group, columns or not, with its line under it.
        <div className="col-span-full border-b pb-3">
          <Checkbox
            label={selectAll === true ? t("selectAll") : selectAll}
            checked={allState}
            disabled={disabled}
            color={color}
            onCheckedChange={() => {
              // Half-ticked or clear: tick them all (up to max). Ticked: clear them (the disabled ones keep their state).
              const locked = current.filter((v) => normalized.find((o) => o.value === v)?.disabled)
              const all = enabled.map((o) => o.value)
              set(allState === true ? locked : [...locked, ...(max !== undefined ? all.slice(0, Math.max(0, max - locked.length)) : all)])
            }}
          />
        </div>
      )}
      {normalized.map((option) => {
        const { value: v, label = v, description, icon } = option
        const itemId = `${groupId}-${v}`
        const checked = current.includes(v)
        const off = disabled || option.disabled || (full && !checked)
        const box = (extra?: string, describedBy?: string, withLabel = true) => (
          <Checkbox
            id={itemId}
            name={name}
            value={v}
            checked={checked}
            disabled={off}
            color={color}
            aria-invalid={aria["aria-invalid"]}
            aria-describedby={describedBy}
            onCheckedChange={(next) => toggle(v, next === true)}
            label={withLabel ? label : undefined}
            description={withLabel ? description : undefined}
            classNames={{ root: classNames?.item, checkbox: cn(extra, classNames?.checkbox) }}
          />
        )

        if (variant === "cards") {
          const descriptionId = description ? `${itemId}-description` : undefined
          return (
            <FieldLabel
              key={v}
              htmlFor={itemId}
              data-slot="checkbox-card"
              data-disabled={off || undefined}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-4 font-normal transition-colors hover:bg-accent/50",
                "has-focus-visible:ring-2 has-focus-visible:ring-ring/50 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:hover:bg-transparent",
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
              {box(undefined, descriptionId, false)}
            </FieldLabel>
          )
        }

        return <React.Fragment key={v}>{box()}</React.Fragment>
      })}
    </div>
  )
}

export { CheckboxGroup, type CheckboxGroupProps, type CheckboxOption }
