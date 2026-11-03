import * as React from "react"
import { CheckIcon } from "lucide-react"

import { cn } from "../lib/utils"

type StepStatus = "complete" | "current" | "upcoming"

type StepItem = { title: React.ReactNode; description?: React.ReactNode }

/** A progress indicator for multi-step flows, in one tag. `current` is the zero-based index of the active step. */
function Steps({
  items,
  current,
  orientation = "horizontal",
  className,
  ...props
}: Omit<React.ComponentProps<"ol">, "children"> & {
  items: StepItem[]
  current: number
  orientation?: "horizontal" | "vertical"
}) {
  return (
    <ol
      data-slot="steps"
      data-orientation={orientation}
      className={cn("flex", orientation === "horizontal" ? "w-full items-start" : "flex-col", className)}
      {...props}
    >
      {items.map((item, index) => (
        <Step
          key={index}
          {...item}
          index={index}
          status={index < current ? "complete" : index === current ? "current" : "upcoming"}
          orientation={orientation}
          last={index === items.length - 1}
        />
      ))}
    </ol>
  )
}

function Step({
  title,
  description,
  index,
  status,
  orientation,
  last,
}: StepItem & { index: number; status: StepStatus; orientation: "horizontal" | "vertical"; last: boolean }) {
  const horizontal = orientation === "horizontal"

  return (
    <li
      data-slot="step"
      data-status={status}
      aria-current={status === "current" ? "step" : undefined}
      className={cn(
        "relative flex",
        horizontal ? "flex-1 flex-col items-center text-center" : "gap-4 pb-8 last:pb-0"
      )}
    >
      {!last && (
        <span
          aria-hidden
          className={cn(
            "absolute overflow-hidden bg-border",
            horizontal ? "top-4 start-[calc(50%+1.25rem)] h-0.5 w-[calc(100%-2.5rem)]" : "top-9 start-4 h-[calc(100%-2.5rem)] w-0.5 -translate-x-1/2 rtl:translate-x-1/2"
          )}
        >
          {/* The connector fills in the reading direction when the step is done. */}
          <span
            className={cn(
              "absolute inset-0 bg-primary transition-[scale] duration-(--duration-considered) ease-standard motion-reduce:transition-none",
              horizontal ? "origin-left" : "origin-top",
              status === "complete" ? "scale-100" : horizontal ? "scale-x-0" : "scale-y-0"
            )}
          />
        </span>
      )}
      <span
        className={cn(
          "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums transition-colors duration-(--duration-standard)",
          status === "complete" && "border-primary bg-primary text-primary-foreground",
          status === "current" && "border-primary bg-background text-primary-text",
          status === "upcoming" && "border-border bg-background text-muted-foreground"
        )}
      >
        {status === "complete" ? (
          <CheckIcon className="size-4 animate-in zoom-in-50 duration-(--duration-standard) ease-spring motion-reduce:animate-none" aria-hidden />
        ) : (
          index + 1
        )}
      </span>
      <div className={cn(horizontal ? "mt-2 px-2" : "pt-1")}>
        <p className={cn("text-sm font-medium", status === "upcoming" && "text-muted-foreground")}>
          {title}
          {status === "complete" && <span className="sr-only"> (completed)</span>}
        </p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
    </li>
  )
}

export { Steps, type StepItem }
