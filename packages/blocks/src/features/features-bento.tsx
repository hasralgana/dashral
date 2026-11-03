"use client"

import { useState } from "react"
import { BellRing } from "lucide-react"
import { AvatarGroup } from "@dashral/ui/components/avatar"
import { Sparkline } from "@dashral/ui/components/sparkline"
import { Switch } from "@dashral/ui/components/switch"
import { cn } from "@dashral/ui/lib/utils"

// The brands named here are made up, so the block ships as it is. Put in the tools your product really works with.
const brands = { payments: "Fernpay", store: "Cartwell", crm: "Dealbird", analytics: "Peekly", chat: "Murmur" }

const team = [
  { name: "Olivia Martin", src: "https://randomuser.me/api/portraits/women/44.jpg" },
  { name: "Liam Johnson", src: "https://randomuser.me/api/portraits/men/32.jpg" },
  { name: "Sofia Davis", src: "https://randomuser.me/api/portraits/women/68.jpg" },
  { name: "Budi Santoso" },
  { name: "Ava Chen" },
]
const sources = [brands.payments, brands.store, "Postgres", brands.crm, brands.analytics, brands.chat]

/** A tile: the thing itself in miniature (`visual`), its title and a line; `wide` takes two columns. */
export type BentoTile = { title: string; text: React.ReactNode; visual: React.ReactNode; wide?: boolean }

function Tile({ title, text, className, children }: { title: string; text: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <li className={cn("flex flex-col overflow-hidden rounded-2xl border bg-card", className)}>
      <div className="flex flex-1 items-center justify-center bg-muted/40 p-6">{children}</div>
      <div className="border-t p-5">
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      </div>
    </li>
  )
}

/**
 * Features as a bento grid, each tile showing the thing itself in miniature: a live chart, the team sharing a
 * board, the sources it connects and an alert you can switch on. Tiles of two sizes; one column on phones. Every
 * part comes from props: your tiles, each with a visual of its own.
 */
export function FeaturesBento({
  eyebrow = "Why teams switch",
  title = "See it, share it, act on it",
  tiles = sampleTiles,
}: {
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  tiles?: BentoTile[]
}) {
  return (
    <section className="bg-background px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow && <p className="text-sm font-medium text-primary-text">{eyebrow}</p>}
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">{title}</h2>
        </div>
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {tiles.map((tile) => (
            <Tile key={tile.title} title={tile.title} text={tile.text} className={cn(tile.wide && "md:col-span-2")}>
              {tile.visual}
            </Tile>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** The sample alert: a spike, and a switch to hear about it. */
function AlertVisual() {
  const [alerts, setAlerts] = useState(true)
  return (
    <div className="grid w-full max-w-md gap-3">
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
        <span className="grid size-9 place-items-center rounded-lg bg-warning/15 text-warning-text">
          <BellRing className="size-4" aria-hidden />
        </span>
        <span className="flex-1 text-sm">
          Signups up <span className="font-semibold">38%</span> since 9 AM
        </span>
      </div>
      <Switch label="Tell me when signups spike" checked={alerts} onCheckedChange={setAlerts} labelPosition="start" classNames={{ root: "rounded-xl border bg-card p-3 shadow-sm" }} />
    </div>
  )
}

const sampleTiles: BentoTile[] = [
  {
    title: "Live, not yesterday's",
    text: "Every chart moves the moment your data does.",
    wide: true,
    visual: (
      <div className="w-full max-w-md rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">Revenue</span>
          <span className="text-xs font-medium text-success-text">+12.5%</span>
        </div>
        <p className="mt-1 text-2xl font-semibold tabular-nums">$48,290</p>
        <Sparkline data={[31, 34, 33, 38, 36, 41, 40, 44, 43, 47, 46, 52]} variant="area" showLast className="mt-3 h-20" aria-label="Revenue rising over 12 weeks" />
      </div>
    ),
  },
  {
    title: "Made for the team",
    text: "Share a board; comments and mentions keep everyone in it.",
    visual: (
      <div className="grid justify-items-center gap-3">
        <AvatarGroup items={team} max={4} size="lg" showNames aria-label="5 people on this board" />
        <span className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm">Olivia is viewing</span>
      </div>
    ),
  },
  {
    title: "Connects to what you use",
    text: "Forty sources, set up in a couple of clicks.",
    visual: (
      <div className="flex max-w-56 flex-wrap justify-center gap-2">
        {sources.map((source) => (
          <span key={source} className="rounded-md border bg-card px-2.5 py-1 text-xs font-medium shadow-sm">
            {source}
          </span>
        ))}
      </div>
    ),
  },
  { title: "Alerts, not noise", text: "One message when something actually changes.", wide: true, visual: <AlertVisual /> },
]
