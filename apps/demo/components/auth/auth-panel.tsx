"use client"

import { useEffect, useState } from "react"
import { BellRing, Check } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Avatar } from "@dashral/ui/components/avatar"
import { Sparkline } from "@dashral/ui/components/sparkline"
import { reducedMotion } from "@dashral/ui/lib/motion"
import { cn } from "@dashral/ui/lib/utils"

import { localeInfo, moneyLocale, type Locale } from "@/lib/i18n"

const points = ["sources", "live", "alerts"] as const

const people = [
  { id: "liam", name: "Liam Johnson", src: "https://randomuser.me/api/portraits/men/32.jpg" },
  { id: "sofia", name: "Sofia Davis", src: "https://randomuser.me/api/portraits/women/68.jpg" },
  { id: "budi", name: "Budi Santoso", src: "https://randomuser.me/api/portraits/men/75.jpg" },
] as const

/**
 * Customers' words, one at a time: the next fades in every six seconds, and the dots pick one. It holds still while
 * the pointer or focus is on it, and doesn't move on its own with reduced motion. All quotes share one grid cell,
 * so the panel never jumps to a new height.
 */
function Testimonials() {
  const t = useTranslations("auth.panel")
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || reducedMotion()) return
    const timer = setTimeout(() => setCurrent((i) => (i + 1) % people.length), 6000)
    return () => clearTimeout(timer)
  }, [current, paused])

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t("testimonials")}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="grid">
        {people.map((person, i) => (
          <figure
            key={person.id}
            aria-roledescription="slide"
            aria-label={t("slide", { index: i + 1, total: people.length })}
            aria-hidden={i !== current}
            className={cn(
              "col-start-1 row-start-1 transition-[opacity,translate,filter] duration-(--duration-considered) ease-standard motion-reduce:transition-none",
              i === current ? "translate-y-0 opacity-100 blur-0" : "pointer-events-none translate-y-1 opacity-0 blur-[2px]"
            )}
          >
            <blockquote className="text-2xl leading-snug font-medium tracking-tight text-balance">“{t(`quotes.${person.id}.quote`)}”</blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <Avatar src={person.src} name={person.name} alt="" />
              <span className="grid text-sm">
                <span className="font-semibold">{person.name}</span>
                <span className="text-(--wash-muted)">{t(`quotes.${person.id}.role`)}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-8 -ms-1 flex items-center gap-1">
        {people.map((person, i) => (
          <button
            key={person.id}
            type="button"
            aria-label={t("show", { name: person.name })}
            aria-current={i === current || undefined}
            onClick={() => setCurrent(i)}
            className="grid h-6 place-items-center rounded-full px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span
              className={cn(
                "block h-1.5 rounded-full transition-[width,background-color] duration-(--duration-considered) ease-standard",
                i === current ? "w-6 bg-primary" : "w-1.5 bg-(--wash-muted)/30 hover:bg-(--wash-muted)/55 dark:bg-white/25 dark:hover:bg-white/45"
              )}
            />
          </button>
        ))}
      </div>
    </section>
  )
}

/**
 * The side of the sign-in pages on wide screens, in a wash of the primary's gradient (--gradient-*: sky, blue and
 * indigo by default, the chosen color's own neighbors otherwise) pooling at the edges over a faintly tinted base, and a
 * faint grid; what you get, the product in miniature, and customers' words that take turns.
 */
export function AuthPanel() {
  const t = useTranslations("auth.panel")
  const locale = useLocale() as Locale
  const intl = localeInfo[locale].intl
  const money = new Intl.NumberFormat(moneyLocale(locale), { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(48290)
  const percent = (value: number, sign = false) =>
    new Intl.NumberFormat(intl, { style: "percent", maximumFractionDigits: 1, signDisplay: sign ? "always" : "auto" }).format(value)

  return (
    <aside
      className={cn(
        "relative isolate hidden flex-col justify-between overflow-hidden border-s p-12 text-(--wash-ink) lg:flex",
        // Light: the gradient's hues lifted toward white over a base barely tinted by the color; text in its ink, near black.
        "[--wash-base:color-mix(in_oklab,var(--gradient-via)_4%,white)] [--wash-blue:color-mix(in_oklab,var(--gradient-via)_55%,white)] [--wash-grid:color-mix(in_oklab,var(--primary)_7%,transparent)] [--wash-indigo:color-mix(in_oklab,var(--gradient-to)_45%,white)] [--wash-ink:color-mix(in_oklab,var(--gradient-ink)_30%,oklch(0.2_0_0))] [--wash-muted:color-mix(in_oklab,var(--gradient-ink)_25%,oklch(0.45_0_0))] [--wash-sky:color-mix(in_oklab,var(--gradient-from)_50%,white)]",
        // Dark: the same hues sunk toward black.
        "dark:[--wash-base:color-mix(in_oklab,var(--gradient-via)_8%,oklch(0.15_0_0))] dark:[--wash-blue:color-mix(in_oklab,var(--gradient-via)_55%,oklch(0.12_0_0))] dark:[--wash-grid:color-mix(in_oklab,var(--primary-text)_8%,transparent)] dark:[--wash-indigo:color-mix(in_oklab,var(--gradient-to)_45%,oklch(0.12_0_0))] dark:[--wash-ink:oklch(0.97_0_0)] dark:[--wash-muted:color-mix(in_oklab,var(--gradient-ink)_30%,oklch(0.75_0_0))] dark:[--wash-sky:color-mix(in_oklab,var(--gradient-from)_45%,oklch(0.12_0_0))]"
      )}
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
      <ul aria-label={t("label")} className="grid gap-3 text-sm">
        {points.map((point) => (
          <li key={point} className="flex items-center gap-3">
            <span className="grid size-5 place-items-center rounded-full bg-primary/15 text-primary-text">
              <Check className="size-3" aria-hidden />
            </span>
            {t(`points.${point}`)}
          </li>
        ))}
      </ul>

      {/* The dashboard in miniature. */}
      <div aria-hidden className="relative mx-auto w-full max-w-sm">
        <div className="rounded-2xl border bg-card/80 p-5 text-card-foreground shadow-[0_24px_60px_-24px_rgb(30_41_90/0.35)] backdrop-blur-sm dark:shadow-[0_24px_60px_-24px_rgb(0_0_0/0.8)]">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">{t("metric")}</span>
            <span className="text-xs font-medium text-success-text">{percent(0.125, true)}</span>
          </div>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] tabular-nums">{money}</p>
          <Sparkline data={[31, 34, 33, 38, 36, 41, 40, 44, 43, 47, 46, 52]} variant="area" showLast className="mt-3 h-16 text-primary" />
        </div>
        <div className="absolute -end-6 -bottom-6 flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2 text-xs text-card-foreground shadow-lg">
          <span className="grid size-7 place-items-center rounded-lg bg-warning/15 text-warning-text">
            <BellRing className="size-3.5" />
          </span>
          <span>{t("alert", { value: percent(0.38) })}</span>
        </div>
      </div>

      <Testimonials />
    </aside>
  )
}
