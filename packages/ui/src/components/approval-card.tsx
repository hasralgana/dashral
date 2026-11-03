"use client"

import * as React from "react"
import { CircleCheck, CircleX, ShieldAlert, TriangleAlert } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { Button } from "./button"

/** "pending" waits for a decision; "approved" (once), "always" (for the rest of the conversation) or "denied" after. */
type ApprovalStatus = "pending" | "approved" | "always" | "denied"

type ApprovalDetail = { label: React.ReactNode; value: React.ReactNode }

type ApprovalCardProps = Omit<React.ComponentProps<"section">, "title" | "children"> & {
  /** What the assistant wants to do, as an action: "Send 3 payment reminders". */
  title: React.ReactNode
  /** Why, or what will happen. */
  description?: React.ReactNode
  /** What exactly it will do: label and value rows ("To", "Northwind, Sagara"), or your own content. */
  details?: ApprovalDetail[] | React.ReactNode
  /** Controlled decision, e.g. from a saved conversation. Uncontrolled, it starts pending and keeps what's chosen. */
  status?: ApprovalStatus
  /** Called with "once" or "always"; while a promise it returns is pending, the button shows it's working. */
  onApprove?: (scope: "once" | "always") => void | Promise<void>
  onDeny?: () => void | Promise<void>
  /** Offers "Always allow" beside "Allow once", for actions the reader may trust for the rest of the conversation. */
  allowAlways?: boolean
  /** An action that can't be undone (deleting, paying): approving it is red. */
  destructive?: boolean
  /** Replaces the shield (or the warning sign when destructive). */
  icon?: React.ReactNode
  /** Your words on the buttons. */
  approveLabel?: string
  denyLabel?: string
  /** Shown on the decided line after the decision, e.g. "Reminders sent". */
  result?: React.ReactNode
  classNames?: { details?: string; actions?: string }
}

const isRows = (value: unknown): value is ApprovalDetail[] =>
  Array.isArray(value) && value.every((row) => typeof row === "object" && row !== null && "label" in row && "value" in row)

/**
 * The assistant asking before it acts: what it wants to do, exactly what that means, and Approve or Deny (with
 * "Always allow" if you offer it). Once decided it folds into one line that says what was chosen.
 */
function ApprovalCard({
  title,
  description,
  details,
  status: statusProp,
  onApprove,
  onDeny,
  allowAlways = false,
  destructive = false,
  icon,
  approveLabel,
  denyLabel,
  result,
  className,
  classNames,
  ...props
}: ApprovalCardProps) {
  const { t } = useLocale()
  const titleId = React.useId()
  const [ownStatus, setOwnStatus] = React.useState<ApprovalStatus>("pending")
  const status = statusProp ?? ownStatus
  const [busy, setBusy] = React.useState<"once" | "always" | "deny" | null>(null)

  async function decide(choice: "once" | "always" | "deny") {
    setBusy(choice)
    try {
      await (choice === "deny" ? onDeny?.() : onApprove?.(choice))
      if (statusProp === undefined) setOwnStatus(choice === "deny" ? "denied" : choice === "always" ? "always" : "approved")
    } finally {
      setBusy(null)
    }
  }

  const decided = status !== "pending"
  const denied = status === "denied"
  const decision = denied ? t("denied") : status === "always" ? t("alwaysAllowed") : t("approved")

  // The buttons go when it's decided: keep the keyboard on the card instead of losing focus to the page.
  const root = React.useRef<HTMLElement>(null)
  const hadFocus = React.useRef(false)
  React.useEffect(() => {
    if (decided && hadFocus.current) root.current?.focus()
  }, [decided])

  const DecidedIcon = denied ? CircleX : CircleCheck

  return (
    <section
      ref={root}
      data-slot="approval-card"
      data-status={status}
      aria-labelledby={titleId}
      tabIndex={decided ? -1 : undefined}
      onFocusCapture={() => (hadFocus.current = !decided)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) hadFocus.current = false
      }}
      className={cn(
        "rounded-xl border bg-card text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        decided ? "flex items-center gap-2.5 px-3.5 py-2.5" : cn("overflow-hidden shadow-xs", destructive ? "border-destructive/30" : "border-primary/25"),
        className
      )}
      {...props}
    >
      {/* There from the start, so the decision is heard when it's made. */}
      <span role="status" className="sr-only">
        {decided ? decision : ""}
      </span>
      {decided ? (
        <>
          <DecidedIcon aria-hidden className={cn("size-4 shrink-0", denied ? "text-muted-foreground" : "text-success-text")} />
          <span id={titleId} className="min-w-0 flex-1 truncate font-medium" dir="auto">
            {title}
          </span>
          <span aria-hidden className={cn("shrink-0 text-xs", denied ? "text-muted-foreground" : "text-success-text")}>
            {result ?? decision}
          </span>
        </>
      ) : (
        <>
          <div className="flex gap-3 p-4">
            <span
              aria-hidden
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-lg",
                destructive ? "bg-destructive/10 text-destructive-text" : "bg-primary/10 text-primary-text"
              )}
            >
              {icon ?? (destructive ? <TriangleAlert className="size-4" /> : <ShieldAlert className="size-4" />)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">{t("needsApproval")}</p>
              <h3 id={titleId} className="mt-0.5 font-medium" dir="auto">
                {title}
              </h3>
              {description && (
                <p className="mt-1 text-muted-foreground" dir="auto">
                  {description}
                </p>
              )}
              {details !== undefined &&
                (isRows(details) ? (
                  <dl className={cn("mt-3 grid gap-x-4 gap-y-1.5 rounded-lg border bg-muted/40 px-3 py-2.5 sm:grid-cols-[auto_1fr]", classNames?.details)}>
                    {details.map((row, index) => (
                      <React.Fragment key={index}>
                        <dt className="text-xs text-muted-foreground sm:pt-px">{row.label}</dt>
                        <dd className="min-w-0 font-medium [overflow-wrap:anywhere] max-sm:mb-1" dir="auto">
                          {row.value}
                        </dd>
                      </React.Fragment>
                    ))}
                  </dl>
                ) : (
                  <div className={cn("mt-3", classNames?.details)}>{details}</div>
                ))}
            </div>
          </div>
          <div className={cn("flex flex-wrap justify-end gap-2 border-t bg-muted/30 px-4 py-3", classNames?.actions)}>
            <Button variant="outline" size="sm" onClick={() => decide("deny")} loading={busy === "deny"} disabled={busy !== null && busy !== "deny"}>
              {denyLabel ?? t("deny")}
            </Button>
            {allowAlways && (
              <Button variant="outline" size="sm" onClick={() => decide("always")} loading={busy === "always"} disabled={busy !== null && busy !== "always"}>
                {t("allowAlways")}
              </Button>
            )}
            <Button
              size="sm"
              color={destructive ? "destructive" : "primary"}
              onClick={() => decide("once")}
              loading={busy === "once"}
              disabled={busy !== null && busy !== "once"}
            >
              {approveLabel ?? (allowAlways ? t("allowOnce") : t("approve"))}
            </Button>
          </div>
        </>
      )}
    </section>
  )
}

export { ApprovalCard, type ApprovalCardProps, type ApprovalStatus, type ApprovalDetail }
