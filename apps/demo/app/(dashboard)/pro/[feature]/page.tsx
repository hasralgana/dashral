import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Check, Lock, Maximize2, Sparkles } from "lucide-react"
import { Button } from "@dashral/ui/components/button"
import { Card } from "@dashral/ui/components/card"
import { cn } from "@dashral/ui/lib/utils"

import { getProFeature, proFeatures } from "@/lib/pro-features"
import { dashral } from "@/lib/site"

type Props = { params: Promise<{ feature: string }> }

export function generateStaticParams() {
  return proFeatures.map((feature) => ({ feature }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const feature = getProFeature((await params).feature)
  const t = await getTranslations("pro")
  return { title: feature ? t("title", { feature: t(`features.${feature}.title`) }) : "Pro" }
}

export default async function ProFeaturePage({ params }: Props) {
  const feature = getProFeature((await params).feature)
  // An upgrade page, so only while the app points to Dashral (lib/site.ts → dashral.show).
  if (!feature || !dashral.show) notFound()
  const t = await getTranslations("pro")

  return (
    <div className="flex flex-col gap-6">
      <Card padding="none">
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary-text">
              <Lock className="size-4" />
            </div>
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-primary-text uppercase">
                <Sparkles className="size-3.5" /> {t("eyebrow")}
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight">{t(`features.${feature}.title`)}</h1>
              <p className="mt-1 text-muted-foreground">{t(`features.${feature}.description`)}</p>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                {(t.raw(`features.${feature}.highlights`) as string[]).map((h) => (
                  <li key={h} className="flex items-center gap-1.5">
                    <Check className="size-4 text-success-text" aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button asChild>
              <Link href={dashral.links.pro}>{t("get")}</Link>
            </Button>
            <Button variant="outline" asChild>
              <a href={dashral.links.github} target="_blank" rel="noreferrer">
                {t("star")}
              </a>
            </Button>
          </div>
        </div>
      </Card>

      {/* What the page looks like in Pro: a real screenshot in a browser frame, light or dark to match the theme. */}
      <figure className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex h-10 items-center gap-1.5 border-b border-divider px-4">
          <span aria-hidden className="size-2.5 rounded-full bg-muted-foreground/25" />
          <span aria-hidden className="size-2.5 rounded-full bg-muted-foreground/25" />
          <span aria-hidden className="size-2.5 rounded-full bg-muted-foreground/25" />
          <span className="mx-auto truncate rounded-md bg-muted px-3 py-0.5 text-xs text-muted-foreground">
            pro.dashral.com/{feature}
          </span>
          {(["light", "dark"] as const).map((theme) => (
            <a
              key={theme}
              href={`/screens/${feature}-${theme}.jpg`}
              target="_blank"
              rel="noreferrer"
              className={cn("text-muted-foreground hover:text-foreground", theme === "light" ? "dark:hidden" : "hidden dark:block")}
              title={t("fullSize")}
            >
              <Maximize2 className="size-4" />
              <span className="sr-only">{t("fullSize")}</span>
            </a>
          ))}
        </div>
        <div className="relative aspect-[16/10]">
          {(["light", "dark"] as const).map((theme) => (
            <Image
              key={theme}
              src={`/screens/${feature}-${theme}.jpg`}
              alt={t(`features.${feature}.preview`)}
              fill
              sizes="(min-width: 1024px) 75vw, 100vw"
              className={cn("object-cover object-top", theme === "light" ? "dark:hidden" : "hidden dark:block")}
              priority={theme === "light"}
            />
          ))}
        </div>
        <figcaption className="border-t border-divider px-4 py-2 text-xs text-muted-foreground">{t("preview")}</figcaption>
      </figure>
    </div>
  )
}
