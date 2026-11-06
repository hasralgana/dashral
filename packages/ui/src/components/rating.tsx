"use client"

import * as React from "react"
import { StarIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldControlProps, type FieldOwnProps } from "./field"

type ControlColor = "primary" | "neutral" | "info" | "success" | "warning" | "destructive" | "highlight"

// The filled icons. Every class is written out in full so Tailwind finds it.
const fillColors: Record<ControlColor, string> = {
  primary: "text-primary",
  neutral: "text-foreground",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  highlight: "text-highlight",
}

const sizes = { sm: "size-4", default: "size-5", lg: "size-7" }

type RatingProps = FieldOwnProps & {
  /** The rating, controlled: 0 for none. With readOnly it can be a fraction (4.5). */
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  /** How many icons. */
  max?: number
  /** Shows the value without taking input, a fraction filling part of an icon: a product's average. */
  readOnly?: boolean
  disabled?: boolean
  required?: boolean
  /** Picking the current rating again clears it. On by default. */
  clearable?: boolean
  /** The form field's name: the rating is sent as a number, nothing when it's 0. */
  name?: string
  id?: string
  /** A word for each value, lowest first ("Poor" … "Excellent"): each icon's name for screen readers, in place of "3 stars". */
  labels?: string[]
  /** With labels: the word for the hovered or picked value, beside the icons. */
  showLabel?: boolean
  /** In place of the star, e.g. a heart; it's filled in the color. */
  icon?: React.ReactElement<{ className?: string; fill?: string }>
  /** The filled icons' color. Warning (amber) by default, as stars usually are. */
  color?: ControlColor
  size?: "sm" | "default" | "lg"
  "aria-label"?: string
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
  className?: string
  classNames?: FieldClassNames & { item?: string; valueLabel?: string }
}

/**
 * A rating from 1 to max, in one tag: `<Rating label="Your rating" onValueChange={setStars} />`. Built from radio
 * buttons, so the arrow keys pick (in reading order, right to left in Arabic), a form sends it, and screen readers say
 * "4 stars, 4 of 5". Hovering previews a value. readOnly shows an average, fractions included.
 */
function Rating(props: RatingProps) {
  const [field, control] = splitFieldProps(props)
  return (
    <FieldWrapper {...field} group>
      <RatingControl {...control} />
    </FieldWrapper>
  )
}

function RatingControl({
  value,
  defaultValue = 0,
  onValueChange,
  max = 5,
  readOnly = false,
  clearable = true,
  name,
  labels,
  showLabel = false,
  icon,
  color = "warning",
  size = "default",
  className,
  classNames,
  ...rest
}: Omit<RatingProps, keyof FieldOwnProps>) {
  const { t, locale } = useLocale()
  const { id, disabled, required, ...aria } = useFieldControl<FieldControlProps>({
    id: rest.id,
    disabled: rest.disabled,
    required: rest.required,
    "aria-invalid": rest["aria-invalid"],
  })
  const generatedName = React.useId()
  const [internal, setInternal] = React.useState(defaultValue)
  const [hover, setHover] = React.useState<number | null>(null)
  const current = value ?? internal
  const shown = hover ?? current
  const sizeClass = sizes[size]
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const ratingOf = t("ratingOf", { value: number.format(current), max })

  function set(next: number) {
    if (value === undefined) setInternal(next)
    onValueChange?.(next)
  }

  const draw = (fill: boolean) => {
    const element = icon ?? <StarIcon />
    return React.cloneElement(element, {
      className: cn(sizeClass, "shrink-0", fill ? fillColors[color] : "text-foreground/15", element.props.className),
      fill: "currentColor",
    })
  }

  if (readOnly) {
    return (
      <div
        id={id}
        role="img"
        data-slot="rating"
        aria-label={rest["aria-label"] ?? ratingOf}
        aria-describedby={aria["aria-describedby"]}
        className={cn("inline-flex items-center gap-0.5", className)}
      >
        {Array.from({ length: max }, (_, i) => {
          // How much of this icon is filled: all, none, or the fraction's share (from the start, so the right in Arabic).
          const share = Math.min(1, Math.max(0, current - i))
          return (
            <span key={i} aria-hidden className={cn("relative inline-flex", classNames?.item)}>
              {draw(false)}
              {share > 0 && (
                <span className="absolute inset-y-0 start-0 overflow-hidden" style={{ width: `${share * 100}%` }}>
                  {draw(true)}
                </span>
              )}
            </span>
          )
        })}
      </div>
    )
  }

  const word = labels && shown > 0 ? labels[shown - 1] : undefined

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <div
        id={id}
        role="radiogroup"
        data-slot="rating"
        aria-label={rest["aria-label"] ?? (aria["aria-labelledby"] ? undefined : t("rating"))}
        aria-labelledby={aria["aria-labelledby"]}
        aria-describedby={aria["aria-describedby"]}
        aria-invalid={aria["aria-invalid"]}
        aria-required={required || undefined}
        aria-disabled={disabled || undefined}
        onPointerLeave={() => setHover(null)}
        className={cn("inline-flex items-center", disabled && "opacity-50")}
      >
        {Array.from({ length: max }, (_, i) => {
          const n = i + 1
          return (
            <label
              key={n}
              onPointerEnter={() => !disabled && setHover(n)}
              className={cn(
                "relative inline-flex cursor-pointer rounded-sm p-0.5 transition-transform duration-(--duration-fast) ease-spring motion-safe:hover:scale-110",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50",
                disabled && "pointer-events-none cursor-not-allowed",
                classNames?.item
              )}
            >
              <input
                type="radio"
                name={name ?? generatedName}
                value={n}
                checked={current === n}
                disabled={disabled}
                required={required && n === 1}
                aria-label={labels?.[i] ?? t("ratingStars", { count: n })}
                className="peer sr-only"
                onChange={() => set(n)}
                // Picking the checked one again doesn't fire change, only click: that's the moment to clear.
                onClick={() => {
                  if (clearable && current === n) set(0)
                }}
              />
              {draw(n <= shown)}
            </label>
          )
        })}
      </div>
      {showLabel && labels && (
        <span aria-hidden className={cn("min-w-16 text-sm text-muted-foreground", classNames?.valueLabel)}>
          {word}
        </span>
      )}
    </div>
  )
}

export { Rating, type RatingProps }
