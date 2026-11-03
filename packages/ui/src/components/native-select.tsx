"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "../lib/utils"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldOwnProps } from "./field"

type NativeSelectOption = string | { value: string; label?: string; disabled?: boolean }
type NativeSelectOptionGroup = { label: string; options: NativeSelectOption[] }

type NativeSelectProps = Omit<React.ComponentProps<"select">, "children"> &
  FieldOwnProps & {
    /** The choices: strings, { value, label, disabled }, or groups of them ({ label, options }). */
    options: (NativeSelectOption | NativeSelectOptionGroup)[]
    /** Shown while nothing is picked, as a first option that can't be picked again. */
    placeholder?: string
    classNames?: FieldClassNames & { select?: string; icon?: string }
  }

/** A styled native <select>: fully accessible and the phone's own picker on mobile. */
function NativeSelect(props: NativeSelectProps) {
  const [field, control] = splitFieldProps(props)
  return (
    <FieldWrapper {...field}>
      <NativeSelectControl {...control} />
    </FieldWrapper>
  )
}

function renderOption(option: NativeSelectOption) {
  const { value, label = value, disabled } = typeof option === "string" ? { value: option } : option
  return (
    <option key={value} value={value} disabled={disabled} className="text-foreground">
      {label}
    </option>
  )
}

function NativeSelectControl({ options, placeholder, className, classNames, ...rest }: Omit<NativeSelectProps, keyof FieldOwnProps>) {
  const props = useFieldControl(rest)
  // A placeholder only shows while the value is empty, so start there unless a value was given.
  const defaultValue = placeholder && props.value === undefined && props.defaultValue === undefined ? "" : props.defaultValue

  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(
          "flex h-9 w-full appearance-none rounded-md border border-input bg-transparent py-1 pe-9 ps-3 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/15 md:text-sm dark:[&_option]:bg-popover",
          placeholder && "has-[option[value='']:checked]:text-muted-foreground",
          className,
          classNames?.select
        )}
        {...props}
        defaultValue={defaultValue}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) =>
          typeof option === "object" && "options" in option ? (
            <optgroup key={option.label} label={option.label}>
              {option.options.map(renderOption)}
            </optgroup>
          ) : (
            renderOption(option)
          )
        )}
      </select>
      <ChevronDownIcon
        aria-hidden
        className={cn("pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-muted-foreground", classNames?.icon)}
      />
    </div>
  )
}

export { NativeSelect, type NativeSelectProps, type NativeSelectOption, type NativeSelectOptionGroup }
