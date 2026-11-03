"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { Button } from "@dashral/ui/components/button"
import { DropdownMenu } from "@dashral/ui/components/dropdown-menu"
import { Tooltip } from "@dashral/ui/components/tooltip"

export function ThemeToggle() {
  const t = useTranslations("customizer")
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu
      align="end"
      trigger={
        <Tooltip content={t("theme")}>
          <Button variant="ghost" size="icon" aria-label={t("changeTheme")}>
            <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          </Button>
        </Tooltip>
      }
      items={[
        {
          type: "radio",
          value: theme ?? "system",
          onValueChange: setTheme,
          options: [
            { value: "light", label: t("light"), icon: <Sun /> },
            { value: "dark", label: t("dark"), icon: <Moon /> },
            { value: "system", label: t("system"), icon: <Monitor /> },
          ],
        },
      ]}
    />
  )
}
