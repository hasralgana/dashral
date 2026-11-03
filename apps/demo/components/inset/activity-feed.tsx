"use client"

import { useState } from "react"
import { Inbox } from "lucide-react"
import { useTranslations } from "next-intl"
import { Card } from "@dashral/ui/components/card"
import { EmptyState } from "@dashral/ui/components/empty-state"
import { SegmentedControl } from "@dashral/ui/components/segmented-control"

import { ActivityTimeline, eventDay, useDayLabel } from "@/components/inset/activity"
import { activity, type ActivityKind } from "@/lib/inset-data"

const kinds: ("all" | ActivityKind)[] = ["all", "billing", "customers", "integrations", "team"]

/** The workspace's events, one inset card per day, narrowed to one kind with the control on top. */
export function ActivityFeed() {
  const t = useTranslations("inset.activity")
  const dayLabel = useDayLabel()
  const [kind, setKind] = useState<(typeof kinds)[number]>("all")
  const shown = kind === "all" ? activity : activity.filter((event) => event.kind === kind)
  const days = [...new Set(shown.map(eventDay))]

  return (
    <>
      {/* On phones the control scrolls sideways instead of squeezing its labels. */}
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
        <SegmentedControl
          aria-label={t("filter")}
          value={kind}
          onValueChange={(value) => setKind(value as typeof kind)}
          options={kinds.map((value) => ({ value, label: t(`kinds.${value}`) }))}
          className="w-max"
        />
      </div>

      {days.length ? (
        <div className="space-y-4">
          {days.map((day) => {
            const events = shown.filter((event) => eventDay(event) === day)
            return (
              <Card
                key={day}
                variant="inset"
                title={dayLabel(day)}
                action={<span className="text-xs text-muted-foreground">{t("count", { count: events.length })}</span>}
                classNames={{ body: "p-5" }}
              >
                <ActivityTimeline events={events} />
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={<Inbox />} title={t("emptyTitle")} description={t("emptyDescription")} />
      )}
    </>
  )
}
