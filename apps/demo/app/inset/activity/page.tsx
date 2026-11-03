import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { ActivityFeed } from "@/components/inset/activity-feed"
import { PageHeader } from "@/components/page-header"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inset.activity")
  return { title: `${t("title")} · Inset`, description: t("description") }
}

export default async function InsetActivityPage() {
  const t = await getTranslations("inset.activity")
  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <ActivityFeed />
    </>
  )
}
