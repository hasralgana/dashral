import * as React from "react"
import { CircleAlert, CircleCheck, Info, Sparkles, TriangleAlert, XIcon } from "lucide-react"

import { cn } from "../lib/utils"

type AlertVariant = "soft" | "outline" | "solid"
type AlertColor = "neutral" | "primary" | "info" | "success" | "warning" | "destructive" | "highlight"

// Every class is written out in full so Tailwind finds it. The description takes the text color, a little softer.
const tones: Record<AlertVariant, Record<AlertColor, string>> = {
  soft: {
    neutral: "bg-muted/50 text-foreground **:data-[slot=alert-body]:text-muted-foreground",
    primary: "border-primary/30 bg-primary/8 text-primary-text **:data-[slot=alert-body]:text-primary-text/90",
    info: "border-info/30 bg-info/8 text-info-text **:data-[slot=alert-body]:text-info-text/90",
    success: "border-success/30 bg-success/8 text-success-text **:data-[slot=alert-body]:text-success-text/90",
    warning: "border-warning/40 bg-warning/10 text-warning-text **:data-[slot=alert-body]:text-warning-text/90",
    destructive: "border-destructive/30 bg-destructive/8 text-destructive-text **:data-[slot=alert-body]:text-destructive-text/90",
    highlight: "border-highlight/30 bg-highlight/8 text-highlight-text **:data-[slot=alert-body]:text-highlight-text/90",
  },
  outline: {
    neutral: "bg-card text-card-foreground **:data-[slot=alert-body]:text-muted-foreground",
    primary: "border-primary/40 bg-card text-primary-text **:data-[slot=alert-body]:text-muted-foreground",
    info: "border-info/40 bg-card text-info-text **:data-[slot=alert-body]:text-muted-foreground",
    success: "border-success/40 bg-card text-success-text **:data-[slot=alert-body]:text-muted-foreground",
    warning: "border-warning/50 bg-card text-warning-text **:data-[slot=alert-body]:text-muted-foreground",
    destructive: "border-destructive/40 bg-card text-destructive-text **:data-[slot=alert-body]:text-muted-foreground",
    highlight: "border-highlight/40 bg-card text-highlight-text **:data-[slot=alert-body]:text-muted-foreground",
  },
  solid: {
    neutral: "border-transparent bg-foreground text-background **:data-[slot=alert-body]:text-background/85",
    primary: "border-transparent bg-primary text-primary-foreground **:data-[slot=alert-body]:text-primary-foreground/85",
    info: "border-transparent bg-info text-info-foreground **:data-[slot=alert-body]:text-info-foreground/85",
    success: "border-transparent bg-success text-success-foreground **:data-[slot=alert-body]:text-success-foreground/85",
    warning: "border-transparent bg-warning text-warning-foreground **:data-[slot=alert-body]:text-warning-foreground/85",
    destructive: "border-transparent bg-destructive text-destructive-foreground **:data-[slot=alert-body]:text-destructive-foreground/85",
    highlight: "border-transparent bg-highlight text-highlight-foreground **:data-[slot=alert-body]:text-highlight-foreground/85",
  },
}

const defaultIcons: Record<AlertColor, React.ReactNode> = {
  neutral: <Info />,
  primary: <Info />,
  info: <Info />,
  success: <CircleCheck />,
  warning: <TriangleAlert />,
  destructive: <CircleAlert />,
  highlight: <Sparkles />,
}

type AlertProps = Omit<React.ComponentProps<"div">, "title" | "color"> & {
  title?: React.ReactNode
  description?: React.ReactNode
  /** How much it stands out: soft (default), outline or solid. */
  variant?: AlertVariant
  /** What it means. Neutral by default. */
  color?: AlertColor
  /** Replaces the color's icon; false shows none. */
  icon?: React.ReactNode | false
  /** At the end, e.g. a button: "Retry", "Upgrade". */
  action?: React.ReactNode
  /** Shows a close button, and is called when it's pressed. */
  onClose?: () => void
  /** The close button's name for screen readers, in your language. */
  closeLabel?: string
  classNames?: { icon?: string; title?: string; description?: string; action?: string }
}

/**
 * A message on the page, in one tag: a title and description, an icon that fits the color, and optionally an action
 * and a close button. Anything in children goes under the description. Warnings and errors are announced.
 */
function Alert({
  title,
  description,
  variant = "soft",
  color = "neutral",
  icon,
  action,
  onClose,
  closeLabel = "Dismiss",
  className,
  classNames,
  children,
  ...props
}: AlertProps) {
  const shownIcon = icon === false ? null : (icon ?? defaultIcons[color])
  return (
    <div
      data-slot="alert"
      role={color === "destructive" || color === "warning" ? "alert" : "status"}
      className={cn("flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-sm", tones[variant][color], className)}
      {...props}
    >
      {shownIcon && (
        <span aria-hidden className={cn("flex shrink-0 translate-y-0.5 [&_svg]:size-4", classNames?.icon)}>
          {shownIcon}
        </span>
      )}
      <div className="grid min-w-0 flex-1 gap-0.5">
        {title && <div className={cn("font-medium tracking-tight", classNames?.title)}>{title}</div>}
        {(description || children) && (
          <div data-slot="alert-body" className={cn("grid justify-items-start gap-2 [&_p]:leading-relaxed", classNames?.description)}>
            {description && <div>{description}</div>}
            {children}
          </div>
        )}
      </div>
      {action && <div className={cn("flex shrink-0 items-center gap-2 self-center", classNames?.action)}>{action}</div>}
      {onClose && (
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className="-me-1 flex size-6 shrink-0 items-center justify-center rounded-md opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-4"
        >
          <XIcon aria-hidden />
        </button>
      )}
    </div>
  )
}

export { Alert, type AlertProps, type AlertVariant, type AlertColor }
