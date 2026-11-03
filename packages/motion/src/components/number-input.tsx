"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { MinusIcon, PlusIcon } from "lucide-react"
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames } from "@dashral/ui/components/field"
import type { NumberInput as KitNumberInput } from "@dashral/ui/components/number-input"
import { useLocale } from "@dashral/ui/lib/locale"
import { usePortalContainer } from "@dashral/ui/lib/portal"
import { cn } from "@dashral/ui/lib/utils"

import { Odometer } from "../lib/odometer"
import { motionMessages } from "../lib/field"
import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type NumberInputProps = React.ComponentProps<typeof KitNumberInput> & {
  /** Drag the number sideways to change it, a step every few pixels; past a limit it pulls back like a rubber band. */
  scrub?: boolean
  /** A thin bar along the bottom of the box that shows where the value sits between min and max. Needs both. */
  meter?: boolean
  /** "Max 50" above the box's end for a moment when a step meets a limit. On by default. */
  limitHint?: boolean
  /**
   * "pill": a rounded, taller field with − and + as round buttons and no dividers, the suffix beside the number
   * ("10 seats") instead of at the far end.
   */
  variant?: "default" | "pill"
}

type FieldKeys = "label" | "description" | "error" | "labelAction" | "withAsterisk"

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

const noSubscribe = () => () => {}

/** Pressed and held, a stepper waits this long, then repeats faster and faster down to the quickest. */
const holdDelay = 400
const holdQuickest = 35
/** Held against a limit, it keeps pushing at this pace; pushes this close together count as one effort, each harder. */
const pushPace = 260
const pushWindow = 700
/** Pixels of drag per step when scrubbing. */
const scrubStep = 8

/** Past a limit, a drag gives less and less, and never more than `most` pixels (a rubber band). */
const rubber = (distance: number, most = 12) => Math.sign(distance) * most * (1 - 1 / (Math.abs(distance) / most / 2 + 1))

/** A light buzz on phones that have one, for a step or a limit felt under the thumb. */
const buzz = (pattern: number | number[]) => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern)
}

/**
 * The kit's NumberInput with motion: the same props, keys and formatting, and more. Its digits are odometer wheels:
 * each column turns as far as the number really travelled (5 to 50 spins the ones round), blurring with its speed,
 * and a column that comes or goes opens or closes its width. Hold − or + and it repeats, faster and faster. At a
 * limit the number strains toward it and springs back, harder with each push in a row, the button's icon shakes, the
 * box flashes and "Max 50" rises above it; phones buzz. `scrub` lets you drag the number, `meter` shows where it sits
 * between min and max. While you type it's a plain field. With reduced motion the number changes at once.
 */
export function NumberInput(props: NumberInputProps) {
  const [field, control] = splitFieldProps(props)
  return (
    <FieldWrapper {...field} renderMessages={motionMessages}>
      <NumberInputControl {...control} />
    </FieldWrapper>
  )
}

function NumberInputControl({ classNames: _classNames, ...controlProps }: Omit<NumberInputProps, FieldKeys> & { classNames?: FieldClassNames }) {
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
    scrub = false,
    meter = false,
    limitHint = true,
    variant = "default",
    className,
    disabled,
    onBlur,
    onKeyDown,
    ref,
    ...props
  } = useFieldControl(controlProps)
  const reduced = useReducedMotion()
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

  // The value as of the last change, for a held stepper's repeats, which outrun renders.
  const latest = React.useRef(current)
  React.useLayoutEffect(() => {
    latest.current = current
  }, [current])

  const box = React.useRef<HTMLDivElement>(null)
  const icons = { [-1]: React.useRef<HTMLSpanElement>(null), [1]: React.useRef<HTMLSpanElement>(null) } as Record<-1 | 1, React.RefObject<HTMLSpanElement | null>>
  // How far the number is pushed or pulled sideways: a strain at a limit, a rubber band while scrubbing.
  const pushX = useMotionValue(0)
  const meterPush = useMotionValue(1)
  const effort = React.useRef({ edge: 0, count: 0, at: 0 })
  const touch = React.useRef(false)
  // The note at a limit, and where the box's top end corner was when it showed (the note sits above it, outside any
  // clipping parent: a list row that folds, a scrolling panel).
  const [hint, setHint] = React.useState<{ edge: -1 | 1; top: number; side: number; rtl: boolean } | null>(null)
  // The note goes to document.body, which only exists once the page has hydrated.
  const hydrated = React.useSyncExternalStore(noSubscribe, () => true, () => false)
  // In a themed part of the page, the note opens in its container, wearing its look.
  const portalContainer = usePortalContainer()
  const hintTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  const holdTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  React.useEffect(
    () => () => {
      clearTimeout(hintTimer.current)
      clearTimeout(holdTimer.current)
    },
    []
  )

  function clamp(next: number) {
    const rounded = Number(next.toFixed(precision))
    return Math.min(max ?? Infinity, Math.max(min ?? -Infinity, rounded))
  }

  function commit(next: number | null) {
    const clamped = next === null ? null : clamp(next)
    if (value === undefined) setInternal(clamped)
    if (clamped !== latest.current) onValueChange?.(clamped)
    latest.current = clamped
    return clamped
  }

  /** A step that met a limit: the number strains that way and springs home, harder with each push in a row. */
  function strain(edge: -1 | 1) {
    const now = performance.now()
    const push = effort.current
    push.count = push.edge === edge && now - push.at < pushWindow ? push.count + 1 : 1
    push.edge = edge
    push.at = now
    if (touch.current) buzz([10, 30, 10])
    const node = box.current
    if (limitHint && node) {
      const rect = node.getBoundingClientRect()
      const rtl = getComputedStyle(node).direction === "rtl"
      setHint({ edge, top: rect.top, side: rtl ? rect.left : window.innerWidth - rect.right, rtl })
      clearTimeout(hintTimer.current)
      hintTimer.current = setTimeout(() => setHint(null), 1400)
    }
    if (node) {
      node.dataset.limit = ""
      setTimeout(() => delete node.dataset.limit, 360)
    }
    if (reduced || !node) return
    // + sits at the end, so in a right-to-left box "toward max" is to the left.
    const toward = edge * (getComputedStyle(node).direction === "rtl" ? -1 : 1)
    animate(pushX, 0, { type: "spring", stiffness: 700, damping: 16, velocity: toward * (150 + 45 * Math.min(push.count - 1, 4)) })
    animate(meterPush, [1, 2.5, 1], { duration: duration.standard, ease: ease.standard })
    const icon = icons[edge].current
    if (icon) animate(icon, { rotate: [0, -14, 11, -6, 3, 0] }, { duration: 0.36, ease: "easeOut" })
  }

  /** Goes to a value: clamped, and a value past a limit strains toward it. Returns whether the number moved. */
  function stepTo(next: number, strains = true) {
    const before = latest.current
    const after = commit(next)
    setEditing(null)
    // Past a limit, by the value as kept (0.99 + 0.01 lands on 1, not a hair past it).
    const kept = Number(next.toFixed(precision))
    const edge = max !== undefined && kept > max ? 1 : min !== undefined && kept < min ? -1 : 0
    if (edge && strains) strain(edge)
    return after !== before
  }

  function stepBy(amount: number) {
    const base = editing !== null ? read(editing) : latest.current
    return stepTo((base ?? min ?? 0) + amount)
  }

  /** What was typed, read and committed; a number past a limit is clamped to it, straining that way. */
  function commitTyped(typed: string) {
    const next = read(typed)
    if (next === null) {
      commit(null)
      setEditing(null)
    } else stepTo(next)
  }

  function stopHold() {
    clearTimeout(holdTimer.current)
    holdTimer.current = undefined
  }
  /** One step now; held, it repeats, faster each time; held against a limit, it keeps pushing on it. */
  function startHold(direction: -1 | 1) {
    stopHold()
    let count = 0
    const tick = (first: boolean) => {
      const moved = stepBy(direction * step)
      if (moved && touch.current) buzz(4)
      holdTimer.current = setTimeout(() => tick(false), first ? (moved ? holdDelay : pushPace + 120) : moved ? Math.max(holdQuickest, 150 * 0.86 ** ++count) : pushPace)
    }
    tick(true)
  }

  // Scrubbing: a drag across the number, a step every few pixels; past a limit, a rubber band.
  const drag = React.useRef<{ pointer: number; x: number; from: number; active: boolean } | null>(null)
  const [scrubbing, setScrubbing] = React.useState(false)
  function scrubMove(event: React.PointerEvent<HTMLSpanElement>) {
    const state = drag.current
    if (!state || state.pointer !== event.pointerId) return
    const dx = (event.clientX - state.x) * (getComputedStyle(event.currentTarget).direction === "rtl" ? -1 : 1)
    if (!state.active) {
      if (Math.abs(dx) < 4) return
      state.active = true
      event.currentTarget.setPointerCapture(event.pointerId)
      ;(document.activeElement as HTMLElement | null)?.blur?.()
      setScrubbing(true)
    }
    const travel = dx / scrubStep
    stepTo(state.from + Math.trunc(travel) * step, false)
    const raw = state.from + travel * step
    const over = max !== undefined && raw > max ? ((raw - max) / step) * scrubStep : min !== undefined && raw < min ? ((raw - min) / step) * scrubStep : 0
    if (!reduced) pushX.set(rubber(over))
  }
  function scrubEnd(event: React.PointerEvent<HTMLSpanElement>) {
    const state = drag.current
    if (!state || state.pointer !== event.pointerId) return
    drag.current = null
    if (!state.active) return
    setScrubbing(false)
    animate(pushX, 0, reduced ? { duration: 0 } : spring.move)
  }

  const atMin = current !== null && min !== undefined && current <= min
  const atMax = current !== null && max !== undefined && current >= max
  const text = current === null ? "" : format.format(current)
  // The wheels stand in for the input's own text until you type; they stay mounted, so they turn on commit.
  const rolling = editing === null && text !== ""
  const pill = variant === "pill"
  const stepButton = cn(
    "flex shrink-0 items-center justify-center text-muted-foreground transition-[color,background-color,opacity] outline-none hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40 aria-disabled:opacity-40",
    pill ? "size-9 rounded-full text-foreground active:bg-accent [&_svg]:size-4" : "h-full w-8 [&_svg]:size-3.5"
  )
  // In a pill the suffix sits beside the number ("10 seats"), so it rides with the wheels.
  const besideNumber = pill && suffix
  const press = reduced ? undefined : { scale: 0.85 }
  const range = meter && min !== undefined && max !== undefined && max > min ? { min, max } : null

  const stepperButton = (direction: -1 | 1) => {
    const limit = direction > 0 ? atMax : atMin
    const Icon = direction > 0 ? PlusIcon : MinusIcon
    return (
      <button
        type="button"
        tabIndex={-1}
        aria-label={t(direction > 0 ? "increase" : "decrease")}
        // At a limit it only looks off: pressed, it pushes on the limit instead of doing nothing.
        aria-disabled={limit || undefined}
        className={cn(stepButton, !pill && (direction > 0 ? "border-s" : "border-e"))}
        disabled={disabled}
        onPointerDown={(event) => {
          if (event.button !== 0) return
          event.preventDefault()
          touch.current = event.pointerType === "touch"
          startHold(direction)
        }}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        onContextMenu={(event) => event.preventDefault()}
        // A click without a pointer (a screen reader's): one step.
        onClick={(event) => event.detail === 0 && stepBy(direction * step)}
      >
        <motion.span ref={icons[direction]} className="flex" whileTap={press} transition={spring.press}>
          <Icon aria-hidden />
        </motion.span>
      </button>
    )
  }

  return (
    <div className="relative min-w-0">
      <div
        ref={box}
        data-slot="number-input"
        data-disabled={disabled || undefined}
        className={cn(
          "relative flex w-full min-w-0 items-center overflow-hidden border border-input bg-transparent shadow-xs transition-[color,box-shadow,border-color]",
          pill ? "h-11 gap-1 rounded-full px-1 text-base" : "h-9 rounded-md text-base md:text-sm",
          "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/15 has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-destructive/15",
          "data-limit:border-warning data-limit:ring-2 data-limit:ring-warning/20",
          "data-disabled:cursor-not-allowed data-disabled:opacity-50",
          className
        )}
      >
        {stepper && stepperButton(-1)}
        {prefix && <span className="ps-3 text-muted-foreground select-none">{prefix}</span>}
        <span
          className={cn("relative flex h-full min-w-0 flex-1", scrub && !disabled && "cursor-ew-resize touch-pan-y", scrubbing && "select-none")}
          onPointerDown={(event) => {
            if (!scrub || disabled || event.button !== 0) return
            drag.current = { pointer: event.pointerId, x: event.clientX, from: latest.current ?? min ?? 0, active: false }
          }}
          onPointerMove={scrubMove}
          onPointerUp={scrubEnd}
          onPointerCancel={scrubEnd}
        >
          <input
            ref={ref}
            type="text"
            inputMode={digits === 0 ? "numeric" : "decimal"}
            role="spinbutton"
            autoComplete="off"
            aria-valuenow={current ?? undefined}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuetext={current === null ? undefined : format.format(current)}
            disabled={disabled}
            className={cn(
              "h-full w-full min-w-0 bg-transparent px-3 tabular-nums caret-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed",
              prefix ? "ps-1.5" : "",
              suffix && !besideNumber ? "pe-1.5" : "",
              stepper && "text-center",
              scrub && !disabled && "cursor-[inherit] focus:cursor-text",
              rolling && "text-transparent"
            )}
            value={editing ?? text}
            onChange={(event) => setEditing(event.target.value)}
            onBlur={(event) => {
              stopHold()
              if (editing !== null) commitTyped(editing)
              setEditing(null)
              onBlur?.(event)
            }}
            onKeyDown={(event) => {
              onKeyDown?.(event)
              if (event.defaultPrevented) return
              touch.current = false
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
                // Already there, Home or End pushes on the limit like a step past it.
                stepTo(event.key === "Home" ? (atMin ? min! - step : min!) : atMax ? max! + step : max!)
              } else if (event.key === "Enter" && editing !== null) {
                commitTyped(editing)
              }
            }}
            {...props}
          />
          {text !== "" && (
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 flex items-center overflow-hidden px-3 tabular-nums",
                prefix ? "ps-1.5" : "",
                suffix && !besideNumber ? "pe-1.5" : "",
                stepper && "justify-center",
                !rolling && "invisible"
              )}
            >
              <motion.span className="flex items-baseline" style={{ x: pushX }}>
                <Odometer value={current ?? 0} format={format} />
                {besideNumber && <Unit text={suffix} reduced={reduced} />}
              </motion.span>
            </span>
          )}
        </span>
        {suffix && !besideNumber && <span className="pe-3 text-muted-foreground select-none">{suffix}</span>}
        {stepper && stepperButton(1)}
        {range && (
          <span aria-hidden className={cn("pointer-events-none absolute bottom-0 h-px origin-bottom bg-foreground/5", pill ? "inset-x-5" : "inset-x-0")}>
            <motion.span
              className="block h-full origin-bottom rounded-full bg-primary/60"
              initial={false}
              animate={{ width: `${((Math.min(range.max, Math.max(range.min, current ?? range.min)) - range.min) / (range.max - range.min)) * 100}%` }}
              transition={reduced ? { duration: 0 } : spring.move}
              style={{ scaleY: meterPush }}
            />
          </span>
        )}
      </div>
      {hydrated &&
        createPortal(
          <AnimatePresence>
            {hint && (
              <motion.span
                key={hint.edge}
                role="status"
                className="pointer-events-none fixed z-[60] -translate-y-full pb-1"
                style={{ top: hint.top, ...(hint.rtl ? { left: hint.side } : { right: hint.side }) }}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: duration.fast, ease: ease.exit } }}
                transition={reduced ? { duration: duration.fast } : spring.appear}
              >
                <span className="block rounded-md bg-foreground px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-background tabular-nums shadow-sm">
                  {t(hint.edge > 0 ? "atMax" : "atMin", { value: format.format(hint.edge > 0 ? max! : min!) })}
                </span>
              </motion.span>
            )}
          </AnimatePresence>,
          portalContainer ?? document.body
        )}
    </div>
  )
}

/** The unit beside the number in a pill; a new word ("seat" to "seats") crosses over, softly blurred. */
function Unit({ text, reduced }: { text: React.ReactNode; reduced: boolean }) {
  const key = typeof text === "string" || typeof text === "number" ? String(text) : "node"
  return (
    <span className="relative ms-1.5 inline-grid text-muted-foreground">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={key}
          className="col-start-1 row-start-1 whitespace-nowrap"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: "40%", filter: "blur(2px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, transition: { duration: 0.1, ease: ease.exit } }}
          transition={{ duration: duration.standard, ease: ease.enter }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/**
 * An amount of money with motion: the currency's symbol in front and its usual decimals, its digits on wheels as
 * NumberInput's are. Takes the same props; never goes below 0 unless you set `min`.
 */
export function MoneyInput({
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
