"use client"

import { Paintbrush } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@dashral/ui/components/button"
import { Tooltip } from "@dashral/ui/components/tooltip"

import { CUSTOMIZER_ID, setCustomizerOpen, useCustomizerOpen } from "./store"

/** The header's button for the customizer: opens the panel beside the page (and moves the keyboard into it), or closes it. */
export function CustomizerButton() {
  const t = useTranslations("customizer")
  const open = useCustomizerOpen()
  return (
    <Tooltip content={t("open")}>
      <Button
        variant="ghost"
        size="icon"
        data-customizer-trigger
        aria-label={t("open")}
        aria-expanded={open}
        aria-controls={CUSTOMIZER_ID}
        className={open ? "bg-accent text-foreground" : undefined}
        onClick={() => {
          setCustomizerOpen(!open)
          if (!open) requestAnimationFrame(() => document.getElementById(CUSTOMIZER_ID)?.focus({ preventScroll: true }))
        }}
      >
        <Paintbrush />
      </Button>
    </Tooltip>
  )
}
