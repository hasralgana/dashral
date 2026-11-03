"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldControlProps, type FieldOwnProps } from "./field"
import { Button } from "./button"
import { Calendar, type DateRange } from "./calendar"
import { PopoverRoot, PopoverContent, PopoverTrigger } from "./popover"

export type DateRangePreset = { label: string; range: () => DateRange }

/** Phone-sized screens (below Tailwind's sm). False while rendering on the server. */
function useNarrowScreen() {
  return React.useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(max-width: 639px)")
      query.addEventListener("change", onChange)
      return () => query.removeEventListener("change", onChange)
    },
    () => window.matchMedia("(max-width: 639px)").matches,
    () => false
  )
}

const day = (offset = 0) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offset)
  return d
}

/** Today, Yesterday, Last 7 and 30 days, This month and Last month — worked out when picked, in the browser's time zone. */
const defaultDateRangePresets = (t: ReturnType<typeof useLocale>["t"]): DateRangePreset[] => [
  { label: t("today"), range: () => ({ from: day(), to: day() }) },
  { label: t("yesterday"), range: () => ({ from: day(-1), to: day(-1) }) },
  { label: t("last7Days"), range: () => ({ from: day(-6), to: day() }) },
  { label: t("last30Days"), range: () => ({ from: day(-29), to: day() }) },
  {
    label: t("thisMonth"),
    range: () => {
      const today = day()
      return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: today }
    },
  },
  {
    label: t("lastMonth"),
    range: () => {
      const today = day()
      return { from: new Date(today.getFullYear(), today.getMonth() - 1, 1), to: new Date(today.getFullYear(), today.getMonth(), 0) }
    },
  },
]

type DateRangePickerProps = FieldOwnProps & {
  /** Controlled value. Omit it (and use defaultValue) for an uncontrolled picker. */
  value?: DateRange
  defaultValue?: DateRange
  onValueChange?: (range: DateRange | undefined) => void
  /** Shortcuts beside the calendar; `[]` hides them. */
  presets?: DateRangePreset[]
  placeholder?: string
  /** BCP 47 locale for the button label, e.g. "id-ID". */
  locale?: string
  formatOptions?: Intl.DateTimeFormatOptions
  /** Months shown side by side on wider screens; a phone always gets one. */
  numberOfMonths?: number
  /** Days that can't be picked, e.g. `{ after: new Date() }` — any DayPicker matcher. */
  disabledDays?: React.ComponentProps<typeof Calendar>["disabled"]
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

/** Pick a start and end day on a calendar, or from shortcuts like "Last 7 days". */
function DateRangePicker(props: DateRangePickerProps) {
  const [field, { required: _required, ...control }] = splitFieldProps(props)
  return (
    <FieldWrapper {...field}>
      <DateRangePickerControl {...control} />
    </FieldWrapper>
  )
}

function DateRangePickerControl({
  value,
  defaultValue,
  onValueChange,
  presets: presetsProp,
  placeholder: placeholderProp,
  locale: localeProp,
  formatOptions = { month: "short", day: "numeric", year: "numeric" },
  numberOfMonths = 2,
  disabledDays,
  classNames,
  className,
  "aria-label": ariaLabel,
  ...rest
}: Omit<DateRangePickerProps, keyof FieldOwnProps | "required">) {
  const { t, locale: contextLocale } = useLocale()
  const presets = presetsProp ?? defaultDateRangePresets(t)
  const locale = localeProp ?? contextLocale
  const placeholder = placeholderProp ?? t("pickDateRange")
  const { id, disabled, ...aria } = useFieldControl<FieldControlProps>({ id: rest.id, disabled: rest.disabled, "aria-invalid": rest["aria-invalid"] })
  const [open, setOpen] = React.useState(false)
  const narrow = useNarrowScreen()
  const [internal, setInternal] = React.useState<DateRange | undefined>(defaultValue)
  const current = value === undefined && onValueChange === undefined ? internal : value
  // Which month the calendar shows: follows a picked preset, so "Last month" opens on last month.
  const [month, setMonth] = React.useState<Date | undefined>(current?.from)

  function set(range: DateRange | undefined) {
    setInternal(range)
    onValueChange?.(range)
  }

  const format = new Intl.DateTimeFormat(locale, formatOptions)
  // Node and browsers put different spaces around the dash (thin or regular), which would make the server-rendered
  // label differ from the browser's; plain spaces everywhere.
  const plain = (text: string) => text.replace(/[\u2009\u202f\u00a0]/g, " ")
  const label = current?.from
    ? plain(current.to ? format.formatRange(current.from, current.to) : format.format(current.from))
    : placeholder

  return (
    <PopoverRoot
      open={open}
      onOpenChange={(next) => {
        if (next) setMonth(current?.from)
        setOpen(next)
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
            "w-full justify-start font-normal aria-invalid:border-destructive sm:w-auto",
            // Looks like the other fields (Input, Select), not like a button.
            "border-input bg-transparent hover:bg-transparent focus-visible:border-ring focus-visible:ring-ring/15 motion-safe:enabled:not-aria-busy:active:scale-100",
            current?.from ? "hover:text-foreground" : "text-muted-foreground hover:text-muted-foreground",
            className,
            classNames?.trigger
          )}
        >
          <CalendarIcon aria-hidden />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      {/* Never wider or taller than the screen: it keeps 8px from the edges and scrolls if it must. */}
      <PopoverContent
        className={cn(
          "flex max-h-(--radix-popover-content-available-height) w-auto max-w-[calc(100vw-1rem)] flex-col overflow-y-auto p-0 max-sm:w-[calc(100vw-1rem)] sm:flex-row",
          classNames?.content
        )}
        align="start"
        collisionPadding={8}
      >
        {presets.length > 0 && (
          // On a phone, a full-width grid of shortcuts above the calendar; beside it on wider screens.
          <div role="group" aria-label={t("shortcuts")} className="grid grid-cols-3 gap-1 border-b p-2 sm:flex sm:flex-col sm:border-e sm:border-b-0">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="shrink-0 font-normal max-sm:px-1 sm:justify-start"
                onClick={() => {
                  const range = preset.range()
                  set(range)
                  setMonth(range.from)
                  setOpen(false)
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        )}
        <Calendar
          mode="range"
          selected={current}
          onSelect={set}
          month={month}
          onMonthChange={setMonth}
          numberOfMonths={narrow ? 1 : numberOfMonths}
          // On a phone the days fill the width: seven cells across the popover, at most 3rem each.
          className="self-center max-sm:w-full max-sm:[--cell-size:min(3rem,calc((100vw-2.625rem)/7))] sm:self-auto"
          disabled={disabledDays}
          autoFocus
        />
      </PopoverContent>
    </PopoverRoot>
  )
}

export { DateRangePicker, defaultDateRangePresets }
