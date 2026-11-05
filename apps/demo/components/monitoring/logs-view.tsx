"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { Radio } from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge } from "@dashral/ui/components/badge"
import { Card } from "@dashral/ui/components/card"
import { CopyButton } from "@dashral/ui/components/copy-button"
import { EmptyState } from "@dashral/ui/components/empty-state"
import { Pagination } from "@dashral/ui/components/pagination"
import { Resizable } from "@dashral/ui/components/resizable"
import { TimePicker } from "@dashral/ui/components/time-picker"
import { Toggle } from "@dashral/ui/components/toggle"
import { cn } from "@dashral/ui/lib/utils"

import { clock, logs as sample, makeLog, monitoringNow, type Level, type LogEntry } from "@/lib/monitoring-data"

const perPage = 12
const levelColor = { error: "destructive", warn: "warning", info: "info", debug: "neutral" } as const

// Side by side on wide screens, list over details on narrow ones.
const wide = "(min-width: 1024px)"
function useWide() {
  return useSyncExternalStore(
    (onChange) => {
      const query = matchMedia(wide)
      query.addEventListener("change", onChange)
      return () => query.removeEventListener("change", onChange)
    },
    () => matchMedia(wide).matches,
    () => true
  )
}

export function LogsView() {
  const t = useTranslations("monitoring")
  const [rows, setRows] = useState(sample)
  const [from, setFrom] = useState<string | undefined>()
  const [live, setLive] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState(sample[0]!.id)
  const isWide = useWide()

  // Live: a new line every couple of seconds, at the top, as a log tail would. The line number and the clock carry on
  // across pauses, so turning Live off and on never repeats a line's id or goes back in time.
  const tail = useRef({ n: 1000, seconds: monitoringNow })
  useEffect(() => {
    if (!live) return
    const timer = setInterval(() => {
      tail.current = { n: tail.current.n + 1, seconds: tail.current.seconds + 2 }
      const { n, seconds } = tail.current
      setRows((current) => [makeLog(n, clock(seconds)), ...current].slice(0, 300))
    }, 2000)
    return () => clearInterval(timer)
  }, [live])

  const filtered = from ? rows.filter((row) => row.time >= `${from}:00`) : rows
  const pages = Math.max(1, Math.ceil(filtered.length / perPage))
  const current = Math.min(page, pages)
  const shown = filtered.slice((current - 1) * perPage, current * perPage)
  const selected = filtered.find((row) => row.id === selectedId) ?? shown[0]

  const list = (
    <div className="flex h-full flex-col">
      {shown.length ? (
        <ul className="flex-1 divide-y divide-divider overflow-y-auto" aria-label={t("logs.list")}>
          {shown.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => setSelectedId(row.id)}
                aria-current={row.id === selected?.id ? "true" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2 text-start font-mono text-xs outline-none hover:bg-muted/60 focus-visible:bg-muted",
                  row.id === selected?.id && "bg-primary/8"
                )}
              >
                <span className="shrink-0 text-muted-foreground tabular-nums">{row.time}</span>
                <Badge variant="soft" color={levelColor[row.level]} className="w-14 shrink-0 justify-center font-mono uppercase">
                  {row.level}
                </Badge>
                <span className="w-16 shrink-0 text-muted-foreground">{row.service}</span>
                <span className="truncate" dir="ltr">
                  {row.message}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={t("logs.emptyTitle")} description={t("logs.emptyDescription")} className="flex-1 py-12" />
      )}
      <div className="flex items-center justify-between gap-3 border-t border-divider px-4 py-2.5">
        <p className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">{t("logs.count", { count: filtered.length })}</p>
        <Pagination page={current} total={pages} onPageChange={setPage} compact />
      </div>
    </div>
  )

  const details = selected ? <LogDetails entry={selected} /> : null

  return (
    <Card
      title={t("logs.title")}
      description={t("logs.description")}
      action={
        <div className="flex items-end gap-2">
          <TimePicker aria-label={t("logs.from")} placeholder={t("logs.from")} value={from} onValueChange={(value) => { setFrom(value); setPage(1) }} step={30} className="w-32" />
          <Toggle
            variant="outline"
            pressed={live}
            onPressedChange={(next) => {
              setLive(next)
              setPage(1)
            }}
            aria-label={t("logs.live")}
          >
            <Radio className={cn(live && "text-success motion-safe:animate-pulse")} />
            {t("logs.live")}
          </Toggle>
        </div>
      }
      classNames={{ body: "p-0" }}
    >
      {isWide ? (
        <Resizable
          withHandle
          panels={[
            { content: list, defaultSize: 62, minSize: 40 },
            { content: details, minSize: 25, className: "border-s border-divider" },
          ]}
          className="h-[34rem] border-t border-divider"
        />
      ) : (
        <div className="border-t border-divider">
          <div className="h-[28rem]">{list}</div>
          <div className="border-t border-divider">{details}</div>
        </div>
      )}
    </Card>
  )
}

function LogDetails({ entry }: { entry: LogEntry }) {
  const t = useTranslations("monitoring")
  const json = JSON.stringify({ id: entry.id, time: `2026-10-19T${entry.time}Z`, level: entry.level, service: entry.service, message: entry.message, ...(entry.request && { request: entry.request }) }, null, 2)
  const facts: [string, string][] = [
    [t("logs.time"), entry.time],
    [t("logs.level"), entry.level as Level],
    [t("logs.service"), t(`services.${entry.service}`)],
    ...(entry.request
      ? ([
          [t("logs.status"), String(entry.request.status)],
          [t("logs.duration"), `${entry.request.ms} ms`],
        ] as [string, string][])
      : []),
  ]
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-sm break-all" dir="ltr">
          {entry.message}
        </p>
        <CopyButton value={json} aria-label={t("logs.copy")} />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <pre className="flex-1 overflow-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed" dir="ltr">
        {json}
      </pre>
    </div>
  )
}
