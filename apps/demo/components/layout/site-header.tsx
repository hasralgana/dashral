// @dashral-if customizer
import { CustomizerButton } from "@/components/customizer/customizer-button"
// @dashral-end
import { ThemeToggle } from "@/components/theme-toggle"

// @dashral-if i18n
import { LanguageSwitcher } from "./language-switcher"
// @dashral-end
import { MobileNav } from "./mobile-nav"
import { Notifications } from "./notifications"
import { SearchCommand } from "./search-command"
// @dashral-if switcher
import { TemplateSwitcher } from "./template-switcher"
// @dashral-end
import { UserNav } from "./user-nav"

export function SiteHeader() {
  return (
    <header data-slot="site-header" className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-divider bg-background/80 px-4 backdrop-blur md:px-6">
      <MobileNav />
      <div className="flex max-w-sm sm:flex-1">
        <SearchCommand />
      </div>
      <div className="ms-auto flex items-center gap-1">
        {/* @dashral-if switcher */}
        <div className="me-1.5">
          <TemplateSwitcher />
        </div>
        {/* @dashral-end */}
        {/* @dashral-if customizer */}
        <CustomizerButton />
        {/* @dashral-end */}
        {/* @dashral-if i18n */}
        <LanguageSwitcher />
        {/* @dashral-end */}
        <ThemeToggle />
        <Notifications />
        <div className="ms-2">
          <UserNav />
        </div>
      </div>
    </header>
  )
}
