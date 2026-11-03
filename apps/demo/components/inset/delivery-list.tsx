import { useTranslations } from "next-intl"

import { AppTile } from "@/components/inset/app-tile"
import { deliveries } from "@/lib/inset-data"

/** Where each alert rule is delivered: the app's tile, the channel and the rule, one white card each. */
export function DeliveryList() {
  const t = useTranslations("inset.deliveries")
  return (
    <ul className="space-y-2.5">
      {deliveries.map((delivery) => (
        <li key={delivery.rule} className="flex items-center gap-3.5 rounded-xl border bg-card p-3">
          <AppTile app={delivery.channel} size="lg" />
          <div className="min-w-0">
            {/* The target in its own direction (FSI and PDI around it), so "#revenue" keeps its # in Arabic. */}
            <p className="truncate text-[13px] text-muted-foreground">
              {t(`channels.${delivery.channel}`, { target: `\u2068${delivery.target}\u2069` })}
            </p>
            <p className="truncate font-medium">{t(`rules.${delivery.rule}`)}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
