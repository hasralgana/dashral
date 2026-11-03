import { growMotion, stagger } from "@dashral/ui/lib/motion"
import { cn } from "@dashral/ui/lib/utils"

import { useTranslations } from "next-intl"

import type { trafficSources } from "@/lib/data"
import { useFormats } from "@/lib/use-formats"

type Source = (typeof trafficSources)[number]

/** Single-series horizontal bars, every bar directly labeled at its tip. */
export function TrafficSources({ data }: { data: Source[] }) {
  const t = useTranslations("overview")
  const format = useFormats()
  const max = Math.max(...data.map((d) => d.visitors))

  return (
    <ul className="space-y-4">
      {data.map((d, i) => (
        <li key={d.source}>
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span>{t(`sources.${d.source}`)}</span>
            <span className="font-medium tabular-nums">{format.number(d.visitors)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden">
            {/* Each bar grows in from the left, one after another. */}
            <div
              className={cn(growMotion, "h-full rounded-e-[4px] bg-primary")}
              style={{ width: `${(d.visitors / max) * 100}%`, ...stagger(i, 70) }}
              title={t("visitorsTitle", { source: t(`sources.${d.source}`), count: format.number(d.visitors) })}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
