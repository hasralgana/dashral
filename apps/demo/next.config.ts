import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

// Translations: i18n/request.ts picks the language and loads messages/<locale>.json.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

// The component docs, the shadcn registry and llms.txt moved to the Dashral website (dashral.com). Old links from
// this app — /ui-elements/…, /r/<name>.json — still work: they redirect there.
const website =
  process.env.NEXT_PUBLIC_WEBSITE_URL || "https://dashral.com"

const nextConfig: NextConfig = {
  transpilePackages: ["@dashral/ui"],
  async redirects() {
    return [
      { source: "/ui-elements", destination: `${website}/components`, permanent: true },
      { source: "/ui-elements/:name.md", destination: `${website}/components/:name.md`, permanent: true },
      { source: "/ui-elements/:slug", destination: `${website}/components/:slug`, permanent: true },
      { source: "/r/:path*", destination: `${website}/r/:path*`, permanent: true },
      { source: "/llms.txt", destination: `${website}/llms.txt`, permanent: true },
      // Pages that were docs more than dashboard: their content is on the website now, or became Settings.
      { source: "/tables", destination: `${website}/components/data-table`, permanent: true },
      { source: "/typography", destination: `${website}/docs/typography`, permanent: true },
      { source: "/forms", destination: "/settings", permanent: true },
    ]
  },
}

export default withNextIntl(nextConfig)
