"use client"

import { useState } from "react"
import { Bell, Blocks, Building2, CreditCard, Shield, User, Users } from "lucide-react"
import { Avatar } from "@dashral/ui/components/avatar"
import { Badge } from "@dashral/ui/components/badge"
import { Button } from "@dashral/ui/components/button"
import { Input } from "@dashral/ui/components/input"
import { NativeSelect } from "@dashral/ui/components/native-select"
import { Switch } from "@dashral/ui/components/switch"
import { indicatorMotion, useIndicator } from "@dashral/ui/lib/use-indicator"
import { cn } from "@dashral/ui/lib/utils"

// The brands named here are made up, so the block ships as it is. Put in the tools your product really works with.
const brands = { chat: "Murmur", code: "Forkly", payments: "Fernpay", files: "Driftbox" }

/** One settings section: its place in the nav and the title above its content. */
export type SettingsPage = { id: string; label: string; icon: React.ReactNode; description: string; badge?: React.ReactNode; count?: number }
export type SettingsGroup = { label: string; pages: SettingsPage[] }

const sampleGroups: SettingsGroup[] = [
  {
    label: "Account",
    pages: [
      { id: "profile", label: "Profile", icon: <User />, description: "How others see you across the workspace." },
      { id: "notifications", label: "Notifications", icon: <Bell />, description: "What reaches you, and where." },
      { id: "security", label: "Security", icon: <Shield />, description: "Sign-in, two-factor and your sessions." },
    ],
  },
  {
    label: "Workspace",
    pages: [
      { id: "general", label: "General", icon: <Building2 />, description: "Your workspace's name and address." },
      { id: "members", label: "Members", icon: <Users />, description: "Who's in the workspace, and their roles.", count: 12 },
      { id: "billing", label: "Billing", icon: <CreditCard />, description: "Your plan, seats and invoices.", badge: <Badge variant="soft" color="primary">Team</Badge> },
      { id: "integrations", label: "Integrations", icon: <Blocks />, description: "The tools Acme talks to." },
    ],
  },
]

/**
 * A settings page: grouped sections on the left with a highlight that slides to the one you pick, and that section
 * on the right. On phones the sections are a select above the content. Your sections come in `groups`, the one shown
 * is controllable (`onNavigate` when it changes), and `content` renders each one; the sample forms render without it.
 */
export function SettingsSidebar({
  groups = sampleGroups,
  current: currentProp,
  onNavigate,
  content = (page) => <Content id={page.id} />,
}: {
  groups?: SettingsGroup[]
  /** The section shown, by id (the block keeps it without it). */
  current?: string
  onNavigate?: (id: string) => void
  content?: (page: SettingsPage) => React.ReactNode
}) {
  const pages = groups.flatMap((g) => g.pages)
  const [ownCurrent, setOwnCurrent] = useState(pages[0]?.id ?? "")
  const current = currentProp ?? ownCurrent
  const setCurrent = (id: string) => {
    setOwnCurrent(id)
    onNavigate?.(id)
  }
  const [navRef, highlight] = useIndicator<HTMLElement>("[aria-current=page]")
  const page = pages.find((p) => p.id === current) ?? pages[0]
  if (!page) return null

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 p-4 sm:p-6 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10 md:p-10">
      <div className="md:hidden">
        <NativeSelect
          aria-label="Settings section"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          options={groups.map((g) => ({ label: g.label, options: g.pages.map((p) => ({ value: p.id, label: p.label })) }))}
        />
      </div>

      <nav ref={navRef} aria-label="Settings" className="relative hidden content-start md:grid">
        {highlight && (
          <span
            aria-hidden
            className={cn(indicatorMotion, "rounded-md bg-accent")}
            style={{ translate: `${highlight.x}px ${highlight.y}px`, width: highlight.width, height: highlight.height }}
          />
        )}
        {groups.map((group, g) => (
          <div key={group.label} className={cn(g > 0 && "mt-6")}>
            <p className="mb-1 px-3 text-xs font-medium text-muted-foreground">{group.label}</p>
            <ul className="grid gap-0.5">
              {group.pages.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-current={current === p.id ? "page" : undefined}
                    onClick={() => setCurrent(p.id)}
                    className="relative flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 aria-[current=page]:font-medium aria-[current=page]:text-foreground [&>svg]:size-4 [&>svg]:shrink-0"
                  >
                    {p.icon}
                    <span className="flex-1 text-start">{p.label}</span>
                    {p.count !== undefined && <span className="text-xs text-muted-foreground tabular-nums">{p.count}</span>}
                    {p.badge}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Keyed by the section, so each one fades in. */}
      <section key={page.id} aria-labelledby="settings-title" className="grid min-w-0 content-start gap-6 animate-in fade-in-0 duration-(--duration-standard) ease-enter">
        <header className="border-b pb-5">
          <h2 id="settings-title" className="text-lg font-semibold">
            {page.label}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{page.description}</p>
        </header>
        {content(page)}
      </section>
    </div>
  )
}

function Content({ id }: { id: string }) {
  const save = (
    <div className="flex justify-end">
      <Button>Save changes</Button>
    </div>
  )

  switch (id) {
    case "profile":
      return (
        <div className="grid gap-5">
          <div className="flex items-center gap-4">
            <Avatar src="https://randomuser.me/api/portraits/women/44.jpg" name="Olivia Martin" alt="" size="xl" />
            <Button variant="outline" size="sm">
              Change photo
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" defaultValue="Olivia Martin" />
            <Input label="Email" type="email" defaultValue="olivia@acme.com" />
          </div>
          {save}
        </div>
      )
    case "notifications":
      return (
        <div className="grid gap-5">
          <Switch label="Comments and mentions" description="When someone replies to you or @mentions you." labelPosition="start" defaultChecked />
          <Switch label="Weekly digest" description="A summary every Monday morning." labelPosition="start" defaultChecked />
          <Switch label="Product news" description="New features, once a month at most." labelPosition="start" />
        </div>
      )
    case "security":
      return (
        <div className="grid gap-5">
          <Switch label="Two-factor authentication" description="A code from your authenticator app at every sign-in." labelPosition="start" />
          <div className="grid gap-2">
            <p className="text-sm font-medium">Sessions</p>
            {[
              { device: "MacBook Pro · Chrome", where: "Jakarta · now", current: true },
              { device: "iPhone 15 · Safari", where: "Bandung · 2 days ago" },
            ].map((s) => (
              <div key={s.device} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                <span className="grid">
                  <span className="font-medium">{s.device}</span>
                  <span className="text-xs text-muted-foreground">{s.where}</span>
                </span>
                {s.current ? <Badge variant="soft" color="success">This device</Badge> : <Button variant="ghost" size="sm">Sign out</Button>}
              </div>
            ))}
          </div>
        </div>
      )
    case "general":
      return (
        <div className="grid gap-4">
          <Input label="Workspace name" defaultValue="Acme Inc." />
          <Input label="Address" prefix="dashral.com/" defaultValue="acme" description="Letters, numbers and dashes." />
          {save}
        </div>
      )
    case "members":
      return (
        <ul className="divide-y rounded-lg border">
          {[
            { name: "Olivia Martin", email: "olivia@acme.com", role: "Owner", src: "https://randomuser.me/api/portraits/women/44.jpg" },
            { name: "Liam Johnson", email: "liam@acme.com", role: "Admin", src: "https://randomuser.me/api/portraits/men/32.jpg" },
            { name: "Budi Santoso", email: "budi@acme.com", role: "Member" },
          ].map((m) => (
            <li key={m.email} className="flex items-center gap-3 p-3">
              <Avatar src={m.src} name={m.name} alt="" />
              <span className="grid min-w-0 flex-1">
                <span className="truncate text-sm font-medium">{m.name}</span>
                <span className="truncate text-xs text-muted-foreground">{m.email}</span>
              </span>
              <Badge variant="outline" color="neutral">
                {m.role}
              </Badge>
            </li>
          ))}
        </ul>
      )
    case "billing":
      return (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
          <div>
            <p className="text-sm font-semibold">Team plan · $49 a month</p>
            <p className="text-sm text-muted-foreground">12 of 15 seats · renews Nov 1, 2026</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Invoices
            </Button>
            <Button size="sm">Upgrade</Button>
          </div>
        </div>
      )
    default:
      return (
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            { name: brands.chat, about: "Alerts in your channels", on: true },
            { name: brands.code, about: "Link issues to pull requests", on: true },
            { name: brands.payments, about: "Revenue in your dashboards" },
            { name: brands.files, about: `Attach files from ${brands.files}` },
          ].map((tool) => (
            <li key={tool.name} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <span className="grid">
                <span className="text-sm font-medium">{tool.name}</span>
                <span className="text-xs text-muted-foreground">{tool.about}</span>
              </span>
              <Button variant={tool.on ? "outline" : "solid"} size="sm">
                {tool.on ? "Connected" : "Connect"}
              </Button>
            </li>
          ))}
        </ul>
      )
  }
}
