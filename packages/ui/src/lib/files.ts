"use client"

// Files picked in a form: their size in words, whether a file is accepted, and a small preview. FileDropzone and
// PromptComposer share them.

import * as React from "react"
import { FileIcon } from "lucide-react"

import type { useLocale } from "./locale"
import { cn } from "./utils"

/** "1.4 MB", in the locale's digits. */
export function formatBytes(bytes: number, locale = "en-US") {
  const units = ["B", "KB", "MB", "GB"]
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toLocaleString(locale, { maximumFractionDigits: unit === 0 ? 0 : 1 })} ${units[unit]}`
}

/** "image/*,.pdf" → "Images, PDF". */
export function acceptLabel(accept: string, t: ReturnType<typeof useLocale>["t"]) {
  const kinds: Record<string, string> = { image: t("images"), video: t("videos"), audio: t("audio"), text: t("textFiles") }
  return accept
    .split(",")
    .map((raw) => {
      const rule = raw.trim()
      if (rule.endsWith("/*")) return kinds[rule.slice(0, -2)] ?? rule
      if (rule.startsWith(".")) return rule.slice(1).toUpperCase()
      return rule.split("/").at(-1)!.toUpperCase()
    })
    .join(", ")
}

/** Whether a file matches an `accept` list ("image/*", ".pdf,.docx", "image/png"); everything does without one. */
export function accepts(file: File, accept: string | undefined) {
  if (!accept) return true
  return accept.split(",").some((raw) => {
    const rule = raw.trim().toLowerCase()
    if (rule.startsWith(".")) return file.name.toLowerCase().endsWith(rule)
    if (rule.endsWith("/*")) return file.type.startsWith(rule.slice(0, -1))
    return file.type === rule
  })
}

/** A small preview of an image file, or a file icon. */
export function FileThumb({ file, className }: { file: File; className?: string }) {
  const [url, setUrl] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (!file.type.startsWith("image/")) return
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [file])
  return React.createElement(
    "span",
    { "aria-hidden": true, className: cn("flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-muted-foreground", className) },
    url ? React.createElement("img", { src: url, alt: "", className: "size-full object-cover" }) : React.createElement(FileIcon, { className: "size-4" })
  )
}
