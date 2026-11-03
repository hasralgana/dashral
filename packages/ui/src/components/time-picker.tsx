"use client"

import * as React from "react"
import { CheckIcon, ClockIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldControlProps, type FieldOwnProps } from "./field"
import { Button } from "./button"
import { Input } from "./input"
import { PopoverContent, PopoverRoot, PopoverTrigger } from "./popover"

type TimePickerProps = FieldOwnProps & {
  /** The time as "HH:MM", 24-hour ("14:30"), whatever the display. Controlled; or set defaultValue. */
  value?: string
  defaultValue?: string
  onValueChange?: (time: string | undefined) => void
  /** Minutes between the times in the list. */
  step?: number
  /** The earliest and latest times offered, "HH:MM": office hours, a booking window. */
  min?: string
  max?: string
  /** 12-hour (2:30 PM) or 24-hour (14:30) display; the locale's habit when left out. */
  hour12?: boolean
  placeholder?: string
  /** BCP 47 locale for the display, e.g. "id-ID". */
  locale?: string
  disabled?: boolean
  required?: boolean
  id?: string
  /** The trigger's classes. */
  className?: string
  "aria-label"?: string
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
  classNames?: FieldClassNames & { trigger?: string; content?: string; option?: string }
}

/** "14:30" to minutes past midnight, or null when it isn't a time. */
function toMinutes(time: string | undefined) {
  const match = time?.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null
}
const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`

/** The times the list offers, from min to max every step minutes. */
function slotsFor(step: number, min?: string, max?: string) {
  const from = toMinutes(min) ?? 0
  const to = toMinutes(max) ?? 24 * 60 - 1
  const slots: string[] = []
  for (let at = from; at <= to; at += Math.max(1, step)) slots.push(toTime(at))
  return slots
}

/**
 * A time, picked from a list (every 30 minutes, or your step, between min and max) or typed exactly into the field at
 * its top. Shown the locale's way (2:30 PM or 14:30); the value is always "HH:MM", 24-hour, ready to store. Give it a
 * label, description or error and it becomes a whole field.
 */
function TimePicker(props: TimePickerProps) {
  const [field, { required: _required, ...control }] = splitFieldProps(props)
  return (
    <FieldWrapper {...field}>
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
  const { t, locale: contextLocale } = useLocale()
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

  function select(time: string | undefined) {
    setInternal(time)
    onValueChange?.(time)
    setOpen(false)
  }

  // Opening, the list starts at the picked time (or the nearest one after it), not at midnight.
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
    options[next]?.scrollIntoView({ block: "nearest" })
  }

  return (
    <PopoverRoot
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setTyped("")
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-describedby={aria["aria-describedby"]}
          aria-invalid={aria["aria-invalid"]}
          className={cn(
            "w-full justify-start font-normal tabular-nums aria-invalid:border-destructive",
            // Looks like the other fields (Input, Select), not like a button.
            "border-input bg-transparent hover:bg-transparent focus-visible:border-ring focus-visible:ring-ring/15 motion-safe:enabled:not-aria-busy:active:scale-100",
            current ? "hover:text-foreground" : "text-muted-foreground hover:text-muted-foreground",
            className,
            classNames?.trigger
          )}
        >
          <ClockIcon aria-hidden />
          {current ? show(current) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-48 p-0", classNames?.content)}
        align="start"
        onOpenAutoFocus={(event) => {
          // The list takes the focus, at the picked time, once it's laid out.
          event.preventDefault()
          requestAnimationFrame(focusCurrent)
        }}
      >
        {/* An exact time, typed: Enter picks it. */}
        <form
          className="border-b p-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (toMinutes(typed) !== null) select(typed)
          }}
        >
          <Input aria-label={t("typeTime")} format="time" placeholder="HH:MM" value={typed} onChange={(e) => setTyped(e.target.value)} className="h-8" />
        </form>
        <div ref={list} role="listbox" aria-label={ariaLabel ?? t("pickTime")} onKeyDown={onListKey} className="max-h-60 overflow-y-auto p-1">
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
                className={cn(
                  "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm tabular-nums outline-none hover:bg-accent focus-visible:bg-accent aria-selected:font-medium",
                  classNames?.option
                )}
              >
                {show(time)}
                {picked && <CheckIcon aria-hidden className="size-4" />}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </PopoverRoot>
  )
}

export { TimePicker, type TimePickerProps }
