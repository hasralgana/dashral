"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { AnimatePresence, LayoutGroup, motion } from "motion/react"
import { FieldWrapper, splitFieldProps, useFieldControl } from "@dashral/ui/components/field"
import type { SelectOption, SelectProps } from "@dashral/ui/components/select"
import { cn } from "@dashral/ui/lib/utils"
import { usePortalContainer } from "@dashral/ui/lib/portal"

import { useHoverPill } from "../lib/hover"
import { motionMessages } from "../lib/field"
import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type { SelectProps, SelectOption, SelectOptionGroup } from "@dashral/ui/components/select"

type Option = { value: string; label: React.ReactNode; description?: React.ReactNode; icon?: React.ReactNode; disabled?: boolean }

const toOption = (option: SelectOption): Option =>
  typeof option === "string" ? { value: option, label: option } : { ...option, label: option.label ?? option.value }

/**
 * The kit's Select with motion: the same options, groups, placeholder, prefix, sizes and props. The list springs out
 * of its trigger, its options rising in one after another; the highlight is one pill gliding from option to option
 * after the pointer or the arrow keys; the picked option's tick draws itself; the chevron turns as it opens; and a new
 * value rises into the trigger over the old one. It leaves quickly. With reduced motion it only fades.
 */
export function Select(props: SelectProps) {
  const portalContainer = usePortalContainer()
  const [
    field,
    { options, placeholder, prefix, size = "default", side = "bottom", id, className, classNames, "aria-label": ariaLabel, "aria-invalid": invalid, value, defaultValue, onValueChange, open, defaultOpen, onOpenChange, ...root },
  ] = splitFieldProps(props)
  const reduced = useReducedMotion()
  const [own, setOwn] = React.useState(defaultValue ?? "")
  const current = value ?? own
  const [ownOpen, setOwnOpen] = React.useState(defaultOpen ?? false)
  const isOpen = open ?? ownOpen
  const group = React.useId()
  const pill = useHoverPill<string>(reduced)

  const flat = options.flatMap((entry) => (typeof entry === "object" && "options" in entry ? entry.options : [entry])).map(toOption)
  const picked = flat.find((option) => option.value === current)
  const from = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: side === "top" ? 6 : -6 }
  let index = 0

  const renderOption = (option: Option) => {
    const at = index++
    return (
      <SelectPrimitive.Item
        key={option.value}
        value={option.value}
        disabled={option.disabled}
        data-slot="select-item"
        onFocus={() => pill.enter(option.value)}
        onBlur={pill.leave}
        className={cn(
          "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pe-8 ps-2 text-sm outline-hidden select-none focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
          classNames?.item
        )}
      >
        {/* The highlight: one pill for the list, gliding from option to option. */}
        {pill.hot === option.value && (
          <motion.span
            layoutId="hot"
            aria-hidden
            className="absolute inset-0 -z-10 rounded-sm bg-accent"
            // Its opacity is the list's, so it doesn't start from nothing at each new option.
            style={{ opacity: pill.opacity }}
            transition={reduced ? { duration: 0 } : spring.move}
          />
        )}
        <span className="absolute end-2 flex size-3.5 items-center justify-center">
          <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
            <motion.path
              d="M4 12l5 5L20 6"
              initial={reduced ? false : { pathLength: 0 }}
              animate={{ pathLength: current === option.value ? 1 : 0, opacity: current === option.value ? 1 : 0 }}
              transition={{ pathLength: { duration: duration.standard, ease: ease.enter, delay: 0.08 }, opacity: { duration: 0.01 } }}
            />
          </svg>
        </span>
        <motion.span
          className="flex min-w-0 items-center gap-2"
          initial={reduced ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.standard, ease: ease.enter, delay: Math.min(at, 8) * 0.025 }}
        >
          {option.description ? (
            <span className="grid gap-0.5">
              <SelectPrimitive.ItemText>
                <span className="flex items-center gap-2">
                  {option.icon}
                  {option.label}
                </span>
              </SelectPrimitive.ItemText>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </span>
          ) : (
            <SelectPrimitive.ItemText>
              <span className="flex items-center gap-2">
                {option.icon}
                {option.label}
              </span>
            </SelectPrimitive.ItemText>
          )}
        </motion.span>
      </SelectPrimitive.Item>
    )
  }

  return (
    <FieldWrapper {...field} renderMessages={motionMessages}>
      <SelectPrimitive.Root
        data-slot="select"
        value={current}
        onValueChange={(next) => {
          if (value === undefined) setOwn(next)
          onValueChange?.(next)
        }}
        open={isOpen}
        onOpenChange={(next) => {
          if (open === undefined) setOwnOpen(next)
          if (!next) pill.clear()
          onOpenChange?.(next)
        }}
        {...root}
      >
        <SelectTrigger id={id} size={size} aria-label={ariaLabel} aria-invalid={invalid} open={isOpen} reduced={reduced} placeholder={!picked} className={cn("w-full", className, classNames?.trigger)}>
          {prefix && (
            <span data-slot="select-prefix" className="flex shrink-0 items-center text-muted-foreground">
              {prefix}
            </span>
          )}
          {/* The value as shown: a new one rises in over the old. Radix's own Value stays for its bookkeeping, unseen. */}
          <span className="relative grid min-w-0 flex-1 justify-items-start overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={current || "placeholder"}
                className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 truncate"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, transition: { duration: duration.fast, ease: ease.exit } }}
                transition={{ duration: duration.standard, ease: ease.enter }}
              >
                {picked ? (
                  <>
                    {picked.icon}
                    {picked.label}
                  </>
                ) : (
                  placeholder
                )}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="sr-only">
            <SelectPrimitive.Value />
          </span>
        </SelectTrigger>
        {/*
          Closed, Radix still keeps the options (off screen) for the native select a form submits and for typing on the
          trigger to pick; the animated list below is only there while it's open.
        */}
        {!isOpen && (
          <SelectPrimitive.Content>
            <SelectPrimitive.Viewport>
              {flat.map((option) => (
                <SelectPrimitive.Item key={option.value} value={option.value} disabled={option.disabled}>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        )}
        <AnimatePresence>
          {isOpen && (
            <SelectPrimitive.Portal forceMount container={portalContainer}>
              <SelectPrimitive.Content forceMount asChild position="popper" side={side} sideOffset={4}>
                <motion.div
                  data-slot="select-content"
                  className={cn(
                    "relative isolate z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md",
                    classNames?.content
                  )}
                  style={{ transformOrigin: "var(--radix-select-content-transform-origin)" }}
                  initial={from}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ ...from, transition: { duration: duration.fast, ease: ease.exit } }}
                  transition={reduced ? { duration: duration.fast } : { ...spring.appear, opacity: { duration: duration.fast, ease: ease.enter } }}
                >
                  <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
                    <ChevronUpIcon className="size-4" />
                  </SelectPrimitive.ScrollUpButton>
                  <LayoutGroup id={group}>
                    <SelectPrimitive.Viewport className="h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width) scroll-my-1 p-1">
                      {options.map((entry, i) =>
                        typeof entry === "object" && "options" in entry ? (
                          <React.Fragment key={i}>
                            {i > 0 && <SelectPrimitive.Separator className="pointer-events-none -mx-1 my-1 h-px bg-border" />}
                            <SelectPrimitive.Group>
                              {entry.label && <SelectPrimitive.Label className="px-2 py-1.5 text-xs text-muted-foreground">{entry.label}</SelectPrimitive.Label>}
                              {entry.options.map((option) => renderOption(toOption(option)))}
                            </SelectPrimitive.Group>
                          </React.Fragment>
                        ) : (
                          renderOption(toOption(entry))
                        )
                      )}
                    </SelectPrimitive.Viewport>
                  </LayoutGroup>
                  <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
                    <ChevronDownIcon className="size-4" />
                  </SelectPrimitive.ScrollDownButton>
                </motion.div>
              </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
          )}
        </AnimatePresence>
      </SelectPrimitive.Root>
    </FieldWrapper>
  )
}

function SelectTrigger({
  className,
  size,
  open,
  reduced,
  placeholder,
  children,
  ...rest
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & { size: "sm" | "default"; open: boolean; reduced: boolean; placeholder: boolean }) {
  // A button can't be required: the Select root takes that.
  const { required: _required, ...props } = useFieldControl(rest as typeof rest & { required?: boolean })
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      data-placeholder={placeholder || undefined}
      className={cn(
        "flex w-fit items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/15 data-[placeholder]:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
      {/* The chevron turns over as the list opens, and back as it closes. */}
      <motion.span className="flex opacity-50" animate={{ rotate: open && !reduced ? 180 : 0 }} transition={reduced ? { duration: 0 } : spring.move}>
        <ChevronDownIcon className="size-4" />
      </motion.span>
    </SelectPrimitive.Trigger>
  )
}
