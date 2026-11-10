"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { cn } from "../lib/utils"
import { usePortalContainer } from "../lib/portal"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldOwnProps } from "./field"

type SelectOption =
  | string
  | { value: string; label?: React.ReactNode; description?: React.ReactNode; icon?: React.ReactNode; disabled?: boolean }
type SelectOptionGroup = { label?: React.ReactNode; options: SelectOption[] }

type SelectProps = Omit<React.ComponentProps<typeof SelectPrimitive.Root>, "children"> &
  FieldOwnProps & {
    /**
     * The choices: strings, { value, label, description, icon, disabled }, or groups of them ({ label, options }). A
     * line separates groups; a group without a label is just set apart.
     */
    options: (SelectOption | SelectOptionGroup)[]
    /** Shown in the trigger while nothing is picked. */
    placeholder?: React.ReactNode
    /** Inside the trigger before the value, e.g. an icon. */
    prefix?: React.ReactNode
    size?: "sm" | "default"
    /** Which side of the trigger the list opens on. */
    side?: "top" | "bottom"
    id?: string
    /** The trigger's classes. */
    className?: string
    "aria-label"?: string
    classNames?: FieldClassNames & { trigger?: string; content?: string; item?: string }
  }

/** A select with a styled list, in one tag. Give it a label, description or error and it becomes a whole field. */
function Select(props: SelectProps) {
  const [field, { options, placeholder, prefix, size, side, id, className, classNames, "aria-label": ariaLabel, "aria-invalid": invalid, ...root }] =
    splitFieldProps(props)
  return (
    <FieldWrapper {...field}>
      <SelectPrimitive.Root data-slot="select" {...root}>
        <SelectTrigger id={id} size={size} aria-label={ariaLabel} aria-invalid={invalid} className={cn("w-full", className, classNames?.trigger)}>
          {prefix && (
            <span data-slot="select-prefix" className="flex shrink-0 items-center text-muted-foreground">
              {prefix}
            </span>
          )}
          {/* With a prefix, the value sits right after it rather than in the middle. */}
          <SelectValue placeholder={placeholder} className={prefix ? "flex-1 text-start" : undefined} />
        </SelectTrigger>
        <SelectContent side={side} className={classNames?.content}>
          {options.map((option, i) =>
            typeof option === "object" && "options" in option ? (
              <React.Fragment key={i}>
                {i > 0 && <SelectSeparator />}
                <SelectGroup>
                  {option.label && <SelectLabel>{option.label}</SelectLabel>}
                  {option.options.map((item) => renderOption(item, classNames?.item))}
                </SelectGroup>
              </React.Fragment>
            ) : (
              renderOption(option, classNames?.item)
            )
          )}
        </SelectContent>
      </SelectPrimitive.Root>
    </FieldWrapper>
  )
}

function renderOption(option: SelectOption, className?: string) {
  const { value, label = value, description, icon, disabled } = typeof option === "string" ? { value: option } : option
  return (
    <SelectItem key={value} value={value} disabled={disabled} description={description} className={className}>
      {icon}
      {label}
    </SelectItem>
  )
}

function SelectGroup(props: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue(props: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...rest
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & { size?: "sm" | "default" }) {
  // A button can't be required: the Select root takes that.
  const { required: _required, ...props } = useFieldControl(rest as typeof rest & { required?: boolean })
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/15 data-[placeholder]:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  const portalContainer = usePortalContainer()
  return (
    <SelectPrimitive.Portal container={portalContainer}>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:duration-(--duration-standard) data-[state=open]:ease-standard data-[side=bottom]:slide-in-from-top-[6px] data-[side=top]:slide-in-from-bottom-[6px] data-[side=left]:slide-in-from-right-[6px] data-[side=right]:slide-in-from-left-[6px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-(--duration-fast) data-[state=closed]:ease-exit",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width) scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  description,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item> & { description?: React.ReactNode }) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pe-8 ps-2 text-sm outline-hidden select-none [&_[id]]:flex [&_[id]]:items-center [&_[id]]:gap-2 focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className
      )}
      {...props}
    >
      <span className="absolute end-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      {/* The item text (Radix gives it an id and drops any class) lays an icon beside the label, as in the trigger. */}
      {description ? (
        // Only the label goes in the trigger; the description stays in the list.
        <span className="grid gap-0.5">
          <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
          <span className="text-xs text-muted-foreground">{description}</span>
        </span>
      ) : (
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      )}
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export { Select, type SelectProps, type SelectOption, type SelectOptionGroup }
