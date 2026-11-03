"use client"

import * as React from "react"
import { ArrowUpRight } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { ScrollShadow } from "./scroll-shadow"

type PromptSuggestion =
  | string
  | {
      /** What the suggestion says. */
      label: React.ReactNode
      /** What it sends, when that differs from the label ("Unpaid invoices" sends "Who hasn't paid yet?"). */
      prompt?: string
      /** A line under the label, in cards. */
      description?: React.ReactNode
      icon?: React.ReactNode
      disabled?: boolean
    }

type PromptSuggestionsProps = Omit<React.ComponentProps<"div">, "onSelect" | "children"> & {
  suggestions: PromptSuggestion[]
  /** Called with the prompt when one is picked. */
  onSelect?: (prompt: string) => void
  /** chips: round buttons in a row; cards: a grid of cards with an icon, a title and a line. */
  variant?: "chips" | "cards"
  /** Chips only: one row that scrolls sideways (its edges fade) instead of wrapping, for narrow screens. */
  scroll?: boolean
  /** Names the group for screen readers. "Suggestions" by default. */
  "aria-label"?: string
  classNames?: { item?: string; icon?: string; label?: string; description?: string }
}

const normalize = (suggestion: PromptSuggestion) => (typeof suggestion === "string" ? { label: suggestion, prompt: suggestion } : suggestion)

/** The text a suggestion sends: its prompt, or its label when that's text. */
const promptOf = (item: ReturnType<typeof normalize>) => item.prompt ?? (typeof item.label === "string" ? item.label : "")

/**
 * Things to ask, for an empty conversation: round chips in a row (or one row that scrolls), or cards with an icon and a
 * line each. Picking one hands its prompt to onSelect, to send or to put in the composer.
 */
function PromptSuggestions({
  suggestions,
  onSelect,
  variant = "chips",
  scroll = false,
  className,
  classNames,
  "aria-label": ariaLabel,
  ...props
}: PromptSuggestionsProps) {
  const { t } = useLocale()
  const items = suggestions.map(normalize)

  const buttons = items.map((item, index) => {
    const prompt = promptOf(item)
    const choose = () => onSelect?.(prompt)
    if (variant === "cards") {
      return (
        <button
          key={index}
          type="button"
          onClick={choose}
          disabled={item.disabled}
          className={cn(
            "group/suggestion flex min-w-0 items-start gap-3 rounded-xl border bg-card p-3.5 text-start text-sm text-muted-foreground shadow-xs transition-[border-color,color,background-color] duration-(--duration-fast) outline-none",
            "hover:border-ring/40 hover:bg-accent/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
            classNames?.item
          )}
        >
          {item.icon && (
            <span aria-hidden className={cn("mt-px grid size-5 shrink-0 place-items-center text-muted-foreground [&_svg]:size-4", classNames?.icon)}>
              {item.icon}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className={cn("block font-medium text-foreground", classNames?.label)} dir="auto">
              {item.label}
            </span>
            {item.description && (
              <span className={cn("mt-0.5 block text-xs leading-relaxed", classNames?.description)} dir="auto">
                {item.description}
              </span>
            )}
          </span>
          <ArrowUpRight
            aria-hidden
            className="size-3.5 shrink-0 opacity-0 transition-[opacity,translate] duration-(--duration-fast) group-hover/suggestion:translate-x-0.5 rtl:group-hover/suggestion:-translate-x-0.5 group-hover/suggestion:-translate-y-0.5 group-hover/suggestion:opacity-100 group-focus-visible/suggestion:opacity-100 rtl:-scale-x-100 motion-reduce:translate-none"
          />
        </button>
      )
    }
    return (
      <button
        key={index}
        type="button"
        onClick={choose}
        disabled={item.disabled}
        className={cn(
          "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border bg-card px-3 text-sm whitespace-nowrap text-muted-foreground shadow-xs transition-[border-color,color,background-color] duration-(--duration-fast) outline-none",
          "hover:border-ring/40 hover:bg-accent/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3.5 [&_svg]:shrink-0",
          classNames?.item
        )}
      >
        {item.icon && (
          <span aria-hidden className={cn("contents", classNames?.icon)}>
            {item.icon}
          </span>
        )}
        <span className={classNames?.label} dir="auto">
          {item.label}
        </span>
      </button>
    )
  })

  if (variant === "chips" && scroll) {
    return (
      <ScrollShadow
        orientation="horizontal"
        role="group"
        aria-label={ariaLabel ?? t("suggestions")}
        data-slot="prompt-suggestions"
        className={cn("flex gap-2 px-px py-px", className)}
        {...props}
      >
        {buttons}
      </ScrollShadow>
    )
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel ?? t("suggestions")}
      data-slot="prompt-suggestions"
      data-variant={variant}
      className={cn(variant === "cards" ? "grid gap-2 sm:grid-cols-2" : "flex flex-wrap justify-center gap-2", className)}
      {...props}
    >
      {buttons}
    </div>
  )
}

export { PromptSuggestions, type PromptSuggestionsProps, type PromptSuggestion }
