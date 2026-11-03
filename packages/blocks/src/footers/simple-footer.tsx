import { Sparkles } from "lucide-react"

/** A link in the footer. */
export type FooterLink = { label: string; href: string }
/** A social account: its name, the path of its mark (a 24×24 icon) and where it goes. */
export type SocialLink = { label: string; path: string; href?: string }

const linksOf = (...labels: string[]): FooterLink[] => labels.map((label) => ({ label, href: "#" }))

// Brand marks (Simple Icons, CC0): lucide no longer ships them.
const sampleSocial: SocialLink[] = [
  {
    label: "GitHub",
    path: "M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z",
  },
  { label: "X", path: "M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.63 7.58H.48l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.5h2.04L6.48 3.24H4.3l13.31 17.41Z" },
  {
    label: "LinkedIn",
    path: "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z",
  },
]

/**
 * A footer in two lines: the logo, the main links and the social accounts, then the copyright, the legal links and
 * the system status. Stacks and centers on phones. Every part comes from props.
 */
export function SimpleFooter({
  brand = { name: "Acme", href: "#" },
  links = linksOf("Product", "Pricing", "Docs", "Blog", "Careers"),
  social = sampleSocial,
  copyright,
  legal = linksOf("Privacy", "Terms"),
  status = { label: "All systems normal", href: "#" },
}: {
  brand?: { name: string; href: string; logo?: React.ReactNode }
  links?: FooterLink[]
  social?: SocialLink[]
  /** The copyright line (© this year and the brand without it). */
  copyright?: string
  legal?: FooterLink[]
  /** The status pill; null hides it. */
  status?: { label: string; href: string } | null
}) {
  const link = "rounded-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-6 py-10 md:flex-row md:justify-between">
          <a href={brand.href} className="flex items-center gap-2 rounded-md font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            {brand.logo ?? (
              <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </span>
            )}
            {brand.name}
          </a>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {links.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className={`${link} text-sm`}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          {/* Pulled out by the icon buttons' padding, so the last icon lines up with the content's edge. */}
          <ul className="flex gap-1 md:-me-2.5">
            {social.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href ?? "#"}
                  aria-label={`${brand.name} on ${s.label}`}
                  className="grid size-9 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-4">
                    <path d={s.path} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-center gap-3 border-t py-6 text-xs text-muted-foreground md:flex-row md:justify-between">
          <p>{copyright ?? `© ${new Date().getFullYear()} ${brand.name}. All rights reserved.`}</p>
          <div className="flex items-center gap-4">
            {legal.map(({ label, href }) => (
              <a key={label} href={href} className={link}>
                {label}
              </a>
            ))}
            {status && (
              <a href={status.href} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50">
                <span className="relative flex size-2" aria-hidden>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
                  <span className="relative inline-flex size-2 rounded-full bg-success" />
                </span>
                {status.label}
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
