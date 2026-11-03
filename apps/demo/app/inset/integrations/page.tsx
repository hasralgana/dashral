import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { IntegrationsView } from "@/components/inset/integrations-view"
import { PageHeader } from "@/components/page-header"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inset.integrations")
  return { title: `${t("title")} · Inset`, description: t("description") }
}

export default async function InsetIntegrationsPage() {
  const t = await getTranslations("inset.integrations")
  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <IntegrationsView />
    </>
  )
}
