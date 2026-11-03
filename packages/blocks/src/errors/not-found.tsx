"use client"

import { useState } from "react"
import { ArrowLeft, BookOpen, Check, CornerDownLeft, CreditCard, FileSearch, Flag, House, LayoutDashboard, LifeBuoy, Search } from "lucide-react"
import { Button } from "@dashral/ui/components/button"
import { Input } from "@dashral/ui/components/input"
import { cn } from "@dashral/ui/lib/utils"

// The brands named here are made up, so the block ships as it is. Put in the tools your product really works with.
const brands = { payments: "Fernpay", store: "Cartwell" }

/** A page to search and jump to; the popular ones show as cards, with an icon. */
export type NotFoundPage = { title: string; description: string; href: string; icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }> }

// The pages people look for most, to search and to jump to.
const samplePages: NotFoundPage[] = [
  { title: "Dashboard", description: "Your numbers at a glance", href: "#", icon: LayoutDashboard },
  { title: "Documentation", description: "Guides and API reference", href: "#", icon: BookOpen },
  { title: "Pricing", description: "Plans for every team size", href: "#", icon: CreditCard },
  { title: "Help center", description: "Answers and contact", href: "#", icon: LifeBuoy },
]
// The demo's report: nothing to send it to, so it just thanks you.
const sampleReport = () => {}

const sampleMore: NotFoundPage[] = [
  { title: "Getting started", description: "Set up your first dashboard", href: "#" },
  { title: "Integrations", description: `Connect ${brands.payments}, ${brands.store} and more`, href: "#" },
  { title: "Changelog", description: "What's new this month", href: "#" },
  { title: "Account settings", description: "Profile, password and sessions", href: "#" },
]

/**
 * A "page not found" page that helps people on: the code, what happened, a search across the pages they likely
 * wanted, a way back and home, the most visited pages, and a way to report a broken link. Use it as app/not-found.tsx;
 * every part comes from props.
 */
export function NotFound({
  code = "404",
  title = "We can't find that page",
  description = "It may have moved, or the link has a typo. Search for it, or pick up from one of the pages below.",
  pages = samplePages,
  more = sampleMore,
  homeHref = "#",
  onOpen,
  onReport = sampleReport,
}: {
  code?: string
  title?: React.ReactNode
  description?: React.ReactNode
  /** The popular pages, as cards (and searched); none hides them. */
  pages?: NotFoundPage[]
  /** More pages, searched only. */
  more?: NotFoundPage[]
  homeHref?: string
  /** Enter in the search, with the first match: go there with your router (it follows the link without it). */
  onOpen?: (page: NotFoundPage) => void
  /** "Report a broken link", with the address that wasn't found (a throw takes the thanks back); null hides it. */
  onReport?: ((url: string) => Promise<void> | void) | null
}) {
  const [query, setQuery] = useState("")
  const [reported, setReported] = useState(false)

  const q = query.trim().toLowerCase()
  const results = q ? [...pages, ...more].filter((p) => `${p.title} ${p.description}`.toLowerCase().includes(q)) : []

  return (
    <main className="relative isolate overflow-hidden flex min-h-full flex-col items-center bg-background px-4 py-16 sm:px-6 sm:py-24">
      {/* A soft glow of the theme's gradient behind the code, and a fine grid fading out around it; decoration. */}
      <div aria-hidden className="absolute top-16 left-1/2 -z-10 h-25 w-[30rem] max-w-[90%] -translate-x-1/2 rounded-full opacity-35 blur-3xl [background:linear-gradient(90deg,var(--gradient-from),var(--gradient-via),var(--gradient-to))] sm:top-24 dark:opacity-25" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:48px_48px] opacity-60 [mask-image:radial-gradient(ellipse_50%_35%_at_50%_0%,black,transparent)]"
      />

      <div className="w-full max-w-xl text-center">
        <p className="bg-linear-to-b from-foreground from-30% to-(--gradient-via) bg-clip-text text-7xl font-semibold tracking-tighter text-transparent tabular-nums sm:text-8xl">
          {code}
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h1>
        {description && <p className="mx-auto mt-3 max-w-md text-pretty text-muted-foreground">{description}</p>}

        <form
          role="search"
          className="relative mt-8 text-start"
          onSubmit={(event) => {
            event.preventDefault()
            // Enter opens the first match.
            const first = results[0]
            if (!first) return
            if (onOpen) onOpen(first)
            else window.location.assign(first.href)
          }}
        >
          <Input
            type="search"
            aria-label="Search pages"
            placeholder="Search pages"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            prefix={<Search aria-hidden />}
            suffix={
              results.length > 0 && (
                <kbd className="hidden items-center gap-1 rounded border bg-muted px-1.5 py-0.5 font-sans text-[11px] text-muted-foreground sm:inline-flex">
                  <CornerDownLeft aria-hidden className="size-3" /> to open
                </kbd>
              )
            }
            classNames={{ input: "h-11" }}
          />
          {q && (
            <div className="mt-2 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm" aria-live="polite">
              {results.length ? (
                <ul className="divide-y">
                  {results.map((page, i) => (
                    <li key={page.title}>
                      <a
                        href={page.href}
                        className={cn(
                          "flex items-center justify-between gap-3 px-4 py-2.5 outline-none hover:bg-muted/60 focus-visible:bg-muted",
                          i === 0 && "bg-muted/40"
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{page.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">{page.description}</span>
                        </span>
                        {i === 0 && <CornerDownLeft aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex items-center gap-2.5 px-4 py-3 text-sm text-muted-foreground">
                  <FileSearch aria-hidden className="size-4 shrink-0" />
                  Nothing called “{query.trim()}”. Try a shorter word.
                </p>
              )}
            </div>
          )}
        </form>

        {/* On phones the main action comes first. */}
        <div className="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => history.back()}>
            <ArrowLeft aria-hidden className="rtl:-scale-x-100" /> Go back
          </Button>
          <Button asChild>
            <a href={homeHref}>
              <House aria-hidden /> Take me home
            </a>
          </Button>
        </div>
      </div>

      <div className="mt-14 w-full max-w-3xl">
        {pages.length > 0 && (
            <>
            <h2 className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">Popular pages</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {pages.map(({ title, description, href, icon: Icon }) => (
                <li key={title}>
                  <a
                    href={href}
                    className="group flex items-center gap-3 rounded-xl border bg-card p-4 text-card-foreground transition-[border-color,translate] outline-none hover:-translate-y-0.5 hover:border-ring/40 focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:hover:translate-y-0"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary-text">
                      {Icon ? <Icon aria-hidden className="size-4.5" /> : <FileSearch aria-hidden className="size-4.5" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">{title}</span>
                      <span className="block text-sm text-muted-foreground">{description}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            </>
        )}

        {onReport && (
          <p className="mt-8 text-center text-sm text-muted-foreground" aria-live="polite">
            {reported ? (
              <span className="inline-flex items-center gap-1.5 text-success-text">
                <Check aria-hidden className="size-4" /> Thanks, we&apos;ll fix the link.
              </span>
            ) : (
              <>
                Followed a link from our site?{" "}
                <button
                  type="button"
                  onClick={async () => {
                    setReported(true)
                    await Promise.resolve()
                    .then(() => onReport(window.location.href))
                    .catch(() => setReported(false))
                  }}
                  className="inline-flex items-center gap-1 rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <Flag aria-hidden className="size-3.5" /> Report a broken link
                </button>
              </>
            )}
          </p>
        )}
      </div>
    </main>
  )
}
