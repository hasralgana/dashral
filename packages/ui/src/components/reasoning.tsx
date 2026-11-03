"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"
import { Brain, ChevronDown } from "lucide-react"

import { useLocale } from "../lib/locale"
import { reducedMotion } from "../lib/motion"
import { cn } from "../lib/utils"

/** "thinking" while the model works through it (the text may still be streaming in); "done" once it's answering. */
type ReasoningStatus = "thinking" | "done"

type ReasoningProps = Omit<React.ComponentProps<"div">, "children" | "title"> & {
  /** The model's reasoning, as it streams in: text (line breaks kept) or your own rendering. */
  children?: React.ReactNode
  status?: ReasoningStatus
  /** How long it thought, in seconds. Measured from "thinking" to "done" when left out. */
  duration?: number
  /** Controlled open state. Uncontrolled, it opens while thinking and closes when done (see autoClose). */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Close when the thinking is done, unless the reader opened or closed it themselves. On by default. */
  autoClose?: boolean
  /** Replaces "Thinking…" and "Thought for 8 seconds". */
  label?: React.ReactNode
  classNames?: { trigger?: string; content?: string }
}

/** Text with a light sweeping across it while something is in progress; still, and plainly muted, with reduced motion. */
function Shimmer({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  React.useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion() || typeof el.animate !== "function") return
    // The Web Animations API, so it needs no keyframes in the stylesheet (the registry ships components, not CSS).
    // The band crosses the text in the first 70% of each turn, then rests a moment; with the text, in the reading
    // direction (right to left in Arabic).
    const rtl = getComputedStyle(el).direction === "rtl"
    const [from, to] = rtl ? ["0% 0", "100% 0"] : ["100% 0", "0% 0"]
    const sweep = el.animate([{ backgroundPosition: from }, { backgroundPosition: to, offset: 0.7 }, { backgroundPosition: to }], {
      duration: 1800,
      iterations: Infinity,
      easing: "ease-in-out",
    })
    return () => sweep.cancel()
  }, [])
  return (
    <span
      ref={ref}
      // The muted text with a band of light across it: toward the page's background in light mode (a bright gleam on
      // grey), toward the text color in dark mode. Darkening it instead reads as a shadow and barely shows.
      className={cn(
        "bg-[length:250%_100%] bg-clip-text text-transparent motion-reduce:bg-none motion-reduce:text-muted-foreground",
        "bg-[linear-gradient(90deg,var(--muted-foreground)_30%,color-mix(in_oklab,var(--muted-foreground),var(--background)_80%)_50%,var(--muted-foreground)_70%)]",
        "dark:bg-[linear-gradient(90deg,var(--muted-foreground)_30%,var(--foreground)_50%,var(--muted-foreground)_70%)]"
      )}
    >
      {children}
    </span>
  )
}

/**
 * What the model thought before it answered, folded under one line: "Thinking…" with a shimmer while it works (open,
 * so the thoughts can be followed), then "Thought for 8 seconds", closed. Click the line to read them again.
 */
function Reasoning({
  children,
  status = "done",
  duration,
  open: openProp,
  defaultOpen,
  onOpenChange,
  autoClose = true,
  label,
  className,
  classNames,
  ...props
}: ReasoningProps) {
  const { t } = useLocale()
  const thinking = status === "thinking"
  const [ownOpen, setOwnOpen] = React.useState(defaultOpen ?? thinking)
  const open = openProp ?? ownOpen
  // Once the reader has opened or closed it, it stays the way they left it.
  const touched = React.useRef(false)
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOwnOpen(next)
    onOpenChange?.(next)
  }

  // How long the thinking took, when not given: from the render that said "thinking" to the one that said "done".
  const startedAt = React.useRef<number | null>(null)
  const [measured, setMeasured] = React.useState<number | null>(null)
  const previous = React.useRef(status)
  React.useEffect(() => {
    if (thinking && startedAt.current === null) startedAt.current = Date.now()
    if (previous.current === "thinking" && status === "done") {
      if (startedAt.current !== null) setMeasured(Math.round((Date.now() - startedAt.current) / 1000))
      if (autoClose && !touched.current) setOpen(false)
    }
    if (previous.current === "done" && thinking && !touched.current) setOpen(true)
    previous.current = status
    // setOpen only changes with the props it reads; running on status alone is what's wanted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const seconds = duration ?? measured
  const title = label ?? (thinking ? t("thinking") : seconds ? t("thoughtFor", { count: seconds }) : t("thoughtBriefly"))
  const hasContent = React.Children.toArray(children).length > 0

  return (
    <CollapsiblePrimitive.Root
      data-slot="reasoning"
      data-status={status}
      open={open}
      onOpenChange={(next) => {
        touched.current = true
        setOpen(next)
      }}
      className={cn("text-sm", className)}
      {...props}
    >
      <CollapsiblePrimitive.Trigger
        disabled={!hasContent}
        className={cn(
          "group/reasoning inline-flex items-center gap-1.5 rounded-md py-1 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-default disabled:hover:text-muted-foreground",
          classNames?.trigger
        )}
      >
        <Brain aria-hidden className="size-4 shrink-0" />
        {/* The line changes from "Thinking…" to how long it took; screen readers hear the change once. */}
        <span aria-live="polite">{thinking && !label ? <Shimmer>{title}</Shimmer> : title}</span>
        {hasContent && (
          <ChevronDown
            aria-hidden
            className="size-3.5 shrink-0 transition-transform duration-(--duration-standard) ease-standard group-data-[state=open]/reasoning:rotate-180 motion-reduce:transition-none"
          />
        )}
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content
        className="overflow-hidden duration-(--duration-standard) ease-standard data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none"
      >
        <div
          data-slot="reasoning-content"
          dir="auto"
          className={cn(
            "mt-1 ms-2 border-s-2 ps-3.5 leading-relaxed text-muted-foreground [overflow-wrap:anywhere]",
            typeof children === "string" && "whitespace-pre-wrap",
            classNames?.content
          )}
        >
          {children}
        </div>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  )
}

export { Reasoning, type ReasoningProps, type ReasoningStatus }
