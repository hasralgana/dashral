"use client"

import { useEffect, useState } from "react"
import { ChevronDown, Download, FileSpreadsheet, FileText, GitCompareArrows, Plus, Share2, X } from "lucide-react"
import { Badge } from "@dashral/ui/components/badge"
import { Breadcrumb } from "@dashral/ui/components/breadcrumb"
import { Button } from "@dashral/ui/components/button"
import type { DateRange } from "@dashral/ui/components/calendar"
import { DateRangePicker } from "@dashral/ui/components/date-range-picker"
import { DropdownMenu } from "@dashral/ui/components/dropdown-menu"
import { SegmentedControl } from "@dashral/ui/components/segmented-control"
import { cn } from "@dashral/ui/lib/utils"

const periods = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 } as const
export type ReportPeriod = keyof typeof periods
type Period = ReportPeriod

/** The last `days` days, ending today. */
function lastDays(days: number): DateRange {
  const to = new Date()
  const from = new Date(to)
  from.setDate(to.getDate() - (days - 1))
  return { from, to }
}

/**
 * A report's header: where it is, its title with a live status, and its controls — a period switcher that sets the
 * date range (or pick any range, and the switcher lets go), compare with the previous period, export and share. The
 * filters underneath can be removed one by one. Every part comes from props, and each control tells your handler.
 */
export function ReportHeader({
  breadcrumb = [{ label: "Reports", href: "#" }, { label: "Sales", href: "#" }, { label: "Revenue" }],
  title = "Revenue",
  live = true,
  description = "Updated 2 minutes ago · Net of refunds, in USD",
  defaultPeriod = "30d",
  onRangeChange,
  compare: compareProp,
  onCompareChange,
  exports = [
    { id: "csv", label: "CSV", icon: <FileText /> },
    { id: "excel", label: "Excel", icon: <FileSpreadsheet /> },
    { id: "pdf", label: "PDF report", icon: <FileText /> },
  ],
  onExport,
  onShare,
  filters: filtersProp,
  onFiltersChange,
  onAddFilter,
}: {
  breadcrumb?: { label: string; href?: string }[]
  title?: React.ReactNode
  /** The Live badge beside the title. */
  live?: boolean
  description?: React.ReactNode
  defaultPeriod?: ReportPeriod
  /** The dates picked, from the switcher (with its period) or the picker (with none). */
  onRangeChange?: (range: DateRange | undefined, period: ReportPeriod | null) => void
  /** Compare with the previous period (the header keeps it without it). */
  compare?: boolean
  onCompareChange?: (compare: boolean) => void
  /** The export menu's formats; none hides the button. */
  exports?: { id: string; label: string; icon?: React.ReactNode }[]
  onExport?: (id: string) => void
  onShare?: () => void
  /** The filters under the title (kept by the header without it); removing one tells onFiltersChange. */
  filters?: string[]
  onFiltersChange?: (filters: string[]) => void
  onAddFilter?: () => void
}) {
  const [period, setPeriod] = useState<Period | "">(defaultPeriod)
  // Today's dates are worked out in the browser, after the first render: a page rendered ahead of time (a static build,
  // a cache) would otherwise show the day it was built and fail to hydrate.
  const [range, setRange] = useState<DateRange | undefined>()
  useEffect(() => setRange((current) => current ?? lastDays(periods[defaultPeriod])), [defaultPeriod])
  const [ownCompare, setOwnCompare] = useState(true)
  const compare = compareProp ?? ownCompare
  const setCompare = (next: boolean) => {
    setOwnCompare(next)
    onCompareChange?.(next)
  }
  const [ownFilters, setOwnFilters] = useState(["Store: All stores", "Channel: Online", "Country: Indonesia"])
  const filters = filtersProp ?? ownFilters
  const setFilters = (next: string[]) => {
    setOwnFilters(next)
    onFiltersChange?.(next)
  }

  return (
    <header className="border-b bg-background">
      <div className="space-y-5 px-4 pt-5 pb-4 sm:px-6">
        {breadcrumb.length > 0 && <Breadcrumb items={breadcrumb} />}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {live && (
                <Badge variant="soft" color="success" className="gap-1.5 rounded-full">
                  <span aria-hidden className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-success" />
                  </span>
                  Live
                </Badge>
              )}
            </div>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              aria-label="Period"
              value={period}
              onValueChange={(value) => {
                const next = lastDays(periods[value as Period])
                setPeriod(value as Period)
                setRange(next)
                onRangeChange?.(next, value as Period)
              }}
              options={[
                { value: "7d", label: "7D" },
                { value: "30d", label: "30D" },
                { value: "90d", label: "90D" },
                { value: "12m", label: "12M" },
              ]}
            />
            <DateRangePicker
              aria-label="Date range"
              value={range}
              onValueChange={(next) => {
                setRange(next)
                setPeriod("")
                onRangeChange?.(next, null)
              }}
              className="w-auto"
            />
            <Button variant="outline" aria-pressed={compare} onClick={() => setCompare(!compare)} className={cn(compare && "border-primary/40 bg-primary/8 text-primary-text hover:bg-primary/12")}>
              <GitCompareArrows aria-hidden /> Compare
            </Button>
            {exports.length > 0 && (
              <DropdownMenu
                align="end"
                className="w-48"
                trigger={
                  <Button variant="outline">
                    <Download aria-hidden /> Export <ChevronDown className="text-muted-foreground" aria-hidden />
                  </Button>
                }
                items={exports.map((format) => ({ label: format.label, icon: format.icon, onSelect: () => onExport?.(format.id) }))}
              />
            )}
            <Button onClick={onShare}>
              <Share2 aria-hidden /> Share
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <span key={filter} className="inline-flex h-7 items-center gap-1 rounded-full border bg-card ps-3 pe-1 text-xs">
              {filter}
              <button
                type="button"
                aria-label={`Remove ${filter}`}
                onClick={() => setFilters(filters.filter((f) => f !== filter))}
                className="grid size-5 place-items-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
          <Button variant="ghost" size="sm" className="h-7 rounded-full text-xs text-muted-foreground" onClick={onAddFilter}>
            <Plus aria-hidden /> Add filter
          </Button>
          {compare && <span className="ms-auto hidden text-xs text-muted-foreground sm:inline">Compared with the previous period</span>}
        </div>
      </div>
    </header>
  )
}
