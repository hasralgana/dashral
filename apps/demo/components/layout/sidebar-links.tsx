"use client"

import { ArrowUpRight, BookOpen } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@dashral/ui/components/button"
import { Tooltip } from "@dashral/ui/components/tooltip"

import { GitHubIcon } from "@/components/icons"
import { dashral } from "@/lib/site"
import { useDir } from "@/lib/use-dir"

// Links about the template itself, at the foot of the sidebar: they open the Dashral website and repository, so
// they stay out of the header, which is for the app's own controls. Hidden when the app doesn't point to the template
// (lib/site.ts → dashral.show).
const links = [
  { title: "docs", href: dashral.links.docs, icon: BookOpen, label: "docsLabel" },
  { title: "github", href: dashral.links.github, icon: GitHubIcon, label: "githubLabel" },
] as const

export function SidebarLinks() {
  const t = useTranslations("layout")
  const dir = useDir()
  // GitHub is a name; "Docs" is translated.
  const title = (key: (typeof links)[number]["title"]) => (key === "github" ? "GitHub" : t(key))
  if (!dashral.show) return null
  return (
    <div className="border-t border-divider px-3 py-2 collapsed:px-2">
      {/* Expanded: the links share the row equally, each filling its part */}
      <ul className="grid auto-cols-fr grid-flow-col gap-1 collapsed:hidden">
        {links.map((link) => (
          <li key={link.title} className="min-w-0">
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="group flex h-8 w-full items-center gap-1.5 rounded-md px-2 text-[13px] text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <link.icon className="size-3.5" aria-hidden />
              {title(link.title)}
              <ArrowUpRight className="ms-auto size-3 shrink-0 opacity-50 transition-opacity group-hover:opacity-100 rtl:-scale-x-100" aria-hidden />
              <span className="sr-only">{t("newTab")}</span>
            </a>
          </li>
        ))}
      </ul>
      {/* Minimized: icons, named on hover */}
      <ul className="hidden flex-col items-center gap-1 collapsed:flex">
        {links.map((link) => (
          <li key={link.title}>
            <Tooltip content={title(link.title)} side={dir === "rtl" ? "left" : "right"}>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" asChild>
                <a href={link.href} target="_blank" rel="noreferrer" aria-label={`${t(link.label)} ${t("newTab")}`}>
                  <link.icon className="size-4" />
                </a>
              </Button>
            </Tooltip>
          </li>
        ))}
      </ul>
    </div>
  )
}
