import { Ban, Bell, CircleCheck, CircleDollarSign, Plug, Send, ShieldCheck, Sparkles, TrendingUp, TriangleAlert, UserCheck, UserPlus } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Timeline } from "@dashral/ui/components/timeline"

import { localeInfo } from "@/lib/i18n"
import { insetToday, type ActivityEvent } from "@/lib/inset-data"
import { useFormats } from "@/lib/use-formats"

// Each event's marker: an icon in a color that says how it went (paid is good news, overdue isn't).
const markers = {
  invoicePaid: { icon: CircleDollarSign, color: "success" },
  invoiceOverdue: { icon: TriangleAlert, color: "destructive" },
  invoiceSent: { icon: Send, color: "neutral" },
  customerJoined: { icon: UserPlus, color: "info" },
  customerUpgraded: { icon: TrendingUp, color: "success" },
  customerChurned: { icon: Ban, color: "warning" },
  trialStarted: { icon: Sparkles, color: "info" },
  integrationConnected: { icon: Plug, color: "neutral" },
  alertDelivered: { icon: Bell, color: "neutral" },
  memberInvited: { icon: UserCheck, color: "neutral" },
  memberJoined: { icon: CircleCheck, color: "success" },
  roleChanged: { icon: ShieldCheck, color: "neutral" },
} as const

/** The day an event happened, as a key: "2026-10-19". */
export function eventDay(event: ActivityEvent) {
  return event.at.slice(0, 10)
}

/** "Today", "Yesterday" or the date, against the demo's today. */
export function useDayLabel() {
  const t = useTranslations("inset.activity")
  const format = useFormats()
  const yesterday = new Date(`${insetToday}T00:00:00Z`)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  return (day: string) => (day === insetToday ? t("today") : day === yesterday.toISOString().slice(0, 10) ? t("yesterday") : format.date(day))
}

/** Events on a timeline: what happened as a sentence, who did it and when. */
export function ActivityTimeline({ events, showDay = false }: { events: ActivityEvent[]; showDay?: boolean }) {
  const t = useTranslations("inset.activity")
  const format = useFormats()
  const dayLabel = useDayLabel()
  const intl = localeInfo[useLocale()].intl
  // Times in UTC, like the data: the server and the browser write the same thing.
  const time = new Intl.DateTimeFormat(intl, { hour: "numeric", minute: "2-digit", timeZone: "UTC" })
  return (
    <Timeline
      items={events.map((event) => {
        const { icon: Icon, color } = markers[event.event]
        const values = { ...event.values, ...(typeof event.values.amount === "number" && { amount: format.currency(event.values.amount) }) }
        const at = time.format(new Date(event.at))
        return {
          id: event.id,
          icon: <Icon />,
          color,
          title: t(`events.${event.event}`, values),
          time: `${showDay ? `${dayLabel(eventDay(event))}, ${at}` : at} · ${t("by", { actor: event.actor })}`,
          dateTime: event.at,
        }
      })}
    />
  )
}
