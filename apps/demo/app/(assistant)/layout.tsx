import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@dashral/ui/components/button"

import { Logo } from "@/components/icons"
// @dashral-if i18n
import { LanguageSwitcher } from "@/components/layout/language-switcher"
// @dashral-end
import { ThemeToggle } from "@/components/theme-toggle"

// The AI assistant as a page of its own, like a chat app: no sidebar or dashboard header, only a thin bar with the
// way back, and the conversation filling the rest of the screen.
export default async function AssistantLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("assistant")
  return (
    <div className="flex h-svh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-divider px-2 md:px-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/" aria-label={t("back")}>
            <ArrowLeft className="rtl:-scale-x-100" />
          </Link>
        </Button>
        <Logo className="size-6" />
        <h1 className="truncate font-medium">{t("title")}</h1>
        <div className="ms-auto flex items-center gap-1">
          {/* @dashral-if i18n */}
          <LanguageSwitcher />
          {/* @dashral-end */}
          <ThemeToggle />
        </div>
      </header>
      <main className="min-h-0 flex-1">{children}</main>
    </div>
  )
}
