import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { ReportsView } from "@/components/inset/reports-view"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inset.reports")
  return { title: `${t("title")} · Inset`, description: t("description") }
}

export default function InsetReportsPage() {
  return <ReportsView />
}
