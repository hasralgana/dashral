import * as React from "react"
import { CircleAlert, CircleCheck, Info, Lightbulb, Sparkles, TriangleAlert } from "lucide-react"

import { cn } from "../lib/utils"

type NoteColor = "neutral" | "primary" | "info" | "success" | "warning" | "destructive" | "highlight"

// The color is a breath of light in the top corner and the icon; the frame and the words stay neutral. Every class is
// written out in full so Tailwind finds it.
const tones: Record<NoteColor, string> = {
  neutral: "[--note:var(--foreground)] [--note-glow:6%] dark:[--note-glow:9%] **:data-[slot=note-icon]:text-muted-foreground",
  primary: "[--note:var(--primary)] [--note-glow:16%] dark:[--note-glow:22%] **:data-[slot=note-icon]:text-primary-text",
  info: "[--note:var(--info)] [--note-glow:16%] dark:[--note-glow:22%] **:data-[slot=note-icon]:text-info-text",
  success: "[--note:var(--success)] [--note-glow:16%] dark:[--note-glow:22%] **:data-[slot=note-icon]:text-success-text",
  warning: "[--note:var(--warning)] [--note-glow:18%] dark:[--note-glow:22%] **:data-[slot=note-icon]:text-warning-text",
  destructive: "[--note:var(--destructive)] [--note-glow:14%] dark:[--note-glow:22%] **:data-[slot=note-icon]:text-destructive-text",
  highlight: "[--note:var(--highlight)] [--note-glow:14%] dark:[--note-glow:22%] **:data-[slot=note-icon]:text-highlight-text",
}

const defaultIcons: Record<NoteColor, React.ReactNode> = {
  neutral: <Lightbulb />,
  primary: <Lightbulb />,
  info: <Info />,
  success: <CircleCheck />,
  warning: <TriangleAlert />,
  destructive: <CircleAlert />,
  highlight: <Sparkles />,
}

type NoteProps = Omit<React.ComponentProps<"div">, "title" | "color"> & {
  /** The heading beside the icon, e.g. "Good to know". */
  title?: React.ReactNode
  /** Its tint: neutral by default; each color brings a fitting icon. */
  color?: NoteColor
  /** Replaces the color's icon; false shows none. */
  icon?: React.ReactNode | false
  classNames?: { icon?: string; title?: string; body?: string }
}

/**
 * An aside in the flow of a page, in one tag: a tip, a caveat, a "good to know" beside the steps. A card with a faint
 * grid and a breath of its color in the top corner; words and lists inside read as they would in the text around it.
 * Not a status message: for "saved" or "failed" use Alert, which is announced.
 */
function Note({ title, color = "neutral", icon, className, classNames, children, ...props }: NoteProps) {
  const shownIcon = icon === false ? null : (icon ?? defaultIcons[color])
  const iconNode = shownIcon && (
    <span data-slot="note-icon" aria-hidden className={cn("flex shrink-0 [&_svg]:size-4", classNames?.icon)}>
      {shownIcon}
    </span>
  )
  return (
    <div
      role="note"
      data-slot="note"
      data-color={color}
      className={cn(
        "relative isolate overflow-hidden rounded-xl border border-foreground/10 bg-card p-5 text-sm text-card-foreground",
        // A wash (the website hero's): light pooling from three sides on the card's own color, the top corner's in the
        // note's color, the other two a faint grey.
        "bg-[radial-gradient(ellipse_50%_60%_at_88%_-5%,color-mix(in_oklch,var(--note)_var(--note-glow),transparent),transparent),radial-gradient(ellipse_38%_48%_at_-2%_100%,color-mix(in_oklch,var(--foreground)_3%,transparent),transparent),radial-gradient(ellipse_42%_40%_at_58%_112%,color-mix(in_oklch,var(--foreground)_3%,transparent),transparent)]",
        // And its faint grid: hairlines every 48px, strongest in the middle and gone at the edges.
        "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:content-['']",
        "before:bg-[linear-gradient(to_right,color-mix(in_oklch,var(--foreground)_5.5%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--foreground)_5.5%,transparent)_1px,transparent_1px)] before:bg-size-[48px_48px] before:bg-center",
        "before:[mask-image:radial-gradient(ellipse_60%_55%_at_50%_45%,#000_20%,transparent_75%)]",
        tones[color],
        className
      )}
      {...props}
    >
      {title ? (
        <div data-slot="note-title" className={cn("flex items-center gap-2 font-medium", classNames?.title)}>
          {iconNode}
          {title}
        </div>
      ) : null}
      {children ? (
        <div
          data-slot="note-body"
          className={cn(
            "flex gap-2.5 leading-relaxed text-muted-foreground",
            title && "mt-2.5",
            // Links, code and lists read the way they do in the text around it.
            "[&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:decoration-foreground/30 [&_a]:underline-offset-4 hover:[&_a]:decoration-foreground",
            "[&_code]:rounded [&_code]:bg-foreground/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.92em] [&_code]:text-foreground",
            "[&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:ps-5 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:ps-5",
            classNames?.body
          )}
        >
          {/* No title: the icon leads the text instead. */}
          {!title && iconNode && <span className="mt-0.5">{iconNode}</span>}
          <div className="min-w-0 flex-1 space-y-2">{children}</div>
        </div>
      ) : null}
    </div>
  )
}

export { Note, type NoteProps, type NoteColor }
