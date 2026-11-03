// Your app's brand, in one place: siteConfig, at the end of this file. Rename it there and the sidebar, the sign-in
// and error pages, the page titles, link previews and the text in every language follow (messages/ write the name as
// {brand}, filled in by i18n/request.ts).
// The logo is drawn in two files: components/icons.tsx (Logo, in the theme's colors) and app/icon.svg (the favicon,
// also used for the Apple touch icon and link previews). README.md → "Make it yours" lists every step.

// Canonical production URL — change this when you deploy your own copy.
const productionUrl = "https://demo.dashral.com"

function resolveSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_ENV === "production") return productionUrl
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}

/** The Dashral website: component docs, guides and the shadcn registry (dashral.com). */
const websiteUrl =
  process.env.NEXT_PUBLIC_WEBSITE_URL || "https://dashral.com"

/**
 * Dashral, the template this app is built on (messages/ write its name as {dashral}). While `show` is on, the app
 * points to it: the Pro card and the Pro features in the menu, the Docs and GitHub links in the sidebar, "All
 * templates", the Free tag beside the logo and the customizer's setup command. NEXT_PUBLIC_DASHRAL_LINKS ("true" or
 * "false") overrides the default below; off, your app names only your brand.
 */
export const dashral = {
  name: "Dashral",
  show: process.env.NEXT_PUBLIC_DASHRAL_LINKS !== "false",
  author: { name: "Hasral Gana", url: "https://github.com/hasralgana" },
  links: {
    demo: productionUrl,
    website: websiteUrl,
    components: `${websiteUrl}/components`,
    docs: `${websiteUrl}/docs`,
    github: "https://github.com/hasralgana/dashral",
    // Dashral Pro: plans and the waitlist, on the website.
    pro: `${websiteUrl}/pricing`,
  },
}

type SiteConfig = {
  name: string
  /** The headline of the link preview image (app/opengraph-image.tsx). */
  tagline: string
  title: string
  description: string
  url: string
  keywords: string[]
  /** Named in the pages' metadata; leave it out to name no one. */
  author?: { name: string; url?: string }
  /** Where "Report a problem" on the 404 page leads; leave it out to hide the button. */
  supportUrl?: string
  /** Where "Follow updates" on the maintenance page leads; leave it out to hide the button. */
  statusUrl?: string
}

const name = "Dashral"

export const siteConfig: SiteConfig = {
  name,
  tagline: "Free Next.js Admin Dashboard",
  title: `${name} — Free Next.js Admin Dashboard Template`,
  description:
    "Free & open-source admin dashboard template built with Next.js, React, TypeScript and Tailwind CSS.",
  url: resolveSiteUrl(),
  keywords: [
    "Next.js dashboard",
    "admin dashboard template",
    "React admin",
    "Tailwind CSS dashboard",
    "shadcn/ui",
    "TypeScript dashboard",
    "open source dashboard",
  ],
  // Dashral's own while the app points to it, and none once it doesn't: put yours here.
  author: dashral.show ? dashral.author : undefined,
  supportUrl: dashral.show ? `${dashral.links.github}/issues` : undefined,
  statusUrl: dashral.show ? dashral.links.github : undefined,
}
