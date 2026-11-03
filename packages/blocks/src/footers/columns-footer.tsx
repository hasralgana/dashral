"use client"

import { useEffect, useState } from "react"
import { CircleCheck, Moon, Sparkles, Sun } from "lucide-react"
import { Button } from "@dashral/ui/components/button"
import { Input } from "@dashral/ui/components/input"
import { NativeSelect } from "@dashral/ui/components/native-select"
import { SegmentedControl } from "@dashral/ui/components/segmented-control"

export type FooterLink = { label: string; href: string }
export type FooterColumn = { title: string; links: FooterLink[] }
/** A social account: its name and its icon's SVG path (a 24×24 view box). */
export type SocialLink = { label: string; path: string; href?: string }
export type FooterLanguage = { value: string; label: string }

const linksOf = (...labels: string[]): FooterLink[] => labels.map((label) => ({ label, href: "#" }))
const sampleColumns: FooterColumn[] = [
  { title: "Product", links: linksOf("Features", "Integrations", "Pricing", "Changelog", "Roadmap") },
  { title: "Company", links: linksOf("About", "Customers", "Careers", "Press") },
  { title: "Resources", links: linksOf("Docs", "Guides", "Blog", "Community", "Status") },
  { title: "Legal", links: linksOf("Privacy", "Terms", "Security", "Cookies") },
]
const sampleLanguages: FooterLanguage[] = [
  { value: "en", label: "English" },
  { value: "id", label: "Bahasa Indonesia" },
  { value: "ar", label: "العربية" },
]

const sampleSocial: SocialLink[] = [
  {
    label: "GitHub",
    path: "M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z",
  },
  { label: "X", path: "M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.63 7.58H.48l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.5h2.04L6.48 3.24H4.3l13.31 17.41Z" },
  {
    label: "YouTube",
    path: "M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z",
  },
]

/**
 * A full website footer: the brand with its line and social accounts, four columns of links, a newsletter sign-up
 * that checks the address and confirms, and a bottom bar with the copyright, a language select and a light/dark
 * switch. The switch toggles the `dark` class on <html>; pass onThemeChange to use your own (next-themes, say). Every
 * part comes from props; point `onSubscribe` at your newsletter (a thrown Error shows its message under the field).
 */
export function ColumnsFooter({
  brand = { name: "Acme", href: "#" },
  tagline = "Dashboards your team actually opens. Built for people who ship.",
  newsletter = { label: "Product updates, once a month", done: "You're in. The next issue lands on the first Monday." },
  onSubscribe,
  social = sampleSocial,
  columns = sampleColumns,
  copyright,
  languages = sampleLanguages,
  language: languageProp,
  onLanguageChange,
  onThemeChange,
}: {
  brand?: { name: string; href: string; logo?: React.ReactNode }
  tagline?: string
  /** The sign-up's label and what it says once you're in; null hides it. */
  newsletter?: { label: string; done: string } | null
  onSubscribe?: (email: string) => Promise<void> | void
  social?: SocialLink[]
  columns?: FooterColumn[]
  /** The copyright line (© this year and the brand without it). */
  copyright?: string
  /** None hides the select. */
  languages?: FooterLanguage[]
  /** The language picked, by value (the footer keeps it without it). */
  language?: string
  onLanguageChange?: (language: string) => void
  onThemeChange?: (theme: "light" | "dark") => void
}) {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "done">("idle")
  const [error, setError] = useState<string | null>(null)
  const [ownLanguage, setOwnLanguage] = useState(languages[0]?.value ?? "")
  const language = languageProp ?? ownLanguage
  const [theme, setTheme] = useState<"light" | "dark">("light")
  useEffect(() => setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light"), [])

  async function subscribe(event: React.FormEvent) {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter an email like name@company.com.")
    setError(null)
    setState("sending")
    try {
      if (onSubscribe) await onSubscribe(email.trim())
      else await new Promise((resolve) => setTimeout(resolve, 700))
      setState("done")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't subscribe you. Try again.")
      setState("idle")
    }
  }

  function changeTheme(next: "light" | "dark") {
    setTheme(next)
    if (onThemeChange) return onThemeChange(next)
    document.documentElement.classList.toggle("dark", next === "dark")
  }

  const link = "rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_2fr]">
        <div className="grid content-start gap-6">
          <div>
            <a href={brand.href} className="inline-flex items-center gap-2 rounded-md font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              {brand.logo ?? (
                <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="size-4" />
                </span>
              )}
              {brand.name}
            </a>
            {tagline && <p className="mt-3 max-w-xs text-sm text-muted-foreground">{tagline}</p>}
          </div>

          {!newsletter ? null : state === "done" ? (
            <p role="status" className="flex max-w-sm items-center gap-2 rounded-lg bg-success/10 px-3 py-2.5 text-sm text-success-text animate-in fade-in-0 duration-(--duration-standard)">
              <CircleCheck className="size-4 shrink-0" aria-hidden /> {newsletter.done}
            </p>
          ) : (
            <form noValidate onSubmit={subscribe} className="grid max-w-sm gap-2">
              <label htmlFor="footer-email" className="text-sm font-medium">
                {newsletter.label}
              </label>
              <div className="flex gap-2">
                <Input
                  id="footer-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                  }}
                  aria-invalid={!!error || undefined}
                  aria-describedby={error ? "footer-email-error" : undefined}
                  className="flex-1"
                />
                <Button type="submit" disabled={state === "sending"} aria-busy={state === "sending"}>
                  {state === "sending" ? "Subscribing…" : "Subscribe"}
                </Button>
              </div>
              {error && (
                <p id="footer-email-error" className="text-xs text-destructive-text">
                  {error}
                </p>
              )}
            </form>
          )}

          {/* Pulled in by the icon buttons' padding, so the icons line up with the text above; the hover still has room. */}
          <ul className="-ms-2.5 flex gap-1">
            {social.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href ?? "#"}
                  aria-label={`${brand.name} on ${s.label}`}
                  className="grid size-9 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-4">
                    <path d={s.path} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-semibold">{column.title}</h2>
              <ul className="mt-4 grid gap-2.5">
                {column.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className={link}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-5 sm:flex-row sm:justify-between sm:px-6">
          <p className="text-xs text-muted-foreground">{copyright ?? `© ${new Date().getFullYear()} ${brand.name}. All rights reserved.`}</p>
          <div className="flex items-center gap-2">
            {languages.length > 0 && (
              <NativeSelect
                aria-label="Language"
                value={language}
                onChange={(e) => {
                  setOwnLanguage(e.target.value)
                  onLanguageChange?.(e.target.value)
                }}
                options={languages}
                classNames={{ select: "h-8 w-auto text-xs" }}
              />
            )}
            <SegmentedControl
              aria-label="Theme"
              value={theme}
              onValueChange={(v) => changeTheme(v as "light" | "dark")}
              options={[
                { value: "light", icon: <Sun aria-hidden />, "aria-label": "Light" },
                { value: "dark", icon: <Moon aria-hidden />, "aria-label": "Dark" },
              ]}
              className="h-8"
              classNames={{ item: "px-2" }}
            />
          </div>
        </div>
      </div>
    </footer>
  )
}
