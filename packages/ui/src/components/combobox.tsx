"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { Button } from "./button"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldControlProps, type FieldOwnProps } from "./field"
import { CommandRoot, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command"
import { PopoverRoot, PopoverContent, PopoverTrigger } from "./popover"

export type ComboboxOption = {
  value: string
  label: string
  /** Before the label, in the list and in the field once picked: an icon, an avatar, a flag. */
  icon?: React.ReactNode
  /** A second line under the label, e.g. an email or a role. It's searched too. */
  description?: string
  disabled?: boolean
}

type ComboboxProps = FieldOwnProps & {
  options: ComboboxOption[]
  /** Controlled value. Omit it (and use defaultValue) for an uncontrolled combobox. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  id?: string
  disabled?: boolean
  required?: boolean
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
  /** The trigger's classes. */
  className?: string
  "aria-label"?: string
  classNames?: FieldClassNames & { trigger?: string; content?: string; item?: string }
}

/**
 * A searchable select built from Popover and Command. Selecting the current value again clears it. Give it a label,
 * description or error and it becomes a whole field.
 */
function Combobox(props: ComboboxProps) {
  const [field, { required: _required, ...control }] = splitFieldProps(props)
  return (
    <FieldWrapper {...field}>
      <ComboboxControl {...control} />
    </FieldWrapper>
  )
}

function ComboboxControl({
  options,
  value,
  defaultValue = "",
  onValueChange,
  placeholder: placeholderProp,
  searchPlaceholder: searchPlaceholderProp,
  emptyText: emptyTextProp,
  className,
  classNames,
  "aria-label": ariaLabel,
  ...rest
}: Omit<ComboboxProps, keyof FieldOwnProps | "required">) {
  const { t } = useLocale()
  const emptyText = emptyTextProp ?? t("noResults")
  const searchPlaceholder = searchPlaceholderProp ?? t("search")
  const placeholder = placeholderProp ?? t("selectOption")
  const { id, disabled, ...aria } = useFieldControl<FieldControlProps>({ id: rest.id, disabled: rest.disabled, "aria-invalid": rest["aria-invalid"] })
  const [open, setOpen] = React.useState(false)
  const [internal, setInternal] = React.useState(defaultValue)
  const current = value ?? internal
  const selected = options.find((option) => option.value === current)

  function select(next: string) {
    const newValue = next === current ? "" : next
    if (value === undefined) setInternal(newValue)
    onValueChange?.(newValue)
    setOpen(false)
  }

  return (
    <PopoverRoot open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          aria-describedby={aria["aria-describedby"]}
          aria-invalid={aria["aria-invalid"]}
          disabled={disabled}
          className={cn(
            "w-full min-w-0 justify-between font-normal aria-invalid:border-destructive",
            // Looks like the other fields (Input, Select), not like a button.
            "border-input bg-transparent hover:bg-transparent focus-visible:border-ring focus-visible:ring-ring/15 motion-safe:enabled:not-aria-busy:active:scale-100",
            selected ? "hover:text-foreground" : "text-muted-foreground hover:text-muted-foreground",
            className,
            classNames?.trigger
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            {selected?.icon}
            <span className="truncate">{selected?.label ?? placeholder}</span>
          </span>
          <ChevronsUpDownIcon className="opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-(--radix-popover-trigger-width) min-w-48 p-0", classNames?.content)} align="start">
        <CommandRoot>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  keywords={option.description ? [option.description] : undefined}
                  disabled={option.disabled}
                  onSelect={() => select(option.value)}
                  className={classNames?.item}
                >
                  <CheckIcon className={cn(option.value === current ? "opacity-100" : "opacity-0")} aria-hidden />
                  {option.icon}
                  {option.description ? (
                    <span className="grid min-w-0">
                      <span className="truncate">{option.label}</span>
                      <span className="truncate text-xs text-muted-foreground">{option.description}</span>
                    </span>
                  ) : (
                    option.label
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandRoot>
      </PopoverContent>
    </PopoverRoot>
  )
}

export { Combobox }
