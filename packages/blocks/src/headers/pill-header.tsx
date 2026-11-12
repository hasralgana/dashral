"use client"

import { useEffect, useState } from "react"
import { ArrowUpRight, Menu, Moon, Sparkles, Star, Sun } from "lucide-react"
import { Button } from "@dashral/ui/components/button"
import { Sheet } from "@dashral/ui/components/sheet"
import { indicatorMotion, useIndicator } from "@dashral/ui/lib/use-indicator"
import { cn } from "@dashral/ui/lib/utils"

/** A link in the pill; `badge` is a short word beside it ("New"). */
export type PillLink = { title: string; href: string; badge?: string }
/** A button: a link with `href`, or `onClick`. */
export type BlockAction = { label: string; href?: string; onClick?: () => void }

const sampleLinks: PillLink[] = [
  { title: "Components", href: "#" },
  { title: "Blocks", href: "#" },
  { title: "Templates", href: "#" },
  { title: "Pro", href: "#", badge: "New" },
  { title: "Pricing", href: "#" },
]

/** GitHub's mark (lucide no longer ships brand icons). */
function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}

/** An action as a button: a link when it has an href. */
function Action({ action, className, variant, then, children }: { action: BlockAction; className: string; variant?: "outline"; then?: () => void; children?: React.ReactNode }) {
  const content = (
    <>
      {action.label}
      {children}
    </>
  )
  return action.href ? (
    <Button variant={variant} size="sm" className={className} asChild>
      <a href={action.href} onClick={then}>
        {content}
      </a>
    </Button>
  ) : (
    <Button
      variant={variant}
      size="sm"
      className={className}
      onClick={() => {
        action.onClick?.()
        then?.()
      }}
    >
      {content}
    </Button>
  )
}

/**
 * A website header with the links in a pill in the middle — a highlight slides to the page you're on — a GitHub star
 * count, the theme, and sign in beside the main action. On phones the links move into a sheet. The theme button
 * toggles the `dark` class on <html>; pass `onToggleTheme` to use your own (next-themes, say). The brand, links,
 * GitHub repository and actions come from props; the page you're on is controllable, with `onNavigate`.
 */
export function PillHeader({
  brand = { name: "Acme", href: "#" },
  links = sampleLinks,
  current: currentProp,
  onNavigate,
  github = { href: "#", stars: 786 },
  signIn = { label: "Sign in", href: "#" },
  cta = { label: "Get started", href: "#" },
  onToggleTheme,
}: {
  brand?: { name: string; href: string; logo?: React.ReactNode }
  links?: PillLink[]
  /** The link you're on, by title (the header keeps it without it). */
  current?: string
  /** Called with the link's title; links to "#" stay on the page. */
  onNavigate?: (title: string) => void
  /** The star button; null hides it. */
  github?: { href: string; stars: number } | null
  /** null hides it. */
  signIn?: BlockAction | null
  cta?: BlockAction
  onToggleTheme?: () => void
}) {
  const [ownCurrent, setOwnCurrent] = useState(links[1]?.title ?? links[0]?.title ?? "")
  const current = currentProp ?? ownCurrent
  const [dark, setDark] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [navRef, highlight] = useIndicator<HTMLElement>("[aria-current=page]")

  useEffect(() => setDark(document.documentElement.classList.contains("dark")), [])

  function toggleTheme() {
    if (onToggleTheme) return onToggleTheme()
    const next = !document.documentElement.classList.contains("dark")
    document.documentElement.classList.toggle("dark", next)
    setDark(next)
  }

  const go = (link: PillLink) => (event: React.MouseEvent) => {
    if (link.href === "#") event.preventDefault()
    setOwnCurrent(link.title)
    onNavigate?.(link.title)
    setSheetOpen(false)
  }
  const close = () => setSheetOpen(false)

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 lg:grid-cols-[1fr_auto_1fr]">
        <a href={brand.href} className="flex items-center gap-2 justify-self-start rounded-md text-lg font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
          {brand.logo ?? (
            <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-foreground text-background">
              <Sparkles className="size-3.5" />
            </span>
          )}
          {brand.name}
        </a>

        {/* The links, in a pill; the highlight slides to the current one. */}
        <nav ref={navRef} aria-label="Main" className="relative hidden items-center gap-0.5 rounded-full border bg-muted/60 p-1 lg:flex">
          {highlight && (
            <span
              aria-hidden
              className={cn(indicatorMotion, "rounded-full bg-background shadow-xs dark:bg-accent")}
              style={{ translate: `${highlight.x}px ${highlight.y}px`, width: highlight.width, height: highlight.height }}
            />
          )}
          {links.map((link) => (
            <a
              key={link.title}
              href={link.href}
              onClick={go(link)}
              aria-current={current === link.title ? "page" : undefined}
              className={cn(
                "relative flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
                current === link.title ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {link.title}
              {link.badge && <span className="rounded-full border border-primary/25 bg-primary/10 px-1.5 text-[10px] font-semibold text-primary-text">{link.badge}</span>}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 justify-self-end">
          {github && (
            <a
              href={github.href}
              className="hidden h-8 items-center rounded-full border bg-card text-[13px] font-medium shadow-xs transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 md:inline-flex"
            >
              <span className="flex items-center gap-1.5 px-3">
                <GitHubMark className="size-3.5" /> Star
              </span>
              <span className="flex h-full items-center gap-1 border-s px-3 text-muted-foreground tabular-nums">
                <Star className="size-3 fill-current text-warning" aria-hidden />
                {new Intl.NumberFormat("en-US", { notation: "compact" }).format(github.stars)}
              </span>
            </a>
          )}
          <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={toggleTheme}>
            {dark ? <Sun /> : <Moon />}
          </Button>
          {signIn && <Action action={signIn} variant="outline" className="hidden rounded-full px-3.5 sm:inline-flex" />}
          <Action action={cta} className="hidden rounded-full bg-foreground px-3.5 text-background hover:bg-foreground/85 sm:inline-flex">
            <ArrowUpRight aria-hidden />
          </Action>
          <Sheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            side="right"
            title="Menu"
            className="w-80"
            trigger={
              <Button variant="ghost" size="icon-sm" className="rounded-full lg:hidden" aria-label="Open the menu">
                <Menu />
              </Button>
            }
            footer={
              <div className="grid w-full auto-cols-fr grid-flow-col gap-2">
                {signIn && <Action action={signIn} variant="outline" className="h-9 rounded-full" then={close} />}
                <Action action={cta} className="h-9 rounded-full bg-foreground text-background hover:bg-foreground/85" then={close}>
                  <ArrowUpRight aria-hidden />
                </Action>
              </div>
            }
          >
            <nav aria-label="Main" className="grid gap-1">
              {links.map((link) => (
                <a
                  key={link.title}
                  href={link.href}
                  onClick={go(link)}
                  aria-current={current === link.title ? "page" : undefined}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent aria-[current=page]:bg-accent"
                >
                  {link.title}
                  {link.badge && <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary-text">{link.badge}</span>}
                </a>
              ))}
            </nav>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
