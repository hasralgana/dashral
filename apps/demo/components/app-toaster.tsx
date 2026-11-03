"use client"

import { useTheme } from "next-themes"
import { Toaster } from "@dashral/ui/components/toast"

import { useDir } from "@/lib/use-dir"

/** Toaster that follows the light/dark toggle, not only the OS setting, and sits at the end corner (left in Arabic). */
export function AppToaster() {
  const { resolvedTheme } = useTheme()
  const dir = useDir()
  return (
    <Toaster theme={resolvedTheme === "dark" ? "dark" : "light"} position={dir === "rtl" ? "bottom-left" : "bottom-right"} dir={dir} />
  )
}
