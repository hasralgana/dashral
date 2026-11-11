import { Suspense } from "react"
import type { Metadata, Viewport } from "next"
import { Geist, IBM_Plex_Sans_Arabic, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"

import { AppToaster } from "@/components/app-toaster"
import { NavigationProgress } from "@/components/navigation-progress"
import { KitLocaleProvider } from "@/components/locale-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { localeInfo, type Locale } from "@/lib/i18n"
import { siteConfig } from "@/lib/site"
import { inputModalityScript } from "@/lib/input-modality"
import { sidebarScript } from "@/lib/sidebar-script"
import { themeSettingsScript } from "@/lib/theme-settings"

import "./globals.css"

// Inter for text and Geist for headings; the theme reads them through these variables.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" })
// @dashral-if i18n
// Arabic letters: Inter and Geist have none. The theme falls back to this font for them; the browser only downloads
// it when a page shows Arabic.
const arabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-arabic", display: "swap" })
// @dashral-end
const fontVariables = [
  inter.variable,
  geist.variable,
  // @dashral-if i18n
  arabic.variable,
  // @dashral-end
].join(" ")

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  applicationName: siteConfig.name,
  authors: siteConfig.author && [siteConfig.author],
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0d0f" },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocale()) as Locale
  const messages = await getMessages()
  return (
    <html lang={locale} dir={localeInfo[locale].dir} className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Applies saved customizer settings before first paint (no flash). */}
        <script dangerouslySetInnerHTML={{ __html: `${themeSettingsScript};${sidebarScript};${inputModalityScript}` }} />
      </head>
      <body>
        <NextIntlClientProvider>
          <KitLocaleProvider locale={locale} messages={messages.kit}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              {/* Reads the address, query included, so it waits in a Suspense of its own. */}
              <Suspense fallback={null}>
                <NavigationProgress />
              </Suspense>
              {children}
              <AppToaster />
            </ThemeProvider>
          </KitLocaleProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
