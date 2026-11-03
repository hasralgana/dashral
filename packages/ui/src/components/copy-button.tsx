"use client"

import * as React from "react"
import { Check, Copy, X } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { Button, type ButtonColor, type ButtonVariant } from "./button"
import { Tooltip } from "./tooltip"

type CopyState = "idle" | "copied" | "failed"

/** Writes text to the clipboard; where the Clipboard API is missing or refused (plain http, an iframe without permission), a hidden textarea and execCommand. */
async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement("textarea")
    area.value = text
    area.setAttribute("readonly", "")
    area.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none"
    document.body.append(area)
    area.select()
    const done = document.execCommand("copy")
    area.remove()
    return done
  }
}

type CopyButtonProps = Omit<React.ComponentProps<"button">, "color" | "value" | "children" | "onCopy"> & {
  /** The text it copies. */
  value: string
  /** A word beside the icon ("Copy link"); it reads "Copied" for a moment after. Without it, an icon button with a tooltip. */
  label?: string
  /** How much it stands out, as on Button. Ghost by default. */
  variant?: ButtonVariant
  color?: ButtonColor
  /** sm or default with a label; icon-sm (default) or icon without. */
  size?: "sm" | "default" | "icon-sm" | "icon"
  /** The tooltip on an icon button, before copying. Defaults to "Copy". */
  tooltip?: string
  /** Milliseconds the check (or the failure) stays before it's ready again. */
  timeout?: number
  /** Runs after a copy, e.g. to show a toast. */
  onCopy?: (value: string) => void
}

/**
 * Copies `value` in one tag: `<CopyButton value={apiKey} />`. The copy icon blurs into a check, the tooltip (or the
 * label) says "Copied", and screen readers hear it; if the browser refuses, an × and "Couldn't copy". Variant, color
 * and size work as on Button, so it fits a code block, an input's suffix or a row of actions.
 */
function CopyButton({
  value,
  label,
  variant = "ghost",
  color,
  size,
  tooltip,
  timeout = 2000,
  onCopy,
  onClick,
  className,
  ...props
}: CopyButtonProps) {
  const { t } = useLocale()
  const [state, setState] = React.useState<CopyState>("idle")
  const [hover, setHover] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  React.useEffect(() => () => clearTimeout(timer.current), [])

  async function copy(event: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(event)
    if (event.defaultPrevented) return
    const done = await writeClipboard(value)
    setState(done ? "copied" : "failed")
    if (done) onCopy?.(value)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState("idle"), timeout)
  }

  const said = state === "copied" ? t("copied") : state === "failed" ? t("copyFailed") : (label ?? tooltip ?? t("copy"))
  // The three icons share one spot; the ones not in use are blurred, shrunk and transparent.
  const icon = (shown: boolean) =>
    cn(
      "absolute inset-0 transition-[opacity,filter,scale] duration-(--duration-standard) ease-spring motion-reduce:transition-opacity",
      shown ? "scale-100 opacity-100 blur-none" : "scale-50 opacity-0 blur-[2px]"
    )

  const button = (
    <Button
      data-slot="copy-button"
      type="button"
      variant={variant}
      color={color}
      size={size ?? (label ? "sm" : "icon-sm")}
      onClick={copy}
      aria-label={label ? undefined : said}
      className={cn(variant === "ghost" && !color && "text-muted-foreground hover:text-foreground", className)}
      {...props}
    >
      <span aria-hidden className="relative size-4">
        <Copy className={icon(state === "idle")} />
        <Check className={cn(icon(state === "copied"), "text-success-text")} />
        <X className={cn(icon(state === "failed"), "text-destructive-text")} />
      </span>
      {label && <span>{said}</span>}
    </Button>
  )

  return (
    <>
      {label ? (
        button
      ) : (
        // Open while hovered or focused, and through the "Copied" that follows a click (which would otherwise close it).
        <Tooltip content={said} open={hover || state !== "idle"} onOpenChange={setHover}>
          {button}
        </Tooltip>
      )}
      {/* Says what happened: the label or tooltip changes too, but a screen reader only hears a live region. Outside
          the button, so it isn't part of the button's name. */}
      <span role="status" className="sr-only">
        {state === "idle" ? "" : said}
      </span>
    </>
  )
}

export { CopyButton, type CopyButtonProps }
