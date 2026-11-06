"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Check, Monitor, Moon, RotateCcw, Shuffle, Sun, Undo2, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { Button } from "@dashral/ui/components/button"
import { CopyButton } from "@dashral/ui/components/copy-button"
import { SegmentedControl } from "@dashral/ui/components/segmented-control"
import { Switch } from "@dashral/ui/components/switch"
import { Tooltip } from "@dashral/ui/components/tooltip"
import { presets, sameLook, shuffleLook, type ThemeLook as Look } from "@dashral/ui/lib/themes"
import { cn } from "@dashral/ui/lib/utils"

import { dashral } from "@/lib/site"
import type { Template } from "@/lib/templates"
import {
  readThemeSettings,
  saveThemeSettings,
  templateThemeDefaults,
  themeOptions,
  themeStorageKey,
  type ThemeSettings,
} from "@/lib/theme-settings"
import { useTemplate } from "@/lib/use-template"

import { CUSTOMIZER_ID, setCustomizerOpen, useCustomizerOpen } from "./store"

// Each font's own family, for its segment (not the page's text font, which follows the choice).
const fontPreview: Record<ThemeSettings["font"], string> = {
  inter: "var(--font-inter), sans-serif",
  geist: "var(--font-geist), sans-serif",
  system: "ui-sans-serif, system-ui, -apple-system, sans-serif",
}

/** The look as a `npx create-dashral` command (packages/create-dashral, which runs `pnpm dashral init` with these
 * flags): the template, and each setting that isn't its default. */
function setupCommand(template: Template, settings: ThemeSettings) {
  const defaults = templateThemeDefaults[template]
  const keys = ["primary", "light", "dark", "card", "radius", "font"] as const
  const flags = keys.filter((key) => settings[key] !== defaults[key]).map((key) => ` --${key} ${settings[key]}`)
  return `npx create-dashral my-app --template ${template}${flags.join("")}`
}

/** One setting: its name, what it's set to, and its control under them. */
function Row({ label, value, children }: { label: string; value?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex min-h-5 items-center justify-between gap-3">
        <h3 className="text-xs font-medium text-muted-foreground">{label}</h3>
        {/* What it's set to, as words; or controls of its own (the presets' Shuffle and Undo). */}
        {typeof value === "string" ? <span className="truncate text-xs font-medium">{value}</span> : value}
      </div>
      {children}
    </section>
  )
}

/**
 * Colors as round swatches in one row, a radio group underneath (arrow keys move between them, each is read by name);
 * the picked one wears a ring and a check.
 */
function SwatchGroup<T extends string>({
  name,
  label,
  value,
  options,
  onChange,
}: {
  name: string
  label: string
  value: T
  options: { value: T; label: string; swatch: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const checked = option.value === value
        // A dark check on light colors (amber, the light backgrounds), a white one on the rest: from the OKLCH lightness.
        const light = Number(/oklch\(([\d.]+)/.exec(option.swatch)?.[1] ?? 0) > 0.7
        return (
          <Tooltip key={option.value} content={option.label}>
            <label
              className={cn(
                "grid size-8 cursor-pointer place-items-center rounded-full p-0.5 ring-offset-background transition-shadow duration-(--duration-fast)",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50",
                checked ? "ring-2 ring-foreground/70" : "hover:ring-2 hover:ring-border"
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                aria-label={option.label}
                className="sr-only"
              />
              <span className="grid size-full place-items-center rounded-full ring-1 ring-black/10 ring-inset dark:ring-white/15" style={{ background: option.swatch }}>
                {checked && <Check className={cn("size-3.5", light ? "text-black/75" : "text-white")} strokeWidth={2.5} aria-hidden />}
              </span>
            </label>
          </Tooltip>
        )
      })}
    </div>
  )
}

/**
 * Whole looks in one click: each a small card with its color and both backgrounds, and its name; the one that matches
 * what's set is marked. A radio group underneath, like the swatches.
 */
function PresetGroup({ label, current, names, onPick }: { label: string; current: Look; names: Record<string, string>; onPick: (look: Look, name: string) => void }) {
  const swatch = (key: "primary" | "light" | "dark", value: string) => themeOptions[key].find((option) => option.value === value)!.swatch
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-1.5">
      {presets.map((preset) => {
        const checked = sameLook(preset.look, current)
        const name = names[preset.id]!
        return (
          <label
            key={preset.id}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border bg-card px-1 py-2 text-[11px] font-medium transition-[border-color,box-shadow] duration-(--duration-fast)",
              "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50",
              checked ? "border-foreground/60 text-foreground" : "text-muted-foreground hover:border-ring/40 hover:text-foreground"
            )}
          >
            <input type="radio" name="customizer-preset" checked={checked} onChange={() => onPick(preset.look, name)} aria-label={name} className="sr-only" />
            {/* Its color over its two backgrounds. */}
            <span aria-hidden className="flex -space-x-1.5 rtl:space-x-reverse">
              <span className="size-4 rounded-full border border-black/10 ring-2 ring-card dark:border-white/25" style={{ background: swatch("light", preset.look.light) }} />
              <span className="size-4 rounded-full border border-black/10 ring-2 ring-card dark:border-white/25" style={{ background: swatch("dark", preset.look.dark) }} />
              <span className="size-4 rounded-full border border-black/10 ring-2 ring-card dark:border-white/25" style={{ background: swatch("primary", preset.look.primary) }} />
            </span>
            {name}
          </label>
        )
      })}
    </div>
  )
}

/**
 * The theme customizer, beside the page instead of over it, so every change shows on the dashboard as it's made and the
 * dashboard stays in reach. On wide screens (xl) it's docked: the page makes room for it. Narrower, it floats over the
 * page's edge without dimming it; on phones it's a sheet over the bottom of the screen. It stays open from page to
 * page. Each layout puts one at the end of its row; the header's CustomizerButton opens it.
 */
export function CustomizerDock({ className }: { className?: string }) {
  const t = useTranslations("customizer")
  const kit = useTranslations("kit")
  const open = useCustomizerOpen()
  const titleId = useId()
  // Option names in the reader's language (the radius options are numbers).
  const named = <T extends { value: string; label: string }>(options: readonly T[]) =>
    options.map((option) => ({ ...option, label: t(`options.${option.value}` as "options.blue") }))
  const { theme, setTheme } = useTheme()
  // Each template keeps its own settings (Inset starts in black).
  const template = useTemplate()
  const [settings, setSettings] = useState<ThemeSettings>(templateThemeDefaults[template])
  const [mounted, setMounted] = useState(false)
  // Every change can be taken back (Undo, ⌘/Ctrl + Z): the settings before each one, newest last.
  const history = useRef<ThemeSettings[]>([])
  const [canUndo, setCanUndo] = useState(false)
  // What a preset, a shuffle or an undo did, for screen readers.
  const [announcement, setAnnouncement] = useState("")

  useEffect(() => {
    setSettings(readThemeSettings(template))
    setMounted(true)
    history.current = []
    setCanUndo(false)
  }, [template])

  function apply(next: ThemeSettings, said?: string) {
    history.current = [...history.current, settings].slice(-30)
    setCanUndo(true)
    setSettings(next)
    saveThemeSettings(template, next)
    if (said) announce(said)
  }

  // The same words twice in a row (two shuffles) are still heard: the region only speaks when its text changes.
  const announce = (said: string) => setAnnouncement((previous) => (previous === said ? `${said}\u00a0` : said))

  function update<K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) {
    apply({ ...settings, [key]: value })
  }

  function undo() {
    const previous = history.current.at(-1)
    if (!previous) return
    history.current = history.current.slice(0, -1)
    setCanUndo(history.current.length > 0)
    setSettings(previous)
    saveThemeSettings(template, previous)
    announce(t("undone"))
  }

  function reset() {
    apply(templateThemeDefaults[template])
    setTheme("system")
    try {
      localStorage.removeItem(themeStorageKey(template))
    } catch {}
  }

  // ⌘/Ctrl + Z undoes while the panel is open, unless you're typing in a field (which has its own undo).
  const undoRef = useRef(undo)
  undoRef.current = undo
  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "z" || !(event.metaKey || event.ctrlKey) || event.shiftKey || event.altKey) return
      const target = event.target as HTMLElement | null
      const typing = target?.isContentEditable || (target instanceof HTMLInputElement && target.type !== "radio" && target.type !== "checkbox") || target instanceof HTMLTextAreaElement
      if (typing) return
      event.preventDefault()
      undoRef.current()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  // Closing hands the keyboard back to the header's button.
  function close() {
    setCustomizerOpen(false)
    document.querySelector<HTMLElement>("[data-customizer-trigger]")?.focus({ preventScroll: true })
  }

  const mode = (mounted ? theme : "system") as "light" | "dark" | "system"
  const primary = named(themeOptions.primary)
  const light = named(themeOptions.light)
  const dark = named(themeOptions.dark)
  const card = named(themeOptions.card)
  const font = named(themeOptions.font)
  const nameOf = (options: { value: string; label: string }[], value: string) => options.find((option) => option.value === value)?.label

  return (
    <aside
      id={CUSTOMIZER_ID}
      tabIndex={-1}
      aria-labelledby={titleId}
      data-open={open || undefined}
      // Closed, it's out of the way for the keyboard and screen readers too.
      inert={!open}
      onKeyDown={(event) => {
        if (event.key === "Escape") close()
      }}
      className={cn(
        // Phones: a sheet over the bottom of the screen.
        "fixed inset-x-0 bottom-0 z-40 flex h-[min(34rem,62svh)] flex-col overflow-hidden rounded-t-2xl border-t bg-background shadow-2xl outline-none",
        "translate-y-full transition-[translate,width] duration-(--duration-considered) ease-standard data-[open]:translate-y-0 motion-reduce:transition-none",
        // From sm: a panel over the page's end edge, the page left undimmed and usable.
        "sm:inset-x-auto sm:inset-y-0 sm:end-0 sm:h-svh sm:w-75 sm:translate-x-full sm:translate-y-0 sm:rounded-none sm:border-s sm:border-t-0 sm:data-[open]:translate-x-0 rtl:sm:-translate-x-full rtl:sm:data-[open]:translate-x-0",
        // From xl: docked, the page makes room for it as it opens.
        "xl:sticky xl:top-0 xl:bottom-auto xl:z-auto xl:w-0 xl:shrink-0 xl:self-start xl:translate-x-0 xl:border-s-0 xl:shadow-none xl:data-[open]:w-75 xl:data-[open]:border-s rtl:xl:translate-x-0",
        className
      )}
    >
      {/* Its own width, so the contents don't squeeze while the docked panel opens. */}
      <div className="flex min-h-0 w-full flex-1 flex-col sm:w-75 sm:shrink-0">
        <span aria-hidden className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border sm:hidden" />
        <div className="flex items-start gap-3 border-b px-4 pt-3 pb-3.5 sm:pt-4">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-heading text-base font-semibold">
              {t("title")}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("description")}</p>
          </div>
          <Tooltip content={kit("close")}>
            <Button variant="ghost" size="icon-sm" aria-label={kit("close")} onClick={close} className="-me-1.5 -mt-0.5 text-muted-foreground">
              <X />
            </Button>
          </Tooltip>
        </div>
        <span role="status" className="sr-only">
          {announcement}
        </span>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4">
          <Row label={t("mode")}>
            <SegmentedControl
              aria-label={t("mode")}
              value={mode}
              onValueChange={(value) => setTheme(value)}
              className="flex w-full"
              classNames={{ item: "gap-1.5 px-2 text-xs" }}
              options={[
                { value: "light", label: t("light"), icon: <Sun aria-hidden className="size-3.5" /> },
                { value: "dark", label: t("dark"), icon: <Moon aria-hidden className="size-3.5" /> },
                { value: "system", label: t("system"), icon: <Monitor aria-hidden className="size-3.5" /> },
              ]}
            />
          </Row>

          <Row
            label={t("presets")}
            value={
              // Beside the looks: one at random, and the way back from any change.
              <span className="-my-1 -me-1 flex items-center text-muted-foreground">
                <Tooltip content={t("shuffle")}>
                  <Button variant="ghost" size="icon-sm" className="size-7" aria-label={t("shuffle")} onClick={() => apply({ ...settings, ...shuffleLook(settings) }, t("shuffled"))}>
                    <Shuffle />
                  </Button>
                </Tooltip>
                <Tooltip content={`${t("undo")} (⌘Z)`}>
                  <Button variant="ghost" size="icon-sm" className="size-7" aria-label={t("undo")} aria-keyshortcuts="Meta+Z Control+Z" onClick={undo} disabled={!canUndo}>
                    <Undo2 />
                  </Button>
                </Tooltip>
              </span>
            }
          >
            <PresetGroup
              label={t("presets")}
              current={settings}
              names={Object.fromEntries(presets.map((preset) => [preset.id, t(`presetNames.${preset.id}`)]))}
              onPick={(look, name) => apply({ ...settings, ...look }, t("applied", { name }))}
            />
          </Row>

          <Row label={t("primary")} value={nameOf(primary, settings.primary)}>
            <SwatchGroup name="customizer-primary" label={t("primary")} value={settings.primary} options={primary} onChange={(v) => update("primary", v)} />
          </Row>

          <Row label={t("lightBackground")} value={nameOf(light, settings.light)}>
            <SwatchGroup name="customizer-light" label={t("lightBackground")} value={settings.light} options={light} onChange={(v) => update("light", v)} />
          </Row>

          <Row label={t("darkBackground")} value={nameOf(dark, settings.dark)}>
            <SwatchGroup name="customizer-dark" label={t("darkBackground")} value={settings.dark} options={dark} onChange={(v) => update("dark", v)} />
          </Row>

          <Row label={t("card")}>
            <SegmentedControl
              aria-label={t("card")}
              value={settings.card}
              onValueChange={(value) => update("card", value as ThemeSettings["card"])}
              className="flex w-full"
              classNames={{ item: "px-2 text-xs" }}
              options={card.map((option) => ({ value: option.value, label: option.label }))}
            />
          </Row>

          <Row label={t("font")}>
            <SegmentedControl
              aria-label={t("font")}
              value={settings.font}
              onValueChange={(value) => update("font", value as ThemeSettings["font"])}
              className="flex w-full"
              classNames={{ item: "px-2 text-xs" }}
              options={font.map((option) => ({
                value: option.value,
                label: <span style={{ fontFamily: fontPreview[option.value] }}>{option.label}</span>,
              }))}
            />
          </Row>

          <Row label={t("radius")} value={`${themeOptions.radius.find((option) => option.value === settings.radius)?.label}rem`}>
            {/* Each segment draws its corner, so the choice is seen rather than read. */}
            <SegmentedControl
              aria-label={t("radius")}
              value={settings.radius}
              onValueChange={(value) => update("radius", value as ThemeSettings["radius"])}
              className="flex w-full"
              classNames={{ item: "px-2" }}
              options={themeOptions.radius.map((option) => ({
                value: option.value,
                "aria-label": `${option.label}rem`,
                icon: <span aria-hidden className="size-3.5 border-s-2 border-t-2 border-current" style={{ borderStartStartRadius: `${option.label}rem` }} />,
              }))}
            />
          </Row>

          <div className="space-y-4 border-t pt-4">
            <Switch
              label={t("mono")}
              description={t("monoDescription")}
              labelPosition="start"
              checked={settings.mono}
              onCheckedChange={(v) => update("mono", v)}
            />
            <Switch
              label={t("reduceMotion")}
              description={t("reduceMotionDescription")}
              labelPosition="start"
              checked={settings.reduceMotion}
              onCheckedChange={(v) => update("reduceMotion", v)}
            />
          </div>
        </div>

        <div className="space-y-1.5 border-t p-4 pt-3">
          {/* Starts a new project with this look (npx create-dashral); only while the app points to Dashral. */}
          {dashral.show && (
            <>
              <CopyButton value={setupCommand(template, settings)} label={t("copyCommand")} variant="outline" size="sm" className="w-full" />
              <p className="text-center text-[11px] text-muted-foreground">{t("copyCommandHint")}</p>
            </>
          )}
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={reset}>
            <RotateCcw /> {t("reset")}
          </Button>
        </div>
      </div>
    </aside>
  )
}
