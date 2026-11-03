import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { ArrowLeft, LifeBuoy, SearchX } from "lucide-react"
import { Button } from "@dashral/ui/components/button"

import { ErrorPage } from "@/components/error-page"
import { siteConfig } from "@/lib/site"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("errors"))("notFound.title") }
}

export default async function NotFound() {
  const t = await getTranslations("errors")
  return (
    <ErrorPage
      code="404"
      icon={SearchX}
      title={t("notFound.title")}
      description={t("notFound.description")}
    >
      <Button asChild>
        <Link href="/">
          <ArrowLeft className="rtl:-scale-x-100" /> {t("back")}
        </Link>
      </Button>
      {siteConfig.supportUrl && (
        <Button variant="outline" asChild>
          <a href={siteConfig.supportUrl} target="_blank" rel="noreferrer">
            <LifeBuoy /> {t("notFound.report")}
          </a>
        </Button>
      )}
    </ErrorPage>
  )
}
