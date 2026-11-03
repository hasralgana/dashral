"use client"

import { useState } from "react"
import { ArrowDown, ListFilter, Search, SearchX, Settings2, X, Zap } from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge } from "@dashral/ui/components/badge"
import { Button } from "@dashral/ui/components/button"
import { Card } from "@dashral/ui/components/card"
import { DropdownMenu } from "@dashral/ui/components/dropdown-menu"
import { EmptyState } from "@dashral/ui/components/empty-state"
import { Input } from "@dashral/ui/components/input"
import { SegmentedControl } from "@dashral/ui/components/segmented-control"
import { Switch } from "@dashral/ui/components/switch"
import { toast } from "@dashral/ui/components/toast"
import { cn } from "@dashral/ui/lib/utils"

import { AppTile } from "@/components/inset/app-tile"
import { DeliveryList } from "@/components/inset/delivery-list"
import { PanelCard } from "@/components/inset/panel-card"
import { deliveries, integrations as initialApps, type IntegrationCategory } from "@/lib/inset-data"

const categories: ("all" | IntegrationCategory)[] = ["all", "messaging", "payments", "data", "developer"]

/** A dashed group in a product scene, with its small label at the top. */
function SceneGroup({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative flex flex-col rounded-xl border border-dashed bg-muted/40 px-1.5 pt-7 pb-1.5", className)}>
      <span className="absolute start-3 top-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      {children}
    </div>
  )
}

/** Alert rules on the left, where each is delivered on the right; on phones one above the other. */
function DeliveryMap() {
  const t = useTranslations("inset.integrations")
  const rules = useTranslations("inset.deliveries.rules")
  return (
    <PanelCard
      title={t("mapTitle")}
      info={t("mapDescription")}
      legend={[
        { color: "success", value: deliveries.length, label: t("activeRules") },
        { color: "info", value: 128, label: t("alertsWeek") },
      ]}
    >
      <div className="bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:20px_20px] p-4 sm:p-6">
        <div className="grid items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_3rem_minmax(0,1.4fr)] md:gap-0">
          <SceneGroup label={t("when")}>
            <ul className="flex flex-1 flex-col gap-2.5">
              {deliveries.map((delivery) => (
                // As tall as the delivery card beside it, so each rule lines up with where it goes.
                <li key={delivery.rule} className="flex items-center md:h-[76px]">
                  <span className="inline-flex h-8 max-w-full items-center gap-2 rounded-full border bg-card px-3 text-xs font-medium shadow-xs">
                    <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-success" />
                    <Zap className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="truncate">{rules(delivery.rule)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </SceneGroup>

          {/* Links between them: one per rule beside each other, one arrow down on phones. */}
          <div aria-hidden className="flex justify-center md:hidden">
            <ArrowDown className="size-4 text-muted-foreground" />
          </div>
          <ul aria-hidden className="hidden flex-col gap-2.5 pt-[30px] pb-1.5 md:flex">
            {deliveries.map((delivery) => (
              <li key={delivery.rule} className="flex h-[76px] items-center">
                <span className="h-px flex-1 border-t border-dashed border-muted-foreground/50" />
                <span className="size-0 border-y-4 border-s-[6px] border-y-transparent border-s-muted-foreground/60 rtl:-scale-x-100" />
              </li>
            ))}
          </ul>

          <SceneGroup label={t("deliveredTo")}>
            <DeliveryList />
          </SceneGroup>
        </div>
      </div>
    </PanelCard>
  )
}

export function IntegrationsView() {
  const t = useTranslations("inset.integrations")
  const [apps, setApps] = useState(initialApps)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<(typeof categories)[number]>("all")

  const words = query.trim().toLowerCase()
  const shown = apps.filter(
    (app) =>
      (category === "all" || app.category === category) &&
      (!words || app.name.toLowerCase().includes(words) || t(`apps.${app.id}`).toLowerCase().includes(words))
  )
  const connected = apps.filter((app) => app.connected).length

  function toggle(id: string, on: boolean) {
    const app = apps.find((a) => a.id === id)!
    setApps((list) => list.map((a) => (a.id === id ? { ...a, connected: on } : a)))
    toast.success(t(on ? "connectedToast" : "disconnectedToast", { app: app.name }))
  }

  function showAll() {
    setQuery("")
    setCategory("all")
  }

  return (
    <>
      <DeliveryMap />

      <section className="space-y-4" aria-label={t("title")}>
        {/* Search at the start, the category at the end; on phones one row, the category behind an icon. */}
        <div className="flex items-center justify-between gap-2">
          <Input
            type="text"
            role="searchbox"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            aria-label={t("search")}
            placeholder={t("search")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            prefix={<Search className="size-4 text-muted-foreground" aria-hidden />}
            suffix={
              query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={t("clearSearch")}
                  className="flex size-6 items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <X className="size-3.5" />
                </button>
              )
            }
            className="max-w-xs flex-1 max-sm:max-w-none"
          />
          <SegmentedControl
            aria-label={t("category")}
            value={category}
            onValueChange={(value) => setCategory(value as typeof category)}
            options={categories.map((value) => ({ value, label: t(`categories.${value}`) }))}
            className="max-lg:hidden"
          />
          <div className="lg:hidden">
            <DropdownMenu
              align="end"
              trigger={
                <Button variant="outline" size="icon" className="relative" aria-label={`${t("category")}: ${t(`categories.${category}`)}`}>
                  <ListFilter />
                  {category !== "all" && <span aria-hidden className="absolute end-1.5 top-1.5 size-1.5 rounded-full bg-primary" />}
                </Button>
              }
              items={[
                { type: "label", label: t("category") },
                {
                  type: "radio",
                  value: category,
                  onValueChange: (value) => setCategory(value as typeof category),
                  options: categories.map((value) => ({ value, label: t(`categories.${value}`) })),
                },
              ]}
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{t("connectedCount", { count: connected, total: apps.length })}</p>

        {shown.length ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((app) => (
              <li key={app.id} className="flex">
                <Card
                  variant="panel"
                  footer={
                    <>
                      <Badge variant="soft" color={app.connected ? "success" : "neutral"}>
                        <span aria-hidden className={cn("size-1.5 rounded-full", app.connected ? "bg-success" : "bg-muted-foreground/50")} />
                        {t(app.connected ? "connected" : "notConnected")}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ms-auto -me-2 h-7"
                        disabled={!app.connected}
                        onClick={() => toast(t("configureToast", { app: app.name }))}
                      >
                        <Settings2 /> {t("configure")}
                      </Button>
                    </>
                  }
                  className="flex-1"
                  classNames={{ footer: "py-2" }}
                >
                  <div className="flex items-start gap-3">
                    <AppTile app={app.id} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{app.name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{t(`apps.${app.id}`)}</p>
                    </div>
                    <Switch checked={app.connected} onCheckedChange={(on) => toggle(app.id, on)} aria-label={t("toggle", { app: app.name })} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<SearchX />}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            actions={
              <Button variant="outline" onClick={showAll}>
                {t("showAll")}
              </Button>
            }
          />
        )}
      </section>
    </>
  )
}
