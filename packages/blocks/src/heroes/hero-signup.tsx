"use client"

import { useState } from "react"
import { ArrowRight, Check, Mail, Quote, Star } from "lucide-react"
import { Avatar, AvatarGroup } from "@dashral/ui/components/avatar"
import { Button } from "@dashral/ui/components/button"
import { Input } from "@dashral/ui/components/input"
import { enterMotion, stagger } from "@dashral/ui/lib/motion"
import { cn } from "@dashral/ui/lib/utils"

// Sample portraits from randomuser.me: replace with your customers.
const sampleCustomers = [
  { name: "Olivia Martin", src: "https://randomuser.me/api/portraits/women/44.jpg" },
  { name: "Liam Johnson", src: "https://randomuser.me/api/portraits/men/32.jpg" },
  { name: "Sofia Davis", src: "https://randomuser.me/api/portraits/women/68.jpg" },
  { name: "Noah Williams", src: "https://randomuser.me/api/portraits/men/75.jpg" },
  { name: "Ava Chen", src: "https://randomuser.me/api/portraits/women/12.jpg" },
]

export type HeroSignupProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  /** The button's words. */
  cta?: string
  /**
   * Your sign-up, with the address once it looks right. Resolve to say it's done; throw an Error to show its message
   * under the field. Without it, the hero plays a sample.
   */
  onSubmit?: (email: string) => Promise<void> | void
  /** What it says once you're in, with the address. */
  done?: (email: string) => React.ReactNode
  /** The people already in, their rating and how many; no customers hides the row. */
  customers?: { name: string; src?: string }[]
  rating?: { score: number; label: string }
  /** A customer's words beside it, with up to two figures under them; none hides the card. */
  quote?: { text: string; name: string; role: string; src?: string; facts?: { label: string; value: React.ReactNode }[] } | null
}

/**
 * A sign-up hero: the promise and an email field that answers (it checks the address, shows it's working, then
 * confirms), the people already in, and a customer's words beside it. Every part comes from props; point `onSubmit`
 * at your own sign-up.
 */
export function HeroSignup({
  title = "Stop chasing numbers. Start acting on them.",
  description = "One dashboard for sales, product and support. Join the early access list and get the first month free.",
  cta = "Get early access",
  onSubmit,
  done = (email) => (
    <>
      You’re on the list. We sent a confirmation to <span className="font-medium">{email}</span>.
    </>
  ),
  customers = sampleCustomers,
  rating = { score: 4.9, label: "from 2,400+ teams" },
  quote = {
    text: "We replaced four spreadsheets and a weekly reporting meeting. Now everyone just opens Acme — and the numbers agree for the first time.",
    name: "Sofia Davis",
    role: "Head of Operations, Northwind",
    src: "https://randomuser.me/api/portraits/women/68.jpg",
    facts: [
      {
        label: "Time on reports",
        value: (
          <>
            −6 h<span className="text-sm font-normal text-muted-foreground"> / week</span>
          </>
        ),
      },
      { label: "Set up in", value: "1 day" },
    ],
  },
}: HeroSignupProps) {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "done">("idle")
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter an email address like you@company.com")
      return
    }
    setError(null)
    setState("sending")
    if (!onSubmit) {
      window.setTimeout(() => setState("done"), 900)
      return
    }
    try {
      await onSubmit(email.trim())
      setState("done")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't sign you up. Try again.")
      setState("idle")
    }
  }

  return (
    <section className="relative isolate overflow-hidden bg-background px-4 py-16 sm:px-6 sm:py-24">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(40%_50%_at_15%_20%,color-mix(in_oklch,var(--gradient-via)_14%,transparent),transparent),radial-gradient(35%_45%_at_90%_80%,color-mix(in_oklch,var(--gradient-to)_14%,transparent),transparent)]"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
        <div>
          <h1 className={cn(enterMotion, "text-4xl leading-[1.06] font-semibold tracking-[-0.04em] text-balance sm:text-6xl")} style={stagger(0, 80)}>
            {title}
          </h1>
          {description && (
            <p className={cn(enterMotion, "mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg")} style={stagger(1, 80)}>
              {description}
            </p>
          )}

          <div className={cn(enterMotion, "mt-8 max-w-md")} style={stagger(2, 80)}>
            {state === "done" ? (
              <p role="status" className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm animate-in fade-in-0 zoom-in-95 duration-(--duration-standard) ease-spring">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-success text-success-foreground">
                  <Check className="size-3.5" aria-hidden />
                </span>
                <span>{done(email.trim())}</span>
              </p>
            ) : (
              <form onSubmit={submit} noValidate className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="email"
                  aria-label="Work email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  prefix={<Mail className="size-4" aria-hidden />}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  error={error ?? undefined}
                  className="h-11 sm:flex-1"
                  classNames={{ root: "sm:flex-1" }}
                />
                <Button type="submit" size="lg" className="h-11" loading={state === "sending"}>
                  {cta} <ArrowRight aria-hidden />
                </Button>
              </form>
            )}
          </div>

          {customers.length > 0 && (
            <div className={cn(enterMotion, "mt-8 flex items-center gap-4")} style={stagger(3, 80)}>
              <AvatarGroup items={customers} size="md" />
              <div className="text-sm">
                <div className="flex items-center gap-0.5 text-warning" aria-label={`Rated ${rating.score} out of 5`}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className={cn("size-3.5", i < Math.round(rating.score) ? "fill-current" : "opacity-30")} aria-hidden />
                  ))}
                  <span className="ms-1.5 font-medium text-foreground">{rating.score}</span>
                </div>
                <p className="text-muted-foreground">{rating.label}</p>
              </div>
            </div>
          )}
        </div>

        {quote && (
          <figure className={cn(enterMotion, "relative rounded-2xl border bg-card p-6 shadow-[0_24px_60px_-28px_rgb(0_0_0/0.3)] sm:p-8 dark:shadow-[0_24px_60px_-28px_rgb(0_0_0/0.8)]")} style={stagger(2, 80)}>
            <Quote className="size-8 text-primary/30" aria-hidden />
            <blockquote className="mt-4 text-lg leading-relaxed text-pretty">“{quote.text}”</blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <Avatar name={quote.name} src={quote.src} size="lg" />
              <div>
                <p className="text-sm font-medium">{quote.name}</p>
                <p className="text-sm text-muted-foreground">{quote.role}</p>
              </div>
            </figcaption>
            {quote.facts && quote.facts.length > 0 && (
              <dl className="mt-6 grid grid-cols-2 gap-4 border-t pt-6">
                {quote.facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                    <dd className="mt-1 text-2xl font-semibold tracking-tight">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </figure>
        )}
      </div>
    </section>
  )
}
