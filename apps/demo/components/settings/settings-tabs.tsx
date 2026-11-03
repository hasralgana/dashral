"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { Monitor, Moon, Sun } from "lucide-react"
import { Avatar } from "@dashral/ui/components/avatar"
import { Button } from "@dashral/ui/components/button"
import { Card } from "@dashral/ui/components/card"
import { Dialog, DialogClose } from "@dashral/ui/components/dialog"
import { Input } from "@dashral/ui/components/input"
import { SegmentedControl } from "@dashral/ui/components/segmented-control"
import { Select } from "@dashral/ui/components/select"
import { Separator } from "@dashral/ui/components/separator"
import { Switch } from "@dashral/ui/components/switch"
import { Tabs } from "@dashral/ui/components/tabs"
import { Textarea } from "@dashral/ui/components/textarea"
import { toast } from "@dashral/ui/components/toast"
import { reducedMotion } from "@dashral/ui/lib/motion"

import { setLocaleAction } from "@/lib/actions/locale"
import { localeInfo, locales } from "@/lib/i18n"

import type { SettingsTab } from "./tabs"



/**
 * Saving in this demo: the button shows it's working for a moment, then a toast. Wire `onSave` to your API — the
 * form's values are in the FormData.
 */
function useSave(message: string, work?: () => Promise<void>) {
  const [saving, setSaving] = useState(false)
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setTimeout(async () => {
      await work?.()
      setSaving(false)
      toast.success(message)
    }, 700)
  }
  return { saving, onSubmit }
}

function ProfileTab() {
  const t = useTranslations("settings.profile")
  const { saving, onSubmit } = useSave(t("saved"))
  return (
    <form onSubmit={onSubmit}>
      <Card
        title={t("title")}
        description={t("description")}
        footer={
          <Button type="submit" size="sm" loading={saving}>
            {t("save")}
          </Button>
        }
        footerDivider
        classNames={{ body: "grid gap-5", footer: "justify-end" }}
      >
        <div className="flex items-center gap-4">
          <Avatar src="https://randomuser.me/api/portraits/women/68.jpg" name="Jane Doe" alt="" size="xl" />
          <div className="grid gap-1.5">
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm">
                {t("changePhoto")}
              </Button>
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground">
                {t("removePhoto")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("photoHint")}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t("name")} name="name" defaultValue="Jane Doe" autoComplete="name" required />
          <Input label={t("email")} name="email" type="email" defaultValue="jane@example.com" autoComplete="email" required />
        </div>
        <Textarea
          label={t("bio")}
          name="bio"
          placeholder={t("bioPlaceholder")}
          maxLength={160}
          description={t("bioHint")}
        />
      </Card>
    </form>
  )
}

function AccountTab() {
  const t = useTranslations("settings")
  const router = useRouter()
  const current = useLocale()
  const [language, setLanguage] = useState<string>(current)
  // Saving the preferences switches the dashboard's language (a cookie) and reloads it in the new one.
  const { saving, onSubmit } = useSave(t("preferences.saved"), async () => {
    if (language !== current) {
      await setLocaleAction(language)
      router.refresh()
    }
  })
  const password = useSave(t("password.saved"))
  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit}>
        <Card
          title={t("preferences.title")}
          description={t("preferences.description")}
          footer={
            <Button type="submit" size="sm" loading={saving}>
              {t("preferences.save")}
            </Button>
          }
          footerDivider
          classNames={{ body: "grid gap-4 sm:grid-cols-2", footer: "justify-end" }}
        >
          <Select
            label={t("preferences.language")}
            name="language"
            value={language}
            onValueChange={setLanguage}
            // Each language is named in itself.
            options={locales.map((locale) => ({ value: locale, label: localeInfo[locale].label }))}
          />
          <Select
            label={t("preferences.timeZone")}
            name="timeZone"
            defaultValue="Asia/Jakarta"
            options={[
              { value: "Asia/Jakarta", label: "Jakarta (GMT+7)" },
              { value: "Asia/Singapore", label: "Singapore (GMT+8)" },
              { value: "Europe/London", label: "London (GMT+1)" },
              { value: "America/New_York", label: "New York (GMT−4)" },
            ]}
          />
        </Card>
      </form>

      <form onSubmit={password.onSubmit}>
        <Card
          title={t("password.title")}
          description={t("password.description")}
          footer={
            <Button type="submit" size="sm" loading={password.saving}>
              {t("password.save")}
            </Button>
          }
          footerDivider
          classNames={{ body: "grid gap-4 sm:grid-cols-2", footer: "justify-end" }}
        >
          <Input label={t("password.current")} name="current" type="password" autoComplete="current-password" required />
          <Input label={t("password.new")} name="next" type="password" autoComplete="new-password" minLength={8} required />
        </Card>
      </form>

      <Card
        title={t("delete.title")}
        description={t("delete.description")}
        footer={
          <Dialog
            trigger={<Button size="sm" color="destructive">{t("delete.button")}</Button>}
            title={t("delete.confirmTitle")}
            description={t("delete.confirmDescription")}
            footer={
              <>
                <DialogClose asChild>
                  <Button variant="outline">{t("delete.cancel")}</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button color="destructive" onClick={() => toast(t("delete.demo"))}>
                    {t("delete.button")}
                  </Button>
                </DialogClose>
              </>
            }
          />
        }
        footerDivider
        className="border-destructive/30"
        classNames={{ footer: "justify-end" }}
      />
    </div>
  )
}

// The switches, grouped; their words are in messages → settings.notifications.items.
const notificationGroups = [
  {
    key: "email",
    items: [
      { id: "email-orders", key: "orders", on: true },
      { id: "email-payments", key: "payments", on: true },
      { id: "email-summary", key: "summary", on: false },
    ],
  },
  {
    key: "app",
    items: [
      { id: "app-mentions", key: "mentions", on: true },
      { id: "app-stock", key: "stock", on: true },
    ],
  },
] as const

function NotificationsTab() {
  const t = useTranslations("settings.notifications")
  const { saving, onSubmit } = useSave(t("saved"))
  return (
    <form onSubmit={onSubmit}>
      <Card
        title={t("title")}
        description={t("description")}
        footer={
          <Button type="submit" size="sm" loading={saving}>
            {t("save")}
          </Button>
        }
        footerDivider
        classNames={{ body: "grid gap-6", footer: "justify-end" }}
      >
        {notificationGroups.map((group, i) => (
          <section key={group.key} aria-labelledby={`group-${i}`} className="grid gap-4">
            {i > 0 && <Separator className="bg-divider" />}
            <div>
              <h3 id={`group-${i}`} className="text-sm font-medium">
                {t(group.key)}
              </h3>
              <p className="text-xs text-muted-foreground">
                {group.key === "email" ? t("emailDescription", { email: "jane@example.com" }) : t("appDescription")}
              </p>
            </div>
            {group.items.map((item) => (
              <Switch
                key={item.id}
                name={item.id}
                label={t(`items.${item.key}.label`)}
                description={t(`items.${item.key}.hint`)}
                labelPosition="start"
                defaultChecked={item.on}
              />
            ))}
          </section>
        ))}
      </Card>
    </form>
  )
}

/** A duration token in milliseconds; browsers may hand it back as "240ms" or ".24s". */
function durationOf(token: string, fallback: number) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  const n = parseFloat(raw)
  if (!Number.isFinite(n)) return fallback
  return raw.endsWith("ms") ? n : raw.endsWith("s") ? n * 1000 : n
}

function AppearanceTab() {
  const t = useTranslations("settings.appearance")
  const { theme, setTheme } = useTheme()
  // The theme is only known in the browser; until then, nothing is shown as picked.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  // The theme switches with every transition off for a moment (no colors fading), which would also stop the
  // highlight from sliding. So the choice moves first, and the theme follows once the highlight is there.
  const [picked, setPicked] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  function pick(next: string) {
    setPicked(next)
    window.clearTimeout(timer.current)
    const reduced = reducedMotion()
    timer.current = window.setTimeout(
      () => {
        setTheme(next)
        setPicked(null)
      },
      reduced ? 0 : durationOf("--duration-standard", 240)
    )
  }

  return (
    <Card
      title={t("title")}
      description={t("description")}
    >
      <SegmentedControl
        label={t("theme")}
        value={picked ?? (mounted ? (theme ?? "system") : "")}
        onValueChange={pick}
        options={[
          { value: "light", label: t("light"), icon: <Sun aria-hidden /> },
          { value: "dark", label: t("dark"), icon: <Moon aria-hidden /> },
          { value: "system", label: t("system"), icon: <Monitor aria-hidden /> },
        ]}
      />
    </Card>
  )
}

/**
 * The settings, a tab each. The tab is in the URL (?tab=account), so menus and links can open the right one.
 * `panels` replaces a tab's demo content with your own — e.g. a profile form wired to the signed-in user.
 */
export function SettingsTabs({ tab: requested, panels = {} }: { tab: SettingsTab; panels?: Partial<Record<SettingsTab, React.ReactNode>> }) {
  const t = useTranslations("settings.tabs")
  const router = useRouter()
  const pathname = usePathname()
  const [tab, setTab] = useState(requested)
  // A link to another tab while the page is open (the user menu) switches to it.
  const [lastRequested, setLastRequested] = useState(requested)
  if (requested !== lastRequested) {
    setLastRequested(requested)
    setTab(requested)
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(next) => {
        setTab(next as SettingsTab)
        router.replace(next === "profile" ? pathname : `${pathname}?tab=${next}`, { scroll: false })
      }}
      className="gap-6"
      variant="line"
      items={[
        { value: "profile", label: t("profile"), content: panels.profile ?? <ProfileTab /> },
        { value: "account", label: t("account"), content: panels.account ?? <AccountTab /> },
        { value: "notifications", label: t("notifications"), content: panels.notifications ?? <NotificationsTab /> },
        { value: "appearance", label: t("appearance"), content: panels.appearance ?? <AppearanceTab /> },
      ]}
      classNames={{ list: "w-full justify-start border-b border-divider" }}
    />
  )
}
