"use client"

import Link from "next/link"
import { Check, ChevronDown, LayoutTemplate } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@dashral/ui/components/button"
import { DropdownMenu } from "@dashral/ui/components/dropdown-menu"

import { dashral } from "@/lib/site"
import { templateHome, templateInfo, templates, type Template } from "@/lib/templates"
import { useTemplate } from "@/lib/use-template"

/**
 * A tiny picture of each template: Classic split by lines with a blue accent, Inset's page on a panel in its shell.
 * A new template needs one here (typecheck asks for it), and its description in messages/<locale>/layout.json.
 */
const previews: Record<Template, React.ReactNode> = {
  classic: (
    <span aria-hidden className="flex h-7 w-10 shrink-0 overflow-hidden rounded-[4px] border bg-card">
      <span className="flex w-3 flex-col gap-0.5 border-e p-0.5 pt-1">
        <span className="h-0.5 rounded-full bg-[oklch(0.546_0.245_262.881)]" />
        <span className="h-0.5 rounded-full bg-muted-foreground/30" />
      </span>
      <span className="flex-1">
        <span className="block h-2 border-b" />
      </span>
    </span>
  ),
  inset: (
    <span aria-hidden className="flex h-7 w-10 shrink-0 rounded-[4px] border bg-muted pe-0.5 pb-0.5 ps-3 pt-2">
      <span className="flex flex-1 items-start rounded-[3px] border bg-card p-0.5">
        <span className="h-0.5 w-2.5 rounded-full bg-foreground" />
      </span>
    </span>
  ),
}

/**
 * Switches between the dashboard templates, in the header where it's seen: each opens at its own address with its
 * own menu and colors. Delete this when your app keeps one template.
 */
export function TemplateSwitcher() {
  const t = useTranslations("layout")
  const current = useTemplate()
  return (
    <DropdownMenu
      align="end"
      sideOffset={8}
      className="w-80"
      linkAs={Link}
      trigger={
        <Button variant="outline" className="h-9 gap-2 ps-2.5 pe-2.5 max-sm:size-9 max-sm:px-0" aria-label={`${t("switchTemplate")}: ${templateInfo[current].name}`}>
          <LayoutTemplate aria-hidden />
          <span className="flex items-baseline gap-1.5 max-sm:hidden">
            <span className="text-muted-foreground max-lg:hidden">{t("template")}</span>
            {templateInfo[current].name}
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground max-sm:hidden" aria-hidden />
        </Button>
      }
      items={[
        { type: "label", label: t("freeTemplates") },
        ...templates.map((template) => ({
          href: templateHome[template],
          active: template === current,
          icon: previews[template],
          label: (
            <>
              <span className="flex min-w-0 flex-1 flex-col py-0.5">
                <span className="font-medium">{templateInfo[template].name}</span>
                <span className="text-xs font-normal text-muted-foreground">{t(`templateDescriptions.${template}`)}</span>
              </span>
              {template === current && <Check className="text-foreground" aria-hidden />}
            </>
          ),
          className: "gap-3",
        })),
        // More templates on the Dashral website, while the app points to it.
        ...(dashral.show
          ? [{ type: "separator" as const }, { href: `${dashral.links.website}/templates`, external: true, label: t("allTemplates") }]
          : []),
      ]}
    />
  )
}
