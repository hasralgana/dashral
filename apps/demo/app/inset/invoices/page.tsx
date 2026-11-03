import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { InvoicesView } from "@/components/inset/invoices-view"
import { PageHeader } from "@/components/page-header"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inset.invoices")
  return { title: `${t("title")} · Inset`, description: t("description") }
}

export default async function InsetInvoicesPage() {
  const t = await getTranslations("inset.invoices")
  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <InvoicesView />
    </>
  )
}
