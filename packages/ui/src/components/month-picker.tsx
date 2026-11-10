"use client"

import * as React from "react"
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldControlProps, type FieldOwnProps } from "./field"
import { Button } from "./button"
import { PopoverRoot, PopoverContent, PopoverTrigger } from "./popover"

type MonthPickerView = "month" | "year"

type MonthPickerProps = FieldOwnProps & {
  /** What it picks: a month of a year (the default), or a year. */
  view?: MonthPickerView
  /** Controlled value: the 1st of the month (or January 1st for a year). Omit it (and use defaultValue) for an uncontrolled picker. */
  value?: Date
  defaultValue?: Date
  /** The 1st of the month picked (or January 1st of the year), or undefined when it's cleared. */
  onValueChange?: (date: Date | undefined) => void
  placeholder?: string
  /** The earliest month (or year) that can be picked. */
  min?: Date
  /** The latest month (or year) that can be picked. */
  max?: Date
  /** BCP 47 locale for the month names and the label, e.g. "id-ID". */
  locale?: string
  /** How the button shows the value. A month and its year ("March 2026"), or the year, by default. */
  formatOptions?: Intl.DateTimeFormatOptions
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

/** A month as a number that orders: 2026 * 12 + 2 for March 2026. */
const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth()
/** Years shown at once in the year grid: the year in view sits in its third row, with the years around it. */
const PAGE = 12
const pageStart = (year: number) => year - 6

/**
 * A month (or a year) picked in a field, in one tag: `<MonthPicker label="Report month" />`. For monthly and yearly
 * reports, billing periods and card expiry, where a day picker asks for too much. The panel shows a year's months
 * (its year a button that opens the years); arrow keys move through the grid, and the value is the month's 1st.
 */
function MonthPicker(props: MonthPickerProps) {
  const [field, { required: _required, ...control }] = splitFieldProps(props)
  return (
    <FieldWrapper {...field}>
      <MonthPickerControl {...control} />
    </FieldWrapper>
  )
}

function MonthPickerControl({
  view = "month",
  value,
  defaultValue,
  onValueChange,
  placeholder: placeholderProp,
  min,
  max,
  locale: localeProp,
  formatOptions: formatOptionsProp,
  classNames,
  className,
  "aria-label": ariaLabel,
  ...rest
}: Omit<MonthPickerProps, keyof FieldOwnProps | "required">) {
  const { t, locale: contextLocale, dir } = useLocale()
  const locale = localeProp ?? contextLocale
  const placeholder = placeholderProp ?? t(view === "year" ? "pickYear" : "pickMonth")
  const { id, disabled, ...aria } = useFieldControl<FieldControlProps>({ id: rest.id, disabled: rest.disabled, "aria-invalid": rest["aria-invalid"] })
  const [open, setOpen] = React.useState(false)
  const [internal, setInternal] = React.useState<Date | undefined>(defaultValue)
  const current = value === undefined && onValueChange === undefined ? internal : value
  const formatOptions = formatOptionsProp ?? (view === "year" ? { year: "numeric" } : { month: "long", year: "numeric" })

  // What the panel shows: the months of a year, or a page of years. It opens on the value's year (or this year).
  const [panel, setPanel] = React.useState<MonthPickerView>(view)
  const [year, setYear] = React.useState(() => (current ?? new Date()).getFullYear())
  const [yearPage, setYearPage] = React.useState(() => pageStart(year))

  const today = new Date()
  const monthNames = React.useMemo(() => {
    const format = new Intl.DateTimeFormat(locale, { month: "short" })
    return Array.from({ length: 12 }, (_, month) => format.format(new Date(2000, month, 1)))
  }, [locale])
  const longMonth = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" })
  const yearFormat = new Intl.DateTimeFormat(locale, { year: "numeric" })

  const monthDisabled = (y: number, month: number) => {
    const index = y * 12 + month
    return (min !== undefined && index < monthIndex(min)) || (max !== undefined && index > monthIndex(max))
  }
  const yearDisabled = (y: number) => (min !== undefined && y < min.getFullYear()) || (max !== undefined && y > max.getFullYear())

  function commit(date: Date) {
    setInternal(date)
    onValueChange?.(date)
    setOpen(false)
  }

  function openChange(next: boolean) {
    setOpen(next)
    if (next) {
      const start = (current ?? today).getFullYear()
      setPanel(view)
      setYear(start)
      setYearPage(pageStart(start))
    }
  }

  // The grid's buttons: arrow keys move between them (left and right swap in right-to-left), Home and End to the ends.
  const grid = React.useRef<HTMLDivElement>(null)
  function onGridKey(event: React.KeyboardEvent) {
    const buttons = [...(grid.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])]
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement)
    if (at < 0) return
    const all = [...(grid.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])]
    const position = all.indexOf(buttons[at]!)
    const sideways = dir === "rtl" ? -1 : 1
    const step =
      event.key === "ArrowRight" ? sideways : event.key === "ArrowLeft" ? -sideways : event.key === "ArrowDown" ? 3 : event.key === "ArrowUp" ? -3 : 0
    let target: HTMLButtonElement | undefined
    if (step) {
      // Skip a disabled cell on the way; stop at the grid's edge.
      for (let next = position + step; next >= 0 && next < all.length; next += step) {
        if (!all[next]!.disabled) {
          target = all[next]
          break
        }
      }
    } else if (event.key === "Home") target = buttons[0]
    else if (event.key === "End") target = buttons.at(-1)
    if (!target) return
    event.preventDefault()
    target.focus()
  }

  const cell =
    "h-9 rounded-md px-2 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary"
  const Prev = dir === "rtl" ? ChevronRightIcon : ChevronLeftIcon
  const Next = dir === "rtl" ? ChevronLeftIcon : ChevronRightIcon

  const header = (label: React.ReactNode, onPrev: () => void, onNext: () => void, prevLabel: string, nextLabel: string, prevOff: boolean, nextOff: boolean) => (
    <div className="flex items-center justify-between gap-2 pb-2">
      <Button type="button" variant="ghost" size="icon-sm" aria-label={prevLabel} onClick={onPrev} disabled={prevOff}>
        <Prev aria-hidden />
      </Button>
      {label}
      <Button type="button" variant="ghost" size="icon-sm" aria-label={nextLabel} onClick={onNext} disabled={nextOff}>
        <Next aria-hidden />
      </Button>
    </div>
  )

  const selectedYear = current?.getFullYear()
  const selectedMonth = current ? monthIndex(current) : undefined

  return (
    <PopoverRoot open={open} onOpenChange={openChange}>
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
      <PopoverContent className={cn("w-64 p-3", classNames?.content)} align="start">
        {panel === "month"
          ? header(
              <Button type="button" variant="ghost" size="sm" aria-label={`${t("chooseYear")}: ${yearFormat.format(new Date(year, 0, 1))}`} onClick={() => { setYearPage(pageStart(year)); setPanel("year") }}>
                {yearFormat.format(new Date(year, 0, 1))}
              </Button>,
              () => setYear(year - 1),
              () => setYear(year + 1),
              t("previousYear"),
              t("nextYear"),
              min !== undefined && year <= min.getFullYear(),
              max !== undefined && year >= max.getFullYear()
            )
          : header(
              <span className="text-sm font-medium tabular-nums">
                {yearFormat.format(new Date(yearPage, 0, 1))} – {yearFormat.format(new Date(yearPage + PAGE - 1, 0, 1))}
              </span>,
              () => setYearPage(yearPage - PAGE),
              () => setYearPage(yearPage + PAGE),
              t("previousYears"),
              t("nextYears"),
              min !== undefined && yearPage <= min.getFullYear(),
              max !== undefined && yearPage + PAGE - 1 >= max.getFullYear()
            )}
        <div ref={grid} role="group" aria-label={panel === "month" ? yearFormat.format(new Date(year, 0, 1)) : t("chooseYear")} onKeyDown={onGridKey} className="grid grid-cols-3 gap-1">
          {panel === "month"
            ? monthNames.map((name, month) => {
                const index = year * 12 + month
                const isNow = index === monthIndex(today)
                return (
                  <button
                    key={month}
                    type="button"
                    aria-label={longMonth.format(new Date(year, month, 1))}
                    aria-pressed={index === selectedMonth}
                    aria-current={isNow ? "date" : undefined}
                    disabled={monthDisabled(year, month)}
                    // The month picked, or this month, takes the focus when the panel opens.
                    autoFocus={index === selectedMonth || (selectedMonth === undefined && isNow)}
                    onClick={() => commit(new Date(year, month, 1))}
                    className={cn(cell, isNow && "font-semibold")}
                  >
                    {name}
                  </button>
                )
              })
            : Array.from({ length: PAGE }, (_, i) => yearPage + i).map((y) => {
                const isNow = y === today.getFullYear()
                return (
                  <button
                    key={y}
                    type="button"
                    aria-pressed={view === "year" ? y === selectedYear : y === year}
                    aria-current={isNow ? "date" : undefined}
                    disabled={yearDisabled(y)}
                    autoFocus={y === (view === "year" ? (selectedYear ?? today.getFullYear()) : year)}
                    onClick={() => {
                      // Picking a year: in a year picker it's the value; in a month picker it opens that year's months.
                      if (view === "year") commit(new Date(y, 0, 1))
                      else {
                        setYear(y)
                        setPanel("month")
                      }
                    }}
                    className={cn(cell, "tabular-nums", isNow && "font-semibold")}
                  >
                    {yearFormat.format(new Date(y, 0, 1))}
                  </button>
                )
              })}
        </div>
      </PopoverContent>
    </PopoverRoot>
  )
}

export { MonthPicker, type MonthPickerProps, type MonthPickerView }
