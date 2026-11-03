import type messages from "./messages/en"
import type { Locale } from "./lib/i18n"

// Typed translations: a key missing from messages/en, or a wrong locale, fails the typecheck.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale
    Messages: typeof messages
  }
}
