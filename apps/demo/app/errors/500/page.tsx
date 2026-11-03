import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { RotateCcw, ServerCrash } from "lucide-react"
import { Button } from "@dashral/ui/components/button"

import { ErrorPage } from "@/components/error-page"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("errors"))("server.meta") }
}

// Demo route — app/error.tsx renders the same screen when a page throws.
export default async function ServerErrorPage() {
  const t = await getTranslations("errors")
  return (
    <ErrorPage
      code="500"
      icon={ServerCrash}
      title={t("server.title")}
      description={t("server.description")}
    >
      <Button asChild>
        <Link href="/errors/500">
          <RotateCcw /> {t("retry")}
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/">{t("back")}</Link>
      </Button>
    </ErrorPage>
  )
}
