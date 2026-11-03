"use client"

import { useState } from "react"
import { BarChart3, BookOpen, ChevronDown, Menu, Plug, ShieldCheck, Sparkles, Users, Workflow, Zap } from "lucide-react"
import { Accordion } from "@dashral/ui/components/accordion"
import { Button } from "@dashral/ui/components/button"
import { Popover } from "@dashral/ui/components/popover"
import { Sheet } from "@dashral/ui/components/sheet"
import { cn } from "@dashral/ui/lib/utils"

// The brands named here are made up, so the block ships as it is. Put in the tools your product really works with.
const brands = { payments: "Fernpay", chat: "Murmur", crm: "Dealbird" }

/** An item in a menu: an icon, a title, a line, and where it goes. */
export type MenuEntry = { icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>; title: string; text: string; href?: string }
/** A nav item: a plain link, or a menu that opens a panel (two columns past three items), with a promo under it. */
export type NavItem =
  | { label: string; href: string; icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }> }
  | { label: string; items: MenuEntry[]; promo?: { label: string; text: string; href: string } }
/** A button: a link with href, or your handler with onClick. */
export type BlockAction = { label: string; href?: string; onClick?: () => void }

const product: MenuEntry[] = [
  { icon: BarChart3, title: "Analytics", text: "Live numbers for every team, no SQL." },
  { icon: Workflow, title: "Automations", text: "Run the busywork when something changes." },
  { icon: Plug, title: "Integrations", text: `${brands.payments}, ${brands.chat}, ${brands.crm} and 40 more.` },
  { icon: ShieldCheck, title: "Security", text: "SSO, roles and an audit log on every plan." },
]

const solutions: MenuEntry[] = [
  { icon: Zap, title: "Startups", text: "Ship a dashboard in a day." },
  { icon: Users, title: "Agencies", text: "One workspace per client." },
  { icon: Sparkles, title: "Enterprise", text: "Self-host, SLA and support." },
]

const sampleNav: NavItem[] = [
  { label: "Product", items: product, promo: { label: "New:", text: "AI summaries for every report", href: "#" } },
  { label: "Solutions", items: solutions },
  { label: "Pricing", href: "#" },
  { label: "Docs", href: "#", icon: BookOpen },
]

function MenuList({ items, onPick }: { items: MenuEntry[]; onPick?: () => void }) {
  return (
    <ul className="grid gap-1">
      {items.map(({ icon: Icon, title, text, href }) => (
        <li key={title}>
          <a
            href={href ?? "#"}
            onClick={(event) => {
              if (!href) event.preventDefault()
              onPick?.()
            }}
            className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg border bg-card text-primary-text transition-colors group-hover:border-primary/30">
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{title}</span>
              <span className="block text-xs leading-relaxed text-muted-foreground">{text}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

/** A nav item that opens a panel; the chevron turns while it's open. */
function NavMenu({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="start"
      className={cn("p-2", className)}
      trigger={
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:text-foreground"
        >
          {label}
          <ChevronDown className={cn("size-3.5 transition-transform duration-(--duration-standard) ease-spring", open && "rotate-180")} aria-hidden />
        </button>
      }
    >
      {children}
    </Popover>
  )
}

function Logo({ brand }: { brand: { name: string; href: string; logo?: React.ReactNode } }) {
  return (
    <a href={brand.href} className="flex items-center gap-2 rounded-md font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
      {brand.logo ?? (
        <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </span>
      )}
      {brand.name}
    </a>
  )
}

/** A button that follows its action: a link, or a handler (and closes the sheet, `then`). */
function Action({ action, variant, className, then }: { action: BlockAction; variant?: "ghost" | "outline"; className?: string; then?: () => void }) {
  return action.href ? (
    <Button variant={variant} className={className} asChild>
      <a href={action.href} onClick={then}>
        {action.label}
      </a>
    </Button>
  ) : (
    <Button
      variant={variant}
      className={className}
      onClick={() => {
        action.onClick?.()
        then?.()
      }}
    >
      {action.label}
    </Button>
  )
}

/**
 * A marketing site's navbar: the logo, menus with a line on each item, plain links, and sign in / sign up. On phones
 * the links move into a sheet, the menus becoming sections that open in place. Every part comes from props.
 */
export function WebsiteHeader({
  brand = { name: "Acme", href: "#" },
  nav = sampleNav,
  signIn = { label: "Sign in", href: "#" },
  cta = { label: "Get started", href: "#" },
}: {
  brand?: { name: string; href: string; logo?: React.ReactNode }
  nav?: NavItem[]
  /** The quiet button before the main one; null hides it. */
  signIn?: BlockAction | null
  cta?: BlockAction
}) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const close = () => setSheetOpen(false)
  const link = "inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
  const menus = nav.filter((item) => "items" in item)

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo brand={brand} />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {nav.map((item) =>
            "items" in item ? (
              <NavMenu key={item.label} label={item.label} className={item.items.length > 3 ? "w-[34rem]" : "w-72"}>
                {item.items.length > 3 ? (
                  <div className="grid grid-cols-2 gap-1">
                    <MenuList items={item.items.slice(0, Math.ceil(item.items.length / 2))} />
                    <MenuList items={item.items.slice(Math.ceil(item.items.length / 2))} />
                  </div>
                ) : (
                  <MenuList items={item.items} />
                )}
                {item.promo && (
                  <a href={item.promo.href} className="mt-2 flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2.5 text-xs transition-colors hover:bg-muted">
                    <span>
                      <span className="font-medium">{item.promo.label}</span> <span className="text-muted-foreground">{item.promo.text}</span>
                    </span>
                    <span className="font-medium text-primary-text">Read more →</span>
                  </a>
                )}
              </NavMenu>
            ) : (
              <a key={item.label} href={item.href} className={link}>
                {item.label}
              </a>
            )
          )}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          {signIn && <Action action={signIn} variant="ghost" className="hidden sm:inline-flex" />}
          <Action action={cta} />
          <Sheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            side="right"
            title="Menu"
            className="w-80"
            trigger={
              <Button variant="ghost" size="icon" aria-label="Open the menu" className="md:hidden">
                <Menu />
              </Button>
            }
            footer={
              <div className="grid w-full gap-2">
                {signIn && <Action action={signIn} variant="outline" then={close} />}
                <Action action={cta} then={close} />
              </div>
            }
          >
            {/* -mx-2 with px-2 on each row: the text lines up with the title, the hover reaches a little past it. */}
            <div className="-mx-2 pb-4">
              {menus.length > 0 && (
                <Accordion
                  items={menus.map((item) => ({ value: item.label, title: item.label, content: <MenuList items={"items" in item ? item.items : []} onPick={close} /> }))}
                  classNames={{ item: "border-0", trigger: "px-2 text-sm", content: "px-0" }}
                />
              )}
              {nav.map((item) =>
                "items" in item ? null : (
                  <a key={item.label} href={item.href} onClick={close} className="flex items-center gap-2 rounded-md px-2 py-3 text-sm font-medium hover:bg-accent">
                    {item.icon && <item.icon className="size-4 text-muted-foreground" aria-hidden />}
                    {item.label}
                  </a>
                )
              )}
            </div>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
