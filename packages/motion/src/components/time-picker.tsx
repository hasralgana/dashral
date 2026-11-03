"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { ClockIcon } from "lucide-react"
import { AnimatePresence, LayoutGroup, motion } from "motion/react"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldControlProps, type FieldOwnProps } from "@dashral/ui/components/field"
import type { TimePickerProps } from "@dashral/ui/components/time-picker"
import { useLocale } from "@dashral/ui/lib/locale"
import { cn } from "@dashral/ui/lib/utils"
import { usePortalContainer } from "@dashral/ui/lib/portal"

import { useHoverPill } from "../lib/hover"
import { motionMessages } from "../lib/field"
import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"
import { Button } from "./button"
import { Input } from "./input"

export type { TimePickerProps } from "@dashral/ui/components/time-picker"

/** "14:30" to minutes past midnight, or null when it isn't a time. */
function toMinutes(time: string | undefined) {
  const match = time?.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null
}
const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`

function slotsFor(step: number, min?: string, max?: string) {
  const from = toMinutes(min) ?? 0
  const to = toMinutes(max) ?? 24 * 60 - 1
  const slots: string[] = []
  for (let at = from; at <= to; at += Math.max(1, step)) slots.push(toTime(at))
  return slots
}

/**
 * The kit's TimePicker with motion: the same step, min, max, display and field props. The list springs out of its
 * trigger with the picked time in view; one highlight glides from time to time after the pointer or the arrow keys
 * without a blink; the picked time's tick draws itself; and a new time rises into the trigger over the old. With reduced
 * motion it only fades.
 */
export function TimePicker(props: TimePickerProps) {
  const [field, { required: _required, ...control }] = splitFieldProps(props)
  return (
    <FieldWrapper {...field} renderMessages={motionMessages}>
      <TimePickerControl {...control} />
    </FieldWrapper>
  )
}

function TimePickerControl({
  value,
  defaultValue,
  onValueChange,
  step = 30,
  min,
  max,
  hour12,
  placeholder: placeholderProp,
  locale: localeProp,
  classNames,
  className,
  "aria-label": ariaLabel,
  ...rest
}: Omit<TimePickerProps, keyof FieldOwnProps | "required">) {
  const portalContainer = usePortalContainer()
  const { t, locale: contextLocale } = useLocale()
  const reduced = useReducedMotion()
  const locale = localeProp ?? contextLocale
  const placeholder = placeholderProp ?? t("pickTime")
  const { id, disabled, ...aria } = useFieldControl<FieldControlProps>({ id: rest.id, disabled: rest.disabled, "aria-invalid": rest["aria-invalid"] })
  const [open, setOpen] = React.useState(false)
  const [internal, setInternal] = React.useState<string | undefined>(defaultValue)
  const current = value === undefined && onValueChange === undefined ? internal : value
  const [typed, setTyped] = React.useState("")
  const slots = React.useMemo(() => slotsFor(step, min, max), [step, min, max])
  const format = React.useMemo(() => new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", hour12, timeZone: "UTC" }), [locale, hour12])
  const show = (time: string) => format.format(new Date(Date.UTC(2000, 0, 1, 0, toMinutes(time) ?? 0)))
  const list = React.useRef<HTMLDivElement>(null)
  const pill = useHoverPill<string>(reduced)
  const group = React.useId()

  function select(time: string | undefined) {
    setInternal(time)
    onValueChange?.(time)
    setOpen(false)
  }

  function focusCurrent() {
    const node = list.current
    if (!node) return
    const target = toMinutes(current) ?? -1
    const options = [...node.querySelectorAll<HTMLButtonElement>("[role=option]")]
    const option = options.find((el) => (toMinutes(el.dataset.value) ?? 0) >= target) ?? options[0]
    option?.scrollIntoView({ block: "center" })
    option?.focus({ preventScroll: true })
  }

  function onListKey(event: React.KeyboardEvent<HTMLDivElement>) {
    const options = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=option]")]
    const at = options.indexOf(document.activeElement as HTMLButtonElement)
    const moves: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, PageDown: 6, PageUp: -6 }
    let next = -1
    if (event.key in moves) next = Math.min(options.length - 1, Math.max(0, (at < 0 ? -1 : at) + moves[event.key]!))
    else if (event.key === "Home") next = 0
    else if (event.key === "End") next = options.length - 1
    if (next < 0) return
    event.preventDefault()
    options[next]?.focus()
    options[next]?.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" })
  }

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setTyped("")
        else pill.clear()
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-describedby={aria["aria-describedby"]}
          aria-invalid={aria["aria-invalid"]}
          className={cn(
            "w-full justify-start font-normal tabular-nums aria-invalid:border-destructive",
            "border-input bg-transparent hover:bg-transparent focus-visible:border-ring focus-visible:ring-ring/15",
            current ? "hover:text-foreground" : "text-muted-foreground hover:text-muted-foreground",
            className,
            classNames?.trigger
          )}
        >
          <ClockIcon aria-hidden />
          {/* A new time rises in over the old. */}
          <span className="relative grid overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={current ?? "none"}
                className="col-start-1 row-start-1"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, transition: { duration: duration.fast, ease: ease.exit } }}
                transition={{ duration: duration.standard, ease: ease.enter }}
              >
                {current ? show(current) : placeholder}
              </motion.span>
            </AnimatePresence>
          </span>
        </Button>
      </PopoverPrimitive.Trigger>
      <AnimatePresence>
        {open && (
          <PopoverPrimitive.Portal forceMount container={portalContainer}>
            <PopoverPrimitive.Content
              forceMount
              asChild
              align="start"
              sideOffset={4}
              collisionPadding={8}
              onOpenAutoFocus={(event) => {
                // The list takes the focus, at the picked time, once it's laid out.
                event.preventDefault()
                requestAnimationFrame(focusCurrent)
              }}
            >
              <motion.div
                className={cn("z-50 w-48 rounded-md border bg-popover text-popover-foreground shadow-md outline-hidden", classNames?.content)}
                style={{ transformOrigin: "var(--radix-popover-content-transform-origin)" }}
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -6, transition: { duration: duration.fast, ease: ease.exit } }}
                transition={reduced ? { duration: duration.fast } : { ...spring.appear, opacity: { duration: duration.fast, ease: ease.enter } }}
              >
                <form
                  className="border-b p-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (toMinutes(typed) !== null) select(typed)
                  }}
                >
                  <Input aria-label={t("typeTime")} format="time" placeholder="HH:MM" value={typed} onChange={(e) => setTyped(e.target.value)} className="h-8" />
                </form>
                <LayoutGroup id={group}>
                  {/* The list, not each time, is the stacking context: the highlight stays behind every time's text. */}
                  <div
                    ref={list}
                    role="listbox"
                    aria-label={ariaLabel ?? t("pickTime")}
                    onKeyDown={onListKey}
                    onPointerLeave={pill.leave}
                    className="relative isolate max-h-60 overflow-y-auto p-1"
                  >
                    {slots.map((time) => {
                      const picked = time === current
                      return (
                        <button
                          key={time}
                          type="button"
                          role="option"
                          aria-selected={picked}
                          data-value={time}
                          tabIndex={picked || (!current && time === slots[0]) ? 0 : -1}
                          onClick={() => select(time)}
                          onPointerEnter={() => pill.enter(time)}
                          onFocus={() => pill.enter(time)}
                          className={cn(
                            "relative flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm tabular-nums outline-none aria-selected:font-medium",
                            classNames?.option
                          )}
                        >
                          {pill.hot === time && (
                            <motion.span
                              layoutId="hot"
                              aria-hidden
                              className="absolute inset-0 -z-10 rounded-sm bg-accent"
                              style={{ opacity: pill.opacity }}
                              transition={reduced ? { duration: 0 } : spring.move}
                            />
                          )}
                          {show(time)}
                          {picked && (
                            <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
                              <motion.path
                                d="M4 12l5 5L20 6"
                                initial={reduced ? false : { pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: duration.standard, ease: ease.enter, delay: 0.1 }}
                              />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </LayoutGroup>
              </motion.div>
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        )}
      </AnimatePresence>
    </PopoverPrimitive.Root>
  )
}
