import Link from "next/link"

import { AuthPanel } from "@/components/auth/auth-panel"
import { Logo } from "@/components/icons"
// @dashral-if i18n
import { LanguageSwitcher } from "@/components/layout/language-switcher"
// @dashral-end
import { ThemeToggle } from "@/components/theme-toggle"
import { siteConfig } from "@/lib/site"

// The sign-in pages as a split screen: the form on one side, and on wide screens the brand panel on the other. The
// pages' cards lose their frame here, so the form sits on the page.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex min-h-svh flex-col">
        <header className="flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-semibold">
            <Logo className="size-7" />
            {siteConfig.name}
          </Link>
          <div className="flex items-center gap-1">
            {/* @dashral-if i18n */}
            <LanguageSwitcher />
            {/* @dashral-end */}
            <ThemeToggle />
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 pb-16">
          <div className="w-full max-w-sm *:data-[slot=card]:border-transparent *:data-[slot=card]:bg-transparent *:data-[slot=card]:shadow-none">
            {children}
          </div>
        </main>
      </div>
      <AuthPanel />
    </div>
  )
}
