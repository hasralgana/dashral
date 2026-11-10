"use client"

// A number that counts to its new value when it changes, for components that print numbers from their data (chart
// legends, a gauge's value, a bar list's values). A client island, so a server-rendered list can use it too.

import * as React from "react"

import { useCountTo } from "./motion"

/**
 * `value` written with the locale and options, counting from the number on screen to each new one (MetricCard's
 * count). It doesn't count on mount, and never with reduced motion. Takes the options, not an Intl.NumberFormat, so a
 * server component can pass them.
 */
export function CountTo({ value, locale, formatOptions }: { value: number; locale?: string; formatOptions?: Intl.NumberFormatOptions }) {
  const shown = useCountTo(value)
  const format = React.useMemo(() => new Intl.NumberFormat(locale, formatOptions), [locale, formatOptions])
  return format.format(shown)
}
