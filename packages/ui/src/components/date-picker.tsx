"use client"

import * as React from "react"
import { CalendarIcon, ClockIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldControlProps, type FieldOwnProps } from "./field"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Input } from "./input"
import { PopoverRoot, PopoverContent, PopoverTrigger } from "./popover"

type DatePickerProps = FieldOwnProps & {
  /** Controlled value. Omit it (and use defaultValue) for an uncontrolled picker. */
  value?: Date
  defaultValue?: Date
  onValueChange?: (date: Date | undefined) => void
  placeholder?: string
  /** BCP 47 locale for the button label, e.g. "id-ID". */
  locale?: string
  formatOptions?: Intl.DateTimeFormatOptions
  /** Days that can't be picked, e.g. `{ before: new Date() }` — any DayPicker matcher. */
  disabledDays?: React.ComponentProps<typeof Calendar>["disabled"]
  /**
   * A time too: a field for it under the calendar and a Done button. Picking a day keeps the panel open; the value is
   * the day at that time, and the label shows both.
   */
  withTime?: boolean
  /** With withTime: the time a day gets when none was set yet, "HH:MM". */
  defaultTime?: string
  /** The whole picker can't be used. */
  disabled?: boolean
  required?: boolean
  id?: string
  /** The trigger's classes. */
  className?: string
  "aria-label"?: string
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
  classNames?: FieldClassNames & { trigger?: string; content?: string }
}

function DatePicker(props: DatePickerProps) {
  const [field, { required: _required, ...control }] = splitFieldProps(props)
  return (
    <FieldWrapper {...field}>
      <DatePickerControl {...control} />
    </FieldWrapper>
  )
}

function DatePickerControl({
  value,
  defaultValue,
  onValueChange,
  placeholder: placeholderProp,
  locale: localeProp,
  formatOptions: formatOptionsProp,
  disabledDays,
  withTime = false,
  defaultTime = "09:00",
  classNames,
  className,
  "aria-label": ariaLabel,
  ...rest
}: Omit<DatePickerProps, keyof FieldOwnProps | "required">) {
  const { t, locale: contextLocale } = useLocale()
  const locale = localeProp ?? contextLocale
  const placeholder = placeholderProp ?? t("pickDate")
  const { id, disabled, ...aria } = useFieldControl<FieldControlProps>({ id: rest.id, disabled: rest.disabled, "aria-invalid": rest["aria-invalid"] })
  const [open, setOpen] = React.useState(false)
  const [internal, setInternal] = React.useState<Date | undefined>(defaultValue)
  const current = value === undefined && onValueChange === undefined ? internal : value
  const formatOptions = formatOptionsProp ?? (withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" })
  // The time field's text while it's typed: "HH:MM", 24-hour, as the value is stored.
  const timeOf = (date: Date | undefined) =>
    date ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}` : defaultTime
  const [time, setTime] = React.useState(() => timeOf(current))

  function commit(date: Date | undefined) {
    setInternal(date)
    onValueChange?.(date)
  }
  /** The day at the time in the field ("14:30"), or the day's own time when the field doesn't hold one yet. */
  function at(day: Date, hhmm: string) {
    const match = hhmm.match(/^(\d{1,2}):(\d{2})$/)
    const next = new Date(day)
    if (match && Number(match[1]) < 24 && Number(match[2]) < 60) next.setHours(Number(match[1]), Number(match[2]), 0, 0)
    return next
  }

  function select(date: Date | undefined) {
    if (withTime) {
      // The day changes; the time stays what it was (or the field's), and the panel stays open for it.
      commit(date && at(date, time))
      return
    }
    commit(date)
    setOpen(false)
  }

  return (
    <PopoverRoot
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        // Opening, the time field starts from the value's time.
        if (next) setTime(timeOf(current))
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
            "w-full justify-start font-normal aria-invalid:border-destructive",
            // Looks like the other fields (Input, Select), not like a button.
            "border-input bg-transparent hover:bg-transparent focus-visible:border-ring focus-visible:ring-ring/15 motion-safe:enabled:not-aria-busy:active:scale-100",
            current ? "hover:text-foreground" : "text-muted-foreground hover:text-muted-foreground",
            className,
            classNames?.trigger
          )}
        >
          <CalendarIcon aria-hidden />
          {current ? new Intl.DateTimeFormat(locale, formatOptions).format(current) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-auto p-0", classNames?.content)} align="start">
        <Calendar mode="single" selected={current} onSelect={select} defaultMonth={current} disabled={disabledDays} autoFocus />
        {withTime && (
          <form
            className="flex items-center gap-2 border-t p-3"
            onSubmit={(event) => {
              event.preventDefault()
              setOpen(false)
            }}
          >
            <Input
              aria-label={t("time")}
              format="time"
              placeholder="HH:MM"
              prefix={<ClockIcon />}
              value={time}
              onChange={(event) => {
                setTime(event.target.value)
                // A whole time, typed: the picked day takes it at once.
                if (current && /^\d{2}:\d{2}$/.test(event.target.value)) commit(at(current, event.target.value))
              }}
              className="h-8 w-28 tabular-nums"
            />
            <Button type="submit" size="sm" className="ms-auto">
              {t("done")}
            </Button>
          </form>
        )}
      </PopoverContent>
    </PopoverRoot>
  )
}

export { DatePicker }
