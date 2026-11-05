import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { GettingStarted } from "@/components/onboarding/getting-started"
import { PageHeader } from "@/components/page-header"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("onboarding")
  return { title: t("title"), description: t("description") }
}

export default async function GettingStartedPage() {
  const t = await getTranslations("onboarding")
  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <GettingStarted />
    </>
  )
}
