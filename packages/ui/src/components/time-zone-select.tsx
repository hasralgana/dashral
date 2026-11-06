"use client"

import * as React from "react"

import { useLocale } from "../lib/locale"
import { Combobox, type ComboboxOption } from "./combobox"

type TimeZoneSelectProps = Omit<React.ComponentProps<typeof Combobox>, "options" | "value" | "defaultValue" | "onValueChange"> & {
  /** The time zone, an IANA name ("Asia/Jakarta"), controlled. */
  value?: string
  /** The time zone first picked. "local" for the reader's own (from the browser), once the page has loaded. */
  defaultValue?: string | "local"
  onValueChange?: (timeZone: string) => void
  /** Only these time zones, in place of all the browser knows. */
  timeZones?: string[]
  /** BCP 47 locale for the names ("Western Indonesia Time", "Waktu Indonesia Barat"); the LocaleProvider's by default. */
  locale?: string
}

/** Minutes ahead of UTC for a time zone right now (DST included), e.g. 420 for Asia/Jakarta. */
function offsetOf(timeZone: string, at: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" }).formatToParts(at)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const local = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"))
  return Math.round((local - Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate(), at.getUTCHours(), at.getUTCMinutes())) / 60_000)
}

/** "GMT+07:00", "GMT−03:30", "GMT+00:00": the same width for every zone, so the list lines up. */
function gmt(offset: number) {
  const sign = offset < 0 ? "−" : "+"
  const abs = Math.abs(offset)
  return `GMT${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`
}

/** Every time zone the browser knows, or a short list where it can't say (older engines). */
function allTimeZones(): string[] {
  try {
    return (Intl as unknown as { supportedValuesOf: (key: string) => string[] }).supportedValuesOf("timeZone")
  } catch {
    return ["UTC", "America/Los_Angeles", "America/New_York", "Europe/London", "Europe/Paris", "Asia/Dubai", "Asia/Kolkata", "Asia/Jakarta", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney"]
  }
}

/**
 * A time zone picker, in one tag: `<TimeZoneSelect label="Time zone" defaultValue="local" />`. Each zone reads
 * "GMT+07:00 Jakarta" with its name in the reader's language under it ("Western Indonesia Time"), sorted by offset,
 * and is found by city, region or name. The offsets are today's, daylight saving included. Built on Combobox, so it
 * takes the same label, description, error and classNames.
 */
function TimeZoneSelect({ value, defaultValue, onValueChange, timeZones, locale: localeProp, placeholder, searchPlaceholder, ...props }: TimeZoneSelectProps) {
  const { t, locale: contextLocale } = useLocale()
  const locale = localeProp ?? contextLocale
  const [internal, setInternal] = React.useState(defaultValue === "local" ? "" : (defaultValue ?? ""))
  // "local" can only be known in the browser: filled in once it has loaded, so the server and browser agree first.
  React.useEffect(() => {
    if (defaultValue === "local" && value === undefined) setInternal(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [defaultValue, value])
  const current = value ?? internal

  const options = React.useMemo<ComboboxOption[]>(() => {
    const now = new Date()
    /** The zone's name in the locale, "Western Indonesia Time"; "" where the engine can't say. */
    const nameOf = (timeZone: string) => {
      try {
        return new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: "long" }).formatToParts(now).find((p) => p.type === "timeZoneName")?.value ?? ""
      } catch {
        return ""
      }
    }
    const zones = timeZones ?? allTimeZones()
    return zones
      .map((zone) => {
        let offset = 0
        try {
          offset = offsetOf(zone, now)
        } catch {
          return null
        }
        // "America/Argentina/Buenos_Aires" → "Buenos Aires"; the region stays searchable through the description.
        const city = zone.split("/").at(-1)!.replace(/_/g, " ")
        const name = nameOf(zone)
        return { zone, offset, option: { value: zone, label: `${gmt(offset)} ${city}`, description: [name, zone.includes("/") ? zone.split("/")[0]!.replace(/_/g, " ") : ""].filter(Boolean).join(" · ") } }
      })
      .filter((entry) => entry !== null)
      .sort((a, b) => a.offset - b.offset || a.option.label.localeCompare(b.option.label, locale))
      .map((entry) => entry.option)
  }, [timeZones, locale])

  return (
    <Combobox
      {...props}
      placeholder={placeholder ?? t("pickTimeZone")}
      searchPlaceholder={searchPlaceholder ?? t("searchTimeZones")}
      options={options}
      value={current}
      onValueChange={(next) => {
        // Picking the current zone again would clear it; a time zone setting always keeps one.
        const zone = next || current
        if (value === undefined) setInternal(zone)
        if (zone !== current) onValueChange?.(zone)
      }}
    />
  )
}

export { TimeZoneSelect, type TimeZoneSelectProps }
