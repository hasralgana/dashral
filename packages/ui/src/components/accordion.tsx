"use client"

import * as React from "react"
import { Accordion as AccordionPrimitive } from "radix-ui"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "../lib/utils"

type AccordionItem = {
  /** A stable key, used by value / defaultValue; the index is used without one. */
  value?: string
  title: React.ReactNode
  content: React.ReactNode
  disabled?: boolean
}

type AccordionProps = Omit<React.ComponentProps<"div">, "defaultValue" | "dir"> & {
  items: AccordionItem[]
  /** Several open at once; otherwise opening one closes the other. */
  multiple?: boolean
  /** The open items, controlled. */
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  /** default: rows split by lines; separated: each row a card of its own. */
  variant?: "default" | "separated"
  classNames?: { item?: string; trigger?: string; content?: string }
}

/** Sections that open and close, in one tag: items with a title and content. */
function Accordion({ items, multiple = false, value, defaultValue, onValueChange, variant = "default", className, classNames, ...props }: AccordionProps) {
  const keyOf = (item: AccordionItem, i: number) => item.value ?? String(i)
  const rows = items.map((item, i) => (
    <AccordionItemPart
      key={keyOf(item, i)}
      value={keyOf(item, i)}
      disabled={item.disabled}
      className={cn(variant === "separated" && "rounded-lg border px-4 last:border-b", classNames?.item)}
    >
      <AccordionTrigger className={classNames?.trigger}>{item.title}</AccordionTrigger>
      <AccordionContent className={classNames?.content}>{item.content}</AccordionContent>
    </AccordionItemPart>
  ))
  const root = cn(variant === "separated" && "grid gap-2", className)
  // Radix takes a string for one open item and an array for several; the outside always sees an array.
  return multiple ? (
    <AccordionPrimitive.Root data-slot="accordion" type="multiple" value={value} defaultValue={defaultValue} onValueChange={onValueChange} className={root} {...props}>
      {rows}
    </AccordionPrimitive.Root>
  ) : (
    <AccordionPrimitive.Root
      data-slot="accordion"
      type="single"
      collapsible
      value={value === undefined ? undefined : (value[0] ?? "")}
      defaultValue={defaultValue?.[0]}
      onValueChange={onValueChange && ((next: string) => onValueChange(next ? [next] : []))}
      className={root}
      {...props}
    >
      {rows}
    </AccordionPrimitive.Root>
  )
}

function AccordionItemPart({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-start text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-(--duration-standard) ease-spring" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden text-sm duration-(--duration-standard) ease-standard data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down motion-reduce:animate-none"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, type AccordionProps, type AccordionItem }
