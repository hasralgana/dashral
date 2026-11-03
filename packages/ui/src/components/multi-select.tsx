"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldControlProps, type FieldOwnProps } from "./field"
import { CommandRoot, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "./command"
import { PopoverRoot, PopoverAnchor, PopoverContent, PopoverTrigger } from "./popover"

export type MultiSelectOption = { value: string; label: string; disabled?: boolean }

type MultiSelectProps = FieldOwnProps & {
  options: MultiSelectOption[]
  /** Controlled value. Omit it (and use defaultValue) for an uncontrolled select. */
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  /** Chips shown before the rest collapse into "+3". */
  maxShown?: number
  /** At most this many can be picked; the rest of the list is disabled once it's reached. */
  maxSelected?: number
  id?: string
  disabled?: boolean
  required?: boolean
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
  /** The box's classes. */
  className?: string
  "aria-label"?: string
  classNames?: FieldClassNames & { box?: string; content?: string; item?: string }
}

/**
 * Pick several options from a searchable list. Picked ones show as chips you can remove one by one; Backspace on the
 * field removes the last. Built from Popover and Command, like Combobox.
 */
function MultiSelect(props: MultiSelectProps) {
  const [field, { required: _required, ...control }] = splitFieldProps(props)
  return (
    <FieldWrapper {...field}>
      <MultiSelectControl {...control} />
    </FieldWrapper>
  )
}

function MultiSelectControl({
  options,
  value,
  defaultValue = [],
  onValueChange,
  placeholder: placeholderProp,
  searchPlaceholder: searchPlaceholderProp,
  emptyText: emptyTextProp,
  maxShown = 3,
  maxSelected,
  className,
  classNames,
  "aria-label": ariaLabel,
  ...rest
}: Omit<MultiSelectProps, keyof FieldOwnProps | "required">) {
  const { t } = useLocale()
  const emptyText = emptyTextProp ?? t("noResults")
  const searchPlaceholder = searchPlaceholderProp ?? t("search")
  const placeholder = placeholderProp ?? t("selectOptions")
  const { id, disabled, ...aria } = useFieldControl<FieldControlProps>({ id: rest.id, disabled: rest.disabled, "aria-invalid": rest["aria-invalid"] })
  const [open, setOpen] = React.useState(false)
  const [internal, setInternal] = React.useState(defaultValue)
  const current = value ?? internal
  const selected = current.map((v) => options.find((o) => o.value === v)).filter((o) => o !== undefined)
  const full = maxSelected !== undefined && current.length >= maxSelected

  function set(next: string[]) {
    if (value === undefined) setInternal(next)
    onValueChange?.(next)
  }
  const toggle = (v: string) => set(current.includes(v) ? current.filter((x) => x !== v) : [...current, v])

  return (
    <PopoverRoot open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          data-slot="multi-select"
          data-disabled={disabled || undefined}
          className={cn(
            "flex min-h-9 w-full items-center gap-1 rounded-md border border-input bg-transparent py-1 pe-1 ps-1.5 text-sm shadow-xs transition-[color,box-shadow]",
            "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/15 data-disabled:pointer-events-none data-disabled:opacity-50",
            "has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-destructive/15",
            className,
            classNames?.box
          )}
        >
          {selected.length > 0 && (
            <ul aria-label={t("selected")} className="flex flex-wrap items-center gap-1">
              {selected.slice(0, maxShown).map((option) => (
                <li key={option.value} className="inline-flex h-6 items-center gap-0.5 rounded bg-secondary pe-0.5 ps-2 text-xs font-medium text-secondary-foreground">
                  {option.label}
                  <button
                    type="button"
                    aria-label={t("remove", { name: String(option.label) })}
                    className="flex size-5 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-background/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/15"
                    onClick={() => toggle(option.value)}
                  >
                    <XIcon className="size-3" aria-hidden />
                  </button>
                </li>
              ))}
              {selected.length > maxShown && (
                <li className="px-1 text-xs text-muted-foreground tabular-nums">+{selected.length - maxShown}</li>
              )}
            </ul>
          )}
          <PopoverTrigger asChild>
            <button
              type="button"
              id={id}
              role="combobox"
              aria-expanded={open}
              aria-label={ariaLabel}
              aria-describedby={aria["aria-describedby"]}
              aria-invalid={aria["aria-invalid"]}
              disabled={disabled}
              className="flex h-7 min-w-16 flex-1 items-center justify-between gap-2 rounded-sm px-1.5 text-start outline-none"
              onKeyDown={(event) => {
                if (event.key === "Backspace" && current.length > 0) {
                  event.preventDefault()
                  set(current.slice(0, -1))
                }
              }}
            >
              <span className={cn("truncate", selected.length > 0 ? "sr-only" : "text-muted-foreground")}>
                {selected.length > 0 ? `${selected.length} selected` : placeholder}
              </span>
              <ChevronsUpDownIcon className="ms-auto size-4 shrink-0 opacity-50" aria-hidden />
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent className={cn("w-(--radix-popover-trigger-width) min-w-56 p-0", classNames?.content)} align="start">
        <CommandRoot>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const checked = current.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    disabled={option.disabled || (!checked && full)}
                    onSelect={() => toggle(option.value)}
                    className={classNames?.item}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-4 items-center justify-center rounded-[4px] border border-input",
                        checked && "border-primary bg-primary text-primary-foreground"
                      )}
                    >
                      {checked && <CheckIcon className="size-3 text-current" />}
                    </span>
                    {option.label}
                    {/* cmdk uses aria-selected for the highlighted item, so the picked state is spoken this way. */}
                    {checked && <span className="sr-only">, selected</span>}
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {current.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem value="__clear__" onSelect={() => set([])} className="justify-center text-muted-foreground">
                    Clear selection
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </CommandRoot>
      </PopoverContent>
    </PopoverRoot>
  )
}

export { MultiSelect }
