"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@dashral/ui/components/button"
import { useTranslations } from "next-intl"
import { Sheet } from "@dashral/ui/components/sheet"

import { SidebarNav } from "./sidebar-nav"

export function MobileNav() {
  const t = useTranslations("layout")
  const [open, setOpen] = useState(false)

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      side="start"
      title={t("navigation")}
      padding="none"
      trigger={
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("openMenu")}>
          <Menu />
        </Button>
      }
      className="w-72 bg-sidebar"
    >
      <SidebarNav onNavigate={() => setOpen(false)} />
    </Sheet>
  )
}
