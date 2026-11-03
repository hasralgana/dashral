"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"
import { ChevronDown, CircleCheck, CircleDashed, CircleX, LoaderCircle } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

/** "pending" waits its turn, "running" is at work, "done" finished, "error" failed. */
type ToolStatus = "pending" | "running" | "done" | "error"

type ToolStep = {
  /** What the tool did, in words: "Search orders", "Read invoice #1042". */
  name: React.ReactNode
  status: ToolStatus
  /** A line under the name: what it found, or why it failed. */
  description?: React.ReactNode
  /** What it was called with, and what it returned: an object (shown as JSON), text, or your own rendering. */
  input?: unknown
  output?: unknown
  /** How long it took, in milliseconds. */
  duration?: number
  /** Replaces the status icon, e.g. the tool's own. */
  icon?: React.ReactNode
  /** Opens its input and output from the start. */
  defaultOpen?: boolean
  /** A stable key when names repeat. */
  id?: string
}

type ToolActivityProps = Omit<React.ComponentProps<"ol">, "children"> & {
  /** The tool calls, in the order they ran. */
  steps: ToolStep[]
  /** Names the list for screen readers. "Tool activity" by default. */
  "aria-label"?: string
  classNames?: { step?: string; trigger?: string; details?: string; code?: string }
}

const icons: Record<ToolStatus, { icon: React.ElementType; className: string }> = {
  pending: { icon: CircleDashed, className: "text-muted-foreground" },
  running: { icon: LoaderCircle, className: "text-primary-text motion-safe:animate-spin" },
  done: { icon: CircleCheck, className: "text-success-text" },
  error: { icon: CircleX, className: "text-destructive-text" },
}

/** An object as indented JSON, text as it is, an element rendered. */
function show(value: unknown): React.ReactNode {
  if (value === undefined || value === null) return null
  if (React.isValidElement(value)) return value
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

/**
 * The tools an assistant used to get its answer, one after another: each with its status (waiting, running, done or
 * failed), what it found, how long it took, and its input and output to open.
 */
function ToolActivity({ steps, className, classNames, "aria-label": ariaLabel, ...props }: ToolActivityProps) {
  const { t } = useLocale()
  return (
    <ol data-slot="tool-activity" aria-label={ariaLabel ?? t("toolActivity")} className={cn("grid text-sm", className)} {...props}>
      {steps.map((step, index) => (
        <ToolStepRow key={step.id ?? index} step={step} last={index === steps.length - 1} classNames={classNames} />
      ))}
    </ol>
  )
}

function ToolStepRow({ step, last, classNames }: { step: ToolStep; last: boolean; classNames: ToolActivityProps["classNames"] }) {
  const { t, locale } = useLocale()
  const [open, setOpen] = React.useState(step.defaultOpen ?? false)
  const statusWord = { pending: t("toolPending"), running: t("toolRunning"), done: t("toolDone"), error: t("toolFailed") }[step.status]
  const input = show(step.input)
  const output = show(step.output)
  const hasDetails = input !== null || output !== null
  const { icon: Icon, className: iconClass } = icons[step.status]
  const duration =
    step.duration === undefined
      ? null
      : step.duration < 1000
        ? new Intl.NumberFormat(locale, { style: "unit", unit: "millisecond", unitDisplay: "narrow" }).format(Math.round(step.duration))
        : new Intl.NumberFormat(locale, { style: "unit", unit: "second", unitDisplay: "narrow", maximumFractionDigits: 1 }).format(step.duration / 1000)

  const row = (
    <>
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate font-medium", step.status === "pending" && "text-muted-foreground")} dir="auto">
          {step.name}
        </span>
        {step.description && (
          <span className={cn("block text-xs", step.status === "error" ? "text-destructive-text" : "text-muted-foreground")} dir="auto">
            {step.description}
          </span>
        )}
      </span>
      {duration && step.status !== "running" && <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{duration}</span>}
      {hasDetails && (
        <ChevronDown
          aria-hidden
          className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-(--duration-standard) ease-standard group-data-[state=open]/tool:rotate-180 motion-reduce:transition-none"
        />
      )}
    </>
  )

  return (
    <li data-slot="tool-step" data-status={step.status} className={cn("relative flex gap-3", classNames?.step)}>
      {/* The status, and a line down to the next step. */}
      <span aria-hidden className="relative flex w-5 shrink-0 flex-col items-center">
        <span className={cn("mt-2 grid size-5 place-items-center", iconClass)}>{step.icon ?? <Icon className="size-4" />}</span>
        {!last && <span className="mt-1 w-px flex-1 bg-border" />}
      </span>
      {/* Heard as each step changes ("Search orders: done"), not the whole list again. */}
      <span className="sr-only" aria-live="polite">
        {typeof step.name === "string" ? t("toolStatus", { name: step.name, status: statusWord }) : statusWord}
      </span>
      <CollapsiblePrimitive.Root open={open} onOpenChange={setOpen} className={cn("min-w-0 flex-1", !last && "pb-2")}>
        {hasDetails ? (
          <CollapsiblePrimitive.Trigger
            className={cn(
              "group/tool flex w-full items-center gap-3 rounded-md py-1.5 text-start outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
              classNames?.trigger
            )}
          >
            {row}
          </CollapsiblePrimitive.Trigger>
        ) : (
          <div className={cn("flex items-center gap-3 py-1.5", classNames?.trigger)}>{row}</div>
        )}
        {hasDetails && (
          <CollapsiblePrimitive.Content className="overflow-hidden duration-(--duration-standard) ease-standard data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none">
            <div className={cn("mt-1 mb-2 grid gap-2", classNames?.details)}>
              {input !== null && <ToolValue label={t("toolInput")} value={input} className={classNames?.code} />}
              {output !== null && <ToolValue label={t("toolOutput")} value={output} className={classNames?.code} />}
            </div>
          </CollapsiblePrimitive.Content>
        )}
      </CollapsiblePrimitive.Root>
    </li>
  )
}

function ToolValue({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  const text = typeof value === "string"
  return (
    <div className="grid gap-1">
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      {text ? (
        <pre className={cn("max-h-48 overflow-auto rounded-lg border bg-muted/40 px-3 py-2 font-mono text-xs leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]", className)}>
          {value}
        </pre>
      ) : (
        <div className={cn("rounded-lg border bg-muted/40 px-3 py-2 text-xs", className)}>{value}</div>
      )}
    </div>
  )
}

export { ToolActivity, type ToolActivityProps, type ToolStep, type ToolStatus }
