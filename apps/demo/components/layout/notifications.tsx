"use client"

import { useState } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import {
  AtSign,
  Bell,
  BellOff,
  CheckCheck,
  CreditCard,
  FileChartColumn,
  Rocket,
  Settings,
  ShoppingBag,
  UserPlus,
  type LucideIcon,
} from "lucide-react"
import { Badge } from "@dashral/ui/components/badge"
import { Button } from "@dashral/ui/components/button"
import { EmptyState } from "@dashral/ui/components/empty-state"
import { Popover } from "@dashral/ui/components/popover"
import { Tabs } from "@dashral/ui/components/tabs"
import { Tooltip } from "@dashral/ui/components/tooltip"
import { cn } from "@dashral/ui/lib/utils"

import { localeInfo } from "@/lib/i18n"
import { initialNotifications, type Notification } from "@/lib/notifications"
import { useTemplateHref } from "@/lib/use-template"

const typeStyles: Record<Notification["type"], { icon: LucideIcon; className: string }> = {
  order: { icon: ShoppingBag, className: "bg-success/12 text-success-text" },
  payment: { icon: CreditCard, className: "bg-destructive/10 text-destructive-text" },
  mention: { icon: AtSign, className: "bg-highlight/12 text-highlight-text" },
  customer: { icon: UserPlus, className: "bg-info/12 text-info-text" },
  report: { icon: FileChartColumn, className: "bg-primary/12 text-primary-text" },
  system: { icon: Rocket, className: "bg-warning/18 text-warning-text" },
}

/** "2 minutes ago", "3 hours ago", "yesterday" — in the reader's language. */
function ago(minutes: number, locale: string) {
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
  if (minutes < 60) return relative.format(-minutes, "minute")
  if (minutes < 60 * 24) return relative.format(-Math.round(minutes / 60), "hour")
  return relative.format(-Math.round(minutes / (60 * 24)), "day")
}

/** The bell and its panel. `initial` is what it starts with: the demo's notifications unless your app passes its own. */
export function Notifications({ initial = initialNotifications }: { initial?: Notification[] }) {
  const t = useTranslations("notifications")
  const href = useTemplateHref()
  const intl = localeInfo[useLocale()].intl
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(initial)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const unread = items.filter((n) => !n.read).length
  const visible = filter === "unread" ? items.filter((n) => !n.read) : items

  function markRead(id: string) {
    setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setOpen(false)
  }

  function markAllRead() {
    setItems((list) => list.map((n) => ({ ...n, read: true })))
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="end"
      className="w-[calc(100vw-2rem)] p-0 sm:w-96"
      trigger={
        <Tooltip content={t("title")}>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={unread ? t("titleUnread", { count: unread }) : t("title")}
          >
            <Bell />
            {unread > 0 && (
              <span
                aria-hidden
                className="absolute top-1 end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-semibold text-destructive-foreground tabular-nums ring-2 ring-background"
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>
        </Tooltip>
      }
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        <div>
          <h2 className="font-semibold">{t("title")}</h2>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {unread ? t("unreadCount", { count: unread }) : t("allCaughtUp")}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={markAllRead} disabled={!unread} className="text-primary-text">
          <CheckCheck /> {t("markAllRead")}
        </Button>
      </div>

      <div className="px-4 pb-3">
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as "all" | "unread")}
          items={[
            { value: "all", label: t("all") },
            {
              value: "unread",
              label: (
                <>
                  {t("unread")}
                  {unread > 0 && (
                    <Badge variant="soft" className="rounded-full px-1.5 py-0 text-[10px] font-semibold tabular-nums">
                      {unread}
                    </Badge>
                  )}
                </>
              ),
            },
          ]}
          classNames={{ list: "w-full" }}
        />
      </div>

      {visible.length ? (
        <ul className="max-h-96 divide-y overflow-y-auto border-t">
          {visible.map((n) => {
            const { icon: Icon, className } = typeStyles[n.type]
            return (
              <li key={n.id}>
                <Link
                  href={href(n.href)}
                  onClick={() => markRead(n.id)}
                  className={cn(
                    "flex gap-3 px-4 py-3 transition-colors outline-none hover:bg-accent/60 focus-visible:bg-accent",
                    !n.read && "bg-primary/[0.04]"
                  )}
                >
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", className)}>
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", n.read ? "text-foreground" : "font-semibold")}>
                      {t(`items.${n.message}.title`, n.values)}
                      {!n.read && <span className="sr-only"> ({t("unread")})</span>}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{t(`items.${n.message}.description`, n.values)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{ago(n.minutesAgo, intl)}</p>
                  </div>
                  {!n.read && <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState
          variant="plain"
          icon={<BellOff />}
          title={t("emptyTitle")}
          titleAs="p"
          description={t("emptyDescription")}
          className="gap-3 rounded-none border-t px-4 py-10"
          classNames={{ icon: "size-10 [&_svg]:size-4", title: "text-sm", description: "text-xs" }}
        />
      )}

      <div className="border-t p-2">
        <Button variant="ghost" size="sm" className="w-full" asChild>
          <Link href={href("/settings?tab=notifications")} onClick={() => setOpen(false)}>
            <Settings /> {t("settings")}
          </Link>
        </Button>
      </div>
    </Popover>
  )
}
