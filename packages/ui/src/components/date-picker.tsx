"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldControlProps, type FieldOwnProps } from "./field"
import { Button } from "./button"
import { Calendar } from "./calendar"
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
  formatOptions = { dateStyle: "medium" },
  disabledDays,
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

  function select(date: Date | undefined) {
    setInternal(date)
    onValueChange?.(date)
    setOpen(false)
  }

  return (
    <PopoverRoot open={open} onOpenChange={setOpen}>
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
      </PopoverContent>
    </PopoverRoot>
  )
}

export { DatePicker }
