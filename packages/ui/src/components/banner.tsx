"use client"

import * as React from "react"
import { XIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

type BannerVariant = "solid" | "soft" | "outline"
type BannerColor = "neutral" | "primary" | "info" | "success" | "warning" | "destructive" | "highlight"

// Every class is written out in full so Tailwind finds it. The description takes the text color, a little softer.
const tones: Record<BannerVariant, Record<BannerColor, string>> = {
  solid: {
    neutral: "border-transparent bg-foreground text-background **:data-[slot=banner-body]:text-background/75",
    primary: "border-transparent bg-primary text-primary-foreground **:data-[slot=banner-body]:text-primary-foreground/80",
    info: "border-transparent bg-info text-info-foreground **:data-[slot=banner-body]:text-info-foreground/80",
    success: "border-transparent bg-success text-success-foreground **:data-[slot=banner-body]:text-success-foreground/80",
    warning: "border-transparent bg-warning text-warning-foreground **:data-[slot=banner-body]:text-warning-foreground/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground **:data-[slot=banner-body]:text-destructive-foreground/80",
    highlight: "border-transparent bg-highlight text-highlight-foreground **:data-[slot=banner-body]:text-highlight-foreground/80",
  },
  soft: {
    neutral: "bg-muted text-foreground **:data-[slot=banner-body]:text-muted-foreground",
    primary: "border-primary/20 bg-primary/8 text-primary-text **:data-[slot=banner-body]:text-primary-text/85",
    info: "border-info/20 bg-info/8 text-info-text **:data-[slot=banner-body]:text-info-text/85",
    success: "border-success/20 bg-success/8 text-success-text **:data-[slot=banner-body]:text-success-text/85",
    warning: "border-warning/30 bg-warning/10 text-warning-text **:data-[slot=banner-body]:text-warning-text/85",
    destructive: "border-destructive/20 bg-destructive/8 text-destructive-text **:data-[slot=banner-body]:text-destructive-text/85",
    highlight: "border-highlight/20 bg-highlight/8 text-highlight-text **:data-[slot=banner-body]:text-highlight-text/85",
  },
  outline: {
    neutral: "bg-card text-card-foreground **:data-[slot=banner-body]:text-muted-foreground",
    primary: "border-primary/40 bg-card text-primary-text **:data-[slot=banner-body]:text-muted-foreground",
    info: "border-info/40 bg-card text-info-text **:data-[slot=banner-body]:text-muted-foreground",
    success: "border-success/40 bg-card text-success-text **:data-[slot=banner-body]:text-muted-foreground",
    warning: "border-warning/50 bg-card text-warning-text **:data-[slot=banner-body]:text-muted-foreground",
    destructive: "border-destructive/40 bg-card text-destructive-text **:data-[slot=banner-body]:text-muted-foreground",
    highlight: "border-highlight/40 bg-card text-highlight-text **:data-[slot=banner-body]:text-muted-foreground",
  },
}

type BannerProps = Omit<React.ComponentProps<"div">, "title" | "color"> & {
  /** The message, in bold: "Dashral 1.1 is out". */
  title?: React.ReactNode
  /** After the title, softer: "Six new components and a calendar." */
  description?: React.ReactNode
  /** Before the text, e.g. an icon or a "New" badge. */
  icon?: React.ReactNode
  /** After the text, e.g. a link ("Read the notes →") or a small button. */
  action?: React.ReactNode
  /** How much it stands out: solid (default), soft or outline. */
  variant?: BannerVariant
  /** What it means. Neutral (ink) by default. */
  color?: BannerColor
  /** Its text in the middle (default), or at the start with the close button at the far end. */
  align?: "center" | "start"
  /** A rounded card with a shadow and a margin, floating over the page, instead of a full-width bar. */
  floating?: boolean
  /** Shows a close button, and is called when it's pressed: hide the banner and remember it, e.g. in a cookie. */
  onClose?: () => void
  classNames?: { title?: string; description?: string; action?: string }
}

/**
 * A strip across the top (or bottom) of a page for news that concerns everyone: a launch, a sale, planned downtime.
 * In one tag: a title and description, an icon, an action and a close button. On a phone the text wraps and the
 * close button stays at the end. For a message about one part of a page, use Alert.
 */
function Banner({
  title,
  description,
  icon,
  action,
  variant = "solid",
  color = "neutral",
  align = "center",
  floating = false,
  onClose,
  className,
  classNames,
  children,
  ...props
}: BannerProps) {
  const { t } = useLocale()
  return (
    <div
      data-slot="banner"
      data-floating={floating || undefined}
      className={cn(
        "flex w-full items-center gap-3 border-b px-4 py-2.5 text-sm",
        floating && "rounded-lg border shadow-lg",
        tones[variant][color],
        className
      )}
      {...props}
    >
      {/* Balances the close button, so centred text sits in the middle of the whole bar. */}
      {onClose && align === "center" && <span aria-hidden className="size-6 shrink-0 max-sm:hidden" />}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1",
          align === "center" ? "justify-center text-center" : "justify-start text-start"
        )}
      >
        {icon && <span className="flex shrink-0 items-center [&_svg]:size-4">{icon}</span>}
        {(title || description || children) && (
          <div className="min-w-0 text-pretty">
            {title && <span className={cn("font-medium", classNames?.title)}>{title}</span>}
            {title && description && " "}
            {description && (
              <span data-slot="banner-body" className={classNames?.description}>
                {description}
              </span>
            )}
            {children}
          </div>
        )}
        {action && <span className={cn("flex shrink-0 items-center gap-2 font-medium", classNames?.action)}>{action}</span>}
      </div>
      {onClose && (
        <button
          type="button"
          aria-label={t("dismiss")}
          onClick={onClose}
          className="-me-1 flex size-6 shrink-0 items-center justify-center rounded-md opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current/40 [&_svg]:size-4"
        >
          <XIcon aria-hidden />
        </button>
      )}
    </div>
  )
}

export { Banner, type BannerProps, type BannerVariant, type BannerColor }
