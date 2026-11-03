"use client"

import * as React from "react"
import { MinusIcon, PlusIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cssDuration, reducedMotion } from "../lib/motion"
import { cn } from "../lib/utils"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldOwnProps } from "./field"

type NumberInputControlProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "min" | "max" | "step" | "prefix"> & {
  /** Controlled value; null when empty. Omit it (and use defaultValue) for an uncontrolled field. */
  value?: number | null
  defaultValue?: number | null
  /** Called when a typed value is committed (blur or Enter) and on every step. */
  onValueChange?: (value: number | null) => void
  min?: number
  max?: number
  /** How much the arrow keys and the − / + buttons change the value. Shift and Page Up/Down change it ten times as much. */
  step?: number
  /** BCP 47 locale for formatting and for reading what's typed ("1.234,5" in id-ID), e.g. "id-ID". */
  locale?: string
  /** How the value is shown while the field isn't being edited, e.g. `{ style: "percent" }` or `{ maximumFractionDigits: 2 }`. */
  formatOptions?: Intl.NumberFormatOptions
  /** Show − and + buttons. */
  stepper?: boolean
  /** Shown inside the field before or after the number, e.g. a currency symbol or a unit. */
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

type NumberInputProps = NumberInputControlProps &
  FieldOwnProps & {
    classNames?: FieldClassNames
  }

/** The locale's decimal separator, "." or ",". */
const decimalSeparator = (locale: string) => new Intl.NumberFormat(locale).formatToParts(1.1).find((p) => p.type === "decimal")?.value ?? "."

/** Reads a number typed in the locale's format; null for nothing or something unreadable. */
function parse(text: string, locale: string) {
  const separator = decimalSeparator(locale)
  const cleaned = text.replace(new RegExp(`[^0-9\\-${separator === "." ? "\\." : ","}]`, "g"), "").replace(separator, ".")
  if (cleaned === "" || cleaned === "-") return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

/**
 * A number field, formatted for the locale. What's typed is read when you leave the field or press Enter (grouping
 * separators and symbols are ignored, so "1.234,5" works in id-ID). Arrow keys step the value, and it stays within min
 * and max. Follows the WAI-ARIA spinbutton pattern.
 */
function NumberInput(props: NumberInputProps) {
  const [field, control] = splitFieldProps(props)
  return (
    <FieldWrapper {...field}>
      <NumberInputControl {...control} />
    </FieldWrapper>
  )
}

function NumberInputControl({ classNames: _classNames, ...controlProps }: NumberInputControlProps & { classNames?: FieldClassNames }) {
  const {
    value,
    defaultValue = null,
    onValueChange,
    min,
    max,
    step = 1,
    locale: localeProp,
    formatOptions,
    stepper = true,
    prefix,
    suffix,
    className,
    disabled,
    onBlur,
    onKeyDown,
    ref,
    ...props
  } = useFieldControl(controlProps)
  const { t, locale: contextLocale } = useLocale()
  const locale = localeProp ?? contextLocale
  const [internal, setInternal] = React.useState<number | null>(defaultValue)
  const current = value === undefined ? internal : value
  const [editing, setEditing] = React.useState<string | null>(null)
  const format = React.useMemo(() => new Intl.NumberFormat(locale, formatOptions), [locale, formatOptions])
  const digits = format.resolvedOptions().maximumFractionDigits ?? 20
  // A percent shows the value × 100 (0.45 as 45%), so it reads typed text ÷ 100 and keeps two more decimals than it
  // shows; a finer step (0.005) keeps its own.
  const percent = formatOptions?.style === "percent"
  const precision = Math.min(20, Math.max(digits + (percent ? 2 : 0), (String(step).split(".")[1] ?? "").length))
  const read = (text: string) => {
    const typed = parse(text, locale)
    return typed !== null && percent ? typed / 100 : typed
  }

  function clamp(next: number) {
    const rounded = Number(next.toFixed(precision))
    return Math.min(max ?? Infinity, Math.max(min ?? -Infinity, rounded))
  }

  function commit(next: number | null) {
    const clamped = next === null ? null : clamp(next)
    if (value === undefined) setInternal(clamped)
    if (clamped !== current) onValueChange?.(clamped)
    return clamped
  }

  // The input, for the step animation, and still the ref you passed.
  const inputRef = React.useRef<HTMLInputElement>(null)
  const setRefs = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )

  /** The new number slides in from where it came: from below when it went up, from above when it went down. */
  function slide(direction: 1 | -1) {
    const input = inputRef.current
    if (!input || reducedMotion()) return
    const ease = getComputedStyle(document.documentElement).getPropertyValue("--ease-enter").trim() || "ease-out"
    input.animate([{ transform: `translateY(${direction * 55}%)`, opacity: 0 }, { transform: "none", opacity: 1 }], {
      duration: cssDuration("--duration-standard", 240),
      easing: ease,
    })
  }

  function stepTo(next: number) {
    const before = current
    const after = commit(next)
    setEditing(null)
    if (after !== null && after !== before) slide(before === null || after > before ? 1 : -1)
  }

  function stepBy(amount: number) {
    const base = editing !== null ? read(editing) : current
    stepTo((base ?? min ?? 0) + amount)
  }

  const atMin = current !== null && min !== undefined && current <= min
  const atMax = current !== null && max !== undefined && current >= max
  const stepButton = "flex h-full w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-3.5"

  return (
    <div
      data-slot="number-input"
      data-disabled={disabled || undefined}
      className={cn(
        "flex h-9 w-full min-w-0 items-center overflow-hidden rounded-md border border-input bg-transparent text-base shadow-xs transition-[color,box-shadow] md:text-sm",
        "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/15 has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-destructive/15",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
    >
      {stepper && (
        <button type="button" tabIndex={-1} aria-label={t("decrease")} className={cn(stepButton, "border-e")} disabled={disabled || atMin} onClick={() => stepBy(-step)}>
          <MinusIcon aria-hidden />
        </button>
      )}
      {prefix && <span className="ps-3 text-muted-foreground select-none">{prefix}</span>}
      <input
        ref={setRefs}
        type="text"
        inputMode={digits === 0 ? "numeric" : "decimal"}
        role="spinbutton"
        autoComplete="off"
        aria-valuenow={current ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={current === null ? undefined : format.format(current)}
        disabled={disabled}
        className={cn("h-full w-full min-w-0 bg-transparent px-3 tabular-nums outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed", prefix ? "ps-1.5" : "", suffix ? "pe-1.5" : "", stepper && "text-center")}
        value={editing ?? (current === null ? "" : format.format(current))}
        onChange={(event) => setEditing(event.target.value)}
        onBlur={(event) => {
          if (editing !== null) commit(read(editing))
          setEditing(null)
          onBlur?.(event)
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented) return
          const big = step * 10
          const moves: Record<string, number | undefined> = {
            ArrowUp: event.shiftKey ? big : step,
            ArrowDown: event.shiftKey ? -big : -step,
            PageUp: big,
            PageDown: -big,
          }
          if (event.key in moves) {
            event.preventDefault()
            stepBy(moves[event.key]!)
          } else if ((event.key === "Home" && min !== undefined) || (event.key === "End" && max !== undefined)) {
            event.preventDefault()
            stepTo(event.key === "Home" ? min! : max!)
          } else if (event.key === "Enter" && editing !== null) {
            commit(read(editing))
            setEditing(null)
          }
        }}
        {...props}
      />
      {suffix && <span className="pe-3 text-muted-foreground select-none">{suffix}</span>}
      {stepper && (
        <button type="button" tabIndex={-1} aria-label={t("increase")} className={cn(stepButton, "border-s")} disabled={disabled || atMax} onClick={() => stepBy(step)}>
          <PlusIcon aria-hidden />
        </button>
      )}
    </div>
  )
}

/**
 * An amount of money: the currency's symbol in front and its usual decimals ("Rp 25.000", "$25,000.00"). Built on
 * NumberInput, so it takes the same props; never goes below 0 unless you set `min`.
 */
function MoneyInput({
  currency,
  locale: localeProp,
  min = 0,
  step,
  ...props
}: Omit<NumberInputProps, "prefix" | "formatOptions"> & {
  /** ISO 4217 code: "USD", "IDR", "EUR", … */
  currency: string
}) {
  const { locale: contextLocale } = useLocale()
  const locale = localeProp ?? contextLocale
  const { symbol, digits } = React.useMemo(() => {
    const format = new Intl.NumberFormat(locale, { style: "currency", currency })
    return {
      symbol: format.formatToParts(0).find((p) => p.type === "currency")?.value ?? currency,
      digits: format.resolvedOptions().maximumFractionDigits ?? 2,
    }
  }, [locale, currency])
  return (
    <NumberInput
      locale={locale}
      min={min}
      step={step ?? (digits === 0 ? 1000 : 1)}
      stepper={false}
      prefix={symbol}
      formatOptions={{ minimumFractionDigits: digits, maximumFractionDigits: digits }}
      {...props}
    />
  )
}

export { NumberInput, MoneyInput }
