import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Wrench } from "lucide-react"
import { Button } from "@dashral/ui/components/button"

import { ErrorPage } from "@/components/error-page"
import { siteConfig } from "@/lib/site"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("errors"))("maintenance.meta") }
}

export default async function MaintenancePage() {
  const t = await getTranslations("errors")
  return (
    <ErrorPage
      icon={Wrench}
      title={t("maintenance.title")}
      description={t("maintenance.description")}
    >
      {siteConfig.statusUrl && (
        <Button variant="outline" asChild>
          <a href={siteConfig.statusUrl} target="_blank" rel="noreferrer">
            {t("maintenance.follow")}
          </a>
        </Button>
      )}
    </ErrorPage>
  )
}
