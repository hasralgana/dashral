"use client"

import { useEffect, useState } from "react"
import { BellRing, Check, Sparkles } from "lucide-react"
import { Avatar } from "@dashral/ui/components/avatar"
import { Button } from "@dashral/ui/components/button"
import { Checkbox } from "@dashral/ui/components/checkbox"
import { Input } from "@dashral/ui/components/input"
import { Sparkline } from "@dashral/ui/components/sparkline"
import { reducedMotion } from "@dashral/ui/lib/motion"
import { cn } from "@dashral/ui/lib/utils"

export type PasswordRule = { label: string; test: (value: string) => boolean }
export type Testimonial = { quote: string; name: string; role: string; src?: string }
export type SignUpValues = { firstName: string; lastName: string; email: string; password: string }

const sampleRules: PasswordRule[] = [
  { label: "8+ characters", test: (v: string) => v.length >= 8 },
  { label: "A number", test: (v: string) => /\d/.test(v) },
  { label: "A capital letter", test: (v: string) => /[A-Z]/.test(v) },
]

const sampleTestimonials: Testimonial[] = [
  { quote: "We set it up on a Tuesday. By Friday the whole company had it open.", name: "Liam Johnson", role: "Engineering Manager, Globex", src: "https://randomuser.me/api/portraits/men/32.jpg" },
  { quote: "Our Monday meeting used to start with arguing about numbers. Now it starts with decisions.", name: "Sofia Davis", role: "Head of Growth, Initech", src: "https://randomuser.me/api/portraits/women/68.jpg" },
  { quote: "I replaced four spreadsheets and a weekly export with one link I send to the board.", name: "Budi Santoso", role: "Finance Lead, Umbrella", src: "https://randomuser.me/api/portraits/men/75.jpg" },
]

/**
 * Customers' words, one at a time: the next fades in every six seconds, and the dots pick one. It holds still while
 * the pointer or focus is on it, and doesn't move on its own with reduced motion. All quotes share one grid cell,
 * so the panel never jumps to a new height.
 */
function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || reducedMotion()) return
    const timer = setTimeout(() => setCurrent((i) => (i + 1) % testimonials.length), 6000)
    return () => clearTimeout(timer)
  }, [current, paused, testimonials.length])

  return (
    <section
      aria-roledescription="carousel"
      aria-label="What customers say"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="grid">
        {testimonials.map((t, i) => (
          <figure
            key={t.name}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${testimonials.length}`}
            aria-hidden={i !== current}
            className={cn(
              "col-start-1 row-start-1 transition-[opacity,translate,filter] duration-(--duration-considered) ease-standard motion-reduce:transition-none",
              i === current ? "translate-y-0 opacity-100 blur-0" : "pointer-events-none translate-y-1 opacity-0 blur-[2px]"
            )}
          >
            <blockquote className="text-2xl leading-snug font-medium tracking-tight text-balance">“{t.quote}”</blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <Avatar src={t.src} name={t.name} alt="" />
              <span className="grid text-sm">
                <span className="font-semibold">{t.name}</span>
                <span className="text-muted-foreground">{t.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-8 -ms-1 flex items-center gap-1">
        {testimonials.map((t, i) => (
          <button
            key={t.name}
            type="button"
            aria-label={`Show ${t.name}'s words`}
            aria-current={i === current || undefined}
            onClick={() => setCurrent(i)}
            className="grid h-6 place-items-center rounded-full px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span
              className={cn(
                "block h-1.5 rounded-full transition-[width,background-color] duration-(--duration-considered) ease-standard",
                i === current ? "w-6 bg-primary" : "w-1.5 bg-foreground/25 hover:bg-foreground/45"
              )}
            />
          </button>
        ))}
      </div>
    </section>
  )
}

/**
 * Sign-up as a split screen: the form on one side — name, work email, a password with a strength meter and its
 * rules, the terms — and on the other a brand panel in a soft wash of the theme's gradient with what you get, the product in
 * miniature and customers' words that take turns. The panel hides on phones. Every part comes from props; point
 * `onSubmit` at your auth.
 */
export type SignUpSplitProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  /**
   * Your sign-up, once every rule is met and the terms agreed to. Resolve to show `done`; throw an Error to show its
   * message above the button. Without it, the form plays a sample.
   */
  onSubmit?: (values: SignUpValues) => Promise<void> | void
  /** What it says once the account is made. */
  done?: React.ReactNode
  /** The password's rules: one meter segment fills per rule met. */
  rules?: PasswordRule[]
  /** Where the terms, the privacy policy and "Sign in" go; no signInHref hides the line. */
  termsHref?: string
  privacyHref?: string
  signInHref?: string
  /** The brand panel beside the form (hidden on phones): what you get, the product in miniature, customers' words; null hides it. */
  panel?: {
    points?: string[]
    preview?: { label: string; value: string; change: string; series: number[]; note?: React.ReactNode } | null
    testimonials?: Testimonial[]
  } | null
}

export function SignUpSplit({
  title = "Create your account",
  description = "Free for 14 days. No card needed.",
  onSubmit,
  done: doneText = "Check your inbox to confirm your email.",
  rules = sampleRules,
  termsHref = "#",
  privacyHref = "#",
  signInHref = "#",
  panel = {},
}: SignUpSplitProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [tried, setTried] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const passed = rules.filter((r) => r.test(password)).length
  const points = panel?.points ?? ["Every source in one place", "Live dashboards the whole team opens", "Alerts when something changes"]
  const preview =
    panel?.preview === undefined
      ? {
          label: "Revenue · 30 days",
          value: "$48,290",
          change: "+12.5%",
          series: [31, 34, 33, 38, 36, 41, 40, 44, 43, 47, 46, 52],
          note: (
            <>
              Signups up <span className="font-semibold">38%</span> since 9 AM
            </>
          ),
        }
      : panel.preview
  const testimonials = panel?.testimonials ?? sampleTestimonials

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setTried(true)
    if (passed < rules.length || !agreed) return
    if (!onSubmit) return setDone(true)
    setError(null)
    setSending(true)
    try {
      await onSubmit({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password })
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create your account. Try again.")
    } finally {
      setSending(false)
    }
  }
  const fill = passed <= 1 ? "bg-destructive" : passed === 2 ? "bg-warning" : "bg-success"

  return (
    <section className={cn("grid min-h-svh bg-background", panel && "lg:grid-cols-2")}>
      <div className="flex items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-sm">
          <span aria-hidden className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </span>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}

          {done ? (
            <p role="status" className="mt-8 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-3 text-sm text-success-text">
              <Check className="size-4" aria-hidden /> {doneText}
            </p>
          ) : (
            <form noValidate className="mt-8 grid gap-4" onSubmit={submit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="First name" autoComplete="given-name" placeholder="Olivia" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <Input label="Last name" autoComplete="family-name" placeholder="Martin" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <Input label="Work email" type="email" autoComplete="email" placeholder="olivia@acme.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <div className="grid gap-2">
                <Input
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={tried && passed < rules.length ? (rules.length === 1 ? "Meet the rule below." : `Meet all ${rules.length} rules below.`) : undefined}
                />
                {/* Neutral until you type; one segment fills per rule met. */}
                <div aria-hidden className="grid grid-cols-[repeat(var(--count),minmax(0,1fr))] gap-1.5" style={{ "--count": rules.length } as React.CSSProperties}>
                  {rules.map((rule, i) => (
                    <span key={rule.label} className={cn("h-1 rounded-full transition-colors duration-(--duration-standard)", i < passed ? fill : "bg-muted")} />
                  ))}
                </div>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {rules.map((rule) => {
                    const met = rule.test(password)
                    return (
                      <li key={rule.label} className={cn("flex items-center gap-1 transition-colors", met && "text-foreground")}>
                        <Check className={cn("size-3", met ? "text-success-text" : "opacity-30")} aria-hidden />
                        {rule.label}
                        <span className="sr-only">{met ? "(done)" : "(not yet)"}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
              <Checkbox
                label={
                  // One span: the label lays its parts out in a row, and this sentence is one part.
                  <span>
                    I agree to the{" "}
                    <a href={termsHref} className="font-medium text-primary-text underline-offset-4 hover:underline">
                      terms
                    </a>{" "}
                    and{" "}
                    <a href={privacyHref} className="font-medium text-primary-text underline-offset-4 hover:underline">
                      privacy policy
                    </a>
                  </span>
                }
                checked={agreed}
                onCheckedChange={(on) => setAgreed(on === true)}
                error={tried && !agreed ? "Agree to continue." : undefined}
              />
              {error && (
                <p role="alert" className="text-sm text-destructive-text">
                  {error}
                </p>
              )}
              <Button type="submit" loading={sending}>
                Create account
              </Button>
              {signInHref && (
                <p className="text-center text-sm text-muted-foreground">
                  Already have one?{" "}
                  <a href={signInHref} className="font-medium text-primary-text underline-offset-4 hover:underline">
                    Sign in
                  </a>
                </p>
              )}
            </form>
          )}
        </div>
      </div>

      {/* The brand panel in the theme's gradient wash (--gradient-*): its three colors pooling at the edges, a faint grid,
          and the product itself in the middle. */}
      {panel && (
        <aside
          className="relative isolate hidden flex-col justify-between overflow-hidden border-s p-12 text-foreground lg:flex [--wash-base:color-mix(in_oklch,var(--gradient-via)_4%,var(--background))] [--wash-blue:color-mix(in_oklch,var(--gradient-via)_50%,var(--background))] [--wash-grid:color-mix(in_oklch,var(--gradient-via)_8%,transparent)] [--wash-indigo:color-mix(in_oklch,var(--gradient-to)_45%,var(--background))] [--wash-sky:color-mix(in_oklch,var(--gradient-from)_45%,var(--background))]"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 100% 0%, var(--wash-blue), transparent), radial-gradient(ellipse 60% 50% at 0% 100%, var(--wash-sky), transparent), radial-gradient(ellipse 55% 45% at 70% 105%, var(--wash-indigo), transparent), var(--wash-base)",
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_45%,#000_25%,transparent_80%)]"
            style={{
              backgroundImage: "linear-gradient(to right, var(--wash-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--wash-grid) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <ul className="grid gap-3 text-sm">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-3">
                <span className="grid size-5 place-items-center rounded-full bg-primary/15 text-primary-text">
                  <Check className="size-3" aria-hidden />
                </span>
                {point}
              </li>
            ))}
          </ul>

          {/* What you're signing up for, in miniature. */}
          {preview ? (
            <div aria-hidden className="relative mx-auto w-full max-w-sm">
              <div className="rounded-2xl border bg-card/80 p-5 text-card-foreground shadow-[0_24px_60px_-24px_rgb(30_41_90/0.35)] backdrop-blur-sm dark:shadow-[0_24px_60px_-24px_rgb(0_0_0/0.8)]">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">{preview.label}</span>
                  <span className="text-xs font-medium text-success-text">{preview.change}</span>
                </div>
                <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] tabular-nums">{preview.value}</p>
                <Sparkline data={preview.series} variant="area" showLast className="mt-3 h-16 text-primary" />
              </div>
              {preview.note && (
                <div className="absolute -end-6 -bottom-6 flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2 text-xs text-card-foreground shadow-lg">
                  <span className="grid size-7 place-items-center rounded-lg bg-warning/15 text-warning-text">
                    <BellRing className="size-3.5" />
                  </span>
                  <span>{preview.note}</span>
                </div>
              )}
            </div>
          ) : (
            <span />
          )}

          {testimonials.length > 0 ? <Testimonials testimonials={testimonials} /> : <span />}
        </aside>
      )}
    </section>
  )
}
