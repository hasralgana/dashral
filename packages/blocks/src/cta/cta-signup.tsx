"use client"

import { useState } from "react"
import { ArrowRight, Bell, Check, MailCheck, TrendingUp } from "lucide-react"
import { Button } from "@dashral/ui/components/button"
import { Input } from "@dashral/ui/components/input"
import { Sparkline } from "@dashral/ui/components/sparkline"
import { Spinner } from "@dashral/ui/components/spinner"

export type CtaSignupProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  /** The button's words. */
  cta?: string
  /**
   * Your sign-up, with the address once it looks right. Resolve to show "check your inbox"; throw an Error to show its
   * message under the field. Without it, the card plays a sample.
   */
  onSubmit?: (email: string) => Promise<void> | void
  /** What you get, one line each. */
  points?: string[]
  /** The product in miniature beside it: a figure with its trend, a sparkline, three small figures and a note. */
  preview?: {
    label: string
    value: string
    change: string
    series: number[]
    figures: { label: string; value: string }[]
    note?: string
  }
}

/**
 * A call to action that starts the sign-up right there: the promise and what you get beside the product itself, with
 * an email field. A wrong address says so; a right one turns into "check your inbox". Every part comes from props;
 * point `onSubmit` at your own sign-up.
 */
export function CtaSignup({
  title = "Your numbers, ready before your coffee is.",
  description = "Start with your email. We'll set up a workspace with sample data you can explore right away.",
  cta = "Get started",
  onSubmit,
  points = ["Ready-made dashboards for sales, marketing and support", "Alerts when a number moves", "Invite your whole team, free"],
  preview = {
    label: "Revenue · last 12 weeks",
    value: "$62,480",
    change: "18.2%",
    series: [32, 34, 33, 38, 41, 39, 45, 48, 47, 53, 58, 62],
    figures: [
      { label: "Orders", value: "1,284" },
      { label: "Customers", value: "312" },
      { label: "Refunds", value: "1.8%" },
    ],
    note: "Signups up 38% since 9 AM",
  },
}: CtaSignupProps) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle")

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter an email address like you@company.com.")
    setError(null)
    setState("sending")
    try {
      if (onSubmit) await onSubmit(email.trim())
      else await new Promise((resolve) => setTimeout(resolve, 700))
      setState("sent")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't sign you up. Try again.")
      setState("idle")
    }
  }

  return (
    <section className="bg-background p-4 sm:p-6">
      <div className="mx-auto grid items-center gap-12 overflow-hidden rounded-3xl border bg-card p-6 shadow-xs sm:p-10 lg:grid-cols-2 lg:gap-16 lg:p-14">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
          {description && <p className="mt-4 max-w-md text-pretty text-muted-foreground">{description}</p>}

          <div className="mt-8 max-w-md" aria-live="polite">
            {state === "sent" ? (
              <div className="flex items-start gap-3 rounded-xl border bg-success/8 p-4 animate-in fade-in-0 duration-(--duration-standard)">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success-text">
                  <MailCheck aria-hidden className="size-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium">Check your inbox</p>
                  <p className="mt-0.5 text-sm break-words text-muted-foreground">
                    We sent a link to <span className="font-medium text-foreground">{email.trim()}</span>. It works for 24 hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => setState("idle")}
                    className="mt-2 rounded-sm text-sm font-medium text-primary-text underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    Use another email
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="flex flex-col gap-2 sm:flex-row sm:items-start">
                {/* The field keeps its width when its error shows under it. */}
                <div className="sm:flex-1">
                  <Input
                    type="email"
                    aria-label="Work email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      if (error) setError(null)
                    }}
                    error={error ?? undefined}
                    classNames={{ input: "h-10" }}
                  />
                </div>
                <Button type="submit" size="lg" disabled={state === "sending"} className="group shrink-0">
                  {state === "sending" ? <Spinner /> : null}
                  {cta}
                  {state !== "sending" && (
                    <ArrowRight
                      aria-hidden
                      className="transition-transform duration-(--duration-fast) group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                    />
                  )}
                </Button>
              </form>
            )}
          </div>

          {points.length > 0 && (
            <ul className="mt-8 space-y-2.5 text-sm">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary-text">
                    <Check aria-hidden className="size-3" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* The product in miniature: decoration, so it's hidden from screen readers. */}
        <div aria-hidden className="relative isolate">
          <div className="absolute -inset-8 -z-10 rounded-full bg-primary/15 blur-3xl" />
          <div className="rounded-2xl border bg-background p-5 pb-12 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{preview.label}</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{preview.value}</p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-xs font-medium text-success-text">
                <TrendingUp className="size-3.5" /> {preview.change}
              </span>
            </div>
            <Sparkline data={preview.series} variant="area" showLast className="mt-6 h-28 text-primary" />
            <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-4 text-sm">
              {preview.figures.map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-0.5 font-medium tabular-nums">{value}</p>
                </div>
              ))}
            </div>
          </div>
          {preview.note && (
            <div className="absolute -bottom-5 start-4 flex items-center gap-2.5 rounded-xl border bg-background px-3 py-2 text-sm shadow-md sm:start-8">
              <span className="flex size-7 items-center justify-center rounded-full bg-warning/18 text-warning-text">
                <Bell className="size-3.5" />
              </span>
              {preview.note}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
